/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {assertGolden} from './utils.js';

describe('Coverage specs', function () {
  setupTestBrowserHooks();

  describe('JSCoverage', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();
      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/simple.html', {
        waitUntil: 'load',
      });
      const coverage = await page.coverage.stopJSCoverage();
      assert.lengthOf(coverage, 1);
      assert.include(coverage[0]!.url, '/jscoverage/simple.html');
      assert.deepEqual(coverage[0]!.ranges, [
        {start: 0, end: 17},
        {start: 35, end: 61},
      ]);
    });
    it('should report sourceURLs', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/sourceurl.html');
      const coverage = await page.coverage.stopJSCoverage();
      assert.lengthOf(coverage, 1);
      assert.strictEqual(coverage[0]!.url, 'nicename.js');
    });
    it('should ignore eval() scripts by default', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/eval.html');
      const coverage = await page.coverage.stopJSCoverage();
      assert.lengthOf(coverage, 1);
    });
    it('should not ignore eval() scripts if reportAnonymousScripts is true', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage({reportAnonymousScripts: true});
      await page.goto(server.PREFIX + '/jscoverage/eval.html');
      const coverage = await page.coverage.stopJSCoverage();

      const filtered = coverage.filter(entry => {
        return !entry.url.startsWith('debugger://');
      });
      assert.lengthOf(filtered, 1);
    });
    it('should ignore pptr internal scripts if reportAnonymousScripts is true', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage({reportAnonymousScripts: true});
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate('console.log("foo")');
      await page.evaluate(() => {
        return console.log('bar');
      });
      const coverage = await page.coverage.stopJSCoverage();
      assert.lengthOf(coverage, 0);
    });
    it('should report multiple scripts', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/multiple.html');
      const coverage = await page.coverage.stopJSCoverage();
      assert.lengthOf(coverage, 2);
      coverage.sort((a, b) => {
        return a.url.localeCompare(b.url);
      });
      assert.include(coverage[0]!.url, '/jscoverage/script1.js');
      assert.include(coverage[1]!.url, '/jscoverage/script2.js');
    });
    it('should report right ranges', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/ranges.html');
      const coverage = await page.coverage.stopJSCoverage();
      assert.lengthOf(coverage, 1);
      const entry = coverage[0]!;
      assert.lengthOf(entry.ranges, 2);
      const range1 = entry.ranges[0]!;
      assert.strictEqual(entry.text.substring(range1.start, range1.end), '\n');
      const range2 = entry.ranges[1]!;
      assert.strictEqual(
        entry.text.substring(range2.start, range2.end),
        `console.log('used!');if(true===false)`,
      );
    });
    it('should report right ranges for "per function" scope', async () => {
      const {page, server} = await getTestState();

      const coverageOptions = {
        useBlockCoverage: false,
      };

      await page.coverage.startJSCoverage(coverageOptions);
      await page.goto(server.PREFIX + '/jscoverage/ranges.html');
      const coverage = await page.coverage.stopJSCoverage();
      assert.lengthOf(coverage, 1);
      const entry = coverage[0]!;
      assert.lengthOf(entry.ranges, 2);
      const range1 = entry.ranges[0]!;
      assert.strictEqual(entry.text.substring(range1.start, range1.end), '\n');
      const range2 = entry.ranges[1]!;
      assert.strictEqual(
        entry.text.substring(range2.start, range2.end),
        `console.log('used!');if(true===false)console.log('unused!');`,
      );
    });
    it('should report scripts that have no coverage', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/unused.html');
      const coverage = await page.coverage.stopJSCoverage();
      assert.lengthOf(coverage, 1);
      const entry = coverage[0]!;
      assert.include(entry.url, 'unused.html');
      assert.lengthOf(entry.ranges, 0);
    });
    it('should work with conditionals', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/involved.html');
      const coverage = await page.coverage.stopJSCoverage();
      assertGolden(
        JSON.stringify(coverage, null, 2).replace(/:\d{4,5}\//g, ':<PORT>/'),
        'jscoverage-involved.txt',
      );
    });
    it('should not hang when there is a debugger statement', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        debugger; // eslint-disable-line no-debugger
      });
      await page.coverage.stopJSCoverage();
    });
    describe('resetOnNavigation', function () {
      it('should NOT report scripts across navigations when enabled', async () => {
        const {page, server} = await getTestState();

        await page.coverage.startJSCoverage(); // Enabled by default.
        await page.goto(server.PREFIX + '/jscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopJSCoverage();
        assert.lengthOf(coverage, 0);
      });
    });
    describe('includeRawScriptCoverage', function () {
      it('should not include rawScriptCoverage field when disabled', async () => {
        const {page, server} = await getTestState();
        await page.coverage.startJSCoverage();
        await page.goto(server.PREFIX + '/jscoverage/simple.html', {
          waitUntil: 'load',
        });
        const coverage = await page.coverage.stopJSCoverage();
        assert.lengthOf(coverage, 1);
        assert.isUndefined(coverage[0]!.rawScriptCoverage);
      });
      it('should include rawScriptCoverage field when enabled', async () => {
        const {page, server} = await getTestState();
        await page.coverage.startJSCoverage({
          includeRawScriptCoverage: true,
        });
        await page.goto(server.PREFIX + '/jscoverage/simple.html', {
          waitUntil: 'load',
        });
        const coverage = await page.coverage.stopJSCoverage();
        assert.lengthOf(coverage, 1);
        assert.ok(coverage[0]!.rawScriptCoverage);
      });
    });
  });

  describe('CSSCoverage', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/simple.html');
      const coverage = await page.coverage.stopCSSCoverage();
      assert.lengthOf(coverage, 1);
      assert.include(coverage[0]!.url, '/csscoverage/simple.html');
      assert.deepEqual(coverage[0]!.ranges, [{start: 1, end: 22}]);
      const range = coverage[0]!.ranges[0]!;
      assert.strictEqual(
        coverage[0]!.text.substring(range.start, range.end),
        'div { color: green; }',
      );
    });
    it('should report sourceURLs', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/sourceurl.html');
      const coverage = await page.coverage.stopCSSCoverage();
      assert.lengthOf(coverage, 1);
      assert.strictEqual(coverage[0]!.url, 'nicename.css');
    });
    it('should report multiple stylesheets', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/multiple.html');
      const coverage = await page.coverage.stopCSSCoverage();
      assert.lengthOf(coverage, 2);
      coverage.sort((a, b) => {
        return a.url.localeCompare(b.url);
      });
      assert.include(coverage[0]!.url, '/csscoverage/stylesheet1.css');
      assert.include(coverage[1]!.url, '/csscoverage/stylesheet2.css');
    });
    it('should report stylesheets that have no coverage', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/unused.html');
      const coverage = await page.coverage.stopCSSCoverage();
      assert.lengthOf(coverage, 1);
      assert.strictEqual(coverage[0]!.url, 'unused.css');
      assert.lengthOf(coverage[0]!.ranges, 0);
    });
    it('should work with media queries', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/media.html');
      const coverage = await page.coverage.stopCSSCoverage();
      assert.lengthOf(coverage, 1);
      assert.include(coverage[0]!.url, '/csscoverage/media.html');
      assert.deepEqual(coverage[0]!.ranges, [
        {start: 8, end: 15},
        {start: 17, end: 38},
      ]);
    });
    it('should work with complicated usecases', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/involved.html');
      const coverage = await page.coverage.stopCSSCoverage();
      assertGolden(
        JSON.stringify(coverage, null, 2).replace(/:\d{4,5}\//g, ':<PORT>/'),
        'csscoverage-involved.txt',
      );
    });
    it('should work with empty stylesheets', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/empty.html');
      const coverage = await page.coverage.stopCSSCoverage();
      assert.lengthOf(coverage, 1);
      assert.strictEqual(coverage[0]!.text, '');
    });
    it('should ignore injected stylesheets', async () => {
      const {page} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.addStyleTag({content: 'body { margin: 10px;}'});
      // trigger style recalc
      const margin = await page.evaluate(() => {
        return window.getComputedStyle(document.body).margin;
      });
      assert.strictEqual(margin, '10px');
      const coverage = await page.coverage.stopCSSCoverage();
      assert.lengthOf(coverage, 0);
    });
    it('should work with a recently loaded stylesheet', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.evaluate(async url => {
        document.body.textContent = 'hello, world';

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
        await new Promise(x => {
          return (link.onload = x);
        });
      }, server.PREFIX + '/csscoverage/stylesheet1.css');
      const coverage = await page.coverage.stopCSSCoverage();
      assert.lengthOf(coverage, 1);
    });
    describe('resetOnNavigation', function () {
      it('should report stylesheets across navigations', async () => {
        const {page, server} = await getTestState();

        await page.coverage.startCSSCoverage({resetOnNavigation: false});
        await page.goto(server.PREFIX + '/csscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopCSSCoverage();
        assert.lengthOf(coverage, 2);
      });
      it('should NOT report scripts across navigations', async () => {
        const {page, server} = await getTestState();

        await page.coverage.startCSSCoverage(); // Enabled by default.
        await page.goto(server.PREFIX + '/csscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopCSSCoverage();
        assert.lengthOf(coverage, 0);
      });
    });
  });
});
