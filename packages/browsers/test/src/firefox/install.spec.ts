/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {install, Browser, BrowserPlatform} from '../../../lib/cjs/main.js';
import {setupTestServer, getServerUrl, clearCache} from '../utils.js';
import {testFirefoxBuildId} from '../versions.js';

/**
 * Tests in this spec use real download URLs and unpack live browser archives
 * so it requires the network access.
 */
describe('Firefox install', () => {
  setupTestServer();

  let tmpDir = '/tmp/puppeteer-browsers-test';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(() => {
    clearCache(tmpDir);
  });

  it('should download a buildId that is a bzip2 archive', async function () {
    this.timeout(90000);
    const expectedOutputPath = path.join(
      tmpDir,
      'firefox',
      `${BrowserPlatform.LINUX}-${testFirefoxBuildId}`
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);
    const browser = await install({
      cacheDir: tmpDir,
      browser: Browser.FIREFOX,
      platform: BrowserPlatform.LINUX,
      buildId: testFirefoxBuildId,
      baseUrl: getServerUrl(),
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
  });

  // install relies on the `hdiutil` utility on MacOS.
  // The utility is not available on other platforms.
  (os.platform() === 'darwin' ? it : it.skip)(
    'should download a buildId that is a dmg archive',
    async function () {
      this.timeout(180000);
      const expectedOutputPath = path.join(
        tmpDir,
        'firefox',
        `${BrowserPlatform.MAC}-${testFirefoxBuildId}`
      );
      assert.strictEqual(fs.existsSync(expectedOutputPath), false);
      const browser = await install({
        cacheDir: tmpDir,
        browser: Browser.FIREFOX,
        platform: BrowserPlatform.MAC,
        buildId: testFirefoxBuildId,
        baseUrl: getServerUrl(),
      });
      assert.strictEqual(browser.path, expectedOutputPath);
      assert.ok(fs.existsSync(expectedOutputPath));
    }
  );
});
