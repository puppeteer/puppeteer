/**
 * Copyright 2018 Google Inc. All rights reserved.
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
import {CDPSession} from 'puppeteer-core/internal/api/CDPSession.js';
import type {Frame} from 'puppeteer-core/internal/api/Frame.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {
  attachFrame,
  detachFrame,
  dumpFrames,
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
      expect(windowHandle).toBeTruthy();
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
      expect(error?.message).toContain('Attempted to use detached Frame');
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
      expect(mainFrame.page()).toEqual(page);
    });
  });

  describe('Frame Management', function () {
    it('should handle nested frames', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      expect(dumpFrames(page.mainFrame())).toEqual([
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
      expect(attachedFrames).toHaveLength(1);
      expect(attachedFrames[0]!.url()).toContain('/assets/frame.html');

      // validate framenavigated events
      const navigatedFrames: Frame[] = [];
      page.on('framenavigated', frame => {
        return navigatedFrames.push(frame);
      });
      await navigateFrame(page, 'frame1', './empty.html');
      expect(navigatedFrames).toHaveLength(1);
      expect(navigatedFrames[0]!.url()).toBe(server.EMPTY_PAGE);

      // validate framedetached events
      const detachedFrames: Frame[] = [];
      page.on('framedetached', frame => {
        return detachedFrames.push(frame);
      });
      await detachFrame(page, 'frame1');
      expect(detachedFrames).toHaveLength(1);
      expect(detachedFrames[0]!.isDetached()).toBe(true);
    });
    it('should send "framenavigated" when navigating on anchor URLs', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await Promise.all([
        page.goto(server.EMPTY_PAGE + '#foo'),
        waitEvent(page, 'framenavigated'),
      ]);
      expect(page.url()).toBe(server.EMPTY_PAGE + '#foo');
    });
    it('should persist mainFrame on cross-process navigation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      expect(page.mainFrame() === mainFrame).toBeTruthy();
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
      expect(hasEvents).toBe(false);
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

      expect(attachedFrames).toHaveLength(4);
      expect(detachedFrames).toHaveLength(0);
      expect(navigatedFrames).toHaveLength(5);

      attachedFrames = [];
      detachedFrames = [];
      navigatedFrames = [];
      await page.goto(server.EMPTY_PAGE);
      expect(attachedFrames).toHaveLength(0);
      expect(detachedFrames).toHaveLength(4);
      expect(navigatedFrames).toHaveLength(1);
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
      expect(attachedFrames).toHaveLength(4);
      expect(detachedFrames).toHaveLength(0);
      expect(navigatedFrames).toHaveLength(5);

      attachedFrames = [];
      detachedFrames = [];
      navigatedFrames = [];
      await page.goto(server.EMPTY_PAGE);
      expect(attachedFrames).toHaveLength(0);
      expect(detachedFrames).toHaveLength(4);
      expect(navigatedFrames).toHaveLength(1);
    });
    it('should report frame from-inside shadow DOM', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/shadow.html');
      await page.evaluate(async (url: string) => {
        const frame = document.createElement('iframe');
        frame.src = url;
        document.body.shadowRoot!.appendChild(frame);
        await new Promise(x => {
          return (frame.onload = x);
        });
      }, server.EMPTY_PAGE);
      expect(page.frames()).toHaveLength(2);
      expect(page.frames()[1]!.url()).toBe(server.EMPTY_PAGE);
    });
    it('should report frame.name()', async () => {
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
      expect(page.frames()[0]!.name()).toBe('');
      expect(page.frames()[1]!.name()).toBe('theFrameId');
      expect(page.frames()[2]!.name()).toBe('theFrameName');
    });
    it('should report frame.parent()', async () => {
      const {page, server} = await getTestState();

      await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await attachFrame(page, 'frame2', server.EMPTY_PAGE);
      expect(page.frames()[0]!.parentFrame()).toBe(null);
      expect(page.frames()[1]!.parentFrame()).toBe(page.mainFrame());
      expect(page.frames()[2]!.parentFrame()).toBe(page.mainFrame());
    });
    it('should report different frame instance when frame re-attaches', async () => {
      const {page, server} = await getTestState();

      const frame1 = await attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await page.evaluate(() => {
        (globalThis as any).frame = document.querySelector('#frame1');
        (globalThis as any).frame.remove();
      });
      expect(frame1!.isDetached()).toBe(true);
      const [frame2] = await Promise.all([
        waitEvent(page, 'frameattached'),
        page.evaluate(() => {
          return document.body.appendChild((globalThis as any).frame);
        }),
      ]);
      expect(frame2.isDetached()).toBe(false);
      expect(frame1).not.toBe(frame2);
    });
    it('should support url fragment', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/frames/one-frame-url-fragment.html');

      expect(page.frames()).toHaveLength(2);
      expect(page.frames()[1]!.url()).toBe(
        server.PREFIX + '/frames/frame.html?param=value#fragment'
      );
    });
    it('should support lazy frames', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 1000, height: 1000});
      await page.goto(server.PREFIX + '/frames/lazy-frame.html');

      expect(
        page.frames().map(frame => {
          return frame._hasStartedLoading;
        })
      ).toEqual([true, true, false]);
    });
  });

  describe('Frame.client', function () {
    it('should return the client instance', async () => {
      const {page} = await getTestState();
      expect(page.mainFrame().client).toBeInstanceOf(CDPSession);
    });
  });
});
