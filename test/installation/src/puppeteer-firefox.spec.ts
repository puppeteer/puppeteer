/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import assert from 'assert';
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
          PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
          PUPPETEER_PRODUCT: 'firefox',
        };
      },
    });

    describe('with CDP', () => {
      it('evaluates CommonJS', async function () {
        const files = await readdir(join(this.sandbox, '.cache', 'puppeteer'));
        assert.equal(files.length, 1);
        assert.equal(files[0], 'firefox');
        const script = await readAsset('puppeteer-core', 'requires.cjs');
        await this.runScript(script, 'cjs');
      });

      it('evaluates ES modules', async function () {
        const script = await readAsset('puppeteer-core', 'imports.js');
        await this.runScript(script, 'mjs');
      });
    });

    describe('with WebDriverBiDi', () => {
      it('evaluates ES modules', async function () {
        const script = await readAsset('puppeteer', 'bidi.js');
        await this.runScript(script, 'mjs');
      });
    });
  }
);
