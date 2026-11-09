/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';

import type {Target} from '../api/Target.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';

import {CdpBrowser} from './Browser.js';
import {Connection} from './Connection.js';
import type {CdpTarget} from './Target.js';

interface SentMessage {
  id: number;
  method: string;
  params?: unknown;
  sessionId?: string;
}

const DEFAULT_FRAME = {
  id: 'main-frame',
  loaderId: 'loader-1',
  url: 'https://example.com/',
  domainAndRegistry: 'example.com',
  securityOrigin: 'https://example.com',
  mimeType: 'text/html',
  secureContextType: 'Secure',
  crossOriginIsolatedContextType: 'NotIsolated',
  gatedAPIFeatures: [],
};

class MockTransport implements ConnectionTransport {
  onmessage?: (message: string) => void;
  onclose?: () => void;
  sentMessages: SentMessage[] = [];
  onBrowserAutoAttach?: () => void;

  send(message: string): void {
    const msg = JSON.parse(message) as SentMessage;
    this.sentMessages.push(msg);
    queueMicrotask(() => {
      if (msg.method === 'Target.setAutoAttach' && !msg.sessionId) {
        this.onBrowserAutoAttach?.();
      }
      let result: Record<string, unknown> = {};
      if (msg.method === 'Page.getFrameTree') {
        result = {frameTree: {frame: DEFAULT_FRAME}};
      } else if (msg.method === 'Runtime.createIsolatedWorld') {
        result = {executionContextId: 1};
      }
      this.onmessage?.(
        JSON.stringify({id: msg.id, sessionId: msg.sessionId, result}),
      );
    });
  }

  emitEvent(method: string, params: unknown, sessionId?: string): void {
    this.onmessage?.(JSON.stringify({method, params, sessionId}));
  }

  close(): void {
    this.onclose?.();
  }
}

function makeTargetInfo(
  targetId: string,
  type: string,
  overrides: Partial<Protocol.Target.TargetInfo> = {},
): Protocol.Target.TargetInfo {
  return {
    targetId,
    type,
    title: 'Example',
    url: 'https://example.com/',
    attached: true,
    canAccessOpener: false,
    ...overrides,
  };
}

function targetIds(targets: Target[]): string[] {
  return targets.map(target => {
    return (target as CdpTarget)._targetId;
  });
}

function createHarness() {
  const transport = new MockTransport();
  const noopLogger = () => {
    return undefined;
  };
  const connection = new Connection(
    'ws://127.0.0.1:9222/devtools/browser/test',
    transport,
    0,
    undefined,
    false,
    undefined,
    noopLogger,
  );
  const browser = new CdpBrowser(
    connection,
    [],
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    noopLogger,
  );

  const flush = async () => {
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  };

  const attachChild = (
    parentSessionId: string,
    targetId: string,
    type: string,
    overrides: Partial<Protocol.Target.TargetInfo> = {},
  ) => {
    const sessionId = `session-${targetId}`;
    const info = makeTargetInfo(targetId, type, overrides);
    if (type !== 'page') {
      transport.emitEvent('Target.targetCreated', {targetInfo: info});
    }
    transport.emitEvent(
      'Target.attachedToTarget',
      {sessionId, targetInfo: info, waitingForDebugger: false},
      parentSessionId,
    );
    return {info, sessionId};
  };

  const attachTab = (
    id: string,
    tabOpts: {url?: string; attachPage?: boolean} = {},
  ) => {
    const url = tabOpts.url ?? 'https://example.com/';
    const tabId = `tab-${id}`;
    const tabSessionId = `session-${tabId}`;
    let tabInfo = makeTargetInfo(tabId, 'tab', {url});
    transport.emitEvent('Target.targetCreated', {targetInfo: tabInfo});
    transport.emitEvent('Target.attachedToTarget', {
      sessionId: tabSessionId,
      targetInfo: tabInfo,
      waitingForDebugger: false,
    });

    let page: ReturnType<typeof attachChild> | undefined;
    if (tabOpts.attachPage !== false) {
      page = attachChild(tabSessionId, `page-${id}`, 'page', {url});
    }

    return {
      tabSessionId,
      page,
      updateTab(overrides: Partial<Protocol.Target.TargetInfo>) {
        tabInfo = {...tabInfo, ...overrides};
        transport.emitEvent('Target.targetInfoChanged', {targetInfo: tabInfo});
      },
      detachChild(sessionId: string) {
        transport.emitEvent(
          'Target.detachedFromTarget',
          {sessionId},
          tabSessionId,
        );
      },
      close() {
        transport.emitEvent('Target.detachedFromTarget', {
          sessionId: tabSessionId,
        });
      },
    };
  };

  return {
    browser,
    transport,
    flush,
    attachChild,
    attachTab,
    async attach(onAutoAttach?: () => void) {
      transport.onBrowserAutoAttach = onAutoAttach;
      await browser._attach(undefined);
      await flush();
    },
  };
}

function recordTargetEvents(h: ReturnType<typeof createHarness>): string[] {
  const events: string[] = [];
  for (const name of [
    'targetcreated',
    'targetchanged',
    'targetdestroyed',
  ] as const) {
    h.browser.on(name, target => {
      events.push(`${name}:${(target as CdpTarget)._targetId}`);
    });
  }
  return events;
}

describe('Target events', function () {
  it('should emit targetcreated for an activated prerender target', async () => {
    const h = createHarness();
    await h.attach();
    const tab = h.attachTab('main');
    await h.flush();
    const firstTarget = h.browser.targets()[0]!;
    const page = (await firstTarget.page())!;

    const events = recordTargetEvents(h);
    const prerender = h.attachChild(
      tab.tabSessionId,
      'page-prerender',
      'page',
      {subtype: 'prerender', url: 'https://example.com/prerender'},
    );
    await h.flush();
    // A prerender target is not exposed and has no events.
    expect(events).toEqual([]);
    expect(targetIds(h.browser.targets())).toEqual(['page-main']);

    // Chrome detaches the old primary target before it activates the
    // prerendered target.
    tab.detachChild(tab.page!.sessionId);
    h.transport.emitEvent('Target.targetInfoChanged', {
      targetInfo: {...prerender.info, subtype: undefined},
    });
    await h.flush();

    expect(events).toEqual([
      'targetdestroyed:page-main',
      'targetcreated:page-prerender',
    ]);
    expect(targetIds(h.browser.targets())).toEqual(['page-prerender']);
    const activatedTarget = h.browser.targets()[0]!;
    await expect(activatedTarget.page()).resolves.toBe(page);
    await expect(h.browser.pages()).resolves.toEqual([page]);
  });

  it('should emit targetchanged only for exposed targets', async () => {
    const h = createHarness();
    await h.attach();
    const tab = h.attachTab('main');
    await h.flush();
    const events = recordTargetEvents(h);

    tab.updateTab({url: 'https://example.com/tab-changed'});
    h.transport.emitEvent('Target.targetInfoChanged', {
      targetInfo: {
        ...tab.page!.info,
        url: 'https://example.com/page-changed',
      },
    });
    await h.flush();

    expect(events).toEqual(['targetchanged:page-main']);
  });

  it('should emit targetdestroyed only after targetcreated', async () => {
    const h = createHarness();
    await h.attach();
    const events = recordTargetEvents(h);
    const tab = h.attachTab('main');
    const prerender = h.attachChild(
      tab.tabSessionId,
      'page-prerender',
      'page',
      {subtype: 'prerender', url: 'https://example.com/prerender'},
    );
    await h.flush();

    tab.detachChild(prerender.sessionId);
    tab.detachChild(tab.page!.sessionId);
    await h.flush();

    expect(events).toEqual([
      'targetcreated:page-main',
      'targetdestroyed:page-main',
    ]);
  });

  it(
    'should finish initialization if a tab detaches before its page attaches',
    {timeout: 5000},
    async () => {
      const h = createHarness();
      await h.attach(() => {
        const tab = h.attachTab('gone', {attachPage: false});
        tab.close();
      });
      expect(h.browser.targets()).toEqual([]);
    },
  );
});
