/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

import {withInstallLock} from '../../lib/installLock.js';

describe('installLock', function () {
  let tmpDir = '/tmp/puppeteer-browsers-test';
  let lockPath = '';
  let lockParent = '';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
    lockParent = path.join(tmpDir, 'chrome');
    lockPath = path.join(lockParent, '.installLock-linux-test');
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

  async function exitedProcessPid(): Promise<number> {
    const child = spawn(process.execPath, ['-e', ''], {
      stdio: 'ignore',
      windowsHide: true,
    });
    const exited = once(child, 'exit');
    const pid = child.pid;
    assert.ok(pid);
    await exited;
    return pid;
  }

  it('does not claim stale locks owned by live processes', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const heartbeatPath = path.join(lockPath, 'heartbeat');
    fs.writeFileSync(heartbeatPath, `${process.pid}\n`);
    const staleTime = new Date(Date.now() - 20000);
    fs.utimesSync(heartbeatPath, staleTime, staleTime);
    let lockEntered = false;

    const lock = withInstallLock(
      lockPath,
      async () => {
        lockEntered = true;
      },
      testLockOptions,
    );

    await sleep(20);
    assert.strictEqual(lockEntered, false);
    fs.rmSync(lockPath, {recursive: true, force: true});
    await lock;
    assert.strictEqual(lockEntered, true);
    assert.strictEqual(fs.existsSync(lockPath), false);
    assert.strictEqual(fs.existsSync(lockParent), true);
  });

  it('claims stale locks', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const heartbeatPath = path.join(lockPath, 'heartbeat');
    fs.writeFileSync(heartbeatPath, `${await exitedProcessPid()}\n`);
    const staleTime = new Date(Date.now() - 20000);
    fs.utimesSync(heartbeatPath, staleTime, staleTime);

    await withInstallLock(
      lockPath,
      async () => {
        assert.ok(fs.statSync(heartbeatPath).mtimeMs > staleTime.getTime());
      },
      testLockOptions,
    );

    assert.strictEqual(fs.existsSync(lockPath), false);
    assert.strictEqual(fs.existsSync(lockParent), true);
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

    assert.strictEqual(fs.existsSync(lockPath), false);
    assert.strictEqual(fs.existsSync(lockParent), true);
  });

  it('recovers when stale reaper directories are left behind', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const heartbeatPath = path.join(lockPath, 'heartbeat');
    const reaperPath = path.join(lockPath, 'reaper');
    fs.writeFileSync(heartbeatPath, `${await exitedProcessPid()}\n`);
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

    assert.strictEqual(fs.existsSync(lockPath), false);
    assert.strictEqual(fs.existsSync(lockParent), true);
  });

  it('serializes concurrent stale lock recovery', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const heartbeatPath = path.join(lockPath, 'heartbeat');
    fs.writeFileSync(heartbeatPath, `${await exitedProcessPid()}\n`);
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
    assert.strictEqual(fs.existsSync(lockPath), false);
    assert.strictEqual(fs.existsSync(lockParent), true);
  });
});
