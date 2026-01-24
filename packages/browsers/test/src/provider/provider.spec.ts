/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';

import {
  buildArchiveFilename,
  Browser,
  BrowserPlatform,
  type BrowserProvider,
  type DownloadOptions,
} from '../../../lib/esm/main.js';

import {MockProvider} from './mock-provider.js';

describe('BrowserProvider Interface', () => {
  describe('buildArchiveFilename', () => {
    it('should build standard archive filename', () => {
      const filename = buildArchiveFilename(
        Browser.CHROME,
        BrowserPlatform.LINUX,
        '120.0.6099.109',
      );
      assert.strictEqual(filename, 'chrome-linux-120.0.6099.109.zip');
    });

    it('should support custom extension', () => {
      const filename = buildArchiveFilename(
        Browser.CHROMEDRIVER,
        BrowserPlatform.WIN64,
        '120.0.6099.109',
        'tar.gz',
      );
      assert.strictEqual(filename, 'chromedriver-win64-120.0.6099.109.tar.gz');
    });

    it('should handle different browsers', () => {
      assert.strictEqual(
        buildArchiveFilename(Browser.CHROME, BrowserPlatform.MAC, '120.0.0.0'),
        'chrome-mac-120.0.0.0.zip',
      );
      assert.strictEqual(
        buildArchiveFilename(
          Browser.CHROMEDRIVER,
          BrowserPlatform.LINUX_ARM,
          '120.0.0.0',
        ),
        'chromedriver-linux_arm-120.0.0.0.zip',
      );
      assert.strictEqual(
        buildArchiveFilename(
          Browser.FIREFOX,
          BrowserPlatform.WIN32,
          '120.0.0.0',
        ),
        'firefox-win32-120.0.0.0.zip',
      );
    });

    it('should handle different platforms', () => {
      const buildId = '120.0.6099.109';
      assert.strictEqual(
        buildArchiveFilename(Browser.CHROME, BrowserPlatform.LINUX, buildId),
        'chrome-linux-120.0.6099.109.zip',
      );
      assert.strictEqual(
        buildArchiveFilename(
          Browser.CHROME,
          BrowserPlatform.LINUX_ARM,
          buildId,
        ),
        'chrome-linux_arm-120.0.6099.109.zip',
      );
      assert.strictEqual(
        buildArchiveFilename(Browser.CHROME, BrowserPlatform.MAC, buildId),
        'chrome-mac-120.0.6099.109.zip',
      );
      assert.strictEqual(
        buildArchiveFilename(Browser.CHROME, BrowserPlatform.MAC_ARM, buildId),
        'chrome-mac_arm-120.0.6099.109.zip',
      );
      assert.strictEqual(
        buildArchiveFilename(Browser.CHROME, BrowserPlatform.WIN32, buildId),
        'chrome-win32-120.0.6099.109.zip',
      );
      assert.strictEqual(
        buildArchiveFilename(Browser.CHROME, BrowserPlatform.WIN64, buildId),
        'chrome-win64-120.0.6099.109.zip',
      );
    });

    it('should handle build IDs with special characters', () => {
      assert.strictEqual(
        buildArchiveFilename(
          Browser.CHROME,
          BrowserPlatform.LINUX,
          '120.0.6099.109-beta',
        ),
        'chrome-linux-120.0.6099.109-beta.zip',
      );
    });
  });

  describe('BrowserProvider interface contract', () => {
    let provider: BrowserProvider;
    let options: DownloadOptions;

    beforeEach(() => {
      provider = new MockProvider();
      options = {
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      };
    });

    it('should implement supports method', () => {
      const result = provider.supports(options);
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should implement getDownloadUrl method', () => {
      const mockProvider = new MockProvider({
        getDownloadUrlResult: new URL('https://example.com/archive.zip'),
      });

      const result = mockProvider.getDownloadUrl(options);
      assert(result instanceof URL);
      assert.strictEqual(result.toString(), 'https://example.com/archive.zip');
    });

    it('should support optional getExecutablePath method', () => {
      const mockProvider = new MockProvider({
        getExecutablePath: '/path/to/executable',
      });

      if (mockProvider.getExecutablePath) {
        const result = mockProvider.getExecutablePath({
          browser: Browser.CHROME,
          buildId: '120.0.6099.109',
          platform: BrowserPlatform.LINUX,
        });
        assert.strictEqual(result, '/path/to/executable');
      } else {
        assert.fail('getExecutablePath should be implemented');
      }
    });
  });

  describe('DownloadOptions type', () => {
    it('should accept valid options', () => {
      const options: DownloadOptions = {
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      };

      // Type check - if this compiles, the type is correct
      assert.strictEqual(options.browser, Browser.CHROME);
      assert.strictEqual(options.platform, BrowserPlatform.LINUX);
      assert.strictEqual(options.buildId, '120.0.6099.109');
    });
  });

  describe('URL handling', () => {
    it('should handle URL objects correctly', () => {
      const url = new URL('https://example.com/archive.zip');
      assert(url instanceof URL);
      assert.strictEqual(url.toString(), 'https://example.com/archive.zip');
    });
  });
});
