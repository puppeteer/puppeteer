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

module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  const FFOX = product === 'firefox';
  const CHROME = product === 'chromium';

  describe('Page.goto', function () {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      expect(page.url()).toBe(server.EMPTY_PAGE);
    });
    it('should work with anchor navigation', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      expect(page.url()).toBe(server.EMPTY_PAGE);
      await page.goto(server.EMPTY_PAGE + '#foo');
      expect(page.url()).toBe(server.EMPTY_PAGE + '#foo');
      await page.goto(server.EMPTY_PAGE + '#bar');
      expect(page.url()).toBe(server.EMPTY_PAGE + '#bar');
    });
    it('should navigate to about:blank', async({page, server}) => {
      await page.goto('about:blank');
      expect(page.url()).toBe('about:blank');
    });
    it('should work with redirects', async({page, server}) => {
      server.setRedirect('/redirect/1.html', '/redirect/2.html');
      server.setRedirect('/redirect/2.html', '/empty.html');
      await page.goto(server.PREFIX + '/redirect/1.html');
      expect(page.url()).toBe(server.EMPTY_PAGE);
    });
    it('should work with subframes return 204', async({page, server}) => {
      server.setRoute('/frames/frame.html', (req, res) => {
        res.statusCode = 204;
        res.end();
      });
      await page.goto(server.PREFIX + '/frames/one-frame.html');
    });
    it('should fail when server returns 204', async({page, server}) => {
      server.setRoute('/empty.html', (req, res) => {
        res.statusCode = 204;
        res.end();
      });
      let error = null;
      await page.goto(server.EMPTY_PAGE).catch(e => error = e);
      expect(error).not.toBe(null);
      expect(error.message).toContain('ABORTED');
    });
    it('should work when page calls history API in beforeunload', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        window.addEventListener('beforeunload', () => history.replaceState(null, 'initial', window.location.href), false);
      });
      await page.goto(server.PREFIX + '/grid.html');
    });
    it('should fail when navigating to bad url', async({page, server}) => {
      let error = null;
      await page.goto('asdfasdf').catch(e => error = e);
      expect(error).not.toBe(null);
    });
    it('should fail when navigating to bad url', async({page, server}) => {
      let error = null;
      await page.goto('asdf').catch(e => error = e);
      expect(error).not.toBe(null);
    });
    it('should fail when navigating to bad SSL', async({page, httpsServer}) => {
      let error = null;
      await page.goto(httpsServer.EMPTY_PAGE).catch(e => error = e);
      expect(error).not.toBe(null);
    });
    it('should fail when navigating to bad SSL after redirects', async({page, server, httpsServer}) => {
      httpsServer.setRedirect('/redirect/1.html', '/redirect/2.html');
      httpsServer.setRedirect('/redirect/2.html', '/empty.html');
      let error = null;
      await page.goto(httpsServer.PREFIX + '/redirect/1.html').catch(e => error = e);
      expect(error).not.toBe(null);
    });
    it('should fail when main resources failed to load', async({page, server}) => {
      let error = null;
      await page.goto('http://localhost:44123/non-existing-url').catch(e => error = e);
      expect(error).not.toBe(null);
    });
    it('should fail when exceeding maximum navigation timeout', async({page, server}) => {
      // Hang for request to the empty.html
      server.setRoute('/empty.html', (req, res) => { });
      let error = null;
      await page.goto(server.PREFIX + '/empty.html', {timeout: 1}).catch(e => error = e);
      expect(error.message).toContain('Navigation Timeout Exceeded: 1ms');
    });
    it('should disable timeout when its set to 0', async({page, server}) => {
      await page.goto(server.PREFIX + '/grid.html', {timeout: 0});
    });
    it('should work when navigating to data url', async({page, server}) => {
      await page.goto('data:text/html,hello');
    });
    it('should work when navigating to 404', async({page, server}) => {
      await page.goto(server.PREFIX + '/not-found');
    });
    it('should not leak listeners during navigation', async({page, server}) => {
      let warning = null;
      const warningHandler = w => warning = w;
      process.on('warning', warningHandler);
      for (let i = 0; i < 20; ++i)
        await page.goto(server.EMPTY_PAGE);
      process.removeListener('warning', warningHandler);
      expect(warning).toBe(null);
    });
    it('should fail when navigating and show the url at the error message', async function({page, server, httpsServer}) {
      const url = httpsServer.PREFIX + '/redirect/1.html';
      let error = null;
      try {
        await page.goto(url);
      } catch (e) {
        error = e;
      }
      expect(error.message).toContain(url);
    });
  });

  describe('Page.waitForNavigation', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.evaluate(url => window.location.href = url, server.PREFIX + '/grid.html')
      ]);
      expect(page.url()).toBe(server.PREFIX + '/grid.html');
    });
    it('should work with both domcontentloaded and load', async({page, server}) => {
      let response = null;
      server.setRoute('/one-style.css', (req, res) => response = res);
      const navigationPromise = page.goto(server.PREFIX + '/one-style.html');
      const domContentLoadedPromise = page.waitForNavigation({
        waitUntil: 'domcontentloaded'
      });

      let bothFired = false;
      const bothFiredPromise = page.waitForNavigation({
        waitUntil: ['load', 'domcontentloaded']
      }).then(() => bothFired = true);

      await server.waitForRequest('/one-style.css');
      await domContentLoadedPromise;
      expect(bothFired).toBe(false);
      response.end();
      await bothFiredPromise;
      await navigationPromise;
    });
    it('should work with clicking on anchor links', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`<a href='#foobar'>foobar</a>`);
      await Promise.all([
        page.waitForNavigation(),
        page.click('a'),
      ]);
      expect(page.url()).toBe(server.EMPTY_PAGE + '#foobar');
    });
    it('should work with history.pushState()', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`
        <a onclick='javascript:pushState()'>SPA</a>
        <script>
          function pushState() { history.pushState({}, '', 'wow.html') }
        </script>
      `);
      await Promise.all([
        page.waitForNavigation(),
        page.click('a'),
      ]);
      expect(page.url()).toBe(server.PREFIX + '/wow.html');
    });
    it('should work with history.replaceState()', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`
        <a onclick='javascript:replaceState()'>SPA</a>
        <script>
          function replaceState() { history.replaceState({}, '', '/replaced.html') }
        </script>
      `);
      await Promise.all([
        page.waitForNavigation(),
        page.click('a'),
      ]);
      expect(page.url()).toBe(server.PREFIX + '/replaced.html');
    });
    xit('should work with DOM history.back()/history.forward()', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`
        <a id=back onclick='javascript:goBack()'>back</a>
        <a id=forward onclick='javascript:goForward()'>forward</a>
        <script>
          function goBack() { history.back(); }
          function goForward() { history.forward(); }
          history.pushState({}, '', '/first.html');
          history.pushState({}, '', '/second.html');
        </script>
      `);
      expect(page.url()).toBe(server.PREFIX + '/second.html');
      await Promise.all([
        page.waitForNavigation(),
        page.click('a#back'),
      ]);
      expect(page.url()).toBe(server.PREFIX + '/first.html');
      await Promise.all([
        page.waitForNavigation(),
        page.click('a#forward'),
      ]);
      expect(page.url()).toBe(server.PREFIX + '/second.html');
    });
    it('should work when subframe issues window.stop()', async({page, server}) => {
      server.setRoute('/frames/style.css', (req, res) => {});
      const navigationPromise = page.goto(server.PREFIX + '/frames/one-frame.html');
      const frame = await utils.waitEvent(page, 'frameattached');
      await new Promise(fulfill => {
        page.on('framenavigated', f => {
          if (f === frame)
            fulfill();
        });
      });
      await Promise.all([
        frame.evaluate(() => window.stop()),
        navigationPromise
      ]);
    });
  });

  describe('Page.goBack + Page.goForward', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.goto(server.PREFIX + '/grid.html');

      await page.goBack();
      expect(page.url()).toBe(server.EMPTY_PAGE);

      await page.goForward();
      expect(page.url()).toContain('/grid.html');

      await page.goForward();
      expect(page.url()).toContain('/grid.html');
    });
    it('should work with HistoryAPI', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        history.pushState({}, '', '/first.html');
        history.pushState({}, '', '/second.html');
      });
      expect(page.url()).toBe(server.PREFIX + '/second.html');

      await page.goBack();
      expect(page.url()).toBe(server.PREFIX + '/first.html');
      await page.goBack();
      expect(page.url()).toBe(server.EMPTY_PAGE);
      await page.goForward();
      expect(page.url()).toBe(server.PREFIX + '/first.html');
    });
  });

  describe('Page.reload', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => window._foo = 10);
      await page.reload();
      expect(await page.evaluate(() => window._foo)).toBe(undefined);
    });
  });
};

