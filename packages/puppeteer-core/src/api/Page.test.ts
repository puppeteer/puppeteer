/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {HTTPRequest} from './HTTPRequest.js';
import {Page, PageEvent} from './Page.js';

// @ts-expect-error no need to implement all methods
class MockPage extends Page {
  constructor() {
    super(() => {
      return undefined;
    });
  }
}

// @ts-expect-error no need to implement all methods
class MockHTTPRequest extends HTTPRequest {
  constructor(public id: string) {
    super();
  }

  override enqueueInterceptAction(
    pendingHandler: () => void | PromiseLike<unknown>,
  ): void {
    pendingHandler();
  }
}

async function timeout(ms: number) {
  return await new Promise(res => {
    return setTimeout(res, ms);
  });
}

describe('Page', function () {
  describe('waitForNetworkIdle', function () {
    it('should return after idle time with no requests', async () => {
      const page = new MockPage();

      const start = performance.now();

      await page.waitForNetworkIdle({
        concurrency: 0,
        idleTime: 50,
      });

      const timeDelta = Math.ceil(performance.now() - start);
      expect(timeDelta).toBeGreaterThanOrEqual(50);
      expect(timeDelta).toBeLessThan(60);
    });

    it('should not reset timeout while staying under concurrency', async () => {
      const page = new MockPage();
      const request = new MockHTTPRequest('1');

      const start = performance.now();

      const waitPromise = page.waitForNetworkIdle({
        concurrency: 2,
        idleTime: 50,
      });

      page.emit(PageEvent.Request, request);

      await waitPromise;
      const timeDelta = Math.ceil(performance.now() - start);
      expect(timeDelta).toBeGreaterThanOrEqual(50);
      expect(timeDelta).toBeLessThan(60);
    });

    it('should reset timeout going over concurrency', async () => {
      const page = new MockPage();
      const request1 = new MockHTTPRequest('1');
      const request2 = new MockHTTPRequest('2');
      const request3 = new MockHTTPRequest('3');

      const start = performance.now();

      const waitPromise = page.waitForNetworkIdle({
        concurrency: 2,
        idleTime: 50,
      });

      await timeout(10);

      page.emit(PageEvent.Request, request1);
      page.emit(PageEvent.Request, request2);

      await timeout(10);

      page.emit(PageEvent.Request, request3);
      await timeout(10);
      page.emit(PageEvent.RequestFailed, request3);

      await waitPromise;
      const timeDelta = Math.ceil(performance.now() - start);
      expect(timeDelta).toBeGreaterThanOrEqual(80);
      expect(timeDelta).toBeLessThan(100);
    });
  });

  describe('off', function () {
    it('should remove a request listener added with once', async () => {
      const page = new MockPage();
      const requests: HTTPRequest[] = [];
      const listener = (request: HTTPRequest) => {
        requests.push(request);
      };
      const listenerCount = page.listenerCount(PageEvent.Request);

      page.once(PageEvent.Request, listener);
      page.off(PageEvent.Request, listener);
      page.emit(PageEvent.Request, new MockHTTPRequest('1'));

      expect(requests).toEqual([]);
      expect(page.listenerCount(PageEvent.Request)).toEqual(listenerCount);
    });

    it('should call a request listener added with once only once', async () => {
      const page = new MockPage();
      const requests: HTTPRequest[] = [];
      const listener = (request: HTTPRequest) => {
        requests.push(request);
      };
      const listenerCount = page.listenerCount(PageEvent.Request);

      page.once(PageEvent.Request, listener);
      const request1 = new MockHTTPRequest('1');
      page.emit(PageEvent.Request, request1);
      page.emit(PageEvent.Request, new MockHTTPRequest('2'));

      expect(requests).toEqual([request1]);
      expect(page.listenerCount(PageEvent.Request)).toEqual(listenerCount);
    });
  });
});
