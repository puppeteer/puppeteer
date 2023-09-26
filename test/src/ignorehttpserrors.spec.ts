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

import type {TLSSocket} from 'tls';

import expect from 'expect';
import type {HTTPResponse} from 'puppeteer-core/internal/api/HTTPResponse.js';

import {launch} from './mocha-utils.js';

describe('ignoreHTTPSErrors', function () {
  /* Note that this test creates its own browser rather than use
   * the one provided by the test set-up as we need one
   * with ignoreHTTPSErrors set to true
   */
  let state: Awaited<ReturnType<typeof launch>>;

  before(async () => {
    state = await launch(
      {ignoreHTTPSErrors: true},
      {
        after: 'all',
      }
    );
  });

  after(async () => {
    await state.close();
  });

  beforeEach(async () => {
    state.context = await state.browser.createIncognitoBrowserContext();
    state.page = await state.context.newPage();
  });

  afterEach(async () => {
    await state.context.close();
  });

  describe('Response.securityDetails', function () {
    it('should work', async () => {
      const {httpsServer, page} = state;

      const [serverRequest, response] = await Promise.all([
        httpsServer.waitForRequest('/empty.html'),
        page.goto(httpsServer.EMPTY_PAGE),
      ]);
      const securityDetails = response!.securityDetails()!;
      expect(securityDetails.issuer()).toBe('puppeteer-tests');
      const protocol = (serverRequest.socket as TLSSocket)
        .getProtocol()!
        .replace('v', ' ');
      expect(securityDetails.protocol()).toBe(protocol);
      expect(securityDetails.subjectName()).toBe('puppeteer-tests');
      expect(securityDetails.validFrom()).toBe(1589357069);
      expect(securityDetails.validTo()).toBe(1904717069);
      expect(securityDetails.subjectAlternativeNames()).toEqual([
        'www.puppeteer-tests.test',
        'www.puppeteer-tests-1.test',
      ]);
    });
    it('should be |null| for non-secure requests', async () => {
      const {server, page} = state;

      const response = (await page.goto(server.EMPTY_PAGE))!;
      expect(response.securityDetails()).toBe(null);
    });
    it('Network redirects should report SecurityDetails', async () => {
      const {httpsServer, page} = state;

      httpsServer.setRedirect('/plzredirect', '/empty.html');
      const responses: HTTPResponse[] = [];
      page.on('response', response => {
        return responses.push(response);
      });
      const [serverRequest] = await Promise.all([
        httpsServer.waitForRequest('/plzredirect'),
        page.goto(httpsServer.PREFIX + '/plzredirect'),
      ]);
      expect(responses).toHaveLength(2);
      expect(responses[0]!.status()).toBe(302);
      const securityDetails = responses[0]!.securityDetails()!;
      const protocol = (serverRequest.socket as TLSSocket)
        .getProtocol()!
        .replace('v', ' ');
      expect(securityDetails.protocol()).toBe(protocol);
    });
  });

  it('should work', async () => {
    const {httpsServer, page} = state;

    let error!: Error;
    const response = await page.goto(httpsServer.EMPTY_PAGE).catch(error_ => {
      return (error = error_);
    });
    expect(error).toBeUndefined();
    expect(response.ok()).toBe(true);
  });
  it('should work with request interception', async () => {
    const {httpsServer, page} = state;

    await page.setRequestInterception(true);
    page.on('request', request => {
      return request.continue();
    });
    const response = (await page.goto(httpsServer.EMPTY_PAGE))!;
    expect(response.status()).toBe(200);
  });
  it('should work with mixed content', async () => {
    const {server, httpsServer, page} = state;

    httpsServer.setRoute('/mixedcontent.html', (_req, res) => {
      res.end(`<iframe src=${server.EMPTY_PAGE}></iframe>`);
    });
    await page.goto(httpsServer.PREFIX + '/mixedcontent.html', {
      waitUntil: 'load',
    });
    expect(page.frames()).toHaveLength(2);
    // Make sure blocked iframe has functional execution context
    // @see https://github.com/puppeteer/puppeteer/issues/2709
    expect(await page.frames()[0]!.evaluate('1 + 2')).toBe(3);
    expect(await page.frames()[1]!.evaluate('2 + 3')).toBe(5);
  });
});
