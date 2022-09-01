import assert from 'assert/strict';
import test from 'node:test';
import {
  filterByParameters as filterByParameters,
  getTestResultForFailure,
} from './utils.js';
import {TestExpectation} from './types.js';
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
