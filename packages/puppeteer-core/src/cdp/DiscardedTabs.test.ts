/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';

import type {TargetFilterCallback} from '../api/Browser.js';
import {CDPSessionEvent} from '../api/CDPSession.js';
import type {HTTPRequest} from '../api/HTTPRequest.js';
import {PageEvent} from '../api/Page.js';
import type {Target} from '../api/Target.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';

import {CdpBrowser} from './Browser.js';
import {Connection} from './Connection.js';
import {DevToolsTarget, OtherTarget, type CdpTarget} from './Target.js';

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
  onSend?: (msg: SentMessage) => void;
  errorFor?: (msg: SentMessage) => string | undefined;
  rpcHandlers = new Map<
    string,
    (msg: SentMessage) => {
      result?: Record<string, unknown>;
      afterResponse?: () => void;
    }
  >();

  send(message: string): void {
    const msg = JSON.parse(message) as SentMessage;
    this.sentMessages.push(msg);
    queueMicrotask(() => {
      const errorMessage = this.errorFor?.(msg);
      if (errorMessage) {
        this.onmessage?.(
          JSON.stringify({
            id: msg.id,
            sessionId: msg.sessionId,
            error: {code: -32601, message: errorMessage},
          }),
        );
        return;
      }
      const custom = this.rpcHandlers.get(msg.method);
      if (custom) {
        const {result = {}, afterResponse} = custom(msg);
        this.onmessage?.(
          JSON.stringify({id: msg.id, sessionId: msg.sessionId, result}),
        );
        afterResponse?.();
        return;
      }
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
    this.onSend?.(msg);
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

function createHarness(options?: {targetFilter?: TargetFilterCallback}) {
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
    options?.targetFilter,
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
    tabOpts: {
      url?: string;
      discarded?: boolean;
      attachPage?: boolean;
      browserContextId?: string;
    } = {},
  ) => {
    const url = tabOpts.url ?? 'https://example.com/';
    const tabId = `tab-${id}`;
    const tabSessionId = `session-${tabId}`;
    let tabInfo = makeTargetInfo(tabId, 'tab', {
      url,
      subtype: tabOpts.discarded ? 'discarded' : undefined,
      browserContextId: tabOpts.browserContextId,
    });
    transport.emitEvent('Target.targetCreated', {targetInfo: tabInfo});
    transport.emitEvent('Target.attachedToTarget', {
      sessionId: tabSessionId,
      targetInfo: tabInfo,
      waitingForDebugger: false,
    });

    let pageSessionId = `session-page-${id}`;
    if (!tabOpts.discarded && tabOpts.attachPage !== false) {
      pageSessionId = attachChild(tabSessionId, `page-${id}`, 'page', {
        url,
        browserContextId: tabOpts.browserContextId,
      }).sessionId;
    }

    const updateTab = (overrides: Partial<Protocol.Target.TargetInfo>) => {
      tabInfo = {...tabInfo, ...overrides};
      transport.emitEvent('Target.targetInfoChanged', {targetInfo: tabInfo});
    };

    const detachPage = (sessionId = pageSessionId) => {
      transport.emitEvent(
        'Target.detachedFromTarget',
        {sessionId},
        tabSessionId,
      );
    };

    return {
      tabSessionId,
      get pageSessionId() {
        return pageSessionId;
      },
      updateTab,
      detachPage,
      discard(detach = true) {
        updateTab({subtype: 'discarded'});
        if (detach) {
          detachPage();
        }
      },
      reload(newPageId: string) {
        updateTab({subtype: undefined});
        pageSessionId = attachChild(tabSessionId, newPageId, 'page', {
          url: tabInfo.url,
          browserContextId: tabInfo.browserContextId,
        }).sessionId;
        return pageSessionId;
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
    connection,
    transport,
    flush,
    attachChild,
    attachTab,
    async attach(onAutoAttach?: () => void) {
      transport.onBrowserAutoAttach = onAutoAttach;
      await browser._attach(undefined);
      await flush();
    },
    sentTo(sessionId: string, since = 0) {
      return transport.sentMessages.slice(since).filter(msg => {
        return msg.sessionId === sessionId;
      });
    },
  };
}

describe('Discarded tabs', function () {
  it('should exclude pre-existing discarded tabs by default and expose them with includeDiscarded', async () => {
    const seenInFilter: Array<{type: string; discarded: boolean}> = [];
    const h = createHarness({
      targetFilter: target => {
        seenInFilter.push({
          type: target.type(),
          discarded: target.isDiscarded(),
        });
        return true;
      },
    });
    const createdTargets: CdpTarget[] = [];
    h.browser.on('targetcreated', target => {
      createdTargets.push(target as CdpTarget);
    });

    await h.attach(() => {
      h.attachTab('discarded', {
        url: 'https://example.com/discarded',
        discarded: true,
      });
      const active = h.attachTab('active', {url: 'https://example.com/active'});
      h.attachChild(active.tabSessionId, 'page-prerender', 'page', {
        subtype: 'prerender',
        url: 'https://example.com/prerender',
      });
    });

    expect(seenInFilter).toContainEqual({type: 'tab', discarded: true});
    expect(seenInFilter).toContainEqual({type: 'tab', discarded: false});
    expect(seenInFilter).toContainEqual({type: 'page', discarded: false});

    const defaultContext = h.browser.defaultBrowserContext();
    expect(targetIds(createdTargets)).toEqual(['page-active']);
    expect(targetIds(h.browser.targets())).toEqual(['page-active']);
    expect(targetIds(defaultContext.targets())).toEqual(['page-active']);

    const allTargets = h.browser.targets({includeDiscarded: true});
    expect(targetIds(allTargets)).toEqual(['tab-discarded', 'page-active']);
    expect(targetIds(defaultContext.targets({includeDiscarded: true}))).toEqual(
      ['tab-discarded', 'page-active'],
    );

    const [discardedTarget, activeTarget] = allTargets;
    expect(discardedTarget!.type()).toBe('tab');
    expect(discardedTarget!.isDiscarded()).toBe(true);
    expect(activeTarget!.type()).toBe('page');
    expect(activeTarget!.isDiscarded()).toBe(false);

    const sentBefore = h.transport.sentMessages.length;
    await expect(discardedTarget!.page()).resolves.toBeNull();
    expect(h.sentTo('session-tab-discarded', sentBefore)).toEqual([]);
    await expect(discardedTarget!.asPage()).rejects.toThrow(
      'Cannot create a page for a discarded target.',
    );

    const pages = await h.browser.pages();
    expect(pages).toHaveLength(1);
    expect((pages[0]!.target() as CdpTarget)._targetId).toBe('page-active');
  });

  it('should handle active-to-discarded and discarded-to-active runtime transitions', async () => {
    const h = createHarness();
    await h.attach();

    const createdTargets: CdpTarget[] = [];
    const destroyedEvents: Array<{target: CdpTarget; discarded: boolean}> = [];
    const changedTargets: CdpTarget[] = [];
    h.browser.on('targetcreated', target => {
      createdTargets.push(target as CdpTarget);
    });
    h.browser.on('targetdestroyed', target => {
      destroyedEvents.push({
        target: target as CdpTarget,
        discarded: target.isDiscarded(),
      });
    });
    h.browser.on('targetchanged', target => {
      changedTargets.push(target as CdpTarget);
    });

    const tab = h.attachTab('1');
    const firstPageSessionId = tab.pageSessionId;
    await h.flush();

    const pageTarget = createdTargets[0]!;
    const initialPage = (await pageTarget.page())!;
    let closeCount = 0;
    let loadCountOnClosedPage = 0;
    initialPage.on(PageEvent.Close, () => {
      closeCount++;
    });
    initialPage.on(PageEvent.Load, () => {
      loadCountOnClosedPage++;
    });

    let swappedCount = 0;
    h.connection._session(tab.tabSessionId)!.on(CDPSessionEvent.Swapped, () => {
      swappedCount++;
    });

    // Subtype flips to discarded before Target.detachedFromTarget arrives.
    tab.discard(false);
    expect(targetIds(h.browser.targets({includeDiscarded: true}))).toEqual([
      'tab-1',
    ]);
    tab.detachPage();
    await h.flush();

    expect(closeCount).toBe(1);
    expect(initialPage.isClosed()).toBe(true);
    expect(pageTarget.isDiscarded()).toBe(true);
    expect(destroyedEvents).toEqual([{target: pageTarget, discarded: true}]);
    expect(h.browser.targets()).toEqual([]);

    const [discardedTabTarget] = h.browser.targets({includeDiscarded: true});
    expect(discardedTabTarget!._targetId).toBe('tab-1');
    expect(discardedTabTarget!.isDiscarded()).toBe(true);
    await expect(discardedTabTarget!.page()).resolves.toBeNull();
    await expect(h.browser.pages()).resolves.toEqual([]);

    tab.updateTab({url: 'https://example.com/updated-while-discarded'});
    await h.flush();
    expect(changedTargets).toEqual([]);

    // Reloading clears subtype and attaches a new page target.
    tab.reload('page-2');
    await h.flush();

    expect(swappedCount).toBe(0);
    expect(discardedTabTarget!.isDiscarded()).toBe(false);
    await expect(discardedTabTarget!.page()).resolves.toBeNull();
    await expect(discardedTabTarget!.asPage()).rejects.toThrow(
      'Cannot create a page for a tab target.',
    );
    expect(pageTarget.isDiscarded()).toBe(true);
    await expect(pageTarget.page()).resolves.toBeNull();
    await expect(pageTarget.asPage()).rejects.toThrow(
      'Cannot create a page for a discarded target.',
    );

    const reloadedPageTarget = createdTargets[1]!;
    expect(reloadedPageTarget._targetId).toBe('page-2');
    expect(reloadedPageTarget.isDiscarded()).toBe(false);
    expect(h.browser.targets({includeDiscarded: true})).toEqual([
      reloadedPageTarget,
    ]);

    h.transport.emitEvent(
      'Page.loadEventFired',
      {timestamp: 1},
      firstPageSessionId,
    );
    await h.flush();
    expect(loadCountOnClosedPage).toBe(0);

    const reloadedPage = (await reloadedPageTarget.page())!;
    expect(reloadedPage).not.toBe(initialPage);

    // Discard again and close the tab without duplicate events.
    let reloadedCloseCount = 0;
    reloadedPage.on(PageEvent.Close, () => {
      reloadedCloseCount++;
    });
    tab.discard();
    await h.flush();
    tab.close();
    await h.flush();

    expect(reloadedCloseCount).toBe(1);
    expect(destroyedEvents).toEqual([
      {target: pageTarget, discarded: true},
      {target: reloadedPageTarget, discarded: true},
    ]);
    expect(h.browser.targets({includeDiscarded: true})).toEqual([]);
  });

  it('should expose a reloaded page target that attaches before the tab clears its discarded subtype', async () => {
    const seenInFilter: Array<{id: string; discarded: boolean}> = [];
    const h = createHarness({
      targetFilter: target => {
        seenInFilter.push({
          id: (target as CdpTarget)._targetId,
          discarded: target.isDiscarded(),
        });
        return !target.isDiscarded();
      },
    });
    await h.attach();

    const createdTargets: CdpTarget[] = [];
    h.browser.on('targetcreated', target => {
      createdTargets.push(target as CdpTarget);
    });

    const tab = h.attachTab('early');
    await h.flush();
    tab.discard();
    await h.flush();
    expect(targetIds(h.browser.targets({includeDiscarded: true}))).toEqual([
      'tab-early',
    ]);

    // The new page target attaches while the tab still reports `discarded`.
    h.attachChild(tab.tabSessionId, 'page-early-2', 'page');
    await h.flush();

    expect(seenInFilter).toContainEqual({
      id: 'page-early-2',
      discarded: false,
    });
    expect(targetIds(createdTargets)).toEqual(['page-early', 'page-early-2']);
    const reloadedPageTarget = createdTargets[1]!;
    expect(reloadedPageTarget.isDiscarded()).toBe(false);
    expect(h.browser.targets()).toEqual([reloadedPageTarget]);
    expect(h.browser.targets({includeDiscarded: true})).toEqual([
      reloadedPageTarget,
    ]);
    await expect(reloadedPageTarget.page()).resolves.not.toBeNull();
    await h.flush();
    const reloadedPage = (await reloadedPageTarget.page())!;
    expect(reloadedPage.isClosed()).toBe(false);

    tab.updateTab({subtype: undefined});
    await h.flush();

    expect(targetIds(createdTargets)).toEqual(['page-early', 'page-early-2']);
    expect(h.browser.targets({includeDiscarded: true})).toEqual([
      reloadedPageTarget,
    ]);
  });

  it('should detach a page target that stays attached when its tab is discarded', async () => {
    const h = createHarness();
    await h.attach();

    const createdTargets: CdpTarget[] = [];
    const destroyedEvents: Array<{target: CdpTarget; discarded: boolean}> = [];
    h.browser.on('targetcreated', target => {
      createdTargets.push(target as CdpTarget);
    });
    h.browser.on('targetdestroyed', target => {
      destroyedEvents.push({
        target: target as CdpTarget,
        discarded: target.isDiscarded(),
      });
    });

    const tab = h.attachTab('retained');
    await h.flush();
    const pageTarget = createdTargets[0]!;
    const initialPage = (await pageTarget.page())!;
    const sentBefore = h.transport.sentMessages.length;

    tab.discard(false);
    await h.flush();

    expect(initialPage.isClosed()).toBe(true);
    expect(pageTarget.isDiscarded()).toBe(true);
    expect(destroyedEvents).toEqual([{target: pageTarget, discarded: true}]);
    expect(
      h.sentTo(tab.tabSessionId, sentBefore).map(msg => {
        return {method: msg.method, params: msg.params};
      }),
    ).toEqual([
      {
        method: 'Target.detachFromTarget',
        params: {sessionId: tab.pageSessionId},
      },
    ]);
    expect(h.browser.targets()).toEqual([]);
    expect(targetIds(h.browser.targets({includeDiscarded: true}))).toEqual([
      'tab-retained',
    ]);

    // Chrome confirms the detach. A reload then creates a new page target.
    tab.detachPage();
    await h.flush();
    expect(destroyedEvents).toHaveLength(1);

    tab.reload('page-retained-2');
    await h.flush();

    expect(targetIds(createdTargets)).toEqual([
      'page-retained',
      'page-retained-2',
    ]);
    expect(pageTarget.isDiscarded()).toBe(true);
    await expect(pageTarget.page()).resolves.toBeNull();
    const reloadedPage = await createdTargets[1]!.page();
    expect(reloadedPage).not.toBeNull();
    expect(reloadedPage!.isClosed()).toBe(false);
  });

  it('should handle Chrome detaching the page target before reporting the discarded subtype', async () => {
    const h = createHarness();
    await h.attach();

    const createdTargets: CdpTarget[] = [];
    const destroyedTargets: CdpTarget[] = [];
    h.browser.on('targetcreated', target => {
      createdTargets.push(target as CdpTarget);
    });
    h.browser.on('targetdestroyed', target => {
      destroyedTargets.push(target as CdpTarget);
    });

    const tab = h.attachTab('detach-first');
    await h.flush();
    const pageTarget = createdTargets[0]!;
    const page = (await pageTarget.page())!;
    let closeCount = 0;
    page.on(PageEvent.Close, () => {
      closeCount++;
    });

    // Chrome sends Target.detachedFromTarget before Target.targetInfoChanged.
    tab.detachPage();
    tab.updateTab({subtype: 'discarded'});
    await h.flush();

    expect(closeCount).toBe(1);
    expect(page.isClosed()).toBe(true);
    expect(pageTarget.isDiscarded()).toBe(true);
    expect(destroyedTargets).toEqual([pageTarget]);
    await expect(pageTarget.page()).resolves.toBeNull();
    await expect(pageTarget.asPage()).rejects.toThrow(
      'Cannot create a page for a discarded target.',
    );
    expect(h.browser.targets()).toEqual([]);
    expect(targetIds(h.browser.targets({includeDiscarded: true}))).toEqual([
      'tab-detach-first',
    ]);
    await expect(h.browser.pages()).resolves.toEqual([]);

    tab.reload('page-detach-first-2');
    await h.flush();

    expect(targetIds(createdTargets)).toEqual([
      'page-detach-first',
      'page-detach-first-2',
    ]);
    expect(pageTarget.isDiscarded()).toBe(true);
    expect(createdTargets[1]!.isDiscarded()).toBe(false);
  });

  for (const primaryDetachesFirst of [true, false]) {
    it(`should close the page if Chrome detaches the ${primaryDetachesFirst ? 'primary' : 'prerender'} page target first before reporting the discarded subtype`, async () => {
      const h = createHarness();
      await h.attach();

      const destroyedTargets: CdpTarget[] = [];
      h.browser.on('targetdestroyed', target => {
        destroyedTargets.push(target as CdpTarget);
      });

      const tab = h.attachTab('prerender-discard');
      await h.flush();
      const pageTarget = h.browser.targets()[0]!;
      const page = (await pageTarget.page())!;
      let closeCount = 0;
      page.on(PageEvent.Close, () => {
        closeCount++;
      });

      const prerender = h.attachChild(
        tab.tabSessionId,
        'page-prerender-discard-2',
        'page',
        {subtype: 'prerender', url: 'https://example.com/2'},
      );
      await h.flush();

      if (primaryDetachesFirst) {
        tab.detachPage();
        tab.detachPage(prerender.sessionId);
      } else {
        tab.detachPage(prerender.sessionId);
        tab.detachPage();
      }
      tab.updateTab({subtype: 'discarded'});
      await h.flush();

      expect(closeCount).toBe(1);
      expect(page.isClosed()).toBe(true);
      expect(pageTarget.isDiscarded()).toBe(true);
      expect(destroyedTargets).toEqual([pageTarget]);
      await expect(pageTarget.page()).resolves.toBeNull();
      expect(targetIds(h.browser.targets({includeDiscarded: true}))).toEqual([
        'tab-prerender-discard',
      ]);
    });
  }

  for (const detachFirst of [false, true]) {
    it(`should resolve page.close() on a discarded page without closing the target (${detachFirst ? 'detach first' : 'subtype first'})`, async () => {
      const h = createHarness();
      await h.attach();

      const tab = h.attachTab(`close-${detachFirst ? 'detach' : 'subtype'}`);
      await h.flush();
      const page = (await h.browser.targets()[0]!.page())!;

      if (detachFirst) {
        tab.detachPage();
        tab.updateTab({subtype: 'discarded'});
      } else {
        tab.discard();
      }
      await h.flush();
      expect(page.isClosed()).toBe(true);

      // Chrome rejects Target.closeTarget for the page target that no longer
      // exists.
      h.transport.errorFor = msg => {
        return msg.method === 'Target.closeTarget'
          ? 'No target with given id found'
          : undefined;
      };
      const sentBefore = h.transport.sentMessages.length;
      await expect(page.close()).resolves.toBeUndefined();
      expect(
        h.transport.sentMessages.slice(sentBefore).filter(msg => {
          return msg.method === 'Target.closeTarget';
        }),
      ).toEqual([]);
    });
  }

  it('should close the page if the tab changes between the page detach and the discard', async () => {
    const h = createHarness();
    await h.attach();

    const destroyedTargets: CdpTarget[] = [];
    h.browser.on('targetdestroyed', target => {
      destroyedTargets.push(target as CdpTarget);
    });

    const tab = h.attachTab('update-between');
    await h.flush();
    const pageTarget = h.browser.targets()[0]!;
    const page = (await pageTarget.page())!;
    let closeCount = 0;
    page.on(PageEvent.Close, () => {
      closeCount++;
    });

    tab.detachPage();
    await h.flush();
    // Another tab update arrives before Chrome reports the discard.
    tab.updateTab({title: 'Updated title'});
    await h.flush();
    expect(page.isClosed()).toBe(false);
    tab.updateTab({subtype: 'discarded'});
    await h.flush();

    expect(closeCount).toBe(1);
    expect(page.isClosed()).toBe(true);
    expect(pageTarget.isDiscarded()).toBe(true);
    expect(destroyedTargets).toEqual([pageTarget]);
    await expect(pageTarget.page()).resolves.toBeNull();
    expect(targetIds(h.browser.targets({includeDiscarded: true}))).toEqual([
      'tab-update-between',
    ]);
  });

  it('should not mark a detached page target as discarded after a new page target attached', async () => {
    const h = createHarness();
    await h.attach();

    const tab = h.attachTab('replaced');
    await h.flush();
    const firstPageTarget = h.browser.targets()[0]!;

    // The page target detaches for a reason other than a discard, and a new
    // page target replaces it.
    tab.detachPage();
    await h.flush();
    h.attachChild(tab.tabSessionId, 'page-replaced-2', 'page');
    await h.flush();
    const secondPageTarget = h.browser.targets()[0]!;
    expect(secondPageTarget._targetId).toBe('page-replaced-2');

    tab.updateTab({subtype: 'discarded'});
    await h.flush();

    expect(firstPageTarget.isDiscarded()).toBe(false);
    expect(secondPageTarget.isDiscarded()).toBe(true);
  });

  it('should finish initialization if an active tab becomes discarded before attaching a page', async () => {
    const h = createHarness();
    await h.attach(() => {
      h.attachTab('init', {attachPage: false}).discard(false);
    });

    expect(h.browser.targets()).toEqual([]);
    expect(targetIds(h.browser.targets({includeDiscarded: true}))).toEqual([
      'tab-init',
    ]);
  });

  for (const {chromeActivationOrder, discardDetachFirst} of [
    {chromeActivationOrder: true, discardDetachFirst: false},
    {chromeActivationOrder: true, discardDetachFirst: true},
    {chromeActivationOrder: false, discardDetachFirst: false},
  ]) {
    it(`should not mark previously swapped-out page targets as discarded (${chromeActivationOrder ? 'detach before activation' : 'activation before detach'}, ${discardDetachFirst ? 'discard detach first' : 'discard subtype first'})`, async () => {
      const h = createHarness();
      await h.attach();

      const destroyedTargets: CdpTarget[] = [];
      h.browser.on('targetdestroyed', target => {
        destroyedTargets.push(target as CdpTarget);
      });

      const tab = h.attachTab('swap');
      await h.flush();

      const firstPageTarget = h.browser.targets()[0]!;
      const page = (await firstPageTarget.page())!;

      const prerender = h.attachChild(tab.tabSessionId, 'page-swap-2', 'page', {
        subtype: 'prerender',
        url: 'https://example.com/2',
      });
      await h.flush();

      const activate = () => {
        h.transport.emitEvent('Target.targetInfoChanged', {
          targetInfo: {...prerender.info, subtype: undefined},
        });
      };
      // Chrome 157 detaches the old primary page target before it clears the
      // subtype of the prerendered target.
      if (chromeActivationOrder) {
        tab.detachPage();
        activate();
      } else {
        activate();
        tab.detachPage();
      }
      await h.flush();

      const secondPageTarget = h.browser.targets()[0]!;
      expect(secondPageTarget._targetId).toBe('page-swap-2');
      expect(firstPageTarget.isDiscarded()).toBe(false);
      await expect(h.browser.pages()).resolves.toEqual([page]);

      if (discardDetachFirst) {
        tab.detachPage(prerender.sessionId);
        tab.updateTab({subtype: 'discarded'});
      } else {
        tab.discard(false);
        tab.detachPage(prerender.sessionId);
      }
      await h.flush();

      expect(page.isClosed()).toBe(true);
      expect(firstPageTarget.isDiscarded()).toBe(false);
      expect(secondPageTarget.isDiscarded()).toBe(true);
      expect(destroyedTargets).toEqual([firstPageTarget, secondPageTarget]);
    });
  }

  it('should emit WorkerDestroyed and clear page.workers() when a tab is discarded', async () => {
    const h = createHarness();
    await h.attach();

    const tab = h.attachTab('worker');
    await h.flush();

    const page = (await h.browser.targets()[0]!.page())!;
    const events: string[] = [];
    page.on(PageEvent.WorkerCreated, () => {
      events.push('workercreated');
    });
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

    const worker = h.attachChild(
      tab.pageSessionId,
      'dedicated-worker-1',
      'worker',
      {
        url: 'https://example.com/worker.js',
      },
    );
    await h.flush();
    expect(page.workers()).toHaveLength(1);

    tab.discard(false);
    h.transport.emitEvent(
      'Target.detachedFromTarget',
      {sessionId: worker.sessionId},
      tab.pageSessionId,
    );
    tab.detachPage();
    await h.flush();

    expect(events).toEqual(['workercreated', 'workerdestroyed', 'close']);
    expect(page.isClosed()).toBe(true);
  });

  for (const detachFirst of [false, true]) {
    it(`should fail pending worker requests when a tab is discarded (${detachFirst ? 'detach first' : 'subtype first'})`, async () => {
      const h = createHarness();
      await h.attach();

      const tab = h.attachTab(
        `worker-req-${detachFirst ? 'detach' : 'subtype'}`,
      );
      await h.flush();
      const page = (await h.browser.targets()[0]!.page())!;
      const requests: HTTPRequest[] = [];
      const failedRequests: HTTPRequest[] = [];
      page.on(PageEvent.Request, request => {
        requests.push(request);
      });
      page.on(PageEvent.RequestFailed, request => {
        failedRequests.push(request);
      });

      const worker = h.attachChild(
        tab.pageSessionId,
        'dedicated-worker-req',
        'worker',
        {url: 'https://example.com/worker.js'},
      );
      await h.flush();
      expect(page.workers()).toHaveLength(1);

      h.transport.emitEvent(
        'Network.requestWillBeSent',
        {
          requestId: 'worker-request-1',
          loaderId: '',
          documentURL: 'https://example.com/worker.js',
          request: {
            url: 'https://example.com/hang',
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
        } satisfies Protocol.Network.RequestWillBeSentEvent,
        worker.sessionId,
      );
      await h.flush();
      expect(requests).toHaveLength(1);
      expect(requests[0]!.failure()).toBeNull();

      const detachWorker = () => {
        h.transport.emitEvent(
          'Target.detachedFromTarget',
          {sessionId: worker.sessionId},
          tab.pageSessionId,
        );
      };
      if (detachFirst) {
        detachWorker();
        tab.detachPage();
        tab.updateTab({subtype: 'discarded'});
      } else {
        tab.discard(false);
        detachWorker();
        tab.detachPage();
      }
      await h.flush();

      expect(page.isClosed()).toBe(true);
      expect(requests[0]!.failure()).toEqual({errorText: 'net::ERR_ABORTED'});
      expect(failedRequests).toEqual([requests[0]]);
    });
  }

  it('should handle tab discard racing with in-flight page(), asPage(), and browser.pages() calls', async () => {
    const h = createHarness();
    await h.attach();

    const attachActive = async (suffix: string) => {
      const tab = h.attachTab(suffix);
      await h.flush();
      const target = h.browser.targets().find(candidate => {
        return candidate._targetId === `page-${suffix}`;
      })!;
      return {tab, target};
    };

    // Case 1: Discard synchronously before CdpPage._create microtask runs.
    const a = await attachActive('race-a');
    const b = await attachActive('race-b');
    const sentBefore = h.transport.sentMessages.length;

    const pagePromiseA = a.target.page();
    const sharedAsPageA = a.target.asPage();
    const ownAsPageB = b.target.asPage();
    a.tab.discard();
    b.tab.discard();

    await expect(pagePromiseA).resolves.toBeNull();
    await expect(sharedAsPageA).rejects.toThrow(
      'Cannot create a page for a discarded target.',
    );
    await expect(ownAsPageB).rejects.toThrow(
      'Cannot create a page for a discarded target.',
    );
    expect(
      h.transport.sentMessages.slice(sentBefore).filter(msg => {
        return msg.method === 'Page.getFrameTree';
      }),
    ).toEqual([]);

    // Case 2: Discard while CdpPage.#initialize() awaits Page.getFrameTree.
    const c = await attachActive('race-c');
    const d = await attachActive('race-d');
    const discardedSessions = new Set<string>();
    h.transport.onSend = msg => {
      if (
        msg.method === 'Page.getFrameTree' &&
        msg.sessionId &&
        !discardedSessions.has(msg.sessionId)
      ) {
        discardedSessions.add(msg.sessionId);
        (msg.sessionId === c.tab.pageSessionId ? c : d).tab.discard();
      }
    };

    const pagesCall = h.browser.pages();
    const pageCallC = c.target.page();
    const sharedAsPageC = c.target.asPage();
    const ownAsPageD = d.target.asPage();

    await expect(pageCallC).resolves.toBeNull();
    await expect(pagesCall).resolves.toEqual([]);
    await expect(sharedAsPageC).rejects.toThrow(
      'Cannot create a page for a discarded target.',
    );
    await expect(ownAsPageD).rejects.toThrow(
      'Cannot create a page for a discarded target.',
    );
    expect(discardedSessions.size).toBe(2);
  });

  it('should ignore extension page targets discarded while extension.pages() is in flight', async () => {
    const h = createHarness();
    await h.attach();

    const extId = 'abcdefghijklmnopabcdefghijklmnop';
    h.transport.rpcHandlers.set('Extensions.getExtensions', () => {
      return {
        result: {
          extensions: [
            {
              id: extId,
              version: '1.0.0',
              name: 'Test Extension',
              path: '/tmp/test-extension',
              enabled: true,
            },
          ],
        },
      };
    });

    const discardTab = h.attachTab('ext-discard', {
      url: `chrome-extension://${extId}/popup.html`,
    });
    h.attachTab('ext-active', {
      url: `chrome-extension://${extId}/options.html`,
    });
    await h.flush();

    let discardedDuringInit = false;
    h.transport.onSend = msg => {
      if (
        msg.method === 'Page.getFrameTree' &&
        msg.sessionId === discardTab.pageSessionId &&
        !discardedDuringInit
      ) {
        discardedDuringInit = true;
        discardTab.discard();
      }
    };

    const extension = (await h.browser.extensions()).get(extId)!;
    const pages = await extension.pages();
    expect(discardedDuringInit).toBe(true);
    expect(pages).toHaveLength(1);
    expect((pages[0]!.target() as CdpTarget)._targetId).toBe('page-ext-active');

    const failTab = h.attachTab('ext-fail', {
      url: `chrome-extension://${extId}/broken.html`,
    });
    await h.flush();
    h.transport.errorFor = msg => {
      return msg.sessionId === failTab.pageSessionId &&
        msg.method === 'Page.enable'
        ? `'Page.enable' wasn't found`
        : undefined;
    };
    await expect(extension.pages()).rejects.toThrow(
      /'Page\.enable' wasn't found/,
    );
  });

  it('should return null from page() and reject asPage() on a DevTools tab target after reload', async () => {
    const h = createHarness();
    await h.attach();

    const tab = h.attachTab('devtools', {
      url: 'devtools://devtools/bundled/devtools_app.html',
      discarded: true,
    });
    await h.flush();

    const [devtoolsTabTarget] = h.browser.targets({includeDiscarded: true});
    expect(devtoolsTabTarget).toBeInstanceOf(OtherTarget);
    expect(devtoolsTabTarget).not.toBeInstanceOf(DevToolsTarget);
    expect(devtoolsTabTarget!.type()).toBe('tab');
    expect(devtoolsTabTarget!.isDiscarded()).toBe(true);

    tab.updateTab({subtype: undefined});
    await h.flush();

    expect(devtoolsTabTarget!.isDiscarded()).toBe(false);
    const sentBefore = h.transport.sentMessages.length;
    await expect(devtoolsTabTarget!.page()).resolves.toBeNull();
    await expect(devtoolsTabTarget!.asPage()).rejects.toThrow(
      'Cannot create a page for a tab target.',
    );
    expect(h.sentTo(tab.tabSessionId, sentBefore)).toEqual([]);
  });

  it('should pass newWindow: true when creating a window page in a context with only discarded tabs', async () => {
    const h = createHarness();
    await h.attach();

    const createTargetCalls: Protocol.Target.CreateTargetRequest[] = [];
    const createdTabs: Array<ReturnType<typeof h.attachTab>> = [];
    let createdCount = 0;

    h.transport.rpcHandlers.set('Target.createBrowserContext', () => {
      return {result: {browserContextId: 'ctx-1'}};
    });
    h.transport.rpcHandlers.set('Target.createTarget', msg => {
      const params = msg.params as Protocol.Target.CreateTargetRequest;
      createTargetCalls.push(params);
      const id = `ctx-${++createdCount}`;
      return {
        result: {targetId: `page-${id}`},
        afterResponse: () => {
          createdTabs.push(
            h.attachTab(id, {
              url: params.url,
              browserContextId: params.browserContextId,
            }),
          );
        },
      };
    });

    const context = await h.browser.createBrowserContext();
    await context.newPage({type: 'window'});

    expect(createTargetCalls).toHaveLength(1);
    expect(createTargetCalls[0]?.newWindow).toBeUndefined();

    createdTabs[0]!.discard();
    await h.flush();

    expect(context.targets()).toEqual([]);
    expect(context.targets({includeDiscarded: true})).toHaveLength(1);

    await context.newPage({type: 'window'});

    expect(createTargetCalls).toHaveLength(2);
    expect(createTargetCalls[1]).toMatchObject({
      browserContextId: 'ctx-1',
      newWindow: true,
    });
  });
});
