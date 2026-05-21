/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {
  createFunction,
  interpolateFunction,
  stringifyFunction,
} from './Function.js';

describe('Function', function () {
  describe('createFunction', function () {
    it('should return a placeholder that is not directly callable', () => {
      const fn = createFunction('() => 42');
      expect(() => fn()).toThrow(/serialization placeholder/);
    });

    it('should serialize back to the original source via toString', () => {
      const source = '() => 42';
      const fn = createFunction(source);
      expect(fn.toString()).toBe(source);
    });

    it('should be evaluable into a real function via toString', () => {
      const source = '() => 42';
      const fn = createFunction(source);
      const real = new Function(`return ${fn.toString()}`)() as () => number;
      expect(real()).toBe(42);
    });
  });

  describe('interpolateFunction', function () {
    it('should work', async () => {
      const test = interpolateFunction(
        () => {
          const test = PLACEHOLDER('test') as () => number;
          return test();
        },
        {test: `() => 5`},
      );
      const real = new Function(`return ${test.toString()}`)() as () => number;
      expect(real()).toBe(5);
    });
    it('should work inlined', async () => {
      const test = interpolateFunction(
        () => {
          // Note the parenthesis will be removed by the typescript compiler.
          return (PLACEHOLDER('test') as () => number)();
        },
        {test: `() => 5`},
      );
      const real = new Function(`return ${test.toString()}`)() as () => number;
      expect(real()).toBe(5);
    });
  });

  describe('stringifyFunction', () => {
    it('should work', async () => {
      // @ts-expect-error no types
      const {variations} = await import('../../../function-fixture.mjs');
      for (const v of variations) {
        const fnStr = stringifyFunction(v);
        try {
          new Function(`(${fnStr})`);
        } catch {
          throw new Error(`Could not stringify:
${v.toString()}`);
        }
      }
    });
  });
});
