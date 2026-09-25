/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {TLSSocket} from 'node:tls';

import {assert} from 'chai';
import type {HTTPResponse} from 'puppeteer-core/internal/api/HTTPResponse.js';

import {setupSeparateTestBrowserHooks} from './mocha-utils.js';

describe('acceptInsecureCerts', async () => {
  /* Note that this test creates its own browser rather than use
   * the one provided by the test set-up as we need one
   * with acceptInsecureCerts set to true
   */
  const state = setupSeparateTestBrowserHooks({
    acceptInsecureCerts: true,
  });

  describe('Response.securityDetails', function () {
    it('should work', async () => {
      const {httpsServer, page} = state;

      const [serverRequest, response] = await Promise.all([
        httpsServer.waitForRequest('/empty.html'),
        page.goto(httpsServer.EMPTY_PAGE),
      ]);
      const securityDetails = response!.securityDetails()!;
      assert.strictEqual(securityDetails.issuer(), 'puppeteer-tests');
      const protocol = (serverRequest.socket as TLSSocket)
        .getProtocol()!
        .replace('v', ' ');
      assert.strictEqual(securityDetails.protocol(), protocol);
      assert.strictEqual(securityDetails.subjectName(), 'puppeteer-tests');
      assert.strictEqual(securityDetails.validFrom(), 1589357069);
      assert.strictEqual(securityDetails.validTo(), 1904717069);
      assert.deepEqual(securityDetails.subjectAlternativeNames(), [
        'www.puppeteer-tests.test',
        'www.puppeteer-tests-1.test',
      ]);
    });
    it('should be |null| for non-secure requests', async () => {
      const {server, page} = state;

      const response = (await page.goto(server.EMPTY_PAGE))!;
      assert.isNull(response.securityDetails());
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
      assert.lengthOf(responses, 2);
      assert.strictEqual(responses[0]!.status(), 302);
      const securityDetails = responses[0]!.securityDetails()!;
      const protocol = (serverRequest.socket as TLSSocket)
        .getProtocol()!
        .replace('v', ' ');
      assert.strictEqual(securityDetails.protocol(), protocol);
    });
  });

  it('should work', async () => {
    const {httpsServer, page} = state;

    let error!: Error;
    const response = await page.goto(httpsServer.EMPTY_PAGE).catch(error_ => {
      return (error = error_);
    });
    assert.isUndefined(error);
    assert.isTrue(response.ok());
  });
  it('should work with request interception', async () => {
    const {httpsServer, page} = state;

    await page.setRequestInterception(true);
    page.on('request', request => {
      return request.continue();
    });
    const response = (await page.goto(httpsServer.EMPTY_PAGE))!;
    assert.strictEqual(response.status(), 200);
  });
  it('should work with mixed content', async () => {
    const {server, httpsServer, page} = state;

    httpsServer.setRoute('/mixedcontent.html', (_req: any, res: any) => {
      res.end(`<iframe src=${server.EMPTY_PAGE}></iframe>`);
    });
    await page.goto(httpsServer.PREFIX + '/mixedcontent.html', {
      waitUntil: 'load',
    });
    assert.lengthOf(page.frames(), 2);
    // Make sure blocked iframe has functional execution context
    // @see https://github.com/puppeteer/puppeteer/issues/2709
    assert.strictEqual(await page.frames()[0]!.evaluate('1 + 2'), 3);
    assert.strictEqual(await page.frames()[1]!.evaluate('2 + 3'), 5);
  });
  it('works for service worker', async () => {
    const {httpsServer, page} = state;
    await page.goto(httpsServer.PREFIX + '/serviceworkers/empty/sw.html');
    await page.evaluate(async () => {
      return await (
        globalThis as unknown as {
          registrationPromise: Promise<{unregister: () => void}>;
        }
      ).registrationPromise.then((registration: any) => {
        return registration.unregister();
      });
    });
  });
});
