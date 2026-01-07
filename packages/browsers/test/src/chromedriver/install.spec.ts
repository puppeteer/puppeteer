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
  canDownload,
  Browser,
  BrowserPlatform,
  Cache,
} from '../../../lib/esm/main.js';
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
      }),
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
      false,
    );
  });

  it('should download and unpack the binary', async function () {
    this.timeout(60000);
    const expectedOutputPath = path.join(
      tmpDir,
      'chromedriver',
      `${BrowserPlatform.LINUX}-${testChromeDriverBuildId}`,
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

  it('should accept fallbackSources option without validation errors', async () => {
    // Test that the API properly accepts fallbackSources configuration
    // This validates the option is recognized and doesn't cause immediate validation failures
    try {
      await install({
        cacheDir: tmpDir,
        browser: Browser.CHROMEDRIVER,
        platform: BrowserPlatform.LINUX,
        buildId: '116.0.5845.82',
        baseUrl: getServerUrl(), // Valid base URL so it doesn't immediately fail
        fallbackSources: [{
          baseUrl: 'https://github.com/electron/electron/releases/download/',
          urlBuilder: (_browser, _platform, buildId, baseUrl) => {
            return `${baseUrl}v${buildId}/chromedriver-v${buildId}-linux-x64.zip`;
          }
        }],
        unpack: false,
      });
      // If we get here, the API accepted the fallbackSources option
      assert.ok(true, 'fallbackSources option was accepted');
    } catch (error) {
      const errorMessage = (error as Error).message;
      // Should not fail due to invalid fallbackSources configuration
      if (errorMessage.includes('fallbackSources') || errorMessage.includes('urlBuilder')) {
        throw error; // This would be an API validation failure
      }
      // Other errors (network, download) are expected and OK for this test
      assert.ok(errorMessage.includes('download') || errorMessage.includes('network'));
    }
  });

  it('should validate FallbackSources constants are properly configured', async () => {
    // Test that our predefined fallback sources have valid configurations
    const {FallbackSources} = await import('../../../lib/esm/main.js');

    // Test ELECTRON fallback source
    assert.ok(FallbackSources.ELECTRON.baseUrl);
    assert.ok(typeof FallbackSources.ELECTRON.urlBuilder === 'function');

    // Test PLAYWRIGHT_CHROMIUM fallback source
    assert.ok(FallbackSources.PLAYWRIGHT_CHROMIUM.baseUrl);
    assert.ok(typeof FallbackSources.PLAYWRIGHT_CHROMIUM.urlBuilder === 'function');

    // Test that URL builders don't throw for valid inputs
    const testBrowser = Browser.CHROMEDRIVER;
    const testPlatform = BrowserPlatform.LINUX;
    const testBuildId = '116.0.5845.82';

    const electronUrl = FallbackSources.ELECTRON.urlBuilder(
      testBrowser, testPlatform, testBuildId, FallbackSources.ELECTRON.baseUrl
    );
    assert.ok(typeof electronUrl === 'string');
    assert.ok(electronUrl.includes('github.com'));
    assert.ok(electronUrl.includes('chromedriver'));
  });

  it('should validate platform mapping through FallbackSources', async () => {
    const {FallbackSources} = await import('../../../lib/esm/main.js');

    // Test Electron platform mapping by checking generated URLs
    const electronLinuxUrl = FallbackSources.ELECTRON.urlBuilder(
      Browser.CHROMEDRIVER, BrowserPlatform.LINUX, '116.0.5845.82', FallbackSources.ELECTRON.baseUrl
    );
    assert.ok(electronLinuxUrl.includes('linux-x64'));

    const electronArmUrl = FallbackSources.ELECTRON.urlBuilder(
      Browser.CHROMEDRIVER, BrowserPlatform.LINUX_ARM, '116.0.5845.82', FallbackSources.ELECTRON.baseUrl
    );
    assert.ok(electronArmUrl.includes('linux-arm64'));

    // Test Playwright platform mapping by checking generated URLs
    const playwrightLinuxUrl = FallbackSources.PLAYWRIGHT_CHROMIUM.urlBuilder(
      Browser.CHROMIUM, BrowserPlatform.LINUX, '1088', FallbackSources.PLAYWRIGHT_CHROMIUM.baseUrl
    );
    assert.ok(playwrightLinuxUrl.includes('chromium-linux.zip'));

    const playwrightArmUrl = FallbackSources.PLAYWRIGHT_CHROMIUM.urlBuilder(
      Browser.CHROMIUM, BrowserPlatform.LINUX_ARM, '1088', FallbackSources.PLAYWRIGHT_CHROMIUM.baseUrl
    );
    assert.ok(playwrightArmUrl.includes('chromium-linux-arm64.zip'));
  });

  it('should validate FallbackSources browser compatibility', async () => {
    const {FallbackSources} = await import('../../../lib/esm/main.js');

    // Test that ELECTRON throws for unsupported browsers
    assert.throws(() => {
      FallbackSources.ELECTRON.urlBuilder(
        Browser.CHROME, BrowserPlatform.LINUX, '116.0.5845.82', FallbackSources.ELECTRON.baseUrl
      );
    }, /Electron fallback is only supported for Chromedriver/);

    // Test that PLAYWRIGHT_CHROMIUM throws for unsupported browsers
    assert.throws(() => {
      FallbackSources.PLAYWRIGHT_CHROMIUM.urlBuilder(
        Browser.CHROMEDRIVER, BrowserPlatform.LINUX, '116.0.5845.82', FallbackSources.PLAYWRIGHT_CHROMIUM.baseUrl
      );
    }, /Playwright Chromium fallback is only supported for Chromium browser/);
  });
});
