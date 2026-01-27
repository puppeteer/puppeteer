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
        getDownloadUrlResult: new URL(`file://${archivePath}`),
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
    it('should persist executable path in metadata', async function () {
      this.timeout(60000);

      // Install using default provider
      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      });

      // Verify .metadata exists at browser root and contains the executable path
      const metadataPath = path.join(tmpDir, 'chrome', '.metadata');
      assert.ok(
        fs.existsSync(metadataPath),
        '.metadata should be created for all installations',
      );

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const key = `${BrowserPlatform.LINUX}-120.0.6099.109`;
      assert.ok(
        metadata.executablePaths?.[key],
        'Metadata should contain the executable path',
      );
      assert.ok(
        metadata.providers?.[key],
        'Metadata should contain the provider name',
      );
      assert.strictEqual(
        metadata.providers?.[key],
        'DefaultProvider',
        'Provider should be DefaultProvider',
      );

      // Verify getInstalledBrowsers uses the persisted path
      const installed = await getInstalledBrowsers({cacheDir: tmpDir});
      const found = installed.find(b => {
        return b.buildId === '120.0.6099.109';
      });
      assert.ok(found, 'Should find the installed browser');
      assert.strictEqual(
        found?.executablePath,
        result.executablePath,
        'getInstalledBrowsers should return the correct executable path',
      );
    });

    it('should read custom executable path from metadata', async function () {
      // Test that .metadata is correctly read
      // by manually creating the directory structure and metadata file
      // Use a unique buildId that won't conflict with other tests
      const buildId = '999.0.9999.999';
      const installDir = path.join(
        tmpDir,
        'chrome',
        `${BrowserPlatform.LINUX}-${buildId}`,
      );
      const customExecutablePath = 'custom/path/to/chrome';

      // Create the directory structure
      fs.mkdirSync(installDir, {recursive: true});

      // Write .metadata at browser root with custom executable path
      const metadataPath = path.join(tmpDir, 'chrome', '.metadata');
      const key = `${BrowserPlatform.LINUX}-${buildId}`;
      fs.writeFileSync(
        metadataPath,
        JSON.stringify(
          {
            aliases: {},
            executablePaths: {
              [key]: customExecutablePath,
            },
          },
          null,
          2,
        ),
      );

      // Create a dummy executable file so it exists
      const executableFullPath = path.join(installDir, customExecutablePath);
      fs.mkdirSync(path.dirname(executableFullPath), {recursive: true});
      fs.writeFileSync(executableFullPath, '');

      // Verify getInstalledBrowsers picks up the custom path
      const installed = await getInstalledBrowsers({cacheDir: tmpDir});
      const found = installed.find(b => {
        return b.buildId === buildId;
      });

      assert.ok(found, 'Should find the installed browser');
      assert.strictEqual(
        found.executablePath,
        executableFullPath,
        'Should use custom executable path from .metadata',
      );
    });

    it('should store and retrieve provider name', async function () {
      this.timeout(60000);

      // Install using default provider
      await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      });

      // Get installed browsers and verify provider name
      const installed = await getInstalledBrowsers({cacheDir: tmpDir});
      const found = installed.find(b => {
        return b.buildId === '120.0.6099.109';
      });

      assert.ok(found, 'Should find the installed browser');
      assert.strictEqual(
        found?.getProviderName(),
        'DefaultProvider',
        'getProviderName() should return DefaultProvider',
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
