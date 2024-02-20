/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {BrowserPlatform} from '../../../lib/cjs/browser-data/browser-data.js';
import {
  compareVersions,
  createProfile,
  relativeExecutablePath,
  resolveDownloadUrl,
} from '../../../lib/cjs/browser-data/firefox.js';

describe('Firefox', () => {
  it('should resolve download URLs', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.linux-x86_64.tar.bz2'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.mac.dmg'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.mac.dmg'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.win32.zip'
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.win64.zip'
    );
  });

  it('should resolve executable paths', () => {
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.LINUX, '111.0a1'),
      path.join('firefox', 'firefox')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC, '111.0a1'),
      path.join('Firefox Nightly.app', 'Contents', 'MacOS', 'firefox')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC_ARM, '111.0a1'),
      path.join('Firefox Nightly.app', 'Contents', 'MacOS', 'firefox')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN32, '111.0a1'),
      path.join('firefox', 'firefox.exe')
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN64, '111.0a1'),
      path.join('firefox', 'firefox.exe')
    );
  });

  describe('profile', () => {
    let tmpDir = '/tmp/puppeteer-browsers-test';

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'puppeteer-browsers-test')
      );
    });

    afterEach(() => {
      fs.rmSync(tmpDir, {
        force: true,
        recursive: true,
        maxRetries: 5,
      });
    });

    it('should create a profile', async () => {
      await createProfile({
        preferences: {
          test: 1,
        },
        path: tmpDir,
      });
      const text = fs.readFileSync(path.join(tmpDir, 'user.js'), 'utf-8');
      assert.ok(
        text.includes(`user_pref("toolkit.startup.max_resumed_crashes", -1);`)
      ); // default preference.
      assert.ok(text.includes(`user_pref("test", 1);`)); // custom preference.
    });
  });

  it('should compare versions', async () => {
    assert.ok(compareVersions('111.0a1', '110.0a1') >= 1);
    assert.ok(compareVersions('110.0a1', '111.0a1') <= -1);
    assert.ok(compareVersions('111.0a1', '111.0a1') === 0);
  });
});
