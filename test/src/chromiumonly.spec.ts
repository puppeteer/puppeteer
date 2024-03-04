/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {IncomingMessage} from 'http';

import expect from 'expect';
import {Deferred} from 'puppeteer-core/internal/util/Deferred.js';

import {getTestState, setupTestBrowserHooks, launch} from './mocha-utils.js';
import {waitEvent} from './utils.js';
// TODO: rename this test suite to launch/connect test suite as it actually
// works across browsers.
describe('Chromium-Specific Launcher tests', function () {
  describe('Puppeteer.launch |browserURL| option', function () {
    it('should be able to connect using browserUrl, with and without trailing slash', async () => {
      const {close, puppeteer} = await launch({
        args: ['--remote-debugging-port=21222'],
      });
      try {
        const browserURL = 'http://127.0.0.1:21222';

        const browser1 = await puppeteer.connect({browserURL});
        const page1 = await browser1.newPage();
        expect(
          await page1.evaluate(() => {
            return 7 * 8;
          })
        ).toBe(56);
        await browser1.disconnect();

        const browser2 = await puppeteer.connect({
          browserURL: browserURL + '/',
        });
        const page2 = await browser2.newPage();
        expect(
          await page2.evaluate(() => {
            return 8 * 7;
          })
        ).toBe(56);
        await browser2.disconnect();
      } finally {
        await close();
      }
    });
    it('should throw when using both browserWSEndpoint and browserURL', async () => {
      const {browser, close, puppeteer} = await launch({
        args: ['--remote-debugging-port=21222'],
      });
      try {
        const browserURL = 'http://127.0.0.1:21222';

        let error!: Error;
        await puppeteer
          .connect({
            browserURL,
            browserWSEndpoint: browser.wsEndpoint(),
          })
          .catch(error_ => {
            return (error = error_);
          });
        expect(error.message).toContain(
          'Exactly one of browserWSEndpoint, browserURL or transport'
        );
      } finally {
        await close();
      }
    });
    it('should throw when trying to connect to non-existing browser', async () => {
      const {close, puppeteer} = await launch({
        args: ['--remote-debugging-port=21222'],
      });
      try {
        const browserURL = 'http://127.0.0.1:32333';

        let error!: Error;
        await puppeteer.connect({browserURL}).catch(error_ => {
          return (error = error_);
        });
        expect(error.message).toContain(
          'Failed to fetch browser webSocket URL from'
        );
      } finally {
        await close();
      }
    });
  });

  describe('Puppeteer.launch |pipe| option', function () {
    it('should support the pipe option', async () => {
      const {browser, close} = await launch({pipe: true}, {createPage: false});
      try {
        expect(await browser.pages()).toHaveLength(1);
        expect(browser.wsEndpoint()).toBe('');
        const page = await browser.newPage();
        expect(await page.evaluate('11 * 11')).toBe(121);
        await page.close();
      } finally {
        await close();
      }
    });
    it('should support the pipe argument', async () => {
      const {defaultBrowserOptions} = await getTestState({skipLaunch: true});
      const options = Object.assign({}, defaultBrowserOptions);
      options.args = ['--remote-debugging-pipe'].concat(options.args || []);
      const {browser, close} = await launch(options);
      try {
        expect(browser.wsEndpoint()).toBe('');
        const page = await browser.newPage();
        expect(await page.evaluate('11 * 11')).toBe(121);
        await page.close();
      } finally {
        await close();
      }
    });
    it('should fire "disconnected" when closing with pipe', async function () {
      const {browser, close} = await launch({pipe: true});
      try {
        const disconnectedEventPromise = waitEvent(browser, 'disconnected');
        // Emulate user exiting browser.
        browser.process()!.kill();
        await Deferred.race([
          disconnectedEventPromise,
          Deferred.create({
            message: `Failed in after Hook`,
            timeout: this.timeout() - 1000,
          }),
        ]);
      } finally {
        await close();
      }
    });
  });
});

describe('Chromium-Specific Page Tests', function () {
  setupTestBrowserHooks();

  it('Page.setRequestInterception should work with intervention headers', async () => {
    const {server, page} = await getTestState();

    server.setRoute('/intervention', (_req, res) => {
      return res.end(`
        <script>
          document.write('<script src="${server.CROSS_PROCESS_PREFIX}/intervention.js">' + '</scr' + 'ipt>');
        </script>
      `);
    });
    server.setRedirect('/intervention.js', '/redirect.js');
    let serverRequest: IncomingMessage | undefined;
    server.setRoute('/redirect.js', (req, res) => {
      serverRequest = req;
      res.end('console.log(1);');
    });

    await page.setRequestInterception(true);
    page.on('request', request => {
      return request.continue();
    });
    await page.goto(server.PREFIX + '/intervention');
    // Check for feature URL substring rather than https://www.chromestatus.com to
    // make it work with Edgium.
    expect(serverRequest!.headers['intervention']).toContain(
      'feature/5718547946799104'
    );
  });

  it('Page.deleteCookie should delete cookie for specified URL regardless of the current page', async () => {
    // This test depends on the cookie partition implementation. It verifies the
    // `page.deleteCookie` method deletes cookies for the custom destination URL, even if
    // it was set from another page.

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
