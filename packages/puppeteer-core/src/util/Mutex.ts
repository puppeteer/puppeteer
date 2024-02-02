/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {Deferred} from './Deferred.js';
import {disposeSymbol} from './disposable.js';

/**
 * @internal
 */
export class Mutex {
  static Guard = class Guard {
    #mutex: Mutex;
    constructor(mutex: Mutex) {
      this.#mutex = mutex;
    }
    [disposeSymbol](): void {
      return this.#mutex.release();
    }
  };

  #locked = false;
  #acquirers: Array<() => void> = [];

  // This is FIFO.
  async acquire(): Promise<InstanceType<typeof Mutex.Guard>> {
    if (!this.#locked) {
      this.#locked = true;
      return new Mutex.Guard(this);
    }
    const deferred = Deferred.create<void>();
    this.#acquirers.push(deferred.resolve.bind(deferred));
    await deferred.valueOrThrow();
    return new Mutex.Guard(this);
  }

  release(): void {
    const resolve = this.#acquirers.shift();
    if (!resolve) {
      this.#locked = false;
      return;
    }
    resolve();
  }
}
