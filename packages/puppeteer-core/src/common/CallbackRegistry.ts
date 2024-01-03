/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {Deferred} from '../util/Deferred.js';
import {rewriteError} from '../util/ErrorLike.js';

import {ProtocolError, TargetCloseError} from './Errors.js';
import {debugError} from './util.js';

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
    let error: ProtocolError;
    let message: string;
    if (errorMessage instanceof ProtocolError) {
      error = errorMessage;
      error.cause = callback.error;
      message = errorMessage.message;
    } else {
      error = callback.error;
      message = errorMessage;
    }

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
 * @internal
 */
export function createIncrementalIdGenerator(): GetIdFn {
  let id = 0;
  return (): number => {
    return ++id;
  };
}

/**
 * @internal
 */
export type GetIdFn = () => number;
