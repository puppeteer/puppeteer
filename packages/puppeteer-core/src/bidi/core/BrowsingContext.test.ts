/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';
import type * as Bidi from 'webdriver-bidi-protocol';

import {EventEmitter} from '../../common/EventEmitter.js';
import {disposeSymbol} from '../../util/disposable.js';

import {BrowsingContext} from './BrowsingContext.js';
import type {Request} from './Request.js';
import type {UserContext} from './UserContext.js';

const CONTEXT_ID = 'context-1';

function createBrowsingContext() {
  const session = new EventEmitter<Record<string, any>>();
  const userContext = Object.assign(new EventEmitter(), {
    browser: {session},
  }) as unknown as UserContext;
  const browsingContext = BrowsingContext.from(
    userContext,
    undefined,
    CONTEXT_ID,
    'about:blank',
    null,
    'window-1',
  );
  return {browsingContext, session};
}

function makeBeforeRequestSent(
  requestId: string,
  redirectCount = 0,
): Bidi.Network.BeforeRequestSentParameters {
  return {
    context: CONTEXT_ID,
    isBlocked: false,
    navigation: null,
    redirectCount,
    request: {
      request: requestId,
      url: 'http://localhost/test',
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

function makeResponseData(status = 200): Bidi.Network.ResponseData {
  return {
    url: 'http://localhost/test',
    protocol: 'http/1.1',
    status,
    statusText: 'OK',
    fromCache: false,
    headers: [],
    mimeType: 'text/plain',
    bytesReceived: 0,
    headersSize: 0,
    bodySize: 0,
    content: {size: 0},
  };
}

async function flushMicrotasks(turns = 20) {
  for (let i = 0; i < turns; i++) {
    await Promise.resolve();
  }
}

describe('BrowsingContext early network event buffering', () => {
  it('replays early responseStarted and responseCompleted once without re-buffering', async () => {
    const {browsingContext, session} = createBrowsingContext();
    const events: string[] = [];

    browsingContext.on('request', (request: Request) => {
      events.push('request');
      request.on('response', () => {
        events.push('response');
      });
      request.on('success', () => {
        events.push('success');
      });
    });

    const base = makeBeforeRequestSent('req-1');
    session.emit('network.responseStarted', {
      ...base,
      response: makeResponseData(200),
    });
    session.emit('network.responseCompleted', {
      ...base,
      response: makeResponseData(200),
    });
    session.emit('network.beforeRequestSent', base);

    await flushMicrotasks();
    expect(events).toEqual(['request', 'response', 'success']);

    // Verify replayed events were not re-inserted into earlyNetworkEvents:
    // a subsequent request with the same ID should not receive stale replays.
    events.length = 0;
    session.emit('network.beforeRequestSent', base);
    await flushMicrotasks();
    expect(events).toEqual(['request']);

    browsingContext[disposeSymbol]();
  });

  it('replays early fetchError once without re-buffering', async () => {
    const {browsingContext, session} = createBrowsingContext();
    const errors: string[] = [];

    browsingContext.on('request', (request: Request) => {
      request.on('error', err => {
        errors.push(err);
      });
    });

    const base = makeBeforeRequestSent('req-err');
    session.emit('network.fetchError', {
      ...base,
      errorText: 'net::ERR_FAILED',
    });
    session.emit('network.beforeRequestSent', base);

    await flushMicrotasks();
    expect(errors).toEqual(['net::ERR_FAILED']);

    errors.length = 0;
    session.emit('network.beforeRequestSent', base);
    await flushMicrotasks();
    expect(errors).toEqual([]);

    browsingContext[disposeSymbol]();
  });
});
