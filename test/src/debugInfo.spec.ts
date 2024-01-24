/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('DebugInfo', function () {
  setupTestBrowserHooks();

  describe('Browser.debugInfo', function () {
    it('should work', async () => {
      const {page, browser} = await getTestState();

      const promise = page.evaluate(() => {
        return new Promise(resolve => {
          // @ts-expect-error another context
          window.resolve = resolve;
        });
      });
      try {
        expect(browser.debugInfo.pendingProtocolErrors).toHaveLength(1);
      } finally {
        await page.evaluate(() => {
          // @ts-expect-error another context
          window.resolve();
        });
      }
      await promise;
      expect(browser.debugInfo.pendingProtocolErrors).toHaveLength(0);
    });
  });
});
