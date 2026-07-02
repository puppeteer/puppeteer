/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {launch} from '../../lib/main.js';

describe('Process', () => {
  it('runs the driver process exit hook synchronously when the driver exits', async () => {
    let hookCalls = 0;
    const temporaryDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'puppeteer-driver-exit-'),
    );
    fs.writeFileSync(path.join(temporaryDir, 'profile-file'), 'profile');

    const browserProcess = launch({
      executablePath: process.execPath,
      args: ['-e', 'setInterval(() => {}, 1000);'],
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
      onDriverProcessExit: () => {
        hookCalls++;
        fs.rmSync(temporaryDir, {force: true, recursive: true});
      },
    });

    try {
      process.emit('exit', 0);

      assert.strictEqual(hookCalls, 1);
      assert.strictEqual(fs.existsSync(temporaryDir), false);

      await browserProcess.hasClosed();
    } finally {
      await browserProcess.close().catch(() => {});
      fs.rmSync(temporaryDir, {force: true, recursive: true});
    }
  });
});
