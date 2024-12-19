/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import expect from 'expect';
import type {HTTPRequest} from 'puppeteer-core/internal/api/HTTPRequest.js';
import type {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {isFavicon, waitEvent} from './utils.js';

describe('request interception', function () {
  setupTestBrowserHooks();

  describe('Page.setRequestInterception', function () {
    it('should intercept', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      let requestError;
      page.on('request', request => {
        if (isFavicon(request)) {
          void request.continue();
          return;
        }
        try {
          expect(request).toBeTruthy();
          expect(request.url()).toContain('empty.html');
          expect(request.headers()['user-agent']).toBeTruthy();
          expect(request.method()).toBe('GET');
          expect(request.isNavigationRequest()).toBe(true);
          expect(request.frame() === page.mainFrame()).toBe(true);
          expect(request.frame()!.url()).toBe('about:blank');
        } catch (error) {
          requestError = error;
        } finally {
          void request.continue();
        }
      });

      const response = (await page.goto(server.EMPTY_PAGE))!;
      if (requestError) {
        throw requestError;
      }

      expect(response.ok()).toBe(true);
    });
    // @see https://github.com/puppeteer/puppeteer/pull/3105
    it('should work when POST is redirected with 302', async () => {
      const {page, server} = await getTestState();

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
          return form.submit();
        }),
        page.waitForNavigation(),
      ]);
    });
    // @see https://github.com/puppeteer/puppeteer/issues/3973
    it('should work when header manipulation headers with redirect', async () => {
      const {page, server} = await getTestState();

      server.setRedirect('/rrredirect', '/empty.html');
      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers(), {
          foo: 'bar',
        });
        void request.continue({headers});
      });
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.PREFIX + '/rrredirect'),
      ]);
      expect(request.headers['foo']).toBe('bar');
    });
    // @see https://github.com/puppeteer/puppeteer/issues/4743
    it('should be able to remove headers', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers(), {
          foo: 'bar',
          origin: undefined, // remove "origin" header
        });
        void request.continue({headers});
      });

      const [serverRequest] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.PREFIX + '/empty.html'),
      ]);

      expect(serverRequest.headers.origin).toBe(undefined);
    });
    it('should contain referer header', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        if (!isFavicon(request)) {
          requests.push(request);
        }
        void request.continue();
      });
      await page.goto(server.PREFIX + '/one-style.html');
      expect(requests[1]!.url()).toContain('/one-style.css');
      expect(requests[1]!.headers()['referer']).toContain('/one-style.html');
    });
    it('should work with requests without networkId', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);

      const cdp = await page.createCDPSession();
      await cdp.send('DOM.enable');
      const urls: string[] = [];
      page.on('request', request => {
        void request.continue();
        if (isFavicon(request)) {
          return;
        }
        urls.push(request.url());
      });
      // This causes network requests without networkId.
      await cdp.send('CSS.enable');
      expect(urls).toStrictEqual([server.EMPTY_PAGE]);
    });
    it('should properly return navigation response when URL has cookies', async () => {
      const {page, server} = await getTestState();

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
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.once('request', request => {
        return request.continue();
      });
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(false);
      await page.goto(server.EMPTY_PAGE);
    });
    it('should show custom HTTP headers', async () => {
      const {page, server} = await getTestState();

      await page.setExtraHTTPHeaders({
        foo: 'bar',
      });
      await page.setRequestInterception(true);
      let requestError;
      page.on('request', request => {
        try {
          expect(request.headers()['foo']).toBe('bar');
        } catch (error) {
          requestError = error;
        } finally {
          void request.continue();
        }
      });

      const response = (await page.goto(server.EMPTY_PAGE))!;
      if (requestError) {
        throw requestError;
      }
      expect(response.ok()).toBe(true);
    });
    // @see https://github.com/puppeteer/puppeteer/issues/4337
    it('should work with redirect inside sync XHR', async () => {
      const {page, server} = await getTestState();

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
      const {page, server} = await getTestState();

      await page.setExtraHTTPHeaders({referer: server.EMPTY_PAGE});
      await page.setRequestInterception(true);
      let request!: HTTPRequest;
      page.on('request', req => {
        request = req;
        void request.continue();
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(request.headers()['referer']).toBe(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
    });
    it('should be abortable', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().endsWith('.css')) {
          void request.abort();
        } else {
          void request.continue();
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
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.abort('internetdisconnected');
      });
      const [failedRequest] = await Promise.all([
        waitEvent<HTTPRequest>(page, 'requestfailed'),
        page.goto(server.EMPTY_PAGE).catch(() => {}),
      ]);

      expect(failedRequest).toBeTruthy();
      expect(failedRequest.failure()!.errorText).toBe(
        'net::ERR_INTERNET_DISCONNECTED',
      );
    });
    it('should send referer', async () => {
      const {page, server} = await getTestState();

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
      const {page, server, isChrome} = await getTestState();

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
        expect(error.message).toContain('NS_ERROR_ABORT');
      }
    });
    it('should work with redirects', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue();
        if (!isFavicon(request)) {
          requests.push(request);
        }
      });
      server.setRedirect(
        '/non-existing-page.html',
        '/non-existing-page-2.html',
      );
      server.setRedirect(
        '/non-existing-page-2.html',
        '/non-existing-page-3.html',
      );
      server.setRedirect(
        '/non-existing-page-3.html',
        '/non-existing-page-4.html',
      );
      server.setRedirect('/non-existing-page-4.html', '/empty.html');
      const response = (await page.goto(
        server.PREFIX + '/non-existing-page.html',
      ))!;
      expect(response.status()).toBe(200);
      expect(response.url()).toContain('empty.html');
      expect(requests).toHaveLength(5);
      // Check redirect chain
      const redirectChain = response.request().redirectChain();
      expect(redirectChain).toHaveLength(4);
      expect(redirectChain[0]!.url()).toContain('/non-existing-page.html');
      expect(redirectChain[2]!.url()).toContain('/non-existing-page-3.html');
      for (let i = 0; i < redirectChain.length; ++i) {
        const request = redirectChain[i]!;
        expect(request.isNavigationRequest()).toBe(true);
        expect(request.redirectChain().indexOf(request)).toBe(i);
      }
    });
    it('should work with redirects for subresources', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue();
        if (!isFavicon(request)) {
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
      expect(requests).toHaveLength(5);
      // Check redirect chain
      const redirectChain = requests[1]!.redirectChain();
      expect(redirectChain).toHaveLength(3);
      expect(redirectChain[0]!.url()).toContain('/one-style.css');
      expect(redirectChain[2]!.url()).toContain('/three-style.css');
    });
    it('should be able to abort redirects', async () => {
      const {page, server, isChrome} = await getTestState();

      await page.setRequestInterception(true);
      server.setRedirect('/non-existing.json', '/non-existing-2.json');
      server.setRedirect('/non-existing-2.json', '/simple.html');
      page.on('request', request => {
        if (request.url().includes('non-existing-2')) {
          void request.abort();
        } else {
          void request.continue();
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
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      let responseCount = 1;
      server.setRoute('/zzz', (_req, res) => {
        return res.end(responseCount++ * 11 + '');
      });
      await page.setRequestInterception(true);

      let spinner = false;
      // Cancel 2nd request.
      page.on('request', request => {
        if (isFavicon(request)) {
          void request.continue();
          return;
        }
        void (spinner ? request.abort() : request.continue());
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
      const {page} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue();
        if (!isFavicon(request)) {
          requests.push(request);
        }
      });
      const dataURL = 'data:text/html,<div>yo</div>';
      const response = (await page.goto(dataURL))!;
      expect(response.status()).toBe(200);
      expect(requests).toHaveLength(1);
      expect(requests[0]!.url()).toBe(dataURL);
    });
    it('should be able to fetch dataURL and fire dataURL requests', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue();
        if (!isFavicon(request)) {
          requests.push(request);
        }
      });
      const dataURL = 'data:text/html,<div>yo</div>';
      const text = await page.evaluate(url => {
        return fetch(url).then(r => {
          return r.text();
        });
      }, dataURL);
      expect(text).toBe('<div>yo</div>');
      expect(requests).toHaveLength(1);
      expect(requests[0]!.url()).toBe(dataURL);
    });
    it('should navigate to URL with hash and fire requests without hash', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue();
        if (!isFavicon(request)) {
          requests.push(request);
        }
      });
      const response = (await page.goto(server.EMPTY_PAGE + '#hash'))!;
      expect(response.status()).toBe(200);
      expect(response.url()).toBe(server.EMPTY_PAGE + '#hash');
      expect(requests).toHaveLength(1);
      expect(requests[0]!.url()).toBe(server.EMPTY_PAGE + '#hash');
    });
    it('should work with encoded server', async () => {
      const {page, server} = await getTestState();

      // The requestWillBeSent will report encoded URL, whereas interception will
      // report URL as-is. @see crbug.com/759388
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue();
      });
      const response = (await page.goto(
        server.PREFIX + '/some nonexisting page',
      ))!;
      expect(response.status()).toBe(404);
    });
    it('should work with badly encoded server', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      server.setRoute('/malformed', (_req, res) => {
        return res.end();
      });
      page.on('request', request => {
        return request.continue();
      });
      const response = (await page.goto(
        server.PREFIX + '/malformed?rnd=%911',
      ))!;
      expect(response.status()).toBe(200);
    });
    it('should work with missing stylesheets', async () => {
      const {page, server} = await getTestState();

      // The requestWillBeSent will report URL as-is, whereas interception will
      // report encoded URL for stylesheet. @see crbug.com/759388
      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue();
        if (!isFavicon(request)) {
          requests.push(request);
        }
      });
      const response = (await page.goto(server.PREFIX + '/style-404.html'))!;
      expect(response.status()).toBe(200);
      expect(requests).toHaveLength(2);
      expect(requests[1]!.response()!.status()).toBe(404);
    });
    it('should not throw "Invalid Interception Id" if the request was cancelled', async () => {
      const {page, server} = await getTestState();

      await page.setContent('<iframe></iframe>');
      await page.setRequestInterception(true);
      let request!: HTTPRequest;
      page.on('request', async r => {
        return (request = r);
      });
      void (page.$eval(
        'iframe',
        (frame, url) => {
          return (frame.src = url);
        },
        server.EMPTY_PAGE,
      ),
      // Wait for request interception.
      await waitEvent(page, 'request'));
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
      const {page, server} = await getTestState();

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
      const {page} = await getTestState();

      await page.setRequestInterception(true);
      const urls = new Set();
      page.on('request', request => {
        urls.add(request.url().split('/').pop());
        void request.continue();
      });
      await page.goto(
        pathToFileURL(path.join(__dirname, '../assets', 'one-style.html')),
      );
      expect(urls.size).toBe(2);
      expect(urls.has('one-style.html')).toBe(true);
      expect(urls.has('one-style.css')).toBe(true);
    });

    for (const {resourceType, url, cachedResourceUrl} of [
      {
        url: '/cached/one-style.html',
        cachedResourceUrl: '/cached/one-style.css',
        resourceType: 'stylesheet',
      },
      {
        url: '/cached/one-script.html',
        cachedResourceUrl: '/cached/one-script.js',
        resourceType: 'script',
      },
    ]) {
      it(`should not cache ${resourceType} if cache disabled`, async () => {
        const {page, server} = await getTestState();

        // Load and re-load to make sure it's cached.
        await page.goto(server.PREFIX + url);

        await page.setRequestInterception(true);
        await page.setCacheEnabled(false);
        page.on('request', request => {
          return request.continue();
        });

        const cached: HTTPRequest[] = [];
        page.on('requestservedfromcache', r => {
          return cached.push(r);
        });

        await page.reload();
        expect(cached).toHaveLength(0);
      });
      it(`should cache ${resourceType} if cache enabled`, async () => {
        const {page, server} = await getTestState();

        // Load and re-load to make sure it's cached.
        await page.goto(server.PREFIX + url);

        await page.setRequestInterception(true);
        await page.setCacheEnabled(true);
        let error: Error | undefined;
        page.on('request', async request => {
          await request.continue().catch(_error => {
            error = _error;
          });
        });

        const cached: HTTPRequest[] = [];
        page.on('requestservedfromcache', r => {
          if (isFavicon(r)) {
            return;
          }
          return cached.push(r);
        });

        await page.reload();
        expect(error).toBeUndefined();
        expect(cached).toHaveLength(1);
        expect(cached[0]!.url()).toBe(server.PREFIX + cachedResourceUrl);
      });
    }
    it('should load fonts if cache enabled', async () => {
      const {page, server} = await getTestState();

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
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue();
      });
      await page.goto(server.EMPTY_PAGE);
    });
    it('should amend HTTP headers', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers());
        headers['FOO'] = 'bar';
        void request.continue({headers});
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
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const redirectURL = request.url().includes('/empty.html')
          ? server.PREFIX + '/consolelog.html'
          : undefined;
        void request.continue({url: redirectURL});
      });
      const [consoleMessage] = await Promise.all([
        waitEvent<ConsoleMessage>(page, 'console'),
        page.goto(server.EMPTY_PAGE),
      ]);
      expect(page.url()).toBe(server.EMPTY_PAGE);
      expect(consoleMessage.text()).toBe('yellow');
    });
    it('should amend method', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue({method: 'POST'});
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
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue({postData: '🐶'});
      });
      const [serverRequest] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => {
          return fetch('/sleep.zzz', {method: 'POST', body: '🐦'});
        }),
      ]);
      expect(await serverRequest.postBody).toBe('🐶');
    });
    it('should amend both post data and method on navigation', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue({method: 'POST', postData: '🐶'});
      });
      const [serverRequest] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      expect(serverRequest.method).toBe('POST');
      expect(await serverRequest.postBody).toBe('🐶');
    });
    it('should fail if the header value is invalid', async () => {
      const {page, server} = await getTestState();

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
      expect(error.message).toMatch(
        /Invalid header|Expected "header"|invalid argument/,
      );
    });
  });

  describe('Request.respond', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond({
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
        }),
      ).toBe('Yo, page!');
    });
    it('should work with status code 422', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond({
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
        }),
      ).toBe('Yo, page!');
    });
    it('should redirect', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        if (!request.url().includes('rrredirect')) {
          void request.continue();
          return;
        }
        void request.respond({
          status: 302,
          headers: {
            location: server.EMPTY_PAGE,
          },
        });
      });
      const response = (await page.goto(server.PREFIX + '/rrredirect'))!;
      expect(response.request().redirectChain()).toHaveLength(1);
      expect(response.request().redirectChain()[0]!.url()).toBe(
        server.PREFIX + '/rrredirect',
      );
      expect(response.url()).toBe(server.EMPTY_PAGE);
    });
    it('should allow mocking multiple headers with same key', async () => {
      const {isFirefox, page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond({
          status: 200,
          headers: {
            foo: 'bar',
            arr: ['1', '2'],
            'set-cookie': ['first=1', 'second=2'],
          },
          body: 'Hello 🌐',
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

      // The separator used to handle headers with multiple values is browser
      // specific.
      // Per https://www.rfc-editor.org/rfc/rfc9110.html#section-5.2 the default
      // should be a list of comma separated values with optional whitespace.
      // Per note in https://www.rfc-editor.org/rfc/rfc9110.html#section-5.3,
      // clients are also allowed to use other separators for special cases.
      // However Chrome DevTools do return comma separated values for headers
      // with multiple values, so this might be a bug.
      if (isFirefox) {
        expect(response.headers()['arr']).toBe('1, 2');
      } else {
        expect(response.headers()['arr']).toBe('1\n2');
      }
      // request.respond() will not trigger Network.responseReceivedExtraInfo
      // fail to get 'set-cookie' header from response
      expect(firstCookie?.value).toBe('1');
      expect(secondCookie?.value).toBe('2');
    });
    it('should allow mocking binary responses', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const imageBuffer = fs.readFileSync(
          path.join(__dirname, '../assets', 'pptr.png'),
        );
        void request.respond({
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
      using img = (await page.$('img'))!;
      expect(await img.screenshot()).toBeGolden('mock-binary-response.png');
    });
    it('should stringify intercepted request response headers', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond({
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
        }),
      ).toBe('Yo, page!');
    });
    it('should fail if the header value is invalid', async () => {
      const {page, server} = await getTestState();

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
          body: 'Hello 🌐',
        });
      });
      await page.goto(server.PREFIX + '/empty.html');
      expect(error.message).toMatch(
        /Invalid header|Expected "header"|invalid argument/,
      );
    });

    it('should report correct content-length header with string', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond({
          status: 200,
          body: 'Correct length 📏?',
        });
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      const headers = response.headers();
      expect(headers['content-length']).toBe('20');
    });

    it('should report correct content-length header with string', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond({
          status: 200,
          body: Buffer.from('Correct length 📏?'),
        });
      });
      const response = (await page.goto(server.EMPTY_PAGE))!;
      const headers = response.headers();
      expect(headers['content-length']).toBe('20');
    });
  });

  describe('Request.resourceType', () => {
    it('should work for document type', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue();
      });
      const response = await page.goto(server.EMPTY_PAGE);
      const request = response!.request();
      expect(request.resourceType()).toBe('document');
    });

    it('should work for stylesheets', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const cssRequests: HTTPRequest[] = [];
      page.on('request', request => {
        if (request.url().endsWith('css')) {
          cssRequests.push(request);
        }
        void request.continue();
      });
      await page.goto(server.PREFIX + '/one-style.html');
      expect(cssRequests).toHaveLength(1);
      const request = cssRequests[0]!;
      expect(request.url()).toContain('one-style.css');
      expect(request.resourceType()).toBe('stylesheet');
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
