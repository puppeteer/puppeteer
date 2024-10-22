/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import {spawnSync} from 'child_process';
import {existsSync, readFileSync} from 'fs';
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
          await readAsset('puppeteer', 'configuration', '.puppeteerrc.cjs'),
        );
      },
    });

    it('evaluates', async function () {
      const files = await readdir(join(this.sandbox, '.cache', 'puppeteer'));
      assert.equal(files.length, 2, files.join());
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
          await readAsset('puppeteer', 'configuration', 'puppeteer.config.ts'),
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

  describe('CLI', () => {
    configureSandbox({
      dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
      env: cwd => {
        return {
          PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
          PUPPETEER_SKIP_DOWNLOAD: 'true',
        };
      },
      before: async cwd => {
        await writeFile(
          join(cwd, '.puppeteerrc.cjs'),
          // config specifies 121 as the browserVersion.
          await readAsset(
            'puppeteer',
            'configuration',
            '.puppeteerrc-browserVersion.cjs',
          ),
        );
      },
    });

    it('installs the browser version from the configuration', async function () {
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
        },
      );
      assert.strictEqual(
        result.status,
        0,
        `${result.stdout}\n${result.stderr}`,
      );
      const metadataFilePath = join(
        this.sandbox,
        '.cache',
        'puppeteer',
        'chrome',
        '.metadata',
      );
      assert.ok(existsSync(metadataFilePath));
      const metadata = JSON.parse(readFileSync(metadataFilePath, 'utf8'));
      assert.ok(metadata['aliases']['121']);
    });
  });
});
