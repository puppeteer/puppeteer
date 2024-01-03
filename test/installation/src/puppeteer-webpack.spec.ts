/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
