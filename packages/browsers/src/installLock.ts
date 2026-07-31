/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {mkdir, rm, rmdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

import {debug} from './debug.js';
import type {Browser, BrowserPlatform} from './browser-data/browser-data.js';
import type {Cache} from './Cache.js';

const debugInstall = debug('puppeteer:browsers:install');

const DEFAULT_INSTALL_LOCK_RETRY_DELAY = 100;
const DEFAULT_INSTALL_LOCK_STALE_THRESHOLD = 5 * 60 * 1000;
const DEFAULT_INSTALL_LOCK_HEARTBEAT_INTERVAL = 10 * 1000;
const MAX_TRANSIENT_LOCK_ERROR_RETRIES = 10;

export interface InstallLockOptions {
  retryDelay?: number;
  staleThreshold?: number;
  heartbeatInterval?: number;
}

export function installLockPath(
  cache: Cache,
  browser: Browser,
  platform: BrowserPlatform,
  buildId: string,
): string {
  const encodedBuildId = encodeURIComponent(buildId);
  return path.join(
    cache.browserRoot(browser),
    '.installLocks',
    `${platform}-${encodedBuildId}`,
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

async function directoryExists(directory: string): Promise<boolean> {
  try {
    return (await stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

async function isExistingDirectoryError(
  error: unknown,
  directory: string,
): Promise<boolean> {
  if (isErrorWithCode(error, 'EEXIST')) {
    return true;
  }
  return isErrorWithCode(error, 'EPERM') && (await directoryExists(directory));
}

async function installLockStats(
  lockPath: string,
): Promise<{mtimeMs: number; hasHeartbeat: boolean}> {
  const heartbeatPath = path.join(lockPath, 'heartbeat');
  try {
    const stats = await stat(heartbeatPath);
    return {mtimeMs: stats.mtimeMs, hasHeartbeat: true};
  } catch (error) {
    if (!isErrorWithCode(error, 'ENOENT')) {
      throw error;
    }
    const stats = await stat(lockPath);
    return {mtimeMs: stats.mtimeMs, hasHeartbeat: false};
  }
}

async function claimStaleInstallLock(
  lockPath: string,
  staleThreshold: number,
): Promise<boolean> {
  const reaperPath = path.join(lockPath, 'reaper');
  try {
    const lockStats = await installLockStats(lockPath);
    if (Date.now() - lockStats.mtimeMs <= staleThreshold) {
      return false;
    }
    debugInstall?.(`Claiming stale browser install lock at ${lockPath}`);
    try {
      await mkdir(reaperPath);
    } catch (error) {
      if (await isExistingDirectoryError(error, reaperPath)) {
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
    const claimedLockStats = lockStats.hasHeartbeat
      ? await installLockStats(lockPath)
      : lockStats;
    if (Date.now() - claimedLockStats.mtimeMs <= staleThreshold) {
      await rm(reaperPath, {recursive: true, force: true});
      return false;
    }
    await refreshInstallLock(lockPath);
    await rm(reaperPath, {recursive: true, force: true});
    return true;
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
  task: (options: {recoveredStaleLock: boolean}) => Promise<T>,
  options: InstallLockOptions = {},
): Promise<T> {
  const retryDelay = options.retryDelay ?? DEFAULT_INSTALL_LOCK_RETRY_DELAY;
  const staleThreshold =
    options.staleThreshold ?? DEFAULT_INSTALL_LOCK_STALE_THRESHOLD;
  const heartbeatInterval =
    options.heartbeatInterval ?? DEFAULT_INSTALL_LOCK_HEARTBEAT_INTERVAL;
  let recoveredStaleLock = false;
  let transientLockErrorRetries = 0;
  const lockRoot = path.dirname(lockPath);
  await mkdir(lockRoot, {recursive: true});
  while (true) {
    try {
      await mkdir(lockPath);
      await refreshInstallLock(lockPath);
      break;
    } catch (error) {
      if (isErrorWithCode(error, 'ENOENT')) {
        await mkdir(lockRoot, {recursive: true});
        continue;
      }
      if (
        isErrorWithCode(error, 'EPERM') &&
        transientLockErrorRetries < MAX_TRANSIENT_LOCK_ERROR_RETRIES
      ) {
        transientLockErrorRetries++;
        await sleep(retryDelay);
        continue;
      }
      if (!(await isExistingDirectoryError(error, lockPath))) {
        throw error;
      }
      transientLockErrorRetries = 0;
      if (await claimStaleInstallLock(lockPath, staleThreshold)) {
        recoveredStaleLock = true;
        break;
      }
      await sleep(retryDelay);
    }
  }

  const heartbeat = setInterval(() => {
    void refreshInstallLock(lockPath).catch(error => {
      debugInstall?.(`Failed to refresh browser install lock: ${error}`);
    });
  }, heartbeatInterval);
  heartbeat.unref();

  try {
    return await task({recoveredStaleLock});
  } finally {
    clearInterval(heartbeat);
    await rm(lockPath, {recursive: true, force: true});
    try {
      await rmdir(lockRoot);
    } catch (error) {
      if (
        !isErrorWithCode(error, 'ENOENT') &&
        !isErrorWithCode(error, 'ENOTEMPTY')
      ) {
        throw error;
      }
    }
  }
}
