/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {
  expectCookieEquals,
  setupSeparateTestBrowserHooks,
} from './mocha-utils.js';

describe('BrowserContext cookies', () => {
  const state = setupSeparateTestBrowserHooks({
    acceptInsecureCerts: true,
  });

  describe('BrowserContext.cookies', () => {
    it('should find no cookies in new context', async () => {
      const {browser} = state;
      using context = await browser.createBrowserContext();
      expect(await context.cookies()).toEqual([]);
    });
    it('should find cookie created in page', async () => {
      const {page, server, context} = state;
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        document.cookie = 'infoCookie = secret';
      });
      await expectCookieEquals(await context.cookies(), [
        {
          name: 'infoCookie',
          value: 'secret',
          domain: 'localhost',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 16,
          httpOnly: false,
          secure: false,
          session: true,
          sourceScheme: 'NonSecure',
        },
      ]);
    });
    it('should find partitioned cookie', async () => {
      const {context, isChrome} = state;
      const topLevelSite = 'https://example.test';
      await context.setCookie({
        name: 'infoCookie',
        value: 'secret',
        domain: new URL(topLevelSite).hostname,
        path: '/',
        sameParty: false,
        expires: -1,
        httpOnly: false,
        secure: true,
        partitionKey: isChrome
          ? {
              sourceOrigin: topLevelSite,
              hasCrossSiteAncestor: false,
            }
          : {
              sourceOrigin: topLevelSite,
            },
      });
      const cookies = await context.cookies();
      expect(cookies.length).toEqual(1);
      // In Firefox with WebDriver BiDi, we do not know the actual
      // partition.
      expect(cookies[0]?.partitionKey).toEqual(
        isChrome
          ? {
              sourceOrigin: topLevelSite,
              hasCrossSiteAncestor: false,
            }
          : undefined,
      );
    });
  });
  describe('BrowserContext.setCookie', function () {
    it('should set with undefined partition key', async () => {
      const {page, context, server} = state;
      await context.setCookie({
        name: 'infoCookie',
        value: 'secret',
        domain: 'localhost',
        path: '/',
        sameParty: false,
        expires: -1,
        httpOnly: false,
        secure: false,
        sourceScheme: 'NonSecure',
      });

      await page.goto(server.EMPTY_PAGE);

      expect(
        await page.evaluate(() => {
          return document.cookie;
        }),
      ).toEqual('infoCookie=secret');
    });

    it('should set cookie with a partition key', async () => {
      const {page, context, httpsServer, isChrome} = state;
      const url = new URL(httpsServer.EMPTY_PAGE);
      await context.setCookie({
        name: 'infoCookie',
        value: 'secret',
        domain: url.hostname,
        secure: true,
        partitionKey: isChrome
          ? {
              sourceOrigin: url.origin.replace(`:${url.port}`, ''),
              hasCrossSiteAncestor: false,
            }
          : {
              sourceOrigin: url.origin,
            },
      });

      await page.goto(url.toString());

      expect(
        await page.evaluate(() => {
          return document.cookie;
        }),
      ).toEqual('infoCookie=secret');
    });
  });

  describe('BrowserContext.deleteCookies', () => {
    it('should delete cookies', async () => {
      const {page, context, server} = state;
      await page.goto(server.EMPTY_PAGE);
      await context.setCookie(
        {
          name: 'cookie1',
          value: '1',
          domain: 'localhost',
          path: '/',
          sameParty: false,
          expires: -1,
          httpOnly: false,
          secure: false,
          sourceScheme: 'NonSecure',
        },
        {
          name: 'cookie2',
          value: '2',
          domain: 'localhost',
          path: '/',
          sameParty: false,
          expires: -1,
          httpOnly: false,
          secure: false,
          sourceScheme: 'NonSecure',
        },
      );
      expect(
        await page.evaluate(() => {
          return document.cookie;
        }),
      ).toEqual('cookie1=1; cookie2=2');
      await context.deleteCookie({
        name: 'cookie1',
        value: '1',
        domain: 'localhost',
        path: '/',
        sameParty: false,
        expires: -1,
        size: 16,
        httpOnly: false,
        secure: false,
        session: true,
        sourceScheme: 'NonSecure',
      });
      expect(
        await page.evaluate(() => {
          return document.cookie;
        }),
      ).toEqual('cookie2=2');
    });
  });
});
