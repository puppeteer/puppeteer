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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {ConnectionCallback} from '../Connection.js';
import {ConnectionTransport} from '../ConnectionTransport.js';
import {debug} from '../Debug.js';
import {ProtocolError} from '../Errors.js';
import {EventEmitter} from '../EventEmitter.js';

import {Context} from './Context.js';

const debugProtocolSend = debug('puppeteer:webDriverBiDi:SEND ►');
const debugProtocolReceive = debug('puppeteer:webDriverBiDi:RECV ◀');

/**
 * @internal
 */
interface Commands {
  'script.evaluate': {
    params: Bidi.Script.EvaluateParameters;
    returnType: Bidi.Script.EvaluateResult;
  };
  'script.callFunction': {
    params: Bidi.Script.CallFunctionParameters;
    returnType: Bidi.Script.CallFunctionResult;
  };
  'script.disown': {
    params: Bidi.Script.DisownParameters;
    returnType: Bidi.Script.DisownResult;
  };

  'browsingContext.create': {
    params: Bidi.BrowsingContext.CreateParameters;
    returnType: Bidi.BrowsingContext.CreateResult;
  };
  'browsingContext.close': {
    params: Bidi.BrowsingContext.CloseParameters;
    returnType: Bidi.BrowsingContext.CloseResult;
  };

  'session.new': {
    params: {capabilities?: Record<any, unknown>}; // TODO: Update Types in chromium bidi
    returnType: {sessionId: string};
  };
  'session.status': {
    params: object;
    returnType: Bidi.Session.StatusResult;
  };
  'session.subscribe': {
    params: Bidi.Session.SubscribeParameters;
    returnType: Bidi.Session.SubscribeResult;
  };
  'session.unsubscribe': {
    params: Bidi.Session.SubscribeParameters;
    returnType: Bidi.Session.UnsubscribeResult;
  };
}

/**
 * @internal
 */
export class Connection extends EventEmitter {
  #transport: ConnectionTransport;
  #delay: number;
  #lastId = 0;
  #closed = false;
  #callbacks: Map<number, ConnectionCallback> = new Map();
  #contexts: Map<string, Context> = new Map();

  constructor(transport: ConnectionTransport, delay = 0) {
    super();
    this.#delay = delay;

    this.#transport = transport;
    this.#transport.onmessage = this.onMessage.bind(this);
    this.#transport.onclose = this.#onClose.bind(this);
  }

  get closed(): boolean {
    return this.#closed;
  }

  context(contextId: string): Context | null {
    return this.#contexts.get(contextId) || null;
  }

  send<T extends keyof Commands>(
    method: T,
    params: Commands[T]['params']
  ): Promise<Commands[T]['returnType']> {
    const id = ++this.#lastId;
    const stringifiedMessage = JSON.stringify({
      id,
      method,
      params,
    } as Bidi.Message.CommandRequest);
    debugProtocolSend(stringifiedMessage);
    this.#transport.send(stringifiedMessage);
    return new Promise((resolve, reject) => {
      this.#callbacks.set(id, {
        resolve,
        reject,
        error: new ProtocolError(),
        method,
      });
    });
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
    const object = JSON.parse(message) as
      | Bidi.Message.CommandResponse
      | Bidi.Message.EventMessage;

    if ('id' in object) {
      const callback = this.#callbacks.get(object.id);
      // Callbacks could be all rejected if someone has called `.dispose()`.
      if (callback) {
        this.#callbacks.delete(object.id);
        if ('error' in object) {
          callback.reject(
            createProtocolError(callback.error, callback.method, object)
          );
        } else {
          if (callback.method === 'browsingContext.create') {
            this.#contexts.set(
              object.result.context,
              new Context(this, object.result.context)
            );
          }
          callback.resolve(object);
        }
      }
    } else {
      if ('source' in object.params && !!object.params.source.context) {
        const context = this.#contexts.get(object.params.source.context);
        context?.emit(object.method, object.params);
      }

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
    for (const callback of this.#callbacks.values()) {
      callback.reject(
        rewriteError(
          callback.error,
          `Protocol error (${callback.method}): Connection closed.`
        )
      );
    }
    this.#callbacks.clear();
  }

  dispose(): void {
    this.#onClose();
    this.#transport.close();
  }
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
function createProtocolError(
  error: ProtocolError,
  method: string,
  object: Bidi.Message.ErrorResult
): Error {
  let message = `Protocol error (${method}): ${object.error} ${object.message}`;
  if (object.stacktrace) {
    message += ` ${object.stacktrace}`;
  }
  return rewriteError(error, message, object.message);
}
