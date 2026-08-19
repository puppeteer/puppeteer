/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {assert} from '../util/assert.js';
import {DisposableStack} from '../util/disposable.js';

/**
 * @internal
 */
export class PipeTransport implements ConnectionTransport {
  #pipeWrite: NodeJS.WritableStream;
  #subscriptions = new DisposableStack();
  #logger: Logger;

  #isClosed = false;
  #pendingMessage: Buffer[] = [];

  onclose?: () => void;
  onmessage?: (value: string) => void;

  constructor(
    pipeWrite: NodeJS.WritableStream,
    pipeRead: NodeJS.ReadableStream,
    logger: Logger,
  ) {
    this.#pipeWrite = pipeWrite;
    this.#logger = logger;
    const pipeReadEmitter = this.#subscriptions.use(
      // NodeJS event emitters don't support `*` so we need to typecast
      // As long as we don't use it we should be OK.
      new EventEmitter(
        pipeRead as unknown as EventEmitter<Record<string, any>>,
        logger,
      ),
    );
    pipeReadEmitter.on('data', buffer => {
      return this.#dispatch(buffer);
    });
    pipeReadEmitter.on('close', () => {
      if (this.onclose) {
        this.onclose.call(null);
      }
    });
    pipeReadEmitter.on('error', err => {
      this.#logger?.(DEBUG_PREFIXES.error)?.(err);
    });
    const pipeWriteEmitter = this.#subscriptions.use(
      // NodeJS event emitters don't support `*` so we need to typecast
      // As long as we don't use it we should be OK.
      new EventEmitter(
        pipeWrite as unknown as EventEmitter<Record<string, any>>,
      ),
    );
    pipeWriteEmitter.on('error', err => {
      this.#logger?.(DEBUG_PREFIXES.error)?.(err);
    });
  }

  send(message: string): void {
    assert(!this.#isClosed, '`PipeTransport` is closed.');

    this.#pipeWrite.write(message);
    this.#pipeWrite.write('\0');
  }

  #dispatch(buffer: Buffer<ArrayBuffer>): void {
    assert(!this.#isClosed, '`PipeTransport` is closed.');

    this.#pendingMessage.push(buffer);
    if (buffer.indexOf('\0') === -1) {
      return;
    }
    const concatBuffer = Buffer.concat(this.#pendingMessage);

    let start = 0;
    let end = concatBuffer.indexOf('\0');
    while (end !== -1) {
      const message = concatBuffer.toString(undefined, start, end);
      setImmediate(() => {
        if (this.onmessage) {
          this.onmessage.call(null, message);
        }
      });
      start = end + 1;
      end = concatBuffer.indexOf('\0', start);
    }
    if (start >= concatBuffer.length) {
      this.#pendingMessage = [];
    } else {
      this.#pendingMessage = [concatBuffer.subarray(start)];
    }
  }

  close(): void {
    this.#isClosed = true;
    this.#subscriptions.dispose();
  }
}
