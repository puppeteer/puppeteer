/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {FirefoxLauncher} from './FirefoxLauncher.js';
import type {PuppeteerNode} from './PuppeteerNode.js';

describe('FirefoxLauncher', function () {
  describe('getPreferences', function () {
    it('should return preferences for WebDriver BiDi', async () => {
      const prefs: Record<string, unknown> = FirefoxLauncher.getPreferences({
        test: 1,
      });
      expect(prefs['test']).toBe(1);
      expect(prefs['fission.bfcacheInParent']).toBe(undefined);
      expect(prefs['fission.webContentIsolationStrategy']).toBe(0);
    });
  });

  describe('launch', function () {
    it('should reject blocklist for the default Firefox WebDriver BiDi protocol', async () => {
      const launcher = new FirefoxLauncher({} as PuppeteerNode);

      await expect(
        launcher.launch({
          blocklist: ['https://example.com/*'],
        }),
      ).rejects.toThrow(
        'blocklist and allowlist are only supported with the CDP protocol',
      );
    });
  });
});
