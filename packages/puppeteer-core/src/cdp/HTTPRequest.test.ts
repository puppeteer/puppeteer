/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

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

  it('should fallback to postDataEntries bytes in content() when getRequestPostData fails', async () => {
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
    const content = await request.content();
    expect(content).toBeDefined();
    expect(Array.from(content!)).toEqual(Array.from(rawBytes));
  });
});
