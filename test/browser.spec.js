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

module.exports.addTests = function({testRunner, expect, defaultBrowserOptions, puppeteer}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;
  const headless = defaultBrowserOptions.headless;

  describe('Browser.version', function() {
    it('should return whether we are in headless', async({browser}) => {
      const version = await browser.version();
      expect(version.length).toBeGreaterThan(0);
      expect(version.startsWith('Headless')).toBe(headless);
    });
  });

  describe('Browser.userAgent', function() {
    it('should include WebKit', async({browser}) => {
      const userAgent = await browser.userAgent();
      expect(userAgent.length).toBeGreaterThan(0);
      expect(userAgent).toContain('WebKit');
    });
  });

  describe('Browser.process', function() {
    it('should return child_process instance', async function({browser}) {
      const process = await browser.process();
      expect(process.pid).toBeGreaterThan(0);
      const browserWSEndpoint = browser.wsEndpoint();
      const remoteBrowser = await puppeteer.connect({browserWSEndpoint});
      expect(remoteBrowser.process()).toBe(null);
      await remoteBrowser.disconnect();
    });
  });

  describe('Browser.Events.disconnected', function() {
    it('should emitted when: browser gets closed, disconnected or underlying websocket gets closed', async() => {
      const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
      const browserWSEndpoint = originalBrowser.wsEndpoint();
      const remoteBrowser1 = await puppeteer.connect({browserWSEndpoint});
      const remoteBrowser2 = await puppeteer.connect({browserWSEndpoint});

      let disconnectedOriginal = 0;
      let disconnectedRemote1 = 0;
      let disconnectedRemote2 = 0;
      originalBrowser.on('disconnected', () => ++disconnectedOriginal);
      remoteBrowser1.on('disconnected', () => ++disconnectedRemote1);
      remoteBrowser2.on('disconnected', () => ++disconnectedRemote2);

      await remoteBrowser2.disconnect();
      expect(disconnectedOriginal).toBe(0);
      expect(disconnectedRemote1).toBe(0);
      expect(disconnectedRemote2).toBe(1);

      await originalBrowser.close();
      expect(disconnectedOriginal).toBe(1);
      expect(disconnectedRemote1).toBe(1);
      expect(disconnectedRemote2).toBe(1);
    });
  });
};