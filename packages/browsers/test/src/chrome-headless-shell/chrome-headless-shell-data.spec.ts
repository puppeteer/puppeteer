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
} from '../../../lib/cjs/browser-data/chrome-headless-shell.js';

describe('chrome-headless-shell', () => {
  it('should resolve download URLs', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '118.0.5950.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/118.0.5950.0/linux64/chrome-headless-shell-linux64.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, '118.0.5950.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/118.0.5950.0/mac-x64/chrome-headless-shell-mac-x64.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, '118.0.5950.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/118.0.5950.0/mac-arm64/chrome-headless-shell-mac-arm64.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, '118.0.5950.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/118.0.5950.0/win32/chrome-headless-shell-win32.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, '118.0.5950.0'),
      'https://storage.googleapis.com/chrome-for-testing-public/118.0.5950.0/win64/chrome-headless-shell-win64.zip'
    );
  });

  // TODO: once no new releases happen for the milestone, we can use the exact match.
  it('should resolve milestones', async () => {
    assert((await resolveBuildId('118'))?.startsWith('118.0'));
  });

  it('should resolve build prefix', async () => {
    assert.strictEqual(await resolveBuildId('118.0.5950'), '118.0.5950.0');
  });

  it('should resolve executable paths', () => {
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.LINUX, '12372323'),
      path.join('chrome-headless-shell-linux64', 'chrome-headless-shell')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC, '12372323'),
      path.join('chrome-headless-shell-mac-x64/', 'chrome-headless-shell')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC_ARM, '12372323'),
      path.join('chrome-headless-shell-mac-arm64', 'chrome-headless-shell')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN32, '12372323'),
      path.join('chrome-headless-shell-win32', 'chrome-headless-shell.exe')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN64, '12372323'),
      path.join('chrome-headless-shell-win64', 'chrome-headless-shell.exe')
    );
  });
});
