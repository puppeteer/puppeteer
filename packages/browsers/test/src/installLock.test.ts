/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {withInstallLock} from '../../lib/installLock.js';

describe('withInstallLock', function () {
  let tmpDir = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-install-lock-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, {
        force: true,
        recursive: true,
        maxRetries: 10,
        retryDelay: 100,
      });
    } catch {}
  });

  it('serializes concurrent critical sections for the same lock path', async () => {
    const lockPath = path.join(tmpDir, 'chrome.install-lock');
    const order: string[] = [];

    const first = withInstallLock(lockPath, async () => {
      order.push('first-enter');
      await new Promise(resolve => {
        return setTimeout(resolve, 50);
      });
      order.push('first-exit');
      return 1;
    });

    await new Promise(resolve => {
      return setTimeout(resolve, 10);
    });

    const second = withInstallLock(lockPath, async () => {
      order.push('second-enter');
      order.push('second-exit');
      return 2;
    });

    assert.deepStrictEqual(await Promise.all([first, second]), [1, 2]);
    assert.deepStrictEqual(order, [
      'first-enter',
      'first-exit',
      'second-enter',
      'second-exit',
    ]);
    assert.strictEqual(fs.existsSync(lockPath), false);
  });

  it('recovers from a stale lock left by a dead process', async () => {
    const lockPath = path.join(tmpDir, 'chrome.install-lock');
    fs.mkdirSync(lockPath);
    // Use a PID that should not exist on this host.
    fs.writeFileSync(`${lockPath}.pid`, '2147483646');

    const result = await withInstallLock(
      lockPath,
      async () => {
        return 'ok';
      },
      {timeoutMs: 2000, pollMs: 20},
    );
    assert.strictEqual(result, 'ok');
  });
});
