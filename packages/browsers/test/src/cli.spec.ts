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

import {CLI} from '../../lib/cjs/CLI.js';

describe('CLI', function () {
  this.timeout(60000);

  let tmpDir = '/tmp/puppeteer-browsers-test';
  const testChromeRevision = '1083080';
  const testFirefoxRevision = '111.0a1';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, {recursive: true});
  });

  it('should download Chromium binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `chrome@${testChromeRevision}`,
      `--path=${tmpDir}`,
      '--platform=linux',
    ]);
    assert.ok(
      fs.existsSync(
        path.join(
          tmpDir,
          'chrome',
          `linux-${testChromeRevision}`,
          'chrome-linux'
        )
      )
    );
  });

  it('should download Firefox binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `firefox@${testFirefoxRevision}`,
      `--path=${tmpDir}`,
      '--platform=linux',
    ]);
    assert.ok(
      fs.existsSync(
        path.join(tmpDir, 'firefox', `linux-${testFirefoxRevision}`, 'firefox')
      )
    );
  });
});
