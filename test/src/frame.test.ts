/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {CDPSession} from 'puppeteer-core/internal/api/CDPSession.js';
import type {Frame} from 'puppeteer-core/internal/api/Frame.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {
  attachFrame,
  detachFrame,
  dumpFrames,
  html,
  navigateFrame,
  waitEvent,
} from './utils.js';

describe('Frame specs', function () {
  setupTestBrowserHooks();

  describe('Frame.evaluateHandle', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      using windowHandle = await mainFrame.evaluateHandle(() => {
        return window;
      });
      assert.ok(windowHandle);
    });
  });

  describe('Frame.evaluate', function () {
    it('should throw for detached frames', async () => {
      const {page, server} = await getTestState();

      const frame1 = (await attachFrame(page, 'frame1', server.EMPTY_PAGE))!;
      await detachFrame(page, 'frame1');
      let error: Error | undefined;
      try {
        await frame1.evaluate(() => {
          return 7 * 8;
        });
      } catch (err) {
        error = err as Error;
      }
      assert.include(error?.message, 'Attempted to use detached Frame');
    });

    it('allows readonly array to be an argument', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();

      // This test checks if Frame.evaluate allows a readonly array to be an argument.
      // See https://github.com/puppeteer/puppeteer/issues/6953.
      const readonlyArray: readonly string[] = ['a', 'b', 'c'];
      await mainFrame.evaluate(arr => {
        return arr;
      }, readonlyArray);
    });
  });

  describe('Frame.page', function () {
    it('should retrieve the page from a frame', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      assert.strictEqual(mainFrame.page(), page);
    });
  });

  describe('Frame Management', function () {
    it('should handle nested frames', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      assert.deepEqual(await dumpFrames(page.mainFrame()), [
        'http://localhost:<PORT>/frames/nested-frames.html',
        '    http://localhost:<PORT>/frames/two-frames.html (2frames)',
        '        http://localhost:<PORT>/frames/frame.html (uno)',
        '        http://localhost:<PORT>/frames/frame.html (dos)',
        '    http://localhost:<PORT>/frames/frame.html (aframe)',
      ]);
    });
    it('should send events when frames are manipulated dynamically', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      // validate frameattached events
      const attachedFrames: Frame[] = [];
      page.on('frameattached', frame => {
        return attachedFrames.push(frame);
      });
      await attachFrame(page, 'frame1', './assets/frame.html');
      assert.lengthOf(attachedFrames, 1);
      assert.include(attachedFrames[0]!.url(), '/assets/frame.html');

      // validate framenavigated events
      const navigatedFrames: Frame[] = [];
      page.on('framenavigated', frame => {
        return navigatedFrames.push(frame);
      });
      await navigateFrame(page, 'frame1', './empty.html');
      assert.lengthOf(navigatedFrames, 1);
      assert.strictEqual(navigatedFrames[0]!.url(), server.EMPTY_PAGE);

      // validate framedetached events
      const detachedFrames: Frame[] = [];
      page.on('framedetached', frame => {
        return detachedFrames.push(frame);
      });
      await detachFrame(page, 'frame1');
      assert.lengthOf(detachedFrames, 1);
      assert.isTrue(detachedFrames[0]!.isDetached());
    });
    it('should send "framenavigated" when navigating on anchor URLs', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await Promise.all([
        page.goto(server.EMPTY_PAGE + '#foo'),
        waitEvent(page, 'framenavigated'),
      ]);
      assert.strictEqual(page.url(), server.EMPTY_PAGE + '#foo');
    });
    it('should persist mainFrame on cross-process navigation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      assert.ok(page.mainFrame() === mainFrame);
    });
    it('should not send attach/detach events for main frame', async () => {
      const {page, server} = await getTestState();

      let hasEvents = false;
      page.on('frameattached', () => {
        return (hasEvents = true);
      });
      page.on('framedetached', () => {
        return (hasEvents = true);
      });
      await page.goto(server.EMPTY_PAGE);
      assert.isFalse(hasEvents);
    });
    it('should detach child frames on navigation', async () => {
      const {page, server} = await getTestState();

      let attachedFrames: Frame[] = [];
      let detachedFrames: Frame[] = [];
      let navigatedFrames: Frame[] = [];
      page.on('frameattached', frame => {
        return attachedFrames.push(frame);
      });
      page.on('framedetached', frame => {
        return detachedFrames.push(frame);
      });
      page.on('framenavigated', frame => {
        return navigatedFrames.push(frame);
      });
      await page.goto(server.PREFIX + '/frames/nested-frames.html');

      assert.lengthOf(attachedFrames, 4);
      assert.lengthOf(detachedFrames, 0);
      assert.lengthOf(navigatedFrames, 5);

      attachedFrames = [];
      detachedFrames = [];
      navigatedFrames = [];
      await page.goto(server.EMPTY_PAGE);
      assert.lengthOf(attachedFrames, 0);
      assert.lengthOf(detachedFrames, 4);
      assert.lengthOf(navigatedFrames, 1);
    });
    it('should support framesets', async () => {
      const {page, server} = await getTestState();

      let attachedFrames: Frame[] = [];
      let detachedFrames: Frame[] = [];
      let navigatedFrames: Frame[] = [];
      page.on('frameattached', frame => {
        return attachedFrames.push(frame);
      });
      page.on('framedetached', frame => {
        return detachedFrames.push(frame);
      });
      page.on('framenavigated', frame => {
        return navigatedFrames.push(frame);
      });
      await page.goto(server.PREFIX + '/frames/frameset.html');
      assert.lengthOf(attachedFrames, 4);
      assert.lengthOf(detachedFrames, 0);
      assert.lengthOf(navigatedFrames, 5);

      attachedFrames = [];
      detachedFrames = [];
      navigatedFrames = [];
      await page.goto(server.EMPTY_PAGE);
      assert.lengthOf(attachedFrames, 0);
      assert.lengthOf(detachedFrames, 4);
      assert.lengthOf(navigatedFrames, 1);
    });

    it('should click elements in a frameset', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/frames/frameset.html');
      const frame = await page.waitForFrame(frame => {
        return frame.url().endsWith('/frames/frame.html');
      });
      using div = await frame.waitForSelector('div');
      assert.ok(div);
      await div?.click();
    });

    it('should report frame from-inside shadow DOM', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/shadow.html');
      await page.evaluate(async url => {
        const frame = document.createElement('iframe');
        frame.src = url;
        document.body.shadowRoot!.appendChild(frame);
        await new Promise(x => {
          return (frame.onload = x);
        });
      }, server.EMPTY_PAGE);
      assert.lengthOf(page.frames(), 2);
      assert.strictEqual(page.frames()[1]!.url(), server.EMPTY_PAGE);
    });
    it('should report frame.parent()', async () => {
      const {page, server} = await getTestState();

      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await attachFrame(page, 'frame2', server.EMPTY_PAGE);
      assert.isNull(page.frames()[0]!.parentFrame());
      assert.strictEqual(page.frames()[1]!.parentFrame(), page.mainFrame());
      assert.strictEqual(page.frames()[2]!.parentFrame(), page.mainFrame());
    });
    it('should report different frame instance when frame re-attaches', async () => {
      const {page, server} = await getTestState();

      const frame1 = await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await page.evaluate(() => {
        (globalThis as any).frame = document.querySelector('#frame1');
        (globalThis as any).frame.remove();
      });
      assert.isTrue(frame1!.isDetached());
      const [frame2] = await Promise.all([
        waitEvent(page, 'frameattached'),
        page.evaluate(() => {
          return document.body.appendChild((globalThis as any).frame);
        }),
      ]);
      assert.isFalse(frame2.isDetached());
      assert.notStrictEqual(frame1, frame2);
    });
    it('should support url fragment', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/frames/one-frame-url-fragment.html');

      assert.lengthOf(page.frames(), 2);
      assert.strictEqual(
        page.frames()[1]!.url(),
        server.PREFIX + '/frames/frame.html?param=value#fragment',
      );
    });
    it('should support lazy frames', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 1000, height: 1000});
      await page.goto(server.PREFIX + '/frames/lazy-frame.html');

      assert.deepEqual(
        page.frames().map(frame => {
          return frame._hasStartedLoading;
        }),
        [true, true, false],
      );
    });
  });

  describe('Frame.client', function () {
    it('should return the client instance', async () => {
      const {page} = await getTestState();
      assert.isTrue(page.mainFrame().client instanceof CDPSession);
    });
  });

  describe('Frame.prototype.frameElement', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await attachFrame(page, 'theFrameId', server.EMPTY_PAGE);
      await page.evaluate((url: string) => {
        const frame = document.createElement('iframe');
        frame.name = 'theFrameName';
        frame.src = url;
        document.body.appendChild(frame);
        return new Promise(x => {
          return (frame.onload = x);
        });
      }, server.EMPTY_PAGE);
      using frame0 = await page.frames()[0]?.frameElement();
      assert(!frame0);
      using frame1 = await page.frames()[1]?.frameElement();
      assert(frame1);
      using frame2 = await page.frames()[2]?.frameElement();
      assert(frame2);
      const name1 = await frame1.evaluate(frame => {
        return frame.id;
      });
      assert.strictEqual(name1, 'theFrameId');
      const name2 = await frame2.evaluate(frame => {
        return frame.name;
      });
      assert.strictEqual(name2, 'theFrameName');
    });

    it('should handle shadow roots', async () => {
      const {page} = await getTestState();
      await page.setContent(html`
        <div id="shadow-host"></div>
        <script>
          const host = document.getElementById('shadow-host');
          const shadowRoot = host.attachShadow({mode: 'closed'});
          const frame = document.createElement('iframe');
          frame.srcdoc = '<p>Inside frame</p>';
          shadowRoot.appendChild(frame);
        </script>
      `);
      const frame = page.frames()[1]!;
      using frameElement = (await frame.frameElement())!;
      assert.strictEqual(
        await frameElement.evaluate(el => {
          return el.tagName.toLocaleLowerCase();
        }),
        'iframe',
      );
    });

    it('should return ElementHandle in the correct world', async () => {
      const {page, server} = await getTestState();
      await attachFrame(page, 'theFrameId', server.EMPTY_PAGE);
      await page.evaluate(() => {
        // @ts-expect-error different page context
        globalThis['isMainWorld'] = true;
      }, server.EMPTY_PAGE);
      assert.lengthOf(page.frames(), 2);
      using frame1 = await page.frames()[1]!.frameElement();
      assert(frame1);
      assert(
        await frame1.evaluate(() => {
          // @ts-expect-error different page context
          return globalThis['isMainWorld'];
        }),
      );
    });
  });
});
