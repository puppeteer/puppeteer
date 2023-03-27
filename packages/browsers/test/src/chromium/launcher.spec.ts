/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  CDP_WEBSOCKET_ENDPOINT_REGEX,
  computeExecutablePath,
  launch,
  fetch,
  Browser,
  BrowserPlatform,
  Cache,
} from '../../../lib/cjs/main.js';
import {testChromiumBuildId} from '../versions.js';

describe('Chromium', () => {
  it('should compute executable path for Chromium', () => {
    assert.strictEqual(
      computeExecutablePath({
        browser: Browser.CHROMIUM,
        platform: BrowserPlatform.LINUX,
        buildId: '123',
        cacheDir: 'cache',
      }),
      path.join('cache', 'chromium', 'linux-123', 'chrome-linux', 'chrome')
    );
  });

  describe('launcher', function () {
    this.timeout(60000);

    let tmpDir = '/tmp/puppeteer-browsers-test';

    beforeEach(async () => {
      tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'puppeteer-browsers-test')
      );
      await fetch({
        cacheDir: tmpDir,
        browser: Browser.CHROMIUM,
        buildId: testChromiumBuildId,
      });
    });

    afterEach(() => {
      new Cache(tmpDir).clear();
    });

    it('should launch a Chrome browser', async () => {
      const executablePath = computeExecutablePath({
        cacheDir: tmpDir,
        browser: Browser.CHROMIUM,
        buildId: testChromiumBuildId,
      });
      const process = launch({
        executablePath,
        args: [
          '--headless=new',
          '--use-mock-keychain',
          '--disable-features=DialMediaRouteProvider',
          `--user-data-dir=${path.join(tmpDir, 'profile')}`,
        ],
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
        args: [
          '--headless=new',
          '--use-mock-keychain',
          '--disable-features=DialMediaRouteProvider',
          '--remote-debugging-port=9222',
          `--user-data-dir=${path.join(tmpDir, 'profile')}`,
        ],
      });
      const url = await process.waitForLineOutput(CDP_WEBSOCKET_ENDPOINT_REGEX);
      await process.close();
      assert.ok(url.startsWith('ws://127.0.0.1:9222/devtools/browser'));
    });
  });
});
