/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

import type {Platform, TestExpectation, MochaTestResult} from './types.js';
import {
  filterByParameters,
  getTestResultForFailure,
  isWildCardPattern,
  testIdMatchesExpectationPattern,
  getExpectationUpdates,
} from './utils.js';
import {getFilename, extendProcessEnv} from './utils.js';

describe('extendProcessEnv', () => {
  it('should extend env variables for the subprocess', () => {
    const env = extendProcessEnv([{TEST: 'TEST'}, {TEST2: 'TEST2'}]);
    assert.equal(env['TEST'], 'TEST');
    assert.equal(env['TEST2'], 'TEST2');
  });
});

describe('getFilename', () => {
  it('extract filename for a path', () => {
    assert.equal(getFilename('/etc/test.ts'), 'test');
    assert.equal(getFilename('/etc/test.js'), 'test');
  });
});

describe('getTestResultForFailure', () => {
  it('should get a test result for a mocha failure', () => {
    assert.equal(
      getTestResultForFailure({err: {code: 'ERR_MOCHA_TIMEOUT'}}),
      'TIMEOUT'
    );
    assert.equal(getTestResultForFailure({err: {code: 'ERROR'}}), 'FAIL');
  });
});

describe('filterByParameters', () => {
  it('should filter a list of expectations by parameters', () => {
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
});

describe('isWildCardPattern', () => {
  it('should detect if an expectation is a wildcard pattern', () => {
    assert.equal(isWildCardPattern(''), false);
    assert.equal(isWildCardPattern('a'), false);
    assert.equal(isWildCardPattern('*'), true);

    assert.equal(isWildCardPattern('[queryHandler.spec]'), false);
    assert.equal(isWildCardPattern('[queryHandler.spec] *'), true);
    assert.equal(isWildCardPattern(' [queryHandler.spec] '), false);

    assert.equal(isWildCardPattern('[queryHandler.spec] Query'), false);
    assert.equal(isWildCardPattern('[queryHandler.spec] Page *'), true);
    assert.equal(
      isWildCardPattern('[queryHandler.spec] Page Page.goto *'),
      true
    );
  });
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

  it('with MochaTest', () => {
    const test = {
      title: 'should work',
      file: 'page.spec.ts',
      fullTitle() {
        return 'Page Page.setContent should work';
      },
    };

    for (const [pattern, expected] of expectations) {
      assert.equal(
        testIdMatchesExpectationPattern(test, pattern),
        expected,
        `Expected "${pattern}" to yield "${expected}"`
      );
    }
  });

  it('with MochaTestResult', () => {
    const test: MochaTestResult = {
      title: 'should work',
      file: 'page.spec.ts',
      fullTitle: 'Page Page.setContent should work',
    };

    for (const [pattern, expected] of expectations) {
      assert.equal(
        testIdMatchesExpectationPattern(test, pattern),
        expected,
        `Expected "${pattern}" to yield "${expected}"`
      );
    }
  });
});

describe('getExpectationUpdates', () => {
  it('should generate an update for expectations if a test passed with a fail expectation', () => {
    const mochaResults = {
      stats: {tests: 1},
      pending: [],
      passes: [
        {
          fullTitle: 'Page Page.setContent should work',
          title: 'should work',
          file: 'page.spec.ts',
        },
      ],
      failures: [],
    };
    const expectations = [
      {
        testIdPattern: '[page.spec] Page Page.setContent should work',
        platforms: ['darwin'] as Platform[],
        parameters: ['test'],
        expectations: ['FAIL' as const],
      },
    ];
    const updates = getExpectationUpdates(mochaResults, expectations, {
      platforms: ['darwin'] as Platform[],
      parameters: ['test'],
    });
    assert.deepEqual(updates, [
      {
        action: 'remove',
        basedOn: {
          expectations: ['FAIL'],
          parameters: ['test'],
          platforms: ['darwin'],
          testIdPattern: '[page.spec] Page Page.setContent should work',
        },
        expectation: {
          expectations: ['FAIL'],
          parameters: ['test'],
          platforms: ['darwin'],
          testIdPattern: '[page.spec] Page Page.setContent should work',
        },
      },
    ]);
  });

  it('should not generate an update for successful retries', () => {
    const mochaResults = {
      stats: {tests: 1},
      pending: [],
      passes: [
        {
          fullTitle: 'Page Page.setContent should work',
          title: 'should work',
          file: 'page.spec.ts',
        },
      ],
      failures: [
        {
          fullTitle: 'Page Page.setContent should work',
          title: 'should work',
          file: 'page.spec.ts',
          err: {code: 'Timeout'},
        },
      ],
    };
    const updates = getExpectationUpdates(mochaResults, [], {
      platforms: ['darwin'],
      parameters: ['test'],
    });
    assert.deepEqual(updates, []);
  });
});
