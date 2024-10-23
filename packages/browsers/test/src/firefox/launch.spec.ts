/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  computeExecutablePath,
  launch,
  install,
  Browser,
  BrowserPlatform,
  createProfile,
} from '../../../lib/cjs/main.js';
import {setupTestServer, getServerUrl, clearCache} from '../utils.js';
import {testFirefoxBuildId} from '../versions.js';

describe('Firefox', () => {
  it('should compute executable path for Firefox', () => {
    assert.strictEqual(
      computeExecutablePath({
        browser: Browser.FIREFOX,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        cacheDir: '.cache',
      }),
      path.join('.cache', 'firefox', 'linux-123', 'firefox', 'firefox'),
    );
  });

  describe('launcher', function () {
    this.timeout(120000);

    setupTestServer();

    let tmpDir = '/tmp/puppeteer-browsers-test';

    beforeEach(async () => {
      tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'puppeteer-browsers-test'),
      );
      await install({
        cacheDir: tmpDir,
        browser: Browser.FIREFOX,
        buildId: testFirefoxBuildId,
        baseUrl: getServerUrl(),
      });
    });

    afterEach(() => {
      clearCache(tmpDir);
    });

    it('should launch a Firefox browser', async () => {
      const userDataDir = path.join(tmpDir, 'profile');
      function getArgs(): string[] {
        const firefoxArguments = [];
        switch (os.platform()) {
          case 'darwin':
            firefoxArguments.push('--foreground');
            break;
          case 'win32':
            firefoxArguments.push('--wait-for-browser');
            break;
        }
        firefoxArguments.push('--profile', userDataDir);
        firefoxArguments.push('--headless');
        firefoxArguments.push('about:blank');
        return firefoxArguments;
      }
      await createProfile(Browser.FIREFOX, {
        path: userDataDir,
        preferences: {},
      });
      const executablePath = computeExecutablePath({
        cacheDir: tmpDir,
        browser: Browser.FIREFOX,
        buildId: testFirefoxBuildId,
      });
      const process = launch({
        executablePath,
        args: getArgs(),
      });
      await process.close();
    });
  });
});
