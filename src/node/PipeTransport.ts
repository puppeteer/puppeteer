/**
 * Copyright 2018 Google Inc. All rights reserved.
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
import {assert} from '../common/assert.js';
import {ConnectionTransport} from '../common/ConnectionTransport.js';
import {
  addEventListener,
  debugError,
  PuppeteerEventListener,
  removeEventListeners,
} from '../common/util.js';

/**
 * @internal
 */
export class PipeTransport implements ConnectionTransport {
  #pipeWrite: NodeJS.WritableStream;
  #eventListeners: PuppeteerEventListener[];

  #isClosed = false;
  #pendingMessage = '';

  onclose?: () => void;
  onmessage?: (value: string) => void;

  constructor(
    pipeWrite: NodeJS.WritableStream,
    pipeRead: NodeJS.ReadableStream
  ) {
    this.#pipeWrite = pipeWrite;
    this.#eventListeners = [
      addEventListener(pipeRead, 'data', buffer => {
        return this.#dispatch(buffer);
      }),
      addEventListener(pipeRead, 'close', () => {
        if (this.onclose) {
          this.onclose.call(null);
        }
      }),
      addEventListener(pipeRead, 'error', debugError),
      addEventListener(pipeWrite, 'error', debugError),
    ];
  }

  send(message: string): void {
    assert(!this.#isClosed, '`PipeTransport` is closed.');

    this.#pipeWrite.write(message);
    this.#pipeWrite.write('\0');
  }

  #dispatch(buffer: Buffer): void {
    assert(!this.#isClosed, '`PipeTransport` is closed.');

    let end = buffer.indexOf('\0');
    if (end === -1) {
      this.#pendingMessage += buffer.toString();
      return;
    }
    const message = this.#pendingMessage + buffer.toString(undefined, 0, end);
    if (this.onmessage) {
      this.onmessage.call(null, message);
    }

    let start = end + 1;
    end = buffer.indexOf('\0', start);
    while (end !== -1) {
      if (this.onmessage) {
        this.onmessage.call(null, buffer.toString(undefined, start, end));
      }
      start = end + 1;
      end = buffer.indexOf('\0', start);
    }
    this.#pendingMessage = buffer.toString(undefined, start);
  }

  close(): void {
    this.#isClosed = true;
    removeEventListeners(this.#eventListeners);
  }
}
