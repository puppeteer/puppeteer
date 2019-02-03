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
const fs = require('fs');

module.exports.addTests = function({testRunner, expect, product, puppeteer, defaultBrowserOptions}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  const FFOX = product === 'firefox';
  const CHROME = product === 'chromium';
  describe('Launcher.executablePath', function() {
    it('should work', async({server}) => {
      const executablePath = puppeteer.executablePath();
      expect(fs.existsSync(executablePath)).toBe(true);
    });
  });

  describe('Launcher.launch', () => {
    it('should set the default viewport', async() => {
      const options = Object.assign({}, defaultBrowserOptions, {
        defaultViewport: {
          width: 456,
          height: 789
        }
      });
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      expect(await page.evaluate('window.innerWidth')).toBe(456);
      expect(await page.evaluate('window.innerHeight')).toBe(789);
      await browser.close();
    });
    it('should disable the default viewport', async() => {
      const options = Object.assign({}, defaultBrowserOptions, {
        defaultViewport: null
      });
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      expect(page.viewport()).toBe(null);
      await browser.close();
    });
  });
}
