/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {platform} from 'node:os';
import {join} from 'node:path';

import {configureSandbox} from './sandbox.js';
import {readAsset} from './util.js';

// Skipping this test on Windows as windows runners are much slower.
(platform() === 'win32' ? describe.skip : describe)(
  '`puppeteer` with WebDriverBiDi',
  () => {
    configureSandbox({
      dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
      env: cwd => {
        return {
          PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
          PUPPETEER_SKIP_DOWNLOAD: 'true',
        };
      },
    });

    it('evaluates CommonJS', async function () {
      const script = await readAsset(
        'puppeteer-core',
        'requires-webdriver.cjs',
      );
      await this.runScript(script, 'cjs');
    });

    it('evaluates ES modules', async function () {
      const script = await readAsset('puppeteer-core', 'imports-webdriver.js');
      await this.runScript(script, 'mjs');
    });
  },
);
