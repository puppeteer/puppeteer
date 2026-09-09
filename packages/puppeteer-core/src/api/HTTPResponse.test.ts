/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {HTTPResponse} from './HTTPResponse.js';

// @ts-expect-error we don't need to implement all the methods for the tests on
// text method
class TestResponse extends HTTPResponse {
  private _contentToReturn: Uint8Array = new Uint8Array();

  set contentToReturn(contentToReturn: Uint8Array) {
    this._contentToReturn = contentToReturn;
  }

  override content(): Promise<Uint8Array> {
    return Promise.resolve(this._contentToReturn);
  }
}

describe('HTTPResponse', () => {
  describe('text', () => {
    it('should return the content as text', async () => {
      const testResponse = new TestResponse();
      testResponse.contentToReturn = new TextEncoder().encode('hello');

      const text = await testResponse.text();
      expect(text).toBe('hello');
    });

    it('should throw if content is not valid UTF-8', async () => {
      const testResponse = new TestResponse();
      testResponse.contentToReturn = new Uint8Array([0xff]);

      await expect(testResponse.text()).rejects.toThrow();
    });
  });
});
