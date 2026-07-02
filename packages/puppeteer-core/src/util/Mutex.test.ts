/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

import {disposeSymbol} from './disposable.js';
import {Mutex} from './Mutex.js';

describe('Mutex', () => {
  it('should lock and release', async () => {
    const mutex = new Mutex();
    const guard = await mutex.acquire();
    expect(guard).toBeDefined();
    guard[disposeSymbol]();
  });

  it('should work sequentially', async () => {
    const mutex = new Mutex();
    const results: number[] = [];
    const first = await mutex.acquire();
    const secondPromise = mutex.acquire();

    setTimeout(() => {
      results.push(1);
      first[disposeSymbol]();
    }, 10);

    const second = await secondPromise;
    results.push(2);
    second[disposeSymbol]();

    expect(results).toEqual([1, 2]);
  });

  it('should call onRelease when disposed', async () => {
    const mutex = new Mutex();
    const onRelease = sinon.spy();
    const guard = await mutex.acquire(onRelease);
    guard[disposeSymbol]();
    expect(onRelease.calledOnce).toBeTruthy();
  });

  it('should call onRelease when disposed for queued acquirers', async () => {
    const mutex = new Mutex();
    const first = await mutex.acquire();

    const onRelease = sinon.spy();
    const secondPromise = mutex.acquire(onRelease);

    first[disposeSymbol]();
    const second = await secondPromise;

    second[disposeSymbol]();
    expect(onRelease.calledOnce).toBeTruthy();
  });
});
