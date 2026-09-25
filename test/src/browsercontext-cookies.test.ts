/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {assert} from 'chai';
import type {DeleteCookiesRequest} from 'puppeteer-core';

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
      assert.deepEqual(await context.cookies(), []);
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
      assert.strictEqual(cookies.length, 1);
      // In Firefox with WebDriver BiDi, we do not know the actual
      // partition.
      assert.deepEqual(
        cookies[0]?.partitionKey,
        isChrome
          ? {
              sourceOrigin: topLevelSite,
              hasCrossSiteAncestor: false,
            }
          : undefined,
      );
    });

    it('should properly report "Default" sameSite cookie', async () => {
      const {context, server, page} = state;
      await page.goto(server.EMPTY_PAGE);
      const name = 'defaultSameSite';
      await context.setCookie({
        name,
        value: 'b',
        domain: 'localhost',
        sameSite: 'Default',
      });
      const cookies = await context.cookies();
      const cookie = cookies.find(c => {
        return c.name === name;
      });
      assert.isDefined(cookie);
      // Different browsers have different sameSite values for the "Default" sameSite.
      assert.include(['Default', 'Lax', undefined], cookie!.sameSite);
      await context.deleteMatchingCookies({name, domain: 'localhost'});
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
        expires: -1,
        httpOnly: false,
        secure: false,
        sourceScheme: 'NonSecure',
      });

      await page.goto(server.EMPTY_PAGE);

      assert.strictEqual(
        await page.evaluate(() => {
          return document.cookie;
        }),
        'infoCookie=secret',
      );
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

      assert.strictEqual(
        await page.evaluate(() => {
          return document.cookie;
        }),
        'infoCookie=secret',
      );
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
          expires: -1,
          httpOnly: false,
          secure: false,
          sourceScheme: 'NonSecure',
        },
      );
      assert.strictEqual(
        await page.evaluate(() => {
          return document.cookie;
        }),
        'cookie1=1; cookie2=2',
      );
      await context.deleteCookie({
        name: 'cookie1',
        value: '1',
        domain: 'localhost',
        path: '/',
        expires: -1,
        size: 16,
        httpOnly: false,
        secure: false,
        session: true,
        sourceScheme: 'NonSecure',
      });
      assert.strictEqual(
        await page.evaluate(() => {
          return document.cookie;
        }),
        'cookie2=2',
      );
    });

    it('should be able to delete "Default" sameSite cookie', async () => {
      const {page, context, server} = state;
      await page.goto(server.EMPTY_PAGE);
      const name = 'deleteDefaultSameSite';
      await context.setCookie({
        name,
        value: 'b',
        domain: 'localhost',
        sameSite: 'Default',
      });
      const cookies = await context.cookies();
      const cookie = cookies.find(c => {
        return c.name === name;
      });
      assert.isDefined(cookie);
      await context.deleteMatchingCookies({name, domain: 'localhost'});
      const cookiesAfter = await context.cookies();
      assert.isUndefined(
        cookiesAfter.find(c => {
          return c.name === name;
        }),
      );
    });
  });

  describe('BrowserContext.deleteMatchingCookies', () => {
    const filters: DeleteCookiesRequest[] = [
      {
        name: 'cookie1',
      },
      {
        url: 'https://example.test/test',
        name: 'cookie1',
      },
      {
        domain: 'example.test',
        name: 'cookie1',
      },
      {
        path: '/test',
        name: 'cookie1',
      },
      {
        name: 'cookie1',
        partitionKey: {
          sourceOrigin: 'https://example.test',
        },
      },
    ];
    for (const filter of filters) {
      it(`should delete cookies matching ${JSON.stringify(filter)}`, async () => {
        const {page, context, server, isChrome} = state;
        await page.goto(server.EMPTY_PAGE);
        assert.lengthOf(await context.cookies(), 0);
        const topLevelSite = 'https://example.test';
        await context.setCookie(
          {
            name: 'cookie1',
            value: 'secret',
            domain: new URL(topLevelSite).hostname,
            path: '/test',
            expires: -1,
            httpOnly: false,
            secure: true,
            partitionKey: isChrome
              ? {
                  sourceOrigin: topLevelSite,
                  hasCrossSiteAncestor: false,
                }
              : undefined,
          },
          {
            name: 'cookie2',
            value: 'secret',
            domain: new URL(topLevelSite).hostname,
            path: '/test',
            expires: -1,
            httpOnly: false,
            secure: true,
            partitionKey: isChrome
              ? {
                  sourceOrigin: topLevelSite,
                  hasCrossSiteAncestor: false,
                }
              : undefined,
          },
        );
        assert.lengthOf(await context.cookies(), 2);
        await context.deleteMatchingCookies(filter);
        const cookies = await context.cookies();
        assert.lengthOf(cookies, 1);
        assert.strictEqual(cookies[0]!.name, 'cookie2');
      });
    }
  });
});
