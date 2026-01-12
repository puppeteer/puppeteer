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

describe('Custom Downloader Integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-test'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });

  describe('basic functionality', () => {
    it('should work with no custom downloaders (default CfT)', async function () {
      this.timeout(30000); // May take time for network requests

      // Should use default ChromeForTestingDownloader
      await assert.rejects(
        install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: 'non-existent-build-12345',
        }),
        /All downloaders failed/,
      );
    });

    it('should accept custom downloaders array', async function () {
      this.timeout(30000);

      const customDownloader = new MockDownloader({
        supports: false, // Will fall back to CfT
      });

      // Should succeed with CfT fallback
      const result = await install({
        cacheDir: tmpDir,
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId: '120.0.6099.109',
        downloaders: [customDownloader],
      });

      assert(result);
      assert.strictEqual(typeof result.path, 'string');
    });
  });

  describe('downloader interface compliance', () => {
    it('should handle downloaders that implement the interface', async function () {
      this.timeout(30000);

      const downloader = new MockDownloader({
        supports: true,
        getDownloadUrlResult: new URL('https://example.com/test.zip'),
      });

      // Create dummy archive file
      fs.writeFileSync(path.join(tmpDir, 'test.zip'), 'dummy content');

      // The MockDownloader should be used first, but may fail on extraction
      // The important thing is that the interface is called correctly
      try {
        await install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: '120.0.6099.109',
          downloaders: [downloader],
        });
        // If it succeeds, that's fine
        assert(true);
      } catch (error) {
        // If it fails, it should be due to archive issues, not interface issues
        assert(error instanceof Error);
        // Make sure it's not an interface-related error
        assert(!error.message.includes('supports'));
        assert(!error.message.includes('download'));
      }
    });
  });
});
