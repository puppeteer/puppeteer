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
});
