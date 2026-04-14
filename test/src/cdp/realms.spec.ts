/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import path from 'node:path';

import expect from 'expect';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

const EXTENSION_PATH = path.join(
  import.meta.dirname,
  '../../assets/simple-extension',
);

describe('extension realms', function () {
  const state = setupSeparateTestBrowserHooks(
    {
      enableExtensions: true,
      pipe: true,
    },
    {createContext: false},
  );

  it('should include content script realms', async () => {
    const {browser, server} = state;

    const page = await browser.newPage();
    const extId = await browser.installExtension(EXTENSION_PATH);
    await browser.waitForTarget(target => {
      return target.url().includes(extId);
    });

    await page.goto(server.EMPTY_PAGE);

    const realms = page.extensionRealms();
    expect(realms.length).toBeGreaterThanOrEqual(1);

    let realm;
    for (realm of realms) {
      const extension = await realm.extension();

      assert(extension, 'there should always be an extension');
      if (extension.id === extId) {
        break;
      }
    }

    expect(realm).toBeDefined();
  });

  it('realm should return extension that created it', async () => {
    const {browser, server} = state;

    const page = await browser.newPage();
    const extId = await browser.installExtension(EXTENSION_PATH);
    await browser.waitForTarget(target => {
      return target.url().includes(extId);
    });

    await page.goto(server.EMPTY_PAGE);
    const realms = page.extensionRealms();

    let realm;
    for (realm of realms) {
      const extension = await realm.extension();

      assert(extension, 'there should always be an extension');
      if (extension.id === extId) {
        break;
      }
    }
    assert(realm, 'realm should be defined');

    const extension = await realm.extension();
    assert(extension, 'realm should be defined');
    expect(extension.id).toEqual(extId);
  });

  it('should evaluate in content script realms', async () => {
    const {browser, server} = state;

    const page = await browser.newPage();
    const extId = await browser.installExtension(EXTENSION_PATH);
    await browser.waitForTarget(target => {
      return target.url().includes(extId);
    });

    await page.goto(server.EMPTY_PAGE);
    const realms = page.extensionRealms();

    let contentScriptRealm;
    for (contentScriptRealm of realms) {
      const extension = await contentScriptRealm.extension();

      assert(extension, 'there should always be an extension');
      if (extension.id === extId) {
        break;
      }
    }
    assert(contentScriptRealm, 'realm should be defined');

    const isContentScript = await contentScriptRealm!.evaluate(() => {
      return (globalThis as any).thisIsTheContentScript;
    });
    expect(isContentScript).toBe(true);

    const isContentScriptInMain = await page.evaluate(() => {
      return (globalThis as any).thisIsTheContentScript;
    });

    expect(isContentScriptInMain).toBeUndefined();
  });
});
