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
  uninstall,
  Browser,
  BrowserPlatform,
  Cache,
} from '../../lib/cjs/main.js';

import {getServerUrl, setupTestServer} from './utils.js';
import {testChromeBuildId} from './versions.js';

describe('common', () => {
  setupTestServer();

  let tmpDir = '/tmp/puppeteer-browsers-test';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(() => {
    new Cache(tmpDir).clear();
  });

  it('should uninstall a browser', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);
    const browser = await install({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: testChromeBuildId,
      baseUrl: getServerUrl(),
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));

    await uninstall({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      buildId: testChromeBuildId,
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);
  });
});
