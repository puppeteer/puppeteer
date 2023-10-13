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
