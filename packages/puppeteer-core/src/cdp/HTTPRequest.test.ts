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
    );
    expect(request.postData()).toBe('originalData');
  });
});
