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

const expect = require('expect');
const {getTestState,setupTestBrowserHooks, setupTestPageAndContextHooks} = require('./mocha-utils');

describe('Emulation', () => {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  let iPhone;
  let iPhoneLandscape;

  before(() => {
    const {puppeteer} = getTestState();
    iPhone = puppeteer.devices['iPhone 6'];
    iPhoneLandscape = puppeteer.devices['iPhone 6 landscape'];
  });

  describe('Page.viewport', function() {

    it('should get the proper viewport size', async() => {
      const {page} = getTestState();

      expect(page.viewport()).toEqual({width: 800, height: 600});
      await page.setViewport({width: 123, height: 456});
      expect(page.viewport()).toEqual({width: 123, height: 456});
    });
    it('should support mobile emulation', async() => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      expect(await page.evaluate(() => window.innerWidth)).toBe(800);
      await page.setViewport(iPhone.viewport);
      expect(await page.evaluate(() => window.innerWidth)).toBe(375);
      await page.setViewport({width: 400, height: 300});
      expect(await page.evaluate(() => window.innerWidth)).toBe(400);
    });
    itFailsFirefox('should support touch emulation', async() => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(false);
      await page.setViewport(iPhone.viewport);
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(true);
      expect(await page.evaluate(dispatchTouch)).toBe('Received touch');
      await page.setViewport({width: 100, height: 100});
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(false);

      function dispatchTouch() {
        let fulfill;
        const promise = new Promise(x => fulfill = x);
        window.ontouchstart = function(e) {
          fulfill('Received touch');
        };
        window.dispatchEvent(new Event('touchstart'));

        fulfill('Did not receive touch');

        return promise;
      }
    });
    itFailsFirefox('should be detectable by Modernizr', async() => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/detect-touch.html');
      expect(await page.evaluate(() => document.body.textContent.trim())).toBe('NO');
      await page.setViewport(iPhone.viewport);
      await page.goto(server.PREFIX + '/detect-touch.html');
      expect(await page.evaluate(() => document.body.textContent.trim())).toBe('YES');
    });
    itFailsFirefox('should detect touch when applying viewport with touches', async() => {
      const {page, server} = getTestState();

      await page.setViewport({width: 800, height: 600, hasTouch: true});
      await page.addScriptTag({url: server.PREFIX + '/modernizr.js'});
      expect(await page.evaluate(() => Modernizr.touchevents)).toBe(true);
    });
    itFailsFirefox('should support landscape emulation', async() => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      expect(await page.evaluate(() => screen.orientation.type)).toBe('portrait-primary');
      await page.setViewport(iPhoneLandscape.viewport);
      expect(await page.evaluate(() => screen.orientation.type)).toBe('landscape-primary');
      await page.setViewport({width: 100, height: 100});
      expect(await page.evaluate(() => screen.orientation.type)).toBe('portrait-primary');
    });
  });

  describe('Page.emulate', function() {
    it('should work', async() => {
      const {page, server} = getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      await page.emulate(iPhone);
      expect(await page.evaluate(() => window.innerWidth)).toBe(375);
      expect(await page.evaluate(() => navigator.userAgent)).toContain('iPhone');
    });
    it('should support clicking', async() => {
      const {page, server} = getTestState();

      await page.emulate(iPhone);
      await page.goto(server.PREFIX + '/input/button.html');
      const button = await page.$('button');
      await page.evaluate(button => button.style.marginTop = '200px', button);
      await button.click();
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
  });

  describe('Page.emulateMedia [deprecated]', function() {
  /* emulateMedia is deprecated in favour of emulateMediaType but we
     * don't want to remove it from Puppeteer just yet. We can't check
     * that emulateMedia === emulateMediaType because when running tests
     * with COVERAGE=1 the methods get rewritten. So instead we
     * duplicate the tests for emulateMediaType and ensure they pass
     * when calling the deprecated emulateMedia method.
     *
     * If you update these tests, you should update emulateMediaType's
     * tests, and vice-versa.
     */
    itFailsFirefox('should work', async() => {
      const {page} = getTestState();

      expect(await page.evaluate(() => matchMedia('screen').matches)).toBe(true);
      expect(await page.evaluate(() => matchMedia('print').matches)).toBe(false);
      await page.emulateMedia('print');
      expect(await page.evaluate(() => matchMedia('screen').matches)).toBe(false);
      expect(await page.evaluate(() => matchMedia('print').matches)).toBe(true);
      await page.emulateMedia(null);
      expect(await page.evaluate(() => matchMedia('screen').matches)).toBe(true);
      expect(await page.evaluate(() => matchMedia('print').matches)).toBe(false);
    });
    it('should throw in case of bad argument', async() => {
      const {page} = getTestState();

      let error = null;
      await page.emulateMedia('bad').catch(error_ => error = error_);
      expect(error.message).toBe('Unsupported media type: bad');
    });
  });

  describe('Page.emulateMediaType', function() {
  /* NOTE! Updating these tests? Update the emulateMedia tests above
     * too (and see the big comment for why we have these duplicated).
     */
    itFailsFirefox('should work', async() => {
      const {page} = getTestState();

      expect(await page.evaluate(() => matchMedia('screen').matches)).toBe(true);
      expect(await page.evaluate(() => matchMedia('print').matches)).toBe(false);
      await page.emulateMediaType('print');
      expect(await page.evaluate(() => matchMedia('screen').matches)).toBe(false);
      expect(await page.evaluate(() => matchMedia('print').matches)).toBe(true);
      await page.emulateMediaType(null);
      expect(await page.evaluate(() => matchMedia('screen').matches)).toBe(true);
      expect(await page.evaluate(() => matchMedia('print').matches)).toBe(false);
    });
    it('should throw in case of bad argument', async() => {
      const {page} = getTestState();

      let error = null;
      await page.emulateMediaType('bad').catch(error_ => error = error_);
      expect(error.message).toBe('Unsupported media type: bad');
    });
  });

  describe('Page.emulateMediaFeatures', function() {
    itFailsFirefox('should work', async() => {
      const {page} = getTestState();

      await page.emulateMediaFeatures([
        {name: 'prefers-reduced-motion', value: 'reduce'},
      ]);
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: no-preference)').matches)).toBe(false);
      await page.emulateMediaFeatures([
        {name: 'prefers-color-scheme', value: 'light'},
      ]);
      expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: light)').matches)).toBe(true);
      expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(false);
      expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: no-preference)').matches)).toBe(false);
      await page.emulateMediaFeatures([
        {name: 'prefers-color-scheme', value: 'dark'},
      ]);
      expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true);
      expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: light)').matches)).toBe(false);
      expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: no-preference)').matches)).toBe(false);
      await page.emulateMediaFeatures([
        {name: 'prefers-reduced-motion', value: 'reduce'},
        {name: 'prefers-color-scheme', value: 'light'},
      ]);
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: no-preference)').matches)).toBe(false);
      expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: light)').matches)).toBe(true);
      expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(false);
      expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: no-preference)').matches)).toBe(false);
    });
    it('should throw in case of bad argument', async() => {
      const {page} = getTestState();

      let error = null;
      await page.emulateMediaFeatures([{name: 'bad', value: ''}]).catch(error_ => error = error_);
      expect(error.message).toBe('Unsupported media feature: bad');
    });
  });

  describeFailsFirefox('Page.emulateTimezone', function() {
    it('should work', async() => {
      const {page} = getTestState();

      page.evaluate(() => {
        globalThis.date = new Date(1479579154987);
      });
      await page.emulateTimezone('America/Jamaica');
      expect(await page.evaluate(() => date.toString())).toBe('Sat Nov 19 2016 13:12:34 GMT-0500 (Eastern Standard Time)');

      await page.emulateTimezone('Pacific/Honolulu');
      expect(await page.evaluate(() => date.toString())).toBe('Sat Nov 19 2016 08:12:34 GMT-1000 (Hawaii-Aleutian Standard Time)');

      await page.emulateTimezone('America/Buenos_Aires');
      expect(await page.evaluate(() => date.toString())).toBe('Sat Nov 19 2016 15:12:34 GMT-0300 (Argentina Standard Time)');

      await page.emulateTimezone('Europe/Berlin');
      expect(await page.evaluate(() => date.toString())).toBe('Sat Nov 19 2016 19:12:34 GMT+0100 (Central European Standard Time)');
    });

    it('should throw for invalid timezone IDs', async() => {
      const {page} = getTestState();

      let error = null;
      await page.emulateTimezone('Foo/Bar').catch(error_ => error = error_);
      expect(error.message).toBe('Invalid timezone ID: Foo/Bar');
      await page.emulateTimezone('Baz/Qux').catch(error_ => error = error_);
      expect(error.message).toBe('Invalid timezone ID: Baz/Qux');
    });
  });

});
