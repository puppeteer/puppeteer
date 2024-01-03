/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {getFeatures, removeMatchingFlags} from './ChromeLauncher.js';

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
