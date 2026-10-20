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

  it('should decode base64Encoded postData in fetchPostData', async () => {
    const encoded = Buffer.from('{"hello":"world"}', 'utf-8').toString(
      'base64',
    );
    const client = {
      send: async () => {
        return {
          postData: encoded,
          base64Encoded: true,
        };
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
          method: 'POST',
          headers: {},
          hasPostData: true,
        } as any,
      } as any,
      [],
      () => {
        return undefined;
      },
    );
    expect(await request.fetchPostData()).toBe('{"hello":"world"}');
  });

  it('should return unmodified binary postData in content() and asFetchRequest()', async () => {
    const rawBytes = new Uint8Array([0, 255, 128, 10, 200, 1]);
    const base64Bytes = Buffer.from(rawBytes).toString('base64');
    const client = {
      send: async () => {
        return {
          postData: base64Bytes,
          base64Encoded: true,
        };
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
          url: 'http://example.com/upload',
          method: 'POST',
          headers: {'content-type': 'application/octet-stream'},
          hasPostData: true,
          postDataEntries: [{bytes: base64Bytes}],
        } as any,
      } as any,
      [],
      () => {
        return undefined;
      },
    );
    const content = await request.content();
    expect(content).toBeDefined();
    expect(Array.from(content!)).toEqual(Array.from(rawBytes));

    const fetchRequest = await request.asFetchRequest();
    const fetchBytes = new Uint8Array(await fetchRequest.arrayBuffer());
    expect(Array.from(fetchBytes)).toEqual(Array.from(rawBytes));
  });

  it('should return undefined in content() and fetchPostData() when getRequestPostData fails', async () => {
    const rawBytes = new Uint8Array([0, 255, 128, 10, 200, 1]);
    const base64Bytes = Buffer.from(rawBytes).toString('base64');
    const client = {
      send: async () => {
        throw new Error('No post data available for the request');
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
          url: 'http://example.com/upload',
          method: 'POST',
          headers: {'content-type': 'application/octet-stream'},
          hasPostData: true,
          postDataEntries: [{bytes: base64Bytes}],
        } as any,
      } as any,
      [],
      () => {
        return undefined;
      },
    );
    expect(await request.content()).toBeUndefined();
    expect(await request.fetchPostData()).toBeUndefined();
  });
});
