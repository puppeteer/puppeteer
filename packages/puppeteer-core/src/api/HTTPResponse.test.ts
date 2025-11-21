/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';
import {describe, it} from 'node:test';

import {HTTPResponse} from './HTTPResponse.js';

//@ts-ignore
class TestResponse extends HTTPResponse {
  constructor(private readonly contentToReturn: Uint8Array) { super(); }

  override content(): Promise<Uint8Array> {
    return Promise.resolve(this.contentToReturn);
  }
}

describe('HTTPResponse', () => {
  describe('text', () => {
    it('should return the content as text', async () => {
      const content = new TextEncoder().encode('hello');
      const testResponse = new TestResponse(content);

      const text = await testResponse.text();
      expect(text).toBe('hello');
    });

    it('should throw if content is not valid UTF-8', async () => {
      const content = new Uint8Array([ 0xff ]);
      const testResponse = new TestResponse(content);

      await expect(testResponse.text()).rejects.toThrow();
    });
  });
});
