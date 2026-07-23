/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {afterEach, describe, it} from 'node:test';

import expect from 'expect';
import sinon from 'sinon';

import {BrowserEvent} from '../api/Browser.js';
import type {CDPSessionEvents, CommandOptions} from '../api/CDPSession.js';
import type {Page} from '../api/Page.js';
import {TargetCloseError, TimeoutError} from '../common/Errors.js';
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
      expect(browser.listenerCount(BrowserEvent.Disconnected)).toBe(0);
      expect(browser.listenerCount(BrowserEvent.TargetCreated)).toBe(0);
      expect(browser.listenerCount(BrowserEvent.TargetChanged)).toBe(0);
    });

    it('should stop waiting when the browser disconnects', async () => {
      const connection = new MockConnection();
      const browser = new CdpBrowser(connection as unknown as Connection, []);
      connection.command.resolve({targetId: 'tab'});

      const launchPromise = browser.launchPWA({
        manifestId: 'https://example.com/',
        timeout: 0,
      });
      await new Promise(resolve => {
        setImmediate(resolve);
      });
      browser.emit(BrowserEvent.Disconnected, undefined);

      await expect(launchPromise).rejects.toBeInstanceOf(TargetCloseError);
      expect(browser.listenerCount(BrowserEvent.Disconnected)).toBe(0);
      expect(browser.listenerCount(BrowserEvent.TargetCreated)).toBe(0);
      expect(browser.listenerCount(BrowserEvent.TargetChanged)).toBe(0);
    });

    it('should stop while the page is being created', async () => {
      const connection = new MockConnection();
      const browser = new CdpBrowser(connection as unknown as Connection, []);
      const pageDeferred = Deferred.create<Page>();
      const target = {
        page: () => {
          return pageDeferred.valueOrThrow();
        },
      } as unknown as CdpTarget;
      sinon.stub(browser, 'waitForTarget').resolves(target);
      connection.command.resolve({targetId: 'tab'});

      const launchPromise = browser.launchPWA({
        manifestId: 'https://example.com/',
        timeout: 0,
      });
      await new Promise(resolve => {
        setImmediate(resolve);
      });
      browser.emit(BrowserEvent.Disconnected, undefined);

      await expect(launchPromise).rejects.toBeInstanceOf(TargetCloseError);
      pageDeferred.resolve({} as Page);
      await new Promise(resolve => {
        setImmediate(resolve);
      });
      expect(browser.listenerCount(BrowserEvent.Disconnected)).toBe(0);
    });
  });
});
