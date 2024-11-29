/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
  resolveBuildId,
  compareVersions,
} from '../../../lib/cjs/browser-data/chrome.js';

describe('Chrome', () => {
  it('should resolve download URLs', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '113.0.5672.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/113.0.5672.0/linux64/chrome-linux64.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, '113.0.5672.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/113.0.5672.0/mac-x64/chrome-mac-x64.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, '113.0.5672.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/113.0.5672.0/mac-arm64/chrome-mac-arm64.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, '113.0.5672.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/113.0.5672.0/win32/chrome-win32.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, '113.0.5672.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/113.0.5672.0/win64/chrome-win64.zip',
    );
  });

  it('should resolve executable paths', () => {
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.LINUX, '12372323'),
      path.join('chrome-linux64', 'chrome'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC, '12372323'),
      path.join(
        'chrome-mac-x64',
        'Google Chrome for Testing.app',
        'Contents',
        'MacOS',
        'Google Chrome for Testing',
      ),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC_ARM, '12372323'),
      path.join(
        'chrome-mac-arm64',
        'Google Chrome for Testing.app',
        'Contents',
        'MacOS',
        'Google Chrome for Testing',
      ),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN32, '12372323'),
      path.join('chrome-win32', 'chrome.exe'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN64, '12372323'),
      path.join('chrome-win64', 'chrome.exe'),
    );
  });

  it('should resolve system executable path', () => {
    process.env['PROGRAMFILES'] = 'C:\\ProgramFiles';
    try {
      assert.strictEqual(
        resolveSystemExecutablePath(
          BrowserPlatform.WIN32,
          ChromeReleaseChannel.DEV,
        ),
        'C:\\ProgramFiles\\Google\\Chrome Dev\\Application\\chrome.exe',
      );
    } finally {
      delete process.env['PROGRAMFILES'];
    }

    assert.strictEqual(
      resolveSystemExecutablePath(
        BrowserPlatform.MAC,
        ChromeReleaseChannel.BETA,
      ),
      '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
    );
    assert.strictEqual(
      resolveSystemExecutablePath(
        BrowserPlatform.LINUX,
        ChromeReleaseChannel.CANARY,
      ),
      '/opt/google/chrome-canary/chrome',
    );
  });

  it('should resolve milestones', async () => {
    assert.strictEqual(await resolveBuildId('115'), '115.0.5790.170');
  });

  it('should resolve build prefix', async () => {
    assert.strictEqual(await resolveBuildId('115.0.5790'), '115.0.5790.170');
  });

  it('should compare versions', async () => {
    assert.ok(compareVersions('115.0.5790', '115.0.5789') >= 1);
    assert.ok(compareVersions('115.0.5789', '115.0.5790') <= -1);
    assert.ok(compareVersions('115.0.5790', '115.0.5790') === 0);
  });
});
