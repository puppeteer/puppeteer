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
const os = require('os');
const rm = require('rimraf').sync;
const path = require('path');
const {helper} = require('../lib/helper');
const mkdtempAsync = helper.promisify(fs.mkdtemp);
const readFileAsync = helper.promisify(fs.readFile);
const statAsync = helper.promisify(fs.stat);
const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');
const utils = require('./utils');

module.exports.addTests = function({testRunner, expect, PROJECT_ROOT, defaultBrowserOptions}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;
  const puppeteer = require(PROJECT_ROOT);
  fdescribe('ignoreHTTPSErrors', function() {
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
      const response = await page.goto(httpsServer.EMPTY_PAGE).catch(e => error = e);
      expect(error).toBe(null);
      expect(response.ok()).toBe(true);
      expect(response.securityDetails()).toBeTruthy();
      expect(response.securityDetails().protocol()).toBe('TLS 1.2');
    });
    it('Network redirects should report SecurityDetails', async({page, httpsServer}) => {
      httpsServer.setRedirect('/plzredirect', '/empty.html');
      const responses =  [];
      page.on('response', response => responses.push(response));
      await page.goto(httpsServer.PREFIX + '/plzredirect');
      expect(responses.length).toBe(2);
      expect(responses[0].status()).toBe(302);
      const securityDetails = responses[0].securityDetails();
      expect(securityDetails.protocol()).toBe('TLS 1.2');
    });
    it('should work with mixed content', async({page, server, httpsServer}) => {
      httpsServer.setRoute('/mixedcontent.html', (req, res) => {
        res.end(`<iframe src=${server.EMPTY_PAGE}></iframe>`);
      });
      await page.goto(httpsServer.PREFIX + '/mixedcontent.html', {waitUntil: 'load'});
    });
  });
};
