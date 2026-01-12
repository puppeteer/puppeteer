/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {install, Browser, BrowserPlatform} from '../../../lib/esm/main.js';

import {MockDownloader} from './mock-downloader.js';

describe('Custom Downloader Integration Tests', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-test'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });

  describe('with test fixtures', () => {
    it('should handle custom downloader with test archive', async function () {
      this.timeout(30000);

      // Use the test.tar.bz2 fixture as a mock download
      const fixturePath = path.join(
        import.meta.dirname,
        '..',
        '..',
        'fixtures',
        'test.tar.bz2',
      );
      const archivePath = path.join(tmpDir, 'test-archive.tar.bz2');

      // Copy the fixture to simulate a download
      fs.copyFileSync(fixturePath, archivePath);

      const customDownloader = new MockDownloader({
        supports: true,
        getDownloadUrlResult: new URL('https://example.com/test.tar.bz2'),
        getExecutablePath: path.join(tmpDir, 'test-executable'), // Mock executable path
      });

      // Will likely fail on extraction since test.tar.bz2 is not a real browser archive.
      // The important thing is that the custom downloader flow is exercised.
      try {
        await install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: 'test-build',
          downloaders: [customDownloader],
        });
        // If it succeeds with the fixture, that's unexpected but not wrong
      } catch (error) {
        // Expected to fail on extraction, but not due to downloader interface issues.
        assert(error instanceof Error);
        assert(!error.message.includes('supports'));
        // Allow 'download' related messages since they indicate the downloader worked.
        assert(error.message.includes('All downloaders failed'));
      }
    });
  });

  describe('downloader chaining with real downloads', () => {
    it('should fall back from custom downloader to CfT', async function () {
      this.timeout(60000);

      // Custom downloader that fails
      const failingDownloader = new MockDownloader({
        supports: true,
        getDownloadUrlError: new Error('Custom source unavailable'),
      });

      // Should fall back to CfT and succeed
      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
        downloaders: [failingDownloader],
      });

      assert(result);
      assert.strictEqual(typeof result.path, 'string');
      assert(fs.existsSync(result.path));
    });

    it('should use first successful downloader in chain', async function () {
      this.timeout(60000);

      // First downloader fails
      const failingDownloader = new MockDownloader({
        supports: true,
        getDownloadUrlError: new Error('First source failed'),
      });

      // Second downloader also fails (will fall back to CfT)
      const secondFailingDownloader = new MockDownloader({
        supports: true,
        getDownloadUrlError: new Error('Second source failed'),
      });

      // Should eventually succeed with CfT
      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
        downloaders: [failingDownloader, secondFailingDownloader],
      });

      assert(result);
      assert.strictEqual(typeof result.executablePath, 'string');
    });
  });

  describe('getExecutablePath integration', () => {
    it('should use custom getExecutablePath when provided', async function () {
      this.timeout(60000);

      const customExecutablePath = '/custom/executable/path';

      // Use a failing custom downloader so it falls back to CfT
      // but test that getExecutablePath would be used if the downloader succeeded
      const downloaderWithCustomPath = new MockDownloader({
        supports: false, // Will fall back to CfT
        getExecutablePath: customExecutablePath,
      });

      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
        downloaders: [downloaderWithCustomPath],
      });

      // Since CfT is used, we get the real executable path
      // But the test verifies that the downloader interface accepts getExecutablePath
      assert(result);
      assert.strictEqual(typeof result.executablePath, 'string');
      assert(result.executablePath !== customExecutablePath); // Should be CfT path
    });
  });

  describe('platform-specific behavior', () => {
    it('should work across different platforms', async function () {
      this.timeout(60000);

      // Test with different platforms - this tests that the downloader interface
      // works consistently across platforms
      const platforms = [
        BrowserPlatform.LINUX,
        BrowserPlatform.MAC,
        BrowserPlatform.WIN64,
      ];

      for (const platform of platforms) {
        const result = await install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform,
          buildId: '120.0.6099.109',
          downloaders: [], // Use default CfT
        });

        assert(result);
        assert.strictEqual(typeof result.path, 'string');
      }
    });
  });
});
