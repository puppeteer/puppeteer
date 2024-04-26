/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import type {ServerResponse} from 'http';
import path from 'path';

import expect from 'expect';
import type {HTTPRequest} from 'puppeteer-core/internal/api/HTTPRequest.js';
import type {HTTPResponse} from 'puppeteer-core/internal/api/HTTPResponse.js';

import {getTestState, launch, setupTestBrowserHooks} from './mocha-utils.js';
import {attachFrame, isFavicon, waitEvent} from './utils.js';

describe('network', function () {
  setupTestBrowserHooks();

  describe('Page.Events.Request', function () {
    it('should fire for navigation requests', async () => {
      const {page, server} = await getTestState();

      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await page.goto(server.EMPTY_PAGE);
      expect(requests).toHaveLength(1);
    });
    it('should fire for iframes', async () => {
      const {page, server} = await getTestState();

      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await page.goto(server.EMPTY_PAGE);
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(requests).toHaveLength(2);
    });
    it('should fire for fetches', async () => {
      const {page, server} = await getTestState();

      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        return fetch('/empty.html');
      });
      expect(requests).toHaveLength(2);
    });
  });
  describe('Request.frame', function () {
    it('should work for main frame navigation request', async () => {
      const {page, server} = await getTestState();

      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await page.goto(server.EMPTY_PAGE);
      expect(requests).toHaveLength(1);
      expect(requests[0]!.frame()).toBe(page.mainFrame());
    });
    it('should work for subframe navigation request', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(requests).toHaveLength(1);
      expect(requests[0]!.frame()).toBe(page.frames()[1]);
    });
    it('should work for fetch requests', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      let requests: HTTPRequest[] = [];
      page.on('request', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await page.evaluate(() => {
        return fetch('/digits/1.png');
      });
      requests = requests.filter(request => {
        return !request.url().includes('favicon');
      });
      expect(requests).toHaveLength(1);
      expect(requests[0]!.frame()).toBe(page.mainFrame());
    });
  });

  describe('Request.headers', function () {
    it('should define Browser in user agent header', async () => {
      const {page, server, isChrome} = await getTestState();
      const response = (await page.goto(server.EMPTY_PAGE))!;
      const userAgent = response.request().headers()['user-agent'];

      if (isChrome) {
        expect(userAgent).toContain('Chrome');
      } else {
        expect(userAgent).toContain('Firefox');
      }
    });
  });

  describe('Response.headers', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      server.setRoute('/empty.html', (_req, res) => {
        res.setHeader('foo', 'bar');
        res.end();
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.headers()['foo']).toBe('bar');
    });
  });

  describe('Request.initiator', () => {
    it('should return the initiator', async () => {
      const {page, server} = await getTestState();

      const initiators = new Map();
      page.on('request', request => {
        return initiators.set(
          request.url().split('/').pop(),
          request.initiator()
        );
      });
      await page.goto(server.PREFIX + '/initiator.html');

      expect(initiators.get('initiator.html').type).toBe('other');
      expect(initiators.get('initiator.js').type).toBe('parser');
      expect(initiators.get('initiator.js').url).toBe(
        server.PREFIX + '/initiator.html'
      );
      expect(initiators.get('frame.html').type).toBe('parser');
      expect(initiators.get('frame.html').url).toBe(
        server.PREFIX + '/initiator.html'
      );
      expect(initiators.get('script.js').type).toBe('parser');
      expect(initiators.get('script.js').url).toBe(
        server.PREFIX + '/frames/frame.html'
      );
      expect(initiators.get('style.css').type).toBe('parser');
      expect(initiators.get('style.css').url).toBe(
        server.PREFIX + '/frames/frame.html'
      );
      expect(initiators.get('initiator.js').type).toBe('parser');
      expect(initiators.get('injectedfile.js').type).toBe('script');
      expect(initiators.get('injectedfile.js').stack.callFrames[0]!.url).toBe(
        server.PREFIX + '/initiator.js'
      );
      expect(initiators.get('injectedstyle.css').type).toBe('script');
      expect(initiators.get('injectedstyle.css').stack.callFrames[0]!.url).toBe(
        server.PREFIX + '/initiator.js'
      );
      expect(initiators.get('initiator.js').url).toBe(
        server.PREFIX + '/initiator.html'
      );
    });
  });

  describe('Response.fromCache', function () {
    it('should return |false| for non-cached content', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.fromCache()).toBe(false);
    });

    it('should work', async () => {
      const {page, server} = await getTestState();

      const responses = new Map();
      page.on('response', r => {
        return (
          !isFavicon(r.request()) && responses.set(r.url().split('/').pop(), r)
        );
      });

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

  describe('Response.fromServiceWorker', function () {
    it('should return |false| for non-service-worker content', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.fromServiceWorker()).toBe(false);
    });

    it('Response.fromServiceWorker', async () => {
      const {page, server} = await getTestState();

      const responses = new Map();
      page.on('response', r => {
        return !isFavicon(r) && responses.set(r.url().split('/').pop(), r);
      });

      // Load and re-load to make sure serviceworker is installed and running.
      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html', {
        waitUntil: 'networkidle2',
      });
      await page.evaluate(async () => {
        return (globalThis as any).activationPromise;
      });
      await page.reload();

      expect(responses.size).toBe(2);
      expect(responses.get('sw.html').status()).toBe(200);
      expect(responses.get('sw.html').fromServiceWorker()).toBe(true);
      expect(responses.get('style.css').status()).toBe(200);
      expect(responses.get('style.css').fromServiceWorker()).toBe(true);
    });
  });

  describe('Request.postData', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      server.setRoute('/post', (_req, res) => {
        return res.end();
      });

      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(page, 'request', r => {
          return !isFavicon(r);
        }),
        page.evaluate(() => {
          return fetch('./post', {
            method: 'POST',
            body: JSON.stringify({foo: 'bar'}),
          });
        }),
      ]);

      expect(request).toBeTruthy();
      expect(request.postData()).toBe('{"foo":"bar"}');
    });

    it('should be |undefined| when there is no post data', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.request().postData()).toBe(undefined);
    });

    it('should work with blobs', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      server.setRoute('/post', (_req, res) => {
        return res.end();
      });

      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(page, 'request', r => {
          return !isFavicon(r);
        }),
        page.evaluate(() => {
          return fetch('./post', {
            method: 'POST',
            body: new Blob([JSON.stringify({foo: 'bar'})], {
              type: 'application/json',
            }),
          });
        }),
      ]);

      expect(request).toBeTruthy();
      expect(request.postData()).toBe(undefined);
      expect(request.hasPostData()).toBe(true);
      expect(await request.fetchPostData()).toBe('{"foo":"bar"}');
    });
  });

  describe('Response.text', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.PREFIX + '/simple.json'))!;
      const responseText = (await response.text()).trimEnd();
      expect(responseText).toBe('{"foo": "bar"}');
    });
    it('should return uncompressed text', async () => {
      const {page, server} = await getTestState();

      server.enableGzip('/simple.json');
      const response = (await page.goto(server.PREFIX + '/simple.json'))!;
      expect(response.headers()['content-encoding']).toBe('gzip');
      const responseText = (await response.text()).trimEnd();
      expect(responseText).toBe('{"foo": "bar"}');
    });
    it('should throw when requesting body of redirected response', async () => {
      const {page, server} = await getTestState();

      server.setRedirect('/foo.html', '/empty.html');
      const response = (await page.goto(server.PREFIX + '/foo.html'))!;
      const redirectChain = response.request().redirectChain();
      expect(redirectChain).toHaveLength(1);
      const redirected = redirectChain[0]!.response()!;
      expect(redirected.status()).toBe(302);
      let error!: Error;
      await redirected.text().catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toContain(
        'Response body is unavailable for redirect responses'
      );
    });
    it('should wait until response completes', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      // Setup server to trap request.
      let serverResponse!: ServerResponse;
      server.setRoute('/get', (_req, res) => {
        serverResponse = res;
        // In Firefox, |fetch| will be hanging until it receives |Content-Type| header
        // from server.
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.write('hello ');
      });
      // Setup page to trap response.
      let requestFinished = false;
      page.on('requestfinished', r => {
        return (requestFinished = requestFinished || r.url().includes('/get'));
      });
      // send request and wait for server response
      const [pageResponse] = await Promise.all([
        page.waitForResponse(r => {
          return !isFavicon(r.request());
        }),
        page.evaluate(() => {
          return fetch('./get', {method: 'GET'});
        }),
        server.waitForRequest('/get'),
      ]);

      expect(serverResponse).toBeTruthy();
      expect(pageResponse).toBeTruthy();
      expect(pageResponse.status()).toBe(200);
      expect(requestFinished).toBe(false);

      const responseText = pageResponse.text();
      // Write part of the response and wait for it to be flushed.
      await new Promise(x => {
        return serverResponse.write('wor', x);
      });
      // Finish response.
      await new Promise<void>(x => {
        serverResponse.end('ld!', () => {
          return x();
        });
      });
      expect(await responseText).toBe('hello world!');
    });
  });

  describe('Response.json', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.PREFIX + '/simple.json'))!;
      expect(await response.json()).toEqual({foo: 'bar'});
    });
  });

  describe('Response.buffer', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.PREFIX + '/pptr.png'))!;
      const imageBuffer = fs.readFileSync(
        path.join(__dirname, '../assets', 'pptr.png')
      );
      const responseBuffer = await response.buffer();
      expect(responseBuffer.equals(imageBuffer)).toBe(true);
    });
    it('should work with compression', async () => {
      const {page, server} = await getTestState();

      server.enableGzip('/pptr.png');
      const response = (await page.goto(server.PREFIX + '/pptr.png'))!;
      const imageBuffer = fs.readFileSync(
        path.join(__dirname, '../assets', 'pptr.png')
      );
      const responseBuffer = await response.buffer();
      expect(responseBuffer.equals(imageBuffer)).toBe(true);
    });
    it('should throw if the response does not have a body', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/empty.html');

      server.setRoute('/test.html', (_req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'x-ping');
        res.end('Hello World');
      });
      const url = server.CROSS_PROCESS_PREFIX + '/test.html';
      const responsePromise = waitEvent<HTTPResponse>(
        page,
        'response',
        response => {
          // Get the preflight response.
          return (
            response.request().method() === 'OPTIONS' && response.url() === url
          );
        }
      );

      // Trigger a request with a preflight.
      await page.evaluate(async src => {
        const response = await fetch(src, {
          method: 'POST',
          headers: {'x-ping': 'pong'},
        });
        return response;
      }, url);

      const response = await responsePromise;
      await expect(response.buffer()).rejects.toThrowError(
        'Could not load body for this request. This might happen if the request is a preflight request.'
      );
    });
  });

  describe('Response.statusText', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      server.setRoute('/cool', (_req, res) => {
        res.writeHead(200, 'cool!');
        res.end();
      });
      const response = (await page.goto(server.PREFIX + '/cool'))!;
      expect(response.statusText()).toBe('cool!');
    });

    it('handles missing status text', async () => {
      const {page, server} = await getTestState();

      server.setRoute('/nostatus', (_req, res) => {
        res.writeHead(200, '');
        res.end();
      });
      const response = (await page.goto(server.PREFIX + '/nostatus'))!;
      expect(response.statusText()).toBe('');
    });
  });

  describe('Response.timing', function () {
    it('returns timing information', async () => {
      const {page, server} = await getTestState();
      const responses: HTTPResponse[] = [];
      page.on('response', response => {
        return responses.push(response);
      });
      await page.goto(server.EMPTY_PAGE);
      expect(responses).toHaveLength(1);
      expect(responses[0]!.timing()!.receiveHeadersEnd).toBeGreaterThan(0);
    });
  });

  describe('Network Events', function () {
    it('Page.Events.Request', async () => {
      const {page, server} = await getTestState();

      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await page.goto(server.EMPTY_PAGE);
      expect(requests).toHaveLength(1);
      const request = requests[0]!;
      expect(request.url()).toBe(server.EMPTY_PAGE);
      expect(request.method()).toBe('GET');
      expect(request.response()).toBeTruthy();
      expect(request.frame() === page.mainFrame()).toBe(true);
      expect(request.frame()!.url()).toBe(server.EMPTY_PAGE);
    });
    it('Page.Events.RequestServedFromCache', async () => {
      const {page, server} = await getTestState();

      const cached: string[] = [];
      page.on('requestservedfromcache', r => {
        return cached.push(r.url().split('/').pop()!);
      });

      await page.goto(server.PREFIX + '/cached/one-style.html');
      expect(cached).toEqual([]);
      await new Promise(res => {
        setTimeout(res, 1000);
      });
      await page.reload();
      expect(cached).toEqual(['one-style.css']);
    });
    it('Page.Events.Response', async () => {
      const {page, server} = await getTestState();

      const responses: HTTPResponse[] = [];
      page.on('response', response => {
        return !isFavicon(response) && responses.push(response);
      });
      await page.goto(server.EMPTY_PAGE);
      expect(responses).toHaveLength(1);
      const response = responses[0]!;
      expect(response.url()).toBe(server.EMPTY_PAGE);
      expect(response.status()).toBe(200);
      expect(response.ok()).toBe(true);
      expect(response.request()).toBeTruthy();
    });

    it('Page.Events.RequestFailed', async () => {
      const {page, server, isChrome} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().endsWith('css')) {
          void request.abort();
        } else {
          void request.continue();
        }
      });
      const failedRequests: HTTPRequest[] = [];
      page.on('requestfailed', request => {
        return failedRequests.push(request);
      });
      await page.goto(server.PREFIX + '/one-style.html');
      expect(failedRequests).toHaveLength(1);
      const failedRequest = failedRequests[0]!;
      expect(failedRequest.url()).toContain('one-style.css');
      expect(failedRequest.response()).toBe(null);
      expect(failedRequest.frame()).toBeTruthy();
      if (isChrome) {
        expect(failedRequest.failure()!.errorText).toBe('net::ERR_FAILED');
      } else {
        expect(failedRequest.failure()!.errorText).toBe('NS_ERROR_FAILURE');
      }
    });
    it('Page.Events.RequestFinished', async () => {
      const {page, server} = await getTestState();

      const requests: HTTPRequest[] = [];
      page.on('requestfinished', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await page.goto(server.EMPTY_PAGE);
      expect(requests).toHaveLength(1);
      const request = requests[0]!;
      expect(request.url()).toBe(server.EMPTY_PAGE);
      expect(request.response()).toBeTruthy();
      expect(request.frame() === page.mainFrame()).toBe(true);
      expect(request.frame()!.url()).toBe(server.EMPTY_PAGE);
    });
    it('should fire events in proper order', async () => {
      const {page, server} = await getTestState();

      const events: string[] = [];
      page.on('request', () => {
        return events.push('request');
      });
      page.on('response', () => {
        return events.push('response');
      });
      page.on('requestfinished', () => {
        return events.push('requestfinished');
      });
      await page.goto(server.EMPTY_PAGE);
      // Events can sneak in after the page has navigate
      expect(events.slice(0, 3)).toEqual([
        'request',
        'response',
        'requestfinished',
      ]);
    });
    it('should support redirects', async () => {
      const {page, server} = await getTestState();

      const events: string[] = [];
      page.on('request', request => {
        return events.push(`${request.method()} ${request.url()}`);
      });
      page.on('response', response => {
        return events.push(`${response.status()} ${response.url()}`);
      });
      page.on('requestfinished', request => {
        return events.push(`DONE ${request.url()}`);
      });
      page.on('requestfailed', request => {
        return events.push(`FAIL ${request.url()}`);
      });
      server.setRedirect('/foo.html', '/empty.html');
      const FOO_URL = server.PREFIX + '/foo.html';
      const response = (await page.goto(FOO_URL))!;
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
      expect(redirectChain).toHaveLength(1);
      expect(redirectChain[0]!.url()).toContain('/foo.html');
    });
  });

  describe('Request.isNavigationRequest', () => {
    it('should work', async () => {
      const {page, server} = await getTestState();

      const requests = new Map();
      page.on('request', request => {
        return requests.set(request.url().split('/').pop(), request);
      });
      server.setRedirect('/rrredirect', '/frames/one-frame.html');
      await page.goto(server.PREFIX + '/rrredirect');
      expect(requests.get('rrredirect').isNavigationRequest()).toBe(true);
      expect(requests.get('one-frame.html').isNavigationRequest()).toBe(true);
      expect(requests.get('frame.html').isNavigationRequest()).toBe(true);
      expect(requests.get('script.js').isNavigationRequest()).toBe(false);
      expect(requests.get('style.css').isNavigationRequest()).toBe(false);
    });
    it('should work with request interception', async () => {
      const {page, server} = await getTestState();

      const requests = new Map();
      page.on('request', request => {
        requests.set(request.url().split('/').pop(), request);
        void request.continue();
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
      const {page, server} = await getTestState();

      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(page, 'request'),
        page.goto(server.PREFIX + '/pptr.png'),
      ]);
      expect(request.isNavigationRequest()).toBe(true);
    });
  });

  describe('Page.setExtraHTTPHeaders', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

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
      const {page} = await getTestState();

      let error!: Error;
      try {
        // @ts-expect-error purposeful bad input
        await page.setExtraHTTPHeaders({foo: 1});
      } catch (error_) {
        error = error_ as Error;
      }
      expect(error.message).toBe(
        'Expected value of header "foo" to be String, but "number" is found.'
      );
    });
  });

  describe('Page.authenticate', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      server.setAuth('/empty.html', 'user', 'pass');
      let response;
      try {
        response = (await page.goto(server.EMPTY_PAGE))!;
        expect(response.status()).toBe(401);
      } catch (error) {
        // In headful, an error is thrown instead of 401.
        if (
          !(error as Error).message?.includes(
            'net::ERR_INVALID_AUTH_CREDENTIALS'
          )
        ) {
          throw error;
        }
      }
      await page.authenticate({
        username: 'user',
        password: 'pass',
      });
      response = (await page.reload())!;
      expect(response.status()).toBe(200);
    });
    it('should fail if wrong credentials', async () => {
      const {page, server} = await getTestState();

      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user2', 'pass2');
      await page.authenticate({
        username: 'foo',
        password: 'bar',
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.status()).toBe(401);
    });
    it('should allow disable authentication', async () => {
      const {page, server} = await getTestState();

      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user3', 'pass3');
      await page.authenticate({
        username: 'user3',
        password: 'pass3',
      });
      let response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.status()).toBe(200);
      await page.authenticate({
        username: '',
        password: '',
      });
      // Navigate to a different origin to bust Chrome's credential caching.
      try {
        response = (await page.goto(
          server.CROSS_PROCESS_PREFIX + '/empty.html'
        ))!;
        expect(response.status()).toBe(401);
      } catch (error) {
        // In headful, an error is thrown instead of 401.
        if (
          !(error as Error).message?.includes(
            'net::ERR_INVALID_AUTH_CREDENTIALS'
          )
        ) {
          throw error;
        }
      }
    });
    it('should not disable caching', async () => {
      const {page, server} = await getTestState();

      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/cached/one-style.css', 'user4', 'pass4');
      server.setAuth('/cached/one-style.html', 'user4', 'pass4');
      await page.authenticate({
        username: 'user4',
        password: 'pass4',
      });

      const responses = new Map();
      page.on('response', r => {
        return responses.set(r.url().split('/').pop(), r);
      });

      // Load and re-load to make sure it's cached.
      await page.goto(server.PREFIX + '/cached/one-style.html');
      await page.reload();

      expect(responses.get('one-style.css').status()).toBe(200);
      expect(responses.get('one-style.css').fromCache()).toBe(true);
      expect(responses.get('one-style.html').status()).toBe(304);
      expect(responses.get('one-style.html').fromCache()).toBe(false);
    });
  });

  describe('raw network headers', () => {
    it('Same-origin set-cookie navigation', async () => {
      const {page, server} = await getTestState();

      const setCookieString = 'foo=bar';
      server.setRoute('/empty.html', (_req, res) => {
        res.setHeader('set-cookie', setCookieString);
        res.end('hello world');
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.headers()['set-cookie']).toBe(setCookieString);
    });

    it('Same-origin set-cookie subresource', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      const setCookieString = 'foo=bar';
      server.setRoute('/foo', (_req, res) => {
        res.setHeader('set-cookie', setCookieString);
        res.end('hello world');
      });

      const [response] = await Promise.all([
        waitEvent<HTTPResponse>(page, 'response', res => {
          return !isFavicon(res);
        }),
        page.evaluate(() => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', '/foo');
          xhr.send();
        }),
      ]);
      expect(response.headers()['set-cookie']).toBe(setCookieString);
    });

    it('Cross-origin set-cookie', async () => {
      const {page, httpsServer, close} = await launch({
        ignoreHTTPSErrors: true,
      });
      try {
        await page.goto(httpsServer.PREFIX + '/empty.html');

        const setCookieString = 'hello=world';
        httpsServer.setRoute('/setcookie.html', (_req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('set-cookie', setCookieString);
          res.end();
        });
        await page.goto(httpsServer.PREFIX + '/setcookie.html');
        const url = httpsServer.CROSS_PROCESS_PREFIX + '/setcookie.html';
        const [response] = await Promise.all([
          waitEvent<HTTPResponse>(page, 'response', response => {
            return response.url() === url;
          }),
          page.evaluate(src => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', src);
            xhr.send();
          }, url),
        ]);
        expect(response.headers()['set-cookie']).toBe(setCookieString);
      } finally {
        await close();
      }
    });
  });

  describe('Page.setBypassServiceWorker', () => {
    it('bypass for network', async () => {
      const {page, server} = await getTestState();

      const responses = new Map();
      page.on('response', r => {
        return !isFavicon(r) && responses.set(r.url().split('/').pop(), r);
      });

      // Load and re-load to make sure serviceworker is installed and running.
      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html', {
        waitUntil: 'networkidle2',
      });
      await page.evaluate(async () => {
        return (globalThis as any).activationPromise;
      });
      await page.reload({
        waitUntil: 'networkidle2',
      });

      expect(page.isServiceWorkerBypassed()).toBe(false);
      expect(responses.size).toBe(2);
      expect(responses.get('sw.html').status()).toBe(200);
      expect(responses.get('sw.html').fromServiceWorker()).toBe(true);
      expect(responses.get('style.css').status()).toBe(200);
      expect(responses.get('style.css').fromServiceWorker()).toBe(true);

      await page.setBypassServiceWorker(true);
      await page.reload({
        waitUntil: 'networkidle2',
      });

      expect(page.isServiceWorkerBypassed()).toBe(true);
      expect(responses.get('sw.html').status()).toBe(200);
      expect(responses.get('sw.html').fromServiceWorker()).toBe(false);
      expect(responses.get('style.css').status()).toBe(200);
      expect(responses.get('style.css').fromServiceWorker()).toBe(false);
    });
  });

  describe('Request.resourceType', () => {
    it('should work for document type', async () => {
      const {page, server} = await getTestState();

      const response = await page.goto(server.EMPTY_PAGE);
      const request = response!.request();
      expect(request.resourceType()).toBe('document');
    });

    it('should work for stylesheets', async () => {
      const {page, server} = await getTestState();

      const cssRequests: HTTPRequest[] = [];
      page.on('request', request => {
        if (request.url().endsWith('css')) {
          cssRequests.push(request);
        }
      });
      await page.goto(server.PREFIX + '/one-style.html');
      expect(cssRequests).toHaveLength(1);
      const request = cssRequests[0]!;
      expect(request.url()).toContain('one-style.css');
      expect(request.resourceType()).toBe('stylesheet');
    });
  });

  describe('Response.remoteAddress', () => {
    it('should work', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.EMPTY_PAGE))!;
      const remoteAddress = response.remoteAddress();
      // Either IPv6 or IPv4, depending on environment.
      expect(
        remoteAddress.ip!.includes('::1') || remoteAddress.ip === '127.0.0.1'
      ).toBe(true);
      expect(remoteAddress.port).toBe(server.PORT);
    });

    it('should support redirects', async () => {
      const {page, server} = await getTestState();

      server.setRedirect('/foo.html', '/empty.html');
      const FOO_URL = server.PREFIX + '/foo.html';
      const response = (await page.goto(FOO_URL))!;

      // Check redirect chain
      const redirectChain = response.request().redirectChain();
      expect(redirectChain).toHaveLength(1);
      expect(redirectChain[0]!.url()).toContain('/foo.html');
      expect(redirectChain[0]!.response()!.remoteAddress().port).toBe(
        server.PORT
      );
    });
  });
});
