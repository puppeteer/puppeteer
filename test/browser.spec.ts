/**
 * Copyright 2018 Google Inc. All rights reserved.
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
import { getTestState, setupTestBrowserHooks } from './mocha-utils'; // eslint-disable-line import/extensions

describe('Browser specs', function () {
  setupTestBrowserHooks();

  describe('Browser.version', function () {
    it('should return whether we are in headless', async () => {
      const { browser, isHeadless } = getTestState();

      const version = await browser.version();
      expect(version.length).toBeGreaterThan(0);
      expect(version.startsWith('Headless')).toBe(isHeadless);
    });
  });

  describe('Browser.userAgent', function () {
    it('should include WebKit', async () => {
      const { browser, isChrome } = getTestState();

      const userAgent = await browser.userAgent();
      expect(userAgent.length).toBeGreaterThan(0);
      if (isChrome) expect(userAgent).toContain('WebKit');
      else expect(userAgent).toContain('Gecko');
    });
  });

  describe('Browser.target', function () {
    it('should return browser target', async () => {
      const { browser } = getTestState();

      const target = browser.target();
      expect(target.type()).toBe('browser');
    });
  });

  describe('Browser.process', function () {
    it('should return child_process instance', async () => {
      const { browser } = getTestState();

      const process = await browser.process();
      expect(process.pid).toBeGreaterThan(0);
    });
    it('should not return child_process for remote browser', async () => {
      const { browser, puppeteer } = getTestState();

      const browserWSEndpoint = browser.wsEndpoint();
      const remoteBrowser = await puppeteer.connect({ browserWSEndpoint });
      expect(remoteBrowser.process()).toBe(null);
      remoteBrowser.disconnect();
    });
  });

  describe('Browser.isConnected', () => {
    it('should set the browser connected state', async () => {
      const { browser, puppeteer } = getTestState();

      const browserWSEndpoint = browser.wsEndpoint();
      const newBrowser = await puppeteer.connect({ browserWSEndpoint });
      expect(newBrowser.isConnected()).toBe(true);
      newBrowser.disconnect();
      expect(newBrowser.isConnected()).toBe(false);
    });
  });
});
