/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';
import {assertRejects} from '../utils.js';

describe('PWA', function () {
  // The `PWA` CDP domain is only available over a pipe connection.
  const state = setupSeparateTestBrowserHooks(
    {
      pipe: true,
    },
    {createContext: false},
  );

  async function installTestPWA(
    displayMode?: 'standalone' | 'browser',
  ): Promise<{
    manifestId: string;
    startUrl: string;
  }> {
    const {browser, server} = state;
    const manifestId = `${server.PREFIX}/pwa/`;
    const startUrl = `${server.PREFIX}/pwa/index.html`;
    const returnedId = await browser.installPWA({
      manifestId,
      installUrlOrBundleUrl: startUrl,
      displayMode,
    });
    assert.strictEqual(returnedId, manifestId);
    return {manifestId, startUrl};
  }

  it('installs and uninstalls a PWA', async () => {
    const {browser} = state;
    const {manifestId} = await installTestPWA();

    // getPWAState resolves for an installed app.
    const installedState = await browser.getPWAState({manifestId});
    assert.strictEqual(installedState.badgeCount, 0);
    assert.isTrue(Array.isArray(installedState.fileHandlers));

    await browser.uninstallPWA({manifestId});

    // After uninstall, querying the app state should reject.
    await assertRejects(browser.getPWAState({manifestId}));
  });

  it('launches an installed PWA and returns its Page', async () => {
    const {browser} = state;
    const {manifestId, startUrl} = await installTestPWA('standalone');

    const page = await browser.launchPWA({manifestId});
    try {
      assert.strictEqual(page.url(), startUrl);
      const isStandalone = await page.evaluate(() => {
        return matchMedia('(display-mode: standalone)').matches;
      });
      assert.isTrue(isStandalone);
    } finally {
      await page.close().catch(() => {});
      await browser.uninstallPWA({manifestId}).catch(() => {});
    }
  });

  it('launches an installed PWA at an explicit url', async () => {
    const {browser} = state;
    const {manifestId, startUrl} = await installTestPWA('standalone');

    const page = await browser.launchPWA({manifestId, url: startUrl});
    try {
      assert.strictEqual(page.url(), startUrl);
    } finally {
      await page.close().catch(() => {});
      await browser.uninstallPWA({manifestId}).catch(() => {});
    }
  });

  it('installs a PWA with a standalone display mode', async () => {
    const {browser, server} = state;
    const manifestId = `${server.PREFIX}/pwa/`;
    const startUrl = `${server.PREFIX}/pwa/index.html`;

    await browser.installPWA({
      manifestId,
      installUrlOrBundleUrl: startUrl,
      displayMode: 'standalone',
    });

    const page = await browser.launchPWA({manifestId});
    try {
      const isStandalone = await page.evaluate(() => {
        return matchMedia('(display-mode: standalone)').matches;
      });
      assert.isTrue(isStandalone);
    } finally {
      await page.close().catch(() => {});
      await browser.uninstallPWA({manifestId}).catch(() => {});
    }
  });
});
