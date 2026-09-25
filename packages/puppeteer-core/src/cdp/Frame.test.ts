/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import {assert} from 'chai';

import {referrerPolicyToProtocol} from './Frame.js';

describe('Frame', function () {
  it('should convert referrer string to a protocol value', () => {
    assert.strictEqual(referrerPolicyToProtocol('no-referrer'), 'noReferrer');
    assert.strictEqual(referrerPolicyToProtocol('origin'), 'origin');
    assert.strictEqual(
      referrerPolicyToProtocol('strict-origin-when-cross-origin'),
      'strictOriginWhenCrossOrigin',
    );
  });
});
