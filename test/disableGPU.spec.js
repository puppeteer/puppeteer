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

module.exports.addTests = function({testRunner, expect, PROJECT_ROOT, defaultBrowserOptions}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;
  const puppeteer = require(PROJECT_ROOT);

  const headfulOptions = Object.assign({}, defaultBrowserOptions, {
    headless: false,
    args: ['--no-sandbox']
  });
  const headlessOptions = Object.assign({}, defaultBrowserOptions, {
    headless: true,
    args: ['--no-sandbox']
  });
  const disableGPUArg = '--disable-gpu';

  describe('disableGPU', function() {
    it('headless should disable GPU by default', async() => {
      const browser = await puppeteer.launch(headlessOptions);
      expect(browser._process.spawnargs).toContain(disableGPUArg);
      await browser.close();
    });

    it('headless should respect disableGPU option', async() => {
      const browser = await puppeteer.launch(Object.assign({disableGPU: false}, headlessOptions));
      expect(browser._process.spawnargs).not.toContain(disableGPUArg);
      await browser.close();
    });

    it('headful should not disable GPU by default', async() => {
      const browser = await puppeteer.launch(headfulOptions);
      expect(browser._process.spawnargs).not.toContain(disableGPUArg);
      await browser.close();
    });

    it('headless should respect disableGPU option', async() => {
      const browser = await puppeteer.launch(Object.assign({disableGPU: true}, headfulOptions));
      expect(browser._process.spawnargs).toContain(disableGPUArg);
      await browser.close();
    });
  });
};
