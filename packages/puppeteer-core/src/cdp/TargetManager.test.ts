/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';

import type {ConnectionTransport} from '../common/ConnectionTransport.js';

import {CdpBrowser} from './Browser.js';
import {Connection} from './Connection.js';

interface SentMessage {
  id: number;
  method: string;
  sessionId?: string;
}

/**
 * Answers every command with an empty result. Calls `onBrowserAutoAttach`
 * when the browser-level `Target.setAutoAttach` command arrives, like Chrome
 * reports the targets that exist when Puppeteer connects.
 */
class MockTransport implements ConnectionTransport {
  onmessage?: (message: string) => void;
  onclose?: () => void;
  onBrowserAutoAttach?: () => void;

  send(message: string): void {
    const msg = JSON.parse(message) as SentMessage;
    queueMicrotask(() => {
      if (msg.method === 'Target.setAutoAttach' && !msg.sessionId) {
        this.onBrowserAutoAttach?.();
      }
      this.onmessage?.(
        JSON.stringify({id: msg.id, sessionId: msg.sessionId, result: {}}),
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

function createBrowser(transport: MockTransport): CdpBrowser {
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
  return new CdpBrowser(
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
}

describe('TargetManager', function () {
  it(
    'should finish initialization if a tab detaches before its page target attaches',
    {timeout: 5000},
    async () => {
      const transport = new MockTransport();
      const browser = createBrowser(transport);
      transport.onBrowserAutoAttach = () => {
        const tabInfo: Protocol.Target.TargetInfo = {
          targetId: 'tab-gone',
          type: 'tab',
          title: '',
          url: '',
          attached: true,
          canAccessOpener: false,
        };
        transport.emitEvent('Target.targetCreated', {targetInfo: tabInfo});
        transport.emitEvent('Target.attachedToTarget', {
          sessionId: 'session-tab-gone',
          targetInfo: tabInfo,
          waitingForDebugger: false,
        });
        // The tab detaches before Chrome attaches its page target. Chrome does
        // not send Target.targetDestroyed here.
        transport.emitEvent('Target.detachedFromTarget', {
          sessionId: 'session-tab-gone',
        });
      };

      await browser._attach(undefined);

      expect(browser.targets()).toEqual([]);
    },
  );
});
