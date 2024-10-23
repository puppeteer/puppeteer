/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import {spawnSync} from 'child_process';

import {configureSandbox} from './sandbox.js';

describe('`@puppeteer/browsers`', () => {
  configureSandbox({
    dependencies: ['@puppeteer/browsers'],
  });

  it('can launch CLI', async function () {
    const result = spawnSync('npx', ['@puppeteer/browsers', '--help'], {
      // npx is not found without the shell flag on Windows.
      shell: process.platform === 'win32',
      cwd: this.sandbox,
    });
    assert.strictEqual(result.status, 0);
    assert.ok(
      result.stdout
        .toString('utf-8')
        .startsWith('@puppeteer/browsers <command>'),
    );
  });
});
