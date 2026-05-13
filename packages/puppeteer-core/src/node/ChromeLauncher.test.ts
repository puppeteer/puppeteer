/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {
  ChromeLauncher,
  getFeatures,
  removeMatchingFlags,
} from './ChromeLauncher.js';

describe('getFeatures', () => {
  it('returns an empty array when no options are provided', () => {
    const result = getFeatures('--foo');
    expect(result).toEqual([]);
  });

  it('returns an empty array when no options match the flag', () => {
    const result = getFeatures('--foo', ['--bar', '--baz']);
    expect(result).toEqual([]);
  });

  it('returns an array of values when options match the flag', () => {
    const result = getFeatures('--foo', ['--foo=bar', '--foo=baz']);
    expect(result).toEqual(['bar', 'baz']);
  });

  it('does not handle whitespace', () => {
    const result = getFeatures('--foo', ['--foo bar', '--foo baz ']);
    expect(result).toEqual([]);
  });

  it('handles equals sign around the flag and value', () => {
    const result = getFeatures('--foo', ['--foo=bar', '--foo=baz ']);
    expect(result).toEqual(['bar', 'baz']);
  });

  it('handles comma-separated values', () => {
    const result = getFeatures('--foo', ['--foo=bar,baz', '--foo=qux']);
    expect(result).toEqual(['bar', 'baz', 'qux']);
  });
});

describe('removeMatchingFlags', () => {
  it('empty', () => {
    const a: string[] = [];
    expect(removeMatchingFlags(a, '--foo')).toEqual([]);
  });

  it('with one match', () => {
    const a: string[] = ['--foo=1', '--bar=baz'];
    expect(removeMatchingFlags(a, '--foo')).toEqual(['--bar=baz']);
  });

  it('with multiple matches', () => {
    const a: string[] = ['--foo=1', '--foo=2', '--bar=baz'];
    expect(removeMatchingFlags(a, '--foo')).toEqual(['--bar=baz']);
  });

  it('with no matches', () => {
    const a: string[] = ['--foo=1', '--bar=baz'];
    expect(removeMatchingFlags(a, '--baz')).toEqual(['--foo=1', '--bar=baz']);
  });
});

describe('ChromeLauncher', () => {
  it('removes disabled features if they are enabled explicitly', () => {
    const launcher = new ChromeLauncher({} as any);
    const args = launcher.defaultArgs({
      args: ['--enable-features=Translate'],
    });
    const disableFeaturesFlag = args.find(arg => {
      return arg.startsWith('--disable-features=');
    });
    expect(disableFeaturesFlag).toBeDefined();
    const disabledFeatures = disableFeaturesFlag!.split('=')[1]!.split(',');
    expect(disabledFeatures).not.toContain('Translate');
  });
});
