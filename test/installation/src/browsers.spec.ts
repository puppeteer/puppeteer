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
        .startsWith('@puppeteer/browsers <command>')
    );
  });
});
