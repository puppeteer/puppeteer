/**
 * @license
 * Copyright 2026 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import {assert} from 'chai';

import type {CdpHTTPRequest} from './HTTPRequest.js';
import {CdpHTTPResponse} from './HTTPResponse.js';

describe('CdpHTTPResponse', () => {
  it('should normalize set-cookie using \\n', () => {
    const request = {} as CdpHTTPRequest;
    const responsePayload = {
      remoteIPAddress: '127.0.0.1',
      remotePort: 80,
      status: 200,
      statusText: 'OK',
      headers: {
        'set-cookie': 'a=b\n  c=d',
      },
    } as any;
    const extraInfo = null;

    const response = new CdpHTTPResponse(request, responsePayload, extraInfo);
    assert.strictEqual(response.headers()['set-cookie'], 'a=b\n c=d');
  });

  it('should normalize other headers using ,', () => {
    const request = {} as CdpHTTPRequest;
    const responsePayload = {
      remoteIPAddress: '127.0.0.1',
      remotePort: 80,
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'text/html\n  charset=utf-8',
        'accept-language': 'en-US\n en',
      },
    } as any;
    const extraInfo = null;

    const response = new CdpHTTPResponse(request, responsePayload, extraInfo);
    assert.strictEqual(
      response.headers()['content-type'],
      'text/html, charset=utf-8',
    );
    assert.strictEqual(response.headers()['accept-language'], 'en-US, en');
  });
});
