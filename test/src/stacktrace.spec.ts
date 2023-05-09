/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'assert';

import expect from 'expect';

import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';

const FILENAME = __filename.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');

describe('Stack trace', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  it('should work', async () => {
    const {page} = getTestState();

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
    expect(error.stack.split('\n    at ').slice(0, 2)).toMatchObject({
      ...[
        'Error: Test',
        'evaluate (evaluate at Context.<anonymous> (<filename>:31:14), <anonymous>:1:18)',
      ],
    });
  });

  it('should work with handles', async () => {
    const {page} = getTestState();

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
    error.stack = error.stack.replace(new RegExp(FILENAME, 'g'), '<filename>');
    expect(error.stack.split('\n    at ').slice(0, 2)).toMatchObject({
      ...[
        'Error: Test',
        'evaluateHandle (evaluateHandle at Context.<anonymous> (<filename>:51:14), <anonymous>:1:18)',
      ],
    });
  });

  it('should work with contiguous evaluation', async () => {
    const {page} = getTestState();

    const thrower = await page.evaluateHandle(() => {
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
    error.stack = error.stack.replace(new RegExp(FILENAME, 'g'), '<filename>');
    expect(error.stack.split('\n    at ').slice(0, 3)).toMatchObject({
      ...[
        'Error: Test',
        'evaluateHandle (evaluateHandle at Context.<anonymous> (<filename>:70:36), <anonymous>:2:22)',
        'evaluate (evaluate at Context.<anonymous> (<filename>:76:14), <anonymous>:1:12)',
      ],
    });
  });

  it('should work with nested function calls', async () => {
    const {page} = getTestState();

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
    error.stack = error.stack.replace(new RegExp(FILENAME, 'g'), '<filename>');
    expect(error.stack.split('\n    at ').slice(0, 6)).toMatchObject({
      ...[
        'Error: Test',
        'a (evaluate at Context.<anonymous> (<filename>:97:14), <anonymous>:2:22)',
        'b (evaluate at Context.<anonymous> (<filename>:97:14), <anonymous>:5:16)',
        'c (evaluate at Context.<anonymous> (<filename>:97:14), <anonymous>:8:16)',
        'd (evaluate at Context.<anonymous> (<filename>:97:14), <anonymous>:11:16)',
        'evaluate (evaluate at Context.<anonymous> (<filename>:97:14), <anonymous>:13:12)',
      ],
    });
  });
});
