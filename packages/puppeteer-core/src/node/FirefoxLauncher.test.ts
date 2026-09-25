/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import {assert} from 'chai';

import {FirefoxLauncher} from './FirefoxLauncher.js';
import type {PuppeteerNode} from './PuppeteerNode.js';

describe('FirefoxLauncher', function () {
  describe('getPreferences', function () {
    it('should return preferences for WebDriver BiDi', async () => {
      const prefs: Record<string, unknown> = FirefoxLauncher.getPreferences({
        test: 1,
      });
      assert.strictEqual(prefs['test'], 1);
      assert.isUndefined(prefs['fission.bfcacheInParent']);
      assert.strictEqual(prefs['fission.webContentIsolationStrategy'], 0);
    });
  });

  describe('launch', function () {
    it('should reject blocklist for the default Firefox WebDriver BiDi protocol', async () => {
      const launcher = new FirefoxLauncher({} as PuppeteerNode, () => {
        return undefined;
      });

      let error: unknown;
      let rejected = false;
      try {
        await launcher.launch({
          blocklist: ['https://example.com/*'],
        });
      } catch (e) {
        rejected = true;
        error = e;
      }
      assert.isTrue(rejected, 'Expected promise to reject');
      assert.instanceOf(error, Error);
      assert.include(
        error.message,
        'blocklist and allowlist are only supported with the CDP protocol',
      );
    });
  });
});
