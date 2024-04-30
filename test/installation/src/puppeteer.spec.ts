/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import {spawnSync} from 'child_process';
import {readdirSync} from 'fs';
import fs from 'fs';
import {readdir} from 'fs/promises';
import {platform} from 'os';
import {join} from 'path';

import {TestServer} from '@pptr/testserver';

import {EXAMPLES_DIR} from './constants.js';
import {configureSandbox} from './sandbox.js';
import {readAsset} from './util.js';

describe('`puppeteer`', () => {
  configureSandbox({
    dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
    env: cwd => {
      return {
        PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
      };
    },
  });

  it('evaluates CommonJS', async function () {
    const files = await readdir(join(this.sandbox, '.cache', 'puppeteer'));
    assert.equal(files.length, 2);
    assert(files.includes('chrome'));
    assert(files.includes('chrome-headless-shell'));

    const script = await readAsset('puppeteer-core', 'requires.cjs');
    await this.runScript(script, 'cjs');
  });

  it('evaluates ES modules', async function () {
    const script = await readAsset('puppeteer-core', 'imports.js');
    await this.runScript(script, 'mjs');
  });

  it('runs in the browser', async function () {
    const puppeteerInBrowserPath = join(this.sandbox, 'puppeteer-in-browser');
    fs.cpSync(
      join(EXAMPLES_DIR, 'puppeteer-in-browser'),
      puppeteerInBrowserPath,
      {
        recursive: true,
      }
    );
    spawnSync('npm', ['ci'], {
      cwd: puppeteerInBrowserPath,
      shell: true,
    });
    spawnSync('npm', ['run', 'build'], {
      cwd: puppeteerInBrowserPath,
      shell: true,
    });

    const server = await TestServer.create(puppeteerInBrowserPath);
    try {
      const script = await readAsset('puppeteer', 'puppeteer-in-browser.js');
      await this.runScript(script, 'mjs', [String(server.port)]);
    } finally {
      await server.stop();
    }
  });
});

// Skipping this test on Windows as windows runners are much slower.
(platform() === 'win32' ? describe.skip : describe)(
  '`puppeteer` clears cache',
  () => {
    configureSandbox({
      dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
      env: cwd => {
        return {
          PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
        };
      },
    });

    it('evaluates', async function () {
      assert.equal(
        readdirSync(join(this.sandbox, '.cache', 'puppeteer', 'chrome')).length,
        1
      );

      await this.runScript(
        await readAsset('puppeteer', 'installCanary.js'),
        'mjs'
      );

      assert.equal(
        readdirSync(join(this.sandbox, '.cache', 'puppeteer', 'chrome')).length,
        2
      );

      await this.runScript(await readAsset('puppeteer', 'trimCache.js'), 'mjs');

      assert.equal(
        readdirSync(join(this.sandbox, '.cache', 'puppeteer', 'chrome')).length,
        1
      );
    });
  }
);
