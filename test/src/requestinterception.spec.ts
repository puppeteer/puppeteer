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

import expect from 'expect';
import {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';
import {HTTPRequest} from 'puppeteer-core/internal/common/HTTPRequest.js';

import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';
import utils from './utils.js';

describe('request interception', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  describe('Page.setRequestInterception', function () {
    it('should intercept', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        if (utils.isFavicon(request)) {
          request.continue();
          return;
        }
        expect(request.url()).toContain('empty.html');
        expect(request.headers()['user-agent']).toBeTruthy();
        expect(request.headers()['accept']).toBeTruthy();
        expect(request.method()).toBe('GET');
        expect(request.postData()).toBe(undefined);
        expect(request.isNavigationRequest()).toBe(true);
        expect(request.resourceType()).toBe('document');
        expect(request.frame() === page.mainFrame()).toBe(true);
        expect(request.frame()!.url()).toBe('about:blank');
        request.continue();
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.ok()).toBe(true);
      expect(response.remoteAddress().port).toBe(server.PORT);
    });
    // @see https://github.com/puppeteer/puppeteer/pull/3105
    it('should work when POST is redirected with 302', async () => {
      const {page, server} = getTestState();

      server.setRedirect('/rredirect', '/empty.html');
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue();
      });
      await page.setContent(`
        <form action='/rredirect' method='post'>
          <input type="hidden" id="foo" name="foo" value="FOOBAR">
        </form>
      `);
      await Promise.all([
        page.$eval('form', form => {
          return (form as HTMLFormElement).submit();
        }),
        page.waitForNavigation(),
      ]);
    });
    // @see https://github.com/puppeteer/puppeteer/issues/3973
    it('should work when header manipulation headers with redirect', async () => {
      const {page, server} = getTestState();

      server.setRedirect('/rrredirect', '/empty.html');
      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers(), {
          foo: 'bar',
        });
        request.continue({headers});
      });
      await page.goto(server.PREFIX + '/rrredirect');
    });
    // @see https://github.com/puppeteer/puppeteer/issues/4743
    it('should be able to remove headers', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers(), {
          foo: 'bar',
          origin: undefined, // remove "origin" header
        });
        request.continue({headers});
      });

      const [serverRequest] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.PREFIX + '/empty.html'),
      ]);

      expect(serverRequest.headers.origin).toBe(undefined);
    });
    it('should contain referer header', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        if (!utils.isFavicon(request)) {
          requests.push(request);
        }
        request.continue();
      });
      await page.goto(server.PREFIX + '/one-style.html');
      expect(requests[1]!.url()).toContain('/one-style.css');
      expect(requests[1]!.headers()['referer']).toContain('/one-style.html');
    });
    it('should properly return navigation response when URL has cookies', async () => {
      const {page, server} = getTestState();

      // Setup cookie.
      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({name: 'foo', value: 'bar'});

      // Setup request interception.
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue();
      });
      const response = (await page.reload())!;
      expect(response.status()).toBe(200);
    });
    it('should stop intercepting', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.once('request', request => {
        return request.continue();
      });
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(false);
      await page.goto(server.EMPTY_PAGE);
    });
    it('should show custom HTTP headers', async () => {
      const {page, server} = getTestState();

      await page.setExtraHTTPHeaders({
        foo: 'bar',
      });
      await page.setRequestInterception(true);
      page.on('request', request => {
        expect(request.headers()['foo']).toBe('bar');
        request.continue();
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.ok()).toBe(true);
    });
    // @see https://github.com/puppeteer/puppeteer/issues/4337
    it('should work with redirect inside sync XHR', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      server.setRedirect('/logo.png', '/pptr.png');
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue();
      });
      const status = await page.evaluate(async () => {
        const request = new XMLHttpRequest();
        request.open('GET', '/logo.png', false); // `false` makes the request synchronous
        request.send(null);
        return request.status;
      });
      expect(status).toBe(200);
    });
    it('should work with custom referer headers', async () => {
      const {page, server} = getTestState();

      await page.setExtraHTTPHeaders({referer: server.EMPTY_PAGE});
      await page.setRequestInterception(true);
      page.on('request', request => {
        expect(request.headers()['referer']).toBe(server.EMPTY_PAGE);
        request.continue();
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.ok()).toBe(true);
    });
    it('should be abortable', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().endsWith('.css')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      let failedRequests = 0;
      page.on('requestfailed', () => {
        return ++failedRequests;
      });
      const response = (await page.goto(server.PREFIX + '/one-style.html'))!;
      expect(response.ok()).toBe(true);
      expect(response.request().failure()).toBe(null);
      expect(failedRequests).toBe(1);
    });
    it('should be abortable with custom error codes', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.abort('internetdisconnected');
      });
      let failedRequest!: HTTPRequest;
      page.on('requestfailed', request => {
        return (failedRequest = request);
      });
      await page.goto(server.EMPTY_PAGE).catch(() => {});
      expect(failedRequest).toBeTruthy();
      expect(failedRequest.failure()!.errorText).toBe(
        'net::ERR_INTERNET_DISCONNECTED'
      );
    });
    it('should send referer', async () => {
      const {page, server} = getTestState();

      await page.setExtraHTTPHeaders({
        referer: 'http://google.com/',
      });
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue();
      });
      const [request] = await Promise.all([
        server.waitForRequest('/grid.html'),
        page.goto(server.PREFIX + '/grid.html'),
      ]);
      expect(request.headers['referer']).toBe('http://google.com/');
    });
    it('should fail navigation when aborting main resource', async () => {
      const {page, server, isChrome} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.abort();
      });
      let error!: Error;
      await page.goto(server.EMPTY_PAGE).catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeTruthy();
      if (isChrome) {
        expect(error.message).toContain('net::ERR_FAILED');
      } else {
        expect(error.message).toContain('NS_ERROR_FAILURE');
      }
    });
    it('should work with redirects', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        request.continue();
        requests.push(request);
      });
      server.setRedirect(
        '/non-existing-page.html',
        '/non-existing-page-2.html'
      );
      server.setRedirect(
        '/non-existing-page-2.html',
        '/non-existing-page-3.html'
      );
      server.setRedirect(
        '/non-existing-page-3.html',
        '/non-existing-page-4.html'
      );
      server.setRedirect('/non-existing-page-4.html', '/empty.html');
      const response = (await page.goto(
        server.PREFIX + '/non-existing-page.html'
      ))!;
      expect(response.status()).toBe(200);
      expect(response.url()).toContain('empty.html');
      expect(requests.length).toBe(5);
      expect(requests[2]!.resourceType()).toBe('document');
      // Check redirect chain
      const redirectChain = response.request().redirectChain();
      expect(redirectChain.length).toBe(4);
      expect(redirectChain[0]!.url()).toContain('/non-existing-page.html');
      expect(redirectChain[2]!.url()).toContain('/non-existing-page-3.html');
      for (let i = 0; i < redirectChain.length; ++i) {
        const request = redirectChain[i]!;
        expect(request.isNavigationRequest()).toBe(true);
        expect(request.redirectChain().indexOf(request)).toBe(i);
      }
    });
    it('should work with redirects for subresources', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        request.continue();
        if (!utils.isFavicon(request)) {
          requests.push(request);
        }
      });
      server.setRedirect('/one-style.css', '/two-style.css');
      server.setRedirect('/two-style.css', '/three-style.css');
      server.setRedirect('/three-style.css', '/four-style.css');
      server.setRoute('/four-style.css', (_req, res) => {
        return res.end('body {box-sizing: border-box; }');
      });

      const response = (await page.goto(server.PREFIX + '/one-style.html'))!;
      expect(response.status()).toBe(200);
      expect(response.url()).toContain('one-style.html');
      expect(requests.length).toBe(5);
      expect(requests[0]!.resourceType()).toBe('document');
      expect(requests[1]!.resourceType()).toBe('stylesheet');
      // Check redirect chain
      const redirectChain = requests[1]!.redirectChain();
      expect(redirectChain.length).toBe(3);
      expect(redirectChain[0]!.url()).toContain('/one-style.css');
      expect(redirectChain[2]!.url()).toContain('/three-style.css');
    });
    it('should be able to abort redirects', async () => {
      const {page, server, isChrome} = getTestState();

      await page.setRequestInterception(true);
      server.setRedirect('/non-existing.json', '/non-existing-2.json');
      server.setRedirect('/non-existing-2.json', '/simple.html');
      page.on('request', request => {
        if (request.url().includes('non-existing-2')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      await page.goto(server.EMPTY_PAGE);
      const result = await page.evaluate(async () => {
        try {
          return await fetch('/non-existing.json');
        } catch (error) {
          return (error as Error).message;
        }
      });
      if (isChrome) {
        expect(result).toContain('Failed to fetch');
      } else {
        expect(result).toContain('NetworkError');
      }
    });
    it('should work with equal requests', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      let responseCount = 1;
      server.setRoute('/zzz', (_req, res) => {
        return res.end(responseCount++ * 11 + '');
      });
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
      const results = await page.evaluate(() => {
        return Promise.all([
          fetch('/zzz')
            .then(response => {
              return response.text();
            })
            .catch(() => {
              return 'FAILED';
            }),
          fetch('/zzz')
            .then(response => {
              return response.text();
            })
            .catch(() => {
              return 'FAILED';
            }),
          fetch('/zzz')
            .then(response => {
              return response.text();
            })
            .catch(() => {
              return 'FAILED';
            }),
        ]);
      });
      expect(results).toEqual(['11', 'FAILED', '22']);
    });
    it('should navigate to dataURL and fire dataURL requests', async () => {
      const {page} = getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        requests.push(request);
        request.continue();
      });
      const dataURL = 'data:text/html,<div>yo</div>';
      const response = (await page.goto(dataURL))!;
      expect(response.status()).toBe(200);
      expect(requests.length).toBe(1);
      expect(requests[0]!.url()).toBe(dataURL);
    });
    it('should be able to fetch dataURL and fire dataURL requests', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        !utils.isFavicon(request) && requests.push(request);
        request.continue();
      });
      const dataURL = 'data:text/html,<div>yo</div>';
      const text = await page.evaluate((url: string) => {
        return fetch(url).then(r => {
          return r.text();
        });
      }, dataURL);
      expect(text).toBe('<div>yo</div>');
      expect(requests.length).toBe(1);
      expect(requests[0]!.url()).toBe(dataURL);
    });
    it('should navigate to URL with hash and fire requests without hash', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        requests.push(request);
        request.continue();
      });
      const response = (await page.goto(server.EMPTY_PAGE + '#hash'))!;
      expect(response.status()).toBe(200);
      expect(response.url()).toBe(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0]!.url()).toBe(server.EMPTY_PAGE);
    });
    it('should work with encoded server', async () => {
      const {page, server} = getTestState();

      // The requestWillBeSent will report encoded URL, whereas interception will
      // report URL as-is. @see crbug.com/759388
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue();
      });
      const response = (await page.goto(
        server.PREFIX + '/some nonexisting page'
      ))!;
      expect(response.status()).toBe(404);
    });
    it('should work with badly encoded server', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      server.setRoute('/malformed?rnd=%911', (_req, res) => {
        return res.end();
      });
      page.on('request', request => {
        return request.continue();
      });
      const response = (await page.goto(
        server.PREFIX + '/malformed?rnd=%911'
      ))!;
      expect(response.status()).toBe(200);
    });
    it('should work with encoded server - 2', async () => {
      const {page, server} = getTestState();

      // The requestWillBeSent will report URL as-is, whereas interception will
      // report encoded URL for stylesheet. @see crbug.com/759388
      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        request.continue();
        requests.push(request);
      });
      const response = (await page.goto(
        `data:text/html,<link rel="stylesheet" href="${server.PREFIX}/fonts?helvetica|arial"/>`
      ))!;
      expect(response.status()).toBe(200);
      expect(requests.length).toBe(2);
      expect(requests[1]!.response()!.status()).toBe(404);
    });
    it('should not throw "Invalid Interception Id" if the request was cancelled', async () => {
      const {page, server} = getTestState();

      await page.setContent('<iframe></iframe>');
      await page.setRequestInterception(true);
      let request!: HTTPRequest;
      page.on('request', async r => {
        return (request = r);
      });
      page.$eval(
        'iframe',
        (frame, url) => {
          return ((frame as HTMLIFrameElement).src = url as string);
        },
        server.EMPTY_PAGE
      ),
        // Wait for request interception.
        await utils.waitEvent(page, 'request');
      // Delete frame to cause request to be canceled.
      await page.$eval('iframe', frame => {
        return frame.remove();
      });
      let error!: Error;
      await request.continue().catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeUndefined();
    });
    it('should throw if interception is not enabled', async () => {
      const {page, server} = getTestState();

      let error!: Error;
      page.on('request', async request => {
        try {
          await request.continue();
        } catch (error_) {
          error = error_ as Error;
        }
      });
      await page.goto(server.EMPTY_PAGE);
      expect(error.message).toContain('Request Interception is not enabled');
    });
    it('should work with file URLs', async () => {
      const {page} = getTestState();

      await page.setRequestInterception(true);
      const urls = new Set();
      page.on('request', request => {
        urls.add(request.url().split('/').pop());
        request.continue();
      });
      await page.goto(
        pathToFileURL(path.join(__dirname, '../assets', 'one-style.html'))
      );
      expect(urls.size).toBe(2);
      expect(urls.has('one-style.html')).toBe(true);
      expect(urls.has('one-style.css')).toBe(true);
    });
    it('should not cache if cache disabled', async () => {
      const {page, server} = getTestState();

      // Load and re-load to make sure it's cached.
      await page.goto(server.PREFIX + '/cached/one-style.html');

      await page.setRequestInterception(true);
      await page.setCacheEnabled(false);
      page.on('request', request => {
        return request.continue();
      });

      const cached = [];
      page.on('requestservedfromcache', r => {
        return cached.push(r);
      });

      await page.reload();
      expect(cached.length).toBe(0);
    });
    it('should cache if cache enabled', async () => {
      const {page, server} = getTestState();

      // Load and re-load to make sure it's cached.
      await page.goto(server.PREFIX + '/cached/one-style.html');

      await page.setRequestInterception(true);
      await page.setCacheEnabled(true);
      page.on('request', request => {
        return request.continue();
      });

      const cached = [];
      page.on('requestservedfromcache', r => {
        return cached.push(r);
      });

      await page.reload();
      expect(cached.length).toBe(1);
    });
    it('should load fonts if cache enabled', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      await page.setCacheEnabled(true);
      page.on('request', request => {
        return request.continue();
      });

      const responsePromise = page.waitForResponse(r => {
        return r.url().endsWith('/one-style.woff');
      });
      await page.goto(server.PREFIX + '/cached/one-style-font.html');
      await responsePromise;
    });
  });

  describe('Request.continue', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue();
      });
      await page.goto(server.EMPTY_PAGE);
    });
    it('should amend HTTP headers', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers());
        headers['FOO'] = 'bar';
        request.continue({headers});
      });
      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => {
          return fetch('/sleep.zzz');
        }),
      ]);
      expect(request.headers['foo']).toBe('bar');
    });
    it('should redirect in a way non-observable to page', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const redirectURL = request.url().includes('/empty.html')
          ? server.PREFIX + '/consolelog.html'
          : undefined;
        request.continue({url: redirectURL});
      });
      let consoleMessage!: ConsoleMessage;
      page.on('console', msg => {
        return (consoleMessage = msg);
      });
      await page.goto(server.EMPTY_PAGE);
      expect(page.url()).toBe(server.EMPTY_PAGE);
      expect(consoleMessage.text()).toBe('yellow');
    });
    it('should amend method', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.continue({method: 'POST'});
      });
      const [request] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => {
          return fetch('/sleep.zzz');
        }),
      ]);
      expect(request.method).toBe('POST');
    });
    it('should amend post data', async () => {
      const {page, server} = getTestState();

      await page.goto(server.EMPTY_PAGE);

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.continue({postData: 'doggo'});
      });
      const [serverRequest] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => {
          return fetch('/sleep.zzz', {method: 'POST', body: 'birdy'});
        }),
      ]);
      expect(await serverRequest.postBody).toBe('doggo');
    });
    it('should amend both post data and method on navigation', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.continue({method: 'POST', postData: 'doggo'});
      });
      const [serverRequest] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      expect(serverRequest.method).toBe('POST');
      expect(await serverRequest.postBody).toBe('doggo');
    });
    it('should fail if the header value is invalid', async () => {
      const {page, server} = getTestState();

      let error!: Error;
      await page.setRequestInterception(true);
      page.on('request', async request => {
        await request
          .continue({
            headers: {
              'X-Invalid-Header': 'a\nb',
            },
          })
          .catch(error_ => {
            error = error_ as Error;
          });
        await request.continue();
      });
      await page.goto(server.PREFIX + '/empty.html');
      expect(error.message).toMatch(/Invalid header/);
    });
  });

  describe('Request.respond', function () {
    it('should work', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.respond({
          status: 201,
          headers: {
            foo: 'bar',
          },
          body: 'Yo, page!',
        });
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.status()).toBe(201);
      expect(response.headers()['foo']).toBe('bar');
      expect(
        await page.evaluate(() => {
          return document.body.textContent;
        })
      ).toBe('Yo, page!');
    });
    it('should work with status code 422', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.respond({
          status: 422,
          body: 'Yo, page!',
        });
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.status()).toBe(422);
      expect(response.statusText()).toBe('Unprocessable Entity');
      expect(
        await page.evaluate(() => {
          return document.body.textContent;
        })
      ).toBe('Yo, page!');
    });
    it('should redirect', async () => {
      const {page, server} = getTestState();

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
      const response = (await page.goto(server.PREFIX + '/rrredirect'))!;
      expect(response.request().redirectChain().length).toBe(1);
      expect(response.request().redirectChain()[0]!.url()).toBe(
        server.PREFIX + '/rrredirect'
      );
      expect(response.url()).toBe(server.EMPTY_PAGE);
    });
    it('should allow mocking multiple headers with same key', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.respond({
          status: 200,
          headers: {
            foo: 'bar',
            arr: ['1', '2'],
            'set-cookie': ['first=1', 'second=2'],
          },
          body: 'Hello world',
        });
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      const cookies = await page.cookies();
      const firstCookie = cookies.find(cookie => {
        return cookie.name === 'first';
      });
      const secondCookie = cookies.find(cookie => {
        return cookie.name === 'second';
      });
      expect(response.status()).toBe(200);
      expect(response.headers()['foo']).toBe('bar');
      expect(response.headers()['arr']).toBe('1\n2');
      // request.respond() will not trigger Network.responseReceivedExtraInfo
      // fail to get 'set-cookie' header from response
      expect(firstCookie?.value).toBe('1');
      expect(secondCookie?.value).toBe('2');
    });
    it('should allow mocking binary responses', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const imageBuffer = fs.readFileSync(
          path.join(__dirname, '../assets', 'pptr.png')
        );
        request.respond({
          contentType: 'image/png',
          body: imageBuffer,
        });
      });
      await page.evaluate(PREFIX => {
        const img = document.createElement('img');
        img.src = PREFIX + '/does-not-exist.png';
        document.body.appendChild(img);
        return new Promise(fulfill => {
          return (img.onload = fulfill);
        });
      }, server.PREFIX);
      const img = (await page.$('img'))!;
      expect(await img.screenshot()).toBeGolden('mock-binary-response.png');
    });
    it('should stringify intercepted request response headers', async () => {
      const {page, server} = getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        request.respond({
          status: 200,
          headers: {
            foo: true,
          },
          body: 'Yo, page!',
        });
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.status()).toBe(200);
      const headers = response.headers();
      expect(headers['foo']).toBe('true');
      expect(
        await page.evaluate(() => {
          return document.body.textContent;
        })
      ).toBe('Yo, page!');
    });
    it('should fail if the header value is invalid', async () => {
      const {page, server} = getTestState();

      let error!: Error;
      await page.setRequestInterception(true);
      page.on('request', async request => {
        await request
          .respond({
            headers: {
              'X-Invalid-Header': 'a\nb',
            },
          })
          .catch(error_ => {
            error = error_ as Error;
          });
        await request.respond({
          status: 200,
          body: 'Hello World',
        });
      });
      await page.goto(server.PREFIX + '/empty.html');
      expect(error.message).toMatch(/Invalid header/);
    });
  });
});

function pathToFileURL(path: string): string {
  let pathName = path.replace(/\\/g, '/');
  // Windows drive letter must be prefixed with a slash.
  if (!pathName.startsWith('/')) {
    pathName = '/' + pathName;
  }
  return 'file://' + pathName;
}
