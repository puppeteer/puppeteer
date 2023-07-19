/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
