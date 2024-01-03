/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {EventSubscription} from '../common/EventEmitter.js';
import {debugError} from '../common/util.js';
import {assert} from '../util/assert.js';
import {DisposableStack} from '../util/disposable.js';

/**
 * @internal
 */
export class PipeTransport implements ConnectionTransport {
  #pipeWrite: NodeJS.WritableStream;
  #subscriptions = new DisposableStack();

  #isClosed = false;
  #pendingMessage = '';

  onclose?: () => void;
  onmessage?: (value: string) => void;

  constructor(
    pipeWrite: NodeJS.WritableStream,
    pipeRead: NodeJS.ReadableStream
  ) {
    this.#pipeWrite = pipeWrite;
    this.#subscriptions.use(
      new EventSubscription(pipeRead, 'data', (buffer: Buffer) => {
        return this.#dispatch(buffer);
      })
    );
    this.#subscriptions.use(
      new EventSubscription(pipeRead, 'close', () => {
        if (this.onclose) {
          this.onclose.call(null);
        }
      })
    );
    this.#subscriptions.use(
      new EventSubscription(pipeRead, 'error', debugError)
    );
    this.#subscriptions.use(
      new EventSubscription(pipeWrite, 'error', debugError)
    );
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
    this.#subscriptions.dispose();
  }
}
