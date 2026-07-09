/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

import {withInstallLock} from '../../lib/installLock.js';

describe('installLock', function () {
  let tmpDir = '/tmp/puppeteer-browsers-test';
  let lockPath = '';
  let lockRoot = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
    lockRoot = path.join(tmpDir, '.installLocks');
    lockPath = path.join(lockRoot, 'chrome-linux-test');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, {
      force: true,
      recursive: true,
      maxRetries: 10,
      retryDelay: 500,
    });
  });

  const testLockOptions = {
    heartbeatInterval: 1000,
    retryDelay: 1,
    staleThreshold: 10000,
  };

  it('waits for an active lock to be released', async () => {
    let releaseFirstLock!: () => void;
    const firstLockReleased = new Promise<void>(resolve => {
      releaseFirstLock = resolve;
    });
    let firstLockEntered!: () => void;
    const firstLockStarted = new Promise<void>(resolve => {
      firstLockEntered = resolve;
    });
    let secondLockEntered = false;

    const firstLock = withInstallLock(
      lockPath,
      async () => {
        firstLockEntered();
        await firstLockReleased;
      },
      testLockOptions,
    );
    await firstLockStarted;

    const secondLock = withInstallLock(
      lockPath,
      async () => {
        secondLockEntered = true;
      },
      testLockOptions,
    );

    await sleep(20);
    assert.strictEqual(secondLockEntered, false);
    releaseFirstLock();
    await Promise.all([firstLock, secondLock]);
    assert.strictEqual(secondLockEntered, true);
  });

  it('claims stale locks', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const heartbeatPath = path.join(lockPath, 'heartbeat');
    fs.writeFileSync(heartbeatPath, `${process.pid}\n`);
    const staleTime = new Date(Date.now() - 20000);
    fs.utimesSync(heartbeatPath, staleTime, staleTime);

    await withInstallLock(
      lockPath,
      async () => {
        assert.ok(fs.statSync(heartbeatPath).mtimeMs > staleTime.getTime());
      },
      testLockOptions,
    );

    assert.strictEqual(fs.existsSync(lockRoot), false);
  });

  it('claims stale lock directories without heartbeat files', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const heartbeatPath = path.join(lockPath, 'heartbeat');
    const staleTime = new Date(Date.now() - 20000);
    fs.utimesSync(lockPath, staleTime, staleTime);

    await withInstallLock(
      lockPath,
      async () => {
        assert.ok(fs.existsSync(heartbeatPath));
        assert.ok(fs.statSync(heartbeatPath).mtimeMs > staleTime.getTime());
      },
      testLockOptions,
    );

    assert.strictEqual(fs.existsSync(lockRoot), false);
  });

  it('recovers when stale reaper directories are left behind', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const heartbeatPath = path.join(lockPath, 'heartbeat');
    const reaperPath = path.join(lockPath, 'reaper');
    fs.writeFileSync(heartbeatPath, `${process.pid}\n`);
    fs.mkdirSync(reaperPath);
    const staleTime = new Date(Date.now() - 20000);
    fs.utimesSync(heartbeatPath, staleTime, staleTime);
    fs.utimesSync(reaperPath, staleTime, staleTime);

    await withInstallLock(
      lockPath,
      async () => {
        assert.strictEqual(fs.existsSync(reaperPath), false);
        assert.ok(fs.statSync(heartbeatPath).mtimeMs > staleTime.getTime());
      },
      testLockOptions,
    );

    assert.strictEqual(fs.existsSync(lockRoot), false);
  });

  it('serializes concurrent stale lock recovery', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const heartbeatPath = path.join(lockPath, 'heartbeat');
    fs.writeFileSync(heartbeatPath, `${process.pid}\n`);
    const staleTime = new Date(Date.now() - 20000);
    fs.utimesSync(heartbeatPath, staleTime, staleTime);
    let activeTasks = 0;
    let maxActiveTasks = 0;

    await Promise.all(
      Array.from({length: 2}, () => {
        return withInstallLock(
          lockPath,
          async () => {
            activeTasks++;
            maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
            await sleep(10);
            activeTasks--;
          },
          testLockOptions,
        );
      }),
    );

    assert.strictEqual(maxActiveTasks, 1);
    assert.strictEqual(fs.existsSync(lockRoot), false);
  });

  it('keeps the lock root when other locks exist', async () => {
    const siblingLockPath = path.join(lockRoot, 'chrome-linux-other');
    fs.mkdirSync(siblingLockPath, {recursive: true});

    await withInstallLock(lockPath, async () => {}, testLockOptions);

    assert.strictEqual(fs.existsSync(siblingLockPath), true);
    assert.strictEqual(fs.existsSync(lockRoot), true);
  });
});
