/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {HTTPResponse} from './HTTPResponse.js';

// @ts-expect-error we don't need to implement all the methods
class TestResponse extends HTTPResponse {
  private _contentToReturn: Uint8Array = new Uint8Array();
  private _status = 200;
  private _statusText = 'OK';
  private _headers: Record<string, string> = {};

  set contentToReturn(contentToReturn: Uint8Array) {
    this._contentToReturn = contentToReturn;
  }

  set statusToReturn(status: number) {
    this._status = status;
  }

  set statusTextToReturn(statusText: string) {
    this._statusText = statusText;
  }

  set headersToReturn(headers: Record<string, string>) {
    this._headers = headers;
  }

  override status(): number {
    return this._status;
  }

  override statusText(): string {
    return this._statusText;
  }

  override headers(): Record<string, string> {
    return this._headers;
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

  describe('asFetchResponse', () => {
    it('should convert to a standard Fetch Response', async () => {
      const testResponse = new TestResponse();
      testResponse.contentToReturn = new TextEncoder().encode('hello world');
      testResponse.statusToReturn = 200;
      testResponse.statusTextToReturn = 'OK';
      testResponse.headersToReturn = {
        'content-type': 'text/plain',
      };

      const fetchResponse = await testResponse.asFetchResponse();
      expect(fetchResponse).toBeInstanceOf(Response);
      expect(fetchResponse.status).toBe(200);
      expect(fetchResponse.statusText).toBe('OK');
      expect(fetchResponse.headers.get('content-type')).toBe('text/plain');
      expect(await fetchResponse.text()).toBe('hello world');
    });

    it('should properly parse multi-line set-cookie headers', async () => {
      const testResponse = new TestResponse();
      testResponse.contentToReturn = new Uint8Array();
      testResponse.headersToReturn = {
        'set-cookie': 'session=xyz; Secure\n theme=dark',
      };

      const fetchResponse = await testResponse.asFetchResponse();
      expect(fetchResponse.headers.getSetCookie()).toEqual([
        'session=xyz; Secure',
        'theme=dark',
      ]);
    });

    it('should handle null body status codes without body', async () => {
      for (const status of [204, 205, 304]) {
        const testResponse = new TestResponse();
        testResponse.statusToReturn = status;
        testResponse.statusTextToReturn = 'Status Text';
        testResponse.contentToReturn = new TextEncoder().encode(
          'should not be included',
        );

        const fetchResponse = await testResponse.asFetchResponse();
        expect(fetchResponse.status).toBe(status);
        expect(fetchResponse.body).toBeNull();
      }
    });
  });
});
