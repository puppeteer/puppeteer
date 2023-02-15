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

import {Browser, BrowserPlatform} from '../../lib/cjs/browsers/browsers.js';
import {fetch, canFetch} from '../../lib/cjs/fetch.js';

/**
 * Tests in this spec use real download URLs and unpack live browser archives
 * so it requires the network access.
 */
describe('fetch', () => {
  let tmpDir = '/tmp/puppeteer-browsers-test';
  const testChromeRevision = '1083080';
  const testFirefoxRevision = '111.0a1';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, {recursive: true});
  });

  it('should check if a revision can be downloaded', async () => {
    assert.ok(
      await canFetch({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        revision: testChromeRevision,
      })
    );
  });

  it('should report if a revision is not downloadable', async () => {
    assert.strictEqual(
      await canFetch({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        revision: 'unknown',
      }),
      false
    );
  });

  it('should download a revision that is a zip archive', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chrome',
      `${BrowserPlatform.LINUX}-${testChromeRevision}`
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);
    let browser = await fetch({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      revision: testChromeRevision,
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
    // Second iteration should be no-op.
    browser = await fetch({
      cacheDir: tmpDir,
      browser: Browser.CHROME,
      platform: BrowserPlatform.LINUX,
      revision: testChromeRevision,
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
  });

  it('should download a revision that is a bzip2 archive', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'firefox',
      `${BrowserPlatform.LINUX}-${testFirefoxRevision}`
    );
    assert.strictEqual(fs.existsSync(expectedOutputPath), false);
    const browser = await fetch({
      cacheDir: tmpDir,
      browser: Browser.FIREFOX,
      platform: BrowserPlatform.LINUX,
      revision: testFirefoxRevision,
    });
    assert.strictEqual(browser.path, expectedOutputPath);
    assert.ok(fs.existsSync(expectedOutputPath));
  });

  // Fetch relies on the `hdiutil` utility on MacOS.
  // The utility is not available on other platforms.
  (os.platform() === 'darwin' ? it : it.skip)(
    'should download a revision that is a dmg archive',
    async function () {
      this.timeout(120000);
      const expectedOutputPath = path.join(
        tmpDir,
        'firefox',
        `${BrowserPlatform.MAC}-${testFirefoxRevision}`
      );
      assert.strictEqual(fs.existsSync(expectedOutputPath), false);
      const browser = await fetch({
        cacheDir: tmpDir,
        browser: Browser.FIREFOX,
        platform: BrowserPlatform.MAC,
        revision: testFirefoxRevision,
      });
      assert.strictEqual(browser.path, expectedOutputPath);
      assert.ok(fs.existsSync(expectedOutputPath));
    }
  );
});
