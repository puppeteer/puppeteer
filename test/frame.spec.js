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

  describe('Frame.context', function() {
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

  describe('Frame.waitForFunction', function() {
    it('should accept a string', async({page, server}) => {
      const watchdog = page.waitForFunction('window.__FOO === 1');
      await page.evaluate(() => window.__FOO = 1);
      await watchdog;
    });
    it('should work when resolved right before execution context disposal', async({page, server}) => {
      await page.evaluateOnNewDocument(() => window.__RELOADED = true);
      await page.waitForFunction(() => {
        if (!window.__RELOADED)
          window.location.reload();
        return true;
      });
    });
    it('should poll on interval', async({page, server}) => {
      let success = false;
      const startTime = Date.now();
      const polling = 100;
      const watchdog = page.waitForFunction(() => window.__FOO === 'hit', {polling})
          .then(() => success = true);
      await page.evaluate(() => window.__FOO = 'hit');
      expect(success).toBe(false);
      await page.evaluate(() => document.body.appendChild(document.createElement('div')));
      await watchdog;
      expect(Date.now() - startTime).not.toBeLessThan(polling / 2);
    });
    it('should poll on mutation', async({page, server}) => {
      let success = false;
      const watchdog = page.waitForFunction(() => window.__FOO === 'hit', {polling: 'mutation'})
          .then(() => success = true);
      await page.evaluate(() => window.__FOO = 'hit');
      expect(success).toBe(false);
      await page.evaluate(() => document.body.appendChild(document.createElement('div')));
      await watchdog;
    });
    it('should poll on raf', async({page, server}) => {
      const watchdog = page.waitForFunction(() => window.__FOO === 'hit', {polling: 'raf'});
      await page.evaluate(() => window.__FOO = 'hit');
      await watchdog;
    });
    it('should work with strict CSP policy', async({page, server}) => {
      server.setCSP('/empty.html', 'script-src ' + server.PREFIX);
      await page.goto(server.EMPTY_PAGE);
      const watchdog = page.waitForFunction(() => window.__FOO === 'hit', {polling: 'raf'});
      await page.evaluate(() => window.__FOO = 'hit');
      await watchdog;
    });
    it('should throw on bad polling value', async({page, server}) => {
      let error = null;
      try {
        await page.waitForFunction(() => !!document.body, {polling: 'unknown'});
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain('polling');
    });
    it('should throw negative polling interval', async({page, server}) => {
      let error = null;
      try {
        await page.waitForFunction(() => !!document.body, {polling: -10});
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain('Cannot poll with non-positive interval');
    });
    it('should return the success value as a JSHandle', async({page}) => {
      expect(await (await page.waitForFunction(() => 5)).jsonValue()).toBe(5);
    });
    it('should return the window as a success value', async({ page }) => {
      expect(await page.waitForFunction(() => window)).toBeTruthy();
    });
    it('should accept ElementHandle arguments', async({page}) => {
      await page.setContent('<div></div>');
      const div = await page.$('div');
      let resolved = false;
      const waitForFunction = page.waitForFunction(element => !element.parentElement, {}, div).then(() => resolved = true);
      expect(resolved).toBe(false);
      await page.evaluate(element => element.remove(), div);
      await waitForFunction;
    });
    it('should respect timeout', async({page}) => {
      let error = null;
      await page.waitForFunction('false', {timeout: 10}).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('waiting for function failed: timeout');
    });
    it('should disable timeout when its set to 0', async({page}) => {
      const watchdog = page.waitForFunction(() => {
        window.__counter = (window.__counter || 0) + 1;
        return window.__injected;
      }, {timeout: 0, polling: 10});
      await page.waitForFunction(() => window.__counter > 10);
      await page.evaluate(() => window.__injected = true);
      await watchdog;
    });
  });

  describe('Frame.waitForSelector', function() {
    const addElement = tag => document.body.appendChild(document.createElement(tag));

    it('should immediately resolve promise if node exists', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      await frame.waitForSelector('*');
      await frame.evaluate(addElement, 'div');
      await frame.waitForSelector('div');
    });

    it('should resolve promise when node is added', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      const watchdog = frame.waitForSelector('div');
      await frame.evaluate(addElement, 'br');
      await frame.evaluate(addElement, 'div');
      const eHandle = await watchdog;
      const tagName = await eHandle.getProperty('tagName').then(e => e.jsonValue());
      expect(tagName).toBe('DIV');
    });

    it('should work when node is added through innerHTML', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const watchdog = page.waitForSelector('h3 div');
      await page.evaluate(addElement, 'span');
      await page.evaluate(() => document.querySelector('span').innerHTML = '<h3><div></div></h3>');
      await watchdog;
    });

    it('Page.waitForSelector is shortcut for main frame', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const otherFrame = page.frames()[1];
      const watchdog = page.waitForSelector('div');
      await otherFrame.evaluate(addElement, 'div');
      await page.evaluate(addElement, 'div');
      const eHandle = await watchdog;
      expect(eHandle.executionContext().frame()).toBe(page.mainFrame());
    });

    it('should run in specified frame', async({page, server}) => {
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame2', server.EMPTY_PAGE);
      const frame1 = page.frames()[1];
      const frame2 = page.frames()[2];
      const waitForSelectorPromise = frame2.waitForSelector('div');
      await frame1.evaluate(addElement, 'div');
      await frame2.evaluate(addElement, 'div');
      const eHandle = await waitForSelectorPromise;
      expect(eHandle.executionContext().frame()).toBe(frame2);
    });

    it('should throw if evaluation failed', async({page, server}) => {
      await page.evaluateOnNewDocument(function() {
        document.querySelector = null;
      });
      await page.goto(server.EMPTY_PAGE);
      let error = null;
      await page.waitForSelector('*').catch(e => error = e);
      expect(error.message).toContain('document.querySelector is not a function');
    });
    it('should throw when frame is detached', async({page, server}) => {
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame = page.frames()[1];
      let waitError = null;
      const waitPromise = frame.waitForSelector('.box').catch(e => waitError = e);
      await utils.detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError.message).toContain('waitForFunction failed: frame got detached.');
    });
    it('should survive cross-process navigation', async({page, server}) => {
      let boxFound = false;
      const waitForSelector = page.waitForSelector('.box').then(() => boxFound = true);
      await page.goto(server.EMPTY_PAGE);
      expect(boxFound).toBe(false);
      await page.reload();
      expect(boxFound).toBe(false);
      await page.goto(server.CROSS_PROCESS_PREFIX + '/grid.html');
      await waitForSelector;
      expect(boxFound).toBe(true);
    });
    it('should wait for visible', async({page, server}) => {
      let divFound = false;
      const waitForSelector = page.waitForSelector('div', {visible: true}).then(() => divFound = true);
      await page.setContent(`<div style='display: none; visibility: hidden;'>1</div>`);
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('display'));
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('visibility'));
      expect(await waitForSelector).toBe(true);
      expect(divFound).toBe(true);
    });
    it('should wait for visible recursively', async({page, server}) => {
      let divVisible = false;
      const waitForSelector = page.waitForSelector('div#inner', {visible: true}).then(() => divVisible = true);
      await page.setContent(`<div style='display: none; visibility: hidden;'><div id="inner">hi</div></div>`);
      expect(divVisible).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('display'));
      expect(divVisible).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('visibility'));
      expect(await waitForSelector).toBe(true);
      expect(divVisible).toBe(true);
    });
    it('hidden should wait for visibility: hidden', async({page, server}) => {
      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForSelector = page.waitForSelector('div', {hidden: true}).then(() => divHidden = true);
      await page.waitForSelector('div'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.setProperty('visibility', 'hidden'));
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    });
    it('hidden should wait for display: none', async({page, server}) => {
      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForSelector = page.waitForSelector('div', {hidden: true}).then(() => divHidden = true);
      await page.waitForSelector('div'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.setProperty('display', 'none'));
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    });
    it('hidden should wait for removal', async({page, server}) => {
      await page.setContent(`<div></div>`);
      let divRemoved = false;
      const waitForSelector = page.waitForSelector('div', {hidden: true}).then(() => divRemoved = true);
      await page.waitForSelector('div'); // do a round trip
      expect(divRemoved).toBe(false);
      await page.evaluate(() => document.querySelector('div').remove());
      expect(await waitForSelector).toBe(true);
      expect(divRemoved).toBe(true);
    });
    it('should respect timeout', async({page, server}) => {
      let error = null;
      await page.waitForSelector('div', {timeout: 10}).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('waiting for selector "div" failed: timeout');
    });

    it('should respond to node attribute mutation', async({page, server}) => {
      let divFound = false;
      const waitForSelector = page.waitForSelector('.zombo').then(() => divFound = true);
      await page.setContent(`<div class='notZombo'></div>`);
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').className = 'zombo');
      expect(await waitForSelector).toBe(true);
    });
    it('should return the element handle', async({page, server}) => {
      const waitForSelector = page.waitForSelector('.zombo');
      await page.setContent(`<div class='zombo'>anything</div>`);
      expect(await page.evaluate(x => x.textContent, await waitForSelector)).toBe('anything');
    });
    it('should have correct stack trace for timeout', async({page, server}) => {
      let error;
      await page.waitForSelector('.zombo', {timeout: 10}).catch(e => error = e);
      expect(error.stack).toContain('frame.spec.js');
    });
  });

  describe('Frame.waitForXPath', function() {
    const addElement = tag => document.body.appendChild(document.createElement(tag));

    it('should support some fancy xpath', async({page, server}) => {
      await page.setContent(`<p>red herring</p><p>hello  world  </p>`);
      const waitForXPath = page.waitForXPath('//p[normalize-space(.)="hello world"]');
      expect(await page.evaluate(x => x.textContent, await waitForXPath)).toBe('hello  world  ');
    });
    it('should respect timeout', async({page}) => {
      let error = null;
      await page.waitForXPath('//div', {timeout: 10}).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('waiting for XPath "//div" failed: timeout');
    });
    it('should run in specified frame', async({page, server}) => {
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame2', server.EMPTY_PAGE);
      const frame1 = page.frames()[1];
      const frame2 = page.frames()[2];
      const waitForXPathPromise = frame2.waitForXPath('//div');
      await frame1.evaluate(addElement, 'div');
      await frame2.evaluate(addElement, 'div');
      const eHandle = await waitForXPathPromise;
      expect(eHandle.executionContext().frame()).toBe(frame2);
    });
    it('should throw if evaluation failed', async({page, server}) => {
      await page.evaluateOnNewDocument(function() {
        document.evaluate = null;
      });
      await page.goto(server.EMPTY_PAGE);
      let error = null;
      await page.waitForXPath('*').catch(e => error = e);
      expect(error.message).toContain('document.evaluate is not a function');
    });
    it('should throw when frame is detached', async({page, server}) => {
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame = page.frames()[1];
      let waitError = null;
      const waitPromise = frame.waitForXPath('//*[@class="box"]').catch(e => waitError = e);
      await utils.detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError.message).toContain('waitForFunction failed: frame got detached.');
    });
    it('hidden should wait for display: none', async({page, server}) => {
      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForXPath = page.waitForXPath('//div', {hidden: true}).then(() => divHidden = true);
      await page.waitForXPath('//div'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.setProperty('display', 'none'));
      expect(await waitForXPath).toBe(true);
      expect(divHidden).toBe(true);
    });
    it('should return the element handle', async({page, server}) => {
      const waitForXPath = page.waitForXPath('//*[@class="zombo"]');
      await page.setContent(`<div class='zombo'>anything</div>`);
      expect(await page.evaluate(x => x.textContent, await waitForXPath)).toBe('anything');
    });
    it('should allow you to select a text node', async({page, server}) => {
      await page.setContent(`<div>some text</div>`);
      const text = await page.waitForXPath('//div/text()');
      expect(await (await text.getProperty('nodeType')).jsonValue()).toBe(3 /* Node.TEXT_NODE */);
    });
    it('should allow you to select an element with single slash', async({page, server}) => {
      await page.setContent(`<div>some text</div>`);
      const waitForXPath = page.waitForXPath('/html/body/div');
      expect(await page.evaluate(x => x.textContent, await waitForXPath)).toBe('some text');
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
