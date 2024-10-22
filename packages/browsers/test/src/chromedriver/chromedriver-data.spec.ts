/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import path from 'path';

import {BrowserPlatform} from '../../../lib/cjs/browser-data/browser-data.js';
import {
  resolveDownloadUrl,
  relativeExecutablePath,
  resolveBuildId,
} from '../../../lib/cjs/browser-data/chromedriver.js';

describe('ChromeDriver', () => {
  it('should resolve download URLs', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '115.0.5763.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/115.0.5763.0/linux64/chromedriver-linux64.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, '115.0.5763.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/115.0.5763.0/mac-x64/chromedriver-mac-x64.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, '115.0.5763.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/115.0.5763.0/mac-arm64/chromedriver-mac-arm64.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, '115.0.5763.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/115.0.5763.0/win32/chromedriver-win32.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, '115.0.5763.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/115.0.5763.0/win64/chromedriver-win64.zip',
    );
  });

  it('should resolve milestones', async () => {
    assert.strictEqual(await resolveBuildId('115'), '115.0.5790.170');
  });

  it('should resolve build prefix', async () => {
    assert.strictEqual(await resolveBuildId('115.0.5790'), '115.0.5790.170');
  });

  it('should resolve executable paths', () => {
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.LINUX, '12372323'),
      path.join('chromedriver-linux64', 'chromedriver'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC, '12372323'),
      path.join('chromedriver-mac-x64/', 'chromedriver'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC_ARM, '12372323'),
      path.join('chromedriver-mac-arm64', 'chromedriver'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN32, '12372323'),
      path.join('chromedriver-win32', 'chromedriver.exe'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN64, '12372323'),
      path.join('chromedriver-win64', 'chromedriver.exe'),
    );
  });
});
