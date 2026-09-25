/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import {assert} from 'chai';

import {
  ChromeLauncher,
  getFeatures,
  removeMatchingFlags,
} from './ChromeLauncher.js';

describe('getFeatures', () => {
  it('returns an empty array when no options are provided', () => {
    const result = getFeatures('--foo');
    assert.deepEqual(result, []);
  });

  it('returns an empty array when no options match the flag', () => {
    const result = getFeatures('--foo', ['--bar', '--baz']);
    assert.deepEqual(result, []);
  });

  it('returns an array of values when options match the flag', () => {
    const result = getFeatures('--foo', ['--foo=bar', '--foo=baz']);
    assert.deepEqual(result, ['bar', 'baz']);
  });

  it('does not handle whitespace', () => {
    const result = getFeatures('--foo', ['--foo bar', '--foo baz ']);
    assert.deepEqual(result, []);
  });

  it('handles equals sign around the flag and value', () => {
    const result = getFeatures('--foo', ['--foo=bar', '--foo=baz ']);
    assert.deepEqual(result, ['bar', 'baz']);
  });

  it('handles comma-separated values', () => {
    const result = getFeatures('--foo', ['--foo=bar,baz', '--foo=qux']);
    assert.deepEqual(result, ['bar', 'baz', 'qux']);
  });
});

describe('removeMatchingFlags', () => {
  it('empty', () => {
    const a: string[] = [];
    assert.deepEqual(removeMatchingFlags(a, '--foo'), []);
  });

  it('with one match', () => {
    const a: string[] = ['--foo=1', '--bar=baz'];
    assert.deepEqual(removeMatchingFlags(a, '--foo'), ['--bar=baz']);
  });

  it('with multiple matches', () => {
    const a: string[] = ['--foo=1', '--foo=2', '--bar=baz'];
    assert.deepEqual(removeMatchingFlags(a, '--foo'), ['--bar=baz']);
  });

  it('with no matches', () => {
    const a: string[] = ['--foo=1', '--bar=baz'];
    assert.deepEqual(removeMatchingFlags(a, '--baz'), ['--foo=1', '--bar=baz']);
  });
});

describe('ChromeLauncher', () => {
  it('removes disabled features if they are enabled explicitly', () => {
    const launcher = new ChromeLauncher({} as any, () => {
      return undefined;
    });
    const args = launcher.defaultArgs({
      args: ['--enable-features=Translate'],
    });
    const disableFeaturesFlag = args.find(arg => {
      return arg.startsWith('--disable-features=');
    });
    assert.isDefined(disableFeaturesFlag);
    const disabledFeatures = disableFeaturesFlag!.split('=')[1]!.split(',');
    assert.notInclude(disabledFeatures, 'Translate');
  });
});
