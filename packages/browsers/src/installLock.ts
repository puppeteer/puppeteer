/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Stats} from 'node:fs';
import {mkdir, readFile, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

import type {Browser, BrowserPlatform} from './browser-data/browser-data.js';
import type {Cache} from './Cache.js';
import {debug} from './debug.js';

const debugInstall = debug('puppeteer:browsers:install');

const DEFAULT_INSTALL_LOCK_RETRY_DELAY = 100;
const DEFAULT_INSTALL_LOCK_STALE_THRESHOLD = 5 * 60 * 1000;
const DEFAULT_INSTALL_LOCK_HEARTBEAT_INTERVAL = 10 * 1000;

interface InstallLockOptions {
  retryDelay?: number;
  staleThreshold?: number;
  heartbeatInterval?: number;
  /**
   * @internal
   */
  beforeStaleLockClaim?: () => Promise<void>;
}

interface InstallLockIdentity {
  dev: bigint;
  ino: bigint;
  birthtimeNs: bigint;
}

type InstallLockSnapshot =
  | {
      fromHeartbeat: true;
      mtimeMs: number;
      ownerPid?: number;
    }
  | {
      fromHeartbeat: false;
      mtimeMs: number;
      lockIdentity: InstallLockIdentity;
    };

export function installLockPath(
  cache: Cache,
  browser: Browser,
  platform: BrowserPlatform,
  buildId: string,
): string {
  const encodedBuildId = encodeURIComponent(buildId);
  return path.join(
    cache.browserRoot(browser),
    `.installLock-${platform}-${encodedBuildId}`,
  );
}

function isErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

async function installLockIdentity(
  lockPath: string,
): Promise<InstallLockIdentity> {
  const stats = await stat(lockPath, {bigint: true});
  return {
    dev: stats.dev,
    ino: stats.ino,
    birthtimeNs: stats.birthtimeNs,
  };
}

async function statHeartbeat(lockPath: string): Promise<Stats | undefined> {
  try {
    return await stat(path.join(lockPath, 'heartbeat'));
  } catch (error) {
    if (isErrorWithCode(error, 'ENOENT')) {
      return;
    }
    throw error;
  }
}

/**
 * Returns undefined when a fresh heartbeat rules out this claim attempt.
 */
async function inspectInstallLock(
  lockPath: string,
  staleThreshold: number,
): Promise<InstallLockSnapshot | undefined> {
  const heartbeatPath = path.join(lockPath, 'heartbeat');
  const heartbeatStats = await statHeartbeat(lockPath);
  if (heartbeatStats !== undefined) {
    if (Date.now() - heartbeatStats.mtimeMs <= staleThreshold) {
      return;
    }
    try {
      const ownerPidText = await readFile(heartbeatPath, 'utf8');
      const recheckedHeartbeatStats = await stat(heartbeatPath);
      if (Date.now() - recheckedHeartbeatStats.mtimeMs <= staleThreshold) {
        return;
      }
      const ownerPid = Number(ownerPidText.trim());
      return {
        fromHeartbeat: true,
        mtimeMs: recheckedHeartbeatStats.mtimeMs,
        ownerPid:
          Number.isSafeInteger(ownerPid) && ownerPid > 0 ? ownerPid : undefined,
      };
    } catch (error) {
      if (!isErrorWithCode(error, 'ENOENT')) {
        throw error;
      }
    }
  }
  const lockStats = await stat(lockPath, {bigint: true});
  return {
    fromHeartbeat: false,
    mtimeMs: Number(lockStats.mtimeMs),
    lockIdentity: {
      dev: lockStats.dev,
      ino: lockStats.ino,
      birthtimeNs: lockStats.birthtimeNs,
    },
  };
}

function isSameInstallLock(
  before: InstallLockIdentity,
  after: InstallLockIdentity,
): boolean {
  return (
    before.dev === after.dev &&
    before.ino === after.ino &&
    before.birthtimeNs === after.birthtimeNs
  );
}

function canClaimInstallLock(
  snapshot: {mtimeMs: number; ownerPid?: number},
  staleThreshold: number,
): boolean {
  if (Date.now() - snapshot.mtimeMs <= staleThreshold) {
    return false;
  }
  if (snapshot.ownerPid === undefined) {
    return true;
  }
  try {
    process.kill(snapshot.ownerPid, 0);
    return false;
  } catch (error) {
    return isErrorWithCode(error, 'ESRCH');
  }
}

async function claimStaleInstallLock(
  lockPath: string,
  staleThreshold: number,
  beforeStaleLockClaim?: () => Promise<void>,
): Promise<boolean> {
  const reaperPath = path.join(lockPath, 'reaper');
  try {
    const initialSnapshot = await inspectInstallLock(lockPath, staleThreshold);
    if (
      initialSnapshot === undefined ||
      !canClaimInstallLock(initialSnapshot, staleThreshold)
    ) {
      return false;
    }
    await beforeStaleLockClaim?.();
    debugInstall?.(`Claiming stale browser install lock at ${lockPath}`);
    try {
      await mkdir(reaperPath);
    } catch (error) {
      if (isErrorWithCode(error, 'EEXIST')) {
        const reaperStats = await stat(reaperPath);
        if (Date.now() - reaperStats.mtimeMs > staleThreshold) {
          await rm(reaperPath, {recursive: true, force: true});
        }
        return false;
      }
      if (isErrorWithCode(error, 'ENOENT')) {
        return false;
      }
      throw error;
    }
    try {
      if (initialSnapshot.fromHeartbeat) {
        const currentSnapshot = await inspectInstallLock(
          lockPath,
          staleThreshold,
        );
        if (
          currentSnapshot === undefined ||
          !canClaimInstallLock(currentSnapshot, staleThreshold)
        ) {
          return false;
        }
      } else {
        const currentHeartbeatStats = await statHeartbeat(lockPath);
        if (currentHeartbeatStats !== undefined) {
          return false;
        }
        const currentLockIdentity = await installLockIdentity(lockPath);
        if (
          !isSameInstallLock(
            initialSnapshot.lockIdentity,
            currentLockIdentity,
          ) ||
          !canClaimInstallLock(initialSnapshot, staleThreshold)
        ) {
          return false;
        }
      }
      await refreshInstallLock(lockPath);
      return true;
    } finally {
      await rm(reaperPath, {recursive: true, force: true});
    }
  } catch (error) {
    if (isErrorWithCode(error, 'ENOENT')) {
      return false;
    }
    throw error;
  }
}

async function refreshInstallLock(lockPath: string): Promise<void> {
  await writeFile(path.join(lockPath, 'heartbeat'), `${process.pid}\n`);
}

export async function withInstallLock<T>(
  lockPath: string,
  task: () => Promise<T>,
  options: InstallLockOptions = {},
): Promise<T> {
  const retryDelay = options.retryDelay ?? DEFAULT_INSTALL_LOCK_RETRY_DELAY;
  const staleThreshold =
    options.staleThreshold ?? DEFAULT_INSTALL_LOCK_STALE_THRESHOLD;
  const heartbeatInterval =
    options.heartbeatInterval ?? DEFAULT_INSTALL_LOCK_HEARTBEAT_INTERVAL;
  const lockParent = path.dirname(lockPath);
  await mkdir(lockParent, {recursive: true});
  while (true) {
    try {
      await mkdir(lockPath);
    } catch (error) {
      if (isErrorWithCode(error, 'ENOENT')) {
        await mkdir(lockParent, {recursive: true});
        continue;
      }
      if (!isErrorWithCode(error, 'EEXIST')) {
        throw error;
      }
      if (
        await claimStaleInstallLock(
          lockPath,
          staleThreshold,
          options.beforeStaleLockClaim,
        )
      ) {
        break;
      }
      await sleep(retryDelay);
      continue;
    }
    try {
      await refreshInstallLock(lockPath);
    } catch (error) {
      await rm(lockPath, {recursive: true, force: true});
      throw error;
    }
    break;
  }

  const heartbeat = setInterval(() => {
    void refreshInstallLock(lockPath).catch(error => {
      debugInstall?.(`Failed to refresh browser install lock: ${error}`);
    });
  }, heartbeatInterval);
  heartbeat.unref();

  try {
    return await task();
  } finally {
    clearInterval(heartbeat);
    await rm(lockPath, {recursive: true, force: true});
  }
}
