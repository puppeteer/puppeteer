/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import {readdir, writeFile} from 'fs/promises';
import {join} from 'path';

import {configureSandbox} from './sandbox.js';
import {readAsset} from './util.js';

describe('`puppeteer` with configuration', () => {
  describe('cjs', () => {
    configureSandbox({
      dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
      env: cwd => {
        return {
          PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
        };
      },
      before: async cwd => {
        await writeFile(
          join(cwd, '.puppeteerrc.cjs'),
          await readAsset('puppeteer', 'configuration', '.puppeteerrc.cjs')
        );
      },
    });

    it('evaluates', async function () {
      const files = await readdir(join(this.sandbox, '.cache', 'puppeteer'));
      assert.equal(files.length, 2);
      assert(files.includes('chrome'));
      assert(files.includes('chrome-headless-shell'));

      const script = await readAsset('puppeteer', 'basic.js');
      await this.runScript(script, 'mjs');
    });
  });

  describe('ts', () => {
    configureSandbox({
      dependencies: [
        '@puppeteer/browsers',
        'puppeteer-core',
        'puppeteer',
        'typescript',
      ],
      env: cwd => {
        return {
          PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
        };
      },
      before: async cwd => {
        await writeFile(
          join(cwd, 'puppeteer.config.ts'),
          await readAsset('puppeteer', 'configuration', 'puppeteer.config.ts')
        );
      },
    });

    it('evaluates', async function () {
      const files = await readdir(join(this.sandbox, '.cache', 'puppeteer'));
      assert.equal(files.length, 2);
      assert(files.includes('chrome'));
      assert(files.includes('chrome-headless-shell'));

      const script = await readAsset('puppeteer', 'basic.js');
      await this.runScript(script, 'mjs');
    });
  });
});
