/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  install,
  uninstall,
  Browser,
  BrowserPlatform,
  Cache,
} from '../../lib/main.js';

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
      `${BrowserPlatform.LINUX}-${testChromeBuildId}`,
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

  it('should throw on path traversal in buildId and not delete outside directories', async function () {
    const siblingDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'puppeteer-browsers-sibling'),
    );
    const keepFile = path.join(siblingDir, 'keep');
    fs.mkdirSync(keepFile, {recursive: true});

    try {
      await assert.rejects(
        uninstall({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: `../../../../${path.relative('/', siblingDir)}`,
        }),
        /Invalid buildId/,
      );
      assert.strictEqual(fs.existsSync(keepFile), true);
    } finally {
      fs.rmSync(siblingDir, {recursive: true, force: true});
    }
  });
});
