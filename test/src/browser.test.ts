/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';

import {
  assertAtLeastOneToContain,
  getTestState,
  launch,
  setupTestBrowserHooks,
} from './mocha-utils.js';
import {assertMatchObject} from './utils.js';

describe('Browser specs', function () {
  setupTestBrowserHooks();

  describe('Browser.version', function () {
    it('should return version', async () => {
      const {browser} = await getTestState();

      const version = await browser.version();
      assert.isAbove(version.length, 0);
      assertAtLeastOneToContain(version.toLowerCase(), ['firefox', 'chrome']);
    });
  });

  describe('Browser.userAgent', function () {
    it('should include Browser engine', async () => {
      const {browser, isChrome} = await getTestState();

      const userAgent = await browser.userAgent();
      assert.isAbove(userAgent.length, 0);
      if (isChrome) {
        assert.include(userAgent, 'WebKit');
      } else {
        assert.include(userAgent, 'Gecko');
      }
    });
    it('should include Browser name', async () => {
      const {browser, isChrome} = await getTestState();

      const userAgent = await browser.userAgent();
      assert.isAbove(userAgent.length, 0);
      if (isChrome) {
        assert.include(userAgent, 'Chrome');
      } else {
        assert.include(userAgent, 'Firefox');
      }
    });
  });

  describe('Browser.target', function () {
    it('should return browser target', async () => {
      const {browser} = await getTestState();

      const target = browser.target();
      assert.strictEqual(target.type(), 'browser');
    });
  });

  describe('Browser.process', function () {
    it('should return child_process instance', async () => {
      const {browser} = await getTestState();

      const process = await browser.process();
      assert.isAbove(process!.pid!, 0);
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
      assert.isNull(remoteBrowser.process());
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
        assert.isTrue(browser.connected);
        // Verify the browser can open a new page.
        await browser.newPage();
      } finally {
        await close();
      }
    });
  });

  describe('Browser.connected', () => {
    it('should set the browser connected state', async () => {
      const {browser, puppeteer} = await getTestState({
        skipContextCreation: true,
      });

      const browserWSEndpoint = browser.wsEndpoint();
      using newBrowser = await puppeteer.connect({
        browserWSEndpoint,
        protocol: browser.protocol,
      });
      assert.isTrue(newBrowser.connected);
      await newBrowser.disconnect();
      assert.isFalse(newBrowser.connected);
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
      assert.lengthOf(screenInfos, 1);
      assertMatchObject(screenInfos, [
        {
          availHeight: 600,
          availLeft: 0,
          availTop: 0,
          availWidth: 800,
          colorDepth: 24,
          devicePixelRatio: 1,
          height: 600,
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
      assert.isString(screenInfos[0]!.id);
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
      assertMatchObject(screenInfo, {
        availHeight: 1120,
        availLeft: 800,
        availTop: 0,
        availWidth: 1600,
        colorDepth: 32,
        devicePixelRatio: 1,
        height: 1200,
        isExtended: true,
        isInternal: false,
        isPrimary: false,
        label: 'secondary',
        left: 800,
        orientation: {angle: 0, type: 'landscapePrimary'},
        top: 0,
        width: 1600,
      });
      assert.isString(screenInfo.id);
      assert.strictEqual((await browser.screens()).length, 2);

      await browser.removeScreen(screenInfo.id);
      assert.strictEqual((await browser.screens()).length, 1);
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
      assertMatchObject(await browser.getWindowBounds(windowId), initialBounds);

      const setBounds = {
        left: 100,
        top: 200,
        width: 1600,
        height: 1200,
      };
      await browser.setWindowBounds(windowId, setBounds);
      assertMatchObject(await browser.getWindowBounds(windowId), setBounds);
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
      assertMatchObject(await browser.getWindowBounds(windowId), {
        windowState: 'maximized',
      });

      // Cleanup.
      await browser.removeScreen(screenInfo.id);
    });
  });
});
