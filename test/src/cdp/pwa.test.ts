/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {setTimeout} from 'node:timers/promises';

import expect from 'expect';
import type {Browser} from 'puppeteer-core/internal/api/Browser.js';
import type {Page} from 'puppeteer-core/internal/api/Page.js';
import {UnsupportedOperation} from 'puppeteer-core/internal/common/Errors.js';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

async function waitForStandalonePage(browser: Browser): Promise<Page> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    for (const candidate of await browser.pages()) {
      const isStandalone = await candidate
        .evaluate(() => {
          return matchMedia('(display-mode: standalone)').matches;
        })
        .catch(() => {
          return false;
        });
      if (isStandalone) {
        return candidate;
      }
    }
    await setTimeout(50);
  }
  throw new Error('Timed out waiting for the standalone PWA page');
}

describe('PWA', function () {
  this.timeout(30000);

  const state = setupSeparateTestBrowserHooks(
    {headless: false, pipe: true},
    {createContext: false},
  );
  let page: Page;

  beforeEach(async () => {
    const {browser, server} = state;
    page = await browser.newPage();
    server.setRoute('/pwa.html', (_req, res) => {
      res.end(`<!doctype html>
        <html>
          <head>
            <title>PWA test</title>
            <link rel="manifest" href="/pwa.webmanifest">
          </head>
          <body>
            <script>navigator.serviceWorker.register('/pwa-sw.js')</script>
          </body>
        </html>`);
    });
    server.setRoute('/pwa.webmanifest', (_req, res) => {
      res.setHeader('Content-Type', 'application/manifest+json');
      res.end(
        JSON.stringify({
          id: '/pwa',
          name: 'PWA test',
          short_name: 'PWA test',
          start_url: '/pwa.html',
          scope: '/',
          display: 'standalone',
          icons: [
            {
              src: '/pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
            },
          ],
        }),
      );
    });
    server.setRoute('/pwa-sw.js', (_req, res) => {
      res.setHeader('Content-Type', 'text/javascript');
      res.end('self.addEventListener("fetch", () => {});');
    });
    server.setRoute('/pwa-icon.svg', (_req, res) => {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.end(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
          '<rect width="512" height="512" fill="black"/>' +
          '</svg>',
      );
    });

    await page.goto(server.PREFIX + '/pwa.html');
    await page.evaluate(() => {
      return navigator.serviceWorker.ready;
    });
  });

  afterEach(async () => {
    const {browser, server} = state;
    await browser
      .uninstallPWA({manifestId: server.PREFIX + '/pwa'})
      .catch(() => {});
    if (!page.isClosed()) {
      await page.close();
    }
  });

  it('should install, inspect, and uninstall a PWA', async () => {
    const {browser, server} = state;
    const manifestId = server.PREFIX + '/pwa';

    expect(
      await browser.installPWA({
        manifestId,
        installUrlOrBundleUrl: server.PREFIX + '/pwa.html',
        displayMode: 'browser',
      }),
    ).toBe(manifestId);

    const appPage = await browser.launchPWA({manifestId});
    expect(
      await appPage.evaluate(() => {
        return matchMedia('(display-mode: standalone)').matches;
      }),
    ).toBe(false);

    expect(await browser.getPWAState({manifestId})).toEqual({
      badgeCount: 0,
      fileHandlers: [],
    });

    await browser.uninstallPWA({manifestId});
    await expect(browser.getPWAState({manifestId})).rejects.toThrow();
  });

  it('should launch an installed PWA as a page', async () => {
    const {browser, server} = state;
    const manifestId = server.PREFIX + '/pwa';
    await browser.installPWA({
      manifestId,
      installUrlOrBundleUrl: server.PREFIX + '/pwa.html',
    });

    const appPage = await browser.launchPWA({manifestId});
    expect(await appPage.title()).toBe('PWA test');

    await browser.uninstallPWA({manifestId});
  });

  it('should install the current page with a display mode', async () => {
    const {browser, server} = state;
    const manifestId = server.PREFIX + '/pwa';

    expect(await page.installAsPWA({displayMode: 'browser'})).toBe(manifestId);

    const appPage = await browser.launchPWA({manifestId});
    expect(
      await appPage.evaluate(() => {
        return matchMedia('(display-mode: standalone)').matches;
      }),
    ).toBe(false);

    await browser.uninstallPWA({manifestId});
  });

  it('should open the current page as a PWA', async () => {
    const {browser, server} = state;
    const manifestId = server.PREFIX + '/pwa';

    await page.installAsPWA({displayMode: 'standalone'});

    await page.openInPWA();
    const appPage = await waitForStandalonePage(browser);
    expect(await appPage.title()).toBe('PWA test');

    await browser.uninstallPWA({manifestId});
  });

  it('should reject page PWA operations without an app id', async () => {
    const {server} = state;
    await page.goto(server.EMPTY_PAGE);

    await expect(page.installAsPWA()).rejects.toThrow(
      'Page is not associated with a PWA',
    );
    await expect(page.openInPWA()).rejects.toThrow(
      'Page is not associated with a PWA',
    );
  });
});

describe('PWA (WebDriver BiDi)', function () {
  const state = setupSeparateTestBrowserHooks(
    {protocol: 'webDriverBiDi'},
    {createContext: false},
  );
  let page: Page;

  beforeEach(async () => {
    page = await state.browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  it('should reject browser PWA operations', async () => {
    const {browser} = state;
    const manifestId = 'https://example.com/app';

    expect(() => {
      return browser.installPWA({manifestId});
    }).toThrow(UnsupportedOperation);
    expect(() => {
      return browser.uninstallPWA({manifestId});
    }).toThrow(UnsupportedOperation);
    expect(() => {
      return browser.launchPWA({manifestId});
    }).toThrow(UnsupportedOperation);
    expect(() => {
      return browser.getPWAState({manifestId});
    }).toThrow(UnsupportedOperation);
  });

  it('should reject page PWA operations', async () => {
    expect(() => {
      return page.installAsPWA();
    }).toThrow(UnsupportedOperation);
    expect(() => {
      return page.openInPWA();
    }).toThrow(UnsupportedOperation);
  });
});
