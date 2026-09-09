/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

import {Deferred} from './Deferred.js';

describe('DeferredPromise', function () {
  it('should catch errors', async () => {
    // Async function before try/catch.
    async function task() {
      await new Promise(resolve => {
        return setTimeout(resolve, 50);
      });
    }
    // Async function that fails.
    function fails(): Deferred<void> {
      const deferred = Deferred.create<void>();
      setTimeout(() => {
        deferred.reject(new Error('test'));
      }, 25);
      return deferred;
    }

    const expectedToFail = fails();
    await task();
    let caught = false;
    try {
      await expectedToFail.valueOrThrow();
    } catch (err) {
      expect((err as Error).message).toEqual('test');
      caught = true;
    }
    expect(caught).toBeTruthy();
  });

  it('Deferred.race should cancel timeout', async function () {
    const clock = sinon.useFakeTimers();

    try {
      const deferred = Deferred.create<void>();
      const deferredTimeout = Deferred.create<void>({
        message: 'Race did not stop timer',
        timeout: 100,
      });

      clock.tick(50);

      await Promise.all([
        Deferred.race([deferred, deferredTimeout]),
        deferred.resolve(),
      ]);

      clock.tick(150);

      expect(deferredTimeout.value()).toBeInstanceOf(Error);
      expect(deferredTimeout.value()?.message).toContain('Timeout cleared');
    } finally {
      clock.restore();
    }
  });
});
