/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {HTTPRequest} from './HTTPRequest.js';

describe('HTTPRequest', () => {
  describe('getResponse', () => {
    it('should get body length from empty string', async () => {
      const response = HTTPRequest.getResponse('');

      expect(response.contentLength).toBe(Buffer.from('').byteLength);
    });
    it('should get body length from latin string', async () => {
      const body = 'Lorem ipsum dolor sit amet';
      const response = HTTPRequest.getResponse(body);

      expect(response.contentLength).toBe(Buffer.from(body).byteLength);
    });
    it('should get body length from string with emoji', async () => {
      const body = 'How Long is this string in bytes 📏?';
      const response = HTTPRequest.getResponse(body);

      expect(response.contentLength).toBe(Buffer.from(body).byteLength);
    });
    it('should get body length from Uint8Array', async () => {
      const body = Buffer.from('How Long is this string in bytes 📏?');
      const response = HTTPRequest.getResponse(body);

      expect(response.contentLength).toBe(body.byteLength);
    });
    it('should get base64 from empty string', async () => {
      const response = HTTPRequest.getResponse('');

      expect(response.base64).toBe(Buffer.from('').toString('base64'));
    });
    it('should get base64 from latin string', async () => {
      const body = 'Lorem ipsum dolor sit amet';
      const response = HTTPRequest.getResponse(body);

      expect(response.base64).toBe(Buffer.from(body).toString('base64'));
    });
    it('should get base64 from string with emoji', async () => {
      const body = 'What am I in base64 🤔?';
      const response = HTTPRequest.getResponse(body);

      expect(response.base64).toBe(Buffer.from(body).toString('base64'));
    });
    it('should get base64 length from Uint8Array', async () => {
      const body = Buffer.from('What am I in base64 🤔?');
      const response = HTTPRequest.getResponse(body);

      expect(response.base64).toBe(body.toString('base64'));
    });
  });

  describe('asFetchRequest', () => {
    // @ts-expect-error we don't need to implement all the methods
    class TestRequest extends HTTPRequest {
      private _url = 'http://example.com/';
      private _method = 'GET';
      private _headers: Record<string, string> = {};
      private _postData: string | undefined = undefined;

      set urlToReturn(url: string) {
        this._url = url;
      }

      set methodToReturn(method: string) {
        this._method = method;
      }

      set headersToReturn(headers: Record<string, string>) {
        this._headers = headers;
      }

      set postDataToReturn(postData: string | undefined) {
        this._postData = postData;
      }

      override url(): string {
        return this._url;
      }

      override method(): string {
        return this._method;
      }

      override headers(): Record<string, string> {
        return this._headers;
      }

      override fetchPostData(): Promise<string | undefined> {
        return Promise.resolve(this._postData);
      }
    }

    it('should convert to a standard Fetch Request', async () => {
      const testRequest = new TestRequest();
      testRequest.methodToReturn = 'POST';
      testRequest.headersToReturn = {
        'content-type': 'application/json',
      };
      testRequest.postDataToReturn = '{"foo": "bar"}';

      const fetchRequest = await testRequest.asFetchRequest();
      expect(fetchRequest).toBeInstanceOf(Request);
      expect(fetchRequest.url).toBe('http://example.com/');
      expect(fetchRequest.method).toBe('POST');
      expect(fetchRequest.headers.get('content-type')).toBe('application/json');
      expect(await fetchRequest.text()).toBe('{"foo": "bar"}');
    });

    it('should preserve the HTTP method and URL', async () => {
      const testRequest = new TestRequest();
      testRequest.urlToReturn = 'https://example.com/api';
      testRequest.methodToReturn = 'POST';

      const fetchRequest = await testRequest.asFetchRequest();
      expect(fetchRequest.method).toBe('POST');
      expect(fetchRequest.url).toBe('https://example.com/api');
    });

    it('should properly parse multi-value cookie headers', async () => {
      const testRequest = new TestRequest();
      testRequest.headersToReturn = {
        cookie: 'session=xyz; theme=dark',
      };

      const fetchRequest = await testRequest.asFetchRequest();
      expect(fetchRequest.headers.get('cookie')).toBe(
        'session=xyz; theme=dark',
      );
    });

    it('should omit the body for GET requests', async () => {
      const testRequest = new TestRequest();
      testRequest.postDataToReturn = 'unexpected body';

      const fetchRequest = await testRequest.asFetchRequest();
      expect(fetchRequest.method).toBe('GET');
      expect(fetchRequest.bodyUsed).toBe(false);
    });

    it('should create a request without a body when there is no post data', async () => {
      const testRequest = new TestRequest();
      testRequest.methodToReturn = 'POST';
      testRequest.postDataToReturn = undefined;

      const fetchRequest = await testRequest.asFetchRequest();
      expect(fetchRequest.bodyUsed).toBe(false);
      expect(fetchRequest.headers.get('content-length')).toBeFalsy();
    });
  });
});
