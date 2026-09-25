/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs';
import type {ServerResponse} from 'node:http';
import path from 'node:path';

import {assert} from 'chai';
import type {Issue} from 'puppeteer';
import {KnownDevices, TimeoutError} from 'puppeteer';
import {CDPSession} from 'puppeteer-core/internal/api/CDPSession.js';
import type {HTTPRequest} from 'puppeteer-core/internal/api/HTTPRequest.js';
import type {Metrics, Page} from 'puppeteer-core/internal/api/Page.js';
import type {CdpPage} from 'puppeteer-core/internal/cdp/Page.js';
import {Deferred} from 'puppeteer-core/internal/util/Deferred.js';
import sinon from 'sinon';

import {
  assertAtLeastOneToContain,
  getTestState,
  setupSeparateTestBrowserHooks,
  setupTestBrowserHooks,
} from './mocha-utils.js';
import {
  assertRejects,
  attachFrame,
  detachFrame,
  getUniqueVideoFilePlaceholder,
  html,
  htmlRaw,
  isFavicon,
  waitEvent,
} from './utils.js';

describe('Page', function () {
  setupTestBrowserHooks();

  describe('Page.newPage', function () {
    it('should open pages in a new window', async () => {
      const {context, browser} = await getTestState();

      const page = await context.newPage({
        type: 'window',
      });

      assert.include(await context.pages(), page);
      assert.include(await browser.pages(), page);
    });
    it('should open pages in a new window at the specified position', async () => {
      const {context, browser} = await getTestState();

      const page = await context.newPage({
        type: 'window',
        windowBounds: {left: 50, top: 50, width: 750, height: 550},
      });

      assert.include(await context.pages(), page);
      assert.include(await browser.pages(), page);

      const outerSize = await page.evaluate(async () => {
        return {width: outerWidth, height: outerHeight};
      });

      assert.strictEqual(outerSize.width, 750);
      assert.strictEqual(outerSize.height, 550);
    });
    it('should open pages in a new window in maximized state', async () => {
      const {context, browser} = await getTestState();

      const page = await context.newPage({
        type: 'window',
        windowBounds: {windowState: 'maximized'},
      });

      assert.include(await context.pages(), page);
      assert.include(await browser.pages(), page);

      const outerSize = await page.evaluate(async () => {
        return {width: outerWidth, height: outerHeight};
      });

      // Should match default headless screen size 800x600.
      assert.strictEqual(outerSize.width, 800);
      assert.strictEqual(outerSize.height, 600);
    });
    it('should create a background page', async () => {
      const {context} = await getTestState();

      const page = await context.newPage({
        background: true,
      });

      assert.strictEqual(
        await page.evaluate(() => {
          return document.visibilityState;
        }),
        'hidden',
      );
    });
  });

  describe('Page.close', function () {
    it('should reject all promises when page is closed', async () => {
      const {context} = await getTestState();

      const newPage = await context.newPage();
      let error!: Error;
      await Promise.all([
        newPage
          .evaluate(() => {
            return new Promise(() => {});
          })
          .catch(error_ => {
            return (error = error_);
          }),
        newPage.close(),
      ]);
      assert.include(error.message, 'Protocol error');
    });
    it('should not be visible in browser.pages', async () => {
      const {browser, context} = await getTestState();

      const newPage = await context.newPage();
      assert.include(await browser.pages(), newPage);
      await newPage.close();
      assert.notInclude(await browser.pages(), newPage);
    });
    it('should close child iframes', async () => {
      const {context, server} = await getTestState();

      const newPage = await context.newPage();
      await newPage.goto(server.PREFIX + '/frames/one-frame.html');
      assert.strictEqual(newPage.frames().length, 2);
      await newPage.close();
      assert.notInclude(await context.pages(), newPage);
    });
    it('should run beforeunload if asked for', async () => {
      const {context, server, isChrome} = await getTestState();

      const newPage = await context.newPage();
      await newPage.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await newPage.click('body');
      const pageClosingPromise = newPage.close({runBeforeUnload: true});
      const dialog = await waitEvent(newPage, 'dialog');
      assert.strictEqual(dialog.type(), 'beforeunload');
      assert.strictEqual(dialog.defaultValue(), '');
      if (isChrome) {
        assert.strictEqual(dialog.message(), '');
      } else {
        assert.ok(dialog.message());
      }
      await dialog.accept();
      await pageClosingPromise;
    });
    it('should *not* run beforeunload by default', async () => {
      const {context, server} = await getTestState();

      const newPage = await context.newPage();
      await newPage.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await newPage.click('body');
      await newPage.close();
    });
    it('should set the page close state', async () => {
      const {context} = await getTestState();

      const newPage = await context.newPage();
      assert.isFalse(newPage.isClosed());
      await newPage.close();
      assert.isTrue(newPage.isClosed());
    });
    it('should terminate network waiters', async () => {
      const {context, server} = await getTestState();

      const newPage = await context.newPage();
      const results = await Promise.all([
        newPage.waitForRequest(server.EMPTY_PAGE).catch(error => {
          return error;
        }),
        newPage.waitForResponse(server.EMPTY_PAGE).catch(error => {
          return error;
        }),
        newPage.close(),
      ]);
      for (let i = 0; i < 2; i++) {
        const message = results[i].message;
        assertAtLeastOneToContain(message, [
          'Target closed',
          'Page closed!',
          'Frame detached',
        ]);
        assert.notInclude(message, 'Timeout');
      }
    });
  });

  describe('Page.Events.Load', function () {
    it('should fire when expected', async () => {
      const {page} = await getTestState();

      await Promise.all([waitEvent(page, 'load'), page.goto('about:blank')]);
    });
  });

  describe('removing and adding event handlers', () => {
    it('should correctly fire event handlers as they are added and then removed', async () => {
      const {page, server} = await getTestState();

      const handler = sinon.spy();
      const onResponse = (response: {url: () => string}) => {
        // Ignore default favicon requests.
        if (!isFavicon(response)) {
          handler();
        }
      };
      page.on('response', onResponse);
      await page.goto(server.EMPTY_PAGE);
      assert.strictEqual(handler.callCount, 1);
      page.off('response', onResponse);
      await page.goto(server.EMPTY_PAGE);
      // Still one because we removed the handler.
      assert.strictEqual(handler.callCount, 1);
      page.on('response', onResponse);
      await page.goto(server.EMPTY_PAGE);
      // Two now because we added the handler back.
      assert.strictEqual(handler.callCount, 2);
    });

    it('should correctly added and removed request events', async () => {
      const {page, server} = await getTestState();

      const handler = sinon.spy();
      const onResponse = (response: {url: () => string}) => {
        // Ignore default favicon requests.
        if (!isFavicon(response)) {
          handler();
        }
      };

      page.on('request', onResponse);
      page.on('request', onResponse);
      await page.goto(server.EMPTY_PAGE);
      assert.strictEqual(handler.callCount, 2);
      page.off('request', onResponse);
      await page.goto(server.EMPTY_PAGE);
      // Still one because we removed the handler.
      assert.strictEqual(handler.callCount, 3);
      page.off('request', onResponse);
      await page.goto(server.EMPTY_PAGE);
      assert.strictEqual(handler.callCount, 3);
      page.on('request', onResponse);
      await page.goto(server.EMPTY_PAGE);
      // Two now because we added the handler back.
      assert.strictEqual(handler.callCount, 4);
    });
  });

  describe('Page.Events.error', function () {
    it('should throw when page crashes', async () => {
      const {page, isChrome} = await getTestState();

      let navigate: Promise<unknown>;
      if (isChrome) {
        navigate = page.goto('chrome://crash').catch(() => {});
      } else {
        navigate = page.goto('about:crashcontent').catch(() => {});
      }
      const [error] = await Promise.all([
        waitEvent<Error>(page, 'error'),
        navigate,
      ]);
      assert.strictEqual(error.message, 'Page crashed!');
    });
  });

  describe('Page.Events.Popup', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      const [popup] = await Promise.all([
        waitEvent<Page>(page, 'popup'),
        page.evaluate(() => {
          return window.open('about:blank');
        }),
      ]);
      assert.isFalse(
        await page.evaluate(() => {
          return !!window.opener;
        }),
      );
      assert.isTrue(
        await popup.evaluate(() => {
          return !!window.opener;
        }),
      );
    });
    it('should work with noopener', async () => {
      const {page} = await getTestState();

      const [popup] = await Promise.all([
        waitEvent<Page>(page, 'popup'),
        page.evaluate(() => {
          return window.open('about:blank', undefined, 'noopener');
        }),
      ]);
      assert.isFalse(
        await page.evaluate(() => {
          return !!window.opener;
        }),
      );
      assert.isFalse(
        await popup.evaluate(() => {
          return !!window.opener;
        }),
      );
    });
    it('should work with clicking target=_blank and without rel=opener', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        html`<a
          target="_blank"
          href="/one-style.html"
          >yo</a
        >`,
      );
      const [popup] = await Promise.all([
        waitEvent<Page>(page, 'popup'),
        page.click('a'),
      ]);
      assert.isFalse(
        await page.evaluate(() => {
          return !!window.opener;
        }),
      );
      assert.isFalse(
        await popup.evaluate(() => {
          return !!window.opener;
        }),
      );
    });
    it('should work with clicking target=_blank and with rel=opener', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        html`<a
          target="_blank"
          rel="opener"
          href="/one-style.html"
          >yo</a
        >`,
      );
      const [popup] = await Promise.all([
        waitEvent<Page>(page, 'popup'),
        page.click('a'),
      ]);
      assert.isFalse(
        await page.evaluate(() => {
          return !!window.opener;
        }),
      );
      assert.isTrue(
        await popup.evaluate(() => {
          return !!window.opener;
        }),
      );
    });
    it('should work with fake-clicking target=_blank and rel=noopener', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        html`<a
          target="_blank"
          rel="noopener"
          href="/one-style.html"
          >yo</a
        >`,
      );
      const [popup] = await Promise.all([
        waitEvent<Page>(page, 'popup'),
        page.$eval('a', a => {
          return a.click();
        }),
      ]);
      assert.isFalse(
        await page.evaluate(() => {
          return !!window.opener;
        }),
      );
      assert.isFalse(
        await popup.evaluate(() => {
          return !!window.opener;
        }),
      );
    });
    it('should work with clicking target=_blank and rel=noopener', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        html`<a
          target="_blank"
          rel="noopener"
          href="/one-style.html"
          >yo</a
        >`,
      );
      const [popup] = await Promise.all([
        waitEvent<Page>(page, 'popup'),
        page.click('a'),
      ]);
      assert.isFalse(
        await page.evaluate(() => {
          return !!window.opener;
        }),
      );
      assert.isFalse(
        await popup.evaluate(() => {
          return !!window.opener;
        }),
      );
    });
  });

  describe('Page.setGeolocation', function () {
    it('should work', async () => {
      const {page, server, context} = await getTestState();

      await context.overridePermissions(server.PREFIX, ['geolocation']);
      await page.goto(server.EMPTY_PAGE);
      await page.setGeolocation({longitude: 10, latitude: 10});
      const geolocation = await page.evaluate(() => {
        return new Promise(resolve => {
          return navigator.geolocation.getCurrentPosition(position => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          });
        });
      });
      assert.deepEqual(geolocation, {
        latitude: 10,
        longitude: 10,
      });
    });
    it('should throw when invalid longitude', async () => {
      const {page} = await getTestState();

      let error!: Error;
      try {
        await page.setGeolocation({longitude: 200, latitude: 10});
      } catch (error_) {
        error = error_ as Error;
      }
      assert.include(error.message, 'Invalid longitude "200"');
    });
  });

  describe('Page.setOfflineMode', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.setOfflineMode(true);
      let error!: Error;
      await page.goto(server.EMPTY_PAGE).catch(error_ => {
        return (error = error_);
      });
      assert.ok(error);
      await page.setOfflineMode(false);
      const response = (await page.reload())!;
      assert.strictEqual(response.status(), 200);
    });
    it('should emulate navigator.onLine', async () => {
      const {page} = await getTestState();

      assert.isTrue(
        await page.evaluate(() => {
          return window.navigator.onLine;
        }),
      );
      await page.setOfflineMode(true);
      assert.isFalse(
        await page.evaluate(() => {
          return window.navigator.onLine;
        }),
      );
      await page.setOfflineMode(false);
      assert.isTrue(
        await page.evaluate(() => {
          return window.navigator.onLine;
        }),
      );
    });
  });

  describe('Page.Events.DOMContentLoaded', function () {
    it('should fire when expected', async () => {
      const {page} = await getTestState();

      const navigate = page.goto('about:blank');
      await Promise.all([waitEvent(page, 'domcontentloaded'), navigate]);
    });
  });

  describe('Page.metrics', function () {
    it('should get metrics from a page', async () => {
      const {page} = await getTestState();

      await page.goto('about:blank');
      const metrics = await page.metrics();
      checkMetrics(metrics);
    });
    it('metrics event fired on console.timeStamp', async () => {
      const {page} = await getTestState();

      const metricsPromise = waitEvent<{metrics: Metrics; title: string}>(
        page,
        'metrics',
      );

      await page.evaluate(() => {
        return console.timeStamp('test42');
      });
      const metrics = await metricsPromise;
      assert.strictEqual(metrics.title, 'test42');
      checkMetrics(metrics.metrics);
    });
    function checkMetrics(metrics: Metrics) {
      const metricsToCheck = new Set([
        'Timestamp',
        'Documents',
        'Frames',
        'JSEventListeners',
        'Nodes',
        'LayoutCount',
        'RecalcStyleCount',
        'LayoutDuration',
        'RecalcStyleDuration',
        'ScriptDuration',
        'TaskDuration',
        'JSHeapUsedSize',
        'JSHeapTotalSize',
      ]);
      for (const name in metrics) {
        assert.ok(metricsToCheck.has(name));
        const value = metrics[name as keyof Metrics];
        assert.isDefined(value);
        assert.isAtLeast(value, 0);
        metricsToCheck.delete(name);
      }
      assert.strictEqual(metricsToCheck.size, 0);
    }
  });

  describe('Page.waitForRequest', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        page.waitForRequest(server.PREFIX + '/digits/2.png'),
        page.evaluate(() => {
          void fetch('/digits/1.png');
          void fetch('/digits/2.png');
          void fetch('/digits/3.png');
        }),
      ]);
      assert.strictEqual(request.url(), server.PREFIX + '/digits/2.png');
    });
    it('should work with predicate', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        page.waitForRequest(request => {
          return request.url() === server.PREFIX + '/digits/2.png';
        }),
        page.evaluate(() => {
          void fetch('/digits/1.png');
          void fetch('/digits/2.png');
          void fetch('/digits/3.png');
        }),
      ]);
      assert.strictEqual(request.url(), server.PREFIX + '/digits/2.png');
    });
    it('should work with async predicate', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        page.waitForRequest(async request => {
          return request.url() === server.PREFIX + '/digits/2.png';
        }),
        page.evaluate(() => {
          void fetch('/digits/1.png');
          void fetch('/digits/2.png');
          void fetch('/digits/3.png');
        }),
      ]);
      assert.strictEqual(request.url(), server.PREFIX + '/digits/2.png');
    });
    it('should respect timeout', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .waitForRequest(
          () => {
            return false;
          },
          {timeout: 1},
        )
        .catch(error_ => {
          return (error = error_);
        });
      assert.instanceOf(error, TimeoutError);
    });
    it('should respect default timeout', async () => {
      const {page} = await getTestState();

      let error!: Error;
      page.setDefaultTimeout(1);
      await page
        .waitForRequest(() => {
          return false;
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.instanceOf(error, TimeoutError);
    });
    it('should work with no timeout', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        page.waitForRequest(server.PREFIX + '/digits/2.png', {timeout: 0}),
        page.evaluate(() => {
          return setTimeout(() => {
            void fetch('/digits/1.png');
            void fetch('/digits/2.png');
            void fetch('/digits/3.png');
          }, 50);
        }),
      ]);
      assert.strictEqual(request.url(), server.PREFIX + '/digits/2.png');
    });

    it('should be cancellable', async () => {
      const {page, server} = await getTestState();

      const abortController = new AbortController();

      await page.goto(server.EMPTY_PAGE);
      const task = page.waitForRequest(server.PREFIX + '/abortme', {
        signal: abortController.signal,
      });

      abortController.abort();
      const error = await assertRejects(task);
      assert.match(error.message, /aborted/);
    });
  });

  describe('Page.waitForResponse', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(server.PREFIX + '/digits/2.png'),
        page.evaluate(() => {
          void fetch('/digits/1.png');
          void fetch('/digits/2.png');
          void fetch('/digits/3.png');
        }),
      ]);
      assert.strictEqual(response.url(), server.PREFIX + '/digits/2.png');
    });
    it('should respect timeout', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .waitForResponse(
          () => {
            return false;
          },
          {timeout: 1},
        )
        .catch(error_ => {
          return (error = error_);
        });
      assert.instanceOf(error, TimeoutError);
    });
    it('should respect default timeout', async () => {
      const {page} = await getTestState();

      let error!: Error;
      page.setDefaultTimeout(1);
      await page
        .waitForResponse(() => {
          return false;
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.instanceOf(error, TimeoutError);
    });
    it('should work with predicate', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(response => {
          return response.url() === server.PREFIX + '/digits/2.png';
        }),
        page.evaluate(() => {
          void fetch('/digits/1.png');
          void fetch('/digits/2.png');
          void fetch('/digits/3.png');
        }),
      ]);
      assert.strictEqual(response.url(), server.PREFIX + '/digits/2.png');
    });
    it('should work with async predicate', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(async response => {
          return response.url() === server.PREFIX + '/digits/2.png';
        }),
        page.evaluate(() => {
          void fetch('/digits/1.png');
          void fetch('/digits/2.png');
          void fetch('/digits/3.png');
        }),
      ]);
      assert.strictEqual(response.url(), server.PREFIX + '/digits/2.png');
    });
    it('should work with no timeout', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(server.PREFIX + '/digits/2.png', {timeout: 0}),
        page.evaluate(() => {
          return setTimeout(() => {
            void fetch('/digits/1.png');
            void fetch('/digits/2.png');
            void fetch('/digits/3.png');
          }, 50);
        }),
      ]);
      assert.strictEqual(response.url(), server.PREFIX + '/digits/2.png');
    });
    it('should be cancellable', async () => {
      const {page, server} = await getTestState();

      const abortController = new AbortController();
      const task = page.waitForResponse(server.PREFIX + '/abortme', {
        signal: abortController.signal,
      });

      abortController.abort();
      const error = await assertRejects(task);
      assert.match(error.message, /aborted/);
    });
  });

  describe('Page.waitForNetworkIdle', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      let res;
      const [t1, t2] = await Promise.all([
        page.waitForNetworkIdle().then(r => {
          res = r;
          return Date.now();
        }),
        page
          .evaluate(async () => {
            await Promise.all([fetch('/digits/1.png'), fetch('/digits/2.png')]);
            await new Promise(resolve => {
              return setTimeout(resolve, 200);
            });
            await fetch('/digits/3.png');
            await new Promise(resolve => {
              return setTimeout(resolve, 200);
            });
            await fetch('/digits/4.png');
          })
          .then(() => {
            return Date.now();
          }),
      ]);
      assert.isUndefined(res);
      assert.isAbove(t1, t2);
      assert.isAtLeast(t1 - t2, 400);
    });
    it('should respect timeout', async () => {
      const {page} = await getTestState();
      let error!: Error;
      await page.waitForNetworkIdle({timeout: 1}).catch(error_ => {
        return (error = error_);
      });
      assert.instanceOf(error, TimeoutError);
    });
    it('should respect idleTime', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      const [t1, t2] = await Promise.all([
        page.waitForNetworkIdle({idleTime: 10}).then(() => {
          return Date.now();
        }),
        page
          .evaluate(() => {
            return (async () => {
              await Promise.all([
                fetch('/digits/1.png'),
                fetch('/digits/2.png'),
              ]);
              await new Promise(resolve => {
                return setTimeout(resolve, 250);
              });
            })();
          })
          .then(() => {
            return Date.now();
          }),
      ]);
      assert.isAbove(t2, t1);
    });
    it('should work with no timeout', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      const [result] = await Promise.all([
        page.waitForNetworkIdle({timeout: 0}),
        page.evaluate(() => {
          return setTimeout(() => {
            void fetch('/digits/1.png');
            void fetch('/digits/2.png');
            void fetch('/digits/3.png');
          }, 50);
        }),
      ]);
      assert.isUndefined(result);
    });
    it('should work with aborted requests', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/abort-request.html');

      using element = await page.$(`#abort`);
      await element!.click();

      let error = false;
      await page.waitForNetworkIdle().catch(() => {
        return (error = true);
      });

      assert.isFalse(error);
    });
    it('should work with delayed response', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      let response!: ServerResponse;
      server.setRoute('/fetch-request-b.js', (_req, res) => {
        response = res;
      });
      const t0 = Date.now();
      const [t1, t2] = await Promise.all([
        page.waitForNetworkIdle({idleTime: 100}).then(() => {
          return Date.now();
        }),
        new Promise<number>(res => {
          setTimeout(() => {
            response.end();
            res(Date.now());
          }, 300);
        }),
        page.evaluate(async () => {
          await fetch('/fetch-request-b.js');
        }),
      ]);
      assert.isAbove(t1, t2);
      // request finished + idle time.
      assert.isAtLeast(t1 - t0, 400);
      // request finished + idle time - request finished.
      assert.isAtLeast(t1 - t2, 100);
    });

    it('should be cancelable', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      const abortController = new AbortController();

      const task = page.waitForNetworkIdle({
        signal: abortController.signal,
      });
      const promise = page.evaluate(async () => {
        await Promise.all([fetch('/digits/1.png')]);
        await fetch('/digits/2.png');
      });

      abortController.abort();
      const error = await assertRejects(task);
      assert.match(error.message, /aborted/);
      await promise;
    });
  });

  describe('Page.waitForFrame', () => {
    it('should work', async () => {
      const {server, page} = await getTestState();

      await page.goto(server.EMPTY_PAGE);

      const [waitedFrame] = await Promise.all([
        page.waitForFrame(frame => {
          return frame.url().endsWith('/title.html');
        }),
        attachFrame(page, 'frame2', server.PREFIX + '/title.html'),
      ]);

      assert.strictEqual(waitedFrame.parentFrame(), page.mainFrame());
    });

    it('should work with a URL predicate', async () => {
      const {server, page} = await getTestState();

      await page.goto(server.EMPTY_PAGE);

      const [waitedFrame] = await Promise.all([
        page.waitForFrame(server.PREFIX + '/title.html'),
        attachFrame(page, 'frame2', server.PREFIX + '/title.html'),
      ]);

      assert.strictEqual(waitedFrame.parentFrame(), page.mainFrame());
    });

    it('should be cancellable', async () => {
      const {server, page} = await getTestState();

      const abortController = new AbortController();
      await page.goto(server.EMPTY_PAGE);

      const task = page.waitForFrame(
        frame => {
          return frame.url().endsWith('/title.html');
        },
        {
          signal: abortController.signal,
        },
      );

      abortController.abort();
      const error = await assertRejects(task);
      assert.match(error.message, /aborted/);
    });
  });

  describe('Page.exposeFunction', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return a * b;
      });
      const result = await page.evaluate(async function () {
        return (globalThis as any).compute(9, 4);
      });
      assert.strictEqual(result, 36);
    });
    it('should throw exception in page context', async () => {
      const {page} = await getTestState();

      await page.exposeFunction('woof', () => {
        throw new Error('WOOF WOOF');
      });
      const {message, stack} = await page.evaluate(async () => {
        try {
          return await (
            globalThis as unknown as {woof(): Promise<never>}
          ).woof();
        } catch (error) {
          return {
            message: (error as Error).message,
            stack: (error as Error).stack,
          };
        }
      });
      assert.strictEqual(message, 'WOOF WOOF');
      assert.include(stack, 'page.test.ts');
    });
    it('should support throwing "null"', async () => {
      const {page} = await getTestState();

      await page.exposeFunction('woof', function () {
        throw null;
      });
      const thrown = await page.evaluate(async () => {
        try {
          await (globalThis as any).woof();
          return;
        } catch (error) {
          return error;
        }
      });
      assert.isNull(thrown);
    });
    it('should be callable from-inside evaluateOnNewDocument', async () => {
      const {page} = await getTestState();

      const called = new Deferred<void>();
      await page.exposeFunction('woof', function () {
        called.resolve();
      });
      await page.evaluateOnNewDocument(() => {
        return (globalThis as any).woof();
      });
      await page.reload();
      await called.valueOrThrow();
    });
    it('should survive navigation', async () => {
      const {page, server} = await getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return a * b;
      });

      await page.goto(server.EMPTY_PAGE);
      const result = await page.evaluate(async function () {
        return (globalThis as any).compute(9, 4);
      });
      assert.strictEqual(result, 36);
    });
    it('should await returned promise', async () => {
      const {page} = await getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return Promise.resolve(a * b);
      });

      const result = await page.evaluate(async function () {
        return (globalThis as any).compute(3, 5);
      });
      assert.strictEqual(result, 15);
    });
    it('should await returned if called from function', async () => {
      const {page} = await getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return Promise.resolve(a * b);
      });

      const result = await page.evaluate(async function () {
        const result = await (globalThis as any).compute(3, 5);
        return result;
      });
      assert.strictEqual(result, 15);
    });
    it('should work on frames', async () => {
      const {page, server} = await getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return Promise.resolve(a * b);
      });

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      const frame = page.frames()[1]!;
      const result = await frame.evaluate(async function () {
        return (globalThis as any).compute(3, 5);
      });
      assert.strictEqual(result, 15);
    });
    it('should work with loading frames', async () => {
      // Tries to reproduce the scenario from
      // https://github.com/puppeteer/puppeteer/issues/8106
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      let saveRequest: (value: HTTPRequest | PromiseLike<HTTPRequest>) => void;
      const iframeRequest = new Promise<HTTPRequest>(resolve => {
        saveRequest = resolve;
      });
      page.on('request', async req => {
        if (req.url().endsWith('/frames/frame.html')) {
          saveRequest(req);
        } else {
          await req.continue();
        }
      });

      let error: Error | undefined;
      const navPromise = page
        .goto(server.PREFIX + '/frames/one-frame.html', {
          waitUntil: 'networkidle0',
        })
        .catch(err => {
          error = err;
        });
      const req = await iframeRequest;
      // Expose function while the frame is being loaded. Loading process is
      // controlled by interception.
      const exposePromise = page.exposeFunction(
        'compute',
        function (a: number, b: number) {
          return Promise.resolve(a * b);
        },
      );
      await Promise.all([req.continue(), exposePromise]);
      await navPromise;
      assert.isUndefined(error);
      const frame = page.frames()[1]!;
      const result = await frame.evaluate(async function () {
        return (globalThis as any).compute(3, 5);
      });
      assert.strictEqual(result, 15);
    });
    it('should work on frames before navigation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      await page.exposeFunction('compute', function (a: number, b: number) {
        return Promise.resolve(a * b);
      });

      const frame = page.frames()[1]!;
      const result = await frame.evaluate(async function () {
        return (globalThis as any).compute(3, 5);
      });
      assert.strictEqual(result, 15);
    });
    it('should not throw when frames detach', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await page.exposeFunction('compute', function (a: number, b: number) {
        return Promise.resolve(a * b);
      });
      await detachFrame(page, 'frame1');

      assert.deepEqual(
        await page.evaluate(async function () {
          return (globalThis as any).compute(3, 5);
        }),
        15,
      );
    });
    it('should work with complex objects', async () => {
      const {page} = await getTestState();

      await page.exposeFunction(
        'complexObject',
        function (a: {x: number}, b: {x: number}) {
          return {x: a.x + b.x};
        },
      );
      const result = await page.evaluate(async () => {
        return (globalThis as any).complexObject({x: 5}, {x: 2});
      });
      assert.strictEqual(result.x, 7);
    });
    it('should fallback to default export when passed a module object', async () => {
      const {page, server} = await getTestState();
      const moduleObject = {
        default: function (a: number, b: number) {
          return a * b;
        },
      };
      await page.goto(server.EMPTY_PAGE);
      await page.exposeFunction('compute', moduleObject);
      const result = await page.evaluate(async function () {
        return (globalThis as any).compute(9, 4);
      });
      assert.strictEqual(result, 36);
    });

    it('should be called once', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      let calls = 0;
      await page.exposeFunction('call', function () {
        calls++;
      });

      const frame = page.frames()[1]!;
      await frame.evaluate(async function () {
        return (globalThis as any).call();
      });
      assert.strictEqual(calls, 1);
    });
  });

  describe('Page.removeExposedFunction', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return a * b;
      });
      const result = await page.evaluate(async function () {
        return (globalThis as any).compute(9, 4);
      });
      assert.strictEqual(result, 36);
      await page.removeExposedFunction('compute');

      const error = await page
        .evaluate(async function () {
          return (globalThis as any).compute(9, 4);
        })
        .then(() => {
          return null;
        })
        .catch(error => {
          return error;
        });
      assert.ok(error);
    });
  });

  describe('Page.Events.PageError', function () {
    it('should fire', async () => {
      const {page, server} = await getTestState();

      const [error] = await Promise.all([
        waitEvent(page, 'pageerror', err => {
          return err.message.includes('Fancy');
        }),
        page.goto(server.PREFIX + '/error.html'),
      ]);
      assert.include(error.message, 'Fancy');
      assert.include(error.stack?.split('\n').at(-1), 'error.html:3:1');
    });
    it('should fire for all value types', async () => {
      const {page, server} = await getTestState();

      const [error] = await Promise.all([
        waitEvent<unknown>(page, 'pageerror'),
        page.goto(server.PREFIX + '/error-primitive.html'),
      ]);
      assert.isUndefined(error);
    });
  });

  describe('Page.setUserAgent', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      assert.include(
        await page.evaluate(() => {
          return navigator.userAgent;
        }),
        'Mozilla',
      );
      await page.setUserAgent('foobar');
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      assert.strictEqual(request.headers['user-agent'], 'foobar');
    });
    it('should work with options parameter', async () => {
      const {page, server} = await getTestState();

      assert.include(
        await page.evaluate(() => {
          return navigator.userAgent;
        }),
        'Mozilla',
      );
      await page.setUserAgent({userAgent: 'foobar'});
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      assert.strictEqual(request.headers['user-agent'], 'foobar');
    });
    it('should work with platform option', async () => {
      const {page, server} = await getTestState();

      assert.notStrictEqual(
        await page.evaluate(() => {
          return navigator.platform;
        }),
        'MockPlatform',
      );

      await page.setUserAgent({
        userAgent: 'foobar',
        platform: 'MockPlatform',
      });

      assert.strictEqual(
        await page.evaluate(() => {
          return navigator.platform;
        }),
        'MockPlatform',
      );

      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      assert.strictEqual(request.headers['user-agent'], 'foobar');
    });
    it('should work with platform option without userAgent', async () => {
      const {page, server} = await getTestState();

      const originalUserAgent = await page.evaluate(() => {
        return navigator.userAgent;
      });

      assert.notStrictEqual(
        await page.evaluate(() => {
          return navigator.platform;
        }),
        'MockPlatform',
      );

      await page.setUserAgent({
        platform: 'MockPlatform',
      });

      assert.strictEqual(
        await page.evaluate(() => {
          return navigator.platform;
        }),
        'MockPlatform',
      );

      // User agent should remain the same
      assert.strictEqual(
        await page.evaluate(() => {
          return navigator.userAgent;
        }),
        originalUserAgent,
      );

      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      assert.strictEqual(request.headers['user-agent'], originalUserAgent);
    });
    it('should work for subframes', async () => {
      const {page, server} = await getTestState();

      assert.include(
        await page.evaluate(() => {
          return navigator.userAgent;
        }),
        'Mozilla',
      );
      await page.setUserAgent('foobar');
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        attachFrame(page, 'frame1', server.EMPTY_PAGE),
      ]);
      assert.strictEqual(request.headers['user-agent'], 'foobar');
    });
    it('should emulate device user-agent', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      assert.notInclude(
        await page.evaluate(() => {
          return navigator.userAgent;
        }),
        'iPhone',
      );
      await page.setUserAgent(KnownDevices['iPhone 6'].userAgent);
      assert.include(
        await page.evaluate(() => {
          return navigator.userAgent;
        }),
        'iPhone',
      );
    });
    it('should work with additional userAgentMetdata', async () => {
      const {page, server} = await getTestState();

      await page.setUserAgent('MockBrowser', {
        architecture: 'Mock1',
        mobile: false,
        model: 'Mockbook',
        platform: 'MockOS',
        platformVersion: '3.1',
      });
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      assert.isFalse(
        await page.evaluate(() => {
          // @ts-expect-error: userAgentData not yet in TypeScript DOM API
          return navigator.userAgentData.mobile;
        }),
      );

      const uaData = await page.evaluate(() => {
        // @ts-expect-error: userAgentData not yet in TypeScript DOM API
        return navigator.userAgentData.getHighEntropyValues([
          'architecture',
          'model',
          'platform',
          'platformVersion',
        ]);
      });
      assert.strictEqual(uaData['architecture'], 'Mock1');
      assert.strictEqual(uaData['model'], 'Mockbook');
      assert.strictEqual(uaData['platform'], 'MockOS');
      assert.strictEqual(uaData['platformVersion'], '3.1');
      assert.strictEqual(request.headers['user-agent'], 'MockBrowser');
    });
    it('should restore original', async () => {
      const {page, server} = await getTestState();

      const userAgent = await page.evaluate(() => {
        return navigator.userAgent;
      });

      await page.setUserAgent('foobar');
      const [requestWithOverride] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      assert.strictEqual(requestWithOverride.headers['user-agent'], 'foobar');

      await page.setUserAgent('');
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      assert.strictEqual(request.headers['user-agent'], userAgent);
      const userAgentRestored = await page.evaluate(() => {
        return navigator.userAgent;
      });
      assert.strictEqual(userAgentRestored, userAgent);
    });
  });

  describe('Page.setContent', function () {
    const expectedOutput =
      '<html><head></head><body><div>hello</div></body></html>';
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setContent(htmlRaw`<div>hello</div>`);
      const result = await page.content();
      assert.strictEqual(result, expectedOutput);
    });
    it('should work with doctype', async () => {
      const {page} = await getTestState();

      const doctype = '<!DOCTYPE html>';
      await page.setContent(htmlRaw`${doctype}<div>hello</div>`);
      const result = await page.content();
      assert.strictEqual(result, `${doctype}${expectedOutput}`);
    });
    it('should work with HTML 4 doctype', async () => {
      const {page} = await getTestState();

      const doctype =
        '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
        '"http://www.w3.org/TR/html4/strict.dtd">';
      await page.setContent(htmlRaw`${doctype}<div>hello</div>`);
      const result = await page.content();
      assert.strictEqual(result, `${doctype}${expectedOutput}`);
    });
    it('should respect timeout', async () => {
      const {page, server} = await getTestState();

      const imgPath = '/img.png';
      // stall for image
      server.setRoute(imgPath, () => {});
      let error!: Error;
      await page
        .setContent(html`<img src="${server.PREFIX + imgPath}"></img>`, {
          timeout: 1,
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.instanceOf(error, TimeoutError);
    });
    it('should respect default navigation timeout', async () => {
      const {page, server} = await getTestState();

      page.setDefaultNavigationTimeout(1);
      const imgPath = '/img.png';
      // stall for image
      server.setRoute(imgPath, () => {});
      let error!: Error;
      await page
        .setContent(html`<img src="${server.PREFIX + imgPath}"></img>`)
        .catch(error_ => {
          return (error = error_);
        });
      assert.instanceOf(error, TimeoutError);
    });
    it('should await resources to load', async () => {
      const {page, server} = await getTestState();

      const imgPath = '/img.png';
      let imgResponse!: ServerResponse;
      server.setRoute(imgPath, (_req, res) => {
        return (imgResponse = res);
      });
      let loaded = false;
      const contentPromise = page
        .setContent(html`<img src="${server.PREFIX + imgPath}"></img>`)
        .then(() => {
          return (loaded = true);
        });
      await server.waitForRequest(imgPath);
      assert.isFalse(loaded);
      imgResponse.end();
      await contentPromise;
    });
    it('should work fast enough', async () => {
      const {page} = await getTestState();

      for (let i = 0; i < 20; ++i) {
        await page.setContent(html`<div>yo</div>`);
      }
    });
    it('should work with tricky content', async () => {
      const {page} = await getTestState();

      await page.setContent(html`${'<div>hello world</div>' + '\x7F'}`);
      assert.strictEqual(
        await page.$eval('div', div => {
          return div.textContent;
        }),
        'hello world',
      );
    });
    it('should work with accents', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<div>aberración</div>`);
      assert.strictEqual(
        await page.$eval('div', div => {
          return div.textContent;
        }),
        'aberración',
      );
    });
    it('should work with emojis', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<div>🐥</div>`);
      assert.strictEqual(
        await page.$eval('div', div => {
          return div.textContent;
        }),
        '🐥',
      );
    });
    it('should work with newline', async () => {
      const {page} = await getTestState();

      await page.setContent(htmlRaw`<div>\n</div>`);
      assert.strictEqual(
        await page.$eval('div', div => {
          return div.textContent;
        }),
        '\n',
      );
    });
    it('should work with comments outside HTML tag', async () => {
      const {page} = await getTestState();

      const comment = '<!-- Comment -->';
      await page.setContent(htmlRaw`${comment}<div>hello</div>`);
      const result = await page.content();
      assert.strictEqual(result, `${comment}${expectedOutput}`);
    });
    it('should not run a cross-origin script through document.write', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const warnings: string[] = [];
      page.on('console', message => {
        if (message.type() === 'warn') {
          warnings.push(message.text());
        }
      });

      await page.setContent(
        html`<script src="${server.CROSS_PROCESS_PREFIX + '/injectedfile.js'}"></script>`,
        {waitUntil: 'load'},
      );

      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
        42,
      );
      assert.lengthOf(
        warnings.filter(warning => {
          return warning.includes('document.write');
        }),
        0,
      );
    });
  });

  describe('Page.setBypassCSP', function () {
    it('should bypass CSP meta tag', async () => {
      const {page, server} = await getTestState();

      // Make sure CSP prohibits addScriptTag.
      await page.goto(server.PREFIX + '/csp.html');
      await page
        .addScriptTag({content: 'window.__injected = 42;'})
        .catch(error => {
          return void error;
        });
      assert.isUndefined(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
      );

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();
      await page.addScriptTag({content: 'window.__injected = 42;'});
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
        42,
      );
    });

    it('should bypass CSP header', async () => {
      const {page, server} = await getTestState();

      // Make sure CSP prohibits addScriptTag.
      server.setCSP('/empty.html', 'default-src "self"');
      await page.goto(server.EMPTY_PAGE);
      await page
        .addScriptTag({content: 'window.__injected = 42;'})
        .catch(error => {
          return void error;
        });
      assert.isUndefined(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
      );

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();
      await page.addScriptTag({content: 'window.__injected = 42;'});
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
        42,
      );
    });

    it('should bypass after cross-process navigation', async () => {
      const {page, server} = await getTestState();

      await page.setBypassCSP(true);
      await page.goto(server.PREFIX + '/csp.html');
      await page.addScriptTag({content: 'window.__injected = 42;'});
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
        42,
      );

      await page.goto(server.CROSS_PROCESS_PREFIX + '/csp.html');
      await page.addScriptTag({content: 'window.__injected = 42;'});
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
        42,
      );
    });
    it('should bypass CSP in iframes as well', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      {
        // Make sure CSP prohibits addScriptTag in an iframe.
        const frame = (await attachFrame(
          page,
          'frame1',
          server.PREFIX + '/csp.html',
        ))!;
        await frame
          .addScriptTag({content: 'window.__injected = 42;'})
          .catch(error => {
            return void error;
          });
        assert.isUndefined(
          await frame.evaluate(() => {
            return (globalThis as any).__injected;
          }),
        );
      }

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();

      {
        const frame = (await attachFrame(
          page,
          'frame1',
          server.PREFIX + '/csp.html',
        ))!;
        await frame
          .addScriptTag({content: 'window.__injected = 42;'})
          .catch(error => {
            return void error;
          });
        assert.strictEqual(
          await frame.evaluate(() => {
            return (globalThis as any).__injected;
          }),
          42,
        );
      }
    });
  });

  describe('Page.addScriptTag', function () {
    it('should throw an error if no options are provided', async () => {
      const {page} = await getTestState();

      let error!: Error;
      try {
        // @ts-expect-error purposefully passing bad options
        await page.addScriptTag('/injectedfile.js');
      } catch (error_) {
        error = error_ as Error;
      }
      assert.strictEqual(
        error.message,
        'Exactly one of `url`, `path`, or `content` must be specified.',
      );
    });

    it('should work with a url', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      using scriptHandle = await page.addScriptTag({url: '/injectedfile.js'});
      assert.isNotNull(scriptHandle.asElement());
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
        42,
      );
    });

    it('should work with a url and type=module', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({url: '/es6/es6import.js', type: 'module'});
      assert.strictEqual(
        await page.evaluate(() => {
          return (window as unknown as {__es6injected: number}).__es6injected;
        }),
        42,
      );
    });

    it('should work with a path and type=module', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({
        path: path.join(import.meta.dirname, '../assets/es6/es6pathimport.js'),
        type: 'module',
      });
      await page.waitForFunction(() => {
        return (window as unknown as {__es6injected: number}).__es6injected;
      });
      assert.strictEqual(
        await page.evaluate(() => {
          return (window as unknown as {__es6injected: number}).__es6injected;
        }),
        42,
      );
    });

    it('should work with a content and type=module', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({
        content: `import num from '/es6/es6module.js';window.__es6injected = num;`,
        type: 'module',
      });
      await page.waitForFunction(() => {
        return (window as unknown as {__es6injected: number}).__es6injected;
      });
      assert.strictEqual(
        await page.evaluate(() => {
          return (window as unknown as {__es6injected: number}).__es6injected;
        }),
        42,
      );
    });

    it('should throw an error if loading from url fail', async () => {
      const {page, server, isFirefox} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error!: Error;
      try {
        await page.addScriptTag({url: '/nonexistfile.js'});
      } catch (error_) {
        error = error_ as Error;
      }
      if (isFirefox) {
        assert.ok(error.message);
      } else {
        assert.include(error.message, 'Could not load script');
      }
    });

    it('should work with a path', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      using scriptHandle = await page.addScriptTag({
        path: path.join(import.meta.dirname, '../assets/injectedfile.js'),
      });
      assert.isNotNull(scriptHandle.asElement());
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
        42,
      );
    });

    it('should include sourcemap when path is provided', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({
        path: path.join(import.meta.dirname, '../assets/injectedfile.js'),
      });
      const result = await page.evaluate(() => {
        return (globalThis as any).__injectedError.stack;
      });
      assert.include(result, path.join('assets', 'injectedfile.js'));
    });

    it('should work with content', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      using scriptHandle = await page.addScriptTag({
        content: 'window.__injected = 35;',
      });
      assert.isNotNull(scriptHandle.asElement());
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        }),
        35,
      );
    });

    it('should add id when provided', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({content: 'window.__injected = 1;', id: 'one'});
      await page.addScriptTag({url: '/injectedfile.js', id: 'two'});
      assert.isNotNull(await page.$('#one'));
      assert.isNotNull(await page.$('#two'));
    });

    // @see https://github.com/puppeteer/puppeteer/issues/4840
    it('should throw when added with content to the CSP page', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error!: Error;
      await page
        .addScriptTag({content: 'window.__injected = 35;'})
        .catch(error_ => {
          return (error = error_);
        });
      assert.ok(error);
    });

    it('should throw when added with URL to the CSP page', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error!: Error;
      await page
        .addScriptTag({url: server.CROSS_PROCESS_PREFIX + '/injectedfile.js'})
        .catch(error_ => {
          return (error = error_);
        });
      assert.ok(error);
    });
  });

  describe('Page.addStyleTag', function () {
    it('should throw an error if no options are provided', async () => {
      const {page} = await getTestState();

      let error!: Error;
      try {
        // @ts-expect-error purposefully passing bad input
        await page.addStyleTag('/injectedstyle.css');
      } catch (error_) {
        error = error_ as Error;
      }
      assert.strictEqual(
        error.message,
        'Exactly one of `url`, `path`, or `content` must be specified.',
      );
    });

    it('should work with a url', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      using styleHandle = await page.addStyleTag({url: '/injectedstyle.css'});
      assert.isNotNull(styleHandle.asElement());
      assert.strictEqual(
        await page.evaluate(
          `window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`,
        ),
        'rgb(255, 0, 0)',
      );
    });

    it('should throw an error if loading from url fail', async () => {
      const {page, server, isFirefox} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error!: Error;
      try {
        await page.addStyleTag({url: '/nonexistfile.js'});
      } catch (error_) {
        error = error_ as Error;
      }
      if (isFirefox) {
        assert.ok(error.message);
      } else {
        assert.include(error.message, 'Could not load style');
      }
    });

    it('should work with a path', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      using styleHandle = await page.addStyleTag({
        path: path.join(import.meta.dirname, '../assets/injectedstyle.css'),
      });
      assert.isNotNull(styleHandle.asElement());
      assert.strictEqual(
        await page.evaluate(
          `window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`,
        ),
        'rgb(255, 0, 0)',
      );
    });

    it('should include sourcemap when path is provided', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addStyleTag({
        path: path.join(import.meta.dirname, '../assets/injectedstyle.css'),
      });
      using styleHandle = (await page.$('style'))!;
      const styleContent = await page.evaluate(style => {
        return style.innerHTML;
      }, styleHandle);
      assert.include(styleContent, path.join('assets', 'injectedstyle.css'));
    });

    it('should work with content', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      using styleHandle = await page.addStyleTag({
        content: 'body { background-color: green; }',
      });
      assert.isNotNull(styleHandle.asElement());
      assert.strictEqual(
        await page.evaluate(
          `window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`,
        ),
        'rgb(0, 128, 0)',
      );
    });

    it('should throw when added with content to the CSP page', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error!: Error;
      await page
        .addStyleTag({content: 'body { background-color: green; }'})
        .catch(error_ => {
          return (error = error_);
        });
      assert.ok(error);
    });

    it('should throw when added with URL to the CSP page', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error!: Error;
      await page
        .addStyleTag({
          url: server.CROSS_PROCESS_PREFIX + '/injectedstyle.css',
        })
        .catch(error_ => {
          return (error = error_);
        });
      assert.ok(error);
    });
  });

  describe('Page.url', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      assert.strictEqual(page.url(), 'about:blank');
      await page.goto(server.EMPTY_PAGE);
      assert.strictEqual(page.url(), server.EMPTY_PAGE);
    });
  });

  describe('Page.setJavaScriptEnabled', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.setJavaScriptEnabled(false);
      assert.isFalse(page.isJavaScriptEnabled());
      await page.goto(
        'data:text/html, <script>var something = "forbidden"</script>',
      );
      let error!: Error;
      await page.evaluate('something').catch(error_ => {
        return (error = error_);
      });
      assert.include(error.message, 'something is not defined');

      await page.setJavaScriptEnabled(true);
      assert.isTrue(page.isJavaScriptEnabled());
      await page.goto(
        'data:text/html, <script>var something = "forbidden"</script>',
      );
      assert.strictEqual(await page.evaluate('something'), 'forbidden');
    });
    it('setInterval should pause', async () => {
      const {page} = await getTestState();

      // Set up an interval that increments a counter every 0ms. This will queue up tasks
      // to run as fast as possible.
      await page.evaluate(() => {
        return setInterval(() => {
          return ((globalThis as any).intervalCounter =
            ((globalThis as any).intervalCounter ?? 0) + 1);
        }, 0);
      });

      // Disable JavaScript execution on the page. This should pause timers.
      await page.setJavaScriptEnabled(false);

      // Capture the current value of the counter after JS is disabled.
      const intervalCounter = await page.evaluate(() => {
        return (globalThis as any).intervalCounter;
      });

      // Wait for 100 ms. This gives the event loop with the task a
      // chance to run if it were not paused, which would have incremented the counter.
      await new Promise(resolve => {
        return setTimeout(resolve, 100);
      });

      // Verify that the counter has not changed, confirming that setInterval was paused
      // when JavaScript was disabled.
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).intervalCounter;
        }),
        intervalCounter,
      );
      // Re-enable JavaScript execution.
      await page.setJavaScriptEnabled(true);

      // Wait for another task. It should be long enough to avoid flakiness, as the
      // original `setInterval` will be throttled after several invocations.
      await page.evaluate(() => {
        return new Promise(resolve => {
          return setTimeout(resolve, 100);
        });
      });

      // Verify that the counter increased. This confirms that timers resumed when
      // JavaScript is re-enabled.
      assert.isAbove(
        await page.evaluate(() => {
          return (globalThis as any).intervalCounter;
        }),
        intervalCounter,
      );
    });
    it('setTimeout should stop', async () => {
      const {page} = await getTestState();

      // Set up a recursive setTimeout chain. The `task` function increments a counter and
      // immediately schedules itself to run again.
      await page.evaluate(() => {
        const task = () => {
          (globalThis as any).timeoutCounter =
            ((globalThis as any).timeoutCounter ?? 0) + 1;
          setTimeout(task, 0);
        };
        task();
      });

      // Disable JavaScript, which should pause the timeout chain.
      await page.setJavaScriptEnabled(false);

      // Capture the counter's value after the timeout chain is paused.
      const timeoutCounter = await page.evaluate(() => {
        return (globalThis as any).timeoutCounter;
      });

      // Wait for 100 ms. This gives the event loop with the task a
      // chance to run if it were not paused, which would have incremented the counter.
      await new Promise(resolve => {
        return setTimeout(resolve, 100);
      });

      // Verify the counter has not changed, confirming that setTimeout was paused.
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).timeoutCounter;
        }),
        timeoutCounter,
      );

      // Re-enable JavaScript.
      await page.setJavaScriptEnabled(true);

      // Wait for another task. It should be long enough to avoid flakiness, as the
      // original `setInterval` will be throttled after several invocations.
      await page.evaluate(() => {
        return new Promise(resolve => {
          return setTimeout(resolve, 100);
        });
      });

      // Verify the counter still has not changed, confirming that `setTimeout` do not
      // resume upon re-enabling JavaScript.
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).timeoutCounter;
        }),
        timeoutCounter,
      );
    });
    it('then should not pause', async () => {
      const {page} = await getTestState();

      // Disable JavaScript execution on the page.
      await page.setJavaScriptEnabled(false);

      // Assert the microtasks continue to work even when page scripts are disabled.
      assert.strictEqual(
        await page.evaluate(() => {
          return Promise.resolve().then(() => {
            return 42;
          });
        }),
        42,
      );
    });
  });

  describe('Page.reload', function () {
    it('should enable or disable the cache based on reload params', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/cached/one-style.html');
      const [cachedRequest] = await Promise.all([
        server.waitForRequest('/cached/one-style.html'),
        page.reload(),
      ]);
      // Rely on "if-modified-since" caching in our test server.
      assert.isDefined(cachedRequest.headers['if-modified-since']);

      const [nonCachedRequest] = await Promise.all([
        server.waitForRequest('/cached/one-style.html'),
        page.reload({
          ignoreCache: true,
        }),
      ]);
      assert.isUndefined(nonCachedRequest.headers['if-modified-since']);
    });
  });

  describe('Page.setCacheEnabled', function () {
    it('should enable or disable the cache based on the state passed', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/cached/one-style.html');
      const [cachedRequest] = await Promise.all([
        server.waitForRequest('/cached/one-style.html'),
        page.reload(),
      ]);
      // Rely on "if-modified-since" caching in our test server.
      assert.isDefined(cachedRequest.headers['if-modified-since']);

      await page.setCacheEnabled(false);
      const [nonCachedRequest] = await Promise.all([
        server.waitForRequest('/cached/one-style.html'),
        page.reload(),
      ]);
      assert.isUndefined(nonCachedRequest.headers['if-modified-since']);
    });
    it('should stay disabled when toggling request interception on/off', async () => {
      const {page, server} = await getTestState();

      await page.setCacheEnabled(false);
      await page.setRequestInterception(true);
      await page.setRequestInterception(false);

      await page.goto(server.PREFIX + '/cached/one-style.html');
      const [nonCachedRequest] = await Promise.all([
        server.waitForRequest('/cached/one-style.html'),
        page.reload(),
      ]);
      assert.isUndefined(nonCachedRequest.headers['if-modified-since']);
    });
  });

  describe('Page.pdf', function () {
    it('can print to PDF and save to file', async () => {
      const {page, server} = await getTestState();

      const outputFile = import.meta.dirname + '/../assets/output.pdf';
      await page.goto(server.PREFIX + '/pdf.html');
      await page.pdf({path: outputFile});
      try {
        assert.isAbove(fs.readFileSync(outputFile).byteLength, 0);
      } finally {
        fs.unlinkSync(outputFile);
      }
    });

    it('can print to PDF and stream the result', async () => {
      const {page} = await getTestState();

      const stream = await page.createPDFStream();
      let size = 0;
      const reader = stream.getReader();
      while (true) {
        const {done, value} = await reader.read();
        if (done) {
          break;
        }
        size += value.length;
      }

      assert.isAbove(size, 0);
    });

    it('should respect timeout', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/pdf.html');

      const error = await page.pdf({timeout: 1}).catch(err => {
        return err;
      });
      assert.instanceOf(error, TimeoutError);
    });
  });

  describe('Page.title', function () {
    it('should return the page title', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/title.html');
      assert.strictEqual(await page.title(), 'Woof-Woof');
    });
  });

  describe('Page.select', function () {
    it('should select single option', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onInput;
        }),
        ['blue'],
      );
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onChange;
        }),
        ['blue'],
      );
    });
    it('should select only first option', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue', 'green', 'red');
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onInput;
        }),
        ['blue'],
      );
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onChange;
        }),
        ['blue'],
      );
    });
    it('should not throw when select causes navigation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.$eval('select', select => {
        return select.addEventListener('input', () => {
          return ((window as any).location = '/empty.html');
        });
      });
      await Promise.all([
        page.select('select', 'blue'),
        page.waitForNavigation(),
      ]);
      assert.include(page.url(), 'empty.html');
    });
    it('should select multiple options', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => {
        return (globalThis as any).makeMultiple();
      });
      await page.select('select', 'blue', 'green', 'red');
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onInput;
        }),
        ['blue', 'green', 'red'],
      );
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onChange;
        }),
        ['blue', 'green', 'red'],
      );
    });
    it('should respect event bubbling', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onBubblingInput;
        }),
        ['blue'],
      );
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onBubblingChange;
        }),
        ['blue'],
      );
    });
    it('should throw when element is not a <select>', async () => {
      const {page, server} = await getTestState();

      let error!: Error;
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('body', '').catch(error_ => {
        return (error = error_);
      });
      assert.include(error.message, 'Element is not a <select> element.');
    });
    it('should return [] on no matched values', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select', '42', 'abc');
      assert.deepEqual(result, []);
    });
    it('should return an array of matched values', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => {
        return (globalThis as any).makeMultiple();
      });
      const result = await page.select('select', 'blue', 'black', 'magenta');
      assert.deepEqual(
        result.reduce((accumulator, current) => {
          return ['blue', 'black', 'magenta'].includes(current) && accumulator;
        }, true),
        true,
      );
    });
    it('should return an array of one element when multiple is not set', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select(
        'select',
        '42',
        'blue',
        'black',
        'magenta',
      );
      assert.lengthOf(result, 1);
    });
    it('should return [] on no values', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select');
      assert.deepEqual(result, []);
    });
    it('should deselect all options when passed no values for a multiple select', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => {
        return (globalThis as any).makeMultiple();
      });
      await page.select('select', 'blue', 'black', 'magenta');
      await page.select('select');
      assert.deepEqual(
        await page.$eval('select', select => {
          return Array.from(select.options).every(option => {
            return !option.selected;
          });
        }),
        true,
      );
    });
    it('should deselect all options when passed no values for a select without multiple', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue', 'black', 'magenta');
      await page.select('select');
      assert.deepEqual(
        await page.$eval('select', select => {
          return Array.from(select.options).filter(option => {
            return option.selected;
          })[0]!.value;
        }),
        '',
      );
    });
    it('should throw if passed in non-strings', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<select>
          <option value="12"></option>
        </select>`,
      );
      let error!: Error;
      try {
        // @ts-expect-error purposefully passing bad input
        await page.select('select', 12);
      } catch (error_) {
        error = error_ as Error;
      }
      assert.include(error.message, 'Values must be strings');
    });
    // @see https://github.com/puppeteer/puppeteer/issues/3327
    it('should work when re-defining top-level Event class', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => {
        // @ts-expect-error Expected.
        return (window.Event = undefined);
      });
      await page.select('select', 'blue');
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onInput;
        }),
        ['blue'],
      );
      assert.deepEqual(
        await page.evaluate(() => {
          return (globalThis as any).result.onChange;
        }),
        ['blue'],
      );
    });
  });

  describe('Page.Events.Close', function () {
    it('should work with window.close', async () => {
      const {page, context} = await getTestState();

      const newPagePromise = new Promise<Page | null>(fulfill => {
        return context.once('targetcreated', target => {
          return fulfill(target.page());
        });
      });
      assert.ok(page);
      await page.evaluate(() => {
        return ((window as any)['newPage'] = window.open('about:blank'));
      });
      const newPage = await newPagePromise;
      assert.ok(newPage);
      const closedPromise = waitEvent(newPage, 'close');
      await page.evaluate(() => {
        return (window as any)['newPage'].close();
      });
      await closedPromise;
    });
    it('should work with page.close', async () => {
      const {context} = await getTestState();

      const newPage = await context.newPage();
      const closedPromise = waitEvent(newPage, 'close');
      await newPage.close();
      await closedPromise;
    });
  });

  describe('Page.Events.Issue', function () {
    describe('when issues are disabled', () => {
      const state = setupSeparateTestBrowserHooks({
        issuesEnabled: false,
      });

      it('should be able to connect and disable issues', async () => {
        const {page, server} = state;

        let issueEmitted = false;
        page.on('issue', () => {
          issueEmitted = true;
        });

        await page.goto(server.PREFIX + '/csp.html');

        assert.isFalse(issueEmitted);
      });
    });
    it('should emit issue event when CSP violation occurs', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/csp.html');

      const issuePromise = waitEvent<Issue>(page, 'issue');

      await page.addScriptTag({content: 'console.log("CSP test")'});

      const issue = await issuePromise;
      assert.ok(issue);
      assert.strictEqual(issue.code, 'ContentSecurityPolicyIssue');
    });

    it('should emit issue event from cross-origin iframe', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);

      const issuePromise = waitEvent<Issue>(page, 'issue');

      const crossOriginUrl = server.CROSS_PROCESS_PREFIX + '/csp.html';
      await page.setContent(html`<iframe src="${crossOriginUrl}"></iframe>`);

      const frame = await page.waitForFrame(crossOriginUrl);
      assert.ok(frame);

      await frame.addScriptTag({
        content: 'console.log("CSP test in iframe")',
      });

      const issue = await issuePromise;
      assert.ok(issue);
      assert.strictEqual(issue.code, 'ContentSecurityPolicyIssue');
    });
  });

  describe('Page.browser', function () {
    it('should return the correct browser instance', async () => {
      const {page, browser} = await getTestState();

      assert.strictEqual(page.browser(), browser);
    });
  });

  describe('Page.browserContext', function () {
    it('should return the correct browser context instance', async () => {
      const {page, context} = await getTestState();

      assert.strictEqual(page.browserContext(), context);
    });
  });

  describe('Page.client', function () {
    it('should return the client instance', async () => {
      const {page} = await getTestState();
      assert.isTrue((page as CdpPage)._client() instanceof CDPSession);
    });
  });

  describe('Page.bringToFront', function () {
    it('should work', async () => {
      const {context} = await getTestState();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.bringToFront();
      assert.strictEqual(
        await page1.evaluate(() => {
          return document.visibilityState;
        }),
        'visible',
      );
      assert.strictEqual(
        await page2.evaluate(() => {
          return document.visibilityState;
        }),
        'hidden',
      );

      await page2.bringToFront();
      assert.strictEqual(
        await page1.evaluate(() => {
          return document.visibilityState;
        }),
        'hidden',
      );
      assert.strictEqual(
        await page2.evaluate(() => {
          return document.visibilityState;
        }),
        'visible',
      );

      await page1.close();
      await page2.close();
    });
  });

  describe('Page.resize', function () {
    const state = setupSeparateTestBrowserHooks({
      args: ['--screen-info={3840x2160}'],
    });

    it('should resize the browser window to fit page content', async () => {
      const {context} = state;

      const page = await context.newPage();

      // Default view port restricts window to 800x600, so remove it.
      await page.setViewport(null);

      const contentWidth = 500;
      const contentHeight = 400;
      const resized = page.evaluate(() => {
        return new Promise(resolve => {
          window.onresize = resolve;
        });
      });
      await page.resize({contentWidth, contentHeight});
      await resized;

      const innerSize = await page.evaluate(() => {
        return {width: window.innerWidth, height: window.innerHeight};
      });
      assert.strictEqual(innerSize.width, contentWidth);
      assert.strictEqual(innerSize.height, contentHeight);
    });

    it('should resize the browser window to fit page content when fullscreen', async () => {
      const {browser, context} = state;

      const page = await context.newPage();
      // Default view port restricts window to 800x600, so remove it.
      await page.setViewport(null);
      const windowId = await page.windowId();
      await browser.setWindowBounds(windowId, {windowState: 'fullscreen'});

      const windowState = await browser.getWindowBounds(windowId);
      assert.strictEqual(windowState.windowState, 'fullscreen');

      await browser.setWindowBounds(windowId, {windowState: 'normal'});
      await browser.setWindowBounds(windowId, {windowState: 'normal'});

      const contentWidth = 500;
      const contentHeight = 400;
      const resized = page.evaluate(() => {
        return new Promise(resolve => {
          window.onresize = resolve;
        });
      });
      await page.resize({contentWidth, contentHeight});
      await resized;

      const innerSize = await page.evaluate(() => {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
        };
      });

      assert.strictEqual(innerSize.width, contentWidth);
      assert.strictEqual(innerSize.height, contentHeight);
    });
  });

  describe('Page.record', function () {
    it('should record page', async () => {
      using file = getUniqueVideoFilePlaceholder();

      const {page} = await getTestState();

      const recording = await page.record({
        path: file.filename,
      });

      await page.goto('data:text/html,<input>');
      using input = await page.locator('input').waitHandle();
      await input.type('ab', {delay: 100});

      await recording.stop();

      assert.isAbove(fs.statSync(file.filename).size, 0);
    });
  });
});
