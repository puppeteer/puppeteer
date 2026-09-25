/**
 * @license
 * Copyright 2021 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import {assert} from 'chai';
import {
  type ActionResult,
  type HTTPRequest,
  InterceptResolutionAction,
} from 'puppeteer-core/internal/api/HTTPRequest.js';
import type {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {assertGolden, html, isFavicon, waitEvent} from './utils.js';

describe('cooperative request interception', function () {
  setupTestBrowserHooks();

  describe('Page.setRequestInterception', function () {
    const expectedActions: ActionResult[] = ['abort', 'continue', 'respond'];
    for (const expectedAction of expectedActions) {
      it(`should cooperatively ${expectedAction} by priority`, async () => {
        const {page, server} = await getTestState();

        const actionResults: ActionResult[] = [];
        await page.setRequestInterception(true);
        page.on('request', request => {
          if (request.url().endsWith('.css')) {
            void request.continue(
              {headers: {...request.headers(), xaction: 'continue'}},
              expectedAction === 'continue' ? 1 : 0,
            );
          } else {
            void request.continue({}, 0);
          }
        });
        page.on('request', request => {
          if (request.url().endsWith('.css')) {
            void request.respond(
              {headers: {xaction: 'respond'}},
              expectedAction === 'respond' ? 1 : 0,
            );
          } else {
            void request.continue({}, 0);
          }
        });
        page.on('request', request => {
          if (request.url().endsWith('.css')) {
            void request.abort('aborted', expectedAction === 'abort' ? 1 : 0);
          } else {
            void request.continue({}, 0);
          }
        });
        page.on('response', response => {
          const {xaction} = response!.headers();
          if (response!.url().endsWith('.css') && !!xaction) {
            actionResults.push(xaction as ActionResult);
          }
        });
        page.on('requestfailed', request => {
          if (request.url().endsWith('.css')) {
            actionResults.push('abort');
          }
        });

        const response = (await (async () => {
          if (expectedAction === 'continue') {
            const [serverRequest, response] = await Promise.all([
              server.waitForRequest('/one-style.css'),
              page.goto(server.PREFIX + '/one-style.html'),
            ]);
            actionResults.push(
              serverRequest.headers['xaction'] as ActionResult,
            );
            return response;
          } else {
            return await page.goto(server.PREFIX + '/one-style.html');
          }
        })())!;

        assert.lengthOf(actionResults, 1);
        assert.strictEqual(actionResults[0], expectedAction);
        assert.isTrue(response!.ok());
      });
    }

    it('should intercept', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      let requestError;
      page.on('request', request => {
        if (isFavicon(request)) {
          void request.continue({}, 0);
          return;
        }
        try {
          assert.ok(request);
          assert.include(request.url(), 'empty.html');
          assert.ok(request.headers()['user-agent']);
          assert.strictEqual(request.method(), 'GET');
          assert.isTrue(request.isNavigationRequest());
          assert.isTrue(request.frame() === page.mainFrame());
          assert.strictEqual(request.frame()!.url(), 'about:blank');
        } catch (error) {
          requestError = error;
        } finally {
          void request.continue({}, 0);
        }
      });

      const response = (await page.goto(server.EMPTY_PAGE))!;
      if (requestError) {
        throw requestError;
      }

      assert.isTrue(response.ok());
    });
    // @see https://github.com/puppeteer/puppeteer/pull/3105
    it('should work when POST is redirected with 302', async () => {
      const {page, server} = await getTestState();

      server.setRedirect('/rredirect', '/empty.html');
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue({}, 0);
      });
      await page.setContent(html`
        <form
          action="/rredirect"
          method="post"
        >
          <input
            type="hidden"
            id="foo"
            name="foo"
            value="FOOBAR"
          />
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
      let requestError;
      page.on('request', request => {
        const headers = Object.assign({}, request.headers(), {
          foo: 'bar',
        });
        void request.continue({headers}, 0);
        try {
          assert.deepEqual(request.continueRequestOverrides(), {headers});
        } catch (error) {
          requestError = error;
        }
      });
      // Make sure that the goto does not time out.
      await page.goto(server.PREFIX + '/rrredirect');

      if (requestError) {
        throw requestError;
      }
    });
    // @see https://github.com/puppeteer/puppeteer/issues/4743
    it('should be able to remove headers', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers(), {
          foo: 'bar',
          accept: undefined, // remove "accept" header
        });
        void request.continue({headers}, 0);
      });

      const [serverRequest] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.PREFIX + '/empty.html'),
      ]);

      assert.isUndefined(serverRequest.headers.accept);
    });
    it('should contain referer header', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue({}, 0);
        if (!isFavicon(request)) {
          requests.push(request);
        }
      });
      await page.goto(server.PREFIX + '/one-style.html');
      assert.include(requests[1]!.url(), '/one-style.css');
      assert.include(requests[1]!.headers()['referer'], '/one-style.html');
    });
    it('should properly return navigation response when URL has cookies', async () => {
      const {page, server} = await getTestState();

      // Setup cookie.
      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({name: 'foo', value: 'bar'});

      // Setup request interception.
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue({}, 0);
      });
      const response = await page.reload();
      assert.strictEqual(response!.status(), 200);
    });
    it('should stop intercepting', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.once('request', request => {
        return request.continue({}, 0);
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
          assert.strictEqual(request.headers()['foo'], 'bar');
        } catch (error) {
          requestError = error;
        } finally {
          void request.continue({}, 0);
        }
      });
      const response = await page.goto(server.EMPTY_PAGE);
      if (requestError) {
        throw requestError;
      }
      assert.isTrue(response!.ok());
    });
    // @see https://github.com/puppeteer/puppeteer/issues/4337
    it('should work with redirect inside sync XHR', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      server.setRedirect('/logo.png', '/pptr.png');
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue({}, 0);
      });
      const status = await page.evaluate(async () => {
        const request = new XMLHttpRequest();
        request.open('GET', '/logo.png', false); // `false` makes the request synchronous
        request.send(null);
        return request.status;
      });
      assert.strictEqual(status, 200);
    });
    it('should work with custom referer headers', async () => {
      const {page, server} = await getTestState();

      await page.setExtraHTTPHeaders({referer: server.EMPTY_PAGE});
      await page.setRequestInterception(true);
      let requestError;
      page.on('request', request => {
        try {
          assert.strictEqual(request.headers()['referer'], server.EMPTY_PAGE);
        } catch (error) {
          requestError = error;
        } finally {
          void request.continue({}, 0);
        }
      });
      const response = await page.goto(server.EMPTY_PAGE);
      if (requestError) {
        throw requestError;
      }
      assert.isTrue(response!.ok());
    });
    it('should be abortable', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().endsWith('.css')) {
          void request.abort('failed', 0);
        } else {
          void request.continue({}, 0);
        }
      });
      let failedRequests = 0;
      page.on('requestfailed', () => {
        return ++failedRequests;
      });
      const response = await page.goto(server.PREFIX + '/one-style.html');
      assert.isTrue(response!.ok());
      assert.isNull(response!.request().failure());
      assert.strictEqual(failedRequests, 1);
    });
    it('should be able to access the error reason', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.abort('failed', 0);
      });
      let abortReason = null;
      page.on('request', request => {
        abortReason = request.abortErrorReason();
        void request.continue({}, 0);
      });
      await page.goto(server.EMPTY_PAGE).catch(() => {});
      assert.strictEqual(abortReason, 'Failed');
    });
    it('should be abortable with custom error codes', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.abort('internetdisconnected', 0);
      });

      const [failedRequest] = await Promise.all([
        waitEvent<HTTPRequest>(page, 'requestfailed'),
        page.goto(server.EMPTY_PAGE).catch(() => {}),
      ]);
      assert.ok(failedRequest);
      assert.strictEqual(
        failedRequest.failure()!.errorText,
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
        return request.continue({}, 0);
      });
      const [request] = await Promise.all([
        server.waitForRequest('/grid.html'),
        page.goto(server.PREFIX + '/grid.html'),
      ]);
      assert.strictEqual(request.headers['referer'], 'http://google.com/');
    });
    it('should fail navigation when aborting main resource', async () => {
      const {page, server, isChrome} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.abort('failed', 0);
      });
      let error!: Error;
      await page.goto(server.EMPTY_PAGE).catch(error_ => {
        return (error = error_);
      });
      assert.ok(error);
      if (isChrome) {
        assert.include(error.message, 'net::ERR_FAILED');
      } else {
        assert.include(error.message, 'NS_ERROR_ABORT');
      }
    });
    it('should work with redirects', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue({}, 0);
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
      const response = await page.goto(
        server.PREFIX + '/non-existing-page.html',
      );
      assert.strictEqual(response!.status(), 200);
      assert.include(response!.url(), 'empty.html');
      assert.lengthOf(requests, 5);
      // Check redirect chain
      const redirectChain = response!.request().redirectChain();
      assert.lengthOf(redirectChain, 4);
      assert.include(redirectChain[0]!.url(), '/non-existing-page.html');
      assert.include(redirectChain[2]!.url(), '/non-existing-page-3.html');
      for (let i = 0; i < redirectChain.length; ++i) {
        const request = redirectChain[i]!;
        assert.isTrue(request.isNavigationRequest());
        assert.strictEqual(request.redirectChain().indexOf(request), i);
      }
    });
    it('should work with redirects for subresources', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue({}, 0);
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

      const response = await page.goto(server.PREFIX + '/one-style.html');
      assert.strictEqual(response!.status(), 200);
      assert.include(response!.url(), 'one-style.html');
      assert.lengthOf(requests, 5);
      // Check redirect chain
      const redirectChain = requests[1]!.redirectChain();
      assert.lengthOf(redirectChain, 3);
      assert.include(redirectChain[0]!.url(), '/one-style.css');
      assert.include(redirectChain[2]!.url(), '/three-style.css');
    });
    it('should be able to abort redirects', async () => {
      const {page, server, isChrome} = await getTestState();

      await page.setRequestInterception(true);
      server.setRedirect('/non-existing.json', '/non-existing-2.json');
      server.setRedirect('/non-existing-2.json', '/simple.html');
      page.on('request', request => {
        if (request.url().includes('non-existing-2')) {
          void request.abort('failed', 0);
        } else {
          void request.continue({}, 0);
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
        assert.include(result, 'Failed to fetch');
      } else {
        assert.include(result, 'NetworkError');
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
          void request.continue({}, 0);
          return;
        }
        void (spinner ? request.abort('failed', 0) : request.continue({}, 0));
        spinner = !spinner;
      });
      const results = await page.evaluate(() => {
        return Promise.all([
          fetch('/zzz')
            .then(response => {
              return response!.text();
            })
            .catch(() => {
              return 'FAILED';
            }),
          fetch('/zzz')
            .then(response => {
              return response!.text();
            })
            .catch(() => {
              return 'FAILED';
            }),
          fetch('/zzz')
            .then(response => {
              return response!.text();
            })
            .catch(() => {
              return 'FAILED';
            }),
        ]);
      });
      assert.deepEqual(results, ['11', 'FAILED', '22']);
    });
    it('should navigate to dataURL and fire dataURL requests', async () => {
      const {page} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        if (!isFavicon(request)) {
          requests.push(request);
        }
        void request.continue({}, 0);
      });
      const dataURL = 'data:text/html,<div>yo</div>';
      const response = await page.goto(dataURL);
      assert.strictEqual(response!.status(), 200);
      assert.lengthOf(requests, 1);
      assert.strictEqual(requests[0]!.url(), dataURL);
    });
    it('should be able to fetch dataURL and fire dataURL requests', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue({}, 0);
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
      assert.strictEqual(text, '<div>yo</div>');
      assert.lengthOf(requests, 1);
      assert.strictEqual(requests[0]!.url(), dataURL);
    });
    it('should navigate to URL with hash and fire requests without hash', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        if (!isFavicon(request)) {
          requests.push(request);
        }
        void request.continue({}, 0);
      });
      const response = await page.goto(server.EMPTY_PAGE + '#hash');
      assert.strictEqual(response!.status(), 200);
      assert.strictEqual(response!.url(), server.EMPTY_PAGE + '#hash');
      assert.lengthOf(requests, 1);
      assert.strictEqual(requests[0]!.url(), server.EMPTY_PAGE + '#hash');
    });
    it('should work with encoded server', async () => {
      const {page, server} = await getTestState();

      // The requestWillBeSent will report encoded URL, whereas interception will
      // report URL as-is. @see crbug.com/759388
      await page.setRequestInterception(true);
      page.on('request', request => {
        return request.continue({}, 0);
      });
      const response = await page.goto(
        server.PREFIX + '/some nonexisting page',
      );
      assert.strictEqual(response!.status(), 404);
    });
    it('should work with badly encoded server', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      server.setRoute('/malformed', (_req, res) => {
        return res.end();
      });
      page.on('request', request => {
        return request.continue({}, 0);
      });
      const response = await page.goto(server.PREFIX + '/malformed?rnd=%911');
      assert.strictEqual(response!.status(), 200);
    });
    it('should work with missing stylesheets', async () => {
      const {page, server} = await getTestState();

      // The requestWillBeSent will report URL as-is, whereas interception will
      // report encoded URL for stylesheet. @see crbug.com/759388
      await page.setRequestInterception(true);
      const requests: HTTPRequest[] = [];
      page.on('request', request => {
        void request.continue({}, 0);
        if (!isFavicon(request)) {
          requests.push(request);
        }
      });
      const response = (await page.goto(server.PREFIX + '/style-404.html'))!;
      assert.strictEqual(response.status(), 200);
      assert.lengthOf(requests, 2);
      assert.strictEqual(requests[1]!.response()!.status(), 404);
    });
    it('should not throw "Invalid Interception Id" if the request was cancelled', async () => {
      const {page, server} = await getTestState();

      await page.setContent(html`<iframe></iframe>`);
      await page.setRequestInterception(true);
      let request!: HTTPRequest;
      page.on('request', async r => {
        return (request = r);
      });
      void (page.$eval(
        'iframe',
        (frame, url) => {
          return (frame.src = url as string);
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
      await request.continue({}, 0).catch(error_ => {
        return (error = error_);
      });
      assert.isUndefined(error);
    });
    it('should throw if interception is not enabled', async () => {
      const {page, server} = await getTestState();

      let error!: Error;
      page.on('request', async request => {
        try {
          await request.continue({}, 0);
        } catch (error_) {
          error = error_ as Error;
        }
      });
      await page.goto(server.EMPTY_PAGE);
      assert.include(error.message, 'Request Interception is not enabled');
    });
    it('should work with file URLs', async () => {
      const {page} = await getTestState();

      await page.setRequestInterception(true);
      const urls = new Set();
      page.on('request', request => {
        urls.add(request.url().split('/').pop());
        void request.continue({}, 0);
      });
      await page.goto(
        pathToFileURL(
          path.join(import.meta.dirname, '../assets', 'one-style.html'),
        ),
      );
      assert.strictEqual(urls.size, 2);
      assert.isTrue(urls.has('one-style.html'));
      assert.isTrue(urls.has('one-style.css'));
    });
    for (const {resourceType, url} of [
      {url: '/cached/one-style.html', resourceType: 'stylesheet'},
      {url: '/cached/one-script.html', resourceType: 'script'},
    ]) {
      it(`should not cache ${resourceType} if cache disabled`, async () => {
        const {page, server} = await getTestState();

        // Load and re-load to make sure it's cached.
        await page.goto(server.PREFIX + url);

        await page.setRequestInterception(true);
        await page.setCacheEnabled(false);
        page.on('request', request => {
          return request.continue({}, 0);
        });

        const cached: HTTPRequest[] = [];
        page.on('requestservedfromcache', r => {
          return cached.push(r);
        });

        await page.reload();
        assert.lengthOf(cached, 0);
      });
      it(`should cache ${resourceType} if cache enabled`, async () => {
        const {page, server} = await getTestState();

        // Load and re-load to make sure it's cached.
        await page.goto(server.PREFIX + url);

        await page.setRequestInterception(true);
        await page.setCacheEnabled(true);
        page.on('request', request => {
          return request.continue({}, 0);
        });

        const cached: HTTPRequest[] = [];
        page.on('requestservedfromcache', r => {
          return cached.push(r);
        });

        await page.reload();
        assert.lengthOf(cached, 1);
      });
    }
    it('should load fonts if cache enabled', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      await page.setCacheEnabled(true);
      page.on('request', request => {
        return request.continue({}, 0);
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
        return request.continue({}, 0);
      });
      await page.goto(server.EMPTY_PAGE);
    });
    it('should amend HTTP headers', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers());
        headers['FOO'] = 'bar';
        void request.continue({headers}, 0);
      });
      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => {
          return fetch('/sleep.zzz');
        }),
      ]);
      assert.strictEqual(request.headers['foo'], 'bar');
    });
    it('should redirect in a way non-observable to page', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const redirectURL = request.url().includes('/empty.html')
          ? server.PREFIX + '/consolelog.html'
          : undefined;
        void request.continue({url: redirectURL}, 0);
      });

      const [consoleMessage] = await Promise.all([
        waitEvent<ConsoleMessage>(page, 'console'),
        page.goto(server.EMPTY_PAGE),
      ]);
      assert.strictEqual(page.url(), server.EMPTY_PAGE);
      assert.strictEqual(consoleMessage.text(), 'yellow');
    });
    it('should amend method', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue({method: 'POST'}, 0);
      });
      const [request] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => {
          return fetch('/sleep.zzz');
        }),
      ]);
      assert.strictEqual(request.method, 'POST');
    });
    it('should amend post data', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue({postData: 'doggo'}, 0);
      });
      const [serverRequest] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => {
          return fetch('/sleep.zzz', {method: 'POST', body: 'birdy'});
        }),
      ]);
      assert.strictEqual(await serverRequest.postBody, 'doggo');
    });
    it('should amend both post data and method on navigation', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue({method: 'POST', postData: 'doggo'}, 0);
      });
      const [serverRequest] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      assert.strictEqual(serverRequest.method, 'POST');
      assert.strictEqual(await serverRequest.postBody, 'doggo');
    });
  });

  describe('Request.respond', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond(
          {
            status: 201,
            headers: {
              foo: 'bar',
            },
            body: 'Yo, page!',
          },
          0,
        );
      });
      const response = await page.goto(server.EMPTY_PAGE);
      assert.strictEqual(response!.status(), 201);
      assert.strictEqual(response!.headers()['foo'], 'bar');
      assert.strictEqual(
        await page.evaluate(() => {
          return document.body.textContent;
        }),
        'Yo, page!',
      );
    });
    it('should be able to access the response', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond(
          {
            status: 200,
            body: 'Yo, page!',
          },
          0,
        );
      });
      let response = null;
      page.on('request', request => {
        response = request.responseForRequest();
        void request.continue({}, 0);
      });
      await page.goto(server.EMPTY_PAGE);
      assert.deepEqual(response, {status: 200, body: 'Yo, page!'});
    });
    it('should work with status code 422', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond(
          {
            status: 422,
            body: 'Yo, page!',
          },
          0,
        );
      });
      const response = await page.goto(server.EMPTY_PAGE);
      assert.strictEqual(response!.status(), 422);
      assert.strictEqual(response!.statusText(), 'Unprocessable Entity');
      assert.strictEqual(
        await page.evaluate(() => {
          return document.body.textContent;
        }),
        'Yo, page!',
      );
    });
    it('should redirect', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        if (!request.url().includes('rrredirect')) {
          void request.continue({}, 0);
          return;
        }
        void request.respond(
          {
            status: 302,
            headers: {
              location: server.EMPTY_PAGE,
            },
          },
          0,
        );
      });
      const response = await page.goto(server.PREFIX + '/rrredirect');
      assert.lengthOf(response!.request().redirectChain(), 1);
      assert.strictEqual(
        response!.request().redirectChain()[0]!.url(),
        server.PREFIX + '/rrredirect',
      );
      assert.strictEqual(response!.url(), server.EMPTY_PAGE);
    });
    it('should allow mocking binary responses', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        const imageBuffer = fs.readFileSync(
          path.join(import.meta.dirname, '../assets', 'pptr.png'),
        );
        void request.respond(
          {
            contentType: 'image/png',
            body: imageBuffer,
          },
          0,
        );
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
      assertGolden(await img.screenshot(), 'mock-binary-response.png');
    });
    it('should stringify intercepted request response headers', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.respond(
          {
            status: 200,
            headers: {
              foo: true,
            },
            body: 'Yo, page!',
          },
          0,
        );
      });
      const response = await page.goto(server.EMPTY_PAGE);
      assert.strictEqual(response!.status(), 200);
      const headers = response!.headers();
      assert.strictEqual(headers['foo'], 'true');
      assert.strictEqual(
        await page.evaluate(() => {
          return document.body.textContent;
        }),
        'Yo, page!',
      );
    });
    it('should indicate already-handled if an intercept has been handled', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue();
      });
      let requestError;
      page.on('request', request => {
        try {
          assert.ok(request.isInterceptResolutionHandled());
        } catch (error) {
          requestError = error;
        }
      });
      page.on('request', request => {
        const {action} = request.interceptResolutionState();
        try {
          assert.strictEqual(action, InterceptResolutionAction.AlreadyHandled);
        } catch (error) {
          requestError = error;
        }
      });
      await page.goto(server.EMPTY_PAGE);
      if (requestError) {
        throw requestError;
      }
    });
  });

  describe('Request.resourceType', () => {
    it('should work for document type', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      page.on('request', request => {
        void request.continue({}, 0);
      });
      const response = await page.goto(server.EMPTY_PAGE);
      const request = response!.request();
      assert.strictEqual(request.resourceType(), 'document');
    });

    it('should work for stylesheets', async () => {
      const {page, server} = await getTestState();

      await page.setRequestInterception(true);
      const cssRequests: HTTPRequest[] = [];
      page.on('request', request => {
        if (request.url().endsWith('css')) {
          cssRequests.push(request);
        }
        void request.continue({}, 0);
      });
      await page.goto(server.PREFIX + '/one-style.html');
      assert.lengthOf(cssRequests, 1);
      const request = cssRequests[0]!;
      assert.include(request.url(), 'one-style.css');
      assert.strictEqual(request.resourceType(), 'stylesheet');
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
