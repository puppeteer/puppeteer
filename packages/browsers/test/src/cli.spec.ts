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
import * as readline from 'readline';
import {Writable, Readable} from 'stream';

import {CLI} from '../../lib/cjs/CLI.js';
import {Cache} from '../../lib/cjs/main.js';

import {testChromeBuildId, testFirefoxBuildId} from './versions.js';

describe('CLI', function () {
  this.timeout(90000);

  let tmpDir = '/tmp/puppeteer-browsers-test';

  function createMockedInterface(input: string) {
    const readable = Readable.from([input]);
    const writable = new Writable({
      write(_chunk, _encoding, callback) {
        // Suppress the output to keep the test clean
        callback();
      },
    });

    return readline.createInterface({
      input: readable,
      output: writable,
    });
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(async () => {
    new Cache(tmpDir).clear();
    await new CLI(tmpDir, createMockedInterface('yes')).run([
      'npx',
      '@puppeteer/browsers',
      'clear',
      `--path=${tmpDir}`,
    ]);
  });

  it('should download Chromium binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `chrome@${testChromeBuildId}`,
      `--path=${tmpDir}`,
      '--platform=linux',
    ]);
    assert.ok(
      fs.existsSync(
        path.join(
          tmpDir,
          'chrome',
          `linux-${testChromeBuildId}`,
          'chrome-linux'
        )
      )
    );

    await new CLI(tmpDir, createMockedInterface('no')).run([
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
      `firefox@${testFirefoxBuildId}`,
      `--path=${tmpDir}`,
      '--platform=linux',
    ]);
    assert.ok(
      fs.existsSync(
        path.join(tmpDir, 'firefox', `linux-${testFirefoxBuildId}`, 'firefox')
      )
    );
  });

  it('should download latest Firefox binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `firefox@latest`,
      `--path=${tmpDir}`,
      '--platform=linux',
    ]);
  });

  it('should download latest Chrome binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `chrome@latest`,
      `--path=${tmpDir}`,
      '--platform=linux',
    ]);
  });
});
