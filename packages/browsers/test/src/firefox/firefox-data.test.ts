/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {BrowserPlatform} from '../../../lib/browser-data/browser-data.js';
import {
  compareVersions,
  createProfile,
  relativeExecutablePath,
  resolveDownloadUrl,
} from '../../../lib/browser-data/firefox.js';

describe('Firefox', () => {
  it('should resolve download URLs for Nightly', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.linux-x86_64.tar.bz2',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '135.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-135.0a1.en-US.linux-x86_64.tar.xz',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, '136.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-136.0a1.en-US.linux-x86_64.tar.xz',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.mac.dmg',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.mac.dmg',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.win32.zip',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, '111.0a1'),
      'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-111.0a1.en-US.win64.zip',
    );
  });

  it('should resolve download URLs for beta', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, 'beta_115.0b8'),
      'https://archive.mozilla.org/pub/firefox/releases/115.0b8/linux-x86_64/en-US/firefox-115.0b8.tar.bz2',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, 'beta_115.0b8'),
      'https://archive.mozilla.org/pub/firefox/releases/115.0b8/mac/en-US/Firefox 115.0b8.dmg',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, 'beta_115.0b8'),
      'https://archive.mozilla.org/pub/firefox/releases/115.0b8/mac/en-US/Firefox 115.0b8.dmg',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, 'beta_115.0b8'),
      'https://archive.mozilla.org/pub/firefox/releases/115.0b8/win32/en-US/Firefox Setup 115.0b8.exe',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, 'beta_115.0b8'),
      'https://archive.mozilla.org/pub/firefox/releases/115.0b8/win64/en-US/Firefox Setup 115.0b8.exe',
    );
  });

  it('should resolve download URLs for stable', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, 'stable_111.0.1'),
      'https://archive.mozilla.org/pub/firefox/releases/111.0.1/linux-x86_64/en-US/firefox-111.0.1.tar.bz2',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, 'stable_111.0.1'),
      'https://archive.mozilla.org/pub/firefox/releases/111.0.1/mac/en-US/Firefox 111.0.1.dmg',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, 'stable_111.0.1'),
      'https://archive.mozilla.org/pub/firefox/releases/111.0.1/mac/en-US/Firefox 111.0.1.dmg',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, 'stable_111.0.1'),
      'https://archive.mozilla.org/pub/firefox/releases/111.0.1/win32/en-US/Firefox Setup 111.0.1.exe',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, 'stable_111.0.1'),
      'https://archive.mozilla.org/pub/firefox/releases/111.0.1/win64/en-US/Firefox Setup 111.0.1.exe',
    );
  });

  it('should resolve download URLs for devedition', () => {
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.LINUX, 'devedition_115.0b8'),
      'https://archive.mozilla.org/pub/devedition/releases/115.0b8/linux-x86_64/en-US/firefox-115.0b8.tar.bz2',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC, 'devedition_115.0b8'),
      'https://archive.mozilla.org/pub/devedition/releases/115.0b8/mac/en-US/Firefox 115.0b8.dmg',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.MAC_ARM, 'devedition_115.0b8'),
      'https://archive.mozilla.org/pub/devedition/releases/115.0b8/mac/en-US/Firefox 115.0b8.dmg',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN32, 'devedition_115.0b8'),
      'https://archive.mozilla.org/pub/devedition/releases/115.0b8/win32/en-US/Firefox Setup 115.0b8.exe',
    );
    assert.strictEqual(
      resolveDownloadUrl(BrowserPlatform.WIN64, 'devedition_115.0b8'),
      'https://archive.mozilla.org/pub/devedition/releases/115.0b8/win64/en-US/Firefox Setup 115.0b8.exe',
    );
  });

  it('should resolve executable paths', () => {
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.LINUX, '111.0a1'),
      path.join('firefox', 'firefox'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC, '111.0a1'),
      path.join('Firefox Nightly.app', 'Contents', 'MacOS', 'firefox'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC_ARM, '111.0a1'),
      path.join('Firefox Nightly.app', 'Contents', 'MacOS', 'firefox'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.MAC_ARM, 'stable_111.0.1'),
      path.join('Firefox.app', 'Contents', 'MacOS', 'firefox'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN32, '111.0a1'),
      path.join('firefox', 'firefox.exe'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN64, '111.0a1'),
      path.join('firefox', 'firefox.exe'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN32, 'beta_115.0b8'),
      path.join('core', 'firefox.exe'),
    );
    assert.strictEqual(
      relativeExecutablePath(BrowserPlatform.WIN64, 'beta_115.0b8'),
      path.join('core', 'firefox.exe'),
    );
  });

  describe('profile', () => {
    let tmpDir = '/tmp/puppeteer-browsers-test';

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'puppeteer-browsers-test'),
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
        text.includes(`user_pref("toolkit.startup.max_resumed_crashes", -1);`),
      ); // default preference.
      assert.ok(text.includes(`user_pref("test", 1);`)); // custom preference.
    });
  });

  it('should compare versions', async () => {
    assert.ok(compareVersions('111.0a1', '110.0a1') >= 1);
    assert.ok(compareVersions('110.0a1', '111.0a1') <= -1);
    assert.ok(compareVersions('111.0a1', '111.0a1') === 0);
  });

  it('should compare version parts numerically', () => {
    assert.ok(compareVersions('139.0', '140.0') < 0);
    assert.ok(compareVersions('9.0', '10.0') < 0);
    assert.ok(compareVersions('138.0', '138.0.1') < 0);
    assert.ok(compareVersions('138.0.1', '138.0') > 0);
    assert.ok(compareVersions('138.0', '138.0.0') === 0);
  });

  it('should order nightly before beta before release', () => {
    assert.ok(compareVersions('139.0a1', '140.0') < 0);
    assert.ok(compareVersions('139.0a1', '139.0b1') < 0);
    assert.ok(compareVersions('139.0b1', '139.0') < 0);
    assert.ok(compareVersions('140.0a1', '140.0a2') < 0);
    assert.ok(compareVersions('140.0b2', '140.0b10') < 0);
    assert.ok(compareVersions('128.5.0esr', '128.5.0') === 0);
  });

  it('should sort versions to find the latest alias', () => {
    assert.deepStrictEqual(
      ['140.0', '139.0a1', '138.0.1', '9.0', '138.0', '140.0b2', '139.0'].sort(
        compareVersions,
      ),
      ['9.0', '138.0', '138.0.1', '139.0a1', '139.0', '140.0b2', '140.0'],
    );
  });

  it('should compare the version of channel prefixed build ids', () => {
    assert.deepStrictEqual(
      [
        'stable_139.0',
        'nightly_140.0a1',
        'devedition_140.0b10',
        'esr_128.5.0esr',
        'beta_140.0b3',
      ].sort(compareVersions),
      [
        'esr_128.5.0esr',
        'stable_139.0',
        'nightly_140.0a1',
        'beta_140.0b3',
        'devedition_140.0b10',
      ],
    );
  });

  it('should throw on invalid versions', () => {
    assert.throws(() => {
      compareVersions('unknown', '1.0');
    }, /Version unknown is not a valid Firefox version/);
    assert.throws(() => {
      compareVersions('1.0', 'unknown');
    }, /Version unknown is not a valid Firefox version/);
    assert.throws(() => {
      compareVersions('', '1.0');
    });
    assert.throws(() => {
      compareVersions('stable_', '1.0');
    });
    assert.throws(() => {
      compareVersions('139.0c1', '1.0');
    });
  });

  it('should ignore surrounding whitespace', () => {
    assert.ok(compareVersions(' 139.0 ', '139.0') === 0);
    assert.ok(compareVersions('139.0a1\n', '139.0') < 0);
    assert.ok(compareVersions(' stable_139.0', 'stable_140.0 ') < 0);
  });
});
