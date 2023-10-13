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
import {describe, it} from 'node:test';

import expect from 'expect';

import {getFeatures} from './ChromeLauncher.js';

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
