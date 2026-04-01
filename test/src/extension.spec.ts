/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';

import expect from 'expect';
import {MAIN_WORLD} from 'puppeteer-core';
import type {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';

import {getTestState, setupTestBrowserHooks, launch} from './mocha-utils.js';

const EXTENSION_PATH = path.join(
  import.meta.dirname,
  '/../assets/simple-extension',
);

const EXTENSION_WITH_PAGE_PATH = path.join(
  import.meta.dirname,
  '/../assets/extension-with-page',
);

describe('Page.realms', function () {
  setupTestBrowserHooks();

  it('should return realms for the page', async () => {
    const {page} = await getTestState();
    const realms = page.realms();

    expect(realms.length).toBeGreaterThanOrEqual(1);

    const worldIds = realms.map(([id]) => {
      return id;
    });
    expect(worldIds).toContain(MAIN_WORLD);
  });

  it('realms should have a worldId', async () => {
    const {page} = await getTestState();
    const realms = page.realms();

    expect(realms.length).toBeGreaterThanOrEqual(1);

    const mainRealm = realms.find(([id]) => {
      return id === MAIN_WORLD;
    })?.[1];
    expect(mainRealm?.worldId).toEqual(MAIN_WORLD);
  });

  it('should include content script realms', async () => {
    const {defaultBrowserOptions, isChrome, server} = await getTestState({
      skipLaunch: true,
    });

    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);

    try {
      const page = await browser.newPage();
      const extId = await browser.installExtension(EXTENSION_PATH);
      await page.goto(server.EMPTY_PAGE);

      const realms = page.realms();
      expect(realms.length).toBeGreaterThanOrEqual(2);

      const worldNames = realms.map(([id]) => {
        return id.toString();
      });

      expect(
        worldNames.some(name => {
          return name.includes(extId);
        }),
      ).toBe(true);
    } finally {
      await close();
    }
  });

  it('realm should return extension that created it', async () => {
    const {defaultBrowserOptions, isChrome, server} = await getTestState({
      skipLaunch: true,
    });
    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);
    try {
      const page = await browser.newPage();
      const extId = await browser.installExtension(EXTENSION_PATH);
      await page.goto(server.EMPTY_PAGE);

      const realms = page.realms();

      const contentScriptRealm = realms.find(([id]) => {
        return id.toString().includes(extId);
      })?.[1];

      const extension = await contentScriptRealm?.extension();

      expect(extension).toBeDefined();
      expect(extension!.id).toEqual(extId);
    } finally {
      await close();
    }
  });

  it('should evaluate in content script realms', async () => {
    const {defaultBrowserOptions, isChrome, server} = await getTestState({
      skipLaunch: true,
    });
    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);
    try {
      const page = await browser.newPage();
      const extId = await browser.installExtension(EXTENSION_PATH);
      await page.goto(server.EMPTY_PAGE);

      const realms = page.realms();
      const contentScriptRealm = realms.find(([id]) => {
        return id.toString().includes(extId);
      })?.[1];

      expect(contentScriptRealm).toBeDefined();

      const isContentScript = await contentScriptRealm!.evaluate(() => {
        return (globalThis as any).thisIsTheContentScript;
      });
      expect(isContentScript).toBe(true);

      const isContentScriptInMain = await page.evaluate(() => {
        return (globalThis as any).thisIsTheContentScript;
      });
      expect(isContentScriptInMain).toBeUndefined();
    } finally {
      await close();
    }
  });
});

describe('Extensions', function () {
  setupTestBrowserHooks();

  it('should list extensions and their properties', async () => {
    const {defaultBrowserOptions, isChrome} = await getTestState({
      skipLaunch: true,
    });
    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);
    try {
      const extensionId = await browser.installExtension(EXTENSION_PATH);
      const extensions = await browser.extensions();

      const extension = extensions.find(ext => {
        return ext.id === extensionId;
      });
      expect(extension).toBeDefined();
      expect(extension?.name).toBe('Simple extension');
      expect(extension?.version).toBe('0.1');
      expect(extension?.id).toBe(extensionId);
    } finally {
      await close();
    }
  });

  it('should list extension workers', async () => {
    const {defaultBrowserOptions, isChrome} = await getTestState({
      skipLaunch: true,
    });
    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);
    try {
      const extensionId = await browser.installExtension(EXTENSION_PATH);
      const extension = (await browser.extensions()).find(ext => {
        return ext.id === extensionId;
      });

      await browser.waitForTarget(target => {
        return (
          target.url().includes(extensionId) &&
          target.type() === 'service_worker'
        );
      });

      const workers = await extension!.workers();
      expect(workers.length).toBeGreaterThan(0);
    } finally {
      await close();
    }
  });

  it('should trigger extension action', async () => {
    const {defaultBrowserOptions, isChrome} = await getTestState({
      skipLaunch: true,
    });
    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);
    try {
      const page = await browser.newPage();
      const extensionId = await browser.installExtension(EXTENSION_PATH);
      const extension = (await browser.extensions()).find(ext => {
        return ext.id === extensionId;
      });

      await page.triggerExtensionAction(extension!);
      // If it doesn't throw, we consider it successful for this level of testing.
    } finally {
      await close();
    }
  });

  it('should list extension pages', async () => {
    const {defaultBrowserOptions, isChrome, server} = await getTestState({
      skipLaunch: true,
    });
    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);
    try {
      const extensionId = await browser.installExtension(
        EXTENSION_WITH_PAGE_PATH,
      );
      const extension = (await browser.extensions()).find(ext => {
        return ext.id === extensionId;
      });

      const page = await browser.newPage();
      await page.goto(server.EMPTY_PAGE);

      await extension?.triggerAction(page);

      await browser.waitForTarget(target => {
        return (
          target.url().includes('popup.html') &&
          target.url().includes(extensionId)
        );
      });

      const pages = await extension!.pages();
      expect(pages.length).toBeGreaterThanOrEqual(1);
      expect(
        pages.some(p => {
          return p.url().includes('popup.html');
        }),
      ).toBe(true);
    } finally {
      await close();
    }
  });

  it('should capture console logs from extension pages', async () => {
    const {defaultBrowserOptions, server, isChrome} = await getTestState({
      skipLaunch: true,
    });
    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);
    try {
      const extensionId = await browser.installExtension(
        EXTENSION_WITH_PAGE_PATH,
      );
      const extension = (await browser.extensions()).find(ext => {
        return ext.id === extensionId;
      });

      const page = await browser.newPage();
      await page.goto(server.EMPTY_PAGE);

      await page.triggerExtensionAction(extension!);

      const optionsPageTarget = await browser.waitForTarget(target => {
        return (
          target.url().includes('popup.html') &&
          target.url().includes(extensionId)
        );
      });

      const extPage = await optionsPageTarget.asPage();

      const [message] = await Promise.all([
        new Promise<string>(resolve => {
          extPage.on('console', msg => {
            resolve(msg.text());
          });
        }),
        extPage.evaluate(() => {
          console.log('hello from extension page');
        }),
      ]);

      expect(message).toBe('hello from extension page');
    } finally {
      await close();
    }
  });

  it('should capture console logs from extension workers', async () => {
    const {defaultBrowserOptions, isChrome} = await getTestState({
      skipLaunch: true,
    });
    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);
    try {
      const extensionId = await browser.installExtension(EXTENSION_PATH);
      const extension = (await browser.extensions()).find(ext => {
        return ext.id === extensionId;
      });

      await browser.waitForTarget(target => {
        return (
          target.url().includes(extensionId) &&
          target.type() === 'service_worker'
        );
      });

      const workers = await extension!.workers();
      const worker = workers[0]!;

      const [message] = await Promise.all([
        new Promise<string>(resolve => {
          worker.on('console', (msg: ConsoleMessage) => {
            resolve(msg.text());
          });
        }),
        worker.evaluate(() => {
          console.log('hello from extension worker');
        }),
      ]);

      expect(message).toBe('hello from extension worker');
    } finally {
      await close();
    }
  });

  it('should remove extension from list after uninstall', async () => {
    const {defaultBrowserOptions, isChrome} = await getTestState({
      skipLaunch: true,
    });
    if (!isChrome) {
      return;
    }

    const options = Object.assign({}, defaultBrowserOptions);
    options.enableExtensions = true;
    options.pipe = true;

    const {browser, close} = await launch(options);
    try {
      const id = await browser.installExtension(EXTENSION_PATH);
      let extensions = await browser.extensions();
      expect(
        extensions.some(e => {
          return e.id === id;
        }),
      ).toBe(true);

      await browser.uninstallExtension(id);

      extensions = await browser.extensions();
      expect(
        extensions.some(e => {
          return e.id === id;
        }),
      ).toBe(false);
    } finally {
      await close();
    }
  });
});
