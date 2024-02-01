/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {
  expectCookieEquals,
  getTestState,
  setupTestBrowserHooks,
} from './mocha-utils.js';

describe('DefaultBrowserContext', function () {
  setupTestBrowserHooks();

  it('page.cookies() should work', async () => {
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
  it('page.setCookie() should work', async () => {
    const {page, server} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    await page.setCookie({
      name: 'username',
      value: 'John Doe',
    });
    expect(
      await page.evaluate(() => {
        return document.cookie;
      })
    ).toBe('username=John Doe');
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
  it('page.deleteCookie() should work', async () => {
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
      }
    );
    expect(await page.evaluate('document.cookie')).toBe('cookie1=1; cookie2=2');
    await page.deleteCookie({name: 'cookie2'});
    expect(await page.evaluate('document.cookie')).toBe('cookie1=1');
    await expectCookieEquals(await page.cookies(), [
      {
        name: 'cookie1',
        value: '1',
        domain: 'localhost',
        path: '/',
        sameParty: false,
        expires: -1,
        size: 8,
        httpOnly: false,
        secure: false,
        session: true,
        sourceScheme: 'NonSecure',
      },
    ]);
  });
});
