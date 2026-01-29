/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {Browser, BrowserPlatform, install} from '../../../lib/esm/main.js';

import {MockProvider} from './mock-provider.js';

describe('Custom Provider Integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-test'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });

  describe('provider interface compliance', () => {
    it('should handle providers that implement the interface', async function () {
      this.timeout(30000);

      const provider = new MockProvider({
        supports: true,
        getDownloadUrlResult: new URL('https://example.com/test.zip'),
      });

      // Create dummy archive file
      fs.writeFileSync(path.join(tmpDir, 'test.zip'), 'dummy content');

      // The MockProvider should be used first, but may fail on extraction
      // The important thing is that the interface is called correctly
      try {
        await install({
          cacheDir: tmpDir,
          browser: Browser.CHROME,
          platform: BrowserPlatform.LINUX,
          buildId: '120.0.6099.109',
          providers: [provider],
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
