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
import fs from 'fs';
import path from 'path';
import utils from './utils.js';
const { waitEvent } = utils;
import expect from 'expect';
import sinon from 'sinon';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  itFailsFirefox,
  itChromeOnly,
  describeFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions
import { Page, Metrics } from '../lib/cjs/puppeteer/common/Page.js';
import { JSHandle } from '../lib/cjs/puppeteer/common/JSHandle.js';

describe('Page', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  describe('Page.close', function () {
    it('should reject all promises when page is closed', async () => {
      const { context } = getTestState();

      const newPage = await context.newPage();
      let error = null;
      await Promise.all([
        newPage
          .evaluate(() => new Promise(() => {}))
          .catch((error_) => (error = error_)),
        newPage.close(),
      ]);
      expect(error.message).toContain('Protocol error');
    });
    it('should not be visible in browser.pages', async () => {
      const { browser } = getTestState();

      const newPage = await browser.newPage();
      expect(await browser.pages()).toContain(newPage);
      await newPage.close();
      expect(await browser.pages()).not.toContain(newPage);
    });
    itFailsFirefox('should run beforeunload if asked for', async () => {
      const { context, server, isChrome } = getTestState();

      const newPage = await context.newPage();
      await newPage.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await newPage.click('body');
      const pageClosingPromise = newPage.close({ runBeforeUnload: true });
      const dialog = await waitEvent(newPage, 'dialog');
      expect(dialog.type()).toBe('beforeunload');
      expect(dialog.defaultValue()).toBe('');
      if (isChrome) expect(dialog.message()).toBe('');
      else expect(dialog.message()).toBeTruthy();
      await dialog.accept();
      await pageClosingPromise;
    });
    itFailsFirefox('should *not* run beforeunload by default', async () => {
      const { context, server } = getTestState();

      const newPage = await context.newPage();
      await newPage.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await newPage.click('body');
      await newPage.close();
    });
    it('should set the page close state', async () => {
      const { context } = getTestState();

      const newPage = await context.newPage();
      expect(newPage.isClosed()).toBe(false);
      await newPage.close();
      expect(newPage.isClosed()).toBe(true);
    });
    itFailsFirefox('should terminate network waiters', async () => {
      const { context, server } = getTestState();

      const newPage = await context.newPage();
      const results = await Promise.all([
        newPage.waitForRequest(server.EMPTY_PAGE).catch((error) => error),
        newPage.waitForResponse(server.EMPTY_PAGE).catch((error) => error),
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
      const { page } = getTestState();

      await Promise.all([
        page.goto('about:blank'),
        utils.waitEvent(page, 'load'),
      ]);
    });
  });

  // This test fails on Firefox on CI consistently but cannot be replicated
  // locally. Skipping for now to unblock the Mitt release and given FF support
  // isn't fully done yet but raising an issue to ask the FF folks to have a
  // look at this.
  describeFailsFirefox('removing and adding event handlers', () => {
    it('should correctly fire event handlers as they are added and then removed', async () => {
      const { page, server } = getTestState();

      const handler = sinon.spy();
      page.on('response', handler);
      await page.goto(server.EMPTY_PAGE);
      expect(handler.callCount).toBe(1);
      page.off('response', handler);
      await page.goto(server.EMPTY_PAGE);
      // Still one because we removed the handler.
      expect(handler.callCount).toBe(1);
      page.on('response', handler);
      await page.goto(server.EMPTY_PAGE);
      // Two now because we added the handler back.
      expect(handler.callCount).toBe(2);
    });
  });

  describeFailsFirefox('Page.Events.error', function () {
    it('should throw when page crashes', async () => {
      const { page } = getTestState();

      let error = null;
      page.on('error', (err) => (error = err));
      page.goto('chrome://crash').catch(() => {});
      await waitEvent(page, 'error');
      expect(error.message).toBe('Page crashed!');
    });
  });

  describeFailsFirefox('Page.Events.Popup', function () {
    it('should work', async () => {
      const { page } = getTestState();

      const [popup] = await Promise.all([
        new Promise<Page>((x) => page.once('popup', x)),
        page.evaluate(() => window.open('about:blank')),
      ]);
      expect(await page.evaluate(() => !!window.opener)).toBe(false);
      expect(await popup.evaluate(() => !!window.opener)).toBe(true);
    });
    it('should work with noopener', async () => {
      const { page } = getTestState();

      const [popup] = await Promise.all([
        new Promise<Page>((x) => page.once('popup', x)),
        page.evaluate(() => window.open('about:blank', null, 'noopener')),
      ]);
      expect(await page.evaluate(() => !!window.opener)).toBe(false);
      expect(await popup.evaluate(() => !!window.opener)).toBe(false);
    });
    it('should work with clicking target=_blank and without rel=opener', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent('<a target=_blank href="/one-style.html">yo</a>');
      const [popup] = await Promise.all([
        new Promise<Page>((x) => page.once('popup', x)),
        page.click('a'),
      ]);
      expect(await page.evaluate(() => !!window.opener)).toBe(false);
      expect(await popup.evaluate(() => !!window.opener)).toBe(false);
    });
    it('should work with clicking target=_blank and with rel=opener', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        '<a target=_blank rel=opener href="/one-style.html">yo</a>'
      );
      const [popup] = await Promise.all([
        new Promise<Page>((x) => page.once('popup', x)),
        page.click('a'),
      ]);
      expect(await page.evaluate(() => !!window.opener)).toBe(false);
      expect(await popup.evaluate(() => !!window.opener)).toBe(true);
    });
    it('should work with fake-clicking target=_blank and rel=noopener', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        '<a target=_blank rel=noopener href="/one-style.html">yo</a>'
      );
      const [popup] = await Promise.all([
        new Promise<Page>((x) => page.once('popup', x)),
        page.$eval('a', (a: HTMLAnchorElement) => a.click()),
      ]);
      expect(await page.evaluate(() => !!window.opener)).toBe(false);
      expect(await popup.evaluate(() => !!window.opener)).toBe(false);
    });
    it('should work with clicking target=_blank and rel=noopener', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(
        '<a target=_blank rel=noopener href="/one-style.html">yo</a>'
      );
      const [popup] = await Promise.all([
        new Promise<Page>((x) => page.once('popup', x)),
        page.click('a'),
      ]);
      expect(await page.evaluate(() => !!window.opener)).toBe(false);
      expect(await popup.evaluate(() => !!window.opener)).toBe(false);
    });
  });

  describe('BrowserContext.overridePermissions', function () {
    function getPermission(page, name) {
      return page.evaluate(
        (name) =>
          navigator.permissions.query({ name }).then((result) => result.state),
        name
      );
    }

    it('should be prompt by default', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
    });
    itFailsFirefox('should deny permission when not listed', async () => {
      const { page, server, context } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, []);
      expect(await getPermission(page, 'geolocation')).toBe('denied');
    });
    it('should fail when bad permission is given', async () => {
      const { page, server, context } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error = null;
      await context
        // @ts-expect-error purposeful bad input for test
        .overridePermissions(server.EMPTY_PAGE, ['foo'])
        .catch((error_) => (error = error_));
      expect(error.message).toBe('Unknown permission: foo');
    });
    itFailsFirefox('should grant permission when listed', async () => {
      const { page, server, context } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      expect(await getPermission(page, 'geolocation')).toBe('granted');
    });
    itFailsFirefox('should reset permissions', async () => {
      const { page, server, context } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      expect(await getPermission(page, 'geolocation')).toBe('granted');
      await context.clearPermissionOverrides();
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
    });
    itFailsFirefox('should trigger permission onchange', async () => {
      const { page, server, context } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        globalThis.events = [];
        return navigator.permissions
          .query({ name: 'geolocation' })
          .then(function (result) {
            globalThis.events.push(result.state);
            result.onchange = function () {
              globalThis.events.push(result.state);
            };
          });
      });
      expect(await page.evaluate(() => globalThis.events)).toEqual(['prompt']);
      await context.overridePermissions(server.EMPTY_PAGE, []);
      expect(await page.evaluate(() => globalThis.events)).toEqual([
        'prompt',
        'denied',
      ]);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      expect(await page.evaluate(() => globalThis.events)).toEqual([
        'prompt',
        'denied',
        'granted',
      ]);
      await context.clearPermissionOverrides();
      expect(await page.evaluate(() => globalThis.events)).toEqual([
        'prompt',
        'denied',
        'granted',
        'prompt',
      ]);
    });
    itFailsFirefox(
      'should isolate permissions between browser contexts',
      async () => {
        const { page, server, context, browser } = getTestState();

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
      }
    );
  });

  describe('Page.setGeolocation', function () {
    itFailsFirefox('should work', async () => {
      const { page, server, context } = getTestState();

      await context.overridePermissions(server.PREFIX, ['geolocation']);
      await page.goto(server.EMPTY_PAGE);
      await page.setGeolocation({ longitude: 10, latitude: 10 });
      const geolocation = await page.evaluate(
        () =>
          new Promise((resolve) =>
            navigator.geolocation.getCurrentPosition((position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            })
          )
      );
      expect(geolocation).toEqual({
        latitude: 10,
        longitude: 10,
      });
    });
    it('should throw when invalid longitude', async () => {
      const { page } = getTestState();

      let error = null;
      try {
        await page.setGeolocation({ longitude: 200, latitude: 10 });
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toContain('Invalid longitude "200"');
    });
  });

  describeFailsFirefox('Page.setOfflineMode', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      await page.setOfflineMode(true);
      let error = null;
      await page.goto(server.EMPTY_PAGE).catch((error_) => (error = error_));
      expect(error).toBeTruthy();
      await page.setOfflineMode(false);
      const response = await page.reload();
      expect(response.status()).toBe(200);
    });
    it('should emulate navigator.onLine', async () => {
      const { page } = getTestState();

      expect(await page.evaluate(() => window.navigator.onLine)).toBe(true);
      await page.setOfflineMode(true);
      expect(await page.evaluate(() => window.navigator.onLine)).toBe(false);
      await page.setOfflineMode(false);
      expect(await page.evaluate(() => window.navigator.onLine)).toBe(true);
    });
  });

  describe('ExecutionContext.queryObjects', function () {
    itFailsFirefox('should work', async () => {
      const { page } = getTestState();

      // Instantiate an object
      await page.evaluate(() => (globalThis.set = new Set(['hello', 'world'])));
      const prototypeHandle = await page.evaluateHandle(() => Set.prototype);
      const objectsHandle = await page.queryObjects(prototypeHandle);
      const count = await page.evaluate(
        (objects: JSHandle[]) => objects.length,
        objectsHandle
      );
      expect(count).toBe(1);
      const values = await page.evaluate(
        (objects) => Array.from(objects[0].values()),
        objectsHandle
      );
      expect(values).toEqual(['hello', 'world']);
    });
    itFailsFirefox('should work for non-blank page', async () => {
      const { page, server } = getTestState();

      // Instantiate an object
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => (globalThis.set = new Set(['hello', 'world'])));
      const prototypeHandle = await page.evaluateHandle(() => Set.prototype);
      const objectsHandle = await page.queryObjects(prototypeHandle);
      const count = await page.evaluate(
        (objects: JSHandle[]) => objects.length,
        objectsHandle
      );
      expect(count).toBe(1);
    });
    it('should fail for disposed handles', async () => {
      const { page } = getTestState();

      const prototypeHandle = await page.evaluateHandle(
        () => HTMLBodyElement.prototype
      );
      await prototypeHandle.dispose();
      let error = null;
      await page
        .queryObjects(prototypeHandle)
        .catch((error_) => (error = error_));
      expect(error.message).toBe('Prototype JSHandle is disposed!');
    });
    it('should fail primitive values as prototypes', async () => {
      const { page } = getTestState();

      const prototypeHandle = await page.evaluateHandle(() => 42);
      let error = null;
      await page
        .queryObjects(prototypeHandle)
        .catch((error_) => (error = error_));
      expect(error.message).toBe(
        'Prototype JSHandle must not be referencing primitive value'
      );
    });
  });

  describeFailsFirefox('Page.Events.Console', function () {
    it('should work', async () => {
      const { page } = getTestState();

      let message = null;
      page.once('console', (m) => (message = m));
      await Promise.all([
        page.evaluate(() => console.log('hello', 5, { foo: 'bar' })),
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

      expect(await message.args()[0].jsonValue()).toEqual('hello');
      expect(await message.args()[1].jsonValue()).toEqual(5);
      expect(await message.args()[2].jsonValue()).toEqual({ foo: 'bar' });
    });
    it('should work for different console API calls', async () => {
      const { page } = getTestState();

      const messages = [];
      page.on('console', (msg) => messages.push(msg));
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
      expect(messages.map((msg) => msg.type())).toEqual([
        'timeEnd',
        'trace',
        'dir',
        'warning',
        'error',
        'log',
      ]);
      expect(messages[0].text()).toContain('calling console.time');
      expect(messages.slice(1).map((msg) => msg.text())).toEqual([
        'calling console.trace',
        'calling console.dir',
        'calling console.warn',
        'calling console.error',
        'JSHandle@promise',
      ]);
    });
    it('should not fail for window object', async () => {
      const { page } = getTestState();

      let message = null;
      page.once('console', (msg) => (message = msg));
      await Promise.all([
        page.evaluate(() => console.error(window)),
        waitEvent(page, 'console'),
      ]);
      expect(message.text()).toBe('JSHandle@object');
    });
    it('should trigger correct Log', async () => {
      const { page, server, isChrome } = getTestState();

      await page.goto('about:blank');
      const [message] = await Promise.all([
        waitEvent(page, 'console'),
        page.evaluate(
          async (url: string) => fetch(url).catch(() => {}),
          server.EMPTY_PAGE
        ),
      ]);
      expect(message.text()).toContain('Access-Control-Allow-Origin');
      if (isChrome) expect(message.type()).toEqual('error');
      else expect(message.type()).toEqual('warn');
    });
    it('should have location when fetch fails', async () => {
      const { page, server } = getTestState();

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
      const { page, server, isChrome } = getTestState();

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
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(async () => {
        // 1. Create a popup that Puppeteer is not connected to.
        const win = window.open(
          window.location.href,
          'Title',
          'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=200,top=0,left=0'
        );
        await new Promise((x) => (win.onload = x));
        // 2. In this popup, create an iframe that console.logs a message.
        win.document.body.innerHTML = `<iframe src='/consolelog.html'></iframe>`;
        const frame = win.document.querySelector('iframe');
        await new Promise((x) => (frame.onload = x));
        // 3. After that, remove the iframe.
        frame.remove();
      });
      const popupTarget = page
        .browserContext()
        .targets()
        .find((target) => target !== page.target());
      // 4. Connect to the popup and make sure it doesn't throw.
      await popupTarget.page();
    });
  });

  describe('Page.Events.DOMContentLoaded', function () {
    it('should fire when expected', async () => {
      const { page } = getTestState();

      page.goto('about:blank');
      await waitEvent(page, 'domcontentloaded');
    });
  });

  describeFailsFirefox('Page.metrics', function () {
    it('should get metrics from a page', async () => {
      const { page } = getTestState();

      await page.goto('about:blank');
      const metrics = await page.metrics();
      checkMetrics(metrics);
    });
    it('metrics event fired on console.timeStamp', async () => {
      const { page } = getTestState();

      const metricsPromise = new Promise<{ metrics: Metrics; title: string }>(
        (fulfill) => page.once('metrics', fulfill)
      );
      await page.evaluate(() => console.timeStamp('test42'));
      const metrics = await metricsPromise;
      expect(metrics.title).toBe('test42');
      checkMetrics(metrics.metrics);
    });
    function checkMetrics(metrics) {
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
        expect(metrics[name]).toBeGreaterThanOrEqual(0);
        metricsToCheck.delete(name);
      }
      expect(metricsToCheck.size).toBe(0);
    }
  });

  describe('Page.waitForRequest', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

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
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        page.waitForRequest(
          (request) => request.url() === server.PREFIX + '/digits/2.png'
        ),
        page.evaluate(() => {
          fetch('/digits/1.png');
          fetch('/digits/2.png');
          fetch('/digits/3.png');
        }),
      ]);
      expect(request.url()).toBe(server.PREFIX + '/digits/2.png');
    });
    it('should respect timeout', async () => {
      const { page, puppeteer } = getTestState();

      let error = null;
      await page
        .waitForRequest(() => false, { timeout: 1 })
        .catch((error_) => (error = error_));
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should respect default timeout', async () => {
      const { page, puppeteer } = getTestState();

      let error = null;
      page.setDefaultTimeout(1);
      await page
        .waitForRequest(() => false)
        .catch((error_) => (error = error_));
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should work with async predicate', async () => {
      const { page, server } = getTestState();
      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(async (response) => {
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
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        page.waitForRequest(server.PREFIX + '/digits/2.png', { timeout: 0 }),
        page.evaluate(() =>
          setTimeout(() => {
            fetch('/digits/1.png');
            fetch('/digits/2.png');
            fetch('/digits/3.png');
          }, 50)
        ),
      ]);
      expect(request.url()).toBe(server.PREFIX + '/digits/2.png');
    });
  });

  describe('Page.waitForResponse', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

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
      const { page, puppeteer } = getTestState();

      let error = null;
      await page
        .waitForResponse(() => false, { timeout: 1 })
        .catch((error_) => (error = error_));
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should respect default timeout', async () => {
      const { page, puppeteer } = getTestState();

      let error = null;
      page.setDefaultTimeout(1);
      await page
        .waitForResponse(() => false)
        .catch((error_) => (error = error_));
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should work with predicate', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(
          (response) => response.url() === server.PREFIX + '/digits/2.png'
        ),
        page.evaluate(() => {
          fetch('/digits/1.png');
          fetch('/digits/2.png');
          fetch('/digits/3.png');
        }),
      ]);
      expect(response.url()).toBe(server.PREFIX + '/digits/2.png');
    });
    it('should work with no timeout', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForResponse(server.PREFIX + '/digits/2.png', { timeout: 0 }),
        page.evaluate(() =>
          setTimeout(() => {
            fetch('/digits/1.png');
            fetch('/digits/2.png');
            fetch('/digits/3.png');
          }, 50)
        ),
      ]);
      expect(response.url()).toBe(server.PREFIX + '/digits/2.png');
    });
  });

  describe('Page.waitForNetworkIdle', function () {
    it('should work', async () => {
      const { page, server } = getTestState();
      await page.goto(server.EMPTY_PAGE);
      let res;
      const [t1, t2] = await Promise.all([
        page.waitForNetworkIdle().then((r) => {
          res = r;
          return Date.now();
        }),
        page
          .evaluate(() =>
            (async () => {
              await Promise.all([
                fetch('/digits/1.png'),
                fetch('/digits/2.png'),
              ]);
              await new Promise((resolve) => setTimeout(resolve, 200));
              await fetch('/digits/3.png');
              await new Promise((resolve) => setTimeout(resolve, 400));
              await fetch('/digits/4.png');
            })()
          )
          .then(() => Date.now()),
      ]);
      expect(res).toBe(undefined);
      expect(t1).toBeGreaterThan(t2);
      expect(t1 - t2).toBeGreaterThanOrEqual(400);
    });
    it('should respect timeout', async () => {
      const { page, puppeteer } = getTestState();
      let error = null;
      await page
        .waitForNetworkIdle({ timeout: 1 })
        .catch((error_) => (error = error_));
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should respect idleTime', async () => {
      const { page, server } = getTestState();
      await page.goto(server.EMPTY_PAGE);
      const [t1, t2] = await Promise.all([
        page.waitForNetworkIdle({ idleTime: 10 }).then(() => Date.now()),
        page
          .evaluate(() =>
            (async () => {
              await Promise.all([
                fetch('/digits/1.png'),
                fetch('/digits/2.png'),
              ]);
              await new Promise((resolve) => setTimeout(resolve, 250));
            })()
          )
          .then(() => Date.now()),
      ]);
      expect(t2).toBeGreaterThan(t1);
    });
    it('should work with no timeout', async () => {
      const { page, server } = getTestState();
      await page.goto(server.EMPTY_PAGE);
      const [result] = await Promise.all([
        page.waitForNetworkIdle({ timeout: 0 }),
        page.evaluate(() =>
          setTimeout(() => {
            fetch('/digits/1.png');
            fetch('/digits/2.png');
            fetch('/digits/3.png');
          }, 50)
        ),
      ]);
      expect(result).toBe(undefined);
    });
  });

  describeFailsFirefox('Page.exposeFunction', function () {
    it('should work', async () => {
      const { page } = getTestState();

      await page.exposeFunction('compute', function (a, b) {
        return a * b;
      });
      const result = await page.evaluate(async function () {
        return await globalThis.compute(9, 4);
      });
      expect(result).toBe(36);
    });
    it('should throw exception in page context', async () => {
      const { page } = getTestState();

      await page.exposeFunction('woof', function () {
        throw new Error('WOOF WOOF');
      });
      const { message, stack } = await page.evaluate(async () => {
        try {
          await globalThis.woof();
        } catch (error) {
          return { message: error.message, stack: error.stack };
        }
      });
      expect(message).toBe('WOOF WOOF');
      expect(stack).toContain(__filename);
    });
    it('should support throwing "null"', async () => {
      const { page } = getTestState();

      await page.exposeFunction('woof', function () {
        throw null;
      });
      const thrown = await page.evaluate(async () => {
        try {
          await globalThis.woof();
        } catch (error) {
          return error;
        }
      });
      expect(thrown).toBe(null);
    });
    it('should be callable from-inside evaluateOnNewDocument', async () => {
      const { page } = getTestState();

      let called = false;
      await page.exposeFunction('woof', function () {
        called = true;
      });
      await page.evaluateOnNewDocument(() => globalThis.woof());
      await page.reload();
      expect(called).toBe(true);
    });
    it('should survive navigation', async () => {
      const { page, server } = getTestState();

      await page.exposeFunction('compute', function (a, b) {
        return a * b;
      });

      await page.goto(server.EMPTY_PAGE);
      const result = await page.evaluate(async function () {
        return await globalThis.compute(9, 4);
      });
      expect(result).toBe(36);
    });
    it('should await returned promise', async () => {
      const { page } = getTestState();

      await page.exposeFunction('compute', function (a, b) {
        return Promise.resolve(a * b);
      });

      const result = await page.evaluate(async function () {
        return await globalThis.compute(3, 5);
      });
      expect(result).toBe(15);
    });
    it('should work on frames', async () => {
      const { page, server } = getTestState();

      await page.exposeFunction('compute', function (a, b) {
        return Promise.resolve(a * b);
      });

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      const frame = page.frames()[1];
      const result = await frame.evaluate(async function () {
        return await globalThis.compute(3, 5);
      });
      expect(result).toBe(15);
    });
    it('should work on frames before navigation', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      await page.exposeFunction('compute', function (a, b) {
        return Promise.resolve(a * b);
      });

      const frame = page.frames()[1];
      const result = await frame.evaluate(async function () {
        return await globalThis.compute(3, 5);
      });
      expect(result).toBe(15);
    });
    it('should work with complex objects', async () => {
      const { page } = getTestState();

      await page.exposeFunction('complexObject', function (a, b) {
        return { x: a.x + b.x };
      });
      const result = await page.evaluate<() => Promise<{ x: number }>>(
        async () => globalThis.complexObject({ x: 5 }, { x: 2 })
      );
      expect(result.x).toBe(7);
    });
  });

  describeFailsFirefox('Page.Events.PageError', function () {
    it('should fire', async () => {
      const { page, server } = getTestState();

      let error = null;
      page.once('pageerror', (e) => (error = e));
      await Promise.all([
        page.goto(server.PREFIX + '/error.html'),
        waitEvent(page, 'pageerror'),
      ]);
      expect(error.message).toContain('Fancy');
    });
  });

  describe('Page.setUserAgent', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      expect(await page.evaluate(() => navigator.userAgent)).toContain(
        'Mozilla'
      );
      await page.setUserAgent('foobar');
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      expect(request.headers['user-agent']).toBe('foobar');
    });
    it('should work for subframes', async () => {
      const { page, server } = getTestState();

      expect(await page.evaluate(() => navigator.userAgent)).toContain(
        'Mozilla'
      );
      await page.setUserAgent('foobar');
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        utils.attachFrame(page, 'frame1', server.EMPTY_PAGE),
      ]);
      expect(request.headers['user-agent']).toBe('foobar');
    });
    it('should emulate device user-agent', async () => {
      const { page, server, puppeteer } = getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      expect(await page.evaluate(() => navigator.userAgent)).not.toContain(
        'iPhone'
      );
      await page.setUserAgent(puppeteer.devices['iPhone 6'].userAgent);
      expect(await page.evaluate(() => navigator.userAgent)).toContain(
        'iPhone'
      );
    });
    itFailsFirefox('should work with additional userAgentMetdata', async () => {
      const { page, server } = getTestState();

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
      const { page } = getTestState();

      await page.setContent('<div>hello</div>');
      const result = await page.content();
      expect(result).toBe(expectedOutput);
    });
    it('should work with doctype', async () => {
      const { page } = getTestState();

      const doctype = '<!DOCTYPE html>';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    });
    it('should work with HTML 4 doctype', async () => {
      const { page } = getTestState();

      const doctype =
        '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
        '"http://www.w3.org/TR/html4/strict.dtd">';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    });
    it('should respect timeout', async () => {
      const { page, server, puppeteer } = getTestState();

      const imgPath = '/img.png';
      // stall for image
      server.setRoute(imgPath, () => {});
      let error = null;
      await page
        .setContent(`<img src="${server.PREFIX + imgPath}"></img>`, {
          timeout: 1,
        })
        .catch((error_) => (error = error_));
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should respect default navigation timeout', async () => {
      const { page, server, puppeteer } = getTestState();

      page.setDefaultNavigationTimeout(1);
      const imgPath = '/img.png';
      // stall for image
      server.setRoute(imgPath, () => {});
      let error = null;
      await page
        .setContent(`<img src="${server.PREFIX + imgPath}"></img>`)
        .catch((error_) => (error = error_));
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should await resources to load', async () => {
      const { page, server } = getTestState();

      const imgPath = '/img.png';
      let imgResponse = null;
      server.setRoute(imgPath, (req, res) => (imgResponse = res));
      let loaded = false;
      const contentPromise = page
        .setContent(`<img src="${server.PREFIX + imgPath}"></img>`)
        .then(() => (loaded = true));
      await server.waitForRequest(imgPath);
      expect(loaded).toBe(false);
      imgResponse.end();
      await contentPromise;
    });
    it('should work fast enough', async () => {
      const { page } = getTestState();

      for (let i = 0; i < 20; ++i) await page.setContent('<div>yo</div>');
    });
    it('should work with tricky content', async () => {
      const { page } = getTestState();

      await page.setContent('<div>hello world</div>' + '\x7F');
      expect(await page.$eval('div', (div) => div.textContent)).toBe(
        'hello world'
      );
    });
    it('should work with accents', async () => {
      const { page } = getTestState();

      await page.setContent('<div>aberración</div>');
      expect(await page.$eval('div', (div) => div.textContent)).toBe(
        'aberración'
      );
    });
    it('should work with emojis', async () => {
      const { page } = getTestState();

      await page.setContent('<div>🐥</div>');
      expect(await page.$eval('div', (div) => div.textContent)).toBe('🐥');
    });
    it('should work with newline', async () => {
      const { page } = getTestState();

      await page.setContent('<div>\n</div>');
      expect(await page.$eval('div', (div) => div.textContent)).toBe('\n');
    });
  });

  describeFailsFirefox('Page.setBypassCSP', function () {
    it('should bypass CSP meta tag', async () => {
      const { page, server } = getTestState();

      // Make sure CSP prohibits addScriptTag.
      await page.goto(server.PREFIX + '/csp.html');
      await page
        .addScriptTag({ content: 'window.__injected = 42;' })
        .catch((error) => void error);
      expect(await page.evaluate(() => globalThis.__injected)).toBe(undefined);

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();
      await page.addScriptTag({ content: 'window.__injected = 42;' });
      expect(await page.evaluate(() => globalThis.__injected)).toBe(42);
    });

    it('should bypass CSP header', async () => {
      const { page, server } = getTestState();

      // Make sure CSP prohibits addScriptTag.
      server.setCSP('/empty.html', 'default-src "self"');
      await page.goto(server.EMPTY_PAGE);
      await page
        .addScriptTag({ content: 'window.__injected = 42;' })
        .catch((error) => void error);
      expect(await page.evaluate(() => globalThis.__injected)).toBe(undefined);

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();
      await page.addScriptTag({ content: 'window.__injected = 42;' });
      expect(await page.evaluate(() => globalThis.__injected)).toBe(42);
    });

    it('should bypass after cross-process navigation', async () => {
      const { page, server } = getTestState();

      await page.setBypassCSP(true);
      await page.goto(server.PREFIX + '/csp.html');
      await page.addScriptTag({ content: 'window.__injected = 42;' });
      expect(await page.evaluate(() => globalThis.__injected)).toBe(42);

      await page.goto(server.CROSS_PROCESS_PREFIX + '/csp.html');
      await page.addScriptTag({ content: 'window.__injected = 42;' });
      expect(await page.evaluate(() => globalThis.__injected)).toBe(42);
    });
    it('should bypass CSP in iframes as well', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      {
        // Make sure CSP prohibits addScriptTag in an iframe.
        const frame = await utils.attachFrame(
          page,
          'frame1',
          server.PREFIX + '/csp.html'
        );
        await frame
          .addScriptTag({ content: 'window.__injected = 42;' })
          .catch((error) => void error);
        expect(await frame.evaluate(() => globalThis.__injected)).toBe(
          undefined
        );
      }

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();

      {
        const frame = await utils.attachFrame(
          page,
          'frame1',
          server.PREFIX + '/csp.html'
        );
        await frame
          .addScriptTag({ content: 'window.__injected = 42;' })
          .catch((error) => void error);
        expect(await frame.evaluate(() => globalThis.__injected)).toBe(42);
      }
    });
  });

  describe('Page.addScriptTag', function () {
    it('should throw an error if no options are provided', async () => {
      const { page } = getTestState();

      let error = null;
      try {
        // @ts-expect-error purposefully passing bad options
        await page.addScriptTag('/injectedfile.js');
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toBe(
        'Provide an object with a `url`, `path` or `content` property'
      );
    });

    it('should work with a url', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({ url: '/injectedfile.js' });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(() => globalThis.__injected)).toBe(42);
    });

    it('should work with a url and type=module', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({ url: '/es6/es6import.js', type: 'module' });
      expect(await page.evaluate(() => globalThis.__es6injected)).toBe(42);
    });

    it('should work with a path and type=module', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({
        path: path.join(__dirname, 'assets/es6/es6pathimport.js'),
        type: 'module',
      });
      await page.waitForFunction('window.__es6injected');
      expect(await page.evaluate(() => globalThis.__es6injected)).toBe(42);
    });

    it('should work with a content and type=module', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({
        content: `import num from '/es6/es6module.js';window.__es6injected = num;`,
        type: 'module',
      });
      await page.waitForFunction('window.__es6injected');
      expect(await page.evaluate(() => globalThis.__es6injected)).toBe(42);
    });

    it('should throw an error if loading from url fail', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error = null;
      try {
        await page.addScriptTag({ url: '/nonexistfile.js' });
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toBe('Loading script from /nonexistfile.js failed');
    });

    it('should work with a path', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({
        path: path.join(__dirname, 'assets/injectedfile.js'),
      });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(() => globalThis.__injected)).toBe(42);
    });

    it('should include sourcemap when path is provided', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({
        path: path.join(__dirname, 'assets/injectedfile.js'),
      });
      const result = await page.evaluate(
        () => globalThis.__injectedError.stack
      );
      expect(result).toContain(path.join('assets', 'injectedfile.js'));
    });

    it('should work with content', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({
        content: 'window.__injected = 35;',
      });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(() => globalThis.__injected)).toBe(35);
    });

    // @see https://github.com/puppeteer/puppeteer/issues/4840
    xit('should throw when added with content to the CSP page', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page
        .addScriptTag({ content: 'window.__injected = 35;' })
        .catch((error_) => (error = error_));
      expect(error).toBeTruthy();
    });

    it('should throw when added with URL to the CSP page', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page
        .addScriptTag({ url: server.CROSS_PROCESS_PREFIX + '/injectedfile.js' })
        .catch((error_) => (error = error_));
      expect(error).toBeTruthy();
    });
  });

  describe('Page.addStyleTag', function () {
    it('should throw an error if no options are provided', async () => {
      const { page } = getTestState();

      let error = null;
      try {
        // @ts-expect-error purposefully passing bad input
        await page.addStyleTag('/injectedstyle.css');
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toBe(
        'Provide an object with a `url`, `path` or `content` property'
      );
    });

    it('should work with a url', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({ url: '/injectedstyle.css' });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(
        await page.evaluate(
          `window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`
        )
      ).toBe('rgb(255, 0, 0)');
    });

    it('should throw an error if loading from url fail', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error = null;
      try {
        await page.addStyleTag({ url: '/nonexistfile.js' });
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toBe('Loading style from /nonexistfile.js failed');
    });

    it('should work with a path', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({
        path: path.join(__dirname, 'assets/injectedstyle.css'),
      });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(
        await page.evaluate(
          `window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`
        )
      ).toBe('rgb(255, 0, 0)');
    });

    it('should include sourcemap when path is provided', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.addStyleTag({
        path: path.join(__dirname, 'assets/injectedstyle.css'),
      });
      const styleHandle = await page.$('style');
      const styleContent = await page.evaluate(
        (style: HTMLStyleElement) => style.innerHTML,
        styleHandle
      );
      expect(styleContent).toContain(path.join('assets', 'injectedstyle.css'));
    });

    it('should work with content', async () => {
      const { page, server } = getTestState();

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

    itFailsFirefox(
      'should throw when added with content to the CSP page',
      async () => {
        const { page, server } = getTestState();

        await page.goto(server.PREFIX + '/csp.html');
        let error = null;
        await page
          .addStyleTag({ content: 'body { background-color: green; }' })
          .catch((error_) => (error = error_));
        expect(error).toBeTruthy();
      }
    );

    it('should throw when added with URL to the CSP page', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page
        .addStyleTag({
          url: server.CROSS_PROCESS_PREFIX + '/injectedstyle.css',
        })
        .catch((error_) => (error = error_));
      expect(error).toBeTruthy();
    });
  });

  describe('Page.url', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      expect(page.url()).toBe('about:blank');
      await page.goto(server.EMPTY_PAGE);
      expect(page.url()).toBe(server.EMPTY_PAGE);
    });
  });

  describeFailsFirefox('Page.setJavaScriptEnabled', function () {
    it('should work', async () => {
      const { page } = getTestState();

      await page.setJavaScriptEnabled(false);
      await page.goto(
        'data:text/html, <script>var something = "forbidden"</script>'
      );
      let error = null;
      await page.evaluate('something').catch((error_) => (error = error_));
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
      const { page, server } = getTestState();

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
    itFailsFirefox(
      'should stay disabled when toggling request interception on/off',
      async () => {
        const { page, server } = getTestState();

        await page.setCacheEnabled(false);
        await page.setRequestInterception(true);
        await page.setRequestInterception(false);

        await page.goto(server.PREFIX + '/cached/one-style.html');
        const [nonCachedRequest] = await Promise.all([
          server.waitForRequest('/cached/one-style.html'),
          page.reload(),
        ]);
        expect(nonCachedRequest.headers['if-modified-since']).toBe(undefined);
      }
    );
  });

  describe('printing to PDF', function () {
    it('can print to PDF and save to file', async () => {
      // Printing to pdf is currently only supported in headless
      const { isHeadless, page } = getTestState();

      if (!isHeadless) return;

      const outputFile = __dirname + '/assets/output.pdf';
      await page.pdf({ path: outputFile });
      expect(fs.readFileSync(outputFile).byteLength).toBeGreaterThan(0);
      fs.unlinkSync(outputFile);
    });

    it('can print to PDF and stream the result', async () => {
      // Printing to pdf is currently only supported in headless
      const { isHeadless, page } = getTestState();

      if (!isHeadless) return;

      const stream = await page.createPDFStream();
      let size = 0;
      for await (const chunk of stream) {
        size += chunk.length;
      }
      expect(size).toBeGreaterThan(0);
    });

    itChromeOnly('should respect timeout', async () => {
      const { isHeadless, page, server, puppeteer } = getTestState();
      const customFontBase64 =
        'data:application/font-woff;base64,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';

      // #6834 page.pdf hangs
      // when putting 2 different definition of same font-family
      // in both header and body
      // https://github.com/puppeteer/puppeteer/issues/6834
      const problematicStyleTag = `
        <style>
          @font-face {
            font-family:"custom-font";
            font-display:swap;
            src:url("${customFontBase64}")
          }
          #custom-header {
            font-family: 'custom-font', 'Times New Roman';
          }
        </style>
      `;

      if (!isHeadless) return;

      await page.goto(server.PREFIX + '/pdf.html', {
        waitUntil: 'networkidle0',
      });
      await page.evaluateHandle('document.fonts.ready');

      let error = null;
      await page
        .pdf({
          displayHeaderFooter: true,
          headerTemplate: `
            ${problematicStyleTag}
            <div id="custom-header">
              Header
            </div>`,
          timeout: 1,
        })
        .catch((_error) => (error = _error));
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
  });

  describe('Page.title', function () {
    it('should return the page title', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/title.html');
      expect(await page.title()).toBe('Woof-Woof');
    });
  });

  describe('Page.select', function () {
    it('should select single option', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(await page.evaluate(() => globalThis.result.onInput)).toEqual([
        'blue',
      ]);
      expect(await page.evaluate(() => globalThis.result.onChange)).toEqual([
        'blue',
      ]);
    });
    it('should select only first option', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue', 'green', 'red');
      expect(await page.evaluate(() => globalThis.result.onInput)).toEqual([
        'blue',
      ]);
      expect(await page.evaluate(() => globalThis.result.onChange)).toEqual([
        'blue',
      ]);
    });
    it('should not throw when select causes navigation', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.$eval('select', (select) =>
        select.addEventListener(
          'input',
          () => ((window as any).location = '/empty.html')
        )
      );
      await Promise.all([
        page.select('select', 'blue'),
        page.waitForNavigation(),
      ]);
      expect(page.url()).toContain('empty.html');
    });
    it('should select multiple options', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => globalThis.makeMultiple());
      await page.select('select', 'blue', 'green', 'red');
      expect(await page.evaluate(() => globalThis.result.onInput)).toEqual([
        'blue',
        'green',
        'red',
      ]);
      expect(await page.evaluate(() => globalThis.result.onChange)).toEqual([
        'blue',
        'green',
        'red',
      ]);
    });
    it('should respect event bubbling', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(
        await page.evaluate(() => globalThis.result.onBubblingInput)
      ).toEqual(['blue']);
      expect(
        await page.evaluate(() => globalThis.result.onBubblingChange)
      ).toEqual(['blue']);
    });
    it('should throw when element is not a <select>', async () => {
      const { page, server } = getTestState();

      let error = null;
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('body', '').catch((error_) => (error = error_));
      expect(error.message).toContain('Element is not a <select> element.');
    });
    it('should return [] on no matched values', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select', '42', 'abc');
      expect(result).toEqual([]);
    });
    it('should return an array of matched values', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => globalThis.makeMultiple());
      const result = await page.select('select', 'blue', 'black', 'magenta');
      expect(
        result.reduce(
          (accumulator, current) =>
            ['blue', 'black', 'magenta'].includes(current) && accumulator,
          true
        )
      ).toEqual(true);
    });
    it('should return an array of one element when multiple is not set', async () => {
      const { page, server } = getTestState();

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
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select');
      expect(result).toEqual([]);
    });
    it('should deselect all options when passed no values for a multiple select', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => globalThis.makeMultiple());
      await page.select('select', 'blue', 'black', 'magenta');
      await page.select('select');
      expect(
        await page.$eval('select', (select: HTMLSelectElement) =>
          Array.from(select.options).every(
            (option: HTMLOptionElement) => !option.selected
          )
        )
      ).toEqual(true);
    });
    it('should deselect all options when passed no values for a select without multiple', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue', 'black', 'magenta');
      await page.select('select');
      expect(
        await page.$eval('select', (select: HTMLSelectElement) =>
          Array.from(select.options).every(
            (option: HTMLOptionElement) => !option.selected
          )
        )
      ).toEqual(true);
    });
    it('should throw if passed in non-strings', async () => {
      const { page } = getTestState();

      await page.setContent('<select><option value="12"/></select>');
      let error = null;
      try {
        // @ts-expect-error purposefully passing bad input
        await page.select('select', 12);
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toContain('Values must be strings');
    });
    // @see https://github.com/puppeteer/puppeteer/issues/3327
    itFailsFirefox(
      'should work when re-defining top-level Event class',
      async () => {
        const { page, server } = getTestState();

        await page.goto(server.PREFIX + '/input/select.html');
        await page.evaluate(() => (window.Event = null));
        await page.select('select', 'blue');
        expect(await page.evaluate(() => globalThis.result.onInput)).toEqual([
          'blue',
        ]);
        expect(await page.evaluate(() => globalThis.result.onChange)).toEqual([
          'blue',
        ]);
      }
    );
  });

  describe('Page.Events.Close', function () {
    itFailsFirefox('should work with window.close', async () => {
      const { page, context } = getTestState();

      const newPagePromise = new Promise<Page>((fulfill) =>
        context.once('targetcreated', (target) => fulfill(target.page()))
      );
      await page.evaluate(
        () => (window['newPage'] = window.open('about:blank'))
      );
      const newPage = await newPagePromise;
      const closedPromise = new Promise((x) => newPage.on('close', x));
      await page.evaluate(() => window['newPage'].close());
      await closedPromise;
    });
    it('should work with page.close', async () => {
      const { context } = getTestState();

      const newPage = await context.newPage();
      const closedPromise = new Promise((x) => newPage.on('close', x));
      await newPage.close();
      await closedPromise;
    });
  });

  describe('Page.browser', function () {
    it('should return the correct browser instance', async () => {
      const { page, browser } = getTestState();

      expect(page.browser()).toBe(browser);
    });
  });

  describe('Page.browserContext', function () {
    it('should return the correct browser context instance', async () => {
      const { page, context } = getTestState();

      expect(page.browserContext()).toBe(context);
    });
  });
});
