/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
import {testChromeHeadlessShellBuildId} from '../versions.js';

describe('chrome-headless-shell CLI', function () {
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

  it('should download chrome-headless-shell binaries', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `chrome-headless-shell@${testChromeHeadlessShellBuildId}`,
      `--path=${tmpDir}`,
      '--platform=linux',
      `--base-url=${getServerUrl()}`,
    ]);
    assert.ok(
      fs.existsSync(
        path.join(
          tmpDir,
          'chrome-headless-shell',
          `linux-${testChromeHeadlessShellBuildId}`,
          'chrome-headless-shell-linux64',
          'chrome-headless-shell'
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
          'chrome-headless-shell',
          `linux-${testChromeHeadlessShellBuildId}`,
          'chrome-headless-shell-linux64',
          'chrome-headless-shell'
        )
      )
    );
  });
});
