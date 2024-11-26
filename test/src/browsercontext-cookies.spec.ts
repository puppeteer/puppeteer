/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {
  expectCookieEquals,
  getTestState,
  setupTestBrowserHooks,
} from './mocha-utils.js';

describe('BrowserContext cookies', () => {
  setupTestBrowserHooks();

  describe('BrowserContext.cookies', () => {
    it('should find no cookies in new context', async () => {
      const {browser} = await getTestState({
        skipContextCreation: true,
      });
      const context = await browser.createBrowserContext();
      expect(await context.cookies()).toEqual([]);
    });
    it('should find cookie created in page', async () => {
      const {page, server, context} = await getTestState();
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
      const {context} = await getTestState();
      const topLevelSite = 'https://localhost:8000';
      await context.setCookie({
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
        partitionKey: {
          topLevelSite: topLevelSite,
          hasCrossSiteAncestor: false,
        },
        sourceScheme: 'NonSecure',
      });
      const cookies = await context.cookies();
      expect(cookies.length).toEqual(1);
      expect(cookies[0]?.partitionKey).toEqual({
        topLevelSite: topLevelSite,
        hasCrossSiteAncestor: false,
      });
    });
  });
  describe('BrowserContext.setCookie', function () {
    it('should set with undefined partition key', async () => {
      const {page, context, server} = await getTestState();
      await context.setCookie({
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
      });

      await page.goto(server.EMPTY_PAGE);

      expect(
        await page.evaluate(() => {
          return document.cookie;
        }),
      ).toEqual('infoCookie=secret');
    });

    it('should set cookie with string partition key', async () => {
      const {page, context, server} = await getTestState();
      await context.setCookie({
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
        partitionKey: 'https://localhost:8000',
        sourceScheme: 'NonSecure',
      });

      await page.goto(server.EMPTY_PAGE);

      expect(
        await page.evaluate(() => {
          return document.cookie;
        }),
      ).toEqual('infoCookie=secret');
    });

    it('should set cookie with chrome partition key', async () => {
      const {page, context, server} = await getTestState();
      await context.setCookie({
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
        partitionKey: {
          topLevelSite: 'https://localhost:8000',
          hasCrossSiteAncestor: false,
        },
        sourceScheme: 'NonSecure',
      });

      await page.goto(server.EMPTY_PAGE);

      expect(
        await page.evaluate(() => {
          return document.cookie;
        }),
      ).toEqual('infoCookie=secret');
    });
  });

  describe('BrowserContext.deleteCookies', () => {
    it('should delete cookies', async () => {
      const {page, context, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      await context.setCookie(
        {
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
        },
        {
          name: 'cookie2',
          value: '2',
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
