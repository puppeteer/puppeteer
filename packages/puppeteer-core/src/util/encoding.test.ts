/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {mergeUint8Arrays, stringToTypedArray} from './encoding.js';

describe('Typed Array helpers', function () {
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

    it('should get body length from base64 containing emoji', async () => {
      // 'How Long is this string in bytes 📏?';
      const base64 = 'SG93IExvbmcgaXMgdGhpcyBzdHJpbmcgaW4gYnl0ZXMg8J+Tjz8=';
      const result = stringToTypedArray(base64, true);

      expect(Buffer.from(base64, 'base64').compare(Buffer.from(result))).toBe(
        0,
      );
    });
  });

  describe('mergeUint8Arrays', () => {
    it('should work', () => {
      const one = new Uint8Array([1]);
      const two = new Uint8Array([12]);
      const three = new Uint8Array([123]);

      expect(mergeUint8Arrays([one, two, three])).toEqual(
        new Uint8Array([1, 12, 123]),
      );
    });

    it('should work with empty arrays', () => {
      const one = new Uint8Array([1]);
      const two = new Uint8Array([]);
      const three = new Uint8Array([]);

      expect(mergeUint8Arrays([one, two, three])).toEqual(new Uint8Array([1]));
    });
  });
});
