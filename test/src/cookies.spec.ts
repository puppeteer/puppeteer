/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {
  expectCookieEquals,
  getTestState,
  launch,
  setupTestBrowserHooks,
} from './mocha-utils.js';

describe('Cookie specs', () => {
  setupTestBrowserHooks();

  describe('Page.cookies', function () {
    it('should return no cookies in pristine browser context', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      await expectCookieEquals(await page.cookies(), []);
    });
    it('should get a cookie', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        document.cookie = 'username=John Doe';
      });

      await expectCookieEquals(await page.cookies(), [
        {
          name: 'username',
          value: 'John Doe',
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
    it('should properly report httpOnly cookie', async () => {
      const {page, server} = await getTestState();
      server.setRoute('/empty.html', (_req, res) => {
        res.setHeader('Set-Cookie', 'a=b; HttpOnly; Path=/');
        res.end();
      });
      await page.goto(server.EMPTY_PAGE);
      const cookies = await page.cookies();
      expect(cookies).toHaveLength(1);
      expect(cookies[0]!.httpOnly).toBe(true);
    });
    it('should properly report "Strict" sameSite cookie', async () => {
      const {page, server} = await getTestState();
      server.setRoute('/empty.html', (_req, res) => {
        res.setHeader('Set-Cookie', 'a=b; SameSite=Strict');
        res.end();
      });
      await page.goto(server.EMPTY_PAGE);
      const cookies = await page.cookies();
      expect(cookies).toHaveLength(1);
      expect(cookies[0]!.sameSite).toBe('Strict');
    });
    it('should properly report "Lax" sameSite cookie', async () => {
      const {page, server} = await getTestState();
      server.setRoute('/empty.html', (_req, res) => {
        res.setHeader('Set-Cookie', 'a=b; SameSite=Lax');
        res.end();
      });
      await page.goto(server.EMPTY_PAGE);
      const cookies = await page.cookies();
      expect(cookies).toHaveLength(1);
      expect(cookies[0]!.sameSite).toBe('Lax');
    });
    it('should get multiple cookies', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        document.cookie = 'username=John Doe';
        document.cookie = 'password=1234';
      });
      const cookies = await page.cookies();
      cookies.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      await expectCookieEquals(cookies, [
        {
          name: 'password',
          value: '1234',
          domain: 'localhost',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 12,
          httpOnly: false,
          secure: false,
          session: true,
          sourceScheme: 'NonSecure',
        },
        {
          name: 'username',
          value: 'John Doe',
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
    it('should get cookies from multiple urls', async () => {
      const {page} = await getTestState();
      await page.setCookie(
        {
          url: 'https://foo.com',
          name: 'doggo',
          value: 'woofs',
        },
        {
          url: 'https://bar.com',
          name: 'catto',
          value: 'purrs',
        },
        {
          url: 'https://baz.com',
          name: 'birdo',
          value: 'tweets',
        }
      );
      const cookies = await page.cookies('https://foo.com', 'https://baz.com');
      cookies.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      await expectCookieEquals(cookies, [
        {
          name: 'birdo',
          value: 'tweets',
          domain: 'baz.com',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 11,
          httpOnly: false,
          session: true,
          sourceScheme: 'Secure',
        },
        {
          name: 'doggo',
          value: 'woofs',
          domain: 'foo.com',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 10,
          httpOnly: false,
          session: true,
          sourceScheme: 'Secure',
        },
      ]);
    });
    it('should not get cookies from subdomain', async () => {
      const {page} = await getTestState();
      await page.setCookie({
        url: 'https://base_domain.com',
        name: 'doggo',
        value: 'woofs',
      });
      const cookies = await page.cookies('https://sub_domain.base_domain.com');
      expect(cookies).toHaveLength(0);
    });
    it('should get cookies from nested path', async () => {
      const {page} = await getTestState();
      await page.setCookie({
        url: 'https://foo.com',
        path: '/some_path',
        name: 'doggo',
        value: 'woofs',
      });
      const cookies = await page.cookies(
        'https://foo.com/some_path/nested_path'
      );
      expect(cookies).toHaveLength(1);
    });
    it('should not get cookies from not nested path', async () => {
      const {page} = await getTestState();
      await page.setCookie({
        url: 'https://foo.com',
        path: '/some_path',
        name: 'doggo',
        value: 'woofs',
      });
      const cookies = await page.cookies(
        'https://foo.com/some_path_looks_like_nested'
      );
      expect(cookies).toHaveLength(0);
    });
  });
  describe('Page.setCookie', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({
        name: 'password',
        value: '123456',
      });
      expect(
        await page.evaluate(() => {
          return document.cookie;
        })
      ).toEqual('password=123456');
    });
    it('should isolate cookies in browser contexts', async () => {
      const {page, server, browser} = await getTestState();

      const anotherContext = await browser.createBrowserContext();
      try {
        const anotherPage = await anotherContext.newPage();

        await page.goto(server.EMPTY_PAGE);
        await anotherPage.goto(server.EMPTY_PAGE);

        await page.setCookie({name: 'page1cookie', value: 'page1value'});
        await anotherPage.setCookie({name: 'page2cookie', value: 'page2value'});

        const cookies1 = await page.cookies();
        const cookies2 = await anotherPage.cookies();
        expect(cookies1).toHaveLength(1);
        expect(cookies2).toHaveLength(1);
        expect(cookies1[0]!.name).toBe('page1cookie');
        expect(cookies1[0]!.value).toBe('page1value');
        expect(cookies2[0]!.name).toBe('page2cookie');
        expect(cookies2[0]!.value).toBe('page2value');
      } finally {
        await anotherContext.close();
      }
    });
    it('should set multiple cookies', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie(
        {
          name: 'password',
          value: '123456',
        },
        {
          name: 'foo',
          value: 'bar',
        }
      );
      const cookieStrings = await page.evaluate(() => {
        const cookies = document.cookie.split(';');
        return cookies
          .map(cookie => {
            return cookie.trim();
          })
          .sort();
      });

      expect(cookieStrings).toEqual(['foo=bar', 'password=123456']);
    });
    it('should have |expires| set to |-1| for session cookies', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({
        name: 'password',
        value: '123456',
      });
      const cookies = await page.cookies();
      expect(cookies[0]!.session).toBe(true);
      expect(cookies[0]!.expires).toBe(-1);
    });
    it('should set cookie with reasonable defaults', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({
        name: 'password',
        value: '123456',
      });
      const cookies = await page.cookies();
      await expectCookieEquals(
        cookies.sort((a, b) => {
          return a.name.localeCompare(b.name);
        }),
        [
          {
            name: 'password',
            value: '123456',
            domain: 'localhost',
            path: '/',
            sameParty: false,
            expires: -1,
            size: 14,
            httpOnly: false,
            secure: false,
            session: true,
            sourceScheme: 'NonSecure',
          },
        ]
      );
    });
    it('should set a cookie with a path', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/grid.html');
      await page.setCookie({
        name: 'gridcookie',
        value: 'GRID',
        path: '/grid.html',
      });
      await expectCookieEquals(await page.cookies(), [
        {
          name: 'gridcookie',
          value: 'GRID',
          domain: 'localhost',
          path: '/grid.html',
          sameParty: false,
          expires: -1,
          size: 14,
          httpOnly: false,
          secure: false,
          session: true,
          sourceScheme: 'NonSecure',
        },
      ]);
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
      await page.goto(server.EMPTY_PAGE);
      await expectCookieEquals(await page.cookies(), []);
      expect(await page.evaluate('document.cookie')).toBe('');
      await page.goto(server.PREFIX + '/grid.html');
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
    });
    it('should not set a cookie on a blank page', async () => {
      const {page} = await getTestState();

      await page.goto('about:blank');
      let error!: Error;
      try {
        await page.setCookie({name: 'example-cookie', value: 'best'});
      } catch (error_) {
        error = error_ as Error;
      }
      expect(error.message).toContain(
        'At least one of the url and domain needs to be specified'
      );
    });
    it('should not set a cookie with blank page URL', async () => {
      const {page, server} = await getTestState();

      let error!: Error;
      await page.goto(server.EMPTY_PAGE);
      try {
        await page.setCookie(
          {name: 'example-cookie', value: 'best'},
          {url: 'about:blank', name: 'example-cookie-blank', value: 'best'}
        );
      } catch (error_) {
        error = error_ as Error;
      }
      expect(error.message).toEqual(
        `Blank page can not have cookie "example-cookie-blank"`
      );
    });
    it('should not set a cookie on a data URL page', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page.goto('data:,Hello%2C%20World!');
      try {
        await page.setCookie({name: 'example-cookie', value: 'best'});
      } catch (error_) {
        error = error_ as Error;
      }
      expect(error.message).toContain(
        'At least one of the url and domain needs to be specified'
      );
    });
    it('should default to setting secure cookie for HTTPS websites', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const SECURE_URL = 'https://example.com';
      await page.setCookie({
        url: SECURE_URL,
        name: 'foo',
        value: 'bar',
      });
      const [cookie] = await page.cookies(SECURE_URL);
      expect(cookie!.secure).toBe(true);
    });
    it('should be able to set insecure cookie for HTTP website', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const HTTP_URL = 'http://example.com';
      await page.setCookie({
        url: HTTP_URL,
        name: 'foo',
        value: 'bar',
      });
      const [cookie] = await page.cookies(HTTP_URL);
      expect(cookie!.secure).toBe(false);
    });
    it('should set a cookie on a different domain', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({
        url: 'https://www.example.com',
        name: 'example-cookie',
        value: 'best',
      });
      expect(await page.evaluate('document.cookie')).toBe('');
      await expectCookieEquals(await page.cookies(), []);
      await expectCookieEquals(await page.cookies('https://www.example.com'), [
        {
          name: 'example-cookie',
          value: 'best',
          domain: 'www.example.com',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 18,
          httpOnly: false,
          session: true,
          sourceScheme: 'Secure',
        },
      ]);
    });
    it('should set cookies from a frame', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/grid.html');
      await page.setCookie({name: 'localhost-cookie', value: 'best'});
      await page.evaluate(src => {
        let fulfill!: () => void;
        const promise = new Promise<void>(x => {
          return (fulfill = x);
        });
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        iframe.onload = fulfill;
        iframe.src = src;
        return promise;
      }, server.CROSS_PROCESS_PREFIX);
      await page.setCookie({
        name: '127-cookie',
        value: 'worst',
        url: server.CROSS_PROCESS_PREFIX,
      });
      expect(await page.evaluate('document.cookie')).toBe(
        'localhost-cookie=best'
      );
      expect(await page.frames()[1]!.evaluate('document.cookie')).toBe('');

      await expectCookieEquals(await page.cookies(), [
        {
          name: 'localhost-cookie',
          value: 'best',
          domain: 'localhost',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 20,
          httpOnly: false,
          secure: false,
          session: true,
          sourceScheme: 'NonSecure',
        },
      ]);

      await expectCookieEquals(
        await page.cookies(server.CROSS_PROCESS_PREFIX),
        [
          {
            name: '127-cookie',
            value: 'worst',
            domain: '127.0.0.1',
            path: '/',
            sameParty: false,
            expires: -1,
            size: 15,
            httpOnly: false,
            secure: false,
            session: true,
            sourceScheme: 'NonSecure',
          },
        ]
      );
    });
    it('should set secure same-site cookies from a frame', async () => {
      const {httpsServer, browser, close} = await launch({
        ignoreHTTPSErrors: true,
      });

      try {
        const page = await browser.newPage();
        await page.goto(httpsServer.PREFIX + '/grid.html');
        await page.evaluate(src => {
          let fulfill!: () => void;
          const promise = new Promise<void>(x => {
            return (fulfill = x);
          });
          const iframe = document.createElement('iframe');
          document.body.appendChild(iframe);
          iframe.onload = fulfill;
          iframe.src = src;
          return promise;
        }, httpsServer.CROSS_PROCESS_PREFIX);
        await page.setCookie({
          name: '127-same-site-cookie',
          value: 'best',
          url: httpsServer.CROSS_PROCESS_PREFIX,
          sameSite: 'None',
        });

        expect(await page.frames()[1]!.evaluate('document.cookie')).toBe(
          '127-same-site-cookie=best'
        );
        await expectCookieEquals(
          await page.cookies(httpsServer.CROSS_PROCESS_PREFIX),
          [
            {
              name: '127-same-site-cookie',
              value: 'best',
              domain: '127.0.0.1',
              path: '/',
              sameParty: false,
              expires: -1,
              size: 24,
              httpOnly: false,
              sameSite: 'None',
              secure: true,
              session: true,
              sourceScheme: 'Secure',
            },
          ]
        );
      } finally {
        await close();
      }
    });
  });

  describe('Page.deleteCookie', function () {
    it('should delete cookie', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie(
        {
          name: 'cookie1',
          value: '1',
        },
        {
          name: 'cookie2',
          value: '2',
        },
        {
          name: 'cookie3',
          value: '3',
        }
      );
      expect(await page.evaluate('document.cookie')).toBe(
        'cookie1=1; cookie2=2; cookie3=3'
      );
      await page.deleteCookie({name: 'cookie2'});
      expect(await page.evaluate('document.cookie')).toBe(
        'cookie1=1; cookie3=3'
      );
    });
    it('should not delete cookie for different domain', async () => {
      const {page, server} = await getTestState();
      const COOKIE_DESTINATION_URL = 'https://example.com';
      const COOKIE_NAME = 'some_cookie_name';

      await page.goto(server.EMPTY_PAGE);
      // Set a cookie for the current page.
      await page.setCookie({
        name: COOKIE_NAME,
        value: 'local page cookie value',
      });
      expect(await page.cookies()).toHaveLength(1);

      // Set a cookie for different domain.
      await page.setCookie({
        url: COOKIE_DESTINATION_URL,
        name: COOKIE_NAME,
        value: 'COOKIE_DESTINATION_URL cookie value',
      });
      expect(await page.cookies(COOKIE_DESTINATION_URL)).toHaveLength(1);

      await page.deleteCookie({name: COOKIE_NAME});

      // Verify the cookie is deleted for the current page.
      expect(await page.cookies()).toHaveLength(0);

      // Verify the cookie is not deleted for different domain.
      await expectCookieEquals(await page.cookies(COOKIE_DESTINATION_URL), [
        {
          name: COOKIE_NAME,
          value: 'COOKIE_DESTINATION_URL cookie value',
          domain: 'example.com',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 51,
          httpOnly: false,
          session: true,
          sourceScheme: 'Secure',
        },
      ]);
    });
    it('should delete cookie for specified URL', async () => {
      const {page, server} = await getTestState();
      const COOKIE_DESTINATION_URL = 'https://example.com';
      const COOKIE_NAME = 'some_cookie_name';

      await page.goto(server.EMPTY_PAGE);
      // Set a cookie for the current page.
      await page.setCookie({
        name: COOKIE_NAME,
        value: 'some_cookie_value',
      });
      expect(await page.cookies()).toHaveLength(1);

      // Set a cookie for specified URL.
      await page.setCookie({
        url: COOKIE_DESTINATION_URL,
        name: COOKIE_NAME,
        value: 'another_cookie_value',
      });
      expect(await page.cookies(COOKIE_DESTINATION_URL)).toHaveLength(1);

      // Delete the cookie for specified URL.
      await page.deleteCookie({
        url: COOKIE_DESTINATION_URL,
        name: COOKIE_NAME,
      });

      // Verify the cookie is deleted for specified URL.
      expect(await page.cookies(COOKIE_DESTINATION_URL)).toHaveLength(0);

      // Verify the cookie is not deleted for the current page.
      await expectCookieEquals(await page.cookies(), [
        {
          name: COOKIE_NAME,
          value: 'some_cookie_value',
          domain: 'localhost',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 33,
          httpOnly: false,
          secure: false,
          session: true,
          sourceScheme: 'NonSecure',
        },
      ]);
    });
    it('should delete cookie for specified URL regardless of the current page', async () => {
      // This test verifies the page.deleteCookie method deletes cookies for the custom
      // destination URL, even if it was set from another page. Depending on the cookie
      // partitioning implementation, this test case does not pass, if source origin is in
      // the default cookie partition.

      const {page, server} = await getTestState();
      const COOKIE_DESTINATION_URL = 'https://example.com';
      const COOKIE_NAME = 'some_cookie_name';
      const URL_1 = server.EMPTY_PAGE;
      const URL_2 = server.CROSS_PROCESS_PREFIX + '/empty.html';

      await page.goto(URL_1);
      // Set a cookie for the COOKIE_DESTINATION from URL_1.
      await page.setCookie({
        url: COOKIE_DESTINATION_URL,
        name: COOKIE_NAME,
        value: 'Cookie from URL_1',
      });
      expect(await page.cookies(COOKIE_DESTINATION_URL)).toHaveLength(1);

      await page.goto(URL_2);
      // Set a cookie for the COOKIE_DESTINATION from URL_2.
      await page.setCookie({
        url: COOKIE_DESTINATION_URL,
        name: COOKIE_NAME,
        value: 'Cookie from URL_2',
      });
      expect(await page.cookies(COOKIE_DESTINATION_URL)).toHaveLength(1);

      // Delete the cookie for the COOKIE_DESTINATION from URL_2.
      await page.deleteCookie({
        name: COOKIE_NAME,
        url: COOKIE_DESTINATION_URL,
      });

      // Expect the cookie for the COOKIE_DESTINATION from URL_2 is deleted.
      expect(await page.cookies(COOKIE_DESTINATION_URL)).toHaveLength(0);

      // Navigate back to the URL_1.
      await page.goto(server.EMPTY_PAGE);
      // Expect the cookie for the COOKIE_DESTINATION from URL_1 is deleted.
      expect(await page.cookies(COOKIE_DESTINATION_URL)).toHaveLength(0);
    });
  });
});
