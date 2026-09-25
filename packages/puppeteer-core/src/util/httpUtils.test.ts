/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import {assert} from 'chai';

import {normalizeHeaderValue} from './httpUtils.js';

describe('HTTP Utilities', function () {
  describe('normalizeHeaderValue', function () {
    it('should give single-line header value unchanged', () => {
      const header = 'application/json; charset=utf-8';
      const result = normalizeHeaderValue('content-type', header);

      assert.strictEqual(result, header);
    });

    it('should normalize multiline header with newlines', () => {
      const header = 'text/html;\n charset=utf-8;\n boundary=something';
      const result = normalizeHeaderValue('content-type', header);

      assert.strictEqual(
        result,
        'text/html;, charset=utf-8;, boundary=something',
      );
    });

    it('should trim whitespace from each line', () => {
      const header = 'text/html; \n  charset=utf-8  \n   boundary=something   ';
      const result = normalizeHeaderValue('content-type', header);

      assert.strictEqual(
        result,
        'text/html;, charset=utf-8, boundary=something',
      );
    });

    it('should filter out empty lines', () => {
      const header = 'text/html;\n\n charset=utf-8;\n\n\n boundary=something';
      const result = normalizeHeaderValue('content-type', header);

      assert.strictEqual(
        result,
        'text/html;, charset=utf-8;, boundary=something',
      );
    });

    it('should normalize set-cookie with newlines', () => {
      const header = 'a=b\n c=d';
      const result = normalizeHeaderValue('set-cookie', header);

      assert.strictEqual(result, 'a=b\n c=d');
    });
  });
});
