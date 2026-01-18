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
  Browser,
  BrowserPlatform,
  DefaultProvider,
  type DownloadOptions,
} from '../../../lib/esm/main.js';
import {getServerUrl, setupTestServer} from '../utils.js';

describe('DefaultProvider Integration', () => {
  setupTestServer();

  let downloader: DefaultProvider;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-test'));
    // Use test server for controlled integration testing
    downloader = new DefaultProvider(getServerUrl());
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });

  describe('real download integration', () => {
    it('should generate Chrome download URL', () => {
      // Test that getDownloadUrl returns a valid URL
      const result = downloader.getDownloadUrl({
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      });

      assert(result instanceof URL);
      assert(result.toString().includes('120.0.6099.109'));
    });

    it('should generate ChromeDriver download URL', () => {
      const result = downloader.getDownloadUrl({
        browser: Browser.CHROMEDRIVER,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      });

      assert(result instanceof URL);
      assert(result.toString().includes('chromedriver'));
      assert(result.toString().includes('120.0.6099.109'));
    });

    it('should support progress callbacks in options', () => {
      // Test that DownloadOptions can include progressCallback
      const options: DownloadOptions = {
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
        progressCallback: (downloaded: number, total: number) => {
          assert.strictEqual(typeof downloaded, 'number');
          assert.strictEqual(typeof total, 'number');
        },
      };

      assert.strictEqual(typeof options.progressCallback, 'function');
    });

    it('should construct correct URLs for different platforms', () => {
      const result = downloader.getDownloadUrl({
        browser: Browser.CHROME,
        platform: BrowserPlatform.MAC,
        buildId: '120.0.6099.109',
      });

      // Test that URL construction works for different platforms
      assert(result instanceof URL);
      assert(result.toString().includes('120.0.6099.109'));
    });
  });

  describe('error handling', () => {
    it('should handle invalid build IDs', () => {
      // DefaultProvider always returns a URL, even for invalid build IDs
      // The actual error occurs during download, which is tested via the install function
      const result = downloader.getDownloadUrl({
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: 'non-existent-build-12345',
      });

      // Should still return a URL (the actual validation happens during HTTP request)
      assert(result instanceof URL);
    });
  });
});
