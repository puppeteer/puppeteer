/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import expect from 'expect';
import type {HTTPRequest} from 'puppeteer-core/internal/api/HTTPRequest.js';

import {getTestState, launch, setupTestBrowserHooks} from '../mocha-utils.js';
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

  describe('Page.setRequestInterception', function () {
    // @see https://github.com/puppeteer/puppeteer/issues/12183
    it('should work with internal redirects not paused by Fetch.requestPaused', async () => {
      const cert = new crypto.X509Certificate(
        fs.readFileSync(
          path.join(
            import.meta.dirname,
            '../../../packages/testserver/cert.pem',
          ),
        ),
      );
      const spki = cert.publicKey.export({type: 'spki', format: 'der'});
      const spkiHash = crypto
        .createHash('sha256')
        .update(spki)
        .digest('base64');

      // Chrome ignores `Strict-Transport-Security` headers on connections with
      // certificate errors, even when `acceptInsecureCerts: true` or
      // `--ignore-certificate-errors` is used. Passing the test server cert's
      // SPKI hash via `--ignore-certificate-errors-spki-list` makes Chrome
      // treat the certificate as trusted without errors so HSTS is registered.
      const {page, httpsServer, close} = await launch(
        {
          args: [`--ignore-certificate-errors-spki-list=${spkiHash}`],
        },
        {
          createContext: true,
        },
      );
      try {
        httpsServer.setRoute('/hsts', (_req, res) => {
          res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains',
          );
          res.end('ok');
        });
        const httpsOrigin = `https://domain1.test:${httpsServer.PORT}`;
        const httpEmptyPage = `http://domain1.test:${httpsServer.PORT}/empty.html`;
        const httpsEmptyPage = `https://domain1.test:${httpsServer.PORT}/empty.html`;
        httpsServer.setRedirect('/start', httpEmptyPage);

        await page.goto(httpsOrigin + '/hsts');

        const requests: HTTPRequest[] = [];
        const responses: number[] = [];
        await page.setRequestInterception(true);
        page.on('request', request => {
          if (!isFavicon(request)) {
            requests.push(request);
          }
          void request.continue();
        });
        page.on('response', response => {
          if (!isFavicon(response.request())) {
            responses.push(response.status());
          }
        });

        const response = (await page.goto(httpsOrigin + '/start'))!;

        expect(response.status()).toBe(200);
        expect(
          requests.map(r => {
            return r.url();
          }),
        ).toEqual([httpsOrigin + '/start', httpEmptyPage, httpsEmptyPage]);
        expect(responses).toEqual([302, 307, 200]);
        expect(response.request().redirectChain()).toEqual([
          requests[0],
          requests[1],
        ]);
      } finally {
        await close();
      }
    });
  });
});
