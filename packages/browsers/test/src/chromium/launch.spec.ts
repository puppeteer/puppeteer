/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  CDP_WEBSOCKET_ENDPOINT_REGEX,
  computeExecutablePath,
  launch,
  install,
  Browser,
  BrowserPlatform,
} from '../../../lib/cjs/main.js';
import {getServerUrl, setupTestServer, clearCache} from '../utils.js';
import {testChromiumBuildId} from '../versions.js';

describe('Chromium', () => {
  it('should compute executable path for Chromium', () => {
    assert.strictEqual(
      computeExecutablePath({
        browser: Browser.CHROMIUM,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        cacheDir: '.cache',
      }),
      path.join('.cache', 'chromium', 'linux-123', 'chrome-linux', 'chrome'),
    );
  });

  describe('launcher', function () {
    setupTestServer();

    this.timeout(120000);

    let tmpDir = '/tmp/puppeteer-browsers-test';

    beforeEach(async () => {
      tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'puppeteer-browsers-test'),
      );
      await install({
        cacheDir: tmpDir,
        browser: Browser.CHROMIUM,
        buildId: testChromiumBuildId,
        baseUrl: getServerUrl(),
      });
    });

    afterEach(() => {
      clearCache(tmpDir);
    });

    function getArgs() {
      return [
        '--allow-pre-commit-input',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints,DialMediaRouteProvider',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--enable-automation',
        '--export-tagged-pdf',
        '--force-color-profile=srgb',
        '--headless=new',
        '--metrics-recording-only',
        '--no-first-run',
        '--password-store=basic',
        '--remote-debugging-port=9222',
        '--use-mock-keychain',
        `--user-data-dir=${path.join(tmpDir, 'profile')}`,
        'about:blank',
      ];
    }

    it('should launch a Chromium browser', async () => {
      const executablePath = computeExecutablePath({
        cacheDir: tmpDir,
        browser: Browser.CHROMIUM,
        buildId: testChromiumBuildId,
      });
      const process = launch({
        executablePath,
        args: getArgs(),
      });
      await process.close();
    });

    it('should allow parsing stderr output of the browser process', async () => {
      const executablePath = computeExecutablePath({
        cacheDir: tmpDir,
        browser: Browser.CHROMIUM,
        buildId: testChromiumBuildId,
      });
      const process = launch({
        executablePath,
        args: getArgs(),
      });
      const url = await process.waitForLineOutput(CDP_WEBSOCKET_ENDPOINT_REGEX);
      await process.close();
      assert.ok(url.startsWith('ws://127.0.0.1:9222/devtools/browser'));
    });
  });
});
