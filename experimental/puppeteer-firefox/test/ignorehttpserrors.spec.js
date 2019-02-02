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

module.exports.addTests = function({testRunner, expect, product, puppeteer, defaultBrowserOptions}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;
  const FFOX = product === 'firefox';
  const CHROME = product === 'chromium';

  describe('ignoreHTTPSErrors', function() {
    beforeAll(async state => {
      const options = Object.assign({ignoreHTTPSErrors: true}, defaultBrowserOptions);
      state.browser = await puppeteer.launch(options);
    });
    afterAll(async state => {
      await state.browser.close();
      delete state.browser;
    });
    beforeEach(async state => {
      state.page = await state.browser.newPage();
    });
    afterEach(async state => {
      await state.page.close();
      delete state.page;
    });
    it('should work', async({page, httpsServer}) => {
      let error = null;
      await page.goto(httpsServer.EMPTY_PAGE).catch(e => error = e);
      expect(error).toBe(null);
    });
    it('should work with mixed content', async({page, server, httpsServer}) => {
      httpsServer.setRoute('/mixedcontent.html', (req, res) => {
        res.end(`<iframe src=${server.EMPTY_PAGE}></iframe>`);
      });
      await page.goto(httpsServer.PREFIX + '/mixedcontent.html', {waitUntil: 'load'});
      expect(page.frames().length).toBe(2);
      // Make sure blocked iframe has functional execution context
      // @see https://github.com/GoogleChrome/puppeteer/issues/2709
      expect(await page.frames()[0].evaluate('1 + 2')).toBe(3);
      expect(await page.frames()[1].evaluate('2 + 3')).toBe(5);
    });
  });
};
