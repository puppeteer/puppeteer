/**
 * @license
 * Copyright 2026 Google Inc.
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
  type BrowserProvider,
  type DownloadOptions,
} from '../../lib/main.js';

import {getServerUrl, setupTestServer} from './utils.js';
import {testChromeBuildId} from './versions.js';
import {createTestZipBuffer, testZipEntries} from './zip.js';

/**
 * Simple inline mock provider for testing.
 * Allows configurable behavior for testing different provider scenarios.
 */
class MockProvider implements BrowserProvider {
  #supports: boolean;
  #getDownloadUrlResult: URL | null;
  #getDownloadUrlError: Error | null;
  #getExecutablePath: string;
  #name: string;

  constructor(
    options: {
      supports?: boolean;
      getDownloadUrlResult?: URL | null;
      getDownloadUrlError?: Error | null;
      getExecutablePath?: string;
      name?: string;
    } = {},
  ) {
    this.#supports = options.supports ?? true;
    this.#getDownloadUrlResult = options.getDownloadUrlResult ?? null;
    this.#getDownloadUrlError = options.getDownloadUrlError ?? null;
    this.#getExecutablePath =
      options.getExecutablePath ?? '/mock/executable/path';
    this.#name = options.name ?? 'MockProvider';
  }

  supports(_options: DownloadOptions): boolean {
    return this.#supports;
  }

  getDownloadUrl(_options: DownloadOptions): URL | null {
    if (this.#getDownloadUrlError) {
      throw this.#getDownloadUrlError;
    }
    return this.#getDownloadUrlResult;
  }

  getExecutablePath(_options: DownloadOptions): string {
    return this.#getExecutablePath;
  }

  getName(): string {
    return this.#name;
  }
}

describe('Install with providers', () => {
  const serverState = setupTestServer();

  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-test'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });

  describe('provider selection', () => {
    it('should skip unsupported providers and use the default provider', async function () {
      this.timeout(60000);

      const calledMethods = new Set<string>();
      const unsupportedProvider: BrowserProvider = {
        supports() {
          calledMethods.add('supports');
          return false;
        },
        getDownloadUrl() {
          calledMethods.add('getDownloadUrl');
          return null;
        },
        getExecutablePath() {
          calledMethods.add('getExecutablePath');
          return path.join('unused', 'chrome');
        },
        getName() {
          return 'UnsupportedProvider';
        },
      };

      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: testChromeBuildId,
        providers: [unsupportedProvider],
        baseUrl: getServerUrl(),
      });

      assert.deepStrictEqual(calledMethods, new Set(['supports']));
      assert.strictEqual(
        result.executablePath,
        path.join(
          tmpDir,
          'chrome',
          `${BrowserPlatform.LINUX}-${testChromeBuildId}`,
          'chrome-linux64',
          'chrome',
        ),
      );
      assert.ok(fs.statSync(result.executablePath).isFile());
    });

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
        buildId: testChromeBuildId,
        providers: [failingProvider],
        baseUrl: getServerUrl(),
      });

      assert(result);
      assert.strictEqual(typeof result.path, 'string');
      assert(fs.existsSync(result.path));
    });

    it('should use first successful provider in chain', async function () {
      this.timeout(60000);

      const buildId = '123';
      const customExecutablePath = path.join('browser', 'chrome');
      const archive = createTestZipBuffer(testZipEntries);
      serverState.server.setRoute(
        '/provider-chain.zip',
        (_request, response) => {
          response.writeHead(200, {'content-length': archive.length});
          response.end(archive);
        },
      );
      const downloadUrl = new URL(`${getServerUrl()}/provider-chain.zip`);

      // First provider fails
      const failingProvider = new MockProvider({
        name: 'FailingProvider',
        supports: true,
        getDownloadUrlError: new Error('First source failed'),
      });

      const successfulProvider = new MockProvider({
        name: 'SuccessfulProvider',
        getDownloadUrlResult: downloadUrl,
        getExecutablePath: customExecutablePath,
      });
      const laterProvider = new MockProvider({
        name: 'LaterProvider',
        getDownloadUrlResult: downloadUrl,
        getExecutablePath: customExecutablePath,
      });
      const providers = [failingProvider, successfulProvider, laterProvider];
      const visitedProviders: string[] = [];
      for (const provider of providers) {
        const supports = provider.supports.bind(provider);
        provider.supports = options => {
          visitedProviders.push(provider.getName());
          return supports(options);
        };
      }

      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId,
        providers,
        baseUrl: getServerUrl(),
      });

      assert.deepStrictEqual(visitedProviders, [
        'FailingProvider',
        'SuccessfulProvider',
      ]);
      assert.strictEqual(
        result.executablePath,
        path.join(
          tmpDir,
          'chrome',
          `${BrowserPlatform.LINUX}-${buildId}`,
          customExecutablePath,
        ),
      );
      assert.ok(fs.statSync(result.executablePath).isFile());
    });

    it('should include provider names in error message when all providers fail', async function () {
      this.timeout(60000);

      // All providers fail
      const provider1 = new MockProvider({
        name: 'FirstProvider',
        supports: true,
        getDownloadUrlError: new Error('Network error'),
      });
      const provider2 = new MockProvider({
        name: 'SecondProvider',
        supports: true,
        getDownloadUrlError: new Error('Server error'),
      });

      try {
        await install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: 'non-existent-build',
          providers: [provider1, provider2],
          baseUrl: getServerUrl(),
        });
        assert.fail('Expected install to fail');
      } catch (error) {
        assert(error instanceof Error);
        assert(error.message.includes('All providers failed'));
        // Verify each provider is paired with its error.
        assert(error.message.includes('FirstProvider: Network error'));
        assert(error.message.includes('SecondProvider: Server error'));
      }
    });
  });

  describe('persistence', () => {
    it('should persist executable path in metadata for custom providers', async function () {
      this.timeout(60000);

      const buildId = '123';
      const customExecutablePath = path.join('browser', 'chrome');
      const expectedExecutablePath = path.join(
        tmpDir,
        'chrome',
        `${BrowserPlatform.LINUX}-${buildId}`,
        customExecutablePath,
      );
      const archive = createTestZipBuffer(testZipEntries);
      serverState.server.setRoute(
        '/custom-provider.zip',
        (_request, response) => {
          response.writeHead(200, {'content-length': archive.length});
          response.end(archive);
        },
      );

      // The fixture uses a genuinely different layout from the default provider.
      const customProvider = new MockProvider({
        supports: true,
        getDownloadUrlResult: new URL(`${getServerUrl()}/custom-provider.zip`),
        getExecutablePath: customExecutablePath,
      });

      // Install using custom provider
      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId,
        providers: [customProvider],
        baseUrl: getServerUrl(),
      });

      assert.strictEqual(result.executablePath, expectedExecutablePath);
      assert.strictEqual(
        fs.readFileSync(expectedExecutablePath, 'utf8'),
        '#!/bin/sh\necho chrome\n',
      );

      // Verify .metadata exists at browser root and contains the executable path
      const metadataPath = path.join(tmpDir, 'chrome', '.metadata');
      assert.ok(
        fs.existsSync(metadataPath),
        '.metadata should be created for custom provider installations',
      );

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const key = `${BrowserPlatform.LINUX}-${buildId}`;
      assert.strictEqual(
        metadata.executablePaths?.[key],
        customExecutablePath,
        'Metadata should contain the exact custom executable path',
      );

      // Verify getInstalledBrowsers returns the expected custom executable path.
      const installed = await getInstalledBrowsers({cacheDir: tmpDir});
      const found = installed.find(b => {
        return b.buildId === buildId;
      });
      assert.ok(found, 'Should find the installed browser');
      assert.strictEqual(
        found?.executablePath,
        expectedExecutablePath,
        'getInstalledBrowsers should return the correct executable path',
      );
    });

    it('should remove a stale custom path after a default provider installation', async function () {
      this.timeout(60000);

      const key = `${BrowserPlatform.LINUX}-${testChromeBuildId}`;
      const metadataPath = path.join(tmpDir, 'chrome', '.metadata');
      const expectedExecutablePath = path.join(
        tmpDir,
        'chrome',
        key,
        'chrome-linux64',
        'chrome',
      );

      // Seed the registration left behind after a custom install was removed.
      fs.mkdirSync(path.dirname(metadataPath), {recursive: true});
      fs.writeFileSync(
        metadataPath,
        JSON.stringify({
          aliases: {},
          executablePaths: {[key]: path.join('browser', 'chrome')},
        }),
      );

      // Install using default provider
      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: testChromeBuildId,
        baseUrl: getServerUrl(),
        // No providers option = uses default provider
      });

      assert.strictEqual(result.executablePath, expectedExecutablePath);
      assert.ok(fs.statSync(expectedExecutablePath).isFile());

      // The completed default-layout install reconciles the stale custom path.
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      assert.strictEqual(
        metadata.executablePaths?.[key],
        undefined,
        'The stale custom executable path should be removed',
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
  });

  describe('platform options and cache identity', () => {
    it('should forward platform options and keep installations separate', async function () {
      this.timeout(60000);

      const buildId = '123';
      const customExecutablePath = path.join('browser', 'chrome');
      // This fixture models extraction and registration, not binary compatibility.
      const archive = createTestZipBuffer(testZipEntries);
      serverState.server.setRoute(
        '/platform-provider.zip',
        (_request, response) => {
          response.writeHead(200, {'content-length': archive.length});
          response.end(archive);
        },
      );
      const platforms = [
        BrowserPlatform.LINUX,
        BrowserPlatform.MAC,
        BrowserPlatform.WIN64,
      ];

      for (const platform of platforms) {
        const calledMethods = new Set<string>();
        const checkOptions = (
          method: string,
          options: DownloadOptions,
        ): void => {
          calledMethods.add(method);
          assert.strictEqual(options.browser, Browser.CHROME);
          assert.strictEqual(options.platform, platform);
          assert.strictEqual(options.buildId, buildId);
        };
        const provider: BrowserProvider = {
          supports(options) {
            checkOptions('supports', options);
            return true;
          },
          getDownloadUrl(options) {
            checkOptions('getDownloadUrl', options);
            return new URL(`${getServerUrl()}/platform-provider.zip`);
          },
          getExecutablePath(options) {
            checkOptions('getExecutablePath', options);
            return customExecutablePath;
          },
          getName() {
            return 'PlatformTestProvider';
          },
        };
        const result = await install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform,
          buildId,
          providers: [provider],
          baseUrl: getServerUrl(),
        });

        assert.deepStrictEqual(
          calledMethods,
          new Set(['supports', 'getDownloadUrl', 'getExecutablePath']),
        );
        const expectedInstallDir = path.join(
          tmpDir,
          'chrome',
          `${platform}-${buildId}`,
        );
        assert.strictEqual(result.platform, platform);
        assert.strictEqual(result.path, expectedInstallDir);
        assert.strictEqual(
          result.executablePath,
          path.join(expectedInstallDir, customExecutablePath),
        );
      }

      const installed = await getInstalledBrowsers({cacheDir: tmpDir});
      assert.deepStrictEqual(
        installed
          .map(b => {
            return b.platform;
          })
          .sort(),
        [...platforms].sort(),
      );
      for (const browser of installed) {
        assert.strictEqual(browser.buildId, buildId);
        assert.ok(fs.statSync(browser.executablePath).isFile());
      }
    });
  });
});
