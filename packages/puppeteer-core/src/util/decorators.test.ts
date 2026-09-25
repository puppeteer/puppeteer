/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import {assert} from 'chai';
import sinon from 'sinon';

import {EventEmitter} from '../common/EventEmitter.js';

import {bubble, invokeAtMostOnceForArguments} from './decorators.js';

describe('decorators', function () {
  describe('invokeAtMostOnceForArguments', () => {
    it('should delegate calls', () => {
      const spy = sinon.spy();
      class Test {
        @invokeAtMostOnceForArguments
        test(obj1: object, obj2: object) {
          spy(obj1, obj2);
        }
      }
      const t = new Test();
      assert.strictEqual(spy.callCount, 0);
      const obj1 = {};
      const obj2 = {};
      t.test(obj1, obj2);
      assert.strictEqual(spy.callCount, 1);
    });

    it('should prevent repeated calls', () => {
      const spy = sinon.spy();
      class Test {
        @invokeAtMostOnceForArguments
        test(obj1: object, obj2: object) {
          spy(obj1, obj2);
        }
      }
      const t = new Test();
      assert.strictEqual(spy.callCount, 0);
      const obj1 = {};
      const obj2 = {};
      t.test(obj1, obj2);
      assert.strictEqual(spy.callCount, 1);
      assert.ok(spy.lastCall.calledWith(obj1, obj2));
      t.test(obj1, obj2);
      assert.strictEqual(spy.callCount, 1);
      assert.ok(spy.lastCall.calledWith(obj1, obj2));
      const obj3 = {};
      t.test(obj1, obj3);
      assert.strictEqual(spy.callCount, 2);
      assert.ok(spy.lastCall.calledWith(obj1, obj3));
    });

    it('should throw an error for dynamic argumetns', () => {
      class Test {
        @invokeAtMostOnceForArguments
        test(..._args: unknown[]) {}
      }
      const t = new Test();
      t.test({});
      assert.throws(() => {
        t.test({}, {});
      });
    });

    it('should throw an error for non object arguments', () => {
      class Test {
        @invokeAtMostOnceForArguments
        test(..._args: unknown[]) {}
      }
      const t = new Test();
      assert.throws(() => {
        t.test(1);
      });
    });
  });

  describe('bubble', () => {
    it('should work', () => {
      class Test extends EventEmitter<any> {
        @bubble()
        accessor field = new EventEmitter();
      }

      const t = new Test();
      const spy = sinon.spy();
      t.on('a', spy);

      t.field.emit('a', true);
      assert.strictEqual(spy.callCount, 1);
      assert.ok(spy.calledWithExactly(true));

      // Set a new emitter.
      t.field = new EventEmitter();

      t.field.emit('a', false);
      assert.strictEqual(spy.callCount, 2);
      assert.ok(spy.calledWithExactly(false));
    });

    it('should not bubble down', () => {
      class Test extends EventEmitter<any> {
        @bubble()
        accessor field = new EventEmitter<any>();
      }

      const t = new Test();
      const spy = sinon.spy();
      t.field.on('a', spy);

      t.emit('a', true);
      assert.strictEqual(spy.callCount, 0);

      t.field.emit('a', true);
      assert.strictEqual(spy.callCount, 1);
    });

    it('should be assignable during construction', () => {
      class Test extends EventEmitter<any> {
        @bubble()
        accessor field: EventEmitter<any>;

        constructor(emitter: EventEmitter<any>) {
          super();
          this.field = emitter;
        }
      }

      const t = new Test(new EventEmitter());
      const spy = sinon.spy();
      t.field.on('a', spy);

      t.emit('a', true);
      assert.strictEqual(spy.callCount, 0);

      t.field.emit('a', true);
      assert.strictEqual(spy.callCount, 1);
    });
  });
});
