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
    // prettier-ignore
    it('should work', () => { /* eslint-disable @typescript-eslint/no-unused-expressions */
      class K1 { m() {} }
      class K2 { m () {} }
      class K3 { async m() {} }
      class K4 { async m () {} }

      const variations = [
        // Non-arrow functions.
        function() {},
        function () {},
        function x() {},
        function x () {},
        async function() {},
        async function () {},
        async function x() {},
        async function x () {},
        // Concise methods.
        new K1().m,
        new K2().m,
        new K3().m,
        new K4().m,
        // Arrow functions.
        () => {},
        // @ts-expect-error irrelevant
        (a) => {a;},
        // @ts-expect-error irrelevant
        a => {a;},
        async () => {},
        // @ts-expect-error irrelevant
        async (a) => {a;},
        // @ts-expect-error irrelevant
        async a => {a;},
        // Generator functions
        function*a() {},
        function *a() {},
        function* a() {},
        // Async generator functions
        async function*a() {},
        async function *a() {},
        async function* a() {},
      ];

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
