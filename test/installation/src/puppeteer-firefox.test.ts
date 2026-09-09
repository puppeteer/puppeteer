/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readdir} from 'node:fs/promises';
import {join} from 'node:path';

import {configureSandbox} from './sandbox.js';

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
