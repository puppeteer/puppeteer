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
import path from 'path';

import {
  BrowserPlatform,
  ChromeReleaseChannel,
} from '../../../lib/cjs/browser-data/browser-data.js';
import {
  resolveDownloadUrl,
  relativeExecutablePath,
  resolveSystemExecutablePath,
} from '../../../lib/cjs/browser-data/chrome.js';

describe('Chrome', () => {
  it('should resolve download URLs', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '113.0.5672.0'),
      'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/113.0.5672.0/linux64/chrome-linux64.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, '113.0.5672.0'),
      'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/113.0.5672.0/mac-x64/chrome-mac-x64.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, '113.0.5672.0'),
      'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/113.0.5672.0/mac-arm64/chrome-mac-arm64.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, '113.0.5672.0'),
      'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/113.0.5672.0/win32/chrome-win32.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, '113.0.5672.0'),
      'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/113.0.5672.0/win64/chrome-win64.zip'
    );
  });

  it('should resolve executable paths', () => {
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.LINUX, '12372323'),
      path.join('chrome-linux64', 'chrome')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC, '12372323'),
      path.join(
        'chrome-mac-x64',
        'Google Chrome for Testing.app',
        'Contents',
        'MacOS',
        'Google Chrome for Testing'
      )
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC_ARM, '12372323'),
      path.join(
        'chrome-mac-arm64',
        'Google Chrome for Testing.app',
        'Contents',
        'MacOS',
        'Google Chrome for Testing'
      )
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN32, '12372323'),
      path.join('chrome-win32', 'chrome.exe')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN64, '12372323'),
      path.join('chrome-win64', 'chrome.exe')
    );
  });

  it('should resolve system executable path', () => {
    process.env['PROGRAMFILES'] = 'C:\\ProgramFiles';
    try {
      assert.strictEqual(
        resolveSystemExecutablePath(
          BrowserPlatform.WIN32,
          ChromeReleaseChannel.DEV
        ),
        'C:\\ProgramFiles\\Google\\Chrome Dev\\Application\\chrome.exe'
      );
    } finally {
      delete process.env['PROGRAMFILES'];
    }

    assert.strictEqual(
      resolveSystemExecutablePath(
        BrowserPlatform.MAC,
        ChromeReleaseChannel.BETA
      ),
      '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta'
    );
    assert.throws(() => {
      assert.strictEqual(
        resolveSystemExecutablePath(
          BrowserPlatform.LINUX,
          ChromeReleaseChannel.CANARY
        ),
        path.join('chrome-linux', 'chrome')
      );
    }, new Error(`Unable to detect browser executable path for 'canary' on linux.`));
  });
});
