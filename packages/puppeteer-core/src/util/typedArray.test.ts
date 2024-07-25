/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {stringToTypedArray} from './typedArray.js';

describe('Function', function () {
  describe('stringToTypedArray', function () {
    it('should get body length from empty string', async () => {
      const result = stringToTypedArray('');

      expect(Buffer.from('').compare(Buffer.from(result))).toBe(0);
    });
    it('should get body length from latin string', async () => {
      const body = 'Lorem ipsum dolor sit amet';
      const result = stringToTypedArray(body);

      expect(Buffer.from(body).compare(Buffer.from(result))).toBe(0);
    });
    it('should get body length from string with emoji', async () => {
      const body = 'How Long is this string in bytes 📏?';
      const result = stringToTypedArray(body);

      expect(Buffer.from(body).compare(Buffer.from(result))).toBe(0);
    });

    it('should get body length from base64', async () => {
      const body = btoa('Lorem ipsum dolor sit amet');
      const result = stringToTypedArray(body, true);

      expect(Buffer.from(body, 'base64').compare(Buffer.from(result))).toBe(0);
    });
  });
});
