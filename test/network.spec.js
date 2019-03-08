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
const path = require('path');
const utils = require('./utils');

module.exports.addTests = function({testRunner, expect, CHROME}) {
  const {describe, xdescribe, fdescribe, describe_fails_ffox} = testRunner;
  const {it, fit, xit, it_fails_ffox} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Page.Events.Request', function() {
    it('should fire for navigation requests', async({page, server}) => {
      const requests = [];
      page.on('request', request => !utils.isFavicon(request) && requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
    });
    it('should fire for iframes', async({page, server}) => {
      const requests = [];
      page.on('request', request => !utils.isFavicon(request) && requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(requests.length).toBe(2);
    });
    it('should fire for fetches', async({page, server}) => {
      const requests = [];
      page.on('request', request => !utils.isFavicon(request) && requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => fetch('/empty.html'));
      expect(requests.length).toBe(2);
    });
  });

  describe('Request.frame', function() {
    it('should work for main frame navigation request', async({page, server}) => {
      const requests = [];
      page.on('request', request => !utils.isFavicon(request) && requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].frame()).toBe(page.mainFrame());
    });
    it('should work for subframe navigation request', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const requests = [];
      page.on('request', request => !utils.isFavicon(request) && requests.push(request));
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].frame()).toBe(page.frames()[1]);
    });
    it('should work for fetch requests', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      let requests = [];
      page.on('request', request => !utils.isFavicon(request) && requests.push(request));
      await page.evaluate(() => fetch('/digits/1.png'));
      requests = requests.filter(request => !request.url().includes('favicon'));
      expect(requests.length).toBe(1);
      expect(requests[0].frame()).toBe(page.mainFrame());
    });
  });

  describe('Request.headers', function() {
    it('should work', async({page, server}) => {
      const response = await page.goto(server.EMPTY_PAGE);
      if (CHROME)
        expect(response.request().headers()['user-agent']).toContain('Chrome');
      else
        expect(response.request().headers()['user-agent']).toContain('Firefox');
    });
  });

  describe('Response.headers', function() {
    it('should work', async({page, server}) => {
      server.setRoute('/empty.html', (req, res) => {
        res.setHeader('foo', 'bar');
        res.end();
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.headers()['foo']).toBe('bar');
    });
  });

  describe_fails_ffox('Response.fromCache', function() {
    it('should return |false| for non-cached content', async({page, server}) => {
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.fromCache()).toBe(false);
    });

    it('should work', async({page, server}) => {
      const responses = new Map();
      page.on('response', r => !utils.isFavicon(r.request()) && responses.set(r.url().split('/').pop(), r));

      // Load and re-load to make sure it's cached.
      await page.goto(server.PREFIX + '/cached/one-style.html');
      await page.reload();

      expect(responses.size).toBe(2);
      expect(responses.get('one-style.css').status()).toBe(200);
      expect(responses.get('one-style.css').fromCache()).toBe(true);
      expect(responses.get('one-style.html').status()).toBe(304);
      expect(responses.get('one-style.html').fromCache()).toBe(false);
    });
  });

  describe_fails_ffox('Response.fromServiceWorker', function() {
    it('should return |false| for non-service-worker content', async({page, server}) => {
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.fromServiceWorker()).toBe(false);
    });

    it('Response.fromServiceWorker', async({page, server}) => {
      const responses = new Map();
      page.on('response', r => responses.set(r.url().split('/').pop(), r));

      // Load and re-load to make sure serviceworker is installed and running.
      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html', {waitUntil: 'networkidle2'});
      await page.evaluate(async() => await window.activationPromise);
      await page.reload();

      expect(responses.size).toBe(2);
      expect(responses.get('sw.html').status()).toBe(200);
      expect(responses.get('sw.html').fromServiceWorker()).toBe(true);
      expect(responses.get('style.css').status()).toBe(200);
      expect(responses.get('style.css').fromServiceWorker()).toBe(true);
    });
  });

  describe('Request.postData', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      server.setRoute('/post', (req, res) => res.end());
      let request = null;
      page.on('request', r => request = r);
      await page.evaluate(() => fetch('./post', { method: 'POST', body: JSON.stringify({foo: 'bar'})}));
      expect(request).toBeTruthy();
      expect(request.postData()).toBe('{"foo":"bar"}');
    });
    it('should be |undefined| when there is no post data', async({page, server}) => {
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.request().postData()).toBe(undefined);
    });
  });

  describe('Response.text', function() {
    it('should work', async({page, server}) => {
      const response = await page.goto(server.PREFIX + '/simple.json');
      expect(await response.text()).toBe('{"foo": "bar"}\n');
    });
    it('should return uncompressed text', async({page, server}) => {
      server.enableGzip('/simple.json');
      const response = await page.goto(server.PREFIX + '/simple.json');
      expect(response.headers()['content-encoding']).toBe('gzip');
      expect(await response.text()).toBe('{"foo": "bar"}\n');
    });
    it('should throw when requesting body of redirected response', async({page, server}) => {
      server.setRedirect('/foo.html', '/empty.html');
      const response = await page.goto(server.PREFIX + '/foo.html');
      const redirectChain = response.request().redirectChain();
      expect(redirectChain.length).toBe(1);
      const redirected = redirectChain[0].response();
      expect(redirected.status()).toBe(302);
      let error = null;
      await redirected.text().catch(e => error = e);
      expect(error.message).toContain('Response body is unavailable for redirect responses');
    });
    it('should wait until response completes', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      // Setup server to trap request.
      let serverResponse = null;
      server.setRoute('/get', (req, res) => {
        serverResponse = res;
        // In Firefox, |fetch| will be hanging until it receives |Content-Type| header
        // from server.
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.write('hello ');
      });
      // Setup page to trap response.
      let requestFinished = false;
      page.on('requestfinished', r => requestFinished = requestFinished || r.url().includes('/get'));
      // send request and wait for server response
      const [pageResponse] = await Promise.all([
        page.waitForResponse(r => !utils.isFavicon(r.request())),
        page.evaluate(() => fetch('./get', { method: 'GET'})),
        server.waitForRequest('/get'),
      ]);

      expect(serverResponse).toBeTruthy();
      expect(pageResponse).toBeTruthy();
      expect(pageResponse.status()).toBe(200);
      expect(requestFinished).toBe(false);

      const responseText = pageResponse.text();
      // Write part of the response and wait for it to be flushed.
      await new Promise(x => serverResponse.write('wor', x));
      // Finish response.
      await new Promise(x => serverResponse.end('ld!', x));
      expect(await responseText).toBe('hello world!');
    });
  });

  describe('Response.json', function() {
    it('should work', async({page, server}) => {
      const response = await page.goto(server.PREFIX + '/simple.json');
      expect(await response.json()).toEqual({foo: 'bar'});
    });
  });

  describe('Response.buffer', function() {
    it('should work', async({page, server}) => {
      const response = await page.goto(server.PREFIX + '/pptr.png');
      const imageBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'pptr.png'));
      const responseBuffer = await response.buffer();
      expect(responseBuffer.equals(imageBuffer)).toBe(true);
    });
    it('should work with compression', async({page, server}) => {
      server.enableGzip('/pptr.png');
      const response = await page.goto(server.PREFIX + '/pptr.png');
      const imageBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'pptr.png'));
      const responseBuffer = await response.buffer();
      expect(responseBuffer.equals(imageBuffer)).toBe(true);
    });
  });

  describe('Response.statusText', function() {
    it('should work', async({page, server}) => {
      server.setRoute('/cool', (req, res) => {
        res.writeHead(200, 'cool!');
        res.end();
      });
      const response = await page.goto(server.PREFIX + '/cool');
      expect(response.statusText()).toBe('cool!');
    });
  });

  describe('Network Events', function() {
    it('Page.Events.Request', async({page, server}) => {
      const requests = [];
      page.on('request', request => requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
      expect(requests[0].resourceType()).toBe('document');
      expect(requests[0].method()).toBe('GET');
      expect(requests[0].response()).toBeTruthy();
      expect(requests[0].frame() === page.mainFrame()).toBe(true);
      expect(requests[0].frame().url()).toBe(server.EMPTY_PAGE);
    });
    it('Page.Events.Response', async({page, server}) => {
      const responses = [];
      page.on('response', response => responses.push(response));
      await page.goto(server.EMPTY_PAGE);
      expect(responses.length).toBe(1);
      expect(responses[0].url()).toBe(server.EMPTY_PAGE);
      expect(responses[0].status()).toBe(200);
      expect(responses[0].ok()).toBe(true);
      expect(responses[0].request()).toBeTruthy();
      const remoteAddress = responses[0].remoteAddress();
      // Either IPv6 or IPv4, depending on environment.
      expect(remoteAddress.ip.includes('::1') || remoteAddress.ip === '127.0.0.1').toBe(true);
      expect(remoteAddress.port).toBe(server.PORT);
    });

    it('Page.Events.RequestFailed', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().endsWith('css'))
          request.abort();
        else
          request.continue();
      });
      const failedRequests = [];
      page.on('requestfailed', request => failedRequests.push(request));
      await page.goto(server.PREFIX + '/one-style.html');
      expect(failedRequests.length).toBe(1);
      expect(failedRequests[0].url()).toContain('one-style.css');
      expect(failedRequests[0].response()).toBe(null);
      expect(failedRequests[0].resourceType()).toBe('stylesheet');
      if (CHROME)
        expect(failedRequests[0].failure().errorText).toBe('net::ERR_FAILED');
      else
        expect(failedRequests[0].failure().errorText).toBe('NS_ERROR_FAILURE');
      expect(failedRequests[0].frame()).toBeTruthy();
    });
    it('Page.Events.RequestFinished', async({page, server}) => {
      const requests = [];
      page.on('requestfinished', request => requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
      expect(requests[0].response()).toBeTruthy();
      expect(requests[0].frame() === page.mainFrame()).toBe(true);
      expect(requests[0].frame().url()).toBe(server.EMPTY_PAGE);
    });
    it('should fire events in proper order', async({page, server}) => {
      const events = [];
      page.on('request', request => events.push('request'));
      page.on('response', response => events.push('response'));
      page.on('requestfinished', request => events.push('requestfinished'));
      await page.goto(server.EMPTY_PAGE);
      expect(events).toEqual(['request', 'response', 'requestfinished']);
    });
    it('should support redirects', async({page, server}) => {
      const events = [];
      page.on('request', request => events.push(`${request.method()} ${request.url()}`));
      page.on('response', response => events.push(`${response.status()} ${response.url()}`));
      page.on('requestfinished', request => events.push(`DONE ${request.url()}`));
      page.on('requestfailed', request => events.push(`FAIL ${request.url()}`));
      server.setRedirect('/foo.html', '/empty.html');
      const FOO_URL = server.PREFIX + '/foo.html';
      const response = await page.goto(FOO_URL);
      expect(events).toEqual([
        `GET ${FOO_URL}`,
        `302 ${FOO_URL}`,
        `DONE ${FOO_URL}`,
        `GET ${server.EMPTY_PAGE}`,
        `200 ${server.EMPTY_PAGE}`,
        `DONE ${server.EMPTY_PAGE}`
      ]);

      // Check redirect chain
      const redirectChain = response.request().redirectChain();
      expect(redirectChain.length).toBe(1);
      expect(redirectChain[0].url()).toContain('/foo.html');
      expect(redirectChain[0].response().remoteAddress().port).toBe(server.PORT);
    });
  });

  describe('Request.isNavigationRequest', () => {
    it('should work', async({page, server}) => {
      const requests = new Map();
      page.on('request', request => requests.set(request.url().split('/').pop(), request));
      server.setRedirect('/rrredirect', '/frames/one-frame.html');
      await page.goto(server.PREFIX + '/rrredirect');
      expect(requests.get('rrredirect').isNavigationRequest()).toBe(true);
      expect(requests.get('one-frame.html').isNavigationRequest()).toBe(true);
      expect(requests.get('frame.html').isNavigationRequest()).toBe(true);
      expect(requests.get('script.js').isNavigationRequest()).toBe(false);
      expect(requests.get('style.css').isNavigationRequest()).toBe(false);
    });
    it('should work with request interception', async({page, server}) => {
      const requests = new Map();
      page.on('request', request => {
        requests.set(request.url().split('/').pop(), request);
        request.continue();
      });
      await page.setRequestInterception(true);
      server.setRedirect('/rrredirect', '/frames/one-frame.html');
      await page.goto(server.PREFIX + '/rrredirect');
      expect(requests.get('rrredirect').isNavigationRequest()).toBe(true);
      expect(requests.get('one-frame.html').isNavigationRequest()).toBe(true);
      expect(requests.get('frame.html').isNavigationRequest()).toBe(true);
      expect(requests.get('script.js').isNavigationRequest()).toBe(false);
      expect(requests.get('style.css').isNavigationRequest()).toBe(false);
    });
    it('should work when navigating to image', async({page, server}) => {
      const requests = [];
      page.on('request', request => requests.push(request));
      await page.goto(server.PREFIX + '/pptr.png');
      expect(requests[0].isNavigationRequest()).toBe(true);
    });
  });

  describe('Page.setRequestInterception', function() {
    it('should intercept', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (utils.isFavicon(request)) {
          request.continue();
          return;
        }
        expect(request.url()).toContain('empty.html');
        expect(request.headers()['user-agent']).toBeTruthy();
        expect(request.method()).toBe('GET');
        expect(request.postData()).toBe(undefined);
        expect(request.isNavigationRequest()).toBe(true);
        expect(request.resourceType()).toBe('document');
        expect(request.frame() === page.mainFrame()).toBe(true);
        expect(request.frame().url()).toBe('about:blank');
        request.continue();
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
      expect(response.remoteAddress().port).toBe(server.PORT);
    });
    it('should work when POST is redirected with 302', async({page, server}) => {
      server.setRedirect('/rredirect', '/empty.html');
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      await page.setContent(`
        <form action='/rredirect' method='post'>
          <input type="hidden" id="foo" name="foo" value="FOOBAR">
        </form>
      `);
      await Promise.all([
        page.$eval('form', form => form.submit()),
        page.waitForNavigation()
      ]);
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/3973
    xit('should work when header manipulation headers with redirect', async({page, server}) => {
      server.setRedirect('/rrredirect', '/empty.html');
      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers(), {
          foo: 'bar'
        });
        request.continue({ headers });
      });
      await page.goto(server.PREFIX + '/rrredirect');
    });
    it('should contain referer header', async({page, server}) => {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        if (!utils.isFavicon(request))
          requests.push(request);
        request.continue();
      });
      await page.goto(server.PREFIX + '/one-style.html');
      expect(requests[1].url()).toContain('/one-style.css');
      expect(requests[1].headers().referer).toContain('/one-style.html');
    });
    it('should properly return navigation response when URL has cookies', async({page, server}) => {
      // Setup cookie.
      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({ name: 'foo', value: 'bar'});

      // Setup request interception.
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      const response = await page.reload();
      expect(response.status()).toBe(200);
    });
    it('should stop intercepting', async({page, server}) => {
      await page.setRequestInterception(true);
      page.once('request', request => request.continue());
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(false);
      await page.goto(server.EMPTY_PAGE);
    });
    it('should show custom HTTP headers', async({page, server}) => {
      await page.setExtraHTTPHeaders({
        foo: 'bar'
      });
      await page.setRequestInterception(true);
      page.on('request', request => {
        expect(request.headers()['foo']).toBe('bar');
        request.continue();
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
    });
    it('should works with customizing referer headers', async({page, server}) => {
      await page.setExtraHTTPHeaders({ 'referer': server.EMPTY_PAGE });
      await page.setRequestInterception(true);
      page.on('request', request => {
        expect(request.headers()['referer']).toBe(server.EMPTY_PAGE);
        request.continue();
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
    });
    it('should be abortable', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().endsWith('.css'))
          request.abort();
        else
          request.continue();
      });
      let failedRequests = 0;
      page.on('requestfailed', event => ++failedRequests);
      const response = await page.goto(server.PREFIX + '/one-style.html');
      expect(response.ok()).toBe(true);
      expect(response.request().failure()).toBe(null);
      expect(failedRequests).toBe(1);
    });
    it_fails_ffox('should be abortable with custom error codes', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        request.abort('internetdisconnected');
      });
      let failedRequest = null;
      page.on('requestfailed', request => failedRequest = request);
      await page.goto(server.EMPTY_PAGE).catch(e => {});
      expect(failedRequest).toBeTruthy();
      expect(failedRequest.failure().errorText).toBe('net::ERR_INTERNET_DISCONNECTED');
    });
    it('should send referer', async({page, server}) => {
      await page.setExtraHTTPHeaders({
        referer: 'http://google.com/'
      });
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      const [request] = await Promise.all([
        server.waitForRequest('/grid.html'),
        page.goto(server.PREFIX + '/grid.html'),
      ]);
      expect(request.headers['referer']).toBe('http://google.com/');
    });
    it('should fail navigation when aborting main resource', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => request.abort());
      let error = null;
      await page.goto(server.EMPTY_PAGE).catch(e => error = e);
      expect(error).toBeTruthy();
      if (CHROME)
        expect(error.message).toContain('net::ERR_FAILED');
      else
        expect(error.message).toContain('NS_ERROR_FAILURE');
    });
    it('should work with redirects', async({page, server}) => {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        request.continue();
        requests.push(request);
      });
      server.setRedirect('/non-existing-page.html', '/non-existing-page-2.html');
      server.setRedirect('/non-existing-page-2.html', '/non-existing-page-3.html');
      server.setRedirect('/non-existing-page-3.html', '/non-existing-page-4.html');
      server.setRedirect('/non-existing-page-4.html', '/empty.html');
      const response = await page.goto(server.PREFIX + '/non-existing-page.html');
      expect(response.status()).toBe(200);
      expect(response.url()).toContain('empty.html');
      expect(requests.length).toBe(5);
      expect(requests[2].resourceType()).toBe('document');
      // Check redirect chain
      const redirectChain = response.request().redirectChain();
      expect(redirectChain.length).toBe(4);
      expect(redirectChain[0].url()).toContain('/non-existing-page.html');
      expect(redirectChain[2].url()).toContain('/non-existing-page-3.html');
      for (let i = 0; i < redirectChain.length; ++i) {
        const request = redirectChain[i];
        expect(request.isNavigationRequest()).toBe(true);
        expect(request.redirectChain().indexOf(request)).toBe(i);
      }
    });
    it('should work with redirects for subresources', async({page, server}) => {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        request.continue();
        if (!utils.isFavicon(request))
          requests.push(request);
      });
      server.setRedirect('/one-style.css', '/two-style.css');
      server.setRedirect('/two-style.css', '/three-style.css');
      server.setRedirect('/three-style.css', '/four-style.css');
      server.setRoute('/four-style.css', (req, res) => res.end('body {box-sizing: border-box; }'));

      const response = await page.goto(server.PREFIX + '/one-style.html');
      expect(response.status()).toBe(200);
      expect(response.url()).toContain('one-style.html');
      expect(requests.length).toBe(5);
      expect(requests[0].resourceType()).toBe('document');
      expect(requests[1].resourceType()).toBe('stylesheet');
      // Check redirect chain
      const redirectChain = requests[1].redirectChain();
      expect(redirectChain.length).toBe(3);
      expect(redirectChain[0].url()).toContain('/one-style.css');
      expect(redirectChain[2].url()).toContain('/three-style.css');
    });
    it('should be able to abort redirects', async({page, server}) => {
      await page.setRequestInterception(true);
      server.setRedirect('/non-existing.json', '/non-existing-2.json');
      server.setRedirect('/non-existing-2.json', '/simple.html');
      page.on('request', request => {
        if (request.url().includes('non-existing-2'))
          request.abort();
        else
          request.continue();
      });
      await page.goto(server.EMPTY_PAGE);
      const result = await page.evaluate(async() => {
        try {
          await fetch('/non-existing.json');
        } catch (e) {
          return e.message;
        }
      });
      if (CHROME)
        expect(result).toContain('Failed to fetch');
      else
        expect(result).toContain('NetworkError');
    });
    it('should work with equal requests', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      let responseCount = 1;
      server.setRoute('/zzz', (req, res) => res.end((responseCount++) * 11 + ''));
      await page.setRequestInterception(true);

      let spinner = false;
      // Cancel 2nd request.
      page.on('request', request => {
        if (utils.isFavicon(request)) {
          request.continue();
          return;
        }
        spinner ? request.abort() : request.continue();
        spinner = !spinner;
      });
      const results = await page.evaluate(() => Promise.all([
        fetch('/zzz').then(response => response.text()).catch(e => 'FAILED'),
        fetch('/zzz').then(response => response.text()).catch(e => 'FAILED'),
        fetch('/zzz').then(response => response.text()).catch(e => 'FAILED'),
      ]));
      expect(results).toEqual(['11', 'FAILED', '22']);
    });
    it_fails_ffox('should navigate to dataURL and fire dataURL requests', async({page, server}) => {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        requests.push(request);
        request.continue();
      });
      const dataURL = 'data:text/html,<div>yo</div>';
      const response = await page.goto(dataURL);
      expect(response.status()).toBe(200);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(dataURL);
    });
    it_fails_ffox('should navigate to URL with hash and and fire requests without hash', async({page, server}) => {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        requests.push(request);
        request.continue();
      });
      const response = await page.goto(server.EMPTY_PAGE + '#hash');
      expect(response.status()).toBe(200);
      expect(response.url()).toBe(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
    });
    it('should work with encoded server', async({page, server}) => {
      // The requestWillBeSent will report encoded URL, whereas interception will
      // report URL as-is. @see crbug.com/759388
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      const response = await page.goto(server.PREFIX + '/some nonexisting page');
      expect(response.status()).toBe(404);
    });
    it('should work with badly encoded server', async({page, server}) => {
      await page.setRequestInterception(true);
      server.setRoute('/malformed?rnd=%911', (req, res) => res.end());
      page.on('request', request => request.continue());
      const response = await page.goto(server.PREFIX + '/malformed?rnd=%911');
      expect(response.status()).toBe(200);
    });
    it_fails_ffox('should work with encoded server - 2', async({page, server}) => {
      // The requestWillBeSent will report URL as-is, whereas interception will
      // report encoded URL for stylesheet. @see crbug.com/759388
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        request.continue();
        requests.push(request);
      });
      const response = await page.goto(`data:text/html,<link rel="stylesheet" href="${server.PREFIX}/fonts?helvetica|arial"/>`);
      expect(response.status()).toBe(200);
      expect(requests.length).toBe(2);
      expect(requests[1].response().status()).toBe(404);
    });
    it_fails_ffox('should not throw "Invalid Interception Id" if the request was cancelled', async({page, server}) => {
      await page.setContent('<iframe></iframe>');
      await page.setRequestInterception(true);
      let request = null;
      page.on('request', async r => request = r);
      page.$eval('iframe', (frame, url) => frame.src = url, server.EMPTY_PAGE),
      // Wait for request interception.
      await utils.waitEvent(page, 'request');
      // Delete frame to cause request to be canceled.
      await page.$eval('iframe', frame => frame.remove());
      let error = null;
      await request.continue().catch(e => error = e);
      expect(error).toBe(null);
    });
    it('should throw if interception is not enabled', async({page, server}) => {
      let error = null;
      page.on('request', async request => {
        try {
          await request.continue();
        } catch (e) {
          error = e;
        }
      });
      await page.goto(server.EMPTY_PAGE);
      expect(error.message).toContain('Request Interception is not enabled');
    });
    it_fails_ffox('should work with file URLs', async({page, server}) => {
      await page.setRequestInterception(true);
      const urls = new Set();
      page.on('request', request => {
        urls.add(request.url().split('/').pop());
        request.continue();
      });
      await page.goto(pathToFileURL(path.join(__dirname, 'assets', 'one-style.html')));
      expect(urls.size).toBe(2);
      expect(urls.has('one-style.html')).toBe(true);
      expect(urls.has('one-style.css')).toBe(true);
    });
  });

  describe('Request.continue', function() {
    it('should work', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      await page.goto(server.EMPTY_PAGE);
    });
    it('should amend HTTP headers', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers());
        headers['FOO'] = 'bar';
        request.continue({ headers });
      });
      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => fetch('/sleep.zzz'))
      ]);
      expect(request.headers['foo']).toBe('bar');
    });
    it_fails_ffox('should redirect in a way non-observable to page', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        const redirectURL = request.url().includes('/empty.html') ? server.PREFIX + '/consolelog.html' : undefined;
        request.continue({ url: redirectURL });
      });
      let consoleMessage = null;
      page.on('console', msg => consoleMessage = msg);
      await page.goto(server.EMPTY_PAGE);
      expect(page.url()).toBe(server.EMPTY_PAGE);
      expect(consoleMessage.text()).toBe('yellow');
    });
    it_fails_ffox('should amend method', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.continue({ method: 'POST' });
      });
      const [request] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => fetch('/sleep.zzz'))
      ]);
      expect(request.method).toBe('POST');
    });
    it_fails_ffox('should amend post data', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.continue({ postData: 'doggo' });
      });
      const [serverRequest] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => fetch('/sleep.zzz', { method: 'POST', body: 'birdy' }))
      ]);
      expect(await serverRequest.postBody).toBe('doggo');
    });
  });

  describe_fails_ffox('Request.respond', function() {
    it('should work', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        request.respond({
          status: 201,
          headers: {
            foo: 'bar'
          },
          body: 'Yo, page!'
        });
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(201);
      expect(response.headers().foo).toBe('bar');
      expect(await page.evaluate(() => document.body.textContent)).toBe('Yo, page!');
    });
    it('should redirect', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (!request.url().includes('rrredirect')) {
          request.continue();
          return;
        }
        request.respond({
          status: 302,
          headers: {
            location: server.EMPTY_PAGE,
          },
        });
      });
      const response = await page.goto(server.PREFIX + '/rrredirect');
      expect(response.request().redirectChain().length).toBe(1);
      expect(response.request().redirectChain()[0].url()).toBe(server.PREFIX + '/rrredirect');
      expect(response.url()).toBe(server.EMPTY_PAGE);
    });
    it('should allow mocking binary responses', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        const imageBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'pptr.png'));
        request.respond({
          contentType: 'image/png',
          body: imageBuffer
        });
      });
      await page.evaluate(PREFIX => {
        const img = document.createElement('img');
        img.src = PREFIX + '/does-not-exist.png';
        document.body.appendChild(img);
        return new Promise(fulfill => img.onload = fulfill);
      }, server.PREFIX);
      const img = await page.$('img');
      expect(await img.screenshot()).toBeGolden('mock-binary-response.png');
    });
  });

  describe('Page.setExtraHTTPHeaders', function() {
    it('should work', async({page, server}) => {
      await page.setExtraHTTPHeaders({
        foo: 'bar'
      });
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      expect(request.headers['foo']).toBe('bar');
    });
    it('should throw for non-string header values', async({page, server}) => {
      let error = null;
      try {
        await page.setExtraHTTPHeaders({ 'foo': 1 });
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Expected value of header "foo" to be String, but "number" is found.');
    });
  });

  describe_fails_ffox('Page.authenticate', function() {
    it('should work', async({page, server}) => {
      server.setAuth('/empty.html', 'user', 'pass');
      let response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(401);
      await page.authenticate({
        username: 'user',
        password: 'pass'
      });
      response = await page.reload();
      expect(response.status()).toBe(200);
    });
    it('should fail if wrong credentials', async({page, server}) => {
      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user2', 'pass2');
      await page.authenticate({
        username: 'foo',
        password: 'bar'
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(401);
    });
    it('should allow disable authentication', async({page, server}) => {
      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user3', 'pass3');
      await page.authenticate({
        username: 'user3',
        password: 'pass3'
      });
      let response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(200);
      await page.authenticate(null);
      // Navigate to a different origin to bust Chrome's credential caching.
      response = await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      expect(response.status()).toBe(401);
    });
  });
};

/**
 * @param {string} path
 * @return {string}
 */
function pathToFileURL(path) {
  let pathName = path.replace(/\\/g, '/');
  // Windows drive letter must be prefixed with a slash.
  if (!pathName.startsWith('/'))
    pathName = '/' + pathName;
  return 'file://' + pathName;
}
