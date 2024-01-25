/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {CallbackRegistry} from '../common/CallbackRegistry.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {debug} from '../common/Debug.js';
import type {EventsWithWildcard} from '../common/EventEmitter.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';
import {assert} from '../util/assert.js';

import {cdpSessions, type BrowsingContext} from './BrowsingContext.js';
import type {
  BidiEvents,
  Commands as BidiCommands,
  Connection,
} from './core/Connection.js';

const debugProtocolSend = debug('puppeteer:webDriverBiDi:SEND ►');
const debugProtocolReceive = debug('puppeteer:webDriverBiDi:RECV ◀');

/**
 * @internal
 */
export interface Commands extends BidiCommands {
  'cdp.sendCommand': {
    params: Bidi.Cdp.SendCommandParameters;
    returnType: Bidi.Cdp.SendCommandResult;
  };
  'cdp.getSession': {
    params: Bidi.Cdp.GetSessionParameters;
    returnType: Bidi.Cdp.GetSessionResult;
  };
}

/**
 * @internal
 */
export class BidiConnection
  extends EventEmitter<BidiEvents>
  implements Connection
{
  #url: string;
  #transport: ConnectionTransport;
  #delay: number;
  #timeout? = 0;
  #closed = false;
  #callbacks = new CallbackRegistry();
  #browsingContexts = new Map<string, BrowsingContext>();
  #emitters: Array<EventEmitter<any>> = [];

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
    this.#transport.onclose = this.unbind.bind(this);
  }

  get closed(): boolean {
    return this.#closed;
  }

  get url(): string {
    return this.#url;
  }

  pipeTo<Events extends BidiEvents>(emitter: EventEmitter<Events>): void {
    this.#emitters.push(emitter);
  }

  override emit<Key extends keyof EventsWithWildcard<BidiEvents>>(
    type: Key,
    event: EventsWithWildcard<BidiEvents>[Key]
  ): boolean {
    for (const emitter of this.#emitters) {
      emitter.emit(type, event);
    }
    return super.emit(type, event);
  }

  send<T extends keyof Commands>(
    method: T,
    params: Commands[T]['params']
  ): Promise<{result: Commands[T]['returnType']}> {
    assert(!this.#closed, 'Protocol error: Connection closed.');

    return this.#callbacks.create(method, this.#timeout, id => {
      const stringifiedMessage = JSON.stringify({
        id,
        method,
        params,
      } as Bidi.Command);
      debugProtocolSend(stringifiedMessage);
      this.#transport.send(stringifiedMessage);
    }) as Promise<{result: Commands[T]['returnType']}>;
  }

  /**
   * @internal
   */
  protected async onMessage(message: string): Promise<void> {
    if (this.#delay) {
      await new Promise(f => {
        return setTimeout(f, this.#delay);
      });
    }
    debugProtocolReceive(message);
    const object: Bidi.ChromiumBidi.Message = JSON.parse(message);
    if ('type' in object) {
      switch (object.type) {
        case 'success':
          this.#callbacks.resolve(object.id, object);
          return;
        case 'error':
          if (object.id === null) {
            break;
          }
          this.#callbacks.reject(
            object.id,
            createProtocolError(object),
            object.message
          );
          return;
        case 'event':
          if (isCdpEvent(object)) {
            cdpSessions
              .get(object.params.session)
              ?.emit(object.params.event, object.params.params);
            return;
          }
          this.#maybeEmitOnContext(object);
          // SAFETY: We know the method and parameter still match here.
          this.emit(
            object.method,
            object.params as BidiEvents[keyof BidiEvents]
          );
          return;
      }
    }
    // Even if the response in not in BiDi protocol format but `id` is provided, reject
    // the callback. This can happen if the endpoint supports CDP instead of BiDi.
    if ('id' in object) {
      this.#callbacks.reject(
        (object as {id: number}).id,
        `Protocol Error. Message is not in BiDi protocol format: '${message}'`,
        object.message
      );
    }
    debugError(object);
  }

  #maybeEmitOnContext(event: Bidi.ChromiumBidi.Event) {
    let context: BrowsingContext | undefined;
    // Context specific events
    if ('context' in event.params && event.params.context !== null) {
      context = this.#browsingContexts.get(event.params.context);
      // `log.entryAdded` specific context
    } else if (
      'source' in event.params &&
      event.params.source.context !== undefined
    ) {
      context = this.#browsingContexts.get(event.params.source.context);
    }
    context?.emit(event.method, event.params);
  }

  registerBrowsingContexts(context: BrowsingContext): void {
    this.#browsingContexts.set(context.id, context);
  }

  getBrowsingContext(contextId: string): BrowsingContext {
    const currentContext = this.#browsingContexts.get(contextId);
    if (!currentContext) {
      throw new Error(`BrowsingContext ${contextId} does not exist.`);
    }
    return currentContext;
  }

  getTopLevelContext(contextId: string): BrowsingContext {
    let currentContext = this.#browsingContexts.get(contextId);
    if (!currentContext) {
      throw new Error(`BrowsingContext ${contextId} does not exist.`);
    }
    while (currentContext.parent) {
      contextId = currentContext.parent;
      currentContext = this.#browsingContexts.get(contextId);
      if (!currentContext) {
        throw new Error(`BrowsingContext ${contextId} does not exist.`);
      }
    }
    return currentContext;
  }

  unregisterBrowsingContexts(id: string): void {
    this.#browsingContexts.delete(id);
  }

  /**
   * Unbinds the connection, but keeps the transport open. Useful when the transport will
   * be reused by other connection e.g. with different protocol.
   * @internal
   */
  unbind(): void {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    // Both may still be invoked and produce errors
    this.#transport.onmessage = () => {};
    this.#transport.onclose = () => {};

    this.#browsingContexts.clear();
    this.#callbacks.clear();
  }

  /**
   * Unbinds the connection and closes the transport.
   */
  dispose(): void {
    this.unbind();
    this.#transport.close();
  }

  getPendingProtocolErrors(): Error[] {
    return this.#callbacks.getPendingProtocolErrors();
  }
}

/**
 * @internal
 */
function createProtocolError(object: Bidi.ErrorResponse): string {
  let message = `${object.error} ${object.message}`;
  if (object.stacktrace) {
    message += ` ${object.stacktrace}`;
  }
  return message;
}

function isCdpEvent(event: Bidi.ChromiumBidi.Event): event is Bidi.Cdp.Event {
  return event.method.startsWith('cdp.');
}
