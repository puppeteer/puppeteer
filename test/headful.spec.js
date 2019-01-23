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

const path = require('path');
const os = require('os');
const fs = require('fs');
const {helper} = require('../lib/helper');
const rmAsync = helper.promisify(require('rimraf'));
const utils = require('./utils');
const {waitEvent} = utils;
const mkdtempAsync = helper.promisify(fs.mkdtemp);

const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');

function waitForBackgroundPageTarget(browser) {
  const target = browser.targets().find(target => target.type() === 'background_page');
  if (target)
    return Promise.resolve(target);
  return new Promise(resolve => {
    browser.on('targetcreated', function listener(target) {
      if (target.type() !== 'background_page')
        return;
      browser.removeListener(listener);
      resolve(target);
    });
  });
}

module.exports.addTests = function({testRunner, expect, puppeteer, defaultBrowserOptions}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  const headfulOptions = Object.assign({}, defaultBrowserOptions, {
    headless: false
  });
  const headlessOptions = Object.assign({}, defaultBrowserOptions, {
    headless: true
  });
  const extensionPath = path.join(__dirname, 'assets', 'simple-extension');
  const extensionOptions = Object.assign({}, defaultBrowserOptions, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  describe('HEADFUL', function() {
    it('background_page target type should be available', async() => {
      const browserWithExtension = await puppeteer.launch(extensionOptions);
      const page = await browserWithExtension.newPage();
      const backgroundPageTarget = await waitForBackgroundPageTarget(browserWithExtension);
      await page.close();
      await browserWithExtension.close();
      expect(backgroundPageTarget).toBeTruthy();
    });
    it('target.page() should return a background_page', async({}) => {
      const browserWithExtension = await puppeteer.launch(extensionOptions);
      const backgroundPageTarget = await waitForBackgroundPageTarget(browserWithExtension);
      const page = await backgroundPageTarget.page();
      expect(await page.evaluate(() => 2 * 3)).toBe(6);
      await browserWithExtension.close();
    });
    it('should have default url when launching browser', async function() {
      const browser = await puppeteer.launch(extensionOptions);
      const pages = (await browser.pages()).map(page => page.url());
      expect(pages).toEqual(['about:blank']);
      await browser.close();
    });
    it('headless should be able to read cookies written by headful', async({server}) => {
      const userDataDir = await mkdtempAsync(TMP_FOLDER);
      // Write a cookie in headful chrome
      const headfulBrowser = await puppeteer.launch(Object.assign({userDataDir}, headfulOptions));
      const headfulPage = await headfulBrowser.newPage();
      await headfulPage.goto(server.EMPTY_PAGE);
      await headfulPage.evaluate(() => document.cookie = 'foo=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
      await headfulBrowser.close();
      // Read the cookie from headless chrome
      const headlessBrowser = await puppeteer.launch(Object.assign({userDataDir}, headlessOptions));
      const headlessPage = await headlessBrowser.newPage();
      await headlessPage.goto(server.EMPTY_PAGE);
      const cookie = await headlessPage.evaluate(() => document.cookie);
      await headlessBrowser.close();
      // This might throw. See https://github.com/GoogleChrome/puppeteer/issues/2778
      await rmAsync(userDataDir).catch(e => {});
      expect(cookie).toBe('foo=true');
    });
    it('OOPIF: should report google.com frame', async({server}) => {
      // https://google.com is isolated by default in Chromium embedder.
      const browser = await puppeteer.launch(headfulOptions);
      const page = await browser.newPage();
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);
      page.on('request', r => r.respond({body: 'YO, GOOGLE.COM'}));
      await page.evaluate(() => {
        const frame = document.createElement('iframe');
        frame.setAttribute('src', 'https://google.com/');
        document.body.appendChild(frame);
        return new Promise(x => frame.onload = x);
      });
      await page.waitForSelector('iframe[src="https://google.com/"]');
      const urls = page.frames().map(frame => frame.url()).sort();
      expect(urls).toEqual([
        server.EMPTY_PAGE,
        'https://google.com/'
      ]);
      await browser.close();
    });
    it('should close browser with beforeunload page', async({server}) => {
      const browser = await puppeteer.launch(headfulOptions);
      const page = await browser.newPage();
      await page.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await page.click('body');
      await browser.close();
    });
  });
};

