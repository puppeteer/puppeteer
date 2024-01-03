/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import sinon from 'sinon';

import {CLI} from '../../../lib/cjs/CLI.js';
import * as httpUtil from '../../../lib/cjs/httpUtil.js';
import {
  createMockedReadlineInterface,
  getServerUrl,
  setupTestServer,
} from '../utils.js';
import {testFirefoxBuildId} from '../versions.js';

describe('Firefox CLI', function () {
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

    sinon.restore();
  });

  it('should download Firefox binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `firefox@${testFirefoxBuildId}`,
      `--path=${tmpDir}`,
      '--platform=linux',
      `--base-url=${getServerUrl()}`,
    ]);
    assert.ok(
      fs.existsSync(
        path.join(tmpDir, 'firefox', `linux-${testFirefoxBuildId}`, 'firefox')
      )
    );
  });

  it('should download latest Firefox binaries', async () => {
    sinon
      .stub(httpUtil, 'getJSON')
      .returns(Promise.resolve({FIREFOX_NIGHTLY: testFirefoxBuildId}));
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `firefox@latest`,
      `--path=${tmpDir}`,
      '--platform=linux',
      `--base-url=${getServerUrl()}`,
    ]);

    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `firefox`,
      `--path=${tmpDir}`,
      '--platform=linux',
      `--base-url=${getServerUrl()}`,
    ]);
  });
});
