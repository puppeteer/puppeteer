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
  type BrowserDownloader,
  type DownloadOptions,
} from '../../../lib/esm/main.js';

import {MockDownloader} from './mock-downloader.js';

describe('BrowserDownloader Interface', () => {
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

  describe('BrowserDownloader interface contract', () => {
    let downloader: BrowserDownloader;
    let options: DownloadOptions;

    beforeEach(() => {
      downloader = new MockDownloader();
      options = {
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
      };
    });

    it('should implement supports method', () => {
      const result = downloader.supports(options);
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should implement getDownloadUrl method', () => {
      const mockDownloader = new MockDownloader({
        getDownloadUrlResult: new URL('https://example.com/archive.zip'),
      });

      const result = mockDownloader.getDownloadUrl(options);
      assert(result instanceof URL);
      assert.strictEqual(result.toString(), 'https://example.com/archive.zip');
    });

    it('should support optional getExecutablePath method', () => {
      const mockDownloader = new MockDownloader({
        getExecutablePath: '/path/to/executable',
      });

      if (mockDownloader.getExecutablePath) {
        const result = mockDownloader.getExecutablePath({
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

    it('should support optional progressCallback', () => {
      const options: DownloadOptions = {
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
        progressCallback: (downloaded, total) => {
          assert.strictEqual(typeof downloaded, 'number');
          assert.strictEqual(typeof total, 'number');
        },
      };

      assert.strictEqual(typeof options.progressCallback, 'function');
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
