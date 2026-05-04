import {describe, it} from 'node:test';
import assert from 'node:assert/strict';

import {disposeSymbol} from '../../util/disposable.js';
import {Request} from './Request.js';
import type {BrowsingContext} from './BrowsingContext.js';

describe('BiDi Request', () => {
  it('should emit disposed event and null out #event on dispose', () => {
    const event = {
      context: 'ctx-1',
      isBlocked: false,
      navigation: null,
      redirectCount: 0,
      request: {
        request: 'req-1',
        url: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        method: 'GET',
        headers: [{name: 'Content-Type', value: 'image/svg+xml'}],
        cookies: [],
        headersSize: 0,
        bodySize: 0,
        timings: {
          timeOrigin: 0,
          requestTime: 0,
          redirectStart: 0,
          redirectEnd: 0,
          fetchStart: 0,
          dnsStart: 0,
          dnsEnd: 0,
          connectStart: 0,
          connectEnd: 0,
          tlsStart: 0,
          requestStart: 0,
          responseStart: 0,
          responseEnd: 0,
        },
      },
      timestamp: 0,
      initiator: {type: 'other' as const},
    } as import('webdriver-bidi-protocol').Network.BeforeRequestSentParameters;

    const browsingContext = {
      id: 'ctx-1',
      once: () => {},
      userContext: {
        browser: {
          session: {
            on: () => {},
            once: () => {},
            off: () => {},
          },
        },
      },
    } as unknown as BrowsingContext;

    const request = Request.from(browsingContext, event);

    // Verify getters work before disposal
    assert.equal(request.id, 'req-1');
    assert.equal(request.url, 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
    assert.equal(request.method, 'GET');
    assert.deepEqual(request.headers, [
      {name: 'Content-Type', value: 'image/svg+xml'},
    ]);
    assert.equal(request.isBlocked, false);

    let disposedCalled = false;
    request.once('disposed', () => {
      disposedCalled = true;
    });

    request[disposeSymbol]();

    // Verify disposed event was emitted
    assert.ok(disposedCalled, 'Expected disposed event to be emitted');
    assert.ok(request.disposed, 'Expected request.disposed to be true');

    // CRITICAL: getters must still work after disposal (Qodo review feedback)
    assert.equal(request.id, 'req-1', 'id getter must work after disposal');
    assert.equal(
      request.url,
      'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      'url getter must work after disposal',
    );
    assert.equal(
      request.method,
      'GET',
      'method getter must work after disposal',
    );
    assert.deepEqual(
      request.headers,
      [{name: 'Content-Type', value: 'image/svg+xml'}],
      'headers getter must work after disposal',
    );
    assert.equal(
      request.isBlocked,
      false,
      'isBlocked getter must work after disposal',
    );
    assert.equal(
      request.navigation,
      undefined,
      'navigation getter must work after disposal',
    );
    assert.deepEqual(
      request.timing(),
      {
        timeOrigin: 0,
        requestTime: 0,
        redirectStart: 0,
        redirectEnd: 0,
        fetchStart: 0,
        dnsStart: 0,
        dnsEnd: 0,
        connectStart: 0,
        connectEnd: 0,
        tlsStart: 0,
        requestStart: 0,
        responseStart: 0,
        responseEnd: 0,
      },
      'timing() must work after disposal',
    );

    // response should still be accessible (kept as "request finished" signal)
    assert.equal(
      request.response,
      undefined,
      'response should be undefined (no response was set), but the getter must not throw',
    );
  });
});