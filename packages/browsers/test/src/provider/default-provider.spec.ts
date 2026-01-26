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
} from '../../../lib/esm/main.js';
import {getServerUrl, setupTestServer} from '../utils.js';

describe('DefaultProvider', () => {
  setupTestServer();

  let downloader: DefaultProvider;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-test'));
    // Use test server as base URL for controlled testing
    downloader = new DefaultProvider(getServerUrl());
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });

  describe('constructor', () => {
    it('should create downloader with default base URL', () => {
      const defaultDownloader = new DefaultProvider();
      assert(defaultDownloader instanceof DefaultProvider);
    });

    it('should create downloader with custom base URL', () => {
      const customBaseUrl = 'https://custom.example.com/';
      const customDownloader = new DefaultProvider(customBaseUrl);
      assert(customDownloader instanceof DefaultProvider);
    });
  });

  describe('BrowserProvider interface compliance', () => {
    it('should implement supports method', () => {
      assert.strictEqual(typeof downloader.supports, 'function');
    });

    it('should implement getDownloadUrl method', () => {
      assert.strictEqual(typeof downloader.getDownloadUrl, 'function');
    });

    it('should implement getExecutablePath method', () => {
      assert.strictEqual(typeof downloader.getExecutablePath, 'function');
    });
  });

  describe('basic functionality', () => {
    it('should handle different browsers', () => {
      // Test with a known build ID that should exist
      const result = downloader.supports({
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      });

      // Chrome for Testing supports all browsers
      assert.strictEqual(result, true);
    });

    it('should handle different platforms', () => {
      const result = downloader.supports({
        browser: Browser.CHROME,
        platform: BrowserPlatform.MAC,
        buildId: '120.0.6099.109',
      });

      // Chrome for Testing supports all platforms
      assert.strictEqual(result, true);
    });

    it('should handle ChromeDriver', () => {
      const result = downloader.supports({
        browser: Browser.CHROMEDRIVER,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      });

      // Chrome for Testing supports all browsers
      assert.strictEqual(result, true);
    });

    it('should return URL for valid build', () => {
      const result = downloader.getDownloadUrl({
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      });

      assert(result instanceof URL);
      assert(result.toString().includes('120.0.6099.109'));
    });
  });
});
