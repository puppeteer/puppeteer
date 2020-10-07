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

import utils from './utils.js';
import expect from 'expect';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  itFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions

describe('Frame specs', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('Frame.executionContext', function () {
    itFailsFirefox('should work', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(page.frames().length).toBe(2);
      const [frame1, frame2] = page.frames();
      const context1 = await frame1.executionContext();
      const context2 = await frame2.executionContext();
      expect(context1).toBeTruthy();
      expect(context2).toBeTruthy();
      expect(context1 !== context2).toBeTruthy();
      expect(context1.frame()).toBe(frame1);
      expect(context2.frame()).toBe(frame2);

      await Promise.all([
        context1.evaluate(() => (globalThis.a = 1)),
        context2.evaluate(() => (globalThis.a = 2)),
      ]);
      const [a1, a2] = await Promise.all([
        context1.evaluate(() => globalThis.a),
        context2.evaluate(() => globalThis.a),
      ]);
      expect(a1).toBe(1);
      expect(a2).toBe(2);
    });
  });

  describe('Frame.evaluateHandle', function () {
    it('should work', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      const windowHandle = await mainFrame.evaluateHandle(() => window);
      expect(windowHandle).toBeTruthy();
    });
  });

  describe('Frame.evaluate', function () {
    itFailsFirefox('should throw for detached frames', async () => {
      const { page, server } = getTestState();

      const frame1 = await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await utils.detachFrame(page, 'frame1');
      let error = null;
      await frame1.evaluate(() => 7 * 8).catch((error_) => (error = error_));
      expect(error.message).toContain(
        'Execution context is not available in detached frame'
      );
    });
  });

  describe('Frame Management', function () {
    itFailsFirefox('should handle nested frames', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      expect(utils.dumpFrames(page.mainFrame())).toEqual([
        'http://localhost:<PORT>/frames/nested-frames.html',
        '    http://localhost:<PORT>/frames/two-frames.html (2frames)',
        '        http://localhost:<PORT>/frames/frame.html (uno)',
        '        http://localhost:<PORT>/frames/frame.html (dos)',
        '    http://localhost:<PORT>/frames/frame.html (aframe)',
      ]);
    });
    itFailsFirefox(
      'should send events when frames are manipulated dynamically',
      async () => {
        const { page, server } = getTestState();

        await page.goto(server.EMPTY_PAGE);
        // validate frameattached events
        const attachedFrames = [];
        page.on('frameattached', (frame) => attachedFrames.push(frame));
        await utils.attachFrame(page, 'frame1', './assets/frame.html');
        expect(attachedFrames.length).toBe(1);
        expect(attachedFrames[0].url()).toContain('/assets/frame.html');

        // validate framenavigated events
        const navigatedFrames = [];
        page.on('framenavigated', (frame) => navigatedFrames.push(frame));
        await utils.navigateFrame(page, 'frame1', './empty.html');
        expect(navigatedFrames.length).toBe(1);
        expect(navigatedFrames[0].url()).toBe(server.EMPTY_PAGE);

        // validate framedetached events
        const detachedFrames = [];
        page.on('framedetached', (frame) => detachedFrames.push(frame));
        await utils.detachFrame(page, 'frame1');
        expect(detachedFrames.length).toBe(1);
        expect(detachedFrames[0].isDetached()).toBe(true);
      }
    );
    itFailsFirefox(
      'should send "framenavigated" when navigating on anchor URLs',
      async () => {
        const { page, server } = getTestState();

        await page.goto(server.EMPTY_PAGE);
        await Promise.all([
          page.goto(server.EMPTY_PAGE + '#foo'),
          utils.waitEvent(page, 'framenavigated'),
        ]);
        expect(page.url()).toBe(server.EMPTY_PAGE + '#foo');
      }
    );
    it('should persist mainFrame on cross-process navigation', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      expect(page.mainFrame() === mainFrame).toBeTruthy();
    });
    it('should not send attach/detach events for main frame', async () => {
      const { page, server } = getTestState();

      let hasEvents = false;
      page.on('frameattached', () => (hasEvents = true));
      page.on('framedetached', () => (hasEvents = true));
      await page.goto(server.EMPTY_PAGE);
      expect(hasEvents).toBe(false);
    });
    itFailsFirefox('should detach child frames on navigation', async () => {
      const { page, server } = getTestState();

      let attachedFrames = [];
      let detachedFrames = [];
      let navigatedFrames = [];
      page.on('frameattached', (frame) => attachedFrames.push(frame));
      page.on('framedetached', (frame) => detachedFrames.push(frame));
      page.on('framenavigated', (frame) => navigatedFrames.push(frame));
      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      expect(attachedFrames.length).toBe(4);
      expect(detachedFrames.length).toBe(0);
      expect(navigatedFrames.length).toBe(5);

      attachedFrames = [];
      detachedFrames = [];
      navigatedFrames = [];
      await page.goto(server.EMPTY_PAGE);
      expect(attachedFrames.length).toBe(0);
      expect(detachedFrames.length).toBe(4);
      expect(navigatedFrames.length).toBe(1);
    });
    itFailsFirefox('should support framesets', async () => {
      const { page, server } = getTestState();

      let attachedFrames = [];
      let detachedFrames = [];
      let navigatedFrames = [];
      page.on('frameattached', (frame) => attachedFrames.push(frame));
      page.on('framedetached', (frame) => detachedFrames.push(frame));
      page.on('framenavigated', (frame) => navigatedFrames.push(frame));
      await page.goto(server.PREFIX + '/frames/frameset.html');
      expect(attachedFrames.length).toBe(4);
      expect(detachedFrames.length).toBe(0);
      expect(navigatedFrames.length).toBe(5);

      attachedFrames = [];
      detachedFrames = [];
      navigatedFrames = [];
      await page.goto(server.EMPTY_PAGE);
      expect(attachedFrames.length).toBe(0);
      expect(detachedFrames.length).toBe(4);
      expect(navigatedFrames.length).toBe(1);
    });
    itFailsFirefox('should report frame from-inside shadow DOM', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/shadow.html');
      await page.evaluate(async (url: string) => {
        const frame = document.createElement('iframe');
        frame.src = url;
        document.body.shadowRoot.appendChild(frame);
        await new Promise((x) => (frame.onload = x));
      }, server.EMPTY_PAGE);
      expect(page.frames().length).toBe(2);
      expect(page.frames()[1].url()).toBe(server.EMPTY_PAGE);
    });
    itFailsFirefox('should report frame.name()', async () => {
      const { page, server } = getTestState();

      await utils.attachFrame(page, 'theFrameId', server.EMPTY_PAGE);
      await page.evaluate((url: string) => {
        const frame = document.createElement('iframe');
        frame.name = 'theFrameName';
        frame.src = url;
        document.body.appendChild(frame);
        return new Promise((x) => (frame.onload = x));
      }, server.EMPTY_PAGE);
      expect(page.frames()[0].name()).toBe('');
      expect(page.frames()[1].name()).toBe('theFrameId');
      expect(page.frames()[2].name()).toBe('theFrameName');
    });
    itFailsFirefox('should report frame.parent()', async () => {
      const { page, server } = getTestState();

      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame2', server.EMPTY_PAGE);
      expect(page.frames()[0].parentFrame()).toBe(null);
      expect(page.frames()[1].parentFrame()).toBe(page.mainFrame());
      expect(page.frames()[2].parentFrame()).toBe(page.mainFrame());
    });
    itFailsFirefox(
      'should report different frame instance when frame re-attaches',
      async () => {
        const { page, server } = getTestState();

        const frame1 = await utils.attachFrame(
          page,
          'frame1',
          server.EMPTY_PAGE
        );
        await page.evaluate(() => {
          globalThis.frame = document.querySelector('#frame1');
          globalThis.frame.remove();
        });
        expect(frame1.isDetached()).toBe(true);
        const [frame2] = await Promise.all([
          utils.waitEvent(page, 'frameattached'),
          page.evaluate(() => document.body.appendChild(globalThis.frame)),
        ]);
        expect(frame2.isDetached()).toBe(false);
        expect(frame1).not.toBe(frame2);
      }
    );
    it('should support url fragment', async () => {
      const { page, server } = getTestState();

      await page.goto(server.PREFIX + '/frames/one-frame-url-fragment.html');

      expect(page.frames().length).toBe(2);
      expect(page.frames()[1].url()).toBe(
        server.PREFIX + '/frames/frame.html?param=value#fragment'
      );
    });
  });
});
