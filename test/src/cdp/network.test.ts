/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import type {HTTPRequest} from 'puppeteer-core/internal/api/HTTPRequest.js';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';
import {isFavicon, waitEvent} from '../utils.js';

describe('network', function () {
  setupTestBrowserHooks();

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

      assert.ok(request);
      assert.strictEqual(request.postData(), '{"foo":"bar"}');
    });

    it('should be |undefined| when there is no post data', async () => {
      const {page, server} = await getTestState();

      const response = (await page.goto(server.EMPTY_PAGE))!;
      assert.isUndefined(response.request().postData());
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
      assert.isUndefined(request.postData());
      assert.isTrue(request.hasPostData());
      assert.strictEqual(await request.fetchPostData(), '{"foo":"bar"}');
    });
  });
});
