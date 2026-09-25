/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import type {ServerResponse} from 'node:http';
import path from 'node:path';

import {assert} from 'chai';
import type {HTTPRequest} from 'puppeteer-core/internal/api/HTTPRequest.js';
import type {HTTPResponse} from 'puppeteer-core/internal/api/HTTPResponse.js';

import {getTestState, launch, setupTestBrowserHooks} from './mocha-utils.js';
import {assertRejects, attachFrame, isFavicon, waitEvent} from './utils.js';

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
      assert.lengthOf(requests, 1);
    });
    it('should fire for iframes', async () => {
      const {page, server} = await getTestState();

      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await page.goto(server.EMPTY_PAGE);
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      assert.lengthOf(requests, 2);
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
      assert.lengthOf(requests, 2);
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
      assert.lengthOf(requests, 1);
      assert.strictEqual(requests[0]!.frame(), page.mainFrame());
    });
    it('should work for subframe navigation request', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      assert.lengthOf(requests, 1);
      assert.strictEqual(requests[0]!.frame(), page.frames()[1]);
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
      assert.lengthOf(requests, 1);
      assert.strictEqual(requests[0]!.frame(), page.mainFrame());
    });
  });

  describe('Request.headers', function () {
    it('should define Browser in user agent header', async () => {
      const {page, server, isChrome} = await getTestState();
      const response = (await page.goto(server.EMPTY_PAGE))!;
      const userAgent = response.request().headers()['user-agent'];

      if (isChrome) {
        assert.include(userAgent, 'Chrome');
      } else {
        assert.include(userAgent, 'Firefox');
      }
    });

    // In CDP cookie header is only when the request actually
    // hits the network, verify that we populate the correctly
    describe('cookie header', () => {
      it('should show Cookie header', async () => {
        const {page, server} = await getTestState();
        await page.goto(server.EMPTY_PAGE);
        await page.evaluate(() => {
          document.cookie = 'username=John Doe';
        });
        const response = (await page.goto(server.PREFIX + '/title.html'))!;

        const cookie = response.request().headers()['cookie'];

        assert.include(cookie, 'username=John Doe');
      });

      it('should show Cookie header for redirect', async () => {
        const {page, server} = await getTestState();
        await page.goto(server.EMPTY_PAGE);
        server.setRedirect('/foo.html', '/title.html');
        await page.evaluate(() => {
          document.cookie = 'username=John Doe';
        });
        const response = (await page.goto(server.PREFIX + '/foo.html'))!;

        const cookie1 = response.request().redirectChain()[0]!.headers()[
          'cookie'
        ];
        assert.include(cookie1, 'username=John Doe');

        const cookie2 = response.request().headers()['cookie'];
        assert.include(cookie2, 'username=John Doe');
      });

      it('should show Cookie header for fetch request', async () => {
        const {page, server} = await getTestState();
        await page.goto(server.EMPTY_PAGE);
        await page.evaluate(() => {
          document.cookie = 'username=John Doe';
        });

        const [response] = await Promise.all([
          waitEvent<HTTPResponse>(page, 'response', req => {
            return !isFavicon(req);
          }),
          page.evaluate(async () => {
            await fetch('/title.html');
          }),
        ]);

        const cookie = response.request().headers()['cookie'];
        assert.include(cookie, 'username=John Doe');
      });
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
      assert.strictEqual(response.headers()['foo'], 'bar');
    });
  });

  describe('Request.initiator', () => {
    it('should return the initiator', async () => {
      const {page, server} = await getTestState();

      const initiators = new Map();
      page.on('request', request => {
        return initiators.set(
          request.url().split('/').pop(),
          request.initiator(),
        );
      });
      await page.goto(server.PREFIX + '/initiator.html');

      assert.strictEqual(initiators.get('initiator.html').type, 'other');
      assert.strictEqual(initiators.get('initiator.js').type, 'parser');
      assert.strictEqual(
        initiators.get('initiator.js').url,
        server.PREFIX + '/initiator.html',
      );
      assert.strictEqual(initiators.get('frame.html').type, 'parser');
      assert.strictEqual(
        initiators.get('frame.html').url,
        server.PREFIX + '/initiator.html',
      );
      assert.strictEqual(initiators.get('script.js').type, 'parser');
      assert.strictEqual(
        initiators.get('script.js').url,
        server.PREFIX + '/frames/frame.html',
      );
      assert.strictEqual(initiators.get('style.css').type, 'parser');
      assert.strictEqual(
        initiators.get('style.css').url,
        server.PREFIX + '/frames/frame.html',
      );
      assert.strictEqual(initiators.get('initiator.js').type, 'parser');
      assert.strictEqual(initiators.get('injectedfile.js').type, 'script');
      assert.strictEqual(
        initiators.get('injectedfile.js').stack.callFrames[0]!.url,
        server.PREFIX + '/initiator.js',
      );
      assert.strictEqual(initiators.get('injectedstyle.css').type, 'script');
      assert.strictEqual(
        initiators.get('injectedstyle.css').stack.callFrames[0]!.url,
        server.PREFIX + '/initiator.js',
      );
      assert.strictEqual(
        initiators.get('initiator.js').url,
        server.PREFIX + '/initiator.html',
      );
    });
  });

  describe('Response.fromCache', function () {
    it('should return |false| for non-cached content', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.EMPTY_PAGE))!;
      assert.isFalse(response.fromCache());
    });

    // Run this cache test both with a stylesheet and a script.
    // Firefox currently does not handle network events for cached CSS files.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1879438
    for (const {html, resource, type} of [
      {html: 'one-style.html', resource: 'one-style.css', type: 'stylesheet'},
      {html: 'one-script.html', resource: 'one-script.js', type: 'script'},
    ]) {
      it(`should work for ${type}`, async () => {
        const {page, server} = await getTestState();

        const responses = new Map();
        page.on('response', r => {
          return (
            !isFavicon(r.request()) &&
            responses.set(r.url().split('/').pop(), r)
          );
        });

        // Load and re-load to make sure it's cached.
        await page.goto(server.PREFIX + '/cached/' + html);
        await page.reload();

        assert.strictEqual(responses.size, 2);
        assert.strictEqual(responses.get(resource).status(), 200);
        assert.isTrue(responses.get(resource).fromCache());
        assert.strictEqual(responses.get(html).status(), 304);
        assert.isFalse(responses.get(html).fromCache());
      });
    }
  });

  describe('Response.fromServiceWorker', function () {
    it('should return |false| for non-service-worker content', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.EMPTY_PAGE))!;
      assert.isFalse(response.fromServiceWorker());
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

      assert.strictEqual(responses.size, 2);
      assert.strictEqual(responses.get('sw.html').status(), 200);
      assert.isTrue(responses.get('sw.html').fromServiceWorker());
      assert.strictEqual(responses.get('style.css').status(), 200);
      assert.isTrue(responses.get('style.css').fromServiceWorker());
    });
  });

  describe('Request.fetchPostData', function () {
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

      assert.ok(request);
      assert.ok(request.hasPostData());
      assert.strictEqual(await request.fetchPostData(), '{"foo":"bar"}');
    });

    it('should be |undefined| when there is no post data', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.EMPTY_PAGE))!;
      assert.notOk(response.request().hasPostData());

      assert.isUndefined(await response.request().fetchPostData());
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

      assert.ok(request);
      assert.isTrue(request.hasPostData());
      assert.strictEqual(await request.fetchPostData(), '{"foo":"bar"}');
    });
  });

  describe('Response.text', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.PREFIX + '/simple.json'))!;
      const responseText = (await response.text()).trimEnd();
      assert.strictEqual(responseText, '{"foo": "bar"}');
    });
    it('should return uncompressed text', async () => {
      const {page, server} = await getTestState();

      server.enableGzip('/simple.json');
      const response = (await page.goto(server.PREFIX + '/simple.json'))!;
      assert.strictEqual(response.headers()['content-encoding'], 'gzip');
      const responseText = (await response.text()).trimEnd();
      assert.strictEqual(responseText, '{"foo": "bar"}');
    });
    it('should throw when requesting body of redirected response', async () => {
      const {page, server} = await getTestState();

      server.setRedirect('/foo.html', '/empty.html');
      const response = (await page.goto(server.PREFIX + '/foo.html'))!;
      const redirectChain = response.request().redirectChain();
      assert.lengthOf(redirectChain, 1);
      const redirected = redirectChain[0]!.response()!;
      assert.strictEqual(redirected.status(), 302);
      let error!: Error;
      await redirected.text().catch(error_ => {
        return (error = error_);
      });
      assert.include(
        error.message,
        'Response body is unavailable for redirect responses',
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

      assert.ok(serverResponse);
      assert.ok(pageResponse);
      assert.strictEqual(pageResponse.status(), 200);
      assert.isFalse(requestFinished);

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
      assert.strictEqual(await responseText, 'hello world!');
    });
  });

  describe('Response.json', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.PREFIX + '/simple.json'))!;
      assert.deepEqual(await response.json(), {foo: 'bar'});
    });
  });

  describe('Response.buffer', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.PREFIX + '/pptr.png'))!;
      const imageBuffer = fs.readFileSync(
        path.join(import.meta.dirname, '../assets', 'pptr.png'),
      );
      const responseBuffer = await response.buffer();

      assert.isTrue(Buffer.from(responseBuffer).equals(imageBuffer));
    });
    it('should work with compression', async () => {
      const {page, server} = await getTestState();

      server.enableGzip('/pptr.png');
      const response = (await page.goto(server.PREFIX + '/pptr.png'))!;
      const imageBuffer = fs.readFileSync(
        path.join(import.meta.dirname, '../assets', 'pptr.png'),
      );
      const responseBuffer = await response.buffer();
      assert.isTrue(Buffer.from(responseBuffer).equals(imageBuffer));
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
        },
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
      const error = await assertRejects(response.buffer());
      assert.include(
        error.message,
        'Could not load response body for this request. This might happen if the request is a preflight request.',
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
      assert.strictEqual(response.statusText(), 'cool!');
    });

    it('handles missing status text', async () => {
      const {page, server} = await getTestState();

      server.setRoute('/nostatus', (_req, res) => {
        res.writeHead(200, '');
        res.end();
      });
      const response = (await page.goto(server.PREFIX + '/nostatus'))!;
      assert.strictEqual(response.statusText(), '');
    });
  });

  describe('Response.timing', function () {
    it('returns timing information', async () => {
      const {page, server} = await getTestState();
      const responses: HTTPResponse[] = [];
      page.on('response', response => {
        if (isFavicon(response)) {
          return;
        }
        return responses.push(response);
      });
      await page.goto(server.EMPTY_PAGE);
      assert.lengthOf(responses, 1);
      assert.isAbove(responses[0]!.timing()!.receiveHeadersEnd, 0);
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
      assert.lengthOf(requests, 1);
      const request = requests[0]!;
      assert.strictEqual(request.url(), server.EMPTY_PAGE);
      assert.strictEqual(request.method(), 'GET');
      assert.ok(request.response());
      assert.isTrue(request.frame() === page.mainFrame());
      assert.strictEqual(request.frame()!.url(), server.EMPTY_PAGE);
    });

    // Run this cache test both with a stylesheet and a script.
    // Firefox currently does not handle network events for cached CSS files.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1879438
    for (const {html, resource, type} of [
      {html: 'one-style.html', resource: 'one-style.css', type: 'stylesheet'},
      {html: 'one-script.html', resource: 'one-script.js', type: 'script'},
    ]) {
      it(`Page.Events.RequestServedFromCache for ${type}`, async () => {
        const {page, server} = await getTestState();

        const cached: string[] = [];
        page.on('requestservedfromcache', r => {
          return !isFavicon(r) && cached.push(r.url().split('/').pop()!);
        });

        await page.goto(server.PREFIX + '/cached/' + html);
        assert.deepEqual(cached, []);
        await new Promise(res => {
          setTimeout(res, 1000);
        });
        await page.reload();
        assert.deepEqual(cached, [resource]);
      });
    }
    it('Page.Events.Response', async () => {
      const {page, server} = await getTestState();

      const responses: HTTPResponse[] = [];
      page.on('response', response => {
        return !isFavicon(response) && responses.push(response);
      });
      await page.goto(server.EMPTY_PAGE);
      assert.lengthOf(responses, 1);
      const response = responses[0]!;
      assert.strictEqual(response.url(), server.EMPTY_PAGE);
      assert.strictEqual(response.status(), 200);
      assert.isTrue(response.ok());
      assert.ok(response.request());
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
      assert.lengthOf(failedRequests, 1);
      const failedRequest = failedRequests[0]!;
      assert.include(failedRequest.url(), 'one-style.css');
      assert.isNull(failedRequest.response());
      assert.ok(failedRequest.frame());
      if (isChrome) {
        assert.strictEqual(
          failedRequest.failure()!.errorText,
          'net::ERR_FAILED',
        );
      } else {
        assert.strictEqual(
          failedRequest.failure()!.errorText,
          'NS_ERROR_ABORT',
        );
      }
    });
    it('Page.Events.RequestFinished', async () => {
      const {page, server} = await getTestState();

      const requests: HTTPRequest[] = [];
      page.on('requestfinished', request => {
        return !isFavicon(request) && requests.push(request);
      });
      await page.goto(server.EMPTY_PAGE);
      assert.lengthOf(requests, 1);
      const request = requests[0]!;
      assert.strictEqual(request.url(), server.EMPTY_PAGE);
      assert.ok(request.response());
      assert.isTrue(request.frame() === page.mainFrame());
      assert.strictEqual(request.frame()!.url(), server.EMPTY_PAGE);
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
      assert.deepEqual(events.slice(0, 3), [
        'request',
        'response',
        'requestfinished',
      ]);
    });
    it('should support redirects', async () => {
      const {page, server} = await getTestState();

      const events: string[] = [];
      page.on('request', request => {
        if (!isFavicon(request)) {
          events.push(`${request.method()} ${request.url()}`);
        }
      });
      page.on('response', response => {
        if (!isFavicon(response)) {
          events.push(`${response.status()} ${response.url()}`);
        }
      });
      page.on('requestfinished', request => {
        if (!isFavicon(request)) {
          events.push(`DONE ${request.url()}`);
        }
      });
      page.on('requestfailed', request => {
        if (!isFavicon(request)) {
          events.push(`FAIL ${request.url()}`);
        }
      });
      server.setRedirect('/foo.html', '/empty.html');
      const FOO_URL = server.PREFIX + '/foo.html';
      const response = (await page.goto(FOO_URL))!;
      assert.deepEqual(events, [
        `GET ${FOO_URL}`,
        `302 ${FOO_URL}`,
        `DONE ${FOO_URL}`,
        `GET ${server.EMPTY_PAGE}`,
        `200 ${server.EMPTY_PAGE}`,
        `DONE ${server.EMPTY_PAGE}`,
      ]);

      // Check redirect chain
      const redirectChain = response.request().redirectChain();
      assert.lengthOf(redirectChain, 1);
      assert.include(redirectChain[0]!.url(), '/foo.html');
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
      assert.isTrue(requests.get('rrredirect').isNavigationRequest());
      assert.isTrue(requests.get('one-frame.html').isNavigationRequest());
      assert.isTrue(requests.get('frame.html').isNavigationRequest());
      assert.isFalse(requests.get('script.js').isNavigationRequest());
      assert.isFalse(requests.get('style.css').isNavigationRequest());
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
      assert.isTrue(requests.get('rrredirect').isNavigationRequest());
      assert.isTrue(requests.get('one-frame.html').isNavigationRequest());
      assert.isTrue(requests.get('frame.html').isNavigationRequest());
      assert.isFalse(requests.get('script.js').isNavigationRequest());
      assert.isFalse(requests.get('style.css').isNavigationRequest());
    });
    it('should work when navigating to image', async () => {
      const {page, server} = await getTestState();

      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(page, 'request'),
        page.goto(server.PREFIX + '/pptr.png'),
      ]);
      assert.isTrue(request.isNavigationRequest());
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
      assert.strictEqual(request.headers['foo'], 'bar');
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
      assert.strictEqual(
        error.message,
        'Expected value of header "foo" to be String, but "number" is found.',
      );
    });
  });

  describe('Page.authenticate', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();
      server.setAuth('/empty.html', 'user', 'pass');
      await page.authenticate({
        username: 'user',
        password: 'pass',
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      assert.strictEqual(response.status(), 200);
    });

    it('should work with interception', async () => {
      const {page, server} = await getTestState();
      await page.setRequestInterception(true);
      page.on('request', async req => {
        await req.continue();
      });
      server.setAuth('/empty.html', 'user', 'pass');
      await page.authenticate({
        username: 'user',
        password: 'pass',
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      assert.strictEqual(response.status(), 200);
    });

    it('should error if authentication is required but not enabled', async () => {
      const {page, server} = await getTestState();

      server.setAuth('/empty.html', 'user', 'pass');
      let response;
      try {
        response = (await page.goto(server.EMPTY_PAGE))!;
        assert.strictEqual(response.status(), 401);
      } catch (error) {
        // In headful, an error is thrown instead of 401.
        if (
          !(error as Error).message?.includes(
            'net::ERR_INVALID_AUTH_CREDENTIALS',
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
      assert.strictEqual(response.status(), 200);
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
      assert.strictEqual(response.status(), 401);
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
      assert.strictEqual(response.status(), 200);
      await page.authenticate(null);
      // Navigate to a different origin to bust Chrome's credential caching.
      try {
        response = (await page.goto(
          server.CROSS_PROCESS_PREFIX + '/empty.html',
        ))!;
        assert.strictEqual(response.status(), 401);
      } catch (error) {
        // In headful, an error is thrown instead of 401.
        if (
          !(error as Error).message?.includes(
            'net::ERR_INVALID_AUTH_CREDENTIALS',
          )
        ) {
          throw error;
        }
      }
    });

    // Run this cache test both with a stylesheet and a script.
    // Firefox currently does not handle network events for cached CSS files.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1879438
    for (const {html, resource, type} of [
      {html: 'one-style.html', resource: 'one-style.css', type: 'stylesheet'},
      {html: 'one-script.html', resource: 'one-script.js', type: 'script'},
    ]) {
      it(`should not disable caching for ${type}`, async () => {
        const {page, server} = await getTestState();

        // Use unique user/password since Chrome caches credentials per origin.
        const user = `user4-${type};`;
        const pass = `pass4-${type};`;
        server.setAuth('/cached/' + resource, user, pass);
        server.setAuth('/cached/' + html, user, pass);
        await page.authenticate({
          username: user,
          password: pass,
        });

        const responses = new Map();
        page.on('response', r => {
          return responses.set(r.url().split('/').pop(), r);
        });

        // Load and re-load to make sure it's cached.
        await page.goto(server.PREFIX + '/cached/' + html);
        await page.reload();

        assert.strictEqual(responses.get(resource).status(), 200);
        assert.isTrue(responses.get(resource).fromCache());
        assert.strictEqual(responses.get(html).status(), 304);
        assert.isFalse(responses.get(html).fromCache());
      });
    }
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
      assert.strictEqual(response.headers()['set-cookie'], setCookieString);
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
      assert.strictEqual(response.headers()['set-cookie'], setCookieString);
    });

    it('Cross-origin set-cookie', async () => {
      const {page, httpsServer, close} = await launch(
        {
          acceptInsecureCerts: true,
        },
        {
          createContext: true,
        },
      );
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
        assert.strictEqual(response.headers()['set-cookie'], setCookieString);
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

      assert.isFalse(page.isServiceWorkerBypassed());
      assert.strictEqual(responses.size, 2);
      assert.strictEqual(responses.get('sw.html').status(), 200);
      assert.isTrue(responses.get('sw.html').fromServiceWorker());
      assert.strictEqual(responses.get('style.css').status(), 200);
      assert.isTrue(responses.get('style.css').fromServiceWorker());

      await page.setBypassServiceWorker(true);
      await page.reload({
        waitUntil: 'networkidle2',
      });

      assert.isTrue(page.isServiceWorkerBypassed());
      assert.strictEqual(responses.get('sw.html').status(), 200);
      assert.isFalse(responses.get('sw.html').fromServiceWorker());
      assert.strictEqual(responses.get('style.css').status(), 200);
      assert.isFalse(responses.get('style.css').fromServiceWorker());
    });
  });

  describe('Request.resourceType', () => {
    it('should work for document type', async () => {
      const {page, server} = await getTestState();

      const response = await page.goto(server.EMPTY_PAGE);
      const request = response!.request();
      assert.strictEqual(request.resourceType(), 'document');
    });

    it('should work for stylesheets', async () => {
      const {page, server} = await getTestState();

      const cssRequests: HTTPRequest[] = [];
      const promise = new Promise<void>(resolve => {
        page.on('request', request => {
          if (request.url().endsWith('css')) {
            cssRequests.push(request);
            resolve();
          }
        });
      });
      await page.goto(server.PREFIX + '/one-style.html');
      await promise;
      assert.lengthOf(cssRequests, 1);
      const request = cssRequests[0]!;
      assert.include(request.url(), 'one-style.css');
      assert.strictEqual(request.resourceType(), 'stylesheet');
    });
  });

  describe('Response.remoteAddress', () => {
    it('should work', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.EMPTY_PAGE))!;
      const remoteAddress = response.remoteAddress();
      // Either IPv6 or IPv4, depending on environment.
      assert.isTrue(
        remoteAddress.ip!.includes('::1') || remoteAddress.ip === '127.0.0.1',
      );
      assert.strictEqual(remoteAddress.port, server.PORT);
    });

    it('should support redirects', async () => {
      const {page, server} = await getTestState();

      server.setRedirect('/foo.html', '/empty.html');
      const FOO_URL = server.PREFIX + '/foo.html';
      const response = (await page.goto(FOO_URL))!;

      // Check redirect chain
      const redirectChain = response.request().redirectChain();
      assert.lengthOf(redirectChain, 1);
      assert.include(redirectChain[0]!.url(), '/foo.html');
      assert.strictEqual(
        redirectChain[0]!.response()!.remoteAddress().port,
        server.PORT,
      );
    });
  });
});
