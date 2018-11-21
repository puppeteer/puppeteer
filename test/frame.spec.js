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

const utils = require('./utils');

module.exports.addTests = function({testRunner, expect}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Frame.executionContext', function() {
    it('should work', async({page, server}) => {
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
        context1.evaluate(() => window.a = 1),
        context2.evaluate(() => window.a = 2)
      ]);
      const [a1, a2] = await Promise.all([
        context1.evaluate(() => window.a),
        context2.evaluate(() => window.a)
      ]);
      expect(a1).toBe(1);
      expect(a2).toBe(2);
    });
  });

  describe('Frame.goto', function() {
    it('should navigate subframes', async({page, server}) => {
      await page.goto(server.PREFIX + '/frames/one-frame.html');
      expect(page.frames()[0].url()).toContain('/frames/one-frame.html');
      expect(page.frames()[1].url()).toContain('/frames/frame.html');

      const response = await page.frames()[1].goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
      expect(response.frame()).toBe(page.frames()[1]);
    });
    it('should reject when frame detaches', async({page, server}) => {
      await page.goto(server.PREFIX + '/frames/one-frame.html');

      server.setRoute('/empty.html', () => {});
      const navigationPromise = page.frames()[1].goto(server.EMPTY_PAGE).catch(e => e);
      await server.waitForRequest('/empty.html');

      await page.$eval('iframe', frame => frame.remove());
      const error = await navigationPromise;
      expect(error.message).toBe('Navigating frame was detached');
    });
    it('should return matching responses', async({page, server}) => {
      // Disable cache: otherwise, chromium will cache similar requests.
      await page.setCacheEnabled(false);
      await page.goto(server.EMPTY_PAGE);
      // Attach three frames.
      const frames = await Promise.all([
        utils.attachFrame(page, 'frame1', server.EMPTY_PAGE),
        utils.attachFrame(page, 'frame2', server.EMPTY_PAGE),
        utils.attachFrame(page, 'frame3', server.EMPTY_PAGE),
      ]);
      // Navigate all frames to the same URL.
      const serverResponses = [];
      server.setRoute('/one-style.html', (req, res) => serverResponses.push(res));
      const navigations = [];
      for (let i = 0; i < 3; ++i) {
        navigations.push(frames[i].goto(server.PREFIX + '/one-style.html'));
        await server.waitForRequest('/one-style.html');
      }
      // Respond from server out-of-order.
      const serverResponseTexts = ['AAA', 'BBB', 'CCC'];
      for (const i of [1, 2, 0]) {
        serverResponses[i].end(serverResponseTexts[i]);
        const response = await navigations[i];
        expect(response.frame()).toBe(frames[i]);
        expect(await response.text()).toBe(serverResponseTexts[i]);
      }
    });
  });

  describe('Frame.waitForNavigation', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.PREFIX + '/frames/one-frame.html');
      const frame = page.frames()[1];
      const [response] = await Promise.all([
        frame.waitForNavigation(),
        frame.evaluate(url => window.location.href = url, server.PREFIX + '/grid.html')
      ]);
      expect(response.ok()).toBe(true);
      expect(response.url()).toContain('grid.html');
      expect(response.frame()).toBe(frame);
      expect(page.url()).toContain('/frames/one-frame.html');
    });
    it('should reject when frame detaches', async({page, server}) => {
      await page.goto(server.PREFIX + '/frames/one-frame.html');
      const frame = page.frames()[1];

      server.setRoute('/empty.html', () => {});
      const navigationPromise = frame.waitForNavigation();
      await Promise.all([
        server.waitForRequest('/empty.html'),
        frame.evaluate(() => window.location = '/empty.html')
      ]);
      await page.$eval('iframe', frame => frame.remove());
      await navigationPromise;
    });
  });

  describe('Frame.evaluateHandle', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      const windowHandle = await mainFrame.evaluateHandle(() => window);
      expect(windowHandle).toBeTruthy();
    });
  });

  describe('Frame.evaluate', function() {
    it('should have different execution contexts', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(page.frames().length).toBe(2);
      const frame1 = page.frames()[0];
      const frame2 = page.frames()[1];
      await frame1.evaluate(() => window.FOO = 'foo');
      await frame2.evaluate(() => window.FOO = 'bar');
      expect(await frame1.evaluate(() => window.FOO)).toBe('foo');
      expect(await frame2.evaluate(() => window.FOO)).toBe('bar');
    });
    it('should execute after cross-site navigation', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      expect(await mainFrame.evaluate(() => window.location.href)).toContain('localhost');
      await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      expect(await mainFrame.evaluate(() => window.location.href)).toContain('127');
    });
  });

  describe('Frame Management', function() {
    it('should handle nested frames', async({page, server}) => {
      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      expect(utils.dumpFrames(page.mainFrame())).toBeGolden('nested-frames.txt');
    });
    it('should send events when frames are manipulated dynamically', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      // validate frameattached events
      const attachedFrames = [];
      page.on('frameattached', frame => attachedFrames.push(frame));
      await utils.attachFrame(page, 'frame1', './assets/frame.html');
      expect(attachedFrames.length).toBe(1);
      expect(attachedFrames[0].url()).toContain('/assets/frame.html');

      // validate framenavigated events
      const navigatedFrames = [];
      page.on('framenavigated', frame => navigatedFrames.push(frame));
      await utils.navigateFrame(page, 'frame1', './empty.html');
      expect(navigatedFrames.length).toBe(1);
      expect(navigatedFrames[0].url()).toBe(server.EMPTY_PAGE);

      // validate framedetached events
      const detachedFrames = [];
      page.on('framedetached', frame => detachedFrames.push(frame));
      await utils.detachFrame(page, 'frame1');
      expect(detachedFrames.length).toBe(1);
      expect(detachedFrames[0].isDetached()).toBe(true);
    });
    it('should send "framenavigated" when navigating on anchor URLs', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await Promise.all([
        page.goto(server.EMPTY_PAGE + '#foo'),
        utils.waitEvent(page, 'framenavigated')
      ]);
      expect(page.url()).toBe(server.EMPTY_PAGE + '#foo');
    });
    it('should persist mainFrame on cross-process navigation', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      expect(page.mainFrame() === mainFrame).toBeTruthy();
    });
    it('should not send attach/detach events for main frame', async({page, server}) => {
      let hasEvents = false;
      page.on('frameattached', frame => hasEvents = true);
      page.on('framedetached', frame => hasEvents = true);
      await page.goto(server.EMPTY_PAGE);
      expect(hasEvents).toBe(false);
    });
    it('should detach child frames on navigation', async({page, server}) => {
      let attachedFrames = [];
      let detachedFrames = [];
      let navigatedFrames = [];
      page.on('frameattached', frame => attachedFrames.push(frame));
      page.on('framedetached', frame => detachedFrames.push(frame));
      page.on('framenavigated', frame => navigatedFrames.push(frame));
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
    it('should report frame.name()', async({page, server}) => {
      await utils.attachFrame(page, 'theFrameId', server.EMPTY_PAGE);
      await page.evaluate(url => {
        const frame = document.createElement('iframe');
        frame.name = 'theFrameName';
        frame.src = url;
        document.body.appendChild(frame);
        return new Promise(x => frame.onload = x);
      }, server.EMPTY_PAGE);
      expect(page.frames()[0].name()).toBe('');
      expect(page.frames()[1].name()).toBe('theFrameId');
      expect(page.frames()[2].name()).toBe('theFrameName');
    });
    it('should report frame.parent()', async({page, server}) => {
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame2', server.EMPTY_PAGE);
      expect(page.frames()[0].parentFrame()).toBe(null);
      expect(page.frames()[1].parentFrame()).toBe(page.mainFrame());
      expect(page.frames()[2].parentFrame()).toBe(page.mainFrame());
    });
  });
};
