/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {referrerPolicyToProtocol} from './Frame.js';

describe('Frame', function () {
  it('should convert referrer string to a protocol value', () => {
    expect(referrerPolicyToProtocol('no-referrer')).toBe('noReferrer');
    expect(referrerPolicyToProtocol('origin')).toBe('origin');
    expect(referrerPolicyToProtocol('strict-origin-when-cross-origin')).toBe(
      'strictOriginWhenCrossOrigin',
    );
  });
});
