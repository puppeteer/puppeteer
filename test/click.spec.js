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

module.exports.addTests = function({testRunner, expect, puppeteer}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit, it_fails_ffox} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Page.click', function() {
    it('should click the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
    it('should click svg', async({page, server}) => {
      await page.setContent(`
        <svg height="100" width="100">
          <circle onclick="javascript:window.__CLICKED=42" cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
        </svg>
      `);
      await page.click('circle');
      expect(await page.evaluate(() => window.__CLICKED)).toBe(42);
    });
    it_fails_ffox('should click the button if window.Node is removed', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.evaluate(() => delete window.Node);
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/4281
    it('should click on a span with an inline element inside', async({page, server}) => {
      await page.setContent(`
        <style>
        span::before {
          content: 'q';
        }
        </style>
        <span onclick='javascript:window.CLICKED=42'></span>
      `);
      await page.click('span');
      expect(await page.evaluate(() => window.CLICKED)).toBe(42);
    });
    it('should click the button after navigation ', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.click('button');
      await page.goto(server.PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
    it_fails_ffox('should click with disabled javascript', async({page, server}) => {
      await page.setJavaScriptEnabled(false);
      await page.goto(server.PREFIX + '/wrappedlink.html');
      await Promise.all([
        page.click('a'),
        page.waitForNavigation()
      ]);
      expect(page.url()).toBe(server.PREFIX + '/wrappedlink.html#clicked');
    });
    it_fails_ffox('should click when one of inline box children is outside of viewport', async({page, server}) => {
      await page.setContent(`
        <style>
        i {
          position: absolute;
          top: -1000px;
        }
        </style>
        <span onclick='javascript:window.CLICKED = 42;'><i>woof</i><b>doggo</b></span>
      `);
      await page.click('span');
      expect(await page.evaluate(() => window.CLICKED)).toBe(42);
    });
    it('should select the text by triple clicking', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      const text = 'This is the text that we are going to try to select. Let\'s see how it goes.';
      await page.keyboard.type(text);
      await page.click('textarea');
      await page.click('textarea', {clickCount: 2});
      await page.click('textarea', {clickCount: 3});
      expect(await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      })).toBe(text);
    });
    it('should click offscreen buttons', async({page, server}) => {
      await page.goto(server.PREFIX + '/offscreenbuttons.html');
      const messages = [];
      page.on('console', msg => messages.push(msg.text()));
      for (let i = 0; i < 11; ++i) {
        // We might've scrolled to click a button - reset to (0, 0).
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.click(`#btn${i}`);
      }
      expect(messages).toEqual([
        'button #0 clicked',
        'button #1 clicked',
        'button #2 clicked',
        'button #3 clicked',
        'button #4 clicked',
        'button #5 clicked',
        'button #6 clicked',
        'button #7 clicked',
        'button #8 clicked',
        'button #9 clicked',
        'button #10 clicked'
      ]);
    });

    it('should click wrapped links', async({page, server}) => {
      await page.goto(server.PREFIX + '/wrappedlink.html');
      await page.click('a');
      expect(await page.evaluate(() => window.__clicked)).toBe(true);
    });

    it('should click on checkbox input and toggle', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/checkbox.html');
      expect(await page.evaluate(() => result.check)).toBe(null);
      await page.click('input#agree');
      expect(await page.evaluate(() => result.check)).toBe(true);
      expect(await page.evaluate(() => result.events)).toEqual([
        'mouseover',
        'mouseenter',
        'mousemove',
        'mousedown',
        'mouseup',
        'click',
        'input',
        'change',
      ]);
      await page.click('input#agree');
      expect(await page.evaluate(() => result.check)).toBe(false);
    });

    it('should click on checkbox label and toggle', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/checkbox.html');
      expect(await page.evaluate(() => result.check)).toBe(null);
      await page.click('label[for="agree"]');
      expect(await page.evaluate(() => result.check)).toBe(true);
      expect(await page.evaluate(() => result.events)).toEqual([
        'click',
        'input',
        'change',
      ]);
      await page.click('label[for="agree"]');
      expect(await page.evaluate(() => result.check)).toBe(false);
    });

    it('should fail to click a missing button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      let error = null;
      await page.click('button.does-not-exist').catch(e => error = e);
      expect(error.message).toBe('No node found for selector: button.does-not-exist');
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/161
    it('should not hang with touch-enabled viewports', async({page, server}) => {
      await page.setViewport(puppeteer.devices['iPhone 6'].viewport);
      await page.mouse.down();
      await page.mouse.move(100, 10);
      await page.mouse.up();
    });
    it('should scroll and click the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.click('#button-5');
      expect(await page.evaluate(() => document.querySelector('#button-5').textContent)).toBe('clicked');
      await page.click('#button-80');
      expect(await page.evaluate(() => document.querySelector('#button-80').textContent)).toBe('clicked');
    });
    it('should double click the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.evaluate(() => {
        window.double = false;
        const button = document.querySelector('button');
        button.addEventListener('dblclick', event => {
          window.double = true;
        });
      });
      const button = await page.$('button');
      await button.click({ clickCount: 2 });
      expect(await page.evaluate('double')).toBe(true);
      expect(await page.evaluate('result')).toBe('Clicked');
    });
    it('should click a partially obscured button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.evaluate(() => {
        const button = document.querySelector('button');
        button.textContent = 'Some really long text that will go offscreen';
        button.style.position = 'absolute';
        button.style.left = '368px';
      });
      await page.click('button');
      expect(await page.evaluate(() => window.result)).toBe('Clicked');
    });
    it('should click a rotated button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/rotatedButton.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
    it('should fire contextmenu event on right click', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.click('#button-8', {button: 'right'});
      expect(await page.evaluate(() => document.querySelector('#button-8').textContent)).toBe('context menu');
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/206
    it('should click links which cause navigation', async({page, server}) => {
      await page.setContent(`<a href="${server.EMPTY_PAGE}">empty.html</a>`);
      // This await should not hang.
      await page.click('a');
    });
    it('should click the button inside an iframe', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent('<div style="width:100px;height:100px">spacer</div>');
      await utils.attachFrame(page, 'button-test', server.PREFIX + '/input/button.html');
      const frame = page.frames()[1];
      const button = await frame.$('button');
      await button.click();
      expect(await frame.evaluate(() => window.result)).toBe('Clicked');
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/4110
    xit('should click the button with fixed position inside an iframe', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setViewport({width: 500, height: 500});
      await page.setContent('<div style="width:100px;height:2000px">spacer</div>');
      await utils.attachFrame(page, 'button-test', server.CROSS_PROCESS_PREFIX + '/input/button.html');
      const frame = page.frames()[1];
      await frame.$eval('button', button => button.style.setProperty('position', 'fixed'));
      await frame.click('button');
      expect(await frame.evaluate(() => window.result)).toBe('Clicked');
    });
    it('should click the button with deviceScaleFactor set', async({page, server}) => {
      await page.setViewport({width: 400, height: 400, deviceScaleFactor: 5});
      expect(await page.evaluate(() => window.devicePixelRatio)).toBe(5);
      await page.setContent('<div style="width:100px;height:100px">spacer</div>');
      await utils.attachFrame(page, 'button-test', server.PREFIX + '/input/button.html');
      const frame = page.frames()[1];
      const button = await frame.$('button');
      await button.click();
      expect(await frame.evaluate(() => window.result)).toBe('Clicked');
    });
  });
};
