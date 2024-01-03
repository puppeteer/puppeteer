/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

import {invokeAtMostOnceForArguments} from './decorators.js';

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
      expect(spy.callCount).toBe(0);
      const obj1 = {};
      const obj2 = {};
      t.test(obj1, obj2);
      expect(spy.callCount).toBe(1);
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
      expect(spy.callCount).toBe(0);
      const obj1 = {};
      const obj2 = {};
      t.test(obj1, obj2);
      expect(spy.callCount).toBe(1);
      expect(spy.lastCall.calledWith(obj1, obj2)).toBeTruthy();
      t.test(obj1, obj2);
      expect(spy.callCount).toBe(1);
      expect(spy.lastCall.calledWith(obj1, obj2)).toBeTruthy();
      const obj3 = {};
      t.test(obj1, obj3);
      expect(spy.callCount).toBe(2);
      expect(spy.lastCall.calledWith(obj1, obj3)).toBeTruthy();
    });

    it('should throw an error for dynamic argumetns', () => {
      class Test {
        @invokeAtMostOnceForArguments
        test(..._args: unknown[]) {}
      }
      const t = new Test();
      t.test({});
      expect(() => {
        t.test({}, {});
      }).toThrow();
    });

    it('should throw an error for non object arguments', () => {
      class Test {
        @invokeAtMostOnceForArguments
        test(..._args: unknown[]) {}
      }
      const t = new Test();
      expect(() => {
        t.test(1);
      }).toThrow();
    });
  });
});
