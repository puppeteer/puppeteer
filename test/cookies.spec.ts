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
import expect from 'expect';
import {
  expectCookieEquals,
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  itFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions

describe('Cookie specs', () => {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('Page.cookies', function () {
    it('should return no cookies in pristine browser context', async () => {
      const { page, server } = getTestState();
      await page.goto(server.EMPTY_PAGE);
      expectCookieEquals(await page.cookies(), []);
    });
    it('should get a cookie', async () => {
      const { page, server } = getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        document.cookie = 'username=John Doe';
      });

      expectCookieEquals(await page.cookies(), [
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
          sourcePort: 8907,
          sourceScheme: 'NonSecure',
        },
      ]);
    });
    it('should properly report httpOnly cookie', async () => {
      const { page, server } = getTestState();
      server.setRoute('/empty.html', (req, res) => {
        res.setHeader('Set-Cookie', 'a=b; HttpOnly; Path=/');
        res.end();
      });
      await page.goto(server.EMPTY_PAGE);
      const cookies = await page.cookies();
      expect(cookies.length).toBe(1);
      expect(cookies[0].httpOnly).toBe(true);
    });
    it('should properly report "Strict" sameSite cookie', async () => {
      const { page, server } = getTestState();
      server.setRoute('/empty.html', (req, res) => {
        res.setHeader('Set-Cookie', 'a=b; SameSite=Strict');
        res.end();
      });
      await page.goto(server.EMPTY_PAGE);
      const cookies = await page.cookies();
      expect(cookies.length).toBe(1);
      expect(cookies[0].sameSite).toBe('Strict');
    });
    it('should properly report "Lax" sameSite cookie', async () => {
      const { page, server } = getTestState();
      server.setRoute('/empty.html', (req, res) => {
        res.setHeader('Set-Cookie', 'a=b; SameSite=Lax');
        res.end();
      });
      await page.goto(server.EMPTY_PAGE);
      const cookies = await page.cookies();
      expect(cookies.length).toBe(1);
      expect(cookies[0].sameSite).toBe('Lax');
    });
    it('should get multiple cookies', async () => {
      const { page, server } = getTestState();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        document.cookie = 'username=John Doe';
        document.cookie = 'password=1234';
      });
      const cookies = await page.cookies();
      cookies.sort((a, b) => a.name.localeCompare(b.name));
      expectCookieEquals(cookies, [
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
          sourcePort: 8907,
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
          sourcePort: 8907,
          sourceScheme: 'NonSecure',
        },
      ]);
    });
    itFailsFirefox('should get cookies from multiple urls', async () => {
      const { page } = getTestState();
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
      cookies.sort((a, b) => a.name.localeCompare(b.name));
      expectCookieEquals(cookies, [
        {
          name: 'birdo',
          value: 'tweets',
          domain: 'baz.com',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 11,
          httpOnly: false,
          secure: true,
          session: true,
          sourcePort: 443,
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
          secure: true,
          session: true,
          sourcePort: 443,
          sourceScheme: 'Secure',
        },
      ]);
    });
  });
  describe('Page.setCookie', function () {
    itFailsFirefox('should work', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({
        name: 'password',
        value: '123456',
      });
      expect(await page.evaluate(() => document.cookie)).toEqual(
        'password=123456'
      );
    });
    itFailsFirefox('should isolate cookies in browser contexts', async () => {
      const { page, server, browser } = getTestState();

      const anotherContext = await browser.createIncognitoBrowserContext();
      const anotherPage = await anotherContext.newPage();

      await page.goto(server.EMPTY_PAGE);
      await anotherPage.goto(server.EMPTY_PAGE);

      await page.setCookie({ name: 'page1cookie', value: 'page1value' });
      await anotherPage.setCookie({ name: 'page2cookie', value: 'page2value' });

      const cookies1 = await page.cookies();
      const cookies2 = await anotherPage.cookies();
      expect(cookies1.length).toBe(1);
      expect(cookies2.length).toBe(1);
      expect(cookies1[0].name).toBe('page1cookie');
      expect(cookies1[0].value).toBe('page1value');
      expect(cookies2[0].name).toBe('page2cookie');
      expect(cookies2[0].value).toBe('page2value');
      await anotherContext.close();
    });
    itFailsFirefox('should set multiple cookies', async () => {
      const { page, server } = getTestState();

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
      expectCookieEquals(
        await page.evaluate(() => {
          const cookies = document.cookie.split(';');
          return cookies.map((cookie) => cookie.trim()).sort();
        }),
        ['foo=bar', 'password=123456']
      );
    });
    it('should have |expires| set to |-1| for session cookies', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({
        name: 'password',
        value: '123456',
      });
      const cookies = await page.cookies();
      expect(cookies[0].session).toBe(true);
      expect(cookies[0].expires).toBe(-1);
    });
    itFailsFirefox('should set cookie with reasonable defaults', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({
        name: 'password',
        value: '123456',
      });
      const cookies = await page.cookies();
      expectCookieEquals(
        cookies.sort((a, b) => a.name.localeCompare(b.name)),
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
            sourcePort: 80,
            sourceScheme: 'NonSecure',
          },
        ]
      );
    });
    itFailsFirefox('should set a cookie with a path', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/grid.html');
      await page.setCookie({
        name: 'gridcookie',
        value: 'GRID',
        path: '/grid.html',
      });
      expectCookieEquals(await page.cookies(), [
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
          sourcePort: 80,
          sourceScheme: 'NonSecure',
        },
      ]);
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
      await page.goto(server.EMPTY_PAGE);
      expectCookieEquals(await page.cookies(), []);
      expect(await page.evaluate('document.cookie')).toBe('');
      await page.goto(server.PREFIX + '/grid.html');
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
    });
    it('should not set a cookie on a blank page', async () => {
      const { page } = getTestState();

      await page.goto('about:blank');
      let error = null;
      try {
        await page.setCookie({ name: 'example-cookie', value: 'best' });
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toContain(
        'At least one of the url and domain needs to be specified'
      );
    });
    it('should not set a cookie with blank page URL', async () => {
      const { page, server } = getTestState();

      let error = null;
      await page.goto(server.EMPTY_PAGE);
      try {
        await page.setCookie(
          { name: 'example-cookie', value: 'best' },
          { url: 'about:blank', name: 'example-cookie-blank', value: 'best' }
        );
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toEqual(
        `Blank page can not have cookie "example-cookie-blank"`
      );
    });
    it('should not set a cookie on a data URL page', async () => {
      const { page } = getTestState();

      let error = null;
      await page.goto('data:,Hello%2C%20World!');
      try {
        await page.setCookie({ name: 'example-cookie', value: 'best' });
      } catch (error_) {
        error = error_;
      }
      expect(error.message).toContain(
        'At least one of the url and domain needs to be specified'
      );
    });
    itFailsFirefox(
      'should default to setting secure cookie for HTTPS websites',
      async () => {
        const { page, server } = getTestState();

        await page.goto(server.EMPTY_PAGE);
        const SECURE_URL = 'https://example.com';
        await page.setCookie({
          url: SECURE_URL,
          name: 'foo',
          value: 'bar',
        });
        const [cookie] = await page.cookies(SECURE_URL);
        expect(cookie.secure).toBe(true);
      }
    );
    it('should be able to set unsecure cookie for HTTP website', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const HTTP_URL = 'http://example.com';
      await page.setCookie({
        url: HTTP_URL,
        name: 'foo',
        value: 'bar',
      });
      const [cookie] = await page.cookies(HTTP_URL);
      expect(cookie.secure).toBe(false);
    });
    itFailsFirefox('should set a cookie on a different domain', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.setCookie({
        url: 'https://www.example.com',
        name: 'example-cookie',
        value: 'best',
      });
      expect(await page.evaluate('document.cookie')).toBe('');
      expectCookieEquals(await page.cookies(), []);
      expectCookieEquals(await page.cookies('https://www.example.com'), [
        {
          name: 'example-cookie',
          value: 'best',
          domain: 'www.example.com',
          path: '/',
          sameParty: false,
          expires: -1,
          size: 18,
          httpOnly: false,
          secure: true,
          session: true,
          sourcePort: 443,
          sourceScheme: 'Secure',
        },
      ]);
    });
    itFailsFirefox('should set cookies from a frame', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/grid.html');
      await page.setCookie({ name: 'localhost-cookie', value: 'best' });
      await page.evaluate<(src: string) => Promise<void>>((src) => {
        let fulfill;
        const promise = new Promise<void>((x) => (fulfill = x));
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
      expect(await page.frames()[1].evaluate('document.cookie')).toBe('');

      expectCookieEquals(await page.cookies(), [
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
          sourcePort: 80,
          sourceScheme: 'NonSecure',
        },
      ]);

      expectCookieEquals(await page.cookies(server.CROSS_PROCESS_PREFIX), [
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
          sourcePort: 80,
          sourceScheme: 'NonSecure',
        },
      ]);
    });
    itFailsFirefox(
      'should set secure same-site cookies from a frame',
      async () => {
        const {
          httpsServer,
          puppeteer,
          defaultBrowserOptions,
        } = getTestState();

        const browser = await puppeteer.launch({
          ...defaultBrowserOptions,
          ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        try {
          await page.goto(httpsServer.PREFIX + '/grid.html');
          await page.evaluate<(src: string) => Promise<void>>((src) => {
            let fulfill;
            const promise = new Promise<void>((x) => (fulfill = x));
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

          expect(await page.frames()[1].evaluate('document.cookie')).toBe(
            '127-same-site-cookie=best'
          );
          expectCookieEquals(
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
                sourcePort: 443,
                sourceScheme: 'Secure',
              },
            ]
          );
        } finally {
          await page.close();
          await browser.close();
        }
      }
    );
  });

  describe('Page.deleteCookie', function () {
    itFailsFirefox('should work', async () => {
      const { page, server } = getTestState();

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
      await page.deleteCookie({ name: 'cookie2' });
      expect(await page.evaluate('document.cookie')).toBe(
        'cookie1=1; cookie3=3'
      );
    });
  });
});
