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

import {debug} from '../Debug.js';
const debugProtocolSend = debug('puppeteer:webDriverBiDi:SEND ►');
const debugProtocolReceive = debug('puppeteer:webDriverBiDi:RECV ◀');

import {ConnectionTransport} from '../ConnectionTransport.js';
import {EventEmitter} from '../EventEmitter.js';
import {ProtocolError} from '../Errors.js';
import {ConnectionCallback} from '../Connection.js';

interface Command {
  id: number;
  method: string;
  params: object;
}

interface SuccessCommandResponse {
  id: number;
  result: {
    type: 'success';
    result: object;
    sessionId?: any;
    context?: any;
  };
}

interface ErrorCommandResponse {
  id: number;
  result: {
    type: 'exception';
    exceptionDetails: {
      text: string;
    };
  };
}

interface ErrorResponse {
  id: number;
  error: string;
  message: string;
  stacktrace?: string;
}

interface Event {
  method: string;
  params: object;
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

  send(
    method: string,
    params: object
  ): Promise<SuccessCommandResponse['result']> {
    const id = ++this.#lastId;
    const stringifiedMessage = JSON.stringify({
      id,
      method,
      params,
    } as Command);
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
      | Event
      | ErrorResponse
      | SuccessCommandResponse
      | ErrorCommandResponse;
    if ('id' in object) {
      const callback = this.#callbacks.get(object.id);
      // Callbacks could be all rejected if someone has called `.dispose()`.
      if (callback) {
        this.#callbacks.delete(object.id);
        if ('error' in object) {
          callback.reject(
            createProtocolError(callback.error, callback.method, object)
          );
        } else if (
          'result' in object &&
          'type' in object.result &&
          object.result.type === 'exception'
        ) {
          callback.reject(
            createCommandProtocolError(
              callback.error,
              callback.method,
              object as unknown as ErrorCommandResponse
            )
          );
        } else {
          callback.resolve(object.result);
        }
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

function createProtocolError(
  error: ProtocolError,
  method: string,
  object: ErrorResponse
): Error {
  let message = `Protocol error (${method}): ${object.error} ${object.message}`;
  if (object.stacktrace) {
    message += ` ${object.stacktrace}`;
  }
  return rewriteError(error, message, object.message);
}

function createCommandProtocolError(
  error: ProtocolError,
  method: string,
  object: ErrorCommandResponse
): Error {
  const message = `Protocol error (${method}): ${object.result.exceptionDetails.text}`;
  return rewriteError(error, message, object.result.exceptionDetails.text);
}
