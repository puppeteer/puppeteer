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
    it('should return preferences for WebDriver BiDi', async () => {
      const prefs: Record<string, unknown> = FirefoxLauncher.getPreferences({
        test: 1,
      });
      expect(prefs['test']).toBe(1);
      expect(prefs['fission.bfcacheInParent']).toBe(undefined);
      expect(prefs['fission.webContentIsolationStrategy']).toBe(0);
    });

    it('should pass through locale preference', () => {
      const prefs: Record<string, unknown> = FirefoxLauncher.getPreferences({
        'intl.locale.requested': 'fr-FR',
      });
      expect(prefs['intl.locale.requested']).toBe('fr-FR');
    });

    it('should allow extraPrefsFirefox to override locale preference', () => {
      const prefs: Record<string, unknown> = FirefoxLauncher.getPreferences({
        'intl.locale.requested': 'en-US',
        'intl.locale.requested2': 'de-DE',
      });
      expect(prefs['intl.locale.requested']).toBe('en-US');
      expect(prefs['intl.locale.requested2']).toBe('de-DE');
    });
  });
});
