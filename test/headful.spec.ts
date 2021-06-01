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

import path from 'path';
import os from 'os';
import fs from 'fs';
import { promisify } from 'util';
import expect from 'expect';
import {
  getTestState,
  describeChromeOnly,
  itFailsWindows,
} from './mocha-utils'; // eslint-disable-line import/extensions
import rimraf from 'rimraf';

const rmAsync = promisify(rimraf);
const mkdtempAsync = promisify(fs.mkdtemp);

const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');

const extensionPath = path.join(__dirname, 'assets', 'simple-extension');

describeChromeOnly('headful tests', function () {
  /* These tests fire up an actual browser so let's
   * allow a higher timeout
   */
  this.timeout(20 * 1000);

  let headfulOptions;
  let headlessOptions;
  let extensionOptions;
  let forcedOopifOptions;
  const browsers = [];

  beforeEach(() => {
    const { server, defaultBrowserOptions } = getTestState();
    headfulOptions = Object.assign({}, defaultBrowserOptions, {
      headless: false,
    });
    headlessOptions = Object.assign({}, defaultBrowserOptions, {
      headless: true,
    });

    extensionOptions = Object.assign({}, defaultBrowserOptions, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    forcedOopifOptions = Object.assign({}, defaultBrowserOptions, {
      headless: false,
      devtools: true,
      args: [
        `--host-rules=MAP oopifdomain 127.0.0.1`,
        `--isolate-origins=${server.PREFIX.replace(
          'localhost',
          'oopifdomain'
        )}`,
      ],
    });
  });

  async function launchBrowser(puppeteer, options) {
    const browser = await puppeteer.launch(options);
    browsers.push(browser);
    return browser;
  }

  afterEach(() => {
    for (const i in browsers) {
      const browser = browsers[i];
      if (browser.isConnected()) {
        browser.close();
      }
      delete browsers[i];
    }
  });

  describe('HEADFUL', function () {
    it('background_page target type should be available', async () => {
      const { puppeteer } = getTestState();
      const browserWithExtension = await launchBrowser(
        puppeteer,
        extensionOptions
      );
      const page = await browserWithExtension.newPage();
      const backgroundPageTarget = await browserWithExtension.waitForTarget(
        (target) => target.type() === 'background_page'
      );
      await page.close();
      await browserWithExtension.close();
      expect(backgroundPageTarget).toBeTruthy();
    });
    it('target.page() should return a background_page', async function () {
      const { puppeteer } = getTestState();
      const browserWithExtension = await launchBrowser(
        puppeteer,
        extensionOptions
      );
      const backgroundPageTarget = await browserWithExtension.waitForTarget(
        (target) => target.type() === 'background_page'
      );
      const page = await backgroundPageTarget.page();
      expect(await page.evaluate(() => 2 * 3)).toBe(6);
      expect(await page.evaluate(() => globalThis.MAGIC)).toBe(42);
      await browserWithExtension.close();
    });
    it('should have default url when launching browser', async function () {
      const { puppeteer } = getTestState();
      const browser = await launchBrowser(puppeteer, extensionOptions);
      const pages = (await browser.pages()).map((page) => page.url());
      expect(pages).toEqual(['about:blank']);
      await browser.close();
    });
    itFailsWindows(
      'headless should be able to read cookies written by headful',
      async () => {
        /* Needs investigation into why but this fails consistently on Windows CI. */
        const { server, puppeteer } = getTestState();

        const userDataDir = await mkdtempAsync(TMP_FOLDER);
        // Write a cookie in headful chrome
        const headfulBrowser = await launchBrowser(
          puppeteer,
          Object.assign({ userDataDir }, headfulOptions)
        );
        const headfulPage = await headfulBrowser.newPage();
        await headfulPage.goto(server.EMPTY_PAGE);
        await headfulPage.evaluate(
          () =>
            (document.cookie =
              'foo=true; expires=Fri, 31 Dec 9999 23:59:59 GMT')
        );
        await headfulBrowser.close();
        // Read the cookie from headless chrome
        const headlessBrowser = await launchBrowser(
          puppeteer,
          Object.assign({ userDataDir }, headlessOptions)
        );
        const headlessPage = await headlessBrowser.newPage();
        await headlessPage.goto(server.EMPTY_PAGE);
        const cookie = await headlessPage.evaluate(() => document.cookie);
        await headlessBrowser.close();
        // This might throw. See https://github.com/puppeteer/puppeteer/issues/2778
        await rmAsync(userDataDir).catch(() => {});
        expect(cookie).toBe('foo=true');
      }
    );
    // TODO: Support OOOPIF. @see https://github.com/puppeteer/puppeteer/issues/2548
    xit('OOPIF: should report google.com frame', async () => {
      const { server, puppeteer } = getTestState();

      // https://google.com is isolated by default in Chromium embedder.
      const browser = await launchBrowser(puppeteer, headfulOptions);
      const page = await browser.newPage();
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(true);
      page.on('request', (r) => r.respond({ body: 'YO, GOOGLE.COM' }));
      await page.evaluate(() => {
        const frame = document.createElement('iframe');
        frame.setAttribute('src', 'https://google.com/');
        document.body.appendChild(frame);
        return new Promise((x) => (frame.onload = x));
      });
      await page.waitForSelector('iframe[src="https://google.com/"]');
      const urls = page
        .frames()
        .map((frame) => frame.url())
        .sort();
      expect(urls).toEqual([server.EMPTY_PAGE, 'https://google.com/']);
      await browser.close();
    });
    it('OOPIF: should expose events within OOPIFs', async () => {
      const { server, puppeteer } = getTestState();

      const browser = await launchBrowser(puppeteer, forcedOopifOptions);
      const page = await browser.newPage();

      // Setup our session listeners to observe OOPIF activity.
      const session = await page.target().createCDPSession();
      const networkEvents = [];
      const otherSessions = [];
      await session.send('Target.setAutoAttach', {
        autoAttach: true,
        flatten: true,
        waitForDebuggerOnStart: true,
      });
      session.on('sessionattached', async (session) => {
        otherSessions.push(session);

        session.on('Network.requestWillBeSent', (params) =>
          networkEvents.push(params)
        );
        await session.send('Network.enable');
        await session.send('Runtime.runIfWaitingForDebugger');
      });

      // Navigate to the empty page and add an OOPIF iframe with at least one request.
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate((frameUrl) => {
        const frame = document.createElement('iframe');
        frame.setAttribute('src', frameUrl);
        document.body.appendChild(frame);
        return new Promise((x, y) => {
          frame.onload = x;
          frame.onerror = y;
        });
      }, server.PREFIX.replace('localhost', 'oopifdomain') + '/one-style.html');
      await page.waitForSelector('iframe');

      // Ensure we found the iframe session.
      expect(otherSessions).toHaveLength(1);

      // Resume the iframe and trigger another request.
      const iframeSession = otherSessions[0];
      await iframeSession.send('Runtime.evaluate', {
        expression: `fetch('/fetch')`,
        awaitPromise: true,
      });
      await browser.close();

      const requests = networkEvents.map((event) => event.request.url);
      expect(requests).toContain(`http://oopifdomain:${server.PORT}/fetch`);
    });
    it('should close browser with beforeunload page', async () => {
      const { server, puppeteer } = getTestState();

      const browser = await launchBrowser(puppeteer, headfulOptions);
      const page = await browser.newPage();
      await page.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await page.click('body');
      await browser.close();
    });
    it('should open devtools when "devtools: true" option is given', async () => {
      const { puppeteer } = getTestState();

      const browser = await launchBrowser(
        puppeteer,
        Object.assign({ devtools: true }, headfulOptions)
      );
      const context = await browser.createIncognitoBrowserContext();
      await Promise.all([
        context.newPage(),
        browser.waitForTarget((target) => target.url().includes('devtools://')),
      ]);
      await browser.close();
    });
  });

  describe('Page.bringToFront', function () {
    it('should work', async () => {
      const { puppeteer } = getTestState();
      const browser = await launchBrowser(puppeteer, headfulOptions);
      const page1 = await browser.newPage();
      const page2 = await browser.newPage();

      await page1.bringToFront();
      expect(await page1.evaluate(() => document.visibilityState)).toBe(
        'visible'
      );
      expect(await page2.evaluate(() => document.visibilityState)).toBe(
        'hidden'
      );

      await page2.bringToFront();
      expect(await page1.evaluate(() => document.visibilityState)).toBe(
        'hidden'
      );
      expect(await page2.evaluate(() => document.visibilityState)).toBe(
        'visible'
      );

      await page1.close();
      await page2.close();
      await browser.close();
    });
  });
});
