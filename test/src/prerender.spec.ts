/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

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
