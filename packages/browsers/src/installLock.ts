/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {mkdir, rm} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';

/**
 * Cross-platform install lock with no extra dependencies.
 * Uses exclusive directory creation (`mkdir` without recursive) as the lock.
 *
 * @internal
 */
export async function withInstallLock<T>(
  lockPath: string,
  fn: () => Promise<T>,
  options: {timeoutMs?: number; pollMs?: number} = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  const pollMs = options.pollMs ?? 100;
  const release = await acquireInstallLock(lockPath, timeoutMs, pollMs);
  try {
    return await fn();
  } finally {
    await release();
  }
}

async function acquireInstallLock(
  lockPath: string,
  timeoutMs: number,
  pollMs: number,
): Promise<() => Promise<void>> {
  const start = Date.now();
  const pidPath = `${lockPath}.pid`;

  while (Date.now() - start < timeoutMs) {
    try {
      await mkdir(lockPath);
      try {
        writeFileSync(pidPath, String(process.pid), {flag: 'w'});
      } catch {
        // Best-effort pid recording for stale-lock recovery.
      }
      return async () => {
        try {
          await rm(pidPath, {force: true});
        } catch {
          // ignore
        }
        try {
          await rm(lockPath, {recursive: true, force: true});
        } catch {
          // ignore
        }
      };
    } catch {
      // Lock held by another process — clear if clearly stale.
      if (isStaleLock(pidPath)) {
        try {
          await rm(pidPath, {force: true});
          await rm(lockPath, {recursive: true, force: true});
          continue;
        } catch {
          // Another process may have won the race to clear; retry.
        }
      }
      await delay(pollMs);
    }
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for browser install lock at ${lockPath}`,
  );
}

function isStaleLock(pidPath: string): boolean {
  if (!existsSync(pidPath)) {
    return false;
  }
  try {
    const pid = Number(readFileSync(pidPath, 'utf8').trim());
    if (!Number.isFinite(pid) || pid <= 0) {
      return true;
    }
    // signal 0 throws if the process does not exist (or we cannot signal it).
    process.kill(pid, 0);
    return false;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    // EPERM means the process exists but we cannot signal it — lock is live.
    if (err?.code === 'EPERM') {
      return false;
    }
    return true;
  }
}
