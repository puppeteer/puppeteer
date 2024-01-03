/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {readFile, writeFile} from 'fs/promises';
import {platform} from 'os';
import {join} from 'path';

import {configureSandbox} from './sandbox.js';
import {execFile, readAsset} from './util.js';

// Skipping this test on Windows as windows runners are much slower.
(platform() === 'win32' ? describe.skip : describe)(
  '`puppeteer` with TypeScript',
  () => {
    configureSandbox({
      dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
      devDependencies: ['typescript@4.7.4', '@types/node@16.3.3'],
      env: cwd => {
        return {
          PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
        };
      },
    });

    it('should work', async function () {
      // Write a Webpack configuration.
      await writeFile(
        join(this.sandbox, 'tsconfig.json'),
        await readAsset('puppeteer', 'tsconfig.json')
      );

      // Write the source code.
      await writeFile(
        join(this.sandbox, 'index.ts'),
        await readAsset('puppeteer', 'basic.ts')
      );

      // Compile.
      await execFile('npx', ['tsc'], {cwd: this.sandbox, shell: true});

      const script = await readFile(join(this.sandbox, 'index.js'), 'utf-8');

      await this.runScript(script, 'cjs');
    });
  }
);
