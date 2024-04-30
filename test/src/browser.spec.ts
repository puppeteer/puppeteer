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
      const {browser, close} = await launch({}, {createContext: false});
      try {
        const pages = await browser.pages();
        await Promise.all(
          pages.map(page => {
            return page.close();
          })
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
});
