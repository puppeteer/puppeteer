/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import {spawnSync} from 'child_process';
import {existsSync} from 'fs';
import {readdir} from 'fs/promises';
import {platform} from 'os';
import {join} from 'path';

import {configureSandbox} from './sandbox.js';
import {readAsset} from './util.js';

// Skipping this test on Windows as windows runners are much slower.
(platform() === 'win32' ? describe.skip : describe)(
  '`puppeteer` with Firefox',
  () => {
    configureSandbox({
      dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
      env: cwd => {
        return {
          PUPPETEER_BROWSER: 'firefox',
          PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
          PUPPETEER_CHROME_SKIP_DOWNLOAD: 'true',
          PUPPETEER_CHROME_HEADLESS_SHELL_SKIP_DOWNLOAD: 'true',
          PUPPETEER_FIREFOX_SKIP_DOWNLOAD: 'false',
        };
      },
    });

    describe('with WebDriverBiDi', () => {
      it('evaluates CommonJS', async function () {
        const files = await readdir(join(this.sandbox, '.cache', 'puppeteer'));
        assert.equal(files.length, 1, files.join());
        assert.equal(files[0], 'firefox');
        const script = await readAsset('puppeteer-core', 'requires.cjs');
        await this.runScript(script, 'cjs');
      });

      it('evaluates ES modules', async function () {
        const files = await readdir(join(this.sandbox, '.cache', 'puppeteer'));
        assert.equal(files.length, 1, files.join());
        assert.equal(files[0], 'firefox');
        const script = await readAsset('puppeteer-core', 'imports.js');
        await this.runScript(script, 'mjs');
      });
    });
  },
);

describe('Firefox download', () => {
  configureSandbox({
    dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
    env: cwd => {
      return {
        PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
        PUPPETEER_SKIP_DOWNLOAD: 'true',
      };
    },
  });

  it('can download Firefox stable', async function () {
    assert.ok(!existsSync(join(this.sandbox, '.cache', 'puppeteer')));
    const result = spawnSync(
      'npx',
      ['puppeteer', 'browsers', 'install', 'firefox@stable'],
      {
        // npx is not found without the shell flag on Windows.
        shell: process.platform === 'win32',
        cwd: this.sandbox,
        env: {
          ...process.env,
          PUPPETEER_CACHE_DIR: join(this.sandbox, '.cache', 'puppeteer'),
        },
      },
    );
    assert.strictEqual(result.status, 0);
    const files = await readdir(join(this.sandbox, '.cache', 'puppeteer'));
    assert.equal(files.length, 1);
    assert.equal(files[0], 'firefox');
  });
});
