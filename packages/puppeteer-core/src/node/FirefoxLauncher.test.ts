/**
 * Copyright 2023 Google Inc. All rights reserved.
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
