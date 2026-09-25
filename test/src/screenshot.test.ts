/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';

import {
  getTestState,
  setupSeparateTestBrowserHooks,
  setupTestBrowserHooks,
} from './mocha-utils.js';
import {assertGolden, assertMatchObject, html} from './utils.js';

describe('Screenshots', function () {
  setupTestBrowserHooks();
  const state = setupSeparateTestBrowserHooks({
    defaultViewport: null,
  });

  describe('Page.screenshot', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot();
      assertGolden(screenshot, 'screenshot-sanity.png');
    });
    it('should clip rect', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        clip: {
          x: 50,
          y: 100,
          width: 150,
          height: 100,
        },
      });
      assertGolden(screenshot, 'screenshot-clip-rect.png');
    });
    it('should get screenshot bigger than the viewport', async () => {
      const {page, server} = await getTestState();
      await page.setViewport({width: 50, height: 50});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        clip: {
          x: 25,
          y: 25,
          width: 100,
          height: 100,
        },
      });
      assertGolden(screenshot, 'screenshot-offscreen-clip.png');
    });
    it('should clip clip bigger than the viewport without "captureBeyondViewport"', async () => {
      const {page, server} = await getTestState();
      await page.setViewport({width: 50, height: 50});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        captureBeyondViewport: false,
        clip: {
          x: 25,
          y: 25,
          width: 100,
          height: 100,
        },
      });
      assertGolden(screenshot, 'screenshot-offscreen-clip-2.png');
    });
    it('should run in parallel', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const promises = [];
      for (let i = 0; i < 3; ++i) {
        promises.push(
          page.screenshot({
            clip: {
              x: 50 * i,
              y: 0,
              width: 50,
              height: 50,
            },
          }),
        );
      }
      const screenshots = await Promise.all(promises);
      assertGolden(screenshots[1]!, 'grid-cell-1.png');
    });
    it('should take fullPage screenshots', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        fullPage: true,
      });
      assertGolden(screenshot, 'screenshot-grid-fullpage.png');
    });
    it('should take fullPage screenshots without captureBeyondViewport', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        fullPage: true,
        captureBeyondViewport: false,
      });
      assertGolden(screenshot, 'screenshot-grid-fullpage-2.png');
      assertMatchObject(page.viewport(), {width: 500, height: 500});
    });
    it('should run in parallel in multiple pages', async () => {
      const {server, context} = await getTestState();

      const N = 2;
      const pages = await Promise.all(
        Array(N)
          .fill(0)
          .map(async () => {
            const page = await context.newPage();
            await page.goto(server.PREFIX + '/grid.html');
            return page;
          }),
      );
      const promises = [];
      for (let i = 0; i < N; ++i) {
        promises.push(
          pages[i]!.screenshot({
            clip: {x: 50 * i, y: 0, width: 50, height: 50},
          }),
        );
      }
      const screenshots = await Promise.all(promises);
      for (let i = 0; i < N; ++i) {
        assertGolden(screenshots[i]!, `grid-cell-${i}.png`);
      }
      await Promise.all(
        pages.map(page => {
          return page.close();
        }),
      );
    });
    it('should work with odd clip size on Retina displays', async () => {
      const {page} = await getTestState();

      // Make sure documentElement height is at least 11px.
      await page.setContent(
        html`<div style="width: 11px; height: 11px;"></div>`,
      );

      const screenshot = await page.screenshot({
        clip: {
          x: 0,
          y: 0,
          width: 11,
          height: 11,
        },
      });
      assertGolden(screenshot, 'screenshot-clip-odd-size.png');
    });
    it('should return base64', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        encoding: 'base64',
      });
      assertGolden(Buffer.from(screenshot, 'base64'), 'screenshot-sanity.png');
    });

    it('should take fullPage screenshots when defaultViewport is null', async () => {
      const {server, page} = state;
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        fullPage: true,
      });
      assert.instanceOf(screenshot, Uint8Array);
    });

    it('should restore to original viewport size after taking fullPage screenshots when defaultViewport is null', async () => {
      const {server, page} = state;
      const originalSize = await page.evaluate(() => {
        return {width: window.innerWidth, height: window.innerHeight};
      });
      await page.goto(server.PREFIX + '/scrollbar.html');
      await page.screenshot({
        fullPage: true,
        captureBeyondViewport: false,
      });
      const size = await page.evaluate(() => {
        return {width: window.innerWidth, height: window.innerHeight};
      });
      assert.isNull(page.viewport());
      assert.strictEqual(size.width, originalSize.width);
      assert.strictEqual(size.height, originalSize.height);
    });
  });

  describe('ElementHandle.screenshot', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      await page.evaluate(() => {
        return window.scrollBy(50, 100);
      });
      using elementHandle = (await page.$('.box:nth-of-type(3)'))!;
      const screenshot = await elementHandle.screenshot();
      assertGolden(screenshot, 'screenshot-element-bounding-box.png');
    });
    it('should work with a null viewport', async () => {
      const {server, page} = state;

      await page.goto(server.PREFIX + '/grid.html');
      await page.evaluate(() => {
        return window.scrollBy(50, 100);
      });
      using elementHandle = await page.$('.box:nth-of-type(3)');
      assert(elementHandle);
      const screenshot = await elementHandle.screenshot();
      assert.ok(screenshot);
    });
    it('should take into account padding and border', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
        something above
        <style>
          div {
            border: 2px solid blue;
            background: green;
            width: 50px;
            height: 50px;
          }
        </style>
        <div></div>
      `);
      using elementHandle = (await page.$('div'))!;
      const screenshot = await elementHandle.screenshot();
      assertGolden(screenshot, 'screenshot-element-padding-border.png');
    });
    it('should capture full element when larger than viewport', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});

      await page.setContent(html`
        something above
        <style>
          :root {
            scrollbar-width: none;
          }
          div.to-screenshot {
            border: 1px solid blue;
            width: 600px;
            height: 600px;
            margin-left: 50px;
          }
        </style>
        <div class="to-screenshot"></div>
      `);
      using elementHandle = (await page.$('div.to-screenshot'))!;
      const screenshot = await elementHandle.screenshot();
      assertGolden(screenshot, 'screenshot-element-larger-than-viewport.png');

      assert.deepEqual(
        await page.evaluate(() => {
          return {
            w: window.innerWidth,
            h: window.innerHeight,
          };
        }),
        {w: 500, h: 500},
      );
    });
    it('should scroll element into view', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
        something above
        <style>
          div.above {
            border: 2px solid blue;
            background: red;
            height: 1500px;
          }
          div.to-screenshot {
            border: 2px solid blue;
            background: green;
            width: 50px;
            height: 50px;
          }
        </style>
        <div class="above"></div>
        <div class="to-screenshot"></div>
      `);
      using elementHandle = (await page.$('div.to-screenshot'))!;
      const screenshot = await elementHandle.screenshot();
      assertGolden(screenshot, 'screenshot-element-scrolled-into-view.png');
    });
    it('should work with a rotated element', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(
        html`<!DOCTYPE html>
          <div
            style="position:absolute;
                                        top: 100px;
                                        left: 100px;
                                        width: 100px;
                                        height: 100px;
                                        background: green;
                                        transform: rotateZ(200deg);"
          >
            &nbsp;
          </div>`,
      );
      using elementHandle = (await page.$('div'))!;
      const screenshot = await elementHandle.screenshot();
      assertGolden(screenshot, 'screenshot-element-rotate.png');
    });
    it('should fail to screenshot a detached element', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<h1>remove this</h1>`);
      using elementHandle = (await page.$('h1'))!;
      await page.evaluate(element => {
        return element.remove();
      }, elementHandle);
      const screenshotError = await elementHandle.screenshot().catch(error => {
        return error;
      });
      assert.instanceOf(screenshotError, Error);
      assert.match(
        screenshotError.message,
        /Node is either not visible or not an HTMLElement|Node is detached from document/,
      );
    });
    it('should not hang with zero width/height element', async () => {
      const {page} = await getTestState();

      await page.setContent(html`<div style="width: 50px; height: 0"></div>`);
      using div = (await page.$('div'))!;
      const error = await div.screenshot().catch(error_ => {
        return error_;
      });
      assert.strictEqual(error.message, 'Node has 0 height.');
    });
    it('should work for an element with fractional dimensions', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<div
          style="width:48.51px;height:19.8px;border:1px solid black;"
        ></div>`,
      );
      using elementHandle = (await page.$('div'))!;
      const screenshot = await elementHandle.screenshot();
      assertGolden(screenshot, 'screenshot-element-fractional.png');
    });
    it('should work for an element with an offset', async () => {
      const {page} = await getTestState();

      await page.setContent(
        html`<!DOCTYPE html>
          <div
            style="position:absolute; top: 10.3px; left: 20.4px;width:50.3px;height:20.2px;border:1px solid black;"
          ></div>`,
      );
      using elementHandle = (await page.$('div'))!;
      const screenshot = await elementHandle.screenshot();
      assertGolden(screenshot, 'screenshot-element-fractional-offset.png');
    });
    it('should work with webp', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 100, height: 100});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        type: 'webp',
      });

      assert.instanceOf(screenshot, Uint8Array);
    });

    it('should run in parallel in multiple pages', async () => {
      const {browser, server} = await getTestState();

      const context = await browser.createBrowserContext();

      const N = 2;
      const pages = await Promise.all(
        Array(N)
          .fill(0)
          .map(async () => {
            const page = await context.newPage();
            await page.goto(server.PREFIX + '/grid.html');
            return page;
          }),
      );
      const promises = [];
      for (let i = 0; i < N; ++i) {
        promises.push(
          pages[i]!.screenshot({
            clip: {x: 50 * i, y: 0, width: 50, height: 50},
          }),
        );
      }
      const screenshots = await Promise.all(promises);
      for (let i = 0; i < N; ++i) {
        assertGolden(screenshots[i]!, `grid-cell-${i}.png`);
      }
      await Promise.all(
        pages.map(page => {
          return page.close();
        }),
      );

      await context.close();
    });

    it('should run in parallel with page.close()', async () => {
      const {browser} = await getTestState();

      using context = await browser.createBrowserContext();

      const page1 = await context.newPage();
      const page2 = await context.newPage();

      const screen1 = page1.screenshot();
      const screen2 = page2.screenshot();

      const close1 = screen1.then(() => {
        return page1.close();
      });
      const close2 = screen2.then(() => {
        return page2.close();
      });
      await screen1;
      const page3 = await browser.newPage();
      await page3.screenshot();
      const close3 = page3.close();

      await Promise.all([close1, close2, close3]);
    });

    it('should use element clip', async () => {
      const {page} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.setContent(html`
        something above
        <style>
          div {
            border: 2px solid blue;
            background: green;
            width: 50px;
            height: 50px;
          }
        </style>
        <div></div>
      `);
      using elementHandle = (await page.$('div'))!;
      const screenshot = await elementHandle.screenshot({
        clip: {
          x: 10,
          y: 10,
          width: 20,
          height: 20,
        },
      });
      assertGolden(screenshot, 'screenshot-element-clip.png');
    });
  });

  describe('Cdp', () => {
    it('should use scale for clip', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        clip: {
          x: 50,
          y: 100,
          width: 150,
          height: 100,
          scale: 2,
        },
      });
      assertGolden(screenshot, 'screenshot-clip-rect-scale2.png');
    });
    it('should allow transparency', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 100, height: 100});
      await page.goto(server.EMPTY_PAGE);
      const screenshot = await page.screenshot({omitBackground: true});
      assertGolden(screenshot, 'transparent.png');
    });
    it('should render white background on jpeg file', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 100, height: 100});
      await page.goto(server.EMPTY_PAGE);
      const screenshot = await page.screenshot({
        omitBackground: true,
        type: 'jpeg',
      });
      assertGolden(screenshot, 'white.jpg');
    });
    it('should work in "fromSurface: false" mode', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        fromSurface: false,
      });
      assert.isDefined(screenshot);
    });
  });
});
