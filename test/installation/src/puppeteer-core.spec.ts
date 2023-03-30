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

import {configureSandbox} from './sandbox.js';
import {readAsset} from './util.js';

describe('`puppeteer-core`', () => {
  configureSandbox({
    dependencies: ['@puppeteer/browsers', 'puppeteer-core'],
  });

  it('evaluates CommonJS', async function () {
    const script = await readAsset('puppeteer-core', 'requires.cjs');
    await this.runScript(script, 'cjs');
  });

  it('evaluates ES modules', async function () {
    const script = await readAsset('puppeteer-core', 'imports.js');
    await this.runScript(script, 'mjs');
  });

  for (const product of ['firefox', 'chrome']) {
    it(`\`launch\` for \`${product}\` with a bad \`executablePath\``, async function () {
      const script = (await readAsset('puppeteer-core', 'launch.js')).replace(
        '${product}',
        product
      );
      await this.runScript(script, 'mjs');
    });
  }
});
