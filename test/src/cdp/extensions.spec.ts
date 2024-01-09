/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';

import expect from 'expect';
import type {PuppeteerLaunchOptions} from 'puppeteer-core/internal/node/PuppeteerNode.js';

import {getTestState, launch} from '../mocha-utils.js';

const extensionPath = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'simple-extension'
);
const serviceWorkerExtensionPath = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'serviceworkers',
  'extension'
);

describe('extensions', function () {
  /* These tests fire up an actual browser so let's
   * allow a higher timeout
   */
  this.timeout(20_000);

  let extensionOptions: PuppeteerLaunchOptions & {
    args: string[];
  };
  const browsers: Array<() => Promise<void>> = [];

  beforeEach(async () => {
    const {defaultBrowserOptions} = await getTestState({
      skipLaunch: true,
    });

    extensionOptions = Object.assign({}, defaultBrowserOptions, {
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  async function launchBrowser(options: typeof extensionOptions) {
    const {browser, close} = await launch(options, {createContext: false});
    browsers.push(close);
    return browser;
  }

  afterEach(async () => {
    await Promise.all(
      browsers.map((close, index) => {
        delete browsers[index];
        return close();
      })
    );
  });

  it('background_page target type should be available', async () => {
    const browserWithExtension = await launchBrowser(extensionOptions);
    const page = await browserWithExtension.newPage();
    const backgroundPageTarget = await browserWithExtension.waitForTarget(
      target => {
        return target.type() === 'background_page';
      }
    );
    await page.close();
    await browserWithExtension.close();
    expect(backgroundPageTarget).toBeTruthy();
  });

  it('service_worker target type should be available', async () => {
    const browserWithExtension = await launchBrowser({
      args: [
        `--disable-extensions-except=${serviceWorkerExtensionPath}`,
        `--load-extension=${serviceWorkerExtensionPath}`,
      ],
    });
    const page = await browserWithExtension.newPage();
    const serviceWorkerTarget = await browserWithExtension.waitForTarget(
      target => {
        return target.type() === 'service_worker';
      }
    );
    await page.close();
    await browserWithExtension.close();
    expect(serviceWorkerTarget).toBeTruthy();
  });

  it('target.page() should return a background_page', async function () {
    const browserWithExtension = await launchBrowser(extensionOptions);
    const backgroundPageTarget = await browserWithExtension.waitForTarget(
      target => {
        return target.type() === 'background_page';
      }
    );
    const page = (await backgroundPageTarget.page())!;
    expect(
      await page.evaluate(() => {
        return 2 * 3;
      })
    ).toBe(6);
    expect(
      await page.evaluate(() => {
        return (globalThis as any).MAGIC;
      })
    ).toBe(42);
    await browserWithExtension.close();
  });
});
