/**
 * @license
 * Copyright 2026 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';
import type * as Bidi from 'webdriver-bidi-protocol';

import type {BidiHTTPRequest} from './HTTPRequest.js';
import {BidiHTTPResponse} from './HTTPResponse.js';

function stringHeader(name: string, value: string): Bidi.Network.Header {
  return {name, value: {type: 'string', value}};
}

describe('BidiHTTPResponse', () => {
  it('should combine duplicate set-cookie headers using \\n', () => {
    const request = {
      response() {
        return undefined;
      },
      frame() {
        return undefined;
      },
    } as unknown as BidiHTTPRequest;
    const data = {
      url: 'http://localhost/',
      protocol: 'http/1.1',
      status: 200,
      statusText: 'OK',
      fromCache: false,
      headers: [
        stringHeader('set-cookie', 'a=b'),
        stringHeader('set-cookie', 'c=d'),
      ],
    } as unknown as Bidi.Network.ResponseData;

    const response = BidiHTTPResponse.from(data, request, false);
    expect(response.headers()['set-cookie']).toBe('a=b\n c=d');
  });

  it('should combine other duplicate headers using ,', () => {
    const request = {
      response() {
        return undefined;
      },
      frame() {
        return undefined;
      },
    } as unknown as BidiHTTPRequest;
    const data = {
      url: 'http://localhost/',
      protocol: 'http/1.1',
      status: 200,
      statusText: 'OK',
      fromCache: false,
      headers: [
        stringHeader('cache-control', 'no-cache'),
        stringHeader('cache-control', 'no-store'),
      ],
    } as unknown as Bidi.Network.ResponseData;

    const response = BidiHTTPResponse.from(data, request, false);
    expect(response.headers()['cache-control']).toBe('no-cache, no-store');
  });
});
