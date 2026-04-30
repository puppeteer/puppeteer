/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
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
});
