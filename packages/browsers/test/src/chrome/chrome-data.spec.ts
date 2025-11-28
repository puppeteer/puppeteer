/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import os from 'node:os';
import path from 'node:path';

import {
  BrowserPlatform,
  ChromeReleaseChannel,
} from '../../../lib/esm/browser-data/browser-data.js';
import {
  resolveDownloadUrl,
  relativeExecutablePath,
  resolveSystemExecutablePaths,
  resolveBuildId,
  compareVersions,
  resolveDefaultUserDataDir,
} from '../../../lib/esm/browser-data/chrome.js';

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
    process.env['ProgramW6432'] = 'C:\\ProgramFiles';
    process.env['ProgramFiles(x86)'] = 'C:\\ProgramFiles (x86)';
    process.env['LOCALAPPDATA'] = 'C:\\LocalAppData';

    try {
      assert.deepStrictEqual(
        resolveSystemExecutablePaths(
          BrowserPlatform.WIN32,
          ChromeReleaseChannel.DEV,
        ),
        [
          'C:\\ProgramFiles\\Google\\Chrome Dev\\Application\\chrome.exe',
          'C:\\ProgramFiles (x86)\\Google\\Chrome Dev\\Application\\chrome.exe',
          'C:\\LocalAppData\\Google\\Chrome Dev\\Application\\chrome.exe',
          'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome Dev\\Application\\chrome.exe',
          'D:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
          'D:\\Program Files (x86)\\Google\\Chrome Dev\\Application\\chrome.exe',
        ],
      );
    } finally {
      delete process.env['PROGRAMFILES'];
      delete process.env['ProgramW6432'];
      delete process.env['ProgramFiles(x86)'];
    }

    assert.deepStrictEqual(
      resolveSystemExecutablePaths(
        BrowserPlatform.MAC,
        ChromeReleaseChannel.BETA,
      ),
      [
        '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
      ],
    );
    assert.deepStrictEqual(
      resolveSystemExecutablePaths(
        BrowserPlatform.LINUX,
        ChromeReleaseChannel.CANARY,
      ),
      ['/opt/google/chrome-canary/chrome'],
    );
  });

  describe('should resolve default user data dir', () => {
    describe('on Windows', () => {
      beforeEach(() => {
        process.env['LOCALAPPDATA'] = path.join(
          'C:',
          'Users',
          'Test',
          'AppData',
          'Local',
        );
      });

      afterEach(() => {
        delete process.env['LOCALAPPDATA'];
      });

      it('should resolve for WIN32 STABLE', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.WIN32,
            ChromeReleaseChannel.STABLE,
          ),
          path.join(
            'C:',
            'Users',
            'Test',
            'AppData',
            'Local',
            'Google',
            'Chrome',
            'User Data',
          ),
        );
      });

      it('should resolve for WIN64 BETA', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.WIN64,
            ChromeReleaseChannel.BETA,
          ),
          path.join(
            'C:',
            'Users',
            'Test',
            'AppData',
            'Local',
            'Google',
            'Chrome Beta',
            'User Data',
          ),
        );
      });

      it('should resolve for WIN32 CANARY', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.WIN32,
            ChromeReleaseChannel.CANARY,
          ),
          path.join(
            'C:',
            'Users',
            'Test',
            'AppData',
            'Local',
            'Google',
            'Chrome SxS',
            'User Data',
          ),
        );
      });

      it('should resolve for WIN64 DEV', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.WIN64,
            ChromeReleaseChannel.DEV,
          ),
          path.join(
            'C:',
            'Users',
            'Test',
            'AppData',
            'Local',
            'Google',
            'Chrome Dev',
            'User Data',
          ),
        );
      });

      it('should resolve to homedir if LOCALAPPDATA is not set', () => {
        const homedir = os.homedir();
        delete process.env['LOCALAPPDATA']; // Ensure it's unset for this specific test
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.WIN32,
            ChromeReleaseChannel.STABLE,
          ),
          path.join(
            homedir,
            'AppData',
            'Local',
            'Google',
            'Chrome',
            'User Data',
          ),
        );
      });
    });

    describe('on macOS', () => {
      it('should resolve for MAC STABLE', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.MAC,
            ChromeReleaseChannel.STABLE,
          ),
          path.join(
            os.homedir(),
            'Library',
            'Application Support',
            'Google',
            'Chrome',
          ),
        );
      });

      it('should resolve for MAC_ARM BETA', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.MAC_ARM,
            ChromeReleaseChannel.BETA,
          ),
          path.join(
            os.homedir(),
            'Library',
            'Application Support',
            'Google',
            'Chrome Beta',
          ),
        );
      });

      it('should resolve for MAC CANARY', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.MAC,
            ChromeReleaseChannel.CANARY,
          ),
          path.join(
            os.homedir(),
            'Library',
            'Application Support',
            'Google',
            'Chrome Canary',
          ),
        );
      });

      it('should resolve for MAC_ARM DEV', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.MAC_ARM,
            ChromeReleaseChannel.DEV,
          ),
          path.join(
            os.homedir(),
            'Library',
            'Application Support',
            'Google',
            'Chrome Dev',
          ),
        );
      });
    });

    describe('on Linux', () => {
      afterEach(() => {
        delete process.env['CHROME_CONFIG_HOME'];
        delete process.env['XDG_CONFIG_HOME'];
      });

      it('should resolve with CHROME_CONFIG_HOME set', () => {
        process.env['CHROME_CONFIG_HOME'] = path.join(
          'home',
          'test',
          '.config',
          'chrome',
        );
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.LINUX,
            ChromeReleaseChannel.STABLE,
          ),
          path.join('home', 'test', '.config', 'chrome', 'google-chrome'),
        );
      });

      it('should resolve with XDG_CONFIG_HOME set', () => {
        process.env['XDG_CONFIG_HOME'] = path.join(
          'home',
          'test',
          '.config',
          'xdg',
        );
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.LINUX_ARM,
            ChromeReleaseChannel.BETA,
          ),
          path.join('home', 'test', '.config', 'xdg', 'google-chrome-beta'),
        );
      });

      it('should resolve to homedir fallback for CANARY', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.LINUX,
            ChromeReleaseChannel.CANARY,
          ),
          path.join(os.homedir(), 'config', 'google-chrome-canary'),
        );
      });

      it('should resolve to homedir fallback for DEV', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.LINUX_ARM,
            ChromeReleaseChannel.DEV,
          ),
          path.join(os.homedir(), 'config', 'google-chrome-unstable'),
        );
      });

      it('should resolve to homedir fallback for STABLE', () => {
        assert.strictEqual(
          resolveDefaultUserDataDir(
            BrowserPlatform.LINUX,
            ChromeReleaseChannel.STABLE,
          ),
          path.join(os.homedir(), 'config', 'google-chrome'),
        );
      });
    });
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
