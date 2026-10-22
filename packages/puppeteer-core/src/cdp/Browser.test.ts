/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, describe, it} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

import type {CDPSessionEvents, CommandOptions} from '../api/CDPSession.js';
import type {Page} from '../api/Page.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {Deferred} from '../util/Deferred.js';

import {CdpBrowser} from './Browser.js';
import type {Connection} from './Connection.js';
import type {CdpTarget} from './Target.js';

class MockConnection extends EventEmitter<CDPSessionEvents> {
  rejectEmulateNetworkConditionsCalls = false;
  readonly command = Deferred.create<{targetId: string}>();
  commandTimeout?: number;

  send(
    _method: string,
    _params: unknown,
    options?: CommandOptions,
  ): Promise<{targetId: string}> {
    this.commandTimeout = options?.timeout;
    return this.command.valueOrThrow();
  }

  dispose(): void {
    this.disposed = true;
  }

  disposed = false;
}

describe('CdpBrowser', function () {
  afterEach(() => {
    sinon.restore();
  });

  describe('launchPWA', function () {
    it('should apply the timeout while waiting for the page target', async () => {
      const connection = new MockConnection();
      const browser = new CdpBrowser(
        connection as unknown as Connection,
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
        () => {
          return undefined;
        },
      );
      const page = {} as Page;
      const target = {
        page: async () => {
          return page;
        },
      } as unknown as CdpTarget;
      const waitForTarget = sinon
        .stub(browser, 'waitForTarget')
        .resolves(target);
      connection.command.resolve({targetId: 'tab'});

      const result = await browser.launchPWA({
        manifestId: 'https://example.com/',
        timeout: 123,
      });

      expect(result).toBe(page);
      expect(connection.commandTimeout).toBeUndefined();
      expect(waitForTarget.calledOnce).toBe(true);
      expect(waitForTarget.firstCall.args[1]).toEqual({timeout: 123});
    });
  });

  describe('close', function () {
    it('should disconnect even when the close callback throws', async () => {
      const connection = new MockConnection();
      const browser = new CdpBrowser(
        connection as unknown as Connection,
        [],
        undefined,
        undefined,
        async () => {
          throw new Error('closeBrowser failed');
        },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        () => {
          return undefined;
        },
      );

      await expect(browser.close()).resolves.toBeUndefined();
      expect(connection.disposed).toBe(true);
    });
  });

  describe('installExtension', function () {
    it('should destroy pre-existing service_worker target for the same extension id', async () => {
      const connection = new MockConnection() as MockConnection & {
        isAutoAttached: (targetId: string) => boolean;
        _session: (sessionId: string) => unknown;
        _createSession: () => Promise<unknown>;
      };
      connection.isAutoAttached = () => {
        return true;
      };
      connection._session = (sessionId: string) => {
        return {
          id: () => {
            return sessionId;
          },
          send: async () => {
            return {};
          },
        };
      };
      connection._createSession = async () => {
        return {};
      };

      const browser = new CdpBrowser(
        connection as unknown as Connection,
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
        () => {
          return undefined;
        },
      );
      const extId = 'abcdefghijklmnopabcdefghijklmnop';
      sinon.stub(connection, 'send').callsFake(async (method: string) => {
        if (method === 'Extensions.loadUnpacked') {
          const newTargetInfo = {
            targetId: 'new-sw',
            type: 'service_worker',
            title: '',
            url: `chrome-extension://${extId}/background.js`,
            attached: true,
            canAccessOpener: false,
          };
          connection.emit('Target.targetCreated', {targetInfo: newTargetInfo});
          connection.emit('Target.attachedToTarget', {
            sessionId: 'session-new',
            targetInfo: newTargetInfo,
            waitingForDebugger: false,
          });
          return {id: extId} as unknown as {targetId: string};
        }
        return {targetId: ''};
      });

      await browser._attach(undefined);

      const oldTargetInfo = {
        targetId: 'old-sw',
        type: 'service_worker',
        title: '',
        url: `chrome-extension://${extId}/background.js`,
        attached: true,
        canAccessOpener: false,
      };
      connection.emit('Target.targetCreated', {targetInfo: oldTargetInfo});
      connection.emit('Target.attachedToTarget', {
        sessionId: 'session-old',
        targetInfo: oldTargetInfo,
        waitingForDebugger: false,
      });

      const oldTarget = await browser.waitForTarget(target => {
        return target.type() === 'service_worker';
      });
      expect(browser.targets()).toContain(oldTarget);

      const destroyedTargets: CdpTarget[] = [];
      browser.on('targetdestroyed', target => {
        destroyedTargets.push(target as CdpTarget);
      });

      const returnedId = await browser.installExtension('/path/to/ext');
      expect(returnedId).toBe(extId);
      expect(destroyedTargets).toEqual([oldTarget]);
      expect(
        browser.targets().map(target => {
          return target._targetId;
        }),
      ).toEqual(['new-sw']);
    });
  });
});
