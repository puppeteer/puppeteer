/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {HTTPRequest} from 'puppeteer-core/internal/api/HTTPRequest.js';
import type {HTTPResponse} from 'puppeteer-core/internal/api/HTTPResponse.js';
import type {WebWorker} from 'puppeteer-core/internal/api/WebWorker.js';
import type {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';

import {getTestState, launch, setupTestBrowserHooks} from './mocha-utils.js';
import {isFavicon, waitEvent} from './utils.js';

describe('Browser specs', function () {
  setupTestBrowserHooks();

  describe('Browser.version', function () {
    it('should return version', async () => {
      const {browser} = await getTestState();

      const version = await browser.version();
      expect(version.length).toBeGreaterThan(0);
      expect(version.toLowerCase()).atLeastOneToContain(['firefox', 'chrome']);
    });
  });

  describe('Browser.userAgent', function () {
    it('should include Browser engine', async () => {
      const {browser, isChrome} = await getTestState();

      const userAgent = await browser.userAgent();
      expect(userAgent.length).toBeGreaterThan(0);
      if (isChrome) {
        expect(userAgent).toContain('WebKit');
      } else {
        expect(userAgent).toContain('Gecko');
      }
    });
    it('should include Browser name', async () => {
      const {browser, isChrome} = await getTestState();

      const userAgent = await browser.userAgent();
      expect(userAgent.length).toBeGreaterThan(0);
      if (isChrome) {
        expect(userAgent).toContain('Chrome');
      } else {
        expect(userAgent).toContain('Firefox');
      }
    });
  });

  describe('Browser.target', function () {
    it('should return browser target', async () => {
      const {browser} = await getTestState();

      const target = browser.target();
      expect(target.type()).toBe('browser');
    });
  });

  describe('Browser.process', function () {
    it('should return child_process instance', async () => {
      const {browser} = await getTestState();

      const process = await browser.process();
      expect(process!.pid).toBeGreaterThan(0);
    });
    it('should not return child_process for remote browser', async () => {
      const {browser, puppeteer} = await getTestState({
        skipContextCreation: true,
      });

      const browserWSEndpoint = browser.wsEndpoint();
      using remoteBrowser = await puppeteer.connect({
        browserWSEndpoint,
        protocol: browser.protocol,
      });
      expect(remoteBrowser.process()).toBe(null);
    });
    it('should keep connected after the last page is closed', async () => {
      const {browser, close} = await launch({});
      try {
        const pages = await browser.pages();
        await Promise.all(
          pages.map(page => {
            return page.close();
          }),
        );
        // Verify the browser is still connected.
        expect(browser.connected).toBe(true);
        // Verify the browser can open a new page.
        await browser.newPage();
      } finally {
        await close();
      }
    });
  });

  describe('Browser.connected', () => {
    let state: Awaited<ReturnType<typeof launch>> | undefined;

    before(async function () {
      this.timeout(30_000);
      state = await launch({}, {after: 'all'});
    });

    after(async () => {
      if (state?.browser) {
        const cleanupBrowser = await state.puppeteer
          .connect({
            browserWSEndpoint: state.browser.wsEndpoint(),
            protocol: state.browser.protocol,
          })
          .catch(() => {
            return undefined;
          });
        await cleanupBrowser?.close();
        state.browser.process()?.kill();
      }
      await state?.close();
    });

    it('should set the browser connected state', async () => {
      const {puppeteer} = state!;
      let currentBrowser = state!.browser;
      const browserWSEndpoint = currentBrowser.wsEndpoint();
      if (!currentBrowser.connected) {
        currentBrowser = await puppeteer.connect({
          browserWSEndpoint,
          protocol: currentBrowser.protocol,
        });
      }
      expect(currentBrowser.connected).toBe(true);
      await currentBrowser.disconnect();
      expect(currentBrowser.connected).toBe(false);

      const newBrowser = await puppeteer.connect({
        browserWSEndpoint,
        protocol: currentBrowser.protocol,
      });
      expect(newBrowser.connected).toBe(true);
      await newBrowser.disconnect();
      expect(newBrowser.connected).toBe(false);
    });
  });

  describe('Browser.screens', function () {
    it('should return default screen info', async () => {
      const {browser, isHeadless} = await getTestState();

      if (!isHeadless) {
        // In headful mode 'Browser.screens' returns the real
        // platform screens info which is not stable enough
        // for matching.
        throw new Error('Not testable in headful');
      }

      const screenInfos = await browser.screens();
      expect(screenInfos).toMatchObject([
        {
          availHeight: 600,
          availLeft: 0,
          availTop: 0,
          availWidth: 800,
          colorDepth: 24,
          devicePixelRatio: 1,
          height: 600,
          id: expect.any(String),
          isExtended: false,
          isInternal: false,
          isPrimary: true,
          label: '',
          left: 0,
          orientation: {angle: 0, type: 'landscapePrimary'},
          top: 0,
          width: 800,
        },
      ]);
    });
  });

  describe('Browser.add|removeScreen', function () {
    it('should add and remove a screen', async () => {
      const {browser} = await getTestState();
      const screenInfo = await browser.addScreen({
        left: 800,
        top: 0,
        width: 1600,
        height: 1200,
        colorDepth: 32,
        workAreaInsets: {bottom: 80},
        label: 'secondary',
      });
      expect(screenInfo).toMatchObject({
        availHeight: 1120,
        availLeft: 800,
        availTop: 0,
        availWidth: 1600,
        colorDepth: 32,
        devicePixelRatio: 1,
        height: 1200,
        id: expect.any(String),
        isExtended: true,
        isInternal: false,
        isPrimary: false,
        label: 'secondary',
        left: 800,
        orientation: {angle: 0, type: 'landscapePrimary'},
        top: 0,
        width: 1600,
      });
      expect((await browser.screens()).length).toBe(2);

      await browser.removeScreen(screenInfo.id);
      expect((await browser.screens()).length).toBe(1);
    });
  });

  describe('Browser.get|setWindowBounds', function () {
    it('should get and set browser window bounds', async () => {
      const {browser, context} = await getTestState();

      const initialBounds = {
        left: 10,
        top: 20,
        width: 800,
        height: 600,
      };
      const page = await context.newPage({
        type: 'window',
        windowBounds: initialBounds,
      });

      const windowId = await page.windowId();
      expect(await browser.getWindowBounds(windowId)).toMatchObject(
        initialBounds,
      );

      const setBounds = {
        left: 100,
        top: 200,
        width: 1600,
        height: 1200,
      };
      await browser.setWindowBounds(windowId, setBounds);
      expect(await browser.getWindowBounds(windowId)).toMatchObject(setBounds);
    });

    it('should set and get browser window maximized state', async () => {
      const {browser, context} = await getTestState();

      // Add a secondary screen.
      const screenInfo = await browser.addScreen({
        left: 800,
        top: 0,
        width: 1600,
        height: 1200,
      });

      // Open a window on the secondary screen.
      const page = await context.newPage({
        type: 'window',
        windowBounds: {
          left: screenInfo.availLeft + 50,
          top: screenInfo.availTop + 50,
          width: screenInfo.availWidth - 100,
          height: screenInfo.availHeight - 100,
        },
      });

      // Maximize the created window.
      const windowId = await page.windowId();
      await browser.setWindowBounds(windowId, {windowState: 'maximized'});

      // Expect the maximized window to be maximized.
      expect(await browser.getWindowBounds(windowId)).toMatchObject({
        windowState: 'maximized',
      });

      // Cleanup.
      await browser.removeScreen(screenInfo.id);
    });
  });

  describe('Browser.on("console")', function () {
    it('should report console messages from pages', async () => {
      const {browser, page} = await getTestState();

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(browser, 'console', message => {
          return message.text() === 'from-page';
        }),
        page.evaluate(() => {
          console.log('from-page');
        }),
      ]);

      expect(message.type()).toBe('log');
      expect(message.page()).toBe(page);
      expect(message.frame()).toBe(page.mainFrame());
      expect(message.worker()).toBeNull();
    });

    it('should report console messages from dedicated workers', async () => {
      const {browser, page, context} = await getTestState();

      const received = {
        page: [] as ConsoleMessage[],
        context: [] as ConsoleMessage[],
        browser: [] as ConsoleMessage[],
      };
      const collect = (into: ConsoleMessage[]) => {
        return (message: ConsoleMessage) => {
          if (message.text() === 'from-worker') {
            into.push(message);
          }
        };
      };
      page.on('console', collect(received.page));
      context.on('console', collect(received.context));
      const browserListener = collect(received.browser);
      browser.on('console', browserListener);

      try {
        // `done` is logged after `from-worker`, so by the time it arrives every
        // delivery of `from-worker` has been emitted.
        const [worker] = await Promise.all([
          waitEvent<WebWorker>(page, 'workercreated'),
          waitEvent<ConsoleMessage>(browser, 'console', message => {
            return message.text() === 'done';
          }),
          page.evaluate(() => {
            return new Worker(
              `data:text/javascript,console.log('from-worker');console.log('done')`,
            );
          }),
        ]);

        // Each level receives the same message exactly once.
        expect(received.page).toHaveLength(1);
        expect(received.context).toHaveLength(1);
        expect(received.browser).toHaveLength(1);
        const [message] = received.browser;
        expect(received.page[0]).toBe(message);
        expect(received.context[0]).toBe(message);

        expect(message!.worker()).toBe(worker);
        expect(message!.page()).toBeNull();
        expect(message!.frame()).toBeNull();
      } finally {
        browser.off('console', browserListener);
      }
    });

    it('should report console messages from service workers', async () => {
      const {browser, page, server, context} = await getTestState();

      await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');
      const target = await context.waitForTarget(
        target => {
          return target.type() === 'service_worker';
        },
        {timeout: 3000},
      );
      const worker = (await target.worker())!;

      const [message] = await Promise.all([
        waitEvent<ConsoleMessage>(browser, 'console', message => {
          return message.text() === 'from-service-worker';
        }),
        worker.evaluate(() => {
          console.log('from-service-worker');
        }),
      ]);

      expect(message.worker()).toBe(worker);
      expect(message.page()).toBeNull();
    });

    it('should report console messages replayed when attaching after connect', async () => {
      const {browser, page, server, puppeteer} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        console.log('logged-before-connect');
      });

      using remoteBrowser = await puppeteer.connect({
        browserWSEndpoint: browser.wsEndpoint(),
        protocol: browser.protocol,
      });

      // The listener is registered before any page is attached, so the
      // messages replayed on attachment must not be dropped.
      const messages: ConsoleMessage[] = [];
      remoteBrowser.on('console', message => {
        messages.push(message);
      });
      const remotePage = (await remoteBrowser.pages()).find(page => {
        return page.url() === server.EMPTY_PAGE;
      })!;

      // Log a marker after attaching: once it arrives, any duplicate of the
      // replayed message would have arrived too.
      await Promise.all([
        waitEvent<ConsoleMessage>(remoteBrowser, 'console', message => {
          return message.text() === 'logged-after-connect';
        }),
        remotePage.evaluate(() => {
          console.log('logged-after-connect');
        }),
      ]);

      const replayed = messages.filter(message => {
        return message.text() === 'logged-before-connect';
      });
      expect(replayed).toHaveLength(1);
      expect(replayed[0]!.page()).toBe(remotePage);
      expect(replayed[0]!.frame()).toBe(remotePage.mainFrame());
    });
  });

  describe('Browser.on("request")', function () {
    it('should report requests from pages', async () => {
      const {browser, page, server} = await getTestState();

      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(browser, 'request', request => {
          return request.url() === server.EMPTY_PAGE;
        }),
        page.goto(server.EMPTY_PAGE),
      ]);

      expect(request.page()).toBe(page);
      expect(request.frame()).toBe(page.mainFrame());
    });

    it('should emit context events before browser events', async () => {
      const {browser, context, page, server} = await getTestState();

      const order: string[] = [];
      const record = (source: string) => {
        return (request: HTTPRequest) => {
          if (request.url() === server.EMPTY_PAGE) {
            order.push(source);
          }
        };
      };
      const onBrowser = record('browser');
      const onContext = record('context');
      browser.on('request', onBrowser);
      context.on('request', onContext);
      try {
        await page.goto(server.EMPTY_PAGE);

        expect(order).toEqual(['context', 'browser']);
      } finally {
        browser.off('request', onBrowser);
        context.off('request', onContext);
      }
    });

    it('should report requests from dedicated workers', async () => {
      const {browser, page, server} = await getTestState();

      const [worker] = await Promise.all([
        waitEvent<WebWorker>(page, 'workercreated'),
        page.goto(server.PREFIX + '/worker/worker.html'),
      ]);
      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(browser, 'request', request => {
          return request.url() === server.PREFIX + '/one-style.css';
        }),
        worker.evaluate((url: string) => {
          return fetch(url);
        }, server.PREFIX + '/one-style.css'),
      ]);

      expect(request.worker()).toBe(worker);
      expect(request.page()).toBeNull();
    });

    it('should not interfere with request interception', async () => {
      const {browser, page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue();
      });

      const requests: HTTPRequest[] = [];
      const listener = (request: HTTPRequest) => {
        if (request.url() === server.EMPTY_PAGE) {
          requests.push(request);
        }
      };
      browser.on('request', listener);
      try {
        const response = await page.goto(server.EMPTY_PAGE);

        expect(response!.ok()).toBe(true);
        expect(requests).toHaveLength(1);
        expect(requests[0]!.page()).toBe(page);
        expect(requests[0]!.isInterceptResolutionHandled()).toBe(true);
      } finally {
        browser.off('request', listener);
      }
    });
  });

  describe('Browser network events', function () {
    it('should report responses from pages', async () => {
      const {browser, page, server} = await getTestState();

      const [response] = await Promise.all([
        waitEvent<HTTPResponse>(browser, 'response', response => {
          return response.url() === server.EMPTY_PAGE;
        }),
        page.goto(server.EMPTY_PAGE),
      ]);

      expect(response.status()).toBe(200);
      expect(response.request().page()).toBe(page);
      expect(response.frame()).toBe(page.mainFrame());
    });

    it('should report finished requests from pages', async () => {
      const {browser, page, server} = await getTestState();

      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(browser, 'requestfinished', request => {
          return request.url() === server.EMPTY_PAGE;
        }),
        page.goto(server.EMPTY_PAGE),
      ]);

      expect(request.page()).toBe(page);
      expect(request.response()).toBeTruthy();
    });

    it('should report failed requests from pages', async () => {
      const {browser, page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().endsWith('css')) {
          void request.abort();
        } else {
          void request.continue();
        }
      });

      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(browser, 'requestfailed', request => {
          return request.url().endsWith('one-style.css');
        }),
        page.goto(server.PREFIX + '/one-style.html'),
      ]);

      expect(request.page()).toBe(page);
      expect(request.response()).toBeNull();
      expect(request.failure()).toBeTruthy();
    });

    it('should report requests served from cache', async () => {
      const {browser, page, server} = await getTestState();

      await page.goto(server.PREFIX + '/cached/one-script.html');
      await new Promise(res => {
        setTimeout(res, 1000);
      });
      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(browser, 'requestservedfromcache', request => {
          return request.url().endsWith('one-script.js');
        }),
        page.reload(),
      ]);

      expect(request.page()).toBe(page);
    });

    it('should emit context events before browser events', async () => {
      const {browser, context, page, server} = await getTestState();

      const order = {response: [] as string[], requestfinished: [] as string[]};
      const record = (
        event: keyof typeof order,
        source: 'context' | 'browser',
      ) => {
        return (data: HTTPRequest | HTTPResponse) => {
          if (data.url() === server.EMPTY_PAGE) {
            order[event].push(source);
          }
        };
      };
      const onContextResponse = record('response', 'context');
      const onBrowserResponse = record('response', 'browser');
      const onContextFinished = record('requestfinished', 'context');
      const onBrowserFinished = record('requestfinished', 'browser');
      context.on('response', onContextResponse);
      browser.on('response', onBrowserResponse);
      context.on('requestfinished', onContextFinished);
      browser.on('requestfinished', onBrowserFinished);
      try {
        await Promise.all([
          waitEvent<HTTPRequest>(browser, 'requestfinished', request => {
            return request.url() === server.EMPTY_PAGE;
          }),
          page.goto(server.EMPTY_PAGE),
        ]);

        // Only the order across emitters is checked: the relative order of
        // `response` and `requestfinished` is not guaranteed.
        expect(order.response).toEqual(['context', 'browser']);
        expect(order.requestfinished).toEqual(['context', 'browser']);
      } finally {
        context.off('response', onContextResponse);
        browser.off('response', onBrowserResponse);
        context.off('requestfinished', onContextFinished);
        browser.off('requestfinished', onBrowserFinished);
      }
    });

    it('should emit each event once per page event', async () => {
      const {browser, page, server} = await getTestState();

      server.setRedirect('/foo.html', '/empty.html');
      const events = ['response', 'requestfinished'] as const;
      const seen = {page: [] as string[], browser: [] as string[]};
      const listeners = events.map(event => {
        const onPage = (data: HTTPRequest | HTTPResponse) => {
          if (!isFavicon(data)) {
            seen.page.push(`${event}:${data.url()}`);
          }
        };
        const onBrowser = (data: HTTPRequest | HTTPResponse) => {
          if (!isFavicon(data)) {
            seen.browser.push(`${event}:${data.url()}`);
          }
        };
        page.on(event, onPage);
        browser.on(event, onBrowser);
        return {event, onPage, onBrowser};
      });
      try {
        await page.goto(server.PREFIX + '/foo.html');

        expect(seen.page.length).toBeGreaterThanOrEqual(3);
        expect(seen.browser).toEqual(seen.page);
      } finally {
        for (const {event, onPage, onBrowser} of listeners) {
          page.off(event, onPage);
          browser.off(event, onBrowser);
        }
      }
    });

    it('should report responses from dedicated workers', async () => {
      const {browser, page, server} = await getTestState();

      const [worker] = await Promise.all([
        waitEvent<WebWorker>(page, 'workercreated'),
        page.goto(server.PREFIX + '/worker/worker.html'),
      ]);
      const url = server.PREFIX + '/one-style.css';
      const [response, request] = await Promise.all([
        waitEvent<HTTPResponse>(browser, 'response', response => {
          return response.url() === url;
        }),
        waitEvent<HTTPRequest>(browser, 'requestfinished', request => {
          return request.url() === url;
        }),
        worker.evaluate(async (url: string) => {
          await (await fetch(url)).text();
        }, url),
      ]);

      expect(response.request().worker()).toBe(worker);
      expect(request.worker()).toBe(worker);
      expect(request.page()).toBeNull();
    });
  });
});
