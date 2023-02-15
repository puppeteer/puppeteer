/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'assert/strict';
import test from 'node:test';

import {TestExpectation} from './types.js';
import {filterByParameters, getTestResultForFailure} from './utils.js';
import {getFilename, extendProcessEnv} from './utils.js';

test('extendProcessEnv', () => {
  const env = extendProcessEnv([{TEST: 'TEST'}, {TEST2: 'TEST2'}]);
  assert.equal(env['TEST'], 'TEST');
  assert.equal(env['TEST2'], 'TEST2');
});

test('getFilename', () => {
  assert.equal(getFilename('/etc/test.ts'), 'test');
  assert.equal(getFilename('/etc/test.js'), 'test');
});

test('getTestResultForFailure', () => {
  assert.equal(
    getTestResultForFailure({err: {code: 'ERR_MOCHA_TIMEOUT'}}),
    'TIMEOUT'
  );
  assert.equal(getTestResultForFailure({err: {code: 'ERROR'}}), 'FAIL');
});

test('filterByParameters', () => {
  const expectations: TestExpectation[] = [
    {
      testIdPattern:
        '[oopif.spec] OOPIF "after all" hook for "should keep track of a frames OOP state"',
      platforms: ['darwin'],
      parameters: ['firefox', 'headless'],
      expectations: ['FAIL'],
    },
  ];
  assert.equal(
    filterByParameters(expectations, ['firefox', 'headless']).length,
    1
  );
  assert.equal(filterByParameters(expectations, ['firefox']).length, 0);
  assert.equal(
    filterByParameters(expectations, ['firefox', 'headless', 'other']).length,
    1
  );
  assert.equal(filterByParameters(expectations, ['other']).length, 0);
});
