/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';

import expect from 'expect';
import {MAIN_WORLD} from 'puppeteer-core';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

const EXTENSION_PATH = path.join(
  import.meta.dirname,
  '../../assets/simple-extension',
);

describe('realms', function () {
  const state = setupSeparateTestBrowserHooks(
    {
      enableExtensions: true,
      pipe: true,
    },
    {createContext: false},
  );

  it('should return realms for the page', async () => {
    const {browser} = state;

    const page = await browser.newPage();
    const realms = page.realms();

    expect(realms.length).toBeGreaterThanOrEqual(1);

    const worldIds = realms.map(([id]) => {
      return id;
    });
    expect(worldIds).toContain(MAIN_WORLD);
  });

  describe('extension', function () {
    it('should include content script realms', async () => {
      const {browser, server} = state;

      const page = await browser.newPage();
      const extId = await browser.installExtension(EXTENSION_PATH);
      await browser.waitForTarget(target => {
        return target.url().includes(extId);
      });

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
    });

    it('realm should return extension that created it', async () => {
      const {browser, server} = state;

      const page = await browser.newPage();
      const extId = await browser.installExtension(EXTENSION_PATH);
      await browser.waitForTarget(target => {
        return target.url().includes(extId);
      });

      await page.goto(server.EMPTY_PAGE);
      const realms = page.realms();

      const contentScriptRealm = realms.find(([id]) => {
        return id.toString().includes(extId);
      })?.[1];

      const extension = await contentScriptRealm?.extension();

      expect(extension).toBeDefined();
      expect(extension!.id).toEqual(extId);
    });

    it('should evaluate in content script realms', async () => {
      const {browser, server} = state;

      const page = await browser.newPage();
      const extId = await browser.installExtension(EXTENSION_PATH);
      await browser.waitForTarget(target => {
        return target.url().includes(extId);
      });

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
    });
  });
});
