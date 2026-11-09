/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helpers for unit tests that drive a `CdpBrowser` through a mock CDP
 * connection. This file is not part of the npm package.
 */

import type {Protocol} from 'devtools-protocol';

import type {Target} from '../api/Target.js';
import type {ConnectionTransport} from '../common/ConnectionTransport.js';

import {CdpBrowser} from './Browser.js';
import {Connection} from './Connection.js';
import type {CdpTarget} from './Target.js';

export interface SentMessage {
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

export class MockTransport implements ConnectionTransport {
  onmessage?: (message: string) => void;
  onclose?: () => void;
  sentMessages: SentMessage[] = [];
  onBrowserAutoAttach?: () => void;
  /**
   * Returns an error message to make the browser fail a command.
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

export function makeTargetInfo(
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

export function targetIds(targets: Target[]): string[] {
  return targets.map(target => {
    return (target as CdpTarget)._targetId;
  });
}

export interface MockChildTarget {
  info: Protocol.Target.TargetInfo;
  sessionId: string;
}

export interface MockTab {
  tabSessionId: string;
  /**
   * The page target that the tab attached at creation, if any.
   */
  page: MockChildTarget | undefined;
  updateTab(overrides: Partial<Protocol.Target.TargetInfo>): void;
  detachChild(sessionId: string): void;
  close(): void;
}

export interface MockCdpHarness {
  browser: CdpBrowser;
  transport: MockTransport;
  /**
   * Waits until all pending CDP messages and events are handled.
   */
  flush(): Promise<void>;
  attachChild(
    parentSessionId: string,
    targetId: string,
    type: string,
    overrides?: Partial<Protocol.Target.TargetInfo>,
  ): MockChildTarget;
  attachTab(
    id: string,
    tabOpts?: {url?: string; attachPage?: boolean},
  ): MockTab;
  /**
   * Attaches the browser. `onAutoAttach` runs when the browser enables
   * auto-attach, so it can report the targets that exist at start.
   */
  attach(onAutoAttach?: () => void): Promise<void>;
}

export function createHarness(): MockCdpHarness {
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
  ): MockChildTarget => {
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
  ): MockTab => {
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

    let page: MockChildTarget | undefined;
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

export function recordTargetEvents(h: MockCdpHarness): string[] {
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
