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

import assert from 'assert';

import {BrowserPlatform} from '../../../lib/cjs/browser-data/browser-data.js';
import {
  resolveDownloadUrl,
  relativeExecutablePath,
} from '../../../lib/cjs/browser-data/chromedriver.js';

describe('ChromeDriver', () => {
  it('should resolve download URLs', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '112.0.5615.49'),
      'https://chromedriver.storage.googleapis.com/112.0.5615.49/chromedriver_linux64.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, '112.0.5615.49'),
      'https://chromedriver.storage.googleapis.com/112.0.5615.49/chromedriver_mac64.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, '112.0.5615.49'),
      'https://chromedriver.storage.googleapis.com/112.0.5615.49/chromedriver_mac_arm64.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, '112.0.5615.49'),
      'https://chromedriver.storage.googleapis.com/112.0.5615.49/chromedriver_win32.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, '112.0.5615.49'),
      'https://chromedriver.storage.googleapis.com/112.0.5615.49/chromedriver_win32.zip'
    );
  });

  it('should resolve executable paths', () => {
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.LINUX, '12372323'),
      'chromedriver'
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC, '12372323'),
      'chromedriver'
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC_ARM, '12372323'),
      'chromedriver'
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN32, '12372323'),
      'chromedriver.exe'
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN64, '12372323'),
      'chromedriver.exe'
    );
  });
});
