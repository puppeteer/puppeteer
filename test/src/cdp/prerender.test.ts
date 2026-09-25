/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {statSync} from 'node:fs';

import {assert} from 'chai';

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
    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('div')?.innerText;
      }),
      'true',
    );
  });

  it('can navigate to a prerendered page via Locator', async () => {
    const {page, server} = await getTestState();
    const timeout = 5000;
    for (let i = 0; i < 3; i++) {
      {
        const targetPage = page;
        await targetPage.goto(server.PREFIX + '/prerender/declarative.html');
      }
      {
        const targetPage = page;
        const promises: Array<Promise<any>> = [];
        const startWaitingForEvents = () => {
          promises.push(targetPage.waitForNavigation());
        };
        await targetPage
          .locator('a')
          .setTimeout(timeout)
          .on('action', () => {
            return startWaitingForEvents();
          })
          .click();
        await Promise.all(promises);
      }
      assert.strictEqual(
        await page.evaluate(() => {
          return document.querySelector('div')?.innerText;
        }),
        'true',
      );
    }
  });

  it('can navigate to a prerendered page via Puppeteer', async () => {
    const {page, server} = await getTestState();
    await page.goto(server.PREFIX + '/prerender/index.html');

    using button = await page.waitForSelector('button');
    await button?.click();

    await page.goto(server.PREFIX + '/prerender/target.html');
    assert.strictEqual(
      await page.evaluate(() => {
        return document.querySelector('div')?.innerText;
      }),
      'false',
    );
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
      assert.strictEqual(mainFrame, page.mainFrame());
      assert.strictEqual(
        await mainFrame.evaluate(() => {
          return document.querySelector('div')?.innerText;
        }),
        'true',
      );
      assert.strictEqual(mainFrame, page.mainFrame());
    });

    it('can navigate to a prerendered page via Puppeteer', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/prerender/index.html');

      using button = await page.waitForSelector('button');
      await button?.click();

      const mainFrame = page.mainFrame();
      await mainFrame.goto(server.PREFIX + '/prerender/target.html');
      assert.strictEqual(
        await mainFrame.evaluate(() => {
          return document.querySelector('div')?.innerText;
        }),
        'false',
      );
      assert.strictEqual(mainFrame, page.mainFrame());
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

    assert.isAbove(statSync(file.filename).size, 0);
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
      assert.strictEqual(mainFrame, page.mainFrame());
      assert.strictEqual(
        await mainFrame.evaluate(() => {
          return document.querySelector('div')?.innerText;
        }),
        'true',
      );
      assert.strictEqual(mainFrame, page.mainFrame());
      assert.ok(
        urls.find(url => {
          return url.endsWith('prerender/target.html');
        }),
      );
      assert.ok(
        urls.find(url => {
          return url.includes('prerender/index.html');
        }),
      );
      assert.ok(
        urls.find(url => {
          return url.includes('prerender/target.html?fromPrerendered');
        }),
      );
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
      assert.deepEqual(
        {
          width: result.width,
          height: result.height,
        },
        {
          width: 300 * result.dpr,
          height: 400 * result.dpr,
        },
      );
    });
  });
});
