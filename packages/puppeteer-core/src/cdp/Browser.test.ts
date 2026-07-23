/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {BrowserEvent} from '../api/Browser.js';
import type {CDPSessionEvents, CommandOptions} from '../api/CDPSession.js';
import {TimeoutError} from '../common/Errors.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {Deferred} from '../util/Deferred.js';

import {CdpBrowser} from './Browser.js';
import type {Connection} from './Connection.js';

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
  describe('launchPWA', function () {
    it('should apply the timeout while the protocol command is pending', async () => {
      const connection = new MockConnection();
      const browser = new CdpBrowser(connection as unknown as Connection, []);

      const launchPromise = browser.launchPWA({
        manifestId: 'https://example.com/',
        timeout: 1,
      });
      await expect(launchPromise).rejects.toBeInstanceOf(TimeoutError);
      expect(connection.commandTimeout).toBe(1);

      connection.command.resolve({targetId: 'tab'});
      await new Promise(resolve => {
        setImmediate(resolve);
      });
      expect(browser.listenerCount(BrowserEvent.TargetCreated)).toBe(0);
      expect(browser.listenerCount(BrowserEvent.TargetChanged)).toBe(0);
    });
  });
});
