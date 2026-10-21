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
import {TimeoutSettings} from '../common/TimeoutSettings.js';
import {Deferred} from '../util/Deferred.js';

import {CdpBrowser} from './Browser.js';
import type {CdpCDPSession} from './CdpSession.js';
import type {Connection} from './Connection.js';
import {FrameManager} from './FrameManager.js';
import type {CdpPage} from './Page.js';
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

  describe('visualizeInput', function () {
    class MockFrameSession extends EventEmitter<CDPSessionEvents> {
      readonly sent: Array<{method: string; params?: unknown}> = [];

      constructor(private readonly frameId = 'main') {
        super();
      }

      id(): string {
        return this.frameId;
      }

      async send(method: string, params?: unknown): Promise<unknown> {
        this.sent.push({method, params});
        if (method === 'Page.getFrameTree') {
          return {
            frameTree: {
              frame: {
                id: this.frameId,
                loaderId: 'loader-1',
                url: 'https://example.com/',
                domainAndRegistry: 'example.com',
                securityOrigin: 'https://example.com',
                mimeType: 'text/html',
                secureContextType: 'Secure',
                crossOriginIsolatedContextType: 'NotIsolated',
                gatedAPIFeatures: [],
              },
              childFrames:
                this.frameId === 'main'
                  ? [
                      {
                        frame: {
                          id: 'child-1',
                          parentId: 'main',
                          loaderId: 'loader-2',
                          url: 'https://example.com/child',
                          domainAndRegistry: 'example.com',
                          securityOrigin: 'https://example.com',
                          mimeType: 'text/html',
                          secureContextType: 'Secure',
                          crossOriginIsolatedContextType: 'NotIsolated',
                          gatedAPIFeatures: [],
                        },
                      },
                    ]
                  : undefined,
            },
          };
        }
        if (method === 'Page.createIsolatedWorld') {
          return {executionContextId: 1};
        }
        return {};
      }
    }

    function createBrowser(): CdpBrowser {
      const connection = new MockConnection();
      return new CdpBrowser(
        connection as unknown as Connection,
        [],
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        false,
        undefined,
        undefined,
        undefined,
        () => {
          return undefined;
        },
      );
    }

    function createFrameManager(
      browser: CdpBrowser,
      client: MockFrameSession,
    ): FrameManager {
      const page = {
        browser: () => {
          return browser;
        },
        _inputVisualization: () => {
          return browser._inputVisualization();
        },
        isClosed: () => {
          return false;
        },
      } as unknown as CdpPage;
      return new FrameManager(
        client as unknown as CdpCDPSession,
        page,
        new TimeoutSettings(),
        () => {
          return undefined;
        },
      );
    }

    it('should update the browser default and forward to all open pages', async () => {
      const browser = createBrowser();
      const page1 = {
        visualizeInput: sinon.stub().resolves(),
      } as unknown as Page;
      const page2 = {
        visualizeInput: sinon.stub().resolves(),
      } as unknown as Page;
      sinon.stub(browser, 'pages').resolves([page1, page2]);

      expect(browser._inputVisualization()).toEqual({clicks: false});

      await browser.visualizeInput({clicks: true});
      expect(browser._inputVisualization()).toEqual({clicks: true});
      expect((page1.visualizeInput as sinon.SinonStub).firstCall.args).toEqual([
        {clicks: true},
      ]);
      expect((page2.visualizeInput as sinon.SinonStub).firstCall.args).toEqual([
        {clicks: true},
      ]);

      await browser.visualizeInput(null);
      expect(browser._inputVisualization()).toEqual({clicks: false});
      expect((page1.visualizeInput as sinon.SinonStub).secondCall.args).toEqual(
        [null],
      );
    });

    it('should apply input visualization to new and existing frames and OOPIFs', async () => {
      const browser = createBrowser();
      sinon.stub(browser, 'pages').resolves([]);
      await browser.visualizeInput({clicks: true});

      const mainSession = new MockFrameSession('main');
      const frameManager = createFrameManager(browser, mainSession);
      await frameManager.initialize(mainSession as unknown as CdpCDPSession);

      expect(
        mainSession.sent.filter(c => {
          return c.method === 'Page.setInputVisualization';
        }),
      ).toEqual([
        {method: 'Page.setInputVisualization', params: {clicks: true}},
      ]);

      // Attach an out-of-process iframe for child-1; it should inherit the
      // page's setting on initialize.
      const oopifSession = new MockFrameSession('child-1');
      const childFrame = frameManager.frame('child-1')!;
      childFrame.updateClient(oopifSession as unknown as CdpCDPSession);
      await frameManager.initialize(
        oopifSession as unknown as CdpCDPSession,
        childFrame,
      );
      expect(
        oopifSession.sent.filter(c => {
          return c.method === 'Page.setInputVisualization';
        }),
      ).toEqual([
        {method: 'Page.setInputVisualization', params: {clicks: true}},
      ]);

      // Disabling via setInputVisualization(null) sends {clicks: false} to
      // both the main frame session and the OOPIF session.
      await frameManager.setInputVisualization(null);
      expect(
        mainSession.sent.filter(c => {
          return c.method === 'Page.setInputVisualization';
        }),
      ).toEqual([
        {method: 'Page.setInputVisualization', params: {clicks: true}},
        {method: 'Page.setInputVisualization', params: {clicks: false}},
      ]);
      expect(
        oopifSession.sent.filter(c => {
          return c.method === 'Page.setInputVisualization';
        }),
      ).toEqual([
        {method: 'Page.setInputVisualization', params: {clicks: true}},
        {method: 'Page.setInputVisualization', params: {clicks: false}},
      ]);
    });
  });
});
