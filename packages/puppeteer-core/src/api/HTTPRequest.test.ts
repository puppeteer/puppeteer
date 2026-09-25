/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import {assert} from 'chai';

import {HTTPRequest} from './HTTPRequest.js';

describe('HTTPRequest', () => {
  describe('getResponse', () => {
    it('should get body length from empty string', async () => {
      const response = HTTPRequest.getResponse('');

      assert.strictEqual(response.contentLength, Buffer.from('').byteLength);
    });
    it('should get body length from latin string', async () => {
      const body = 'Lorem ipsum dolor sit amet';
      const response = HTTPRequest.getResponse(body);

      assert.strictEqual(response.contentLength, Buffer.from(body).byteLength);
    });
    it('should get body length from string with emoji', async () => {
      const body = 'How Long is this string in bytes 📏?';
      const response = HTTPRequest.getResponse(body);

      assert.strictEqual(response.contentLength, Buffer.from(body).byteLength);
    });
    it('should get body length from Uint8Array', async () => {
      const body = Buffer.from('How Long is this string in bytes 📏?');
      const response = HTTPRequest.getResponse(body);

      assert.strictEqual(response.contentLength, body.byteLength);
    });
    it('should get base64 from empty string', async () => {
      const response = HTTPRequest.getResponse('');

      assert.strictEqual(response.base64, Buffer.from('').toString('base64'));
    });
    it('should get base64 from latin string', async () => {
      const body = 'Lorem ipsum dolor sit amet';
      const response = HTTPRequest.getResponse(body);

      assert.strictEqual(response.base64, Buffer.from(body).toString('base64'));
    });
    it('should get base64 from string with emoji', async () => {
      const body = 'What am I in base64 🤔?';
      const response = HTTPRequest.getResponse(body);

      assert.strictEqual(response.base64, Buffer.from(body).toString('base64'));
    });
    it('should get base64 length from Uint8Array', async () => {
      const body = Buffer.from('What am I in base64 🤔?');
      const response = HTTPRequest.getResponse(body);

      assert.strictEqual(response.base64, body.toString('base64'));
    });
  });
});
