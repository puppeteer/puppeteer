/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it, beforeEach} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

import {
  DisposableStack,
  disposeSymbol,
  AsyncDisposableStack,
  asyncDisposeSymbol,
  SuppressedError,
} from './disposable.js';

describe('DisposableStack', () => {
  let stack: DisposableStack;

  beforeEach(() => {
    stack = new DisposableStack();
  });

  it('should dispose resources in LIFO order', () => {
    const dispose1 = sinon.spy();
    const dispose2 = sinon.spy();
    stack.adopt({}, dispose1);
    stack.adopt({}, dispose2);
    stack.dispose();
    expect(dispose2.calledBefore(dispose1)).toBeTruthy();
  });

  it('should not dispose resources if already disposed', () => {
    const dispose = sinon.spy();
    stack.adopt({}, dispose);
    stack.dispose();
    stack.dispose();
    expect(dispose.calledOnce).toBeTruthy();
  });

  it('should use disposable resources', () => {
    const resource = {
      [disposeSymbol]: sinon.spy(),
    };
    stack.use(resource);
    stack.dispose();
    expect(resource[disposeSymbol].calledOnce).toBeTruthy();
  });

  it('should defer disposal callbacks', () => {
    const onDispose = sinon.spy();
    stack.defer(onDispose);
    stack.dispose();
    expect(onDispose.calledOnce).toBeTruthy();
  });

  it('should move resources to a new stack', () => {
    const dispose = sinon.spy();
    stack.adopt({}, dispose);
    const newStack = stack.move();
    expect(stack.disposed).toBeTruthy();
    expect(newStack.disposed).toBeFalsy();
    newStack.dispose();
    expect(dispose.calledOnce).toBeTruthy();
  });

  it('should throw error if moving a disposed stack', () => {
    stack.dispose();
    expect(() => {
      return stack.move();
    }).toThrow(ReferenceError);
  });

  it('should collect errors from disposals', async () => {
    const error1 = new Error('dispose1');
    const error2 = new Error('dispose2');
    const error3 = new Error('dispose3');
    const dispose1 = sinon.stub().throws(error1);
    const dispose2 = sinon.stub().throws(error2);
    const dispose3 = sinon.stub().throws(error3);
    stack.adopt({}, dispose1);
    stack.adopt({}, dispose2);
    stack.adopt({}, dispose3);
    let error!: SuppressedError;
    try {
      stack.dispose();
    } catch (e) {
      error = e as SuppressedError;
    }

    expect(error instanceof SuppressedError).toBeTruthy();
    expect(error.name).toEqual('SuppressedError');
    expect(error.message).toEqual('An error was suppressed during disposal');
    expect(error.error).toEqual(error1);
    expect(error.suppressed.error).toEqual(error2);
    expect(error.suppressed.suppressed).toEqual(error3);
  });
});

describe('AsyncDisposableStack', () => {
  let stack: AsyncDisposableStack;

  beforeEach(() => {
    stack = new AsyncDisposableStack();
  });

  it('should dispose resources in LIFO order', async () => {
    const dispose1 = sinon.stub().resolves();
    const dispose2 = sinon.stub().resolves();
    stack.adopt({}, dispose1);
    stack.adopt({}, dispose2);
    await stack.disposeAsync();
    expect(dispose2.calledBefore(dispose1)).toBeTruthy();
  });

  it('should not dispose resources if already disposed', async () => {
    const dispose = sinon.stub().resolves();
    stack.adopt({}, dispose);
    await stack.disposeAsync();
    await stack.disposeAsync();
    expect(dispose.calledOnce).toBeTruthy();
  });

  it('should use async disposable resources', async () => {
    const resource = {
      [asyncDisposeSymbol]: sinon.stub().resolves(),
    };
    stack.use(resource);
    await stack.disposeAsync();
    expect(resource[asyncDisposeSymbol].calledOnce).toBeTruthy();
  });

  it('should defer async disposal callbacks', async () => {
    const onDispose = sinon.stub().resolves();
    stack.defer(onDispose);
    await stack.disposeAsync();
    expect(onDispose.calledOnce).toBeTruthy();
  });

  it('should move resources to a new stack', async () => {
    const dispose = sinon.stub().resolves();
    stack.adopt({}, dispose);
    const newStack = stack.move();
    expect(stack.disposed).toBeTruthy();
    expect(newStack.disposed).toBeFalsy();
    await newStack.disposeAsync();
    expect(dispose.calledOnce).toBeTruthy();
  });

  it('should throw error if moving a disposed stack', () => {
    stack.disposeAsync();
    expect(() => {
      return stack.move();
    }).toThrow(ReferenceError);
  });

  it('should collect errors from async disposals', async () => {
    const error1 = new Error('dispose1');
    const error2 = new Error('dispose2');
    const error3 = new Error('dispose3');
    const dispose1 = sinon.stub().rejects(error1);
    const dispose2 = sinon.stub().rejects(error2);
    const dispose3 = sinon.stub().rejects(error3);
    stack.adopt({}, dispose1);
    stack.adopt({}, dispose2);
    stack.adopt({}, dispose3);
    let error!: SuppressedError;
    try {
      await stack.disposeAsync();
    } catch (e) {
      error = e as SuppressedError;
    }

    expect(error instanceof SuppressedError).toBeTruthy();
    expect(error.name).toEqual('SuppressedError');
    expect(error.message).toEqual('An error was suppressed during disposal');
    expect(error.error).toEqual(error1);
    expect(error.suppressed.error).toEqual(error2);
    expect(error.suppressed.suppressed).toEqual(error3);
  });
});
