/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';

import type {IsPageTargetCallback} from '../api/Browser.js';
import type {Target} from '../api/Target.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';
import type {Viewport} from '../common/Viewport.js';

import {CdpBrowser} from './Browser.js';
import {Connection} from './Connection.js';
import {OtherTarget, type CdpTarget} from './Target.js';

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
  /**
   * Called before the response to `Target.setAutoAttach` for a session. The
   * browser attaches the existing children of a target at this time.
   */
  onSessionAutoAttach?: (sessionId: string) => void;
  /**
   * Returns an error message to make the command fail.
   */
  errorFor?: (msg: SentMessage) => string | undefined;

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
            error: {code: -32000, message: errorMessage},
          }),
        );
        return;
      }
      if (msg.method === 'Target.setAutoAttach' && !msg.sessionId) {
        this.onBrowserAutoAttach?.();
      }
      if (msg.method === 'Target.setAutoAttach' && msg.sessionId) {
        this.onSessionAutoAttach?.(msg.sessionId);
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

function createHarness(
  options: {
    defaultViewport?: Viewport;
    isPageTarget?: IsPageTargetCallback;
  } = {},
) {
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
    options.defaultViewport,
    undefined,
    undefined,
    undefined,
    options.isPageTarget,
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
    let info = makeTargetInfo(targetId, type, overrides);
    transport.emitEvent('Target.targetCreated', {targetInfo: info});
    transport.emitEvent(
      'Target.attachedToTarget',
      {sessionId, targetInfo: info, waitingForDebugger: false},
      parentSessionId,
    );
    return {
      sessionId,
      update(changes: Partial<Protocol.Target.TargetInfo>) {
        info = {...info, ...changes};
        transport.emitEvent('Target.targetInfoChanged', {targetInfo: info});
      },
      detach() {
        transport.emitEvent(
          'Target.detachedFromTarget',
          {sessionId},
          parentSessionId,
        );
      },
    };
  };

  const attachTab = (id: string, url = 'https://example.com/') => {
    const tab = attachTabWithoutPage(id, {url});
    const page = attachChild(tab.tabSessionId, `page-${id}`, 'page', {url});
    return {...tab, page};
  };

  /**
   * Attaches a tab target without a page target, like Chrome does for a
   * discarded tab.
   */
  const attachTabWithoutPage = (
    id: string,
    overrides: Partial<Protocol.Target.TargetInfo> = {},
  ) => {
    const tabId = `tab-${id}`;
    const tabSessionId = `session-${tabId}`;
    let tabInfo = makeTargetInfo(tabId, 'tab', overrides);
    transport.emitEvent('Target.targetCreated', {targetInfo: tabInfo});
    transport.emitEvent('Target.attachedToTarget', {
      sessionId: tabSessionId,
      targetInfo: tabInfo,
      waitingForDebugger: false,
    });

    return {
      tabSessionId,
      update(changes: Partial<Protocol.Target.TargetInfo>) {
        tabInfo = {...tabInfo, ...changes};
        transport.emitEvent('Target.targetInfoChanged', {targetInfo: tabInfo});
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
    attachTabWithoutPage,
    async attach() {
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

function findTarget(h: ReturnType<typeof createHarness>, id: string): Target {
  const target = h.browser.targets().find(target => {
    return (target as CdpTarget)._targetId === id;
  });
  if (!target) {
    throw new Error(`Missing target ${id}`);
  }
  return target;
}

describe('CdpTarget', function () {
  it('should report tab targets and their page targets', async () => {
    const h = createHarness();
    await h.attach();
    const events = recordTargetEvents(h);

    h.attachTab('main');
    await h.flush();

    expect(events).toEqual([
      'targetcreated:tab-main',
      'targetcreated:page-main',
    ]);
    expect(targetIds(h.browser.targets())).toEqual(['tab-main', 'page-main']);

    const tab = findTarget(h, 'tab-main');
    const pageTarget = findTarget(h, 'page-main');
    expect(tab.type()).toBe('tab');
    expect(tab.parent()).toBeUndefined();
    expect(tab.subtype()).toBeUndefined();
    expect(pageTarget.type()).toBe('page');
    expect(pageTarget.parent()).toBe(tab);
    expect(pageTarget.subtype()).toBeUndefined();
  });

  it('should not treat a tab target with a DevTools URL as a page target', async () => {
    const h = createHarness();
    await h.attach();
    h.attachTab('devtools', 'devtools://devtools/bundled/devtools_app.html');
    await h.flush();

    const tab = findTarget(h, 'tab-devtools');
    expect(tab).toBeInstanceOf(OtherTarget);
    const page = (await findTarget(h, 'page-devtools').page())!;
    expect(page).not.toBeNull();
    await expect(tab.page()).resolves.toBe(page);
  });

  it('should return one page for each tab', async () => {
    const h = createHarness();
    await h.attach();
    h.attachTab('main');
    await h.flush();

    const tab = findTarget(h, 'tab-main');
    const pageTarget = findTarget(h, 'page-main');
    const page = (await pageTarget.page())!;
    expect(page).not.toBeNull();
    await expect(tab.page()).resolves.toBe(page);
    await expect(tab.asPage()).resolves.toBe(page);
    await expect(h.browser.pages()).resolves.toEqual([page]);
    expect(page.target()).toBe(pageTarget);
    expect(page.target().parent()).toBe(tab);
  });

  it('should report prerender targets without creating a page for them', async () => {
    const h = createHarness();
    await h.attach();
    const tab = h.attachTab('main');
    await h.flush();
    const page = (await findTarget(h, 'page-main').page())!;
    const events = recordTargetEvents(h);

    h.attachChild(tab.tabSessionId, 'page-prerender', 'page', {
      subtype: 'prerender',
      url: 'https://example.com/prerender',
    });
    await h.flush();

    expect(events).toEqual(['targetcreated:page-prerender']);
    const prerenderTarget = findTarget(h, 'page-prerender');
    expect(prerenderTarget.subtype()).toBe('prerender');
    expect(prerenderTarget.parent()).toBe(findTarget(h, 'tab-main'));
    await expect(prerenderTarget.page()).resolves.toBeNull();
    await expect(prerenderTarget.asPage()).rejects.toThrow(
      'Cannot create a page for a prerender target.',
    );
    await expect(findTarget(h, 'tab-main').page()).resolves.toBe(page);
    await expect(h.browser.pages()).resolves.toEqual([page]);
  });

  it('should keep the page when a prerendered target activates', async () => {
    const h = createHarness();
    await h.attach();
    const tab = h.attachTab('main');
    await h.flush();
    const page = (await findTarget(h, 'page-main').page())!;
    const prerender = h.attachChild(
      tab.tabSessionId,
      'page-prerender',
      'page',
      {subtype: 'prerender', url: 'https://example.com/prerender'},
    );
    await h.flush();
    const events = recordTargetEvents(h);

    // Chrome detaches the old primary target before it activates the
    // prerendered target. The transport handles each CDP message fully
    // before the next one.
    tab.page.detach();
    await h.flush();
    prerender.update({subtype: undefined});
    await h.flush();

    expect(events).toEqual([
      'targetdestroyed:page-main',
      'targetchanged:page-prerender',
    ]);
    const activatedTarget = findTarget(h, 'page-prerender');
    expect(activatedTarget.subtype()).toBeUndefined();
    expect(page.target()).toBe(activatedTarget);
    await expect(activatedTarget.page()).resolves.toBe(page);
    await expect(activatedTarget.asPage()).resolves.toBe(page);
    await expect(findTarget(h, 'tab-main').page()).resolves.toBe(page);
    await expect(h.browser.pages()).resolves.toEqual([page]);
  });

  it('should emit targetchanged for tab and page targets when the URL changes', async () => {
    const h = createHarness();
    await h.attach();
    const tab = h.attachTab('main');
    await h.flush();
    const events = recordTargetEvents(h);

    tab.update({url: 'https://example.com/next'});
    tab.page.update({url: 'https://example.com/next'});
    await h.flush();

    expect(events).toEqual([
      'targetchanged:tab-main',
      'targetchanged:page-main',
    ]);
  });

  it('should not emit targetchanged when only the title changes', async () => {
    const h = createHarness();
    await h.attach();
    const tab = h.attachTab('main');
    await h.flush();
    const events = recordTargetEvents(h);

    tab.page.update({title: 'New title'});
    await h.flush();

    expect(events).toEqual([]);
  });

  it('should emit targetdestroyed for prerender targets that never activate', async () => {
    const h = createHarness();
    await h.attach();
    const tab = h.attachTab('main');
    const prerender = h.attachChild(
      tab.tabSessionId,
      'page-prerender',
      'page',
      {subtype: 'prerender', url: 'https://example.com/prerender'},
    );
    await h.flush();
    const events = recordTargetEvents(h);

    prerender.detach();
    await h.flush();

    expect(events).toEqual(['targetdestroyed:page-prerender']);
    expect(targetIds(h.browser.targets())).toEqual(['tab-main', 'page-main']);
  });

  it('should emit targetdestroyed for the page and the tab when a tab closes', async () => {
    const h = createHarness();
    await h.attach();
    const tab = h.attachTab('main');
    await h.flush();
    const page = (await findTarget(h, 'page-main').page())!;
    const events = recordTargetEvents(h);

    tab.page.detach();
    tab.close();
    await h.flush();

    expect(events).toEqual([
      'targetdestroyed:page-main',
      'targetdestroyed:tab-main',
    ]);
    expect(h.browser.targets()).toEqual([]);
    expect(page.isClosed()).toBe(true);
    await expect(h.browser.pages()).resolves.toEqual([]);
  });

  it('should force a page with asPage() for a tab whose content is not a page target', async () => {
    const h = createHarness({
      isPageTarget: () => {
        return false;
      },
    });
    await h.attach();
    h.attachTab('main');
    await h.flush();

    const tab = findTarget(h, 'tab-main');
    await expect(tab.page()).resolves.toBeNull();
    await expect(h.browser.pages()).resolves.toEqual([]);
    const page = await tab.asPage();
    expect(page).toBeTruthy();
    expect(page.target()).toBe(findTarget(h, 'page-main'));
  });

  it('should not give a page that failed to set its viewport to an activated target', async () => {
    const viewport = {width: 800, height: 600};
    const h = createHarness({defaultViewport: viewport});
    await h.attach();
    const tab = h.attachTab('main');
    const prerender = h.attachChild(
      tab.tabSessionId,
      'page-prerender',
      'page',
      {subtype: 'prerender', url: 'https://example.com/prerender'},
    );
    await h.flush();

    // The first viewport command fails with an error that is not a
    // closed-target error.
    let failed = false;
    h.transport.errorFor = msg => {
      if (
        !failed &&
        msg.method === 'Emulation.setDeviceMetricsOverride' &&
        msg.sessionId === tab.page.sessionId
      ) {
        failed = true;
        return 'Viewport failure';
      }
      return undefined;
    };
    await expect(findTarget(h, 'page-main').page()).rejects.toThrow(
      'Viewport failure',
    );

    tab.page.detach();
    await h.flush();
    prerender.update({subtype: undefined});
    await h.flush();

    // The activated target creates a new page instead of the broken one.
    const page = (await findTarget(h, 'page-prerender').page())!;
    expect(page.viewport()).toEqual(viewport);
  });

  describe('discarded tabs', function () {
    it('should not report targets as discarded by default', async () => {
      const h = createHarness();
      await h.attach();
      h.attachTab('main');
      await h.flush();

      expect(findTarget(h, 'tab-main').isDiscarded()).toBe(false);
      expect(findTarget(h, 'page-main').isDiscarded()).toBe(false);
    });

    it('should only report tab targets as discarded', async () => {
      const h = createHarness();
      await h.attach();
      const tab = h.attachTab('main');
      await h.flush();

      tab.page.update({subtype: 'discarded'});
      await h.flush();

      expect(findTarget(h, 'page-main').isDiscarded()).toBe(false);
    });

    it('should report a tab as discarded when Chrome discards it', async () => {
      const h = createHarness();
      await h.attach();
      const tab = h.attachTab('main');
      await h.flush();
      const page = (await findTarget(h, 'page-main').page())!;
      const events = recordTargetEvents(h);

      tab.page.detach();
      tab.update({subtype: 'discarded'});
      await h.flush();

      // The order of the events is not defined.
      expect(events.sort()).toEqual([
        'targetchanged:tab-main',
        'targetdestroyed:page-main',
      ]);
      const tabTarget = findTarget(h, 'tab-main');
      expect(tabTarget.isDiscarded()).toBe(true);
      expect(tabTarget.subtype()).toBe('discarded');
      expect(page.isClosed()).toBe(true);
      await expect(tabTarget.page()).resolves.toBeNull();
      await expect(tabTarget.asPage()).rejects.toThrow(
        'Cannot create a page for a discarded tab.',
      );
      await expect(h.browser.pages()).resolves.toEqual([]);
    });

    it('should close the page when the tab is discarded before its page target detaches', async () => {
      const h = createHarness();
      await h.attach();
      const tab = h.attachTab('main');
      await h.flush();
      const page = (await findTarget(h, 'page-main').page())!;
      let closeEvents = 0;
      page.on('close', () => {
        closeEvents++;
      });

      tab.update({subtype: 'discarded'});
      await h.flush();

      expect(page.isClosed()).toBe(true);
      await expect(findTarget(h, 'tab-main').page()).resolves.toBeNull();
      await expect(h.browser.pages()).resolves.toEqual([]);

      tab.page.detach();
      tab.close();
      await h.flush();
      expect(closeEvents).toBe(1);
    });

    it(
      'should connect to a browser with a discarded tab',
      {timeout: 5000},
      async () => {
        const h = createHarness();
        // A discarded tab has no page target, so it attaches no child.
        h.transport.onBrowserAutoAttach = () => {
          h.attachTabWithoutPage('main', {subtype: 'discarded'});
        };

        await h.attach();

        expect(targetIds(h.browser.targets())).toEqual(['tab-main']);
        expect(findTarget(h, 'tab-main').isDiscarded()).toBe(true);
        await expect(h.browser.pages()).resolves.toEqual([]);
      },
    );

    it(
      'should wait for the page of a loaded tab when Puppeteer connects',
      {timeout: 5000},
      async () => {
        const h = createHarness();
        h.transport.onBrowserAutoAttach = () => {
          h.attachTabWithoutPage('main');
        };
        h.transport.onSessionAutoAttach = sessionId => {
          if (sessionId === 'session-tab-main') {
            h.attachChild(sessionId, 'page-main', 'page');
          }
        };

        await h.attach();

        expect(targetIds(h.browser.targets())).toEqual([
          'tab-main',
          'page-main',
        ]);
        const page = await findTarget(h, 'tab-main').page();
        expect(page).not.toBeNull();
        await expect(h.browser.pages()).resolves.toEqual([page]);
      },
    );

    it('should report a tab that is discarded when Puppeteer attaches', async () => {
      const h = createHarness();
      await h.attach();
      const events = recordTargetEvents(h);

      h.attachTabWithoutPage('main', {subtype: 'discarded'});
      await h.flush();

      expect(events).toEqual(['targetcreated:tab-main']);
      const tabTarget = findTarget(h, 'tab-main');
      expect(tabTarget.isDiscarded()).toBe(true);
      expect(tabTarget.url()).toBe('https://example.com/');
      await expect(tabTarget.page()).resolves.toBeNull();
      await expect(h.browser.pages()).resolves.toEqual([]);
    });

    it('should give a new page to a discarded tab that loads again', async () => {
      const h = createHarness();
      await h.attach();
      const tab = h.attachTabWithoutPage('main', {subtype: 'discarded'});
      await h.flush();
      const events = recordTargetEvents(h);

      h.attachChild(tab.tabSessionId, 'page-main', 'page');
      tab.update({subtype: undefined});
      await h.flush();

      // The order of the events is not defined.
      expect(events.sort()).toEqual([
        'targetchanged:tab-main',
        'targetcreated:page-main',
      ]);
      const tabTarget = findTarget(h, 'tab-main');
      expect(tabTarget.isDiscarded()).toBe(false);
      const page = (await tabTarget.page())!;
      expect(page).not.toBeNull();
      expect(page.target()).toBe(findTarget(h, 'page-main'));
      await expect(h.browser.pages()).resolves.toEqual([page]);
    });
  });
});
