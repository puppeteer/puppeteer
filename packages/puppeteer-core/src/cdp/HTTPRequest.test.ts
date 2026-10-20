/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';

import type {CDPSession} from '../api/CDPSession.js';
import type {Frame} from '../api/Frame.js';

import {CdpHTTPRequest} from './HTTPRequest.js';

describe('CdpHTTPRequest', () => {
  it('should reconstruct postData from postDataEntries', () => {
    const client = {} as CDPSession;
    const frame = {} as Frame;
    const request = new CdpHTTPRequest(
      client,
      frame,
      'interceptionId',
      true,
      {
        requestId: 'requestId',
        request: {
          url: 'http://example.com',
          method: 'POST',
          headers: {},
          postDataEntries: [{bytes: btoa('part1')}, {bytes: btoa('part2')}],
        } as any,
      } as any,
      [],
      () => {
        return undefined;
      },
    );
    expect(request.postData()).toBe('part1part2');
  });

  it('should fallback to postData if postDataEntries is missing', () => {
    const client = {} as CDPSession;
    const frame = {} as Frame;
    const request = new CdpHTTPRequest(
      client,
      frame,
      'interceptionId',
      true,
      {
        requestId: 'requestId',
        request: {
          url: 'http://example.com',
          method: 'POST',
          headers: {},
          postData: 'originalData',
        } as any,
      } as any,
      [],
      () => {
        return undefined;
      },
    );
    expect(request.postData()).toBe('originalData');
  });

  it('should not send response headers whose value is undefined', async () => {
    const sent: Array<{
      method: string;
      params?: Protocol.Fetch.FulfillRequestRequest;
    }> = [];
    const client = {
      async send(
        method: string,
        params?: Protocol.Fetch.FulfillRequestRequest,
      ) {
        sent.push({method, params});
        return {};
      },
    } as unknown as CDPSession;
    const frame = {} as Frame;
    const request = new CdpHTTPRequest(
      client,
      frame,
      'interceptionId',
      true,
      {
        requestId: 'requestId',
        request: {
          url: 'http://example.com',
          method: 'GET',
          headers: {},
        } as any,
      } as any,
      [],
      () => {
        return undefined;
      },
    );
    await request.respond({
      status: 200,
      headers: {'x-keep': 'yes', 'x-drop': undefined},
      body: 'ok',
    });
    expect(sent).toHaveLength(1);
    const call = sent[0];
    expect(call?.method).toBe('Fetch.fulfillRequest');
    expect(call?.params?.responseHeaders).toEqual([
      {name: 'x-keep', value: 'yes'},
      {name: 'content-length', value: '2'},
    ]);
  });
});
