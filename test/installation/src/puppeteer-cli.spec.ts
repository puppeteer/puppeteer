/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import {spawnSync} from 'child_process';
import {existsSync} from 'fs';
import {readdir} from 'fs/promises';
import {join} from 'path';

import {configureSandbox} from './sandbox.js';

describe('Puppeteer CLI', () => {
  configureSandbox({
    dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
    env: cwd => {
      return {
        PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
        PUPPETEER_SKIP_DOWNLOAD: 'true',
      };
    },
  });

  it('can launch', async function () {
    const result = spawnSync('npx', ['puppeteer', '--help'], {
      // npx is not found without the shell flag on Windows.
      shell: process.platform === 'win32',
      cwd: this.sandbox,
    });
    assert.strictEqual(result.status, 0);
    assert.ok(
      result.stdout.toString('utf-8').startsWith('puppeteer <command>')
    );
  });

  it('can download a browser', async function () {
    assert.ok(!existsSync(join(this.sandbox, '.cache', 'puppeteer')));
    const result = spawnSync(
      'npx',
      ['puppeteer', 'browsers', 'install', 'chrome'],
      {
        // npx is not found without the shell flag on Windows.
        shell: process.platform === 'win32',
        cwd: this.sandbox,
        env: {
          ...process.env,
          PUPPETEER_CACHE_DIR: join(this.sandbox, '.cache', 'puppeteer'),
        },
      }
    );
    assert.strictEqual(result.status, 0);
    const files = await readdir(join(this.sandbox, '.cache', 'puppeteer'));
    assert.equal(files.length, 1);
    assert.equal(files[0], 'chrome');
  });
});
