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
        return;
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
      const {browser, isHeadless} = await getTestState();

      if (!isHeadless) {
        // 'Browser.add|removeScreen' are only available in
        // headless mode.
        return;
      }

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
});
