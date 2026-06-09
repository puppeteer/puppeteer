/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {CLI} from '../../lib/CLI.js';

import {
  createMockedReadlineInterface,
  setupTestServer,
  getServerUrl,
} from './utils.js';
import {testChromeBuildId} from './versions.js';

describe('CLI', function () {
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

  it('should throw an error if an invalid system browser channel is provided', async () => {
    let error: Error | undefined;

    // Yargs may log the error and we want to capture it through thrown errors
    const originalConsoleError = console.error;
    console.error = () => {};
    const originalExit = process.exit;
    try {
      (process as any).exit = (code: number) => {
        throw new Error(`process.exit called with ${code}`);
      };
      await new CLI(tmpDir).run([
        'npx',
        '@puppeteer/browsers',
        'launch',
        'chrome@invalid-channel',
        `--path=${tmpDir}`,
        '--system',
      ]);
    } catch (err) {
      error = err as Error;
    } finally {
      console.error = originalConsoleError;
      process.exit = originalExit;
    }
    assert.ok(error, 'Expected an error to be thrown');
    assert.ok(error.message.includes('Invalid Chrome channel'));
  });

  it('should pass argument to binary', async () => {
    if (os.platform() === 'win32') {
      // Windows executable behaves differently
      // it does not respect the `--version` flag
      // and spawns the browser directly
      return;
    }
    await new CLI(tmpDir).run([
      'npx',
      '@puppeteer/browsers',
      'install',
      `chrome@${testChromeBuildId}`,
      `--path=${tmpDir}`,
      `--base-url=${getServerUrl()}`,
    ]);

    const logs: string[] = [];
    const output = Promise.withResolvers<void>();
    const timeout = setTimeout(output.reject, 10000);

    const originalStdoutWrite = process.stdout.write.bind(process.stdout);

    process.stdout.write = chunk => {
      logs.push(chunk.toString());
      if (
        logs
          .join(' ')
          .includes(`Google Chrome for Testing ${testChromeBuildId}`)
      ) {
        output.resolve();
      }
      return true;
    };

    try {
      await new CLI(tmpDir).run([
        'npx',
        '@puppeteer/browsers',
        'launch',
        `chrome@${testChromeBuildId}`,
        `--path=${tmpDir}`,
        '--dumpio',
        '--',
        '--version',
      ]);

      await output.promise;
    } catch {
      throw new Error(JSON.stringify(logs));
    } finally {
      clearTimeout(timeout);
      process.stdout.write = originalStdoutWrite;
    }
  });

  it('should format output', async () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (message: string) => {
      logs.push(message);
    };

    try {
      await new CLI(tmpDir).run([
        'npx',
        '@puppeteer/browsers',
        'install',
        `chrome@${testChromeBuildId}`,
        `--path=${tmpDir}`,
        `--base-url=${getServerUrl()}`,
        '--format={{path}}@{{buildId}}@{{browser}}',
      ]);
    } finally {
      console.log = originalLog;
    }

    const found = logs
      .find(log => {
        return log.includes('chrome');
      })
      ?.split('@');

    assert(found, `No match found in ${JSON.stringify(logs)}`);

    assert(found[0]?.startsWith(tmpDir), `Expected path to include tmpdir`);
    assert.strictEqual(
      found[1],
      testChromeBuildId,
      'Expected buildId to match',
    );
    assert.strictEqual(found[2], 'chrome', 'Expected browser to match');
  });
});
