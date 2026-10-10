/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Stats} from 'node:fs';
import {mkdir, readFile, rm, stat, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

import type {Browser, BrowserPlatform} from './browser-data/browser-data.js';
import type {Cache} from './Cache.js';
import {debug, type LoggerFunction} from './debug.js';

const debugInstall = debug('puppeteer:browsers:install');

const DEFAULT_INSTALL_LOCK_RETRY_DELAY = 100;
const DEFAULT_INSTALL_LOCK_HEARTBEAT_INTERVAL = 10 * 1000;
const DEFAULT_INSTALL_LOCK_STALE_THRESHOLD = 60 * 1000;
const DEFAULT_INSTALL_LOCK_ACQUISITION_TIMEOUT = 15 * 60 * 1000;
const DEFAULT_INSTALL_LOCK_CLEANUP_MAX_RETRIES = 5;
const DEFAULT_INSTALL_LOCK_CLEANUP_RETRY_DELAY = 100;

interface InstallLockOptions {
  retryDelay?: number;
  /** Maximum observed lock-state age before stale recovery is considered. */
  staleThreshold?: number;
  /**
   * Time after which waiting to acquire the install lock may fail. Stale-lock recovery is
   * attempted before checking whether this timeout has elapsed.
   */
  acquisitionTimeout?: number;
  heartbeatInterval?: number;
  cleanupMaxRetries?: number;
  cleanupRetryDelay?: number;
  logger?: LoggerFunction;
  warningLogger?: LoggerFunction;
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

interface InstallLockOwner {
  hostname: string;
  pid: number;
}

type InstallLockSnapshot =
  | {
      fromHeartbeat: true;
      mtimeMs: number;
      owner: InstallLockOwner | undefined;
    }
  | {
      fromHeartbeat: false;
      mtimeMs: number;
      lockIdentity: InstallLockIdentity;
    };

type InstallLockBlockReason =
  | 'invalid-owner-metadata'
  | 'owner-alive'
  | 'owner-unverifiable'
  | 'unreliable-lock-identity'
  | 'unstable-lock-identity';

interface InstallLockBlockedResult {
  status: 'blocked';
  reason: InstallLockBlockReason;
  snapshot: InstallLockSnapshot;
}

type InstallLockClaimDecision =
  {status: 'claimable'} | {status: 'retry'} | InstallLockBlockedResult;

type InstallLockClaimResult =
  {status: 'claimed'} | {status: 'retry'} | InstallLockBlockedResult;

interface InstallLockCleanupOptions {
  maxRetries: number;
  retryDelay: number;
}

/**
 * @internal
 */
export class InstallLockError extends Error {
  readonly lockPath: string;
  readonly waitedMs: number;
  readonly reason: InstallLockBlockReason | undefined;
  readonly owner: InstallLockOwner | undefined;
  readonly observedAgeMs: number | undefined;

  constructor(
    lockPath: string,
    waitedMs: number,
    reason?: InstallLockBlockReason,
    owner?: InstallLockOwner,
    observedAgeMs?: number,
  ) {
    const waitedSeconds = Math.max(0, Math.round(waitedMs / 1000));
    super(
      `Timed out after ${waitedSeconds}s waiting for browser install lock at ${lockPath}.`,
    );
    this.name = 'InstallLockError';
    this.lockPath = lockPath;
    this.waitedMs = waitedMs;
    this.reason = reason;
    this.owner = owner;
    this.observedAgeMs = observedAgeMs;
  }
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

function parseInstallLockOwner(value: string): InstallLockOwner | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return;
  }
  const owner = parsed as Record<string, unknown>;
  const hostname = owner['hostname'];
  const pid = owner['pid'];
  if (
    typeof hostname !== 'string' ||
    hostname.length === 0 ||
    hostname.trim() !== hostname ||
    typeof pid !== 'number' ||
    !Number.isSafeInteger(pid) ||
    pid <= 0
  ) {
    return;
  }
  return {
    hostname,
    pid,
  };
}

async function removeInstallLockPath(
  targetPath: string,
  options: InstallLockCleanupOptions,
): Promise<void> {
  // Recursive rm() retries ENOTEMPTY against the same path, so it may remove a
  // replacement lock created during cleanup. Keep retries bounded; identity
  // checks cannot make deletion atomic.
  await rm(targetPath, {
    recursive: true,
    force: true,
    maxRetries: options.maxRetries,
    retryDelay: options.retryDelay,
  });
}

async function getInstallLockIdentity(
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
      const ownerText = await readFile(heartbeatPath, 'utf8');
      const recheckedHeartbeatStats = await stat(heartbeatPath);
      if (Date.now() - recheckedHeartbeatStats.mtimeMs <= staleThreshold) {
        return;
      }
      return {
        fromHeartbeat: true,
        mtimeMs: recheckedHeartbeatStats.mtimeMs,
        owner: parseInstallLockOwner(ownerText),
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

/**
 * @internal
 */
export function hasUsableBirthtime(identity: InstallLockIdentity): boolean {
  // Some filesystems report zero when birth time is unavailable. A non-zero value
  // may instead be ctime, and must be revalidated after creating the reaper.
  return identity.birthtimeNs > 0n;
}

/**
 * @internal
 */
export function compareInstallLockIdentities(
  before: InstallLockIdentity,
  after: InstallLockIdentity,
): 'same' | 'recreated' | 'unstable' {
  if (before.dev !== after.dev || before.ino !== after.ino) {
    return 'recreated';
  }
  if (before.birthtimeNs !== after.birthtimeNs) {
    return 'unstable';
  }
  return 'same';
}

function getInstallLockClaimDecision(
  snapshot: InstallLockSnapshot,
  staleThreshold: number,
  localHostname: string,
): InstallLockClaimDecision {
  if (Date.now() - snapshot.mtimeMs <= staleThreshold) {
    return {status: 'retry'};
  }
  if (!snapshot.fromHeartbeat) {
    if (!hasUsableBirthtime(snapshot.lockIdentity)) {
      return {
        status: 'blocked',
        reason: 'unreliable-lock-identity',
        snapshot,
      };
    }
    return {status: 'claimable'};
  }
  if (snapshot.owner === undefined) {
    return {
      status: 'blocked',
      reason: 'invalid-owner-metadata',
      snapshot,
    };
  }
  if (snapshot.owner.hostname !== localHostname) {
    return {
      status: 'blocked',
      reason: 'owner-unverifiable',
      snapshot,
    };
  }
  try {
    process.kill(snapshot.owner.pid, 0);
    return {
      status: 'blocked',
      reason: 'owner-alive',
      snapshot,
    };
  } catch (error) {
    if (isErrorWithCode(error, 'ESRCH')) {
      return {status: 'claimable'};
    }
    return {
      status: 'blocked',
      reason: 'owner-unverifiable',
      snapshot,
    };
  }
}

function formatInstallLockWarning(
  lockPath: string,
  result: InstallLockBlockedResult,
): string {
  let description: string;
  switch (result.reason) {
    case 'invalid-owner-metadata':
      description = 'the stale heartbeat has invalid owner metadata';
      break;
    case 'owner-alive': {
      const owner = result.snapshot.fromHeartbeat
        ? result.snapshot.owner
        : undefined;
      description = `process ${owner?.pid} on ${owner?.hostname} appears to still be running`;
      break;
    }
    case 'owner-unverifiable': {
      const owner = result.snapshot.fromHeartbeat
        ? result.snapshot.owner
        : undefined;
      description = `process ${owner?.pid} on ${owner?.hostname} could not be checked safely`;
      break;
    }
    case 'unreliable-lock-identity':
      description = 'the filesystem did not provide a reliable lock birth time';
      break;
    case 'unstable-lock-identity':
      description =
        'the filesystem changed the lock birth time during recovery';
      break;
  }
  const ageSeconds = Math.max(
    0,
    Math.round((Date.now() - result.snapshot.mtimeMs) / 1000),
  );
  return [
    `Cannot safely claim the stale browser install lock at ${lockPath}.`,
    `Reason: ${description}.`,
    `Observed lock age: ${ageSeconds}s.`,
    'The lock was not claimed; Puppeteer will continue waiting for it to be released.',
  ].join('\n');
}

async function claimStaleInstallLock(
  lockPath: string,
  staleThreshold: number,
  owner: InstallLockOwner,
  cleanupOptions: InstallLockCleanupOptions,
  logger?: LoggerFunction,
  beforeStaleLockClaim?: () => Promise<void>,
): Promise<InstallLockClaimResult> {
  const reaperPath = path.join(lockPath, 'reaper');
  try {
    const initialSnapshot = await inspectInstallLock(lockPath, staleThreshold);
    if (initialSnapshot === undefined) {
      return {status: 'retry'};
    }
    const initialClaimDecision = getInstallLockClaimDecision(
      initialSnapshot,
      staleThreshold,
      owner.hostname,
    );
    if (initialClaimDecision.status !== 'claimable') {
      return initialClaimDecision;
    }
    await beforeStaleLockClaim?.();
    logger?.(`Claiming stale browser install lock at ${lockPath}`);
    try {
      await mkdir(reaperPath);
    } catch (error) {
      if (isErrorWithCode(error, 'EEXIST')) {
        const reaperStats = await stat(reaperPath);
        if (Date.now() - reaperStats.mtimeMs > staleThreshold) {
          await removeInstallLockPath(reaperPath, cleanupOptions);
        }
        return {status: 'retry'};
      }
      if (isErrorWithCode(error, 'ENOENT')) {
        return {status: 'retry'};
      }
      throw error;
    }
    let claimed = false;
    try {
      if (initialSnapshot.fromHeartbeat) {
        const currentSnapshot = await inspectInstallLock(
          lockPath,
          staleThreshold,
        );
        if (currentSnapshot === undefined) {
          return {status: 'retry'};
        }
        const currentClaimDecision = getInstallLockClaimDecision(
          currentSnapshot,
          staleThreshold,
          owner.hostname,
        );
        if (currentClaimDecision.status !== 'claimable') {
          return currentClaimDecision;
        }
      } else {
        const currentHeartbeatStats = await statHeartbeat(lockPath);
        if (currentHeartbeatStats !== undefined) {
          return {status: 'retry'};
        }
        const currentLockIdentity = await getInstallLockIdentity(lockPath);
        const identityComparison = compareInstallLockIdentities(
          initialSnapshot.lockIdentity,
          currentLockIdentity,
        );
        if (identityComparison === 'recreated') {
          return {status: 'retry'};
        }
        if (identityComparison === 'unstable') {
          // Creating the reaper changes ctime. If birth time changes with it,
          // it cannot safely identify this directory across an ABA race.
          return {
            status: 'blocked',
            reason: 'unstable-lock-identity',
            snapshot: initialSnapshot,
          };
        }
        const currentClaimDecision = getInstallLockClaimDecision(
          initialSnapshot,
          staleThreshold,
          owner.hostname,
        );
        if (currentClaimDecision.status !== 'claimable') {
          return currentClaimDecision;
        }
      }
      await refreshInstallLock(lockPath, owner);
      claimed = true;
      return {status: 'claimed'};
    } finally {
      try {
        await removeInstallLockPath(reaperPath, cleanupOptions);
      } catch (error) {
        if (!claimed) {
          throw error;
        }
        logger?.(`Failed to remove browser install lock reaper: ${error}`);
      }
    }
  } catch (error) {
    if (isErrorWithCode(error, 'ENOENT')) {
      return {status: 'retry'};
    }
    throw error;
  }
}

async function refreshInstallLock(
  lockPath: string,
  owner: InstallLockOwner,
): Promise<void> {
  await writeFile(
    path.join(lockPath, 'heartbeat'),
    `${JSON.stringify(owner)}\n`,
  );
}

export async function withInstallLock<T>(
  lockPath: string,
  task: () => Promise<T>,
  options: InstallLockOptions = {},
): Promise<T> {
  const retryDelay = options.retryDelay ?? DEFAULT_INSTALL_LOCK_RETRY_DELAY;
  const staleThreshold =
    options.staleThreshold ?? DEFAULT_INSTALL_LOCK_STALE_THRESHOLD;
  const acquisitionTimeout =
    options.acquisitionTimeout ?? DEFAULT_INSTALL_LOCK_ACQUISITION_TIMEOUT;
  const heartbeatInterval =
    options.heartbeatInterval ?? DEFAULT_INSTALL_LOCK_HEARTBEAT_INTERVAL;
  const cleanupOptions = {
    maxRetries:
      options.cleanupMaxRetries ?? DEFAULT_INSTALL_LOCK_CLEANUP_MAX_RETRIES,
    retryDelay:
      options.cleanupRetryDelay ?? DEFAULT_INSTALL_LOCK_CLEANUP_RETRY_DELAY,
  };
  const logger = options.logger ?? debugInstall;
  const warningLogger = options.warningLogger ?? console.warn;
  const owner = {
    hostname: os.hostname(),
    pid: process.pid,
  };
  const lockParent = path.dirname(lockPath);
  let loggedContention = false;
  let warnedBlockedLock = false;
  let lastBlockedResult: InstallLockBlockedResult | undefined;
  let contentionStartedAt: number | undefined;
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
      contentionStartedAt ??= performance.now();
      const claimResult = await claimStaleInstallLock(
        lockPath,
        staleThreshold,
        owner,
        cleanupOptions,
        logger,
        options.beforeStaleLockClaim,
      );
      if (claimResult.status === 'claimed') {
        break;
      }
      if (claimResult.status === 'blocked') {
        lastBlockedResult = claimResult;
        if (!warnedBlockedLock) {
          warningLogger(formatInstallLockWarning(lockPath, claimResult));
          warnedBlockedLock = true;
        }
      } else if (claimResult.status === 'retry' && !loggedContention) {
        logger?.(`Waiting for browser install lock at ${lockPath}`);
        loggedContention = true;
      }
      const waitedMs = performance.now() - contentionStartedAt;
      if (waitedMs >= acquisitionTimeout) {
        const snapshot = lastBlockedResult?.snapshot;
        const lockOwner = snapshot?.fromHeartbeat ? snapshot.owner : undefined;
        const observedAgeMs =
          snapshot === undefined
            ? undefined
            : Math.max(0, Date.now() - snapshot.mtimeMs);
        throw new InstallLockError(
          lockPath,
          waitedMs,
          lastBlockedResult?.reason,
          lockOwner,
          observedAgeMs,
        );
      }
      await sleep(retryDelay);
      continue;
    }
    try {
      await refreshInstallLock(lockPath, owner);
    } catch (error) {
      await removeInstallLockPath(lockPath, cleanupOptions);
      throw error;
    }
    break;
  }

  let heartbeatRefresh: Promise<void> | undefined;
  const heartbeat = setInterval(() => {
    if (heartbeatRefresh !== undefined) {
      return;
    }
    heartbeatRefresh = refreshInstallLock(lockPath, owner)
      .catch(error => {
        logger?.(`Failed to refresh browser install lock: ${error}`);
      })
      .finally(() => {
        heartbeatRefresh = undefined;
      });
  }, heartbeatInterval);
  heartbeat.unref();

  try {
    return await task();
  } finally {
    clearInterval(heartbeat);
    await heartbeatRefresh;
    await removeInstallLockPath(lockPath, cleanupOptions);
  }
}
