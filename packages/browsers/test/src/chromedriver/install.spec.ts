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
  install,
  canDownload,
  Browser,
  BrowserPlatform,
  Cache,
} from '../../../lib/cjs/main.js';
import {getServerUrl, setupTestServer} from '../utils.js';
import {testChromeDriverBuildId} from '../versions.js';

/**
 * Tests in this spec use real download URLs and unpack live browser archives
 * so it requires the network access.
 */
describe('ChromeDriver install', () => {
  setupTestServer();

  let tmpDir = '/tmp/puppeteer-browsers-test';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(() => {
    new Cache(tmpDir).clear();
  });

  it('should check if a buildId can be downloaded', async () => {
    assert.ok(
      await canDownload({
        cacheDir: tmpDir,
        browser: Browser.CHROMEDRIVER,
        platform: BrowserPlatform.LINUX,
        buildId: testChromeDriverBuildId,
        baseUrl: getServerUrl(),
      })
    );
  });

  it('should report if a buildId is not downloadable', async () => {
    assert.strictEqual(
      await canDownload({
        cacheDir: tmpDir,
        browser: Browser.CHROMEDRIVER,
        platform: BrowserPlatform.LINUX,
        buildId: 'unknown',
        baseUrl: getServerUrl(),
      }),
      false
    );
  });

  it('should download and unpack the binary', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chromedriver',
      `${BrowserPlatform.LINUX}-${testChromeDriverBuildId}`
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);
    let browser = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROMEDRIVER,
      platform: BrowserPlatform.LINUX,
      buildId: testChromeDriverBuildId,
      baseUrl: getServerUrl(),
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
    // Second iteration should be no-op.
    browser = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROMEDRIVER,
      platform: BrowserPlatform.LINUX,
      buildId: testChromeDriverBuildId,
      baseUrl: getServerUrl(),
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
    assert.ok(fs.existsSync(browser.executablePath));
  });
});
