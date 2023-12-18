/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
