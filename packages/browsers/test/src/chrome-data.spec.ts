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

import {
  resolveDownloadUrl,
  executablePath,
} from '../../lib/cjs/browsers/chrome.js';
import {BrowserPlatform} from '../../lib/cjs/browsers/browsers.js';
import assert from 'assert';
import path from 'path';

describe('Chrome', () => {
  it('should resolve download URLs', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Linux_x64/1083080/chrome-linux.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Mac/1083080/chrome-mac.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Mac_Arm/1083080/chrome-mac.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Win/1083080/chrome-win.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/1083080/chrome-win.zip'
    );
  });

  it('should resolve executable paths', () => {
    assert.strictEqual(
      executablePath(BrowserPlatform.LINUX, '12372323'),
      path.join('linux-12372323', 'chrome')
    );
    assert.strictEqual(
      executablePath(BrowserPlatform.MAC, '12372323'),
      path.join('mac-12372323', 'Chromium.app', 'Contents', 'MacOS', 'Chromium')
    );
    assert.strictEqual(
      executablePath(BrowserPlatform.MAC_ARM, '12372323'),
      path.join(
        'mac_arm-12372323',
        'Chromium.app',
        'Contents',
        'MacOS',
        'Chromium'
      )
    );
    assert.strictEqual(
      executablePath(BrowserPlatform.WIN32, '12372323'),
      path.join('win32-12372323', 'chrome.exe')
    );
    assert.strictEqual(
      executablePath(BrowserPlatform.WIN64, '12372323'),
      path.join('win64-12372323', 'chrome.exe')
    );
  });
});
