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
import { assert } from './assert.js';
import { debug } from './Debug.js';
const debugProtocolSend = debug('puppeteer:protocol:SEND ►');
const debugProtocolReceive = debug('puppeteer:protocol:RECV ◀');

import { Protocol } from 'devtools-protocol';
import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping.js';
import { ConnectionTransport } from './ConnectionTransport.js';
import { EventEmitter } from './EventEmitter.js';

/**
 * @public
 */
export { ConnectionTransport, ProtocolMapping };

/**
 * @public
 */
export interface ConnectionCallback {
  resolve: Function;
  reject: Function;
  error: Error;
  method: string;
}

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
export class Connection extends EventEmitter {
  _url: string;
  _transport: ConnectionTransport;
  _delay: number;
  _lastId = 0;
  _sessions: Map<string, CDPSession> = new Map();
  _closed = false;

  _callbacks: Map<number, ConnectionCallback> = new Map();

  constructor(url: string, transport: ConnectionTransport, delay = 0) {
    super();
    this._url = url;
    this._delay = delay;

    this._transport = transport;
    this._transport.onmessage = this._onMessage.bind(this);
    this._transport.onclose = this._onClose.bind(this);
  }

  static fromSession(session: CDPSession): Connection {
    return session._connection;
  }

  /**
   * @param sessionId - The session id
   * @returns The current CDP session if it exists
   */
  session(sessionId: string): CDPSession | null {
    return this._sessions.get(sessionId) || null;
  }

  url(): string {
    return this._url;
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
    const id = this._rawSend({ method, params });
    return new Promise((resolve, reject) => {
      this._callbacks.set(id, { resolve, reject, error: new Error(), method });
    });
  }

  _rawSend(message: Record<string, unknown>): number {
    const id = ++this._lastId;
    const stringifiedMessage = JSON.stringify(
      Object.assign({}, message, { id })
    );
    debugProtocolSend(stringifiedMessage);
    this._transport.send(stringifiedMessage);
    return id;
  }

  async _onMessage(message: string): Promise<void> {
    if (this._delay) await new Promise((f) => setTimeout(f, this._delay));
    debugProtocolReceive(message);
    const object = JSON.parse(message);
    if (object.method === 'Target.attachedToTarget') {
      const sessionId = object.params.sessionId;
      const session = new CDPSession(
        this,
        object.params.targetInfo.type,
        sessionId
      );
      this._sessions.set(sessionId, session);
    } else if (object.method === 'Target.detachedFromTarget') {
      const session = this._sessions.get(object.params.sessionId);
      if (session) {
        session._onClosed();
        this._sessions.delete(object.params.sessionId);
      }
    }
    if (object.sessionId) {
      const session = this._sessions.get(object.sessionId);
      if (session) session._onMessage(object);
    } else if (object.id) {
      const callback = this._callbacks.get(object.id);
      // Callbacks could be all rejected if someone has called `.dispose()`.
      if (callback) {
        this._callbacks.delete(object.id);
        if (object.error)
          callback.reject(
            createProtocolError(callback.error, callback.method, object)
          );
        else callback.resolve(object.result);
      }
    } else {
      this.emit(object.method, object.params);
    }
  }

  _onClose(): void {
    if (this._closed) return;
    this._closed = true;
    this._transport.onmessage = null;
    this._transport.onclose = null;
    for (const callback of this._callbacks.values())
      callback.reject(
        rewriteError(
          callback.error,
          `Protocol error (${callback.method}): Target closed.`
        )
      );
    this._callbacks.clear();
    for (const session of this._sessions.values()) session._onClosed();
    this._sessions.clear();
    this.emit(ConnectionEmittedEvents.Disconnected);
  }

  dispose(): void {
    this._onClose();
    this._transport.close();
  }

  /**
   * @param targetInfo - The target info
   * @returns The CDP session that is created
   */
  async createSession(
    targetInfo: Protocol.Target.TargetInfo
  ): Promise<CDPSession> {
    const { sessionId } = await this.send('Target.attachToTarget', {
      targetId: targetInfo.targetId,
      flatten: true,
    });
    return this._sessions.get(sessionId);
  }
}

/**
 * @public
 */
export interface CDPSessionOnMessageObject {
  id?: number;
  method: string;
  params: Record<string, unknown>;
  error: { message: string; data: any };
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
 * and {@link https://github.com/aslushnikov/getting-started-with-cdp/blob/master/README.md | Getting Started with DevTools Protocol}.
 *
 * @example
 * ```js
 * const client = await page.target().createCDPSession();
 * await client.send('Animation.enable');
 * client.on('Animation.animationCreated', () => console.log('Animation created!'));
 * const response = await client.send('Animation.getPlaybackRate');
 * console.log('playback rate is ' + response.playbackRate);
 * await client.send('Animation.setPlaybackRate', {
 *   playbackRate: response.playbackRate / 2
 * });
 * ```
 *
 * @public
 */
export class CDPSession extends EventEmitter {
  /**
   * @internal
   */
  _connection: Connection;
  private _sessionId: string;
  private _targetType: string;
  private _callbacks: Map<number, ConnectionCallback> = new Map();

  /**
   * @internal
   */
  constructor(connection: Connection, targetType: string, sessionId: string) {
    super();
    this._connection = connection;
    this._targetType = targetType;
    this._sessionId = sessionId;
  }

  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']> {
    if (!this._connection)
      return Promise.reject(
        new Error(
          `Protocol error (${method}): Session closed. Most likely the ${this._targetType} has been closed.`
        )
      );

    // See the comment in Connection#send explaining why we do this.
    const params = paramArgs.length ? paramArgs[0] : undefined;

    const id = this._connection._rawSend({
      sessionId: this._sessionId,
      method,
      /* TODO(jacktfranklin@): once this Firefox bug is solved
       * we no longer need the `|| {}` check
       * https://bugzilla.mozilla.org/show_bug.cgi?id=1631570
       */
      params: params || {},
    });

    return new Promise((resolve, reject) => {
      this._callbacks.set(id, { resolve, reject, error: new Error(), method });
    });
  }

  /**
   * @internal
   */
  _onMessage(object: CDPSessionOnMessageObject): void {
    if (object.id && this._callbacks.has(object.id)) {
      const callback = this._callbacks.get(object.id);
      this._callbacks.delete(object.id);
      if (object.error)
        callback.reject(
          createProtocolError(callback.error, callback.method, object)
        );
      else callback.resolve(object.result);
    } else {
      assert(!object.id);
      this.emit(object.method, object.params);
    }
  }

  /**
   * Detaches the cdpSession from the target. Once detached, the cdpSession object
   * won't emit any events and can't be used to send messages.
   */
  async detach(): Promise<void> {
    if (!this._connection)
      throw new Error(
        `Session already detached. Most likely the ${this._targetType} has been closed.`
      );
    await this._connection.send('Target.detachFromTarget', {
      sessionId: this._sessionId,
    });
  }

  /**
   * @internal
   */
  _onClosed(): void {
    for (const callback of this._callbacks.values())
      callback.reject(
        rewriteError(
          callback.error,
          `Protocol error (${callback.method}): Target closed.`
        )
      );
    this._callbacks.clear();
    this._connection = null;
    this.emit(CDPSessionEmittedEvents.Disconnected);
  }
}

/**
 * @param {!Error} error
 * @param {string} method
 * @param {{error: {message: string, data: any}}} object
 * @returns {!Error}
 */
function createProtocolError(
  error: Error,
  method: string,
  object: { error: { message: string; data: any } }
): Error {
  let message = `Protocol error (${method}): ${object.error.message}`;
  if ('data' in object.error) message += ` ${object.error.data}`;
  return rewriteError(error, message);
}

/**
 * @param {!Error} error
 * @param {string} message
 * @returns {!Error}
 */
function rewriteError(error: Error, message: string): Error {
  error.message = message;
  return error;
}
