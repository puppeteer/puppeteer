/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

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
      expect(coverage).toHaveLength(1);
      expect(coverage[0]!.url).toContain('/jscoverage/simple.html');
      expect(coverage[0]!.ranges).toEqual([
        {start: 0, end: 17},
        {start: 35, end: 61},
      ]);
    });
    it('should report sourceURLs', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/sourceurl.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage).toHaveLength(1);
      expect(coverage[0]!.url).toBe('nicename.js');
    });
    it('should ignore eval() scripts by default', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/eval.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage).toHaveLength(1);
    });
    it('should not ignore eval() scripts if reportAnonymousScripts is true', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage({reportAnonymousScripts: true});
      await page.goto(server.PREFIX + '/jscoverage/eval.html');
      const coverage = await page.coverage.stopJSCoverage();

      const filtered = coverage.filter(entry => {
        return !entry.url.startsWith('debugger://');
      });
      expect(filtered).toHaveLength(1);
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
      expect(coverage).toHaveLength(0);
    });
    it('should report multiple scripts', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/multiple.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage).toHaveLength(2);
      coverage.sort((a, b) => {
        return a.url.localeCompare(b.url);
      });
      expect(coverage[0]!.url).toContain('/jscoverage/script1.js');
      expect(coverage[1]!.url).toContain('/jscoverage/script2.js');
    });
    it('should report right ranges', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/ranges.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage).toHaveLength(1);
      const entry = coverage[0]!;
      expect(entry.ranges).toHaveLength(2);
      const range1 = entry.ranges[0]!;
      expect(entry.text.substring(range1.start, range1.end)).toBe('\n');
      const range2 = entry.ranges[1]!;
      expect(entry.text.substring(range2.start, range2.end)).toBe(
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
      expect(coverage).toHaveLength(1);
      const entry = coverage[0]!;
      expect(entry.ranges).toHaveLength(2);
      const range1 = entry.ranges[0]!;
      expect(entry.text.substring(range1.start, range1.end)).toBe('\n');
      const range2 = entry.ranges[1]!;
      expect(entry.text.substring(range2.start, range2.end)).toBe(
        `console.log('used!');if(true===false)console.log('unused!');`,
      );
    });
    it('should report scripts that have no coverage', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/unused.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage).toHaveLength(1);
      const entry = coverage[0]!;
      expect(entry.url).toContain('unused.html');
      expect(entry.ranges).toHaveLength(0);
    });
    it('should work with conditionals', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/involved.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(
        JSON.stringify(coverage, null, 2).replace(/:\d{4,5}\//g, ':<PORT>/'),
      ).toBeGolden('jscoverage-involved.txt');
    });
    // @see https://crbug.com/990945
    it.skip('should not hang when there is a debugger statement', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        debugger; // eslint-disable-line no-debugger
      });
      await page.coverage.stopJSCoverage();
    });
    describe('resetOnNavigation', function () {
      it('should report scripts across navigations when disabled', async () => {
        const {page, server} = await getTestState();

        await page.coverage.startJSCoverage({resetOnNavigation: false});
        await page.goto(server.PREFIX + '/jscoverage/multiple.html');
        // TODO: navigating too fast might loose JS coverage data in the browser.
        await page.waitForNetworkIdle();
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopJSCoverage();
        expect(coverage).toHaveLength(2);
      });

      it('should NOT report scripts across navigations when enabled', async () => {
        const {page, server} = await getTestState();

        await page.coverage.startJSCoverage(); // Enabled by default.
        await page.goto(server.PREFIX + '/jscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopJSCoverage();
        expect(coverage).toHaveLength(0);
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
        expect(coverage).toHaveLength(1);
        expect(coverage[0]!.rawScriptCoverage).toBeUndefined();
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
        expect(coverage).toHaveLength(1);
        expect(coverage[0]!.rawScriptCoverage).toBeTruthy();
      });
    });
    // @see https://crbug.com/990945
    it.skip('should not hang when there is a debugger statement', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startJSCoverage();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        debugger; // eslint-disable-line no-debugger
      });
      await page.coverage.stopJSCoverage();
    });
  });

  describe('CSSCoverage', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/simple.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage).toHaveLength(1);
      expect(coverage[0]!.url).toContain('/csscoverage/simple.html');
      expect(coverage[0]!.ranges).toEqual([{start: 1, end: 22}]);
      const range = coverage[0]!.ranges[0]!;
      expect(coverage[0]!.text.substring(range.start, range.end)).toBe(
        'div { color: green; }',
      );
    });
    it('should report sourceURLs', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/sourceurl.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage).toHaveLength(1);
      expect(coverage[0]!.url).toBe('nicename.css');
    });
    it('should report multiple stylesheets', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/multiple.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage).toHaveLength(2);
      coverage.sort((a, b) => {
        return a.url.localeCompare(b.url);
      });
      expect(coverage[0]!.url).toContain('/csscoverage/stylesheet1.css');
      expect(coverage[1]!.url).toContain('/csscoverage/stylesheet2.css');
    });
    it('should report stylesheets that have no coverage', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/unused.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage).toHaveLength(1);
      expect(coverage[0]!.url).toBe('unused.css');
      expect(coverage[0]!.ranges).toHaveLength(0);
    });
    it('should work with media queries', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/media.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage).toHaveLength(1);
      expect(coverage[0]!.url).toContain('/csscoverage/media.html');
      expect(coverage[0]!.ranges).toEqual([
        {start: 8, end: 15},
        {start: 17, end: 38},
      ]);
    });
    it('should work with complicated usecases', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/involved.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(
        JSON.stringify(coverage, null, 2).replace(/:\d{4,5}\//g, ':<PORT>/'),
      ).toBeGolden('csscoverage-involved.txt');
    });
    it('should work with empty stylesheets', async () => {
      const {page, server} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/empty.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage).toHaveLength(1);
      expect(coverage[0]!.text).toEqual('');
    });
    it('should ignore injected stylesheets', async () => {
      const {page} = await getTestState();

      await page.coverage.startCSSCoverage();
      await page.addStyleTag({content: 'body { margin: 10px;}'});
      // trigger style recalc
      const margin = await page.evaluate(() => {
        return window.getComputedStyle(document.body).margin;
      });
      expect(margin).toBe('10px');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage).toHaveLength(0);
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
      expect(coverage).toHaveLength(1);
    });
    describe('resetOnNavigation', function () {
      it('should report stylesheets across navigations', async () => {
        const {page, server} = await getTestState();

        await page.coverage.startCSSCoverage({resetOnNavigation: false});
        await page.goto(server.PREFIX + '/csscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopCSSCoverage();
        expect(coverage).toHaveLength(2);
      });
      it('should NOT report scripts across navigations', async () => {
        const {page, server} = await getTestState();

        await page.coverage.startCSSCoverage(); // Enabled by default.
        await page.goto(server.PREFIX + '/csscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopCSSCoverage();
        expect(coverage).toHaveLength(0);
      });
    });
  });
});
