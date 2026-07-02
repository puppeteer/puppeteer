/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {readFile, writeFile} from 'node:fs/promises';
import {platform} from 'node:os';
import {join} from 'node:path';

import {configureSandbox} from './sandbox.js';
import {execFile, readAsset} from './util.js';

// Skipping this test on Windows as windows runners are much slower.
(platform() === 'win32' ? describe.skip : describe)(
  '`puppeteer` with TypeScript',
  () => {
    configureSandbox({
      dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
      devDependencies: ['typescript@5.0.2', '@types/node@20.19.23'],
      env: cwd => {
        return {
          PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
        };
      },
    });

    it('should work with ESM', async function () {
      // Write a Webpack configuration.
      await writeFile(
        join(this.sandbox, 'tsconfig.json'),
        await readAsset('puppeteer', 'tsconfig.json'),
      );

      // Write the source code.
      await writeFile(
        join(this.sandbox, 'index.mts'),
        await readAsset('puppeteer', 'basic.ts'),
      );

      // Compile.
      await execFile('npx', ['tsc'], {cwd: this.sandbox, shell: true});

      const script = await readFile(join(this.sandbox, 'index.mjs'), 'utf-8');

      await this.runScript(script, 'mjs');
    });
    it('should work with CJS', async function () {
      // Write a Webpack configuration.
      await writeFile(
        join(this.sandbox, 'tsconfig.json'),
        await readAsset('puppeteer', 'tsconfig.json'),
      );

      // Write the source code.
      await writeFile(
        join(this.sandbox, 'index.ts'),
        await readAsset('puppeteer', 'basic-cjs.ts'),
      );

      // Compile.
      await execFile('npx', ['tsc'], {cwd: this.sandbox, shell: true});

      const script = await readFile(join(this.sandbox, 'index.js'), 'utf-8');

      await this.runScript(script, 'cjs');
    });
  },
);
