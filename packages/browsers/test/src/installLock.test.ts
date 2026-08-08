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

  it('revalidates heartbeat-less stale locks after acquiring the reaper', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const staleTime = new Date(Date.now() - 20000);
    fs.utimesSync(lockPath, staleTime, staleTime);

    const bothObservedStaleLock = Promise.withResolvers<void>();
    const firstTaskEntered = Promise.withResolvers<void>();
    const releaseFirstTask = Promise.withResolvers<void>();
    const firstLockFinished = Promise.withResolvers<void>();
    const secondTaskEntered = Promise.withResolvers<void>();
    let staleLockObservations = 0;
    let activeTasks = 0;
    let maxActiveTasks = 0;

    const waitUntilBothObservedStaleLock = async () => {
      staleLockObservations++;
      if (staleLockObservations === 2) {
        bothObservedStaleLock.resolve();
      }
      await bothObservedStaleLock.promise;
    };

    const firstLock = withInstallLock(
      lockPath,
      async () => {
        activeTasks++;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        firstTaskEntered.resolve();
        await releaseFirstTask.promise;
        activeTasks--;
      },
      {
        ...testLockOptions,
        beforeStaleLockClaim: waitUntilBothObservedStaleLock,
      },
    );
    void firstLock.then(firstLockFinished.resolve, firstLockFinished.resolve);
    const secondLock = withInstallLock(
      lockPath,
      async () => {
        activeTasks++;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        secondTaskEntered.resolve();
        await firstLockFinished.promise;
        activeTasks--;
      },
      {
        ...testLockOptions,
        beforeStaleLockClaim: async () => {
          await waitUntilBothObservedStaleLock();
          await firstTaskEntered.promise;
        },
      },
    );

    await firstTaskEntered.promise;
    const secondEnteredWhileFirstWasActive = await Promise.race([
      secondTaskEntered.promise.then(() => {
        return true;
      }),
      sleep(100).then(() => {
        return false;
      }),
    ]);
    releaseFirstTask.resolve();
    await Promise.all([firstLock, secondLock]);

    assert.strictEqual(secondEnteredWhileFirstWasActive, false);
    assert.strictEqual(maxActiveTasks, 1);
    assert.strictEqual(fs.existsSync(lockPath), false);
    assert.strictEqual(fs.existsSync(lockParent), true);
  });

  it('does not claim a recreated heartbeat-less lock using stale stats', async () => {
    fs.mkdirSync(lockPath, {recursive: true});
    const staleTime = new Date(Date.now() - 20000);
    fs.utimesSync(lockPath, staleTime, staleTime);
    const lockRecreated = Promise.withResolvers<void>();
    let taskEntered = false;
    let recreatedLock = false;

    const lock = withInstallLock(
      lockPath,
      async () => {
        taskEntered = true;
      },
      {
        ...testLockOptions,
        beforeStaleLockClaim: async () => {
          if (recreatedLock) {
            return;
          }
          recreatedLock = true;
          fs.rmSync(lockPath, {recursive: true});
          fs.mkdirSync(lockPath);
          lockRecreated.resolve();
        },
      },
    );

    await lockRecreated.promise;
    await sleep(100);
    assert.strictEqual(taskEntered, false);

    fs.rmSync(lockPath, {recursive: true});
    await lock;

    assert.strictEqual(taskEntered, true);
    assert.strictEqual(fs.existsSync(lockPath), false);
    assert.strictEqual(fs.existsSync(lockParent), true);
  });
});
