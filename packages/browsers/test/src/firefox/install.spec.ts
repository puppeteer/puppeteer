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
