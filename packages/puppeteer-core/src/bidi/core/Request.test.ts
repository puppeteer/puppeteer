/**
 * @license
 * Copyright 2026 Google LLC.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';
import type * as Bidi from 'webdriver-bidi-protocol';

import {EventEmitter} from '../../common/EventEmitter.js';

import type {BrowsingContext} from './BrowsingContext.js';
import {Request} from './Request.js';

const CONTEXT_ID = 'context';
const REQUEST_ID = 'request';

function createBrowsingContext() {
  const session = new EventEmitter<Record<string, any>>();
  const browsingContext = Object.assign(new EventEmitter(), {
    id: CONTEXT_ID,
    userContext: {browser: {session}},
  });
  return {
    browsingContext: browsingContext as unknown as BrowsingContext,
    session,
  };
}

function requestEvent(
  redirectCount: number,
): Bidi.Network.BeforeRequestSentParameters {
  return {
    context: CONTEXT_ID,
    isBlocked: false,
    navigation: null,
    redirectCount,
    request: {
      request: REQUEST_ID,
      url: 'http://localhost/',
      method: 'GET',
      headers: [],
      cookies: [],
      headersSize: 0,
      bodySize: 0,
      destination: '',
      initiatorType: null,
      timings: {} as Bidi.Network.FetchTimingInfo,
    },
    timestamp: 0,
  };
}

function responseCompletedEvent(
  redirectCount: number,
  status: number,
): Bidi.Network.ResponseCompletedParameters {
  return {
    ...requestEvent(redirectCount),
    response: {
      url: 'http://localhost/',
      protocol: 'http/1.1',
      status,
      statusText: '',
      fromCache: false,
      headers: [],
      mimeType: 'text/html',
      bytesReceived: 0,
      headersSize: 0,
      bodySize: 0,
      content: {size: 0},
    },
  };
}

describe('Request', () => {
  for (const status of [200, 300, 304, 404]) {
    it(`should dispose the request when it completes with status ${status}`, () => {
      const {browsingContext, session} = createBrowsingContext();
      const request = Request.from(browsingContext, requestEvent(0));

      session.emit(
        'network.responseCompleted',
        responseCompletedEvent(0, status),
      );

      expect(request.disposed).toBe(true);
      expect(request.response?.status).toBe(status);
      expect(session.listenerCount('network.responseCompleted')).toBe(0);
    });
  }

  for (const status of [301, 302, 303, 307, 308]) {
    it(`should keep the request until a redirect with status ${status} continues`, () => {
      const {browsingContext, session} = createBrowsingContext();
      const request = Request.from(browsingContext, requestEvent(0));

      session.emit(
        'network.responseCompleted',
        responseCompletedEvent(0, status),
      );
      expect(request.disposed).toBe(false);

      session.emit('network.beforeRequestSent', requestEvent(1));
      expect(request.disposed).toBe(true);
      expect(request.redirect?.disposed).toBe(false);
    });
  }
});
