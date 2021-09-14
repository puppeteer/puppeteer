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

import fs from 'fs';
import path from 'path';
import utils from './utils.js';
import expect from 'expect';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  itFailsFirefox,
  describeFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions

describe('network', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('Page.Events.Request', function () {
    it('should fire for navigation requests', async () => {
      const { page, server } = getTestState();

      const requests = [];
      page.on(
        'request',
        (request) => !utils.isFavicon(request) && requests.push(request)
      );
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
    });
    it('should fire for iframes', async () => {
      const { page, server } = getTestState();

      const requests = [];
      page.on(
        'request',
        (request) => !utils.isFavicon(request) && requests.push(request)
      );
      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(requests.length).toBe(2);
    });
    it('should fire for fetches', async () => {
      const { page, server } = getTestState();

      const requests = [];
      page.on(
        'request',
        (request) => !utils.isFavicon(request) && requests.push(request)
      );
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => fetch('/empty.html'));
      expect(requests.length).toBe(2);
    });
  });

  describe('Request.frame', function () {
    it('should work for main frame navigation request', async () => {
      const { page, server } = getTestState();

      const requests = [];
      page.on(
        'request',
        (request) => !utils.isFavicon(request) && requests.push(request)
      );
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].frame()).toBe(page.mainFrame());
    });
    itFailsFirefox('should work for subframe navigation request', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const requests = [];
      page.on(
        'request',
        (request) => !utils.isFavicon(request) && requests.push(request)
      );
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].frame()).toBe(page.frames()[1]);
    });
    it('should work for fetch requests', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      let requests = [];
      page.on(
        'request',
        (request) => !utils.isFavicon(request) && requests.push(request)
      );
      await page.evaluate(() => fetch('/digits/1.png'));
      requests = requests.filter(
        (request) => !request.url().includes('favicon')
      );
      expect(requests.length).toBe(1);
      expect(requests[0].frame()).toBe(page.mainFrame());
    });
  });

  describe('Request.headers', function () {
    it('should work', async () => {
      const { page, server, isChrome } = getTestState();

      const response = await page.goto(server.EMPTY_PAGE);
      if (isChrome)
        expect(response.request().headers()['user-agent']).toContain('Chrome');
      else
        expect(response.request().headers()['user-agent']).toContain('Firefox');
    });
  });

  describe('Response.headers', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      server.setRoute('/empty.html', (req, res) => {
        res.setHeader('foo', 'bar');
        res.end();
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.headers()['foo']).toBe('bar');
    });
  });

  describeFailsFirefox('Response.fromCache', function () {
    it('should return |false| for non-cached content', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.fromCache()).toBe(false);
    });

    it('should work', async () => {
      const { page, server } = getTestState();

      const responses = new Map();
      page.on(
        'response',
        (r) =>
          !utils.isFavicon(r.request()) &&
          responses.set(r.url().split('/').pop(), r)
      );

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

  describeFailsFirefox('Response.fromServiceWorker', function () {
    it('should return |false| for non-service-worker content', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.fromServiceWorker()).toBe(false);
    });

    it('Response.fromServiceWorker', async () => {
      const { page, server } = getTestState();

      const responses = new Map();
      page.on('response', (r) => responses.set(r.url().split('/').pop(), r));

      // Load and re-load to make sure serviceworker is installed and running.
      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html', {
        waitUntil: 'networkidle2',
      });
      await page.evaluate(async () => await globalThis.activationPromise);
      await page.reload();

      expect(responses.size).toBe(2);
      expect(responses.get('sw.html').status()).toBe(200);
      expect(responses.get('sw.html').fromServiceWorker()).toBe(true);
      expect(responses.get('style.css').status()).toBe(200);
      expect(responses.get('style.css').fromServiceWorker()).toBe(true);
    });
  });

  describeFailsFirefox('Request.postData', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      server.setRoute('/post', (req, res) => res.end());
      let request = null;
      page.on('request', (r) => (request = r));
      await page.evaluate(() =>
        fetch('./post', {
          method: 'POST',
          body: JSON.stringify({ foo: 'bar' }),
        })
      );
      expect(request).toBeTruthy();
      expect(request.postData()).toBe('{"foo":"bar"}');
    });
    it('should be |undefined| when there is no post data', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.request().postData()).toBe(undefined);
    });
  });

  describeFailsFirefox('Response.text', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.PREFIX + '/simple.json');
      const responseText = (await response.text()).trimEnd();
      expect(responseText).toBe('{"foo": "bar"}');
    });
    it('should return uncompressed text', async () => {
      const { page, server } = getTestState();

      server.enableGzip('/simple.json');
      const response = await page.goto(server.PREFIX + '/simple.json');
      expect(response.headers()['content-encoding']).toBe('gzip');
      const responseText = (await response.text()).trimEnd();
      expect(responseText).toBe('{"foo": "bar"}');
    });
    it('should throw when requesting body of redirected response', async () => {
      const { page, server } = getTestState();

      server.setRedirect('/foo.html', '/empty.html');
      const response = await page.goto(server.PREFIX + '/foo.html');
      const redirectChain = response.request().redirectChain();
      expect(redirectChain.length).toBe(1);
      const redirected = redirectChain[0].response();
      expect(redirected.status()).toBe(302);
      let error = null;
      await redirected.text().catch((error_) => (error = error_));
      expect(error.message).toContain(
        'Response body is unavailable for redirect responses'
      );
    });
    it('should wait until response completes', async () => {
      const { page, server } = getTestState();

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
      page.on(
        'requestfinished',
        (r) => (requestFinished = requestFinished || r.url().includes('/get'))
      );
      // send request and wait for server response
      const [pageResponse] = await Promise.all([
        page.waitForResponse((r) => !utils.isFavicon(r.request())),
        page.evaluate(() => fetch('./get', { method: 'GET' })),
        server.waitForRequest('/get'),
      ]);

      expect(serverResponse).toBeTruthy();
      expect(pageResponse).toBeTruthy();
      expect(pageResponse.status()).toBe(200);
      expect(requestFinished).toBe(false);

      const responseText = pageResponse.text();
      // Write part of the response and wait for it to be flushed.
      await new Promise((x) => serverResponse.write('wor', x));
      // Finish response.
      await new Promise((x) => serverResponse.end('ld!', x));
      expect(await responseText).toBe('hello world!');
    });
  });

  describeFailsFirefox('Response.json', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.PREFIX + '/simple.json');
      expect(await response.json()).toEqual({ foo: 'bar' });
    });
  });

  describeFailsFirefox('Response.buffer', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      const response = await page.goto(server.PREFIX + '/pptr.png');
      const imageBuffer = fs.readFileSync(
        path.join(__dirname, 'assets', 'pptr.png')
      );
      const responseBuffer = await response.buffer();
      expect(responseBuffer.equals(imageBuffer)).toBe(true);
    });
    it('should work with compression', async () => {
      const { page, server } = getTestState();

      server.enableGzip('/pptr.png');
      const response = await page.goto(server.PREFIX + '/pptr.png');
      const imageBuffer = fs.readFileSync(
        path.join(__dirname, 'assets', 'pptr.png')
      );
      const responseBuffer = await response.buffer();
      expect(responseBuffer.equals(imageBuffer)).toBe(true);
    });
  });

  describe('Response.statusText', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      server.setRoute('/cool', (req, res) => {
        res.writeHead(200, 'cool!');
        res.end();
      });
      const response = await page.goto(server.PREFIX + '/cool');
      expect(response.statusText()).toBe('cool!');
    });
  });

  describeFailsFirefox('Network Events', function () {
    it('Page.Events.Request', async () => {
      const { page, server } = getTestState();

      const requests = [];
      page.on('request', (request) => requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
      expect(requests[0].resourceType()).toBe('document');
      expect(requests[0].method()).toBe('GET');
      expect(requests[0].response()).toBeTruthy();
      expect(requests[0].frame() === page.mainFrame()).toBe(true);
      expect(requests[0].frame().url()).toBe(server.EMPTY_PAGE);
    });
    it('Page.Events.RequestServedFromCache', async () => {
      const { page, server } = getTestState();

      const cached = [];
      page.on('requestservedfromcache', (r) =>
        cached.push(r.url().split('/').pop())
      );

      await page.goto(server.PREFIX + '/cached/one-style.html');
      expect(cached).toEqual([]);

      await page.reload();
      expect(cached).toEqual(['one-style.css']);
    });
    it('Page.Events.Response', async () => {
      const { page, server } = getTestState();

      const responses = [];
      page.on('response', (response) => responses.push(response));
      await page.goto(server.EMPTY_PAGE);
      expect(responses.length).toBe(1);
      expect(responses[0].url()).toBe(server.EMPTY_PAGE);
      expect(responses[0].status()).toBe(200);
      expect(responses[0].ok()).toBe(true);
      expect(responses[0].request()).toBeTruthy();
      const remoteAddress = responses[0].remoteAddress();
      // Either IPv6 or IPv4, depending on environment.
      expect(
        remoteAddress.ip.includes('::1') || remoteAddress.ip === '127.0.0.1'
      ).toBe(true);
      expect(remoteAddress.port).toBe(server.PORT);
    });

    it('Page.Events.RequestFailed', async () => {
      const { page, server, isChrome } = getTestState();

      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.url().endsWith('css')) request.abort();
        else request.continue();
      });
      const failedRequests = [];
      page.on('requestfailed', (request) => failedRequests.push(request));
      await page.goto(server.PREFIX + '/one-style.html');
      expect(failedRequests.length).toBe(1);
      expect(failedRequests[0].url()).toContain('one-style.css');
      expect(failedRequests[0].response()).toBe(null);
      expect(failedRequests[0].resourceType()).toBe('stylesheet');
      if (isChrome)
        expect(failedRequests[0].failure().errorText).toBe('net::ERR_FAILED');
      else
        expect(failedRequests[0].failure().errorText).toBe('NS_ERROR_FAILURE');
      expect(failedRequests[0].frame()).toBeTruthy();
    });
    it('Page.Events.RequestFinished', async () => {
      const { page, server } = getTestState();

      const requests = [];
      page.on('requestfinished', (request) => requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
      expect(requests[0].response()).toBeTruthy();
      expect(requests[0].frame() === page.mainFrame()).toBe(true);
      expect(requests[0].frame().url()).toBe(server.EMPTY_PAGE);
    });
    it('should fire events in proper order', async () => {
      const { page, server } = getTestState();

      const events = [];
      page.on('request', () => events.push('request'));
      page.on('response', () => events.push('response'));
      page.on('requestfinished', () => events.push('requestfinished'));
      await page.goto(server.EMPTY_PAGE);
      expect(events).toEqual(['request', 'response', 'requestfinished']);
    });
    it('should support redirects', async () => {
      const { page, server } = getTestState();

      const events = [];
      page.on('request', (request) =>
        events.push(`${request.method()} ${request.url()}`)
      );
      page.on('response', (response) =>
        events.push(`${response.status()} ${response.url()}`)
      );
      page.on('requestfinished', (request) =>
        events.push(`DONE ${request.url()}`)
      );
      page.on('requestfailed', (request) =>
        events.push(`FAIL ${request.url()}`)
      );
      server.setRedirect('/foo.html', '/empty.html');
      const FOO_URL = server.PREFIX + '/foo.html';
      const response = await page.goto(FOO_URL);
      expect(events).toEqual([
        `GET ${FOO_URL}`,
        `302 ${FOO_URL}`,
        `DONE ${FOO_URL}`,
        `GET ${server.EMPTY_PAGE}`,
        `200 ${server.EMPTY_PAGE}`,
        `DONE ${server.EMPTY_PAGE}`,
      ]);

      // Check redirect chain
      const redirectChain = response.request().redirectChain();
      expect(redirectChain.length).toBe(1);
      expect(redirectChain[0].url()).toContain('/foo.html');
      expect(redirectChain[0].response().remoteAddress().port).toBe(
        server.PORT
      );
    });
  });

  describe('Request.isNavigationRequest', () => {
    itFailsFirefox('should work', async () => {
      const { page, server } = getTestState();

      const requests = new Map();
      page.on('request', (request) =>
        requests.set(request.url().split('/').pop(), request)
      );
      server.setRedirect('/rrredirect', '/frames/one-frame.html');
      await page.goto(server.PREFIX + '/rrredirect');
      expect(requests.get('rrredirect').isNavigationRequest()).toBe(true);
      expect(requests.get('one-frame.html').isNavigationRequest()).toBe(true);
      expect(requests.get('frame.html').isNavigationRequest()).toBe(true);
      expect(requests.get('script.js').isNavigationRequest()).toBe(false);
      expect(requests.get('style.css').isNavigationRequest()).toBe(false);
    });
    itFailsFirefox('should work with request interception', async () => {
      const { page, server } = getTestState();

      const requests = new Map();
      page.on('request', (request) => {
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
    it('should work when navigating to image', async () => {
      const { page, server } = getTestState();

      const requests = [];
      page.on('request', (request) => requests.push(request));
      await page.goto(server.PREFIX + '/pptr.png');
      expect(requests[0].isNavigationRequest()).toBe(true);
    });
  });

  describeFailsFirefox('Page.setExtraHTTPHeaders', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      await page.setExtraHTTPHeaders({
        foo: 'bar',
      });
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      expect(request.headers['foo']).toBe('bar');
    });
    it('should throw for non-string header values', async () => {
      const { page } = getTestState();

      let error = null;
      try {
        // @ts-expect-error purposeful bad input
        await page.setExtraHTTPHeaders({ foo: 1 });
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toBe(
        'Expected value of header "foo" to be String, but "number" is found.'
      );
    });
  });

  describeFailsFirefox('Page.authenticate', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      server.setAuth('/empty.html', 'user', 'pass');
      let response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(401);
      await page.authenticate({
        username: 'user',
        password: 'pass',
      });
      response = await page.reload();
      expect(response.status()).toBe(200);
    });
    it('should fail if wrong credentials', async () => {
      const { page, server } = getTestState();

      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user2', 'pass2');
      await page.authenticate({
        username: 'foo',
        password: 'bar',
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(401);
    });
    it('should allow disable authentication', async () => {
      const { page, server } = getTestState();

      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user3', 'pass3');
      await page.authenticate({
        username: 'user3',
        password: 'pass3',
      });
      let response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(200);
      await page.authenticate(null);
      // Navigate to a different origin to bust Chrome's credential caching.
      response = await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      expect(response.status()).toBe(401);
    });
    it('should not disable caching', async () => {
      const { page, server } = getTestState();

      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/cached/one-style.css', 'user4', 'pass4');
      server.setAuth('/cached/one-style.html', 'user4', 'pass4');
      await page.authenticate({
        username: 'user4',
        password: 'pass4',
      });

      const responses = new Map();
      page.on('response', (r) => responses.set(r.url().split('/').pop(), r));

      // Load and re-load to make sure it's cached.
      await page.goto(server.PREFIX + '/cached/one-style.html');
      await page.reload();

      expect(responses.get('one-style.css').status()).toBe(200);
      expect(responses.get('one-style.css').fromCache()).toBe(true);
      expect(responses.get('one-style.html').status()).toBe(304);
      expect(responses.get('one-style.html').fromCache()).toBe(false);
    });
  });
});
