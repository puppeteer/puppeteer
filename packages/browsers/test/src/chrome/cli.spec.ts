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
import fs from 'fs';
import os from 'os';
import path from 'path';

import {CLI} from '../../../lib/cjs/CLI.js';
import {
  createMockedReadlineInterface,
  setupTestServer,
  getServerUrl,
} from '../utils.js';
import {testChromeBuildId} from '../versions.js';

describe('Chrome CLI', function () {
  this.timeout(90000);

  setupTestServer();

  let tmpDir = '/tmp/puppeteer-browsers-test';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(async () => {
    await new CLI(tmpDir, createMockedReadlineInterface('yes')).run([
      'npx',
      '@puppeteer/browsers',
      'clear',
      `--path=${tmpDir}`,
      `--base-url=${getServerUrl()}`,
    ]);
  });

  it('should download Chrome binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `chrome@${testChromeBuildId}`,
      `--path=${tmpDir}`,
      '--platform=linux',
      `--base-url=${getServerUrl()}`,
    ]);
    assert.ok(
      fs.existsSync(
        path.join(
          tmpDir,
          'chrome',
          `linux-${testChromeBuildId}`,
          'chrome-linux64',
          'chrome'
        )
      )
    );

    await new CLI(tmpDir, createMockedReadlineInterface('no')).run([
      'npx',
      '@puppeteer/browsers',
      'clear',
      `--path=${tmpDir}`,
    ]);
    assert.ok(
      fs.existsSync(
        path.join(
          tmpDir,
          'chrome',
          `linux-${testChromeBuildId}`,
          'chrome-linux64',
          'chrome'
        )
      )
    );
  });

  // Skipped because the current latest is not published yet.
  it.skip('should download latest Chrome binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `chrome@latest`,
      `--path=${tmpDir}`,
      '--platform=linux',
      `--base-url=${getServerUrl()}`,
    ]);
  });
});
