/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
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
    expect(
      await page.evaluate(() => {
        return 2 * 3;
      }),
    ).toBe(6);
    expect(await browser.pages()).toContain(page);
  });
  it('target.page() should return Page when calling asPage on DevTools target', async function () {
    const {puppeteer} = await getTestState({skipLaunch: true});
    const originalBrowser = await launchBrowser(launchOptions);

    const browserWSEndpoint = originalBrowser.wsEndpoint();

    using browser = await puppeteer.connect({
      browserWSEndpoint,
    });
    const devtoolsPageTarget = await browser.waitForTarget(target => {
      return target.type() === 'other';
    });
    const page = (await devtoolsPageTarget.asPage())!;
    expect(
      await page.evaluate(() => {
        return 2 * 3;
      }),
    ).toBe(6);
    // The page won't be part of browser.pages() if a custom isPageTarget is not provided
    expect(await browser.pages()).not.toContain(page);
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
      return Boolean(DevToolsAPI);
    });
    await browser.close();
  });
});
