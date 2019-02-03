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
const path = require('path');

module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  const FFOX = product === 'firefox';
  const CHROME = product === 'chromium';

  describe('Page.Events.DOMContentLoaded', function() {
    it('should fire when expected', async({page, server}) => {
      await Promise.all([
        page.goto('about:blank'),
        utils.waitEvent(page, 'domcontentloaded'),
      ]);
    });
  });
  describe('Page.Events.Load', function() {
    it('should fire when expected', async({page, server}) => {
      await Promise.all([
        page.goto('about:blank'),
        utils.waitEvent(page, 'load'),
      ]);
    });
  });

  describe('Page.Events.PageError', function() {
    it('should fire', async({page, server}) => {
      let error = null;
      page.once('pageerror', e => error = e);
      await Promise.all([
        page.goto(server.PREFIX + '/error.html'),
        utils.waitEvent(page, 'pageerror')
      ]);
      expect(error.message).toContain('Fancy');
    });
  });


  describe('Page.close', function() {
    it('should reject all promises when page is closed', async({browser}) => {
      const newPage = await browser.newPage();
      const neverResolves = newPage.evaluate(() => new Promise(r => {}));
      newPage.close();
      let error = null;
      await neverResolves.catch(e => error = e);
      expect(error).not.toBe(null);
    });
    it('should not be visible in browser.pages', async({browser}) => {
      const newPage = await browser.newPage();
      expect(await browser.pages()).toContain(newPage);
      await newPage.close();
      expect(await browser.pages()).not.toContain(newPage);
    });
    it('should set the page close state', async({browser}) => {
      const newPage = await browser.newPage();
      expect(newPage.isClosed()).toBe(false);
      await newPage.close();
      expect(newPage.isClosed()).toBe(true);
    });
    it('should work with page.close', async function({ page, context, server }) {
      const newPage = await context.newPage();
      const closedPromise = new Promise(x => newPage.on('close', x));
      await newPage.close();
      await closedPromise;
    });
  });

  describe('Page.Events.Console', function() {
    it('should work', async({page, server}) => {
      let message = null;
      page.once('console', m => message = m);
      await Promise.all([
        page.evaluate(() => console.log('hello', 5, {foo: 'bar'})),
        utils.waitEvent(page, 'console')
      ]);
      expect(message.text()).toEqual('hello 5 JSHandle@object');
      expect(message.type()).toEqual('log');
      expect(await message.args()[0].jsonValue()).toEqual('hello');
      expect(await message.args()[1].jsonValue()).toEqual(5);
      expect(await message.args()[2].jsonValue()).toEqual({foo: 'bar'});
    });
    it('should work for different console API calls', async({page, server}) => {
      const messages = [];
      page.on('console', msg => messages.push(msg));
      // All console events will be reported before `page.evaluate` is finished.
      await page.evaluate(() => {
        // A pair of time/timeEnd generates only one Console API call.
        console.time('calling console.time');
        console.timeEnd('calling console.time');
        console.trace('calling console.trace');
        console.dir('calling console.dir');
        console.warn('calling console.warn');
        console.error('calling console.error');
        console.log(Promise.resolve('should not wait until resolved!'));
      });
      expect(messages.map(msg => msg.type())).toEqual([
        'timeEnd', 'trace', 'dir', 'warning', 'error', 'log'
      ]);
      expect(messages[0].text()).toContain('calling console.time');
      expect(messages.slice(1).map(msg => msg.text())).toEqual([
        'calling console.trace',
        'calling console.dir',
        'calling console.warn',
        'calling console.error',
        'JSHandle@promise',
      ]);
    });
    it('should not fail for window object', async({page, server}) => {
      let message = null;
      page.once('console', msg => message = msg);
      await Promise.all([
        page.evaluate(() => console.error(window)),
        utils.waitEvent(page, 'console')
      ]);
      expect(message.text()).toBe('JSHandle@object');
    });
  });

  describe('Page.content / Page.setContent', function() {
    const expectedOutput = '<html><head></head><body><div>hello</div></body></html>';
    it('should work', async({page, server}) => {
      await page.setContent('<div>hello</div>');
      const result = await page.content();
      expect(result).toBe(expectedOutput);
    });
    it('should work with doctype', async({page, server}) => {
      const doctype = '<!DOCTYPE html>';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    });
    it('should work with HTML 4 doctype', async({page, server}) => {
      const doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
        '"http://www.w3.org/TR/html4/strict.dtd">';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    });
  });

  describe('Page.addScriptTag', function() {
    it('should throw an error if no options are provided', async({page, server}) => {
      let error = null;
      try {
        await page.addScriptTag('/injectedfile.js');
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Provide an object with a `url`, `path` or `content` property');
    });

    it('should work with a url', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({ url: '/injectedfile.js' });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(() => __injected)).toBe(42);
    });

    it('should work with a url and type=module', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({ url: '/es6/es6import.js', type: 'module' });
      expect(await page.evaluate(() => __es6injected)).toBe(42);
    });

    it('should work with a path and type=module', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({ path: path.join(__dirname, 'assets/es6/es6pathimport.js'), type: 'module' });
      await page.waitForFunction('window.__es6injected');
      expect(await page.evaluate(() => __es6injected)).toBe(42);
    });

    it('should work with a content and type=module', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({ content: `import num from '/es6/es6module.js';window.__es6injected = num;`, type: 'module' });
      await page.waitForFunction('window.__es6injected');
      expect(await page.evaluate(() => __es6injected)).toBe(42);
    });

    it('should throw an error if loading from url fail', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      let error = null;
      try {
        await page.addScriptTag({ url: '/nonexistfile.js' });
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Loading script from /nonexistfile.js failed');
    });

    it('should work with a path', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({ path: path.join(__dirname, 'assets/injectedfile.js') });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(() => __injected)).toBe(42);
    });

    it('should include sourcemap when path is provided', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({ path: path.join(__dirname, 'assets/injectedfile.js') });
      const result = await page.evaluate(() => __injectedError.stack);
      expect(result).toContain(path.join('assets', 'injectedfile.js'));
    });

    it('should work with content', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({ content: 'window.__injected = 35;' });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(() => __injected)).toBe(35);
    });

    xit('should throw when added with content to the CSP page', async({page, server}) => {
      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page.addScriptTag({ content: 'window.__injected = 35;' }).catch(e => error = e);
      expect(error).toBeTruthy();
    });

    it('should throw when added with URL to the CSP page', async({page, server}) => {
      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page.addScriptTag({ url: server.CROSS_PROCESS_PREFIX + '/injectedfile.js' }).catch(e => error = e);
      expect(error).toBeTruthy();
    });
  });

  describe('Page.addStyleTag', function() {
    it('should throw an error if no options are provided', async({page, server}) => {
      let error = null;
      try {
        await page.addStyleTag('/injectedstyle.css');
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Provide an object with a `url`, `path` or `content` property');
    });

    it('should work with a url', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({ url: '/injectedstyle.css' });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(255, 0, 0)');
    });

    it('should throw an error if loading from url fail', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      let error = null;
      try {
        await page.addStyleTag({ url: '/nonexistfile.js' });
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Loading style from /nonexistfile.js failed');
    });

    it('should work with a path', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({ path: path.join(__dirname, 'assets/injectedstyle.css') });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(255, 0, 0)');
    });

    it('should include sourcemap when path is provided', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addStyleTag({ path: path.join(__dirname, 'assets/injectedstyle.css') });
      const styleHandle = await page.$('style');
      const styleContent = await page.evaluate(style => style.innerHTML, styleHandle);
      expect(styleContent).toContain(path.join('assets', 'injectedstyle.css'));
    });

    it('should work with content', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({ content: 'body { background-color: green; }' });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(0, 128, 0)');
    });

    xit('should throw when added with content to the CSP page', async({page, server}) => {
      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page.addStyleTag({ content: 'body { background-color: green; }' }).catch(e => error = e);
      expect(error).toBeTruthy();
    });

    it('should throw when added with URL to the CSP page', async({page, server}) => {
      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page.addStyleTag({ url: server.CROSS_PROCESS_PREFIX + '/injectedstyle.css' }).catch(e => error = e);
      expect(error).toBeTruthy();
    });
  });

  describe('Page.title', function() {
    it('should return the page title', async({page, server}) => {
      await page.goto(server.PREFIX + '/title.html');
      expect(await page.title()).toBe('Woof-Woof');
    });
  });

  describe('Page.select', function() {
    it('should select single option', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(await page.evaluate(() => result.onInput)).toEqual(['blue']);
      expect(await page.evaluate(() => result.onChange)).toEqual(['blue']);
    });
    it('should select only first option', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue', 'green', 'red');
      expect(await page.evaluate(() => result.onInput)).toEqual(['blue']);
      expect(await page.evaluate(() => result.onChange)).toEqual(['blue']);
    });
    it('should select multiple options', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => makeMultiple());
      await page.select('select', 'blue', 'green', 'red');
      expect(await page.evaluate(() => result.onInput)).toEqual(['blue', 'green', 'red']);
      expect(await page.evaluate(() => result.onChange)).toEqual(['blue', 'green', 'red']);
    });
    it('should respect event bubbling', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(await page.evaluate(() => result.onBubblingInput)).toEqual(['blue']);
      expect(await page.evaluate(() => result.onBubblingChange)).toEqual(['blue']);
    });
    it('should throw when element is not a <select>', async({page, server}) => {
      let error = null;
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('body', '').catch(e => error = e);
      expect(error.message).toContain('Element is not a <select> element.');
    });
    it('should return [] on no matched values', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select','42','abc');
      expect(result).toEqual([]);
    });
    it('should return an array of matched values', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => makeMultiple());
      const result = await page.select('select','blue','black','magenta');
      expect(result.reduce((accumulator,current) => ['blue', 'black', 'magenta'].includes(current) && accumulator, true)).toEqual(true);
    });
    it('should return an array of one element when multiple is not set', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select','42','blue','black','magenta');
      expect(result.length).toEqual(1);
    });
    it('should return [] on no values',async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select');
      expect(result).toEqual([]);
    });
    it('should deselect all options when passed no values for a multiple select',async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => makeMultiple());
      await page.select('select','blue','black','magenta');
      await page.select('select');
      expect(await page.$eval('select', select => Array.from(select.options).every(option => !option.selected))).toEqual(true);
    });
    it('should deselect all options when passed no values for a select without multiple',async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select','blue','black','magenta');
      await page.select('select');
      expect(await page.$eval('select', select => Array.from(select.options).every(option => !option.selected))).toEqual(true);
    });
    it('should throw if passed in non-strings', async({page, server}) => {
      await page.setContent('<select><option value="12"/></select>');
      let error = null;
      try {
        await page.select('select', 12);
      } catch (e) {
        error = e;
      }
      expect(error.message).toContain('Values must be strings');
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/3327
    xit('should work when re-defining top-level Event class', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => window.Event = null);
      await page.select('select', 'blue');
      expect(await page.evaluate(() => result.onInput)).toEqual(['blue']);
      expect(await page.evaluate(() => result.onChange)).toEqual(['blue']);
    });
  });
};

