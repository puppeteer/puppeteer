/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {getTestState, launch, setupTestBrowserHooks} from './mocha-utils.js';

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

  describe('Browser.isConnected', () => {
    it('should set the browser connected state', async () => {
      const {browser, puppeteer} = await getTestState({
        skipContextCreation: true,
      });

      const browserWSEndpoint = browser.wsEndpoint();
      using newBrowser = await puppeteer.connect({
        browserWSEndpoint,
        protocol: browser.protocol,
      });
      expect(newBrowser.isConnected()).toBe(true);
      await newBrowser.disconnect();
      expect(newBrowser.isConnected()).toBe(false);
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
          id: '1',
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
        id: '2',
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

      // Expect the maximized window to fill the entire screen's available area.
      expect(await browser.getWindowBounds(windowId)).toMatchObject({
        left: screenInfo.availLeft,
        top: screenInfo.availTop,
        width: screenInfo.availWidth,
        height: screenInfo.availHeight,
        windowState: 'maximized',
      });

      // Cleanup.
      await browser.removeScreen(screenInfo.id);
    });
  });
});
