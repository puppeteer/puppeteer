/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import expect from 'expect';
import fs from 'fs';
import {ServerResponse} from 'http';
import path from 'path';
import sinon from 'sinon';
import {CDPSession} from '../../lib/cjs/puppeteer/common/Connection.js';
import {ConsoleMessage} from '../../lib/cjs/puppeteer/common/ConsoleMessage.js';
import {Metrics, Page} from '../../lib/cjs/puppeteer/common/Page.js';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';
import utils, {attachFrame, waitEvent} from './utils.js';

describe('Page', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  describe('Page.close', function () {
    it('should reject all promises when page is closed', async () => {
      const {context} = getTestState();

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
      expect(error.message).toContain('Protocol error');
    });
    it('should not be visible in browser.pages', async () => {
      const {browser} = getTestState();

      const newPage = await browser.newPage();
      expect(await browser.pages()).toContain(newPage);
      await newPage.close();
      expect(await browser.pages()).not.toContain(newPage);
    });
    it('should run beforeunload if asked for', async () => {
      const {context, server, isChrome} = getTestState();

      const newPage = await context.newPage();
      await newPage.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await newPage.click('body');
      const pageClosingPromise = newPage.close({runBeforeUnload: true});
      const dialog = await waitEvent(newPage, 'dialog');
      expect(dialog.type()).toBe('beforeunload');
      expect(dialog.defaultValue()).toBe('');
      if (isChrome) {
        expect(dialog.message()).toBe('');
      } else {
        expect(dialog.message()).toBeTruthy();
      }
      await dialog.accept();
      await pageClosingPromise;
    });
    it('should *not* run beforeunload by default', async () => {
      const {context, server} = getTestState();

      const newPage = await context.newPage();
      await newPage.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await newPage.click('body');
      await newPage.close();
    });
    it('should set the page close state', async () => {
      const {context} = getTestState();

      const newPage = await context.newPage();
      expect(newPage.isClosed()).toBe(false);
      await newPage.close();
      expect(newPage.isClosed()).toBe(true);
    });
    it('should terminate network waiters', async () => {
      const {context, server} = getTestState();

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
        expect(message).toContain('Target closed');
        expect(message).not.toContain('Timeout');
      }
    });
  });

  describe('Page.Events.Load', function () {
    it('should fire when expected', async () => {
      const {page} = getTestState();

      await Promise.all([
        page.goto('about:blank'),
        utils.waitEvent(page, 'load'),
      ]);
    });
  });

  describe('removing and adding event handlers', () => {
    it('should correctly fire event handlers as they are added and then removed', async () => {
      const {page, server} = getTestState();

      const handler = sinon.spy();
      const onResponse = (response: {url: () => string}) => {
        // Ignore default favicon requests.
        if (!response.url().endsWith('favicon.ico')) {
          handler();
        }
      };
      page.on('response', onResponse);
      await page.goto(server.EMPTY_PAGE);
      expect(handler.callCount).toBe(1);
      page.off('response', onResponse);
      await page.goto(server.EMPTY_PAGE);
      // Still one because we removed the handler.
      expect(handler.callCount).toBe(1);
      page.on('response', onResponse);
      await page.goto(server.EMPTY_PAGE);
      // Two now because we added the handler back.
      expect(handler.callCount).toBe(2);
    });

    it('should correctly added and removed request events', async () => {
      const {page, server} = getTestState();

      const handler = sinon.spy();
      const onResponse = (response: {url: () => string}) => {
        // Ignore default favicon requests.
        if (!response.url().endsWith('favicon.ico')) {
          handler();
        }
      };

      page.on('request', onResponse);
      page.on('request', onResponse);
      await page.goto(server.EMPTY_PAGE);
      expect(handler.callCount).toBe(2);
      page.off('request', onResponse);
      await page.goto(server.EMPTY_PAGE);
      // Still one because we removed the handler.
      expect(handler.callCount).toBe(3);
      page.off('request', onResponse);
      await page.goto(server.EMPTY_PAGE);
      expect(handler.callCount).toBe(3);
      page.on('request', onResponse);
      await page.goto(server.EMPTY_PAGE);
      // Two now because we added the handler back.
      expect(handler.callCount).toBe(4);
    });
  });

  describe('Page.Events.error', function () {
    it('should throw when page crashes', async () => {
      const {page} = getTestState();

      let error!: Error;
      page.on('error', err => {
        return (error = err);
      });
      page.goto('chrome://crash').catch(() => {});
      await waitEvent(page, 'error');
      expect(error.message).toBe('Page crashed!');
    });
  });

  describe('Page.Events.Popup', function () {
    it('should work', async () => {
      const {page} = getTestState();

      const [popup] = await Promise.all([
        new Promise<Page>(x => {
          return page.once('popup', x);
        }),
        page.evaluate(() => {
          return window.open('about:blank');
        }),
      ]);
      expect(
        await page.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
      expect(
        await popup.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(true);
    });
    it('should work with noopener', async () => {
      const {page} = getTestState();

      const [popup] = await Promise.all([
        new Promise<Page>(x => {
          return page.once('popup', x);
        }),
        page.evaluate(() => {
          return window.open('about:blank', undefined, 'noopener');
        }),
      ]);
      expect(
        await page.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
      expect(
        await popup.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
    });
    it('should work with clicking target=_blank and without rel=opener', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent('<a target=_blank href="/one-style.html">yo</a>');
      const [popup] = await Promise.all([
        new Promise<Page>(x => {
          return page.once('popup', x);
        }),
        page.click('a'),
      ]);
      expect(
        await page.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
      expect(
        await popup.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
    });
    it('should work with clicking target=_blank and with rel=opener', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        '<a target=_blank rel=opener href="/one-style.html">yo</a>'
      );
      const [popup] = await Promise.all([
        new Promise<Page>(x => {
          return page.once('popup', x);
        }),
        page.click('a'),
      ]);
      expect(
        await page.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
      expect(
        await popup.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(true);
    });
    it('should work with fake-clicking target=_blank and rel=noopener', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        '<a target=_blank rel=noopener href="/one-style.html">yo</a>'
      );
      const [popup] = await Promise.all([
        new Promise<Page>(x => {
          return page.once('popup', x);
        }),
        page.$eval('a', a => {
          return (a as HTMLAnchorElement).click();
        }),
      ]);
      expect(
        await page.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
      expect(
        await popup.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
    });
    it('should work with clicking target=_blank and rel=noopener', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        '<a target=_blank rel=noopener href="/one-style.html">yo</a>'
      );
      const [popup] = await Promise.all([
        new Promise<Page>(x => {
          return page.once('popup', x);
        }),
        page.click('a'),
      ]);
      expect(
        await page.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
      expect(
        await popup.evaluate(() => {
          return !!window.opener;
        })
      ).toBe(false);
    });
  });

  describe('BrowserContext.overridePermissions', function () {
    function getPermission(page: Page, name: PermissionName) {
      return page.evaluate(name => {
        return navigator.permissions.query({name}).then(result => {
          return result.state;
        });
      }, name);
    }

    it('should be prompt by default', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
    });
    it('should deny permission when not listed', async () => {
      const {page, server, context} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, []);
      expect(await getPermission(page, 'geolocation')).toBe('denied');
    });
    it('should fail when bad permission is given', async () => {
      const {page, server, context} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error!: Error;
      await context
        // @ts-expect-error purposeful bad input for test
        .overridePermissions(server.EMPTY_PAGE, ['foo'])
        .catch(error_ => {
          return (error = error_);
        });
      expect(error.message).toBe('Unknown permission: foo');
    });
    it('should grant permission when listed', async () => {
      const {page, server, context} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      expect(await getPermission(page, 'geolocation')).toBe('granted');
    });
    it('should reset permissions', async () => {
      const {page, server, context} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      expect(await getPermission(page, 'geolocation')).toBe('granted');
      await context.clearPermissionOverrides();
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
    });
    it('should trigger permission onchange', async () => {
      const {page, server, context, isHeadless} = getTestState();

      // TODO: re-enable this test in headful once crbug.com/1324480 rolls out.
      if (!isHeadless) {
        return;
      }

      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        (globalThis as any).events = [];
        return navigator.permissions
          .query({name: 'geolocation'})
          .then(function (result) {
            (globalThis as any).events.push(result.state);
            result.onchange = function () {
              (globalThis as any).events.push(result.state);
            };
          });
      });
      expect(
        await page.evaluate(() => {
          return (globalThis as any).events;
        })
      ).toEqual(['prompt']);
      await context.overridePermissions(server.EMPTY_PAGE, []);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).events;
        })
      ).toEqual(['prompt', 'denied']);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).events;
        })
      ).toEqual(['prompt', 'denied', 'granted']);
      await context.clearPermissionOverrides();
      expect(
        await page.evaluate(() => {
          return (globalThis as any).events;
        })
      ).toEqual(['prompt', 'denied', 'granted', 'prompt']);
    });
    it('should isolate permissions between browser contexts', async () => {
      const {page, server, context, browser} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const otherContext = await browser.createIncognitoBrowserContext();
      const otherPage = await otherContext.newPage();
      await otherPage.goto(server.EMPTY_PAGE);
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
      expect(await getPermission(otherPage, 'geolocation')).toBe('prompt');

      await context.overridePermissions(server.EMPTY_PAGE, []);
      await otherContext.overridePermissions(server.EMPTY_PAGE, [
        'geolocation',
      ]);
      expect(await getPermission(page, 'geolocation')).toBe('denied');
      expect(await getPermission(otherPage, 'geolocation')).toBe('granted');

      await context.clearPermissionOverrides();
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
      expect(await getPermission(otherPage, 'geolocation')).toBe('granted');

      await otherContext.close();
    });
    it('should grant persistent-storage', async () => {
      const {page, server, context} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      expect(await getPermission(page, 'persistent-storage')).not.toBe(
        'granted'
      );
      await context.overridePermissions(server.EMPTY_PAGE, [
        'persistent-storage',
      ]);
      expect(await getPermission(page, 'persistent-storage')).toBe('granted');
    });
  });

  describe('Page.setGeolocation', function () {
    it('should work', async () => {
      const {page, server, context} = getTestState();

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
      expect(geolocation).toEqual({
        latitude: 10,
        longitude: 10,
      });
    });
    it('should throw when invalid longitude', async () => {
      const {page} = getTestState();

      let error!: Error;
      try {
        await page.setGeolocation({longitude: 200, latitude: 10});
      } catch (error_) {
        error = error_ as Error;
      }
      expect(error.message).toContain('Invalid longitude "200"');
    });
  });

  describe('Page.setOfflineMode', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.setOfflineMode(true);
      let error!: Error;
      await page.goto(server.EMPTY_PAGE).catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeTruthy();
      await page.setOfflineMode(false);
      const response = (await page.reload())!;
      expect(response.status()).toBe(200);
    });
    it('should emulate navigator.onLine', async () => {
      const {page} = getTestState();

      expect(
        await page.evaluate(() => {
          return window.navigator.onLine;
        })
      ).toBe(true);
      await page.setOfflineMode(true);
      expect(
        await page.evaluate(() => {
          return window.navigator.onLine;
        })
      ).toBe(false);
      await page.setOfflineMode(false);
      expect(
        await page.evaluate(() => {
          return window.navigator.onLine;
        })
      ).toBe(true);
    });
  });

  describe('ExecutionContext.queryObjects', function () {
    it('should work', async () => {
      const {page} = getTestState();

      // Instantiate an object
      await page.evaluate(() => {
        return ((globalThis as any).set = new Set(['hello', 'world']));
      });
      const prototypeHandle = await page.evaluateHandle(() => {
        return Set.prototype;
      });
      const objectsHandle = await page.queryObjects(prototypeHandle);
      const count = await page.evaluate(objects => {
        return objects.length;
      }, objectsHandle);
      expect(count).toBe(1);
      const values = await page.evaluate(objects => {
        return Array.from(objects[0]!.values());
      }, objectsHandle);
      expect(values).toEqual(['hello', 'world']);
    });
    it('should work for non-blank page', async () => {
      const {page, server} = getTestState();

      // Instantiate an object
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        return ((globalThis as any).set = new Set(['hello', 'world']));
      });
      const prototypeHandle = await page.evaluateHandle(() => {
        return Set.prototype;
      });
      const objectsHandle = await page.queryObjects(prototypeHandle);
      const count = await page.evaluate(objects => {
        return objects.length;
      }, objectsHandle);
      expect(count).toBe(1);
    });
    it('should fail for disposed handles', async () => {
      const {page} = getTestState();

      const prototypeHandle = await page.evaluateHandle(() => {
        return HTMLBodyElement.prototype;
      });
      await prototypeHandle.dispose();
      let error!: Error;
      await page.queryObjects(prototypeHandle).catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toBe('Prototype JSHandle is disposed!');
    });
    it('should fail primitive values as prototypes', async () => {
      const {page} = getTestState();

      const prototypeHandle = await page.evaluateHandle(() => {
        return 42;
      });
      let error!: Error;
      await page.queryObjects(prototypeHandle).catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toBe(
        'Prototype JSHandle must not be referencing primitive value'
      );
    });
  });

  describe('Page.Events.Console', function () {
    it('should work', async () => {
      const {page} = getTestState();

      let message!: ConsoleMessage;
      page.once('console', m => {
        return (message = m);
      });
      await Promise.all([
        page.evaluate(() => {
          return console.log('hello', 5, {foo: 'bar'});
        }),
        waitEvent(page, 'console'),
      ]);
      expect(message.text()).toEqual('hello 5 JSHandle@object');
      expect(message.type()).toEqual('log');
      expect(message.args()).toHaveLength(3);
      expect(message.location()).toEqual({
        url: expect.any(String),
        lineNumber: expect.any(Number),
        columnNumber: expect.any(Number),
      });

      expect(await message.args()[0]!.jsonValue()).toEqual('hello');
      expect(await message.args()[1]!.jsonValue()).toEqual(5);
      expect(await message.args()[2]!.jsonValue()).toEqual({foo: 'bar'});
    });
    it('should work for different console API calls', async () => {
      const {page} = getTestState();

      const messages: any[] = [];
      page.on('console', msg => {
        return messages.push(msg);
      });
      // All console events will be reported before `page.evaluate` is finished.
      await page.evaluate(() => {
        // A pair of time/timeEnd generates only one Console API call.
        console.time('calling console.time');
        console.timeEnd('calling console.time');
        console.trace('calling console.trace');
        console.dir('calling console.dir');
        console.warn('calling console.warn');
        console.error('calling console.error');
        console.log(Promise.resolve('should not wait until resolved!'));
      });
      expect(
        messages.map(msg => {
          return msg.type();
        })
      ).toEqual(['timeEnd', 'trace', 'dir', 'warning', 'error', 'log']);
      expect(messages[0]!.text()).toContain('calling console.time');
      expect(
        messages.slice(1).map(msg => {
          return msg.text();
        })
      ).toEqual([
        'calling console.trace',
        'calling console.dir',
        'calling console.warn',
        'calling console.error',
        'JSHandle@promise',
      ]);
    });
    it('should not fail for window object', async () => {
      const {page} = getTestState();

      let message!: ConsoleMessage;
      page.once('console', msg => {
        return (message = msg);
      });
      await Promise.all([
        page.evaluate(() => {
          return console.error(window);
        }),
        waitEvent(page, 'console'),
      ]);
      expect(message.text()).toBe('JSHandle@object');
    });
    it('should trigger correct Log', async () => {
      const {page, server, isChrome} = getTestState();

      await page.goto('about:blank');
      const [message] = await Promise.all([
        waitEvent(page, 'console'),
        page.evaluate(async (url: string) => {
          return fetch(url).catch(() => {});
        }, server.EMPTY_PAGE),
      ]);
      expect(message.text()).toContain('Access-Control-Allow-Origin');
      if (isChrome) {
        expect(message.type()).toEqual('error');
      } else {
        expect(message.type()).toEqual('warn');
      }
    });
    it('should have location when fetch fails', async () => {
      const {page, server} = getTestState();

      // The point of this test is to make sure that we report console messages from
      // Log domain: https://vanilla.aslushnikov.com/?Log.entryAdded
      await page.goto(server.EMPTY_PAGE);
      const [message] = await Promise.all([
        waitEvent(page, 'console'),
        page.setContent(`<script>fetch('http://wat');</script>`),
      ]);
      expect(message.text()).toContain(`ERR_NAME_NOT_RESOLVED`);
      expect(message.type()).toEqual('error');
      expect(message.location()).toEqual({
        url: 'http://wat/',
        lineNumber: undefined,
      });
    });
    it('should have location and stack trace for console API calls', async () => {
      const {page, server, isChrome} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [message] = await Promise.all([
        waitEvent(page, 'console'),
        page.goto(server.PREFIX + '/consolelog.html'),
      ]);
      expect(message.text()).toBe('yellow');
      expect(message.type()).toBe('log');
      expect(message.location()).toEqual({
        url: server.PREFIX + '/consolelog.html',
        lineNumber: 8,
        columnNumber: isChrome ? 16 : 8, // console.|log vs |console.log
      });
      expect(message.stackTrace()).toEqual([
        {
          url: server.PREFIX + '/consolelog.html',
          lineNumber: 8,
          columnNumber: isChrome ? 16 : 8, // console.|log vs |console.log
        },
        {
          url: server.PREFIX + '/consolelog.html',
          lineNumber: 11,
          columnNumber: 8,
        },
        {
          url: server.PREFIX + '/consolelog.html',
          lineNumber: 13,
          columnNumber: 6,
        },
      ]);
    });
    // @see https://github.com/puppeteer/puppeteer/issues/3865
    it('should not throw when there are console messages in detached iframes', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(async () => {
        // 1. Create a popup that Puppeteer is not connected to.
        const win = window.open(
          window.location.href,
          'Title',
          'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=200,top=0,left=0'
        )!;
        await new Promise(x => {
          return (win.onload = x);
        });
        // 2. In this popup, create an iframe that console.logs a message.
        win.document.body.innerHTML = `<iframe src='/consolelog.html'></iframe>`;
        const frame = win.document.querySelector('iframe')!;
        await new Promise(x => {
          return (frame.onload = x);
        });
        // 3. After that, remove the iframe.
        frame.remove();
      });
      const popupTarget = page
        .browserContext()
        .targets()
        .find(target => {
          return target !== page.target();
        })!;
      // 4. Connect to the popup and make sure it doesn't throw.
      await popupTarget.page();
    });
  });

  describe('Page.Events.DOMContentLoaded', function () {
    it('should fire when expected', async () => {
      const {page} = getTestState();

      page.goto('about:blank');
      await waitEvent(page, 'domcontentloaded');
    });
  });

  describe('Page.metrics', function () {
    it('should get metrics from a page', async () => {
      const {page} = getTestState();

      await page.goto('about:blank');
      const metrics = await page.metrics();
      checkMetrics(metrics);
    });
    it('metrics event fired on console.timeStamp', async () => {
      const {page} = getTestState();

      const metricsPromise = new Promise<{metrics: Metrics; title: string}>(
        fulfill => {
          return page.once('metrics', fulfill);
        }
      );
      await page.evaluate(() => {
        return console.timeStamp('test42');
      });
      const metrics = await metricsPromise;
      expect(metrics.title).toBe('test42');
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
        expect(metricsToCheck.has(name)).toBeTruthy();
        expect(metrics[name as keyof Metrics]).toBeGreaterThanOrEqual(0);
        metricsToCheck.delete(name);
      }
      expect(metricsToCheck.size).toBe(0);
    }
  });

  describe('Page.waitForRequest', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        page.waitForRequest(server.PREFIX + '/digits/2.png'),
        page.evaluate(() => {
          fetch('/digits/1.png');
          fetch('/digits/2.png');
          fetch('/digits/3.png');
        }),
      ]);
      expect(request.url()).toBe(server.PREFIX + '/digits/2.png');
    });
    it('should work with predicate', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        page.waitForRequest(request => {
          return request.url() === server.PREFIX + '/digits/2.png';
        }),
        page.evaluate(() => {
          fetch('/digits/1.png');
          fetch('/digits/2.png');
          fetch('/digits/3.png');
        }),
      ]);
      expect(request.url()).toBe(server.PREFIX + '/digits/2.png');
    });
    it('should respect timeout', async () => {
      const {page, puppeteer} = getTestState();

      let error!: Error;
      await page
        .waitForRequest(
          () => {
            return false;
          },
          {timeout: 1}
        )
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should respect default timeout', async () => {
      const {page, puppeteer} = getTestState();

      let error!: Error;
      page.setDefaultTimeout(1);
      await page
        .waitForRequest(() => {
          return false;
        })
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should work with no timeout', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        page.waitForRequest(server.PREFIX + '/digits/2.png', {timeout: 0}),
        page.evaluate(() => {
          return setTimeout(() => {
            fetch('/digits/1.png');
            fetch('/digits/2.png');
            fetch('/digits/3.png');
          }, 50);
        }),
      ]);
      expect(request.url()).toBe(server.PREFIX + '/digits/2.png');
    });
  });

  describe('Page.waitForResponse', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(server.PREFIX + '/digits/2.png'),
        page.evaluate(() => {
          fetch('/digits/1.png');
          fetch('/digits/2.png');
          fetch('/digits/3.png');
        }),
      ]);
      expect(response.url()).toBe(server.PREFIX + '/digits/2.png');
    });
    it('should respect timeout', async () => {
      const {page, puppeteer} = getTestState();

      let error!: Error;
      await page
        .waitForResponse(
          () => {
            return false;
          },
          {timeout: 1}
        )
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should respect default timeout', async () => {
      const {page, puppeteer} = getTestState();

      let error!: Error;
      page.setDefaultTimeout(1);
      await page
        .waitForResponse(() => {
          return false;
        })
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should work with predicate', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(response => {
          return response.url() === server.PREFIX + '/digits/2.png';
        }),
        page.evaluate(() => {
          fetch('/digits/1.png');
          fetch('/digits/2.png');
          fetch('/digits/3.png');
        }),
      ]);
      expect(response.url()).toBe(server.PREFIX + '/digits/2.png');
    });
    it('should work with async predicate', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(async response => {
          return response.url() === server.PREFIX + '/digits/2.png';
        }),
        page.evaluate(() => {
          fetch('/digits/1.png');
          fetch('/digits/2.png');
          fetch('/digits/3.png');
        }),
      ]);
      expect(response.url()).toBe(server.PREFIX + '/digits/2.png');
    });
    it('should work with no timeout', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(server.PREFIX + '/digits/2.png', {timeout: 0}),
        page.evaluate(() => {
          return setTimeout(() => {
            fetch('/digits/1.png');
            fetch('/digits/2.png');
            fetch('/digits/3.png');
          }, 50);
        }),
      ]);
      expect(response.url()).toBe(server.PREFIX + '/digits/2.png');
    });
  });

  describe('Page.waitForNetworkIdle', function () {
    it('should work', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      let res;
      const [t1, t2] = await Promise.all([
        page.waitForNetworkIdle().then(r => {
          res = r;
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
                return setTimeout(resolve, 200);
              });
              await fetch('/digits/3.png');
              await new Promise(resolve => {
                return setTimeout(resolve, 200);
              });
              await fetch('/digits/4.png');
            })();
          })
          .then(() => {
            return Date.now();
          }),
      ]);
      expect(res).toBe(undefined);
      expect(t1).toBeGreaterThan(t2);
      expect(t1 - t2).toBeGreaterThanOrEqual(400);
    });
    it('should respect timeout', async () => {
      const {page, puppeteer} = getTestState();
      let error!: Error;
      await page.waitForNetworkIdle({timeout: 1}).catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should respect idleTime', async () => {
      const {page, server} = getTestState();
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
      expect(t2).toBeGreaterThan(t1);
    });
    it('should work with no timeout', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      const [result] = await Promise.all([
        page.waitForNetworkIdle({timeout: 0}),
        page.evaluate(() => {
          return setTimeout(() => {
            fetch('/digits/1.png');
            fetch('/digits/2.png');
            fetch('/digits/3.png');
          }, 50);
        }),
      ]);
      expect(result).toBe(undefined);
    });
  });

  describe('Page.exposeFunction', function () {
    it('should work', async () => {
      const {page} = getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return a * b;
      });
      const result = await page.evaluate(async function () {
        return await (globalThis as any).compute(9, 4);
      });
      expect(result).toBe(36);
    });
    it('should throw exception in page context', async () => {
      const {page} = getTestState();

      await page.exposeFunction('woof', () => {
        throw new Error('WOOF WOOF');
      });
      const {message, stack} = await page.evaluate(async () => {
        try {
          return await (globalThis as any).woof();
        } catch (error) {
          return {
            message: (error as Error).message,
            stack: (error as Error).stack,
          };
        }
      });
      expect(message).toBe('WOOF WOOF');
      expect(stack).toContain('page.spec.ts');
    });
    it('should support throwing "null"', async () => {
      const {page} = getTestState();

      await page.exposeFunction('woof', function () {
        throw null;
      });
      const thrown = await page.evaluate(async () => {
        try {
          await (globalThis as any).woof();
        } catch (error) {
          return error;
        }
      });
      expect(thrown).toBe(null);
    });
    it('should be callable from-inside evaluateOnNewDocument', async () => {
      const {page} = getTestState();

      let called = false;
      await page.exposeFunction('woof', function () {
        called = true;
      });
      await page.evaluateOnNewDocument(() => {
        return (globalThis as any).woof();
      });
      await page.reload();
      expect(called).toBe(true);
    });
    it('should survive navigation', async () => {
      const {page, server} = getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return a * b;
      });

      await page.goto(server.EMPTY_PAGE);
      const result = await page.evaluate(async function () {
        return await (globalThis as any).compute(9, 4);
      });
      expect(result).toBe(36);
    });
    it('should await returned promise', async () => {
      const {page} = getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return Promise.resolve(a * b);
      });

      const result = await page.evaluate(async function () {
        return await (globalThis as any).compute(3, 5);
      });
      expect(result).toBe(15);
    });
    it('should work on frames', async () => {
      const {page, server} = getTestState();

      await page.exposeFunction('compute', function (a: number, b: number) {
        return Promise.resolve(a * b);
      });

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      const frame = page.frames()[1]!;
      const result = await frame.evaluate(async function () {
        return await (globalThis as any).compute(3, 5);
      });
      expect(result).toBe(15);
    });
    it('should work on frames before navigation', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      await page.exposeFunction('compute', function (a: number, b: number) {
        return Promise.resolve(a * b);
      });

      const frame = page.frames()[1]!;
      const result = await frame.evaluate(async function () {
        return await (globalThis as any).compute(3, 5);
      });
      expect(result).toBe(15);
    });
    it('should not throw when frames detach', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await page.exposeFunction('compute', function (a: number, b: number) {
        return Promise.resolve(a * b);
      });
      await utils.detachFrame(page, 'frame1');

      await expect(
        page.evaluate(async function () {
          return await (globalThis as any).compute(3, 5);
        })
      ).resolves.toEqual(15);
    });
    it('should work with complex objects', async () => {
      const {page} = getTestState();

      await page.exposeFunction(
        'complexObject',
        function (a: {x: any}, b: {x: any}) {
          return {x: a.x + b.x};
        }
      );
      const result = await page.evaluate(async () => {
        return (globalThis as any).complexObject({x: 5}, {x: 2});
      });
      expect(result.x).toBe(7);
    });
    it('should fallback to default export when passed a module object', async () => {
      const {page, server} = getTestState();
      const moduleObject = {
        default: function (a: number, b: number) {
          return a * b;
        },
      };
      await page.goto(server.EMPTY_PAGE);
      await page.exposeFunction('compute', moduleObject);
      const result = await page.evaluate(async function () {
        return await (globalThis as any).compute(9, 4);
      });
      expect(result).toBe(36);
    });
  });

  describe('Page.Events.PageError', function () {
    it('should fire', async () => {
      const {page, server} = getTestState();

      let error!: Error;
      page.once('pageerror', e => {
        return (error = e);
      });
      await Promise.all([
        page.goto(server.PREFIX + '/error.html'),
        waitEvent(page, 'pageerror'),
      ]);
      expect(error.message).toContain('Fancy');
    });
  });

  describe('Page.setUserAgent', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      expect(
        await page.evaluate(() => {
          return navigator.userAgent;
        })
      ).toContain('Mozilla');
      await page.setUserAgent('foobar');
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      expect(request.headers['user-agent']).toBe('foobar');
    });
    it('should work for subframes', async () => {
      const {page, server} = getTestState();

      expect(
        await page.evaluate(() => {
          return navigator.userAgent;
        })
      ).toContain('Mozilla');
      await page.setUserAgent('foobar');
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        utils.attachFrame(page, 'frame1', server.EMPTY_PAGE),
      ]);
      expect(request.headers['user-agent']).toBe('foobar');
    });
    it('should emulate device user-agent', async () => {
      const {page, server, puppeteer} = getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      expect(
        await page.evaluate(() => {
          return navigator.userAgent;
        })
      ).not.toContain('iPhone');
      await page.setUserAgent(puppeteer.devices['iPhone 6']!.userAgent);
      expect(
        await page.evaluate(() => {
          return navigator.userAgent;
        })
      ).toContain('iPhone');
    });
    it('should work with additional userAgentMetdata', async () => {
      const {page, server} = getTestState();

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
      expect(
        await page.evaluate(() => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: userAgentData not yet in TypeScript DOM API
          return navigator.userAgentData.mobile;
        })
      ).toBe(false);

      const uaData = await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: userAgentData not yet in TypeScript DOM API
        return navigator.userAgentData.getHighEntropyValues([
          'architecture',
          'model',
          'platform',
          'platformVersion',
        ]);
      });
      expect(uaData['architecture']).toBe('Mock1');
      expect(uaData['model']).toBe('Mockbook');
      expect(uaData['platform']).toBe('MockOS');
      expect(uaData['platformVersion']).toBe('3.1');
      expect(request.headers['user-agent']).toBe('MockBrowser');
    });
  });

  describe('Page.setContent', function () {
    const expectedOutput =
      '<html><head></head><body><div>hello</div></body></html>';
    it('should work', async () => {
      const {page} = getTestState();

      await page.setContent('<div>hello</div>');
      const result = await page.content();
      expect(result).toBe(expectedOutput);
    });
    it('should work with doctype', async () => {
      const {page} = getTestState();

      const doctype = '<!DOCTYPE html>';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    });
    it('should work with HTML 4 doctype', async () => {
      const {page} = getTestState();

      const doctype =
        '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
        '"http://www.w3.org/TR/html4/strict.dtd">';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    });
    it('should respect timeout', async () => {
      const {page, server, puppeteer} = getTestState();

      const imgPath = '/img.png';
      // stall for image
      server.setRoute(imgPath, () => {});
      let error!: Error;
      await page
        .setContent(`<img src="${server.PREFIX + imgPath}"></img>`, {
          timeout: 1,
        })
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should respect default navigation timeout', async () => {
      const {page, server, puppeteer} = getTestState();

      page.setDefaultNavigationTimeout(1);
      const imgPath = '/img.png';
      // stall for image
      server.setRoute(imgPath, () => {});
      let error!: Error;
      await page
        .setContent(`<img src="${server.PREFIX + imgPath}"></img>`)
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should await resources to load', async () => {
      const {page, server} = getTestState();

      const imgPath = '/img.png';
      let imgResponse!: ServerResponse;
      server.setRoute(imgPath, (_req, res) => {
        return (imgResponse = res);
      });
      let loaded = false;
      const contentPromise = page
        .setContent(`<img src="${server.PREFIX + imgPath}"></img>`)
        .then(() => {
          return (loaded = true);
        });
      await server.waitForRequest(imgPath);
      expect(loaded).toBe(false);
      imgResponse.end();
      await contentPromise;
    });
    it('should work fast enough', async () => {
      const {page} = getTestState();

      for (let i = 0; i < 20; ++i) {
        await page.setContent('<div>yo</div>');
      }
    });
    it('should work with tricky content', async () => {
      const {page} = getTestState();

      await page.setContent('<div>hello world</div>' + '\x7F');
      expect(
        await page.$eval('div', div => {
          return div.textContent;
        })
      ).toBe('hello world');
    });
    it('should work with accents', async () => {
      const {page} = getTestState();

      await page.setContent('<div>aberración</div>');
      expect(
        await page.$eval('div', div => {
          return div.textContent;
        })
      ).toBe('aberración');
    });
    it('should work with emojis', async () => {
      const {page} = getTestState();

      await page.setContent('<div>🐥</div>');
      expect(
        await page.$eval('div', div => {
          return div.textContent;
        })
      ).toBe('🐥');
    });
    it('should work with newline', async () => {
      const {page} = getTestState();

      await page.setContent('<div>\n</div>');
      expect(
        await page.$eval('div', div => {
          return div.textContent;
        })
      ).toBe('\n');
    });
  });

  describe('Page.setBypassCSP', function () {
    it('should bypass CSP meta tag', async () => {
      const {page, server} = getTestState();

      // Make sure CSP prohibits addScriptTag.
      await page.goto(server.PREFIX + '/csp.html');
      await page
        .addScriptTag({content: 'window.__injected = 42;'})
        .catch(error => {
          return void error;
        });
      expect(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        })
      ).toBe(undefined);

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();
      await page.addScriptTag({content: 'window.__injected = 42;'});
      expect(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        })
      ).toBe(42);
    });

    it('should bypass CSP header', async () => {
      const {page, server} = getTestState();

      // Make sure CSP prohibits addScriptTag.
      server.setCSP('/empty.html', 'default-src "self"');
      await page.goto(server.EMPTY_PAGE);
      await page
        .addScriptTag({content: 'window.__injected = 42;'})
        .catch(error => {
          return void error;
        });
      expect(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        })
      ).toBe(undefined);

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();
      await page.addScriptTag({content: 'window.__injected = 42;'});
      expect(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        })
      ).toBe(42);
    });

    it('should bypass after cross-process navigation', async () => {
      const {page, server} = getTestState();

      await page.setBypassCSP(true);
      await page.goto(server.PREFIX + '/csp.html');
      await page.addScriptTag({content: 'window.__injected = 42;'});
      expect(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        })
      ).toBe(42);

      await page.goto(server.CROSS_PROCESS_PREFIX + '/csp.html');
      await page.addScriptTag({content: 'window.__injected = 42;'});
      expect(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        })
      ).toBe(42);
    });
    it('should bypass CSP in iframes as well', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      {
        // Make sure CSP prohibits addScriptTag in an iframe.
        const frame = (await attachFrame(
          page,
          'frame1',
          server.PREFIX + '/csp.html'
        ))!;
        await frame
          .addScriptTag({content: 'window.__injected = 42;'})
          .catch(error => {
            return void error;
          });
        expect(
          await frame.evaluate(() => {
            return (globalThis as any).__injected;
          })
        ).toBe(undefined);
      }

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();

      {
        const frame = (await attachFrame(
          page,
          'frame1',
          server.PREFIX + '/csp.html'
        ))!;
        await frame
          .addScriptTag({content: 'window.__injected = 42;'})
          .catch(error => {
            return void error;
          });
        expect(
          await frame.evaluate(() => {
            return (globalThis as any).__injected;
          })
        ).toBe(42);
      }
    });
  });

  describe('Page.addScriptTag', function () {
    it('should throw an error if no options are provided', async () => {
      const {page} = getTestState();

      let error!: Error;
      try {
        // @ts-expect-error purposefully passing bad options
        await page.addScriptTag('/injectedfile.js');
      } catch (error_) {
        error = error_ as Error;
      }
      expect(error.message).toBe(
        'Exactly one of `url`, `path`, or `content` must be specified.'
      );
    });

    it('should work with a url', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({url: '/injectedfile.js'});
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        })
      ).toBe(42);
    });

    it('should work with a url and type=module', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({url: '/es6/es6import.js', type: 'module'});
      expect(
        await page.evaluate(() => {
          return (window as unknown as {__es6injected: number}).__es6injected;
        })
      ).toBe(42);
    });

    it('should work with a path and type=module', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({
        path: path.join(__dirname, '../assets/es6/es6pathimport.js'),
        type: 'module',
      });
      await page.waitForFunction(() => {
        return (window as unknown as {__es6injected: number}).__es6injected;
      });
      expect(
        await page.evaluate(() => {
          return (window as unknown as {__es6injected: number}).__es6injected;
        })
      ).toBe(42);
    });

    it('should work with a content and type=module', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({
        content: `import num from '/es6/es6module.js';window.__es6injected = num;`,
        type: 'module',
      });
      await page.waitForFunction(() => {
        return (window as unknown as {__es6injected: number}).__es6injected;
      });
      expect(
        await page.evaluate(() => {
          return (window as unknown as {__es6injected: number}).__es6injected;
        })
      ).toBe(42);
    });

    it('should throw an error if loading from url fail', async () => {
      const {page, server, isFirefox} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error!: Error;
      try {
        await page.addScriptTag({url: '/nonexistfile.js'});
      } catch (error_) {
        error = error_ as Error;
      }
      if (isFirefox) {
        expect(error.message).toBeTruthy();
      } else {
        expect(error.message).toContain('Could not load script');
      }
    });

    it('should work with a path', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({
        path: path.join(__dirname, '../assets/injectedfile.js'),
      });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        })
      ).toBe(42);
    });

    it('should include sourcemap when path is provided', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({
        path: path.join(__dirname, '../assets/injectedfile.js'),
      });
      const result = await page.evaluate(() => {
        return (globalThis as any).__injectedError.stack;
      });
      expect(result).toContain(path.join('assets', 'injectedfile.js'));
    });

    it('should work with content', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({
        content: 'window.__injected = 35;',
      });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(
        await page.evaluate(() => {
          return (globalThis as any).__injected;
        })
      ).toBe(35);
    });

    it('should add id when provided', async () => {
      const {page, server} = getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({content: 'window.__injected = 1;', id: 'one'});
      await page.addScriptTag({url: '/injectedfile.js', id: 'two'});
      expect(await page.$('#one')).not.toBeNull();
      expect(await page.$('#two')).not.toBeNull();
    });

    // @see https://github.com/puppeteer/puppeteer/issues/4840
    it.skip('should throw when added with content to the CSP page', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error!: Error;
      await page
        .addScriptTag({content: 'window.__injected = 35;'})
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeTruthy();
    });

    it('should throw when added with URL to the CSP page', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error!: Error;
      await page
        .addScriptTag({url: server.CROSS_PROCESS_PREFIX + '/injectedfile.js'})
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeTruthy();
    });
  });

  describe('Page.addStyleTag', function () {
    it('should throw an error if no options are provided', async () => {
      const {page} = getTestState();

      let error!: Error;
      try {
        // @ts-expect-error purposefully passing bad input
        await page.addStyleTag('/injectedstyle.css');
      } catch (error_) {
        error = error_ as Error;
      }
      expect(error.message).toBe(
        'Exactly one of `url`, `path`, or `content` must be specified.'
      );
    });

    it('should work with a url', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({url: '/injectedstyle.css'});
      expect(styleHandle.asElement()).not.toBeNull();
      expect(
        await page.evaluate(
          `window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`
        )
      ).toBe('rgb(255, 0, 0)');
    });

    it('should throw an error if loading from url fail', async () => {
      const {page, server, isFirefox} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error!: Error;
      try {
        await page.addStyleTag({url: '/nonexistfile.js'});
      } catch (error_) {
        error = error_ as Error;
      }
      if (isFirefox) {
        expect(error.message).toBeTruthy();
      } else {
        expect(error.message).toContain('Could not load style');
      }
    });

    it('should work with a path', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({
        path: path.join(__dirname, '../assets/injectedstyle.css'),
      });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(
        await page.evaluate(
          `window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`
        )
      ).toBe('rgb(255, 0, 0)');
    });

    it('should include sourcemap when path is provided', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addStyleTag({
        path: path.join(__dirname, '../assets/injectedstyle.css'),
      });
      const styleHandle = (await page.$('style'))!;
      const styleContent = await page.evaluate((style: HTMLStyleElement) => {
        return style.innerHTML;
      }, styleHandle);
      expect(styleContent).toContain(path.join('assets', 'injectedstyle.css'));
    });

    it('should work with content', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({
        content: 'body { background-color: green; }',
      });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(
        await page.evaluate(
          `window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`
        )
      ).toBe('rgb(0, 128, 0)');
    });

    it('should throw when added with content to the CSP page', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error!: Error;
      await page
        .addStyleTag({content: 'body { background-color: green; }'})
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeTruthy();
    });

    it('should throw when added with URL to the CSP page', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error!: Error;
      await page
        .addStyleTag({
          url: server.CROSS_PROCESS_PREFIX + '/injectedstyle.css',
        })
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).toBeTruthy();
    });
  });

  describe('Page.url', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      expect(page.url()).toBe('about:blank');
      await page.goto(server.EMPTY_PAGE);
      expect(page.url()).toBe(server.EMPTY_PAGE);
    });
  });

  describe('Page.setJavaScriptEnabled', function () {
    it('should work', async () => {
      const {page} = getTestState();

      await page.setJavaScriptEnabled(false);
      await page.goto(
        'data:text/html, <script>var something = "forbidden"</script>'
      );
      let error!: Error;
      await page.evaluate('something').catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toContain('something is not defined');

      await page.setJavaScriptEnabled(true);
      await page.goto(
        'data:text/html, <script>var something = "forbidden"</script>'
      );
      expect(await page.evaluate('something')).toBe('forbidden');
    });
  });

  describe('Page.setCacheEnabled', function () {
    it('should enable or disable the cache based on the state passed', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/cached/one-style.html');
      const [cachedRequest] = await Promise.all([
        server.waitForRequest('/cached/one-style.html'),
        page.reload(),
      ]);
      // Rely on "if-modified-since" caching in our test server.
      expect(cachedRequest.headers['if-modified-since']).not.toBe(undefined);

      await page.setCacheEnabled(false);
      const [nonCachedRequest] = await Promise.all([
        server.waitForRequest('/cached/one-style.html'),
        page.reload(),
      ]);
      expect(nonCachedRequest.headers['if-modified-since']).toBe(undefined);
    });
    it('should stay disabled when toggling request interception on/off', async () => {
      const {page, server} = getTestState();

      await page.setCacheEnabled(false);
      await page.setRequestInterception(true);
      await page.setRequestInterception(false);

      await page.goto(server.PREFIX + '/cached/one-style.html');
      const [nonCachedRequest] = await Promise.all([
        server.waitForRequest('/cached/one-style.html'),
        page.reload(),
      ]);
      expect(nonCachedRequest.headers['if-modified-since']).toBe(undefined);
    });
  });

  describe('printing to PDF', function () {
    it('can print to PDF and save to file', async () => {
      // Printing to pdf is currently only supported in headless
      const {isHeadless, page} = getTestState();

      if (!isHeadless) {
        return;
      }

      const outputFile = __dirname + '/../assets/output.pdf';
      await page.pdf({path: outputFile});
      expect(fs.readFileSync(outputFile).byteLength).toBeGreaterThan(0);
      fs.unlinkSync(outputFile);
    });

    it('can print to PDF and stream the result', async () => {
      // Printing to pdf is currently only supported in headless
      const {isHeadless, page} = getTestState();

      if (!isHeadless) {
        return;
      }

      const stream = await page.createPDFStream();
      let size = 0;
      for await (const chunk of stream) {
        size += chunk.length;
      }
      expect(size).toBeGreaterThan(0);
    });

    it('should respect timeout', async () => {
      const {isHeadless, page, server, puppeteer} = getTestState();
      if (!isHeadless) {
        return;
      }

      await page.goto(server.PREFIX + '/pdf.html');

      let error!: Error;
      await page.pdf({timeout: 1}).catch(_error => {
        return (error = _error);
      });
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
  });

  describe('Page.title', function () {
    it('should return the page title', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/title.html');
      expect(await page.title()).toBe('Woof-Woof');
    });
  });

  describe('Page.select', function () {
    it('should select single option', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onInput;
        })
      ).toEqual(['blue']);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onChange;
        })
      ).toEqual(['blue']);
    });
    it('should select only first option', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue', 'green', 'red');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onInput;
        })
      ).toEqual(['blue']);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onChange;
        })
      ).toEqual(['blue']);
    });
    it('should not throw when select causes navigation', async () => {
      const {page, server} = getTestState();

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
      expect(page.url()).toContain('empty.html');
    });
    it('should select multiple options', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => {
        return (globalThis as any).makeMultiple();
      });
      await page.select('select', 'blue', 'green', 'red');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onInput;
        })
      ).toEqual(['blue', 'green', 'red']);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onChange;
        })
      ).toEqual(['blue', 'green', 'red']);
    });
    it('should respect event bubbling', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onBubblingInput;
        })
      ).toEqual(['blue']);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onBubblingChange;
        })
      ).toEqual(['blue']);
    });
    it('should throw when element is not a <select>', async () => {
      const {page, server} = getTestState();

      let error!: Error;
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('body', '').catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toContain('Element is not a <select> element.');
    });
    it('should return [] on no matched values', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select', '42', 'abc');
      expect(result).toEqual([]);
    });
    it('should return an array of matched values', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => {
        return (globalThis as any).makeMultiple();
      });
      const result = await page.select('select', 'blue', 'black', 'magenta');
      expect(
        result.reduce((accumulator, current) => {
          return ['blue', 'black', 'magenta'].includes(current) && accumulator;
        }, true)
      ).toEqual(true);
    });
    it('should return an array of one element when multiple is not set', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select(
        'select',
        '42',
        'blue',
        'black',
        'magenta'
      );
      expect(result.length).toEqual(1);
    });
    it('should return [] on no values', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select');
      expect(result).toEqual([]);
    });
    it('should deselect all options when passed no values for a multiple select', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => {
        return (globalThis as any).makeMultiple();
      });
      await page.select('select', 'blue', 'black', 'magenta');
      await page.select('select');
      expect(
        await page.$eval('select', select => {
          return Array.from((select as HTMLSelectElement).options).every(
            option => {
              return !option.selected;
            }
          );
        })
      ).toEqual(true);
    });
    it('should deselect all options when passed no values for a select without multiple', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue', 'black', 'magenta');
      await page.select('select');
      expect(
        await page.$eval('select', select => {
          return Array.from((select as HTMLSelectElement).options).filter(
            option => {
              return option.selected;
            }
          )[0]!.value;
        })
      ).toEqual('');
    });
    it('should throw if passed in non-strings', async () => {
      const {page} = getTestState();

      await page.setContent('<select><option value="12"/></select>');
      let error!: Error;
      try {
        // @ts-expect-error purposefully passing bad input
        await page.select('select', 12);
      } catch (error_) {
        error = error_ as Error;
      }
      expect(error.message).toContain('Values must be strings');
    });
    // @see https://github.com/puppeteer/puppeteer/issues/3327
    it('should work when re-defining top-level Event class', async () => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => {
        // @ts-expect-error Expected.
        return (window.Event = undefined);
      });
      await page.select('select', 'blue');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onInput;
        })
      ).toEqual(['blue']);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result.onChange;
        })
      ).toEqual(['blue']);
    });
  });

  describe('Page.Events.Close', function () {
    it('should work with window.close', async () => {
      const {page, context} = getTestState();

      const newPagePromise = new Promise<Page>(fulfill => {
        return context.once('targetcreated', target => {
          return fulfill(target.page());
        });
      });
      await page.evaluate(() => {
        return ((window as any)['newPage'] = window.open('about:blank'));
      });
      const newPage = await newPagePromise;
      const closedPromise = new Promise(x => {
        return newPage.on('close', x);
      });
      await page.evaluate(() => {
        return (window as any)['newPage'].close();
      });
      await closedPromise;
    });
    it('should work with page.close', async () => {
      const {context} = getTestState();

      const newPage = await context.newPage();
      const closedPromise = new Promise(x => {
        return newPage.on('close', x);
      });
      await newPage.close();
      await closedPromise;
    });
  });

  describe('Page.browser', function () {
    it('should return the correct browser instance', async () => {
      const {page, browser} = getTestState();

      expect(page.browser()).toBe(browser);
    });
  });

  describe('Page.browserContext', function () {
    it('should return the correct browser context instance', async () => {
      const {page, context} = getTestState();

      expect(page.browserContext()).toBe(context);
    });
  });

  describe('Page.client', function () {
    it('should return the client instance', async () => {
      const {page} = getTestState();
      expect(page._client()).toBeInstanceOf(CDPSession);
    });
  });
});
