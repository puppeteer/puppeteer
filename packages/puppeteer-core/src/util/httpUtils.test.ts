/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {normalizeHeaderValue} from './httpUtils.js';

describe('HTTP Utilities', function () {
  describe('normalizeHeaderValue', function () {
    it('should give single-line header value unchanged', () => {
      const header = 'application/json; charset=utf-8';
      const result = normalizeHeaderValue(header);

      expect(result).toBe(header);
    });

    it('should normalize multiline header with newlines', () => {
      const header = 'text/html;\n charset=utf-8;\n boundary=something';
      const result = normalizeHeaderValue(header);

      expect(result).toBe('text/html;, charset=utf-8;, boundary=something');
    });

    it('should trim whitespace from each line', () => {
      const header = 'text/html; \n  charset=utf-8  \n   boundary=something   ';
      const result = normalizeHeaderValue(header);

      expect(result).toBe('text/html;, charset=utf-8, boundary=something');
    });

    it('should filter out empty lines', () => {
      const header = 'text/html;\n\n charset=utf-8;\n\n\n boundary=something';
      const result = normalizeHeaderValue(header);

      expect(result).toBe('text/html;, charset=utf-8;, boundary=something');
    });
  });
});
