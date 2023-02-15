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
import {join} from 'path';

import {describeInstallation} from './describeInstallation.js';
import {readAsset} from './util.js';

describeInstallation(
  '`puppeteer`',
  {
    dependencies: ['puppeteer-core', 'puppeteer'],
    env: cwd => {
      return {
        PUPPETEER_CACHE_DIR: join(cwd, '.cache', 'puppeteer'),
      };
    },
  },
  ({itEvaluates}) => {
    itEvaluates('CommonJS', {commonjs: true}, async cwd => {
      const files = await readdir(join(cwd, '.cache', 'puppeteer'));
      assert.equal(files.length, 1);
      assert.equal(files[0], 'chrome');

      return readAsset('puppeteer-core', 'requires.cjs');
    });

    itEvaluates('ES modules', async () => {
      return readAsset('puppeteer-core', 'imports.js');
    });
  }
);
