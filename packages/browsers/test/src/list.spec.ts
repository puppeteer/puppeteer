/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {CLI} from '../../lib/cjs/CLI.js';

import {
  createMockedReadlineInterface,
  setupTestServer,
  getServerUrl,
} from './utils.js';
import {testChromeBuildId} from './versions.js';

describe('list command', function () {
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

  it('should show no browsers for empty cache', async () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (message: string) => {
      logs.push(message);
    };

    try {
      await new CLI(tmpDir).run([
        'npx',
        '@puppeteer/browsers',
        'list',
        `--path=${tmpDir}`,
      ]);

      assert.strictEqual(logs.length, 0);
    } finally {
      console.log = originalLog;
    }
  });

  it('should list installed browsers', async () => {
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `chrome@${testChromeBuildId}`,
      `--path=${tmpDir}`,
      '--platform=linux',
      `--base-url=${getServerUrl()}`,
    ]);

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (message: string) => {
      logs.push(message);
    };

    try {
      await new CLI(tmpDir).run([
        'npx',
        '@puppeteer/browsers',
        'list',
        `--path=${tmpDir}`,
      ]);

      assert.match(
        logs.join('\n'),
        new RegExp(`chrome@${testChromeBuildId} \\(linux\\) .+chrome`),
      );
    } finally {
      console.log = originalLog;
    }
  });

  it('should handle invalid cache directory', async () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (message: string) => {
      logs.push(message);
    };

    const invalidDir = path.join(tmpDir, 'nonexistent');
    try {
      await new CLI(invalidDir).run([
        'npx',
        '@puppeteer/browsers',
        'list',
        `--path=${invalidDir}`,
      ]);

      assert.strictEqual(logs.length, 0);
    } finally {
      console.log = originalLog;
    }
  });
});
