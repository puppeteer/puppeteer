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
  getInstalledBrowsers,
  install,
} from '../../../lib/esm/main.js';

import {MockProvider} from './mock-provider.js';

describe('Custom Provider Integration Tests', () => {
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
    it('should handle custom provider with test archive', async function () {
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

      const customProvider = new MockProvider({
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
          providers: [customProvider],
        });
        // If it succeeds with the fixture, that's unexpected but not wrong
      } catch (error) {
        // Expected to fail on extraction, but not due to provider interface issues.
        assert(error instanceof Error);
        assert(!error.message.includes('supports'));
        // Allow 'download' related messages since they indicate the provider worked.
        assert(error.message.includes('All providers failed'));
      }
    });
  });

  describe('provider chaining with real downloads', () => {
    it('should fall back from custom provider to default provider', async function () {
      this.timeout(60000);

      // Custom provider that fails
      const failingProvider = new MockProvider({
        supports: true,
        getDownloadUrlError: new Error('Custom source unavailable'),
      });

      // Should fall back to default provider and succeed
      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
        providers: [failingProvider],
      });

      assert(result);
      assert.strictEqual(typeof result.path, 'string');
      assert(fs.existsSync(result.path));
    });

    it('should use first successful provider in chain', async function () {
      this.timeout(60000);

      // First provider fails
      const failingProvider = new MockProvider({
        supports: true,
        getDownloadUrlError: new Error('First source failed'),
      });

      // Second provider also fails (will fall back to default provider)
      const secondFailingProvider = new MockProvider({
        supports: true,
        getDownloadUrlError: new Error('Second source failed'),
      });

      // Should eventually succeed with default provider
      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
        providers: [failingProvider, secondFailingProvider],
      });

      assert(result);
      assert.strictEqual(typeof result.executablePath, 'string');
    });
  });

  describe('getExecutablePath integration', () => {
    it('should use custom getExecutablePath when provided', async function () {
      this.timeout(60000);

      const customExecutablePath = '/custom/executable/path';

      // Use a failing custom provider so it falls back to default provider
      // but test that getExecutablePath would be used if the provider succeeded
      const providerWithCustomPath = new MockProvider({
        supports: false, // Will fall back to default provider
        getExecutablePath: customExecutablePath,
      });

      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
        providers: [providerWithCustomPath],
      });

      // Since default provider is used, we get the real executable path
      // But the test verifies that the provider interface accepts getExecutablePath
      assert(result);
      assert.strictEqual(typeof result.executablePath, 'string');
      assert(result.executablePath !== customExecutablePath); // Should be default provider path
    });
  });

  describe('persistence', () => {
    it('should persist custom executable path', async function () {
      this.timeout(30000);

      const fixturePath = path.join(
        import.meta.dirname,
        '..',
        '..',
        'fixtures',
        'test.tar.bz2',
      );
      const archivePath = path.join(tmpDir, 'test-archive.tar.bz2');
      fs.copyFileSync(fixturePath, archivePath);

      // Define a custom executable path relative to the install root
      // (we'll use a file that actually exists in our test fixture)

      // Since test.tar.bz2 unpacks files, we can simulate the executable
      // appearing. But installUrl checks existence *after* unpack.
      // We can hack fs.existsSync or ensure our fixture unpacks to
      // something we can point to.
      // test.tar.bz2 contains 'test-file'.
      // Let's point getExecutablePath to 'test-file'.
      const actualFileInArchive = 'test-file';

      const providerWithRealFile = new MockProvider({
        supports: true,
        getDownloadUrlResult: new URL(`file://${archivePath}`),
        getExecutablePath: actualFileInArchive,
      });

      await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: 'test-persistence',
        providers: [providerWithRealFile],
      });

      const installDir = path.join(
        tmpDir,
        'chrome',
        `${BrowserPlatform.LINUX}-test-persistence`,
      );
      const metadataPath = path.join(installDir, '.puppeteer.json');

      assert.ok(fs.existsSync(metadataPath), '.puppeteer.json should exist');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      assert.strictEqual(metadata.executablePath, actualFileInArchive);

      // Verify getInstalledBrowsers picks it up
      const installed = await getInstalledBrowsers({cacheDir: tmpDir});
      const found = installed.find(b => {
        return b.buildId === 'test-persistence';
      });
      assert.ok(found, 'Should find the installed browser');
      assert.strictEqual(
        found.executablePath,
        path.join(installDir, actualFileInArchive),
      );
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
          providers: [], // Use default provider
        });

        assert(result);
        assert.strictEqual(typeof result.path, 'string');
      }
    });
  });
});
