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
    const launcher = new ChromeLauncher({} as any, () => {
      return undefined;
    });
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

  it('does not mutate options.args and returns the same result on repeated calls', () => {
    const launcher = new ChromeLauncher({} as any, () => {
      return undefined;
    });
    const args = [
      '--no-sandbox',
      '--enable-features=WebGPUUndelayedSwapOnPresentation,Foo',
      '--enable-features=Bar',
      '--disable-features=UserDisabledFeature',
    ];
    const options = {args};
    const originalArgs = [...args];

    const first = launcher.defaultArgs(options);
    const second = launcher.defaultArgs(options);

    expect(options.args).toBe(args);
    expect(options.args).toEqual(originalArgs);
    expect(second).toEqual(first);
  });

  it('merges multiple --enable-features flags and keeps user --disable-features', () => {
    const launcher = new ChromeLauncher({} as any, () => {
      return undefined;
    });
    const args = launcher.defaultArgs({
      args: [
        '--no-sandbox',
        '--enable-features=WebGPUUndelayedSwapOnPresentation,Foo',
        '--enable-features=Bar',
        '--disable-features=UserDisabledFeature',
      ],
    });

    const enableFeatureArgs = args.filter(arg => {
      return arg.startsWith('--enable-features=');
    });
    expect(enableFeatureArgs).toEqual([
      '--enable-features=PdfOopif,WebGPUUndelayedSwapOnPresentation,Foo,Bar',
    ]);

    const disableFeatureArg = args.find(arg => {
      return arg.startsWith('--disable-features=');
    });
    expect(disableFeatureArg).toBeDefined();
    expect(disableFeatureArg!.split('=')[1]!.split(',')).toContain(
      'UserDisabledFeature',
    );
    expect(
      args.filter(arg => {
        return arg.startsWith('--disable-features=');
      }),
    ).toHaveLength(1);
    expect(args).toContain('--no-sandbox');
  });
});
