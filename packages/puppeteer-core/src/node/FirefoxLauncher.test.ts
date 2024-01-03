/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {FirefoxLauncher} from './FirefoxLauncher.js';

describe('FirefoxLauncher', function () {
  describe('getPreferences', function () {
    it('should return preferences for CDP', async () => {
      const prefs: Record<string, unknown> = FirefoxLauncher.getPreferences(
        {
          test: 1,
        },
        undefined
      );
      expect(prefs['test']).toBe(1);
      expect(prefs['fission.bfcacheInParent']).toBe(false);
      expect(prefs['fission.webContentIsolationStrategy']).toBe(0);
      expect(prefs).toEqual(
        FirefoxLauncher.getPreferences(
          {
            test: 1,
          },
          'cdp'
        )
      );
    });

    it('should return preferences for WebDriver BiDi', async () => {
      const prefs: Record<string, unknown> = FirefoxLauncher.getPreferences(
        {
          test: 1,
        },
        'webDriverBiDi'
      );
      expect(prefs['test']).toBe(1);
      expect(prefs['fission.bfcacheInParent']).toBe(undefined);
      expect(prefs['fission.webContentIsolationStrategy']).toBe(0);
    });
  });
});
