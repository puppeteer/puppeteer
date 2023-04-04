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

import {readFile, rm, writeFile} from 'fs/promises';
import {join} from 'path';

import {configureSandbox} from './sandbox.js';
import {execFile, readAsset} from './util.js';

describe('`puppeteer` with Webpack', () => {
  configureSandbox({
    dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
    devDependencies: ['webpack', 'webpack-cli'],
    env: cwd => {
      return {
        PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
      };
    },
  });

  it('evaluates WebPack Bundles', async function () {
    // Write a Webpack configuration.
    await writeFile(
      join(this.sandbox, 'webpack.config.mjs'),
      await readAsset('puppeteer', 'webpack', 'webpack.config.js')
    );

    // Write the source code.
    await writeFile(
      join(this.sandbox, 'index.js'),
      await readAsset('puppeteer', 'basic.js')
    );

    // Bundle.
    await execFile('npx', ['webpack'], {cwd: this.sandbox, shell: true});

    // Remove `node_modules` to test independence.
    await rm('node_modules', {recursive: true, force: true});

    const script = await readFile(join(this.sandbox, 'bundle.js'), 'utf-8');

    await this.runScript(script, 'cjs');
  });
});
