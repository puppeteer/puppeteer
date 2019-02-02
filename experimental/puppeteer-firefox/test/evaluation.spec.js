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

module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  const FFOX = product === 'firefox';
  const CHROME = product === 'chromium';

  describe('Page.evaluate', function() {
    it('should work', async({page, server}) => {
      const result = await page.evaluate(() => 7 * 3);
      expect(result).toBe(21);
    });
    it('should throw when evaluation triggers reload', async({page, server}) => {
      let error = null;
      await page.evaluate(() => {
        location.reload();
        return new Promise(resolve => {
          setTimeout(() => resolve(1), 0);
        });
      }).catch(e => error = e);
      expect(error.message).toContain('Protocol error');
    });
    it('should await promise', async({page, server}) => {
      const result = await page.evaluate(() => Promise.resolve(8 * 7));
      expect(result).toBe(56);
    });
    it('should reject promise with exception', async({page, server}) => {
      let error = null;
      await page.evaluate(() => not.existing.object.property).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('not is not defined');
    });
    it('should support thrown strings as error messages', async({page, server}) => {
      let error = null;
      await page.evaluate(() => { throw 'qwerty'; }).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('qwerty');
    });
    it('should support thrown numbers as error messages', async({page, server}) => {
      let error = null;
      await page.evaluate(() => { throw 100500; }).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('100500');
    });
    it('should return complex objects', async({page, server}) => {
      const object = {foo: 'bar!'};
      const result = await page.evaluate(a => a, object);
      expect(result).not.toBe(object);
      expect(result).toEqual(object);
    });
    it('should transfer NaN', async({page, server}) => {
      const result = await page.evaluate(a => a, NaN);
      expect(Object.is(result, NaN)).toBe(true);
    });
    it('should transfer -0', async({page, server}) => {
      const result = await page.evaluate(a => a, -0);
      expect(Object.is(result, -0)).toBe(true);
    });
    it('should transfer Infinity', async({page, server}) => {
      const result = await page.evaluate(a => a, Infinity);
      expect(Object.is(result, Infinity)).toBe(true);
    });
    it('should transfer -Infinity', async({page, server}) => {
      const result = await page.evaluate(a => a, -Infinity);
      expect(Object.is(result, -Infinity)).toBe(true);
    });
    it('should transfer arrays', async({page, server}) => {
      const result = await page.evaluate(a => a, [1, 2, 3]);
      expect(result).toEqual([1,2,3]);
    });
    it('should transfer arrays as arrays, not objects', async({page, server}) => {
      const result = await page.evaluate(a => Array.isArray(a), [1, 2, 3]);
      expect(result).toBe(true);
    });
    it('should accept "undefined" as one of multiple parameters', async({page, server}) => {
      const result = await page.evaluate((a, b) => Object.is(a, undefined) && Object.is(b, 'foo'), undefined, 'foo');
      expect(result).toBe(true);
    });
    it('should properly serialize null fields', async({page}) => {
      expect(await page.evaluate(() => ({a: undefined}))).toEqual({});
    });
    it('should return undefined for non-serializable objects', async({page, server}) => {
      expect(await page.evaluate(() => window)).toBe(undefined);
    });
    xit('should return undefined for objects with symbols', async({page, server}) => {
      expect(await page.evaluate(() => [Symbol('foo4')])).toBe(undefined);
    });
    it('should fail for circular object', async({page, server}) => {
      const result = await page.evaluate(() => {
        const a = {};
        const b = {a};
        a.b = b;
        return a;
      });
      expect(result).toBe(undefined);
    });
    it('should accept a string', async({page, server}) => {
      const result = await page.evaluate('1 + 2');
      expect(result).toBe(3);
    });
    it('should accept a string with semi colons', async({page, server}) => {
      const result = await page.evaluate('1 + 5;');
      expect(result).toBe(6);
    });
    it('should accept a string with comments', async({page, server}) => {
      const result = await page.evaluate('2 + 5;\n// do some math!');
      expect(result).toBe(7);
    });
    it('should simulate a user gesture', async({page, server}) => {
      const result = await page.evaluate(() => document.execCommand('copy'));
      expect(result).toBe(true);
    });
    it('should evaluate in the page context', async({page, server}) => {
      await page.goto(server.PREFIX + '/global-var.html');
      expect(await page.evaluate('globalVar')).toBe(123);
    });
    it('should modify global environment', async({page}) => {
      await page.evaluate(() => window.globalVar = 123);
      expect(await page.evaluate('globalVar')).toBe(123);
    });
  });

  describe('Frame.evaluate', function() {
    it('should have different execution contexts', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE2);
      expect(page.frames().length).toBe(2);
      await page.frames()[0].evaluate(() => window.FOO = 'foo');
      await page.frames()[1].evaluate(() => window.FOO = 'bar');
      expect(await page.frames()[0].evaluate(() => window.FOO)).toBe('foo');
      expect(await page.frames()[1].evaluate(() => window.FOO)).toBe('bar');
    });
    it('should have correct execution contexts', async({page, server}) => {
      await page.goto(server.PREFIX + '/frames/one-frame.html');
      expect(page.frames().length).toBe(2);
      expect(await page.frames()[0].evaluate(() => document.body.textContent.trim())).toBe('');
      expect(await page.frames()[1].evaluate(() => document.body.textContent.trim())).toBe(`Hi, I'm frame`);
    });
  });

  describe('Page.evaluateOnNewDocument', function() {
    it('should evaluate before anything else on the page', async({page, server}) => {
      await page.evaluateOnNewDocument(function(){
        window.injected = 123;
      });
      await page.goto(server.PREFIX + '/tamperable.html');
      expect(await page.evaluate(() => window.result)).toBe(123);
    });
    it('should work with CSP', async({page, server}) => {
      server.setCSP('/empty.html', 'script-src ' + server.PREFIX);
      await page.evaluateOnNewDocument(function(){
        window.injected = 123;
      });
      await page.goto(server.PREFIX + '/empty.html');
      expect(await page.evaluate(() => window.injected)).toBe(123);

      // Make sure CSP works.
      await page.addScriptTag({content: 'window.e = 10;'}).catch(e => void e);
      expect(await page.evaluate(() => window.e)).toBe(undefined);
    });
  });
};

