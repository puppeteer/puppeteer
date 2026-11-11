/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, beforeEach, describe, it} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

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

describe('Page', function () {
  describe('waitForNetworkIdle', function () {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers({
        toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
      });
    });

    afterEach(() => {
      clock.restore();
    });

    it('should return after idle time with no requests', async () => {
      const page = new MockPage();
      const resolved = sinon.spy();

      const waitPromise = page
        .waitForNetworkIdle({
          concurrency: 0,
          idleTime: 50,
        })
        .then(resolved);

      await clock.tickAsync(49);
      expect(resolved.called).toBe(false);

      await clock.tickAsync(1);
      expect(resolved.calledOnce).toBe(true);
      await waitPromise;
    });

    it('should not reset timeout while staying under concurrency', async () => {
      const page = new MockPage();
      const request1 = new MockHTTPRequest('1');
      const request2 = new MockHTTPRequest('2');
      const resolved = sinon.spy();

      const waitPromise = page
        .waitForNetworkIdle({
          concurrency: 2,
          idleTime: 50,
        })
        .then(resolved);

      await clock.tickAsync(20);
      page.emit(PageEvent.Request, request1);

      await clock.tickAsync(20);
      page.emit(PageEvent.Request, request2);
      page.emit(PageEvent.RequestFailed, request1);

      await clock.tickAsync(9);
      expect(resolved.called).toBe(false);

      await clock.tickAsync(1);
      expect(resolved.calledOnce).toBe(true);
      await waitPromise;
    });

    it('should reset timeout going over concurrency', async () => {
      const page = new MockPage();
      const request1 = new MockHTTPRequest('1');
      const request2 = new MockHTTPRequest('2');
      const request3 = new MockHTTPRequest('3');
      const resolved = sinon.spy();

      const waitPromise = page
        .waitForNetworkIdle({
          concurrency: 2,
          idleTime: 50,
        })
        .then(resolved);

      await clock.tickAsync(10);
      page.emit(PageEvent.Request, request1);
      page.emit(PageEvent.Request, request2);

      await clock.tickAsync(10);
      page.emit(PageEvent.Request, request3);

      await clock.tickAsync(100);
      expect(resolved.called).toBe(false);
      page.emit(PageEvent.RequestFailed, request3);

      await clock.tickAsync(49);
      expect(resolved.called).toBe(false);

      await clock.tickAsync(1);
      expect(resolved.calledOnce).toBe(true);
      await waitPromise;
    });
  });
});
