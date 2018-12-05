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

const utils = require('./utils');
const {waitEvent} = utils;
const {TimeoutError} = require('../Errors');

module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Target', function() {
    it('Browser.targets should return all of the targets', async({page, server, browser}) => {
      // The pages will be the testing page and the original newtab page
      const targets = browser.targets();
      expect(targets.some(target => target.type() === 'page' &&
        target.url() === 'about:blank')).toBeTruthy('Missing blank page');
    });
    it('Browser.pages should return all of the pages', async({page, server, browser}) => {
      // The pages will be the testing page
      const allPages = await browser.pages();
      expect(allPages.length).toBe(2);
      expect(allPages).toContain(page);
      expect(allPages[0]).not.toBe(allPages[1]);
    });
    it('should be able to use the default page in the browser', async({page, server, browser}) => {
      // The pages will be the testing page and the original newtab page
      const allPages = await browser.pages();
      const originalPage = allPages.find(p => p !== page);
      expect(await originalPage.evaluate(() => ['Hello', 'world'].join(' '))).toBe('Hello world');
      expect(await originalPage.$('body')).toBeTruthy();
    });
    it('should report when a new page is created and closed', async({page, server, browser}) => {
      const [otherPage] = await Promise.all([
        browser.waitForTarget(target => target.url() === server.EMPTY_PAGE2).then(target => target.page()),
        page.evaluate(url => window.open(url), server.EMPTY_PAGE2),
      ]);

      expect(await otherPage.evaluate(() => ['Hello', 'world'].join(' '))).toBe('Hello world');
      expect(await otherPage.$('body')).toBeTruthy();

      let allPages = await browser.pages();
      expect(allPages).toContain(page);
      expect(allPages).toContain(otherPage);

      const closePagePromise = new Promise(fulfill => browser.once('targetdestroyed', target => fulfill(target.page())));
      await otherPage.close();
      expect(await closePagePromise).toBe(otherPage);

      allPages = await Promise.all(browser.targets().map(target => target.page()));
      expect(allPages).toContain(page);
      expect(allPages).not.toContain(otherPage);
    });
    it('should report when a target url changes', async({page, server, browser}) => {
      await page.goto(server.EMPTY_PAGE);
      let changedTarget = new Promise(fulfill => browser.once('targetchanged', target => fulfill(target)));
      await page.goto(server.EMPTY_PAGE2);
      expect((await changedTarget).url()).toBe(server.EMPTY_PAGE2);

      changedTarget = new Promise(fulfill => browser.once('targetchanged', target => fulfill(target)));
      await page.goto(server.EMPTY_PAGE);
      expect((await changedTarget).url()).toBe(server.EMPTY_PAGE);
    });
  });

  describe('Browser.waitForTarget', () => {
    it('should wait for a target', async function({browser, server}) {
      let resolved = false;
      const targetPromise = browser.waitForTarget(target => target.url() === server.EMPTY_PAGE2);
      targetPromise.then(() => resolved = true);
      const page = await browser.newPage();
      expect(resolved).toBe(false);
      await page.goto(server.EMPTY_PAGE2);
      const target = await targetPromise;
      expect(await target.page()).toBe(page);
      await page.close();
    });
    it('should timeout waiting for a non-existent target', async function({browser, server}) {
      let error = null;
      await browser.waitForTarget(target => target.url() === server.EMPTY_PAGE2, {
        timeout: 1
      }).catch(e => error = e);
      expect(error).toBeInstanceOf(TimeoutError);
    });
  });
};
