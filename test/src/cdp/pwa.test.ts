/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

describe('PWA', function () {
  // The `PWA` CDP domain is only available over a pipe connection and requires
  // the `--enable-devtools-pwa-handler` flag.
  const state = setupSeparateTestBrowserHooks(
    {
      pipe: true,
      args: ['--enable-devtools-pwa-handler'],
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
    expect(returnedId).toBe(manifestId);
    return {manifestId, startUrl};
  }

  it('installs and uninstalls a PWA', async () => {
    const {browser} = state;
    const {manifestId} = await installTestPWA();

    // getPWAState resolves for an installed app.
    const installedState = await browser.getPWAState({manifestId});
    expect(installedState.badgeCount).toBe(0);
    expect(Array.isArray(installedState.fileHandlers)).toBe(true);

    await browser.uninstallPWA({manifestId});

    // After uninstall, querying the app state should reject.
    await expect(browser.getPWAState({manifestId})).rejects.toThrow();
  });

  it('launches an installed PWA and returns its Page', async () => {
    const {browser} = state;
    const {manifestId, startUrl} = await installTestPWA('standalone');

    const page = await browser.launchPWA({manifestId});
    try {
      expect(page.url()).toBe(startUrl);
      const isStandalone = await page.evaluate(() => {
        return matchMedia('(display-mode: standalone)').matches;
      });
      expect(isStandalone).toBe(true);
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
      expect(page.url()).toBe(startUrl);
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
      expect(isStandalone).toBe(true);
    } finally {
      await page.close().catch(() => {});
      await browser.uninstallPWA({manifestId}).catch(() => {});
    }
  });
});
