/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';

import type {HTTPRequest} from '../api/HTTPRequest.js';
import {PageEvent} from '../api/Page.js';

import {createHarness} from './MockCdp.test-utils.js';
import {TargetManagerEvent} from './TargetManageEvents.js';

function requestWillBeSent(
  requestId: string,
  url: string,
): Protocol.Network.RequestWillBeSentEvent {
  return {
    requestId,
    loaderId: '',
    documentURL: 'https://example.com/',
    request: {
      url,
      method: 'GET',
      headers: {},
      initialPriority: 'High',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    timestamp: 1,
    wallTime: 1,
    initiator: {type: 'script'},
    redirectHasExtraInfo: false,
    type: 'Fetch',
  };
}

async function openPage() {
  const h = createHarness();
  await h.attach();
  const tab = h.attachTab('main');
  await h.flush();
  const page = (await h.browser.targets()[0]!.page())!;
  return {h, tab, page};
}

describe('CdpPage close', function () {
  it('should emit workerdestroyed for remaining workers and then close', async () => {
    const {h, tab, page} = await openPage();
    const events: string[] = [];
    page.on(PageEvent.WorkerDestroyed, () => {
      expect(page.workers()).toEqual([]);
      expect(page.isClosed()).toBe(false);
      events.push('workerdestroyed');
    });
    page.on(PageEvent.Close, () => {
      expect(page.workers()).toEqual([]);
      expect(page.isClosed()).toBe(true);
      events.push('close');
    });

    h.attachChild(tab.page!.sessionId, 'worker-1', 'worker', {
      url: 'https://example.com/worker.js',
    });
    await h.flush();
    expect(page.workers()).toHaveLength(1);

    // The tab closes before the worker session reports its detach.
    tab.close();
    await h.flush();

    expect(events).toEqual(['workerdestroyed', 'close']);
  });

  it('should fail pending worker requests when the page closes', async () => {
    const {h, tab, page} = await openPage();
    const requests: HTTPRequest[] = [];
    const failedRequests: HTTPRequest[] = [];
    page.on(PageEvent.Request, request => {
      requests.push(request);
    });
    page.on(PageEvent.RequestFailed, request => {
      failedRequests.push(request);
    });

    const worker = h.attachChild(tab.page!.sessionId, 'worker-1', 'worker', {
      url: 'https://example.com/worker.js',
    });
    await h.flush();
    h.transport.emitEvent(
      'Network.requestWillBeSent',
      requestWillBeSent('worker-request-1', 'https://example.com/hang'),
      worker.sessionId,
    );
    await h.flush();
    expect(requests).toHaveLength(1);
    expect(requests[0]!.failure()).toBeNull();

    tab.close();
    await h.flush();

    expect(page.isClosed()).toBe(true);
    expect(requests[0]!.failure()).toEqual({errorText: 'net::ERR_ABORTED'});
    expect(failedRequests).toEqual([requests[0]]);
  });

  it('should not emit events after the page closes', async () => {
    const {h, tab, page} = await openPage();
    const requests: HTTPRequest[] = [];
    page.on(PageEvent.Request, request => {
      requests.push(request);
    });

    tab.close();
    await h.flush();
    expect(page.isClosed()).toBe(true);

    h.transport.emitEvent(
      'Network.requestWillBeSent',
      requestWillBeSent('late-request', 'https://example.com/late'),
      tab.page!.sessionId,
    );
    await h.flush();

    expect(requests).toEqual([]);
  });

  it('should remove its listeners if the page fails to initialize', async () => {
    const h = createHarness();
    await h.attach();
    const targetManager = h.browser._targetManager();
    const listenerCount = targetManager.listenerCount(
      TargetManagerEvent.TargetGone,
    );
    h.transport.errorFor = msg => {
      return msg.sessionId === 'session-page-main'
        ? 'Initialization failed'
        : undefined;
    };
    h.attachTab('main');
    await h.flush();

    await expect(h.browser.targets()[0]!.page()).rejects.toThrow(
      'Initialization failed',
    );
    expect(targetManager.listenerCount(TargetManagerEvent.TargetGone)).toBe(
      listenerCount,
    );
  });
});
