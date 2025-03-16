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
} from './disposable';
import {assert} from 'console';

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
    expect(() => stack.move()).toThrow(ReferenceError);
  });

  it('should collect errors from disposals', async () => {
    const dispose1 = sinon.stub().rejects(new Error('dispose1'));
    const dispose2 = sinon.stub().rejects(new Error('dispose2'));
    stack.adopt({}, dispose1);
    stack.adopt({}, dispose2);
    let error;
    try {
      await stack.dispose();
    } catch (e) {
      error = e;
    }

    assert(error instanceof AggregateError);
    expect((error as AggregateError).message).toContain(
      'Multiple errors occurred',
    );
    expect((error as AggregateError).errors).toEqual([
      new Error('dispose1'),
      new Error('dispose2'),
    ]);
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
    await stack.dispose();
    expect(dispose2.calledBefore(dispose1)).toBeTruthy();
  });

  it('should not dispose resources if already disposed', async () => {
    const dispose = sinon.stub().resolves();
    stack.adopt({}, dispose);
    await stack.dispose();
    await stack.dispose();
    expect(dispose.calledOnce).toBeTruthy();
  });

  it('should use async disposable resources', async () => {
    const resource = {
      [asyncDisposeSymbol]: sinon.stub().resolves(),
    };
    stack.use(resource);
    await stack.dispose();
    expect(resource[asyncDisposeSymbol].calledOnce).toBeTruthy();
  });

  it('should defer async disposal callbacks', async () => {
    const onDispose = sinon.stub().resolves();
    stack.defer(onDispose);
    await stack.dispose();
    expect(onDispose.calledOnce).toBeTruthy();
  });

  it('should move resources to a new stack', async () => {
    const dispose = sinon.stub().resolves();
    stack.adopt({}, dispose);
    const newStack = stack.move();
    expect(stack.disposed).toBeTruthy();
    expect(newStack.disposed).toBeFalsy();
    await newStack.dispose();
    expect(dispose.calledOnce).toBeTruthy();
  });

  it('should throw error if moving a disposed stack', () => {
    stack.dispose();
    expect(() => stack.move()).toThrow(ReferenceError);
  });

  it('should collect errors from async disposals', async () => {
    const dispose1 = sinon.stub().rejects(new Error('dispose1'));
    const dispose2 = sinon.stub().rejects(new Error('dispose2'));
    stack.adopt({}, dispose1);
    stack.adopt({}, dispose2);
    let error;
    try {
      await stack.dispose();
    } catch (e) {
      error = e;
    }

    assert(error instanceof AggregateError);
    expect((error as AggregateError).message).toContain(
      'Multiple errors occurred',
    );
    expect((error as AggregateError).errors).toEqual([
      new Error('dispose1'),
      new Error('dispose2'),
    ]);
  });
});
