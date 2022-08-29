import assert from 'assert/strict';
import test from 'node:test';
import {
  getExpectationsForModifiers,
  getTestResultForFailure,
} from './expectations.js';
import {TestExpectation} from './types.js';
import {
  getFilename,
  isEqualObject,
  extendProcessEnv,
  traverseMatrix,
} from './utils.js';

test('extendProcessEnv', () => {
  const env = extendProcessEnv([{TEST: 'TEST'}, {TEST2: 'TEST2'}]);
  assert.equal(env['TEST'], 'TEST');
  assert.equal(env['TEST2'], 'TEST2');
});

test('getFilename', () => {
  assert.equal(getFilename('/etc/test.ts'), 'test');
  assert.equal(getFilename('/etc/test.js'), 'test');
});

test('traverseMatrix', () => {
  const combinations = [];
  for (const combination of traverseMatrix(
    [],
    [
      [{A: true}, {B: true}],
      [{C: true}, {D: true}],
    ]
  )) {
    combinations.push(combination);
  }
  assert.equal(combinations.length, 4);
  assert.deepEqual(combinations, [
    [{A: true}, {C: true}],
    [{A: true}, {D: true}],
    [{B: true}, {C: true}],
    [{B: true}, {D: true}],
  ]);
});

test('getTestResultForFailure', () => {
  assert.equal(
    getTestResultForFailure({err: {code: 'ERR_MOCHA_TIMEOUT'}}),
    'TIMEOUT'
  );
  assert.equal(getTestResultForFailure({err: {code: 'ERROR'}}), 'FAIL');
});

test('isEqualObject', () => {
  assert.equal(isEqualObject({a: 'b', c: 'd'}, {c: 'd', a: 'b'}), true);
  assert.equal(isEqualObject({a: 'b'}, {c: 'd', a: 'b'}), false);
});

test('getExpectationsForModifiers', () => {
  const expectations: TestExpectation[] = [
    {
      fullTitle:
        'OOPIF "after all" hook for "should keep track of a frames OOP state"',
      filename: 'oopif.spec',
      platforms: ['darwin'],
      modifiers: [
        {
          PUPPETEER_PRODUCT: 'firefox',
        },
        {
          HEADLESS: 'true',
        },
      ],
      expectations: ['FAIL'],
    },
  ];
  assert.equal(
    getExpectationsForModifiers(expectations, [
      {
        PUPPETEER_PRODUCT: 'firefox',
      },
      {
        HEADLESS: 'true',
      },
    ]).length,
    1
  );
  assert.equal(
    getExpectationsForModifiers(expectations, [
      {
        PUPPETEER_PRODUCT: 'firefox',
      },
    ]).length,
    0
  );
  assert.equal(
    getExpectationsForModifiers(expectations, [
      {
        PUPPETEER_PRODUCT: 'firefox',
      },
      {
        HEADLESS: 'true',
      },
      {
        SMTH: 'ELSE',
      },
    ]).length,
    1
  );
  assert.equal(
    getExpectationsForModifiers(expectations, [
      {
        SMTH: 'ELSE',
      },
    ]).length,
    0
  );
});
