/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitEvent} from './utils.js';

const FILENAME = __filename.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
const parseStackTrace = (stack: string): string => {
  stack = stack.replace(new RegExp(FILENAME, 'g'), '<filename>');
  stack = stack.replace(/<filename>:(\d+):(\d+)/g, '<filename>:<line>:<col>');
  stack = stack.replace(/<anonymous>:(\d+):(\d+)/g, '<anonymous>:<line>:<col>');
  return stack;
};

describe('Stack trace', function () {
  setupTestBrowserHooks();

  it('should work', async () => {
    const {page} = await getTestState();

    const error = (await page
      .evaluate(() => {
        throw new Error('Test');
      })
      .catch((error: Error) => {
        return error;
      })) as Error;

    expect(error.name).toEqual('Error');
    expect(error.message).toEqual('Test');
    assert(error.stack);
    error.stack = error.stack.replace(new RegExp(FILENAME, 'g'), '<filename>');
    expect(
      parseStackTrace(error.stack).split('\n    at ').slice(0, 2),
    ).toMatchObject({
      ...[
        'Error: Test',
        'evaluate (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
      ],
    });
  });

  it('should work with handles', async () => {
    const {page} = await getTestState();

    const error = (await page
      .evaluateHandle(() => {
        throw new Error('Test');
      })
      .catch((error: Error) => {
        return error;
      })) as Error;

    expect(error.name).toEqual('Error');
    expect(error.message).toEqual('Test');
    assert(error.stack);
    expect(
      parseStackTrace(error.stack).split('\n    at ').slice(0, 2),
    ).toMatchObject({
      ...[
        'Error: Test',
        'evaluateHandle (evaluateHandle at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
      ],
    });
  });

  it('should work with contiguous evaluation', async () => {
    const {page} = await getTestState();

    using thrower = await page.evaluateHandle(() => {
      return () => {
        throw new Error('Test');
      };
    });
    const error = (await thrower
      .evaluate(thrower => {
        thrower();
      })
      .catch((error: Error) => {
        return error;
      })) as Error;

    expect(error.name).toEqual('Error');
    expect(error.message).toEqual('Test');
    assert(error.stack);
    expect(
      parseStackTrace(error.stack).split('\n    at ').slice(0, 3),
    ).toMatchObject({
      ...[
        'Error: Test',
        'evaluateHandle (evaluateHandle at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
        'evaluate (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
      ],
    });
  });

  it('should work with nested function calls', async () => {
    const {page} = await getTestState();

    const error = (await page
      .evaluate(() => {
        function a() {
          throw new Error('Test');
        }
        function b() {
          a();
        }
        function c() {
          b();
        }
        function d() {
          c();
        }
        d();
      })
      .catch((error: Error) => {
        return error;
      })) as Error;

    expect(error.name).toEqual('Error');
    expect(error.message).toEqual('Test');
    assert(error.stack);
    expect(
      parseStackTrace(error.stack).split('\n    at ').slice(0, 6),
    ).toMatchObject({
      ...[
        'Error: Test',
        'a (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
        'b (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
        'c (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
        'd (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
        'evaluate (evaluate at Context.<anonymous> (<filename>:<line>:<col>), <anonymous>:<line>:<col>)',
      ],
    });
  });

  it('should work for none error objects', async () => {
    const {page} = await getTestState();

    const [error] = await Promise.all([
      waitEvent<Error>(page, 'pageerror'),
      page.evaluate(() => {
        // This can happen when a 404 with HTML is returned
        void Promise.reject(new Response());
      }),
    ]);

    expect(error).toBeTruthy();
  });
});
