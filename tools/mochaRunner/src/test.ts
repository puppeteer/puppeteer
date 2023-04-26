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
import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TestExpectation} from './types.js';
import {
  filterByParameters,
  getTestResultForFailure,
  isWildCardPattern,
  testIdMatchesExpectationPattern,
} from './utils.js';
import {getFilename, extendProcessEnv} from './utils.js';

void test('extendProcessEnv', () => {
  const env = extendProcessEnv([{TEST: 'TEST'}, {TEST2: 'TEST2'}]);
  assert.equal(env['TEST'], 'TEST');
  assert.equal(env['TEST2'], 'TEST2');
});

void test('getFilename', () => {
  assert.equal(getFilename('/etc/test.ts'), 'test');
  assert.equal(getFilename('/etc/test.js'), 'test');
});

void test('getTestResultForFailure', () => {
  assert.equal(
    getTestResultForFailure({err: {code: 'ERR_MOCHA_TIMEOUT'}}),
    'TIMEOUT'
  );
  assert.equal(getTestResultForFailure({err: {code: 'ERROR'}}), 'FAIL');
});

void test('filterByParameters', () => {
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

void test('isWildCardPattern', () => {
  assert.equal(isWildCardPattern(''), false);
  assert.equal(isWildCardPattern('a'), false);
  assert.equal(isWildCardPattern('*'), true);

  assert.equal(isWildCardPattern('[queryHandler.spec]'), false);
  assert.equal(isWildCardPattern('[queryHandler.spec] *'), true);
  assert.equal(isWildCardPattern(' [queryHandler.spec] '), false);

  assert.equal(isWildCardPattern('[queryHandler.spec] Query'), false);
  assert.equal(isWildCardPattern('[queryHandler.spec] Page *'), true);
  assert.equal(isWildCardPattern('[queryHandler.spec] Page Page.goto *'), true);
});

describe('testIdMatchesExpectationPattern', () => {
  const expectations: Array<[string, boolean]> = [
    ['', false],
    ['*', true],
    ['* should work', true],
    ['* Page.setContent *', true],
    ['* should work as expected', false],
    ['Page.setContent *', false],
    ['[page.spec]', false],
    ['[page.spec] *', true],
    ['[page.spec] Page *', true],
    ['[page.spec] Page Page.setContent *', true],
    ['[page.spec] Page Page.setContent should work', true],
    ['[page.spec] Page * should work', true],
    ['[page.spec] * Page.setContent *', true],
    ['[jshandle.spec] *', false],
    ['[jshandle.spec] JSHandle should work', false],
  ];

  void test('with MochaTest', () => {
    const test = {
      title: 'should work',
      file: 'page.spec.ts',
      fullTitle() {
        return 'Page Page.setContent should work';
      },
    } as any;

    for (const [pattern, expected] of expectations) {
      assert.equal(
        testIdMatchesExpectationPattern(test, pattern),
        expected,
        `Expected "${pattern}" to yield "${expected}"`
      );
    }
  });
  void test('with MochaTestResult', () => {
    const test = {
      title: 'should work',
      file: 'page.spec.ts',
      fullTitle: 'Page Page.setContent should work',
    } as any;

    for (const [pattern, expected] of expectations) {
      assert.equal(
        testIdMatchesExpectationPattern(test, pattern),
        expected,
        `Expected "${pattern}" to yield "${expected}"`
      );
    }
  });
});
