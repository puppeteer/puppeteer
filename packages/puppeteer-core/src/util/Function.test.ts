/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {interpolateFunction, stringifyFunction} from './Function.js';

describe('Function', function () {
  describe('interpolateFunction', function () {
    it('should work', async () => {
      const test = interpolateFunction(
        () => {
          const test = PLACEHOLDER('test') as () => number;
          return test();
        },
        {test: `() => 5`},
      );
      expect(test()).toBe(5);
    });
    it('should work inlined', async () => {
      const test = interpolateFunction(
        () => {
          // Note the parenthesis will be removed by the typescript compiler.
          return (PLACEHOLDER('test') as () => number)();
        },
        {test: `() => 5`},
      );
      expect(test()).toBe(5);
    });
  });

  describe('stringifyFunction', () => {
    it('should work', async () => {
      // @ts-expect-error no types
      const {variations} = await import('../../../../function-fixture.mjs');
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
