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

import {describeInstallation} from './describeInstallation.js';
import {execFile, readAsset} from './util.js';

describeInstallation(
  '`puppeteer` with Webpack',
  {
    dependencies: ['@puppeteer/browsers', 'puppeteer-core', 'puppeteer'],
    devDependencies: ['webpack', 'webpack-cli'],
    env: cwd => {
      return {
        PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
      };
    },
  },
  ({itEvaluates}) => {
    itEvaluates('Webpack bundles', {commonjs: true}, async cwd => {
      // Write a Webpack configuration.
      await writeFile(
        join(cwd, 'webpack.config.mjs'),
        await readAsset('puppeteer', 'webpack', 'webpack.config.js')
      );

      // Write the source code.
      await writeFile(
        join(cwd, 'index.js'),
        await readAsset('puppeteer', 'basic.js')
      );

      // Bundle.
      await execFile('npx', ['webpack'], {cwd, shell: true});

      // Remove `node_modules` to test independence.
      await rm('node_modules', {recursive: true, force: true});

      // Read the bundled file.
      return await readFile(join(cwd, 'bundle.js'), 'utf-8');
    });
  }
);
