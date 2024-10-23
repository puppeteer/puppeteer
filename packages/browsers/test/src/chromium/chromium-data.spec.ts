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
  compareVersions,
} from '../../../lib/cjs/browser-data/chromium.js';

describe('Chromium', () => {
  it('should resolve download URLs', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Linux_x64/1083080/chrome-linux.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Mac/1083080/chrome-mac.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Mac_Arm/1083080/chrome-mac.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Win/1083080/chrome-win.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, '1083080'),
      'https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/1083080/chrome-win.zip',
    );
  });

  it('should resolve executable paths', () => {
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.LINUX, '12372323'),
      path.join('chrome-linux', 'chrome'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC, '12372323'),
      path.join('chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC_ARM, '12372323'),
      path.join('chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN32, '12372323'),
      path.join('chrome-win', 'chrome.exe'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN64, '12372323'),
      path.join('chrome-win', 'chrome.exe'),
    );
  });

  it('should compare versions', async () => {
    assert.ok(compareVersions('12372323', '12372322') >= 1);
    assert.ok(compareVersions('12372322', '12372323') <= -1);
    assert.ok(compareVersions('12372323', '12372323') === 0);
  });
});
