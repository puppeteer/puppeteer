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

import utils from './utils.js';
import expect from 'expect';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  itFailsFirefox,
  describeFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions
import os from 'os';

describe('navigation', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  describe('Page.goto', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      expect(page.url()).toBe(server.EMPTY_PAGE);
    });
    itFailsFirefox('should work with anchor navigation', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      expect(page.url()).toBe(server.EMPTY_PAGE);
      await page.goto(server.EMPTY_PAGE + '#foo');
      expect(page.url()).toBe(server.EMPTY_PAGE + '#foo');
      await page.goto(server.EMPTY_PAGE + '#bar');
      expect(page.url()).toBe(server.EMPTY_PAGE + '#bar');
    });
    it('should work with redirects', async () => {
      const { page, server } = getTestState();

      server.setRedirect('/redirect/1.html', '/redirect/2.html');
      server.setRedirect('/redirect/2.html', '/empty.html');
      await page.goto(server.PREFIX + '/redirect/1.html');
      expect(page.url()).toBe(server.EMPTY_PAGE);
    });
    it('should navigate to about:blank', async () => {
      const { page } = getTestState();

      const response = await page.goto('about:blank');
      expect(response).toBe(null);
    });
    it('should return response when page changes its URL after load', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.PREFIX + '/historyapi.html');
      expect(response.status()).toBe(200);
    });
    itFailsFirefox('should work with subframes return 204', async () => {
      const { page, server } = getTestState();

      server.setRoute('/frames/frame.html', (req, res) => {
        res.statusCode = 204;
        res.end();
      });
      let error = null;
      await page
        .goto(server.PREFIX + '/frames/one-frame.html')
        .catch((error_) => (error = error_));
      expect(error).toBe(null);
    });
    itFailsFirefox('should fail when server returns 204', async () => {
      const { page, server, isChrome } = getTestState();

      server.setRoute('/empty.html', (req, res) => {
        res.statusCode = 204;
        res.end();
      });
      let error = null;
      await page.goto(server.EMPTY_PAGE).catch((error_) => (error = error_));
      expect(error).not.toBe(null);
      if (isChrome) expect(error.message).toContain('net::ERR_ABORTED');
      else expect(error.message).toContain('NS_BINDING_ABORTED');
    });
    it('should navigate to empty page with domcontentloaded', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.EMPTY_PAGE, {
        waitUntil: 'domcontentloaded',
      });
      expect(response.status()).toBe(200);
    });
    it('should work when page calls history API in beforeunload', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        window.addEventListener(
          'beforeunload',
          () => history.replaceState(null, 'initial', window.location.href),
          false
        );
      });
      const response = await page.goto(server.PREFIX + '/grid.html');
      expect(response.status()).toBe(200);
    });
    itFailsFirefox(
      'should navigate to empty page with networkidle0',
      async () => {
        const { page, server } = getTestState();

        const response = await page.goto(server.EMPTY_PAGE, {
          waitUntil: 'networkidle0',
        });
        expect(response.status()).toBe(200);
      }
    );
    itFailsFirefox(
      'should navigate to empty page with networkidle2',
      async () => {
        const { page, server } = getTestState();

        const response = await page.goto(server.EMPTY_PAGE, {
          waitUntil: 'networkidle2',
        });
        expect(response.status()).toBe(200);
      }
    );
    itFailsFirefox('should fail when navigating to bad url', async () => {
      const { page, isChrome } = getTestState();

      let error = null;
      await page.goto('asdfasdf').catch((error_) => (error = error_));
      if (isChrome)
        expect(error.message).toContain('Cannot navigate to invalid URL');
      else expect(error.message).toContain('Invalid url');
    });

    /* If you are running this on pre-Catalina versions of macOS this will fail locally.
    /* Mac OSX Catalina outputs a different message than other platforms.
     * See https://support.google.com/chrome/thread/18125056?hl=en for details.
     * If you're running pre-Catalina Mac OSX this test will fail locally.
     */
    const EXPECTED_SSL_CERT_MESSAGE =
      os.platform() === 'darwin'
        ? 'net::ERR_CERT_INVALID'
        : 'net::ERR_CERT_AUTHORITY_INVALID';

    itFailsFirefox('should fail when navigating to bad SSL', async () => {
      const { page, httpsServer, isChrome } = getTestState();

      // Make sure that network events do not emit 'undefined'.
      // @see https://crbug.com/750469
      const requests = [];
      page.on('request', () => requests.push('request'));
      page.on('requestfinished', () => requests.push('requestfinished'));
      page.on('requestfailed', () => requests.push('requestfailed'));

      let error = null;
      await page
        .goto(httpsServer.EMPTY_PAGE)
        .catch((error_) => (error = error_));
      if (isChrome) expect(error.message).toContain(EXPECTED_SSL_CERT_MESSAGE);
      else expect(error.message).toContain('SSL_ERROR_UNKNOWN');

      expect(requests.length).toBe(2);
      expect(requests[0]).toBe('request');
      expect(requests[1]).toBe('requestfailed');
    });
    it('should fail when navigating to bad SSL after redirects', async () => {
      const { page, server, httpsServer, isChrome } = getTestState();

      server.setRedirect('/redirect/1.html', '/redirect/2.html');
      server.setRedirect('/redirect/2.html', '/empty.html');
      let error = null;
      await page
        .goto(httpsServer.PREFIX + '/redirect/1.html')
        .catch((error_) => (error = error_));
      if (isChrome) expect(error.message).toContain(EXPECTED_SSL_CERT_MESSAGE);
      else expect(error.message).toContain('SSL_ERROR_UNKNOWN');
    });
    it('should throw if networkidle is passed as an option', async () => {
      const { page, server } = getTestState();

      let error = null;
      await page
        // @ts-expect-error purposefully passing an old option
        .goto(server.EMPTY_PAGE, { waitUntil: 'networkidle' })
        .catch((error_) => (error = error_));
      expect(error.message).toContain(
        '"networkidle" option is no longer supported'
      );
    });
    it('should fail when main resources failed to load', async () => {
      const { page, isChrome } = getTestState();

      let error = null;
      await page
        .goto('http://localhost:44123/non-existing-url')
        .catch((error_) => (error = error_));
      if (isChrome)
        expect(error.message).toContain('net::ERR_CONNECTION_REFUSED');
      else expect(error.message).toContain('NS_ERROR_CONNECTION_REFUSED');
    });
    it('should fail when exceeding maximum navigation timeout', async () => {
      const { page, server, puppeteer } = getTestState();

      // Hang for request to the empty.html
      server.setRoute('/empty.html', () => {});
      let error = null;
      await page
        .goto(server.PREFIX + '/empty.html', { timeout: 1 })
        .catch((error_) => (error = error_));
      expect(error.message).toContain('Navigation timeout of 1 ms exceeded');
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should fail when exceeding default maximum navigation timeout', async () => {
      const { page, server, puppeteer } = getTestState();

      // Hang for request to the empty.html
      server.setRoute('/empty.html', () => {});
      let error = null;
      page.setDefaultNavigationTimeout(1);
      await page
        .goto(server.PREFIX + '/empty.html')
        .catch((error_) => (error = error_));
      expect(error.message).toContain('Navigation timeout of 1 ms exceeded');
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should fail when exceeding default maximum timeout', async () => {
      const { page, server, puppeteer } = getTestState();

      // Hang for request to the empty.html
      server.setRoute('/empty.html', () => {});
      let error = null;
      page.setDefaultTimeout(1);
      await page
        .goto(server.PREFIX + '/empty.html')
        .catch((error_) => (error = error_));
      expect(error.message).toContain('Navigation timeout of 1 ms exceeded');
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should prioritize default navigation timeout over default timeout', async () => {
      const { page, server, puppeteer } = getTestState();

      // Hang for request to the empty.html
      server.setRoute('/empty.html', () => {});
      let error = null;
      page.setDefaultTimeout(0);
      page.setDefaultNavigationTimeout(1);
      await page
        .goto(server.PREFIX + '/empty.html')
        .catch((error_) => (error = error_));
      expect(error.message).toContain('Navigation timeout of 1 ms exceeded');
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
    it('should disable timeout when its set to 0', async () => {
      const { page, server } = getTestState();

      let error = null;
      let loaded = false;
      page.once('load', () => (loaded = true));
      await page
        .goto(server.PREFIX + '/grid.html', { timeout: 0, waitUntil: ['load'] })
        .catch((error_) => (error = error_));
      expect(error).toBe(null);
      expect(loaded).toBe(true);
    });
    it('should work when navigating to valid url', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
    });
    itFailsFirefox('should work when navigating to data url', async () => {
      const { page } = getTestState();

      const response = await page.goto('data:text/html,hello');
      expect(response.ok()).toBe(true);
    });
    it('should work when navigating to 404', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.PREFIX + '/not-found');
      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(404);
    });
    it('should return last response in redirect chain', async () => {
      const { page, server } = getTestState();

      server.setRedirect('/redirect/1.html', '/redirect/2.html');
      server.setRedirect('/redirect/2.html', '/redirect/3.html');
      server.setRedirect('/redirect/3.html', server.EMPTY_PAGE);
      const response = await page.goto(server.PREFIX + '/redirect/1.html');
      expect(response.ok()).toBe(true);
      expect(response.url()).toBe(server.EMPTY_PAGE);
    });
    itFailsFirefox(
      'should wait for network idle to succeed navigation',
      async () => {
        const { page, server } = getTestState();

        let responses = [];
        // Hold on to a bunch of requests without answering.
        server.setRoute('/fetch-request-a.js', (req, res) =>
          responses.push(res)
        );
        server.setRoute('/fetch-request-b.js', (req, res) =>
          responses.push(res)
        );
        server.setRoute('/fetch-request-c.js', (req, res) =>
          responses.push(res)
        );
        server.setRoute('/fetch-request-d.js', (req, res) =>
          responses.push(res)
        );
        const initialFetchResourcesRequested = Promise.all([
          server.waitForRequest('/fetch-request-a.js'),
          server.waitForRequest('/fetch-request-b.js'),
          server.waitForRequest('/fetch-request-c.js'),
        ]);
        const secondFetchResourceRequested = server.waitForRequest(
          '/fetch-request-d.js'
        );

        // Navigate to a page which loads immediately and then does a bunch of
        // requests via javascript's fetch method.
        const navigationPromise = page.goto(
          server.PREFIX + '/networkidle.html',
          {
            waitUntil: 'networkidle0',
          }
        );
        // Track when the navigation gets completed.
        let navigationFinished = false;
        navigationPromise.then(() => (navigationFinished = true));

        // Wait for the page's 'load' event.
        await new Promise((fulfill) => page.once('load', fulfill));
        expect(navigationFinished).toBe(false);

        // Wait for the initial three resources to be requested.
        await initialFetchResourcesRequested;

        // Expect navigation still to be not finished.
        expect(navigationFinished).toBe(false);

        // Respond to initial requests.
        for (const response of responses) {
          response.statusCode = 404;
          response.end(`File not found`);
        }

        // Reset responses array
        responses = [];

        // Wait for the second round to be requested.
        await secondFetchResourceRequested;
        // Expect navigation still to be not finished.
        expect(navigationFinished).toBe(false);

        // Respond to requests.
        for (const response of responses) {
          response.statusCode = 404;
          response.end(`File not found`);
        }

        const response = await navigationPromise;
        // Expect navigation to succeed.
        expect(response.ok()).toBe(true);
      }
    );
    it('should not leak listeners during navigation', async () => {
      const { page, server } = getTestState();

      let warning = null;
      const warningHandler = (w) => (warning = w);
      process.on('warning', warningHandler);
      for (let i = 0; i < 20; ++i) await page.goto(server.EMPTY_PAGE);
      process.removeListener('warning', warningHandler);
      expect(warning).toBe(null);
    });
    it('should not leak listeners during bad navigation', async () => {
      const { page } = getTestState();

      let warning = null;
      const warningHandler = (w) => (warning = w);
      process.on('warning', warningHandler);
      for (let i = 0; i < 20; ++i)
        await page.goto('asdf').catch(() => {
          /* swallow navigation error */
        });
      process.removeListener('warning', warningHandler);
      expect(warning).toBe(null);
    });
    it('should not leak listeners during navigation of 11 pages', async () => {
      const { context, server } = getTestState();

      let warning = null;
      const warningHandler = (w) => (warning = w);
      process.on('warning', warningHandler);
      await Promise.all(
        [...Array(20)].map(async () => {
          const page = await context.newPage();
          await page.goto(server.EMPTY_PAGE);
          await page.close();
        })
      );
      process.removeListener('warning', warningHandler);
      expect(warning).toBe(null);
    });
    itFailsFirefox(
      'should navigate to dataURL and fire dataURL requests',
      async () => {
        const { page } = getTestState();

        const requests = [];
        page.on(
          'request',
          (request) => !utils.isFavicon(request) && requests.push(request)
        );
        const dataURL = 'data:text/html,<div>yo</div>';
        const response = await page.goto(dataURL);
        expect(response.status()).toBe(200);
        expect(requests.length).toBe(1);
        expect(requests[0].url()).toBe(dataURL);
      }
    );
    itFailsFirefox(
      'should navigate to URL with hash and fire requests without hash',
      async () => {
        const { page, server } = getTestState();

        const requests = [];
        page.on(
          'request',
          (request) => !utils.isFavicon(request) && requests.push(request)
        );
        const response = await page.goto(server.EMPTY_PAGE + '#hash');
        expect(response.status()).toBe(200);
        expect(response.url()).toBe(server.EMPTY_PAGE);
        expect(requests.length).toBe(1);
        expect(requests[0].url()).toBe(server.EMPTY_PAGE);
      }
    );
    it('should work with self requesting page', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.PREFIX + '/self-request.html');
      expect(response.status()).toBe(200);
      expect(response.url()).toContain('self-request.html');
    });
    it('should fail when navigating and show the url at the error message', async () => {
      const { page, httpsServer } = getTestState();

      const url = httpsServer.PREFIX + '/redirect/1.html';
      let error = null;
      try {
        await page.goto(url);
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toContain(url);
    });
    itFailsFirefox('should send referer', async () => {
      const { page, server } = getTestState();

      const [request1, request2] = await Promise.all([
        server.waitForRequest('/grid.html'),
        server.waitForRequest('/digits/1.png'),
        page.goto(server.PREFIX + '/grid.html', {
          referer: 'http://google.com/',
        }),
      ]);
      expect(request1.headers['referer']).toBe('http://google.com/');
      // Make sure subresources do not inherit referer.
      expect(request2.headers['referer']).toBe(server.PREFIX + '/grid.html');
    });
  });

  describe('Page.waitForNavigation', function () {
    itFailsFirefox('should work', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.evaluate(
          (url: string) => (window.location.href = url),
          server.PREFIX + '/grid.html'
        ),
      ]);
      expect(response.ok()).toBe(true);
      expect(response.url()).toContain('grid.html');
    });
    it('should work with both domcontentloaded and load', async () => {
      const { page, server } = getTestState();

      let response = null;
      server.setRoute('/one-style.css', (req, res) => (response = res));
      const navigationPromise = page.goto(server.PREFIX + '/one-style.html');
      const domContentLoadedPromise = page.waitForNavigation({
        waitUntil: 'domcontentloaded',
      });

      let bothFired = false;
      const bothFiredPromise = page
        .waitForNavigation({
          waitUntil: ['load', 'domcontentloaded'],
        })
        .then(() => (bothFired = true));

      await server.waitForRequest('/one-style.css');
      await domContentLoadedPromise;
      expect(bothFired).toBe(false);
      response.end();
      await bothFiredPromise;
      await navigationPromise;
    });
    itFailsFirefox('should work with clicking on anchor links', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`<a href='#foobar'>foobar</a>`);
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.click('a'),
      ]);
      expect(response).toBe(null);
      expect(page.url()).toBe(server.EMPTY_PAGE + '#foobar');
    });
    itFailsFirefox('should work with history.pushState()', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`
        <a onclick='javascript:pushState()'>SPA</a>
        <script>
          function pushState() { history.pushState({}, '', 'wow.html') }
        </script>
      `);
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.click('a'),
      ]);
      expect(response).toBe(null);
      expect(page.url()).toBe(server.PREFIX + '/wow.html');
    });
    itFailsFirefox('should work with history.replaceState()', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`
        <a onclick='javascript:replaceState()'>SPA</a>
        <script>
          function replaceState() { history.replaceState({}, '', '/replaced.html') }
        </script>
      `);
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.click('a'),
      ]);
      expect(response).toBe(null);
      expect(page.url()).toBe(server.PREFIX + '/replaced.html');
    });
    itFailsFirefox(
      'should work with DOM history.back()/history.forward()',
      async () => {
        const { page, server } = getTestState();

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
        const [backResponse] = await Promise.all([
          page.waitForNavigation(),
          page.click('a#back'),
        ]);
        expect(backResponse).toBe(null);
        expect(page.url()).toBe(server.PREFIX + '/first.html');
        const [forwardResponse] = await Promise.all([
          page.waitForNavigation(),
          page.click('a#forward'),
        ]);
        expect(forwardResponse).toBe(null);
        expect(page.url()).toBe(server.PREFIX + '/second.html');
      }
    );
    itFailsFirefox(
      'should work when subframe issues window.stop()',
      async () => {
        const { page, server } = getTestState();

        server.setRoute('/frames/style.css', () => {});
        const navigationPromise = page.goto(
          server.PREFIX + '/frames/one-frame.html'
        );
        const frame = await utils.waitEvent(page, 'frameattached');
        await new Promise<void>((fulfill) => {
          page.on('framenavigated', (f) => {
            if (f === frame) fulfill();
          });
        });
        await Promise.all([
          frame.evaluate(() => window.stop()),
          navigationPromise,
        ]);
      }
    );
  });

  describe('Page.goBack', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.goto(server.PREFIX + '/grid.html');

      let response = await page.goBack();
      expect(response.ok()).toBe(true);
      expect(response.url()).toContain(server.EMPTY_PAGE);

      response = await page.goForward();
      expect(response.ok()).toBe(true);
      expect(response.url()).toContain('/grid.html');

      response = await page.goForward();
      expect(response).toBe(null);
    });
    itFailsFirefox('should work with HistoryAPI', async () => {
      const { page, server } = getTestState();

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

  describeFailsFirefox('Frame.goto', function () {
    it('should navigate subframes', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/frames/one-frame.html');
      expect(page.frames()[0].url()).toContain('/frames/one-frame.html');
      expect(page.frames()[1].url()).toContain('/frames/frame.html');

      const response = await page.frames()[1].goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
      expect(response.frame()).toBe(page.frames()[1]);
    });
    it('should reject when frame detaches', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/frames/one-frame.html');

      server.setRoute('/empty.html', () => {});
      const navigationPromise = page
        .frames()[1]
        .goto(server.EMPTY_PAGE)
        .catch((error_) => error_);
      await server.waitForRequest('/empty.html');

      await page.$eval('iframe', (frame) => frame.remove());
      const error = await navigationPromise;
      expect(error.message).toBe('Navigating frame was detached');
    });
    it('should return matching responses', async () => {
      const { page, server } = getTestState();

      // Disable cache: otherwise, chromium will cache similar requests.
      await page.setCacheEnabled(false);
      await page.goto(server.EMPTY_PAGE);
      // Attach three frames.
      const frames = await Promise.all([
        utils.attachFrame(page, 'frame1', server.EMPTY_PAGE),
        utils.attachFrame(page, 'frame2', server.EMPTY_PAGE),
        utils.attachFrame(page, 'frame3', server.EMPTY_PAGE),
      ]);
      // Navigate all frames to the same URL.
      const serverResponses = [];
      server.setRoute('/one-style.html', (req, res) =>
        serverResponses.push(res)
      );
      const navigations = [];
      for (let i = 0; i < 3; ++i) {
        navigations.push(frames[i].goto(server.PREFIX + '/one-style.html'));
        await server.waitForRequest('/one-style.html');
      }
      // Respond from server out-of-order.
      const serverResponseTexts = ['AAA', 'BBB', 'CCC'];
      for (const i of [1, 2, 0]) {
        serverResponses[i].end(serverResponseTexts[i]);
        const response = await navigations[i];
        expect(response.frame()).toBe(frames[i]);
        expect(await response.text()).toBe(serverResponseTexts[i]);
      }
    });
  });

  describeFailsFirefox('Frame.waitForNavigation', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/frames/one-frame.html');
      const frame = page.frames()[1];
      const [response] = await Promise.all([
        frame.waitForNavigation(),
        frame.evaluate(
          (url: string) => (window.location.href = url),
          server.PREFIX + '/grid.html'
        ),
      ]);
      expect(response.ok()).toBe(true);
      expect(response.url()).toContain('grid.html');
      expect(response.frame()).toBe(frame);
      expect(page.url()).toContain('/frames/one-frame.html');
    });
    it('should fail when frame detaches', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/frames/one-frame.html');
      const frame = page.frames()[1];

      server.setRoute('/empty.html', () => {});
      let error = null;
      const navigationPromise = frame
        .waitForNavigation()
        .catch((error_) => (error = error_));
      await Promise.all([
        server.waitForRequest('/empty.html'),
        frame.evaluate(() => ((window as any).location = '/empty.html')),
      ]);
      await page.$eval('iframe', (frame) => frame.remove());
      await navigationPromise;
      expect(error.message).toBe('Navigating frame was detached');
    });
  });

  describe('Page.reload', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => (globalThis._foo = 10));
      await page.reload();
      expect(await page.evaluate(() => globalThis._foo)).toBe(undefined);
    });
  });
});
