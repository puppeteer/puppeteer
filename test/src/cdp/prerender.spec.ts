/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {statSync} from 'fs';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';
import {getUniqueVideoFilePlaceholder} from '../utils.js';

describe('Prerender', function () {
  setupTestBrowserHooks();

  it('can navigate to a prerendered page via input', async () => {
    const {page, server} = await getTestState();
    await page.goto(server.PREFIX + '/prerender/index.html');

    using button = await page.waitForSelector('button');
    await button?.click();

    using link = await page.waitForSelector('a');
    await Promise.all([page.waitForNavigation(), link?.click()]);
    expect(
      await page.evaluate(() => {
        return document.body.innerText;
      })
    ).toBe('target');
  });

  it('can navigate to a prerendered page via Puppeteer', async () => {
    const {page, server} = await getTestState();
    await page.goto(server.PREFIX + '/prerender/index.html');

    using button = await page.waitForSelector('button');
    await button?.click();

    await page.goto(server.PREFIX + '/prerender/target.html');
    expect(
      await page.evaluate(() => {
        return document.body.innerText;
      })
    ).toBe('target');
  });

  describe('via frame', () => {
    it('can navigate to a prerendered page via input', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/prerender/index.html');

      using button = await page.waitForSelector('button');
      await button?.click();

      const mainFrame = page.mainFrame();
      using link = await mainFrame.waitForSelector('a');
      await Promise.all([mainFrame.waitForNavigation(), link?.click()]);
      expect(mainFrame).toBe(page.mainFrame());
      expect(
        await mainFrame.evaluate(() => {
          return document.body.innerText;
        })
      ).toBe('target');
      expect(mainFrame).toBe(page.mainFrame());
    });

    it('can navigate to a prerendered page via Puppeteer', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/prerender/index.html');

      using button = await page.waitForSelector('button');
      await button?.click();

      const mainFrame = page.mainFrame();
      await mainFrame.goto(server.PREFIX + '/prerender/target.html');
      expect(
        await mainFrame.evaluate(() => {
          return document.body.innerText;
        })
      ).toBe('target');
      expect(mainFrame).toBe(page.mainFrame());
    });
  });

  it('can screencast', async () => {
    using file = getUniqueVideoFilePlaceholder();

    const {page, server} = await getTestState();

    const recorder = await page.screencast({
      path: file.filename,
      scale: 0.5,
      crop: {width: 100, height: 100, x: 0, y: 0},
      speed: 0.5,
    });

    await page.goto(server.PREFIX + '/prerender/index.html');

    using button = await page.waitForSelector('button');
    await button?.click();

    using link = await page.locator('a').waitHandle();
    await Promise.all([page.waitForNavigation(), link.click()]);
    using input = await page.locator('input').waitHandle();
    await input.type('ab', {delay: 100});

    await recorder.stop();

    expect(statSync(file.filename).size).toBeGreaterThan(0);
  });

  describe('with network requests', () => {
    it('can receive requests from the prerendered page', async () => {
      const {page, server} = await getTestState();

      const urls: string[] = [];
      page.on('request', request => {
        urls.push(request.url());
      });

      await page.goto(server.PREFIX + '/prerender/index.html');
      using button = await page.waitForSelector('button');
      await button?.click();
      const mainFrame = page.mainFrame();
      using link = await mainFrame.waitForSelector('a');
      await Promise.all([mainFrame.waitForNavigation(), link?.click()]);
      expect(mainFrame).toBe(page.mainFrame());
      expect(
        await mainFrame.evaluate(() => {
          return document.body.innerText;
        })
      ).toBe('target');
      expect(mainFrame).toBe(page.mainFrame());
      expect(
        urls.find(url => {
          return url.endsWith('prerender/target.html');
        })
      ).toBeTruthy();
      expect(
        urls.find(url => {
          return url.includes('prerender/index.html');
        })
      ).toBeTruthy();
      expect(
        urls.find(url => {
          return url.includes('prerender/target.html?fromPrerendered');
        })
      ).toBeTruthy();
    });
  });

  describe('with emulation', () => {
    it('can configure viewport for prerendered pages', async () => {
      const {page, server} = await getTestState();
      await page.setViewport({
        width: 300,
        height: 400,
      });
      await page.goto(server.PREFIX + '/prerender/index.html');
      using button = await page.waitForSelector('button');
      await button?.click();
      using link = await page.waitForSelector('a');
      await Promise.all([page.waitForNavigation(), link?.click()]);
      const result = await page.evaluate(() => {
        return {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
          dpr: window.devicePixelRatio,
        };
      });
      expect({
        width: result.width,
        height: result.height,
      }).toStrictEqual({
        width: 300 * result.dpr,
        height: 400 * result.dpr,
      });
    });
  });
});
