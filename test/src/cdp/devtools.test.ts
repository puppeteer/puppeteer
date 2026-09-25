/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import type {LaunchOptions} from 'puppeteer-core/internal/node/LaunchOptions.js';

import {getTestState, launch} from '../mocha-utils.js';

describe('DevTools', function () {
  /* These tests fire up an actual browser so let's
   * allow a higher timeout
   */
  this.timeout(20_000);

  let launchOptions: LaunchOptions;
  const browsers: Array<() => Promise<void>> = [];

  beforeEach(async () => {
    const {defaultBrowserOptions} = await getTestState({
      skipLaunch: true,
    });
    launchOptions = Object.assign({}, defaultBrowserOptions, {
      devtools: true,
    });
  });

  async function launchBrowser(options: typeof launchOptions) {
    const {browser, close} = await launch(options, {createContext: false});
    browsers.push(close);
    return browser;
  }

  afterEach(async () => {
    await Promise.all(
      browsers.map((close, index) => {
        delete browsers[index];
        return close();
      }),
    );
  });

  it('target.page() should return a DevTools page if custom isPageTarget is provided', async function () {
    const {puppeteer} = await getTestState({skipLaunch: true});
    const originalBrowser = await launchBrowser(launchOptions);

    const browserWSEndpoint = originalBrowser.wsEndpoint();

    using browser = await puppeteer.connect({
      browserWSEndpoint,
      _isPageTarget(target) {
        return (
          target.type() === 'other' && target.url().startsWith('devtools://')
        );
      },
    });
    const devtoolsPageTarget = await browser.waitForTarget(target => {
      return target.type() === 'other';
    });
    const page = (await devtoolsPageTarget.page())!;
    assert.strictEqual(
      await page.evaluate(() => {
        return 2 * 3;
      }),
      6,
    );
    assert.include(await browser.pages(), page);
  });

  it('browser.pages() should return a DevTools page if handleDevToolsAsPage is provided in connect()', async function () {
    const {puppeteer} = await getTestState({skipLaunch: true});
    const originalBrowser = await launchBrowser(launchOptions);

    const browserWSEndpoint = originalBrowser.wsEndpoint();

    using browser = await puppeteer.connect({
      browserWSEndpoint,
      handleDevToolsAsPage: true,
    });
    const devtoolsPageTarget = await browser.waitForTarget(target => {
      return target.type() === 'other' && target.url().startsWith('devtools');
    });
    const page = (await devtoolsPageTarget.page())!;
    await page.waitForFunction(() => {
      // @ts-expect-error devtools context.
      return Boolean(window.DevToolsAPI);
    });
    assert.include(await browser.pages(), page);
  });

  it('browser.pages() should return a DevTools page if handleDevToolsAsPage is provided in launch()', async function () {
    const browser = await launchBrowser({
      ...launchOptions,
      handleDevToolsAsPage: true,
    });

    const devtoolsPageTarget = await browser.waitForTarget(target => {
      return target.type() === 'other' && target.url().startsWith('devtools');
    });
    const page = (await devtoolsPageTarget.page())!;

    await page.waitForFunction(() => {
      // @ts-expect-error devtools context.
      return Boolean(window.DevToolsAPI);
    });
    assert.include(await browser.pages(), page);
  });

  it('target.page() should return Page when calling asPage on DevTools target', async function () {
    const browser = await launchBrowser(launchOptions);
    const devtoolsPageTarget = await browser.waitForTarget(target => {
      return target.type() === 'other';
    });
    const page = (await devtoolsPageTarget.asPage())!;
    const page2 = (await devtoolsPageTarget.asPage())!;
    assert.strictEqual(page, page2);

    assert.strictEqual(
      await page.evaluate(() => {
        return 2 * 3;
      }),
      6,
    );
    // The page won't be part of browser.pages() if a custom isPageTarget is not provided
    assert.notInclude(await browser.pages(), page);
  });
  it('should open devtools when "devtools: true" option is given', async () => {
    const browser = await launchBrowser(
      Object.assign({devtools: true}, launchOptions),
    );
    const context = await browser.createBrowserContext();
    await Promise.all([
      context.newPage(),
      browser.waitForTarget((target: {url: () => string | string[]}) => {
        return target.url().includes('devtools://');
      }),
    ]);
    await browser.close();
  });

  it('should expose DevTools as a page', async () => {
    const browser = await launchBrowser(
      Object.assign({devtools: true}, launchOptions),
    );
    const context = await browser.createBrowserContext();
    const [target] = await Promise.all([
      browser.waitForTarget((target: {url: () => string | string[]}) => {
        return target.url().includes('devtools://');
      }),
      context.newPage(),
    ]);
    const page = await target.page();
    await page!.waitForFunction(() => {
      // @ts-expect-error wrong context.
      return Boolean(window.DevToolsAPI);
    });
    await browser.close();
  });

  it('should support opening DevTools on a page', async () => {
    const browser = await launchBrowser({
      ...launchOptions,
      devtools: false,
    });
    const page = await browser.newPage();
    await page.goto('about:blank');
    const devtoolsPage = await page.openDevTools();
    await devtoolsPage!.waitForFunction(() => {
      // @ts-expect-error wrong context.
      return Boolean(window.DevToolsAPI);
    });
    await browser.close();
  });

  it('should return same object when calling openDevTools twice', async () => {
    const browser = await launchBrowser({
      ...launchOptions,
      devtools: false,
    });
    const page = await browser.newPage();
    await page.goto('about:blank');
    const devtoolsPage = await page.openDevTools();
    const devtoolsPage2 = await page.openDevTools();
    assert.strictEqual(devtoolsPage, devtoolsPage2);
    await browser.close();
  });

  describe('hasDevTools', () => {
    it('should report correctly after DevTools is opened', async () => {
      const browser = await launchBrowser({
        ...launchOptions,
        devtools: false,
      });
      const page = await browser.newPage();
      await page.goto('about:blank');
      assert.isFalse(await page.hasDevTools());
      await page.openDevTools();
      assert.isTrue(await page.hasDevTools());
      await browser.close();
    });

    it('should report when DevTools is attached by default', async () => {
      const browser = await launchBrowser(launchOptions);
      const page = await browser.newPage();
      await page.goto('about:blank');
      assert.isTrue(await page.hasDevTools());
      await browser.close();
    });

    it('should report when DevTools has been attached to a page with devtools:false', async () => {
      const browser = await launchBrowser({
        ...launchOptions,
        devtools: false,
      });
      const page = await browser.newPage();
      await page.goto('about:blank');
      await page.openDevTools();
      assert.isTrue(await page.hasDevTools());
      await browser.close();
    });
  });
});
