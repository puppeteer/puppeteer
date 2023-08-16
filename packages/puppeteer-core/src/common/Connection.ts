/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Protocol} from 'devtools-protocol';
import {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';

import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';

import {ConnectionTransport} from './ConnectionTransport.js';
import {debug} from './Debug.js';
import {TargetCloseError, ProtocolError} from './Errors.js';
import {EventEmitter} from './EventEmitter.js';
import {debugError} from './util.js';

const debugProtocolSend = debug('puppeteer:protocol:SEND ►');
const debugProtocolReceive = debug('puppeteer:protocol:RECV ◀');

/**
 * @public
 */
export {ConnectionTransport, ProtocolMapping};

/**
 * Internal events that the Connection class emits.
 *
 * @internal
 */
export const ConnectionEmittedEvents = {
  Disconnected: Symbol('Connection.Disconnected'),
} as const;

/**
 * @internal
 */
type GetIdFn = () => number;

/**
 * @internal
 */
function createIncrementalIdGenerator(): GetIdFn {
  let id = 0;
  return (): number => {
    return ++id;
  };
}

/**
 * @internal
 */
export class Callback {
  #id: number;
  #error = new ProtocolError();
  #deferred = Deferred.create<unknown>();
  #timer?: ReturnType<typeof setTimeout>;
  #label: string;

  constructor(id: number, label: string, timeout?: number) {
    this.#id = id;
    this.#label = label;
    if (timeout) {
      this.#timer = setTimeout(() => {
        this.#deferred.reject(
          rewriteError(
            this.#error,
            `${label} timed out. Increase the 'protocolTimeout' setting in launch/connect calls for a higher timeout if needed.`
          )
        );
      }, timeout);
    }
  }

  resolve(value: unknown): void {
    clearTimeout(this.#timer);
    this.#deferred.resolve(value);
  }

  reject(error: Error): void {
    clearTimeout(this.#timer);
    this.#deferred.reject(error);
  }

  get id(): number {
    return this.#id;
  }

  get promise(): Deferred<unknown> {
    return this.#deferred;
  }

  get error(): ProtocolError {
    return this.#error;
  }

  get label(): string {
    return this.#label;
  }
}

/**
 * Manages callbacks and their IDs for the protocol request/response communication.
 *
 * @internal
 */
export class CallbackRegistry {
  #callbacks = new Map<number, Callback>();
  #idGenerator = createIncrementalIdGenerator();

  create(
    label: string,
    timeout: number | undefined,
    request: (id: number) => void
  ): Promise<unknown> {
    const callback = new Callback(this.#idGenerator(), label, timeout);
    this.#callbacks.set(callback.id, callback);
    try {
      request(callback.id);
    } catch (error) {
      // We still throw sync errors synchronously and clean up the scheduled
      // callback.
      callback.promise
        .valueOrThrow()
        .catch(debugError)
        .finally(() => {
          this.#callbacks.delete(callback.id);
        });
      callback.reject(error as Error);
      throw error;
    }
    // Must only have sync code up until here.
    return callback.promise.valueOrThrow().finally(() => {
      this.#callbacks.delete(callback.id);
    });
  }

  reject(id: number, message: string, originalMessage?: string): void {
    const callback = this.#callbacks.get(id);
    if (!callback) {
      return;
    }
    this._reject(callback, message, originalMessage);
  }

  _reject(
    callback: Callback,
    errorMessage: string | ProtocolError,
    originalMessage?: string
  ): void {
    const isError = errorMessage instanceof ProtocolError;
    const message = isError ? errorMessage.message : errorMessage;
    const error = isError ? errorMessage : callback.error;

    callback.reject(
      rewriteError(
        error,
        `Protocol error (${callback.label}): ${message}`,
        originalMessage
      )
    );
  }

  resolve(id: number, value: unknown): void {
    const callback = this.#callbacks.get(id);
    if (!callback) {
      return;
    }
    callback.resolve(value);
  }

  clear(): void {
    for (const callback of this.#callbacks.values()) {
      // TODO: probably we can accept error messages as params.
      this._reject(callback, new TargetCloseError('Target closed'));
    }
    this.#callbacks.clear();
  }
}

/**
 * @public
 */
export class Connection extends EventEmitter {
  #url: string;
  #transport: ConnectionTransport;
  #delay: number;
  #timeout: number;
  #sessions = new Map<string, CDPSessionImpl>();
  #closed = false;
  #manuallyAttached = new Set<string>();
  #callbacks = new CallbackRegistry();

  constructor(
    url: string,
    transport: ConnectionTransport,
    delay = 0,
    timeout?: number
  ) {
    super();
    this.#url = url;
    this.#delay = delay;
    this.#timeout = timeout ?? 180_000;

    this.#transport = transport;
    this.#transport.onmessage = this.onMessage.bind(this);
    this.#transport.onclose = this.#onClose.bind(this);
  }

  static fromSession(session: CDPSession): Connection | undefined {
    return session.connection();
  }

  get timeout(): number {
    return this.#timeout;
  }

  /**
   * @internal
   */
  get _closed(): boolean {
    return this.#closed;
  }

  /**
   * @internal
   */
  get _sessions(): Map<string, CDPSession> {
    return this.#sessions;
  }

  /**
   * @param sessionId - The session id
   * @returns The current CDP session if it exists
   */
  session(sessionId: string): CDPSession | null {
    return this.#sessions.get(sessionId) || null;
  }

  url(): string {
    return this.#url;
  }

  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    // There is only ever 1 param arg passed, but the Protocol defines it as an
    // array of 0 or 1 items See this comment:
    // https://github.com/ChromeDevTools/devtools-protocol/pull/113#issuecomment-412603285
    // which explains why the protocol defines the params this way for better
    // type-inference.
    // So now we check if there are any params or not and deal with them accordingly.
    const params = paramArgs.length ? paramArgs[0] : undefined;
    return this._rawSend(this.#callbacks, method, params);
  }

  /**
   * @internal
   */
  _rawSend<T extends keyof ProtocolMapping.Commands>(
    callbacks: CallbackRegistry,
    method: T,
    params: ProtocolMapping.Commands[T]['paramsType'][0],
    sessionId?: string
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    return callbacks.create(method, this.#timeout, id => {
      const stringifiedMessage = JSON.stringify({
        method,
        params,
        id,
        sessionId,
      });
      debugProtocolSend(stringifiedMessage);
      this.#transport.send(stringifiedMessage);
    }) as Promise<ProtocolMapping.Commands[T]['returnType']>;
  }

  /**
   * @internal
   */
  async closeBrowser(): Promise<void> {
    await this.send('Browser.close');
  }

  /**
   * @internal
   */
  protected async onMessage(message: string): Promise<void> {
    if (this.#delay) {
      await new Promise(r => {
        return setTimeout(r, this.#delay);
      });
    }
    debugProtocolReceive(message);
    const object = JSON.parse(message);
    if (object.method === 'Target.attachedToTarget') {
      const sessionId = object.params.sessionId;
      const session = new CDPSessionImpl(
        this,
        object.params.targetInfo.type,
        sessionId,
        object.sessionId
      );
      this.#sessions.set(sessionId, session);
      this.emit('sessionattached', session);
      const parentSession = this.#sessions.get(object.sessionId);
      if (parentSession) {
        parentSession.emit('sessionattached', session);
      }
    } else if (object.method === 'Target.detachedFromTarget') {
      const session = this.#sessions.get(object.params.sessionId);
      if (session) {
        session._onClosed();
        this.#sessions.delete(object.params.sessionId);
        this.emit('sessiondetached', session);
        const parentSession = this.#sessions.get(object.sessionId);
        if (parentSession) {
          parentSession.emit('sessiondetached', session);
        }
      }
    }
    if (object.sessionId) {
      const session = this.#sessions.get(object.sessionId);
      if (session) {
        session._onMessage(object);
      }
    } else if (object.id) {
      if (object.error) {
        this.#callbacks.reject(
          object.id,
          createProtocolErrorMessage(object),
          object.error.message
        );
      } else {
        this.#callbacks.resolve(object.id, object.result);
      }
    } else {
      this.emit(object.method, object.params);
    }
  }

  #onClose(): void {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    this.#transport.onmessage = undefined;
    this.#transport.onclose = undefined;
    this.#callbacks.clear();
    for (const session of this.#sessions.values()) {
      session._onClosed();
    }
    this.#sessions.clear();
    this.emit(ConnectionEmittedEvents.Disconnected);
  }

  dispose(): void {
    this.#onClose();
    this.#transport.close();
  }

  /**
   * @internal
   */
  isAutoAttached(targetId: string): boolean {
    return !this.#manuallyAttached.has(targetId);
  }

  /**
   * @internal
   */
  async _createSession(
    targetInfo: Protocol.Target.TargetInfo,
    isAutoAttachEmulated = true
  ): Promise<CDPSession> {
    if (!isAutoAttachEmulated) {
      this.#manuallyAttached.add(targetInfo.targetId);
    }
    const {sessionId} = await this.send('Target.attachToTarget', {
      targetId: targetInfo.targetId,
      flatten: true,
    });
    this.#manuallyAttached.delete(targetInfo.targetId);
    const session = this.#sessions.get(sessionId);
    if (!session) {
      throw new Error('CDPSession creation failed.');
    }
    return session;
  }

  /**
   * @param targetInfo - The target info
   * @returns The CDP session that is created
   */
  async createSession(
    targetInfo: Protocol.Target.TargetInfo
  ): Promise<CDPSession> {
    return await this._createSession(targetInfo, false);
  }
}

/**
 * @internal
 */
export interface CDPSessionOnMessageObject {
  id?: number;
  method: string;
  params: Record<string, unknown>;
  error: {message: string; data: any; code: number};
  result?: any;
}

/**
 * Internal events that the CDPSession class emits.
 *
 * @internal
 */
export const CDPSessionEmittedEvents = {
  Disconnected: Symbol('CDPSession.Disconnected'),
} as const;

/**
 * The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * @remarks
 *
 * Protocol methods can be called with {@link CDPSession.send} method and protocol
 * events can be subscribed to with `CDPSession.on` method.
 *
 * Useful links: {@link https://chromedevtools.github.io/devtools-protocol/ | DevTools Protocol Viewer}
 * and {@link https://github.com/aslushnikov/getting-started-with-cdp/blob/HEAD/README.md | Getting Started with DevTools Protocol}.
 *
 * @example
 *
 * ```ts
 * const client = await page.target().createCDPSession();
 * await client.send('Animation.enable');
 * client.on('Animation.animationCreated', () =>
 *   console.log('Animation created!')
 * );
 * const response = await client.send('Animation.getPlaybackRate');
 * console.log('playback rate is ' + response.playbackRate);
 * await client.send('Animation.setPlaybackRate', {
 *   playbackRate: response.playbackRate / 2,
 * });
 * ```
 *
 * @public
 */
export class CDPSession extends EventEmitter {
  /**
   * @internal
   */
  constructor() {
    super();
  }

  connection(): Connection | undefined {
    throw new Error('Not implemented');
  }

  /**
   * Parent session in terms of CDP's auto-attach mechanism.
   *
   * @internal
   */
  parentSession(): CDPSession | undefined {
    return undefined;
  }

  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;
  send<T extends keyof ProtocolMapping.Commands>(): Promise<
    ProtocolMapping.Commands[T]['returnType']
  > {
    throw new Error('Not implemented');
  }

  /**
   * Detaches the cdpSession from the target. Once detached, the cdpSession object
   * won't emit any events and can't be used to send messages.
   */
  async detach(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Returns the session's id.
   */
  id(): string {
    throw new Error('Not implemented');
  }
}

/**
 * @internal
 */
export class CDPSessionImpl extends CDPSession {
  #sessionId: string;
  #targetType: string;
  #callbacks = new CallbackRegistry();
  #connection?: Connection;
  #parentSessionId?: string;

  /**
   * @internal
   */
  constructor(
    connection: Connection,
    targetType: string,
    sessionId: string,
    parentSessionId: string | undefined
  ) {
    super();
    this.#connection = connection;
    this.#targetType = targetType;
    this.#sessionId = sessionId;
    this.#parentSessionId = parentSessionId;
  }

  override connection(): Connection | undefined {
    return this.#connection;
  }

  override parentSession(): CDPSession | undefined {
    if (!this.#parentSessionId) {
      return;
    }
    const parent = this.#connection?.session(this.#parentSessionId);
    return parent ?? undefined;
  }

  override send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (!this.#connection) {
      return Promise.reject(
        new TargetCloseError(
          `Protocol error (${method}): Session closed. Most likely the ${
            this.#targetType
          } has been closed.`
        )
      );
    }
    // See the comment in Connection#send explaining why we do this.
    const params = paramArgs.length ? paramArgs[0] : undefined;
    return this.#connection._rawSend(
      this.#callbacks,
      method,
      params,
      this.#sessionId
    );
  }

  /**
   * @internal
   */
  _onMessage(object: CDPSessionOnMessageObject): void {
    if (object.id) {
      if (object.error) {
        this.#callbacks.reject(
          object.id,
          createProtocolErrorMessage(object),
          object.error.message
        );
      } else {
        this.#callbacks.resolve(object.id, object.result);
      }
    } else {
      assert(!object.id);
      this.emit(object.method, object.params);
    }
  }

  /**
   * Detaches the cdpSession from the target. Once detached, the cdpSession object
   * won't emit any events and can't be used to send messages.
   */
  override async detach(): Promise<void> {
    if (!this.#connection) {
      throw new Error(
        `Session already detached. Most likely the ${
          this.#targetType
        } has been closed.`
      );
    }
    await this.#connection.send('Target.detachFromTarget', {
      sessionId: this.#sessionId,
    });
  }

  /**
   * @internal
   */
  _onClosed(): void {
    this.#callbacks.clear();
    this.#connection = undefined;
    this.emit(CDPSessionEmittedEvents.Disconnected);
  }

  /**
   * Returns the session's id.
   */
  override id(): string {
    return this.#sessionId;
  }
}

function createProtocolErrorMessage(object: {
  error: {message: string; data: any; code: number};
}): string {
  let message = `${object.error.message}`;
  // TODO: remove the type checks when we stop connecting to BiDi with a CDP
  // client.
  if (
    object.error &&
    typeof object.error === 'object' &&
    'data' in object.error
  ) {
    message += ` ${object.error.data}`;
  }
  return message;
}

function rewriteError(
  error: ProtocolError,
  message: string,
  originalMessage?: string
): Error {
  error.message = message;
  error.originalMessage = originalMessage ?? error.originalMessage;
  return error;
}

/**
 * @internal
 */
export function isTargetClosedError(error: Error): boolean {
  return error instanceof TargetCloseError;
}
