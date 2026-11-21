/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {launch} from '../../lib/launch.js';

const sleeperArgs = ['-e', 'setInterval(() => {}, 1000)'];

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// `ChildProcess` and its stdio sockets expose `ref()`/`unref()` but no
// public `hasRef()`; the underlying libuv handle is the only introspection
// point.
function handleHasRef(stream: unknown): boolean | undefined {
  const handle = (stream as {_handle?: {hasRef?: () => boolean}})?._handle;
  return handle?.hasRef?.();
}

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 2000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) {
      return true;
    }
    await new Promise(resolve => {
      return setTimeout(resolve, 50);
    });
  }
  return predicate();
}

describe('launch handleExit', () => {
  it('keeps the child process referenced by default', () => {
    const proc = launch({
      executablePath: process.execPath,
      args: sleeperArgs,
    });
    try {
      assert.strictEqual(handleHasRef(proc.nodeProcess), true);
      assert.strictEqual(handleHasRef(proc.nodeProcess.stdout), true);
      assert.strictEqual(handleHasRef(proc.nodeProcess.stderr), true);
    } finally {
      proc.kill();
    }
  });

  it('unreferences the child process and stdio with handleExit: false', () => {
    const proc = launch({
      executablePath: process.execPath,
      args: sleeperArgs,
      handleExit: false,
    });
    try {
      assert.strictEqual(handleHasRef(proc.nodeProcess), false);
      assert.strictEqual(handleHasRef(proc.nodeProcess.stdout), false);
      assert.strictEqual(handleHasRef(proc.nodeProcess.stderr), false);
    } finally {
      proc.kill();
    }
  });

  it('leaves the child running after the driver exits with handleExit: false', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pptr-handle-exit-'));
    try {
      const pidFile = path.join(tmpDir, 'pid.txt');
      const launchJs = fileURLToPath(
        new URL('../../lib/launch.js', import.meta.url),
      );
      const driver = path.join(tmpDir, 'driver.mjs');
      fs.writeFileSync(
        driver,
        [
          `import {launch} from ${JSON.stringify(launchJs)};`,
          `import fs from 'node:fs';`,
          `const proc = launch({executablePath: ${JSON.stringify(
            process.execPath,
          )}, args: ${JSON.stringify(sleeperArgs)}, handleExit: false});`,
          `fs.writeFileSync(${JSON.stringify(
            pidFile,
          )}, String(proc.nodeProcess.pid));`,
          // No explicit process.exit(): the driver must exit naturally.
        ].join('\n'),
      );
      // The driver must exit on its own, quickly, once the event loop drains.
      const result = childProcess.spawnSync(process.execPath, [driver], {
        timeout: 10_000,
        encoding: 'utf8',
      });
      assert.strictEqual(result.status, 0, result.stderr);
      const pid = Number(fs.readFileSync(pidFile, 'utf8'));
      assert.ok(pid > 0);
      try {
        assert.strictEqual(
          pidAlive(pid),
          true,
          'child should still be alive after the driver exited',
        );
      } finally {
        try {
          process.kill(pid, 'SIGKILL');
        } catch {}
      }
    } finally {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });

  it('kills the child when the driver exits with handleExit: true (default)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pptr-handle-exit-'));
    try {
      const pidFile = path.join(tmpDir, 'pid.txt');
      const launchJs = fileURLToPath(
        new URL('../../lib/launch.js', import.meta.url),
      );
      const driver = path.join(tmpDir, 'driver.mjs');
      fs.writeFileSync(
        driver,
        [
          `import {launch} from ${JSON.stringify(launchJs)};`,
          `import fs from 'node:fs';`,
          `const proc = launch({executablePath: ${JSON.stringify(
            process.execPath,
          )}, args: ${JSON.stringify(sleeperArgs)}});`,
          `fs.writeFileSync(${JSON.stringify(
            pidFile,
          )}, String(proc.nodeProcess.pid));`,
          `process.exit(0);`,
        ].join('\n'),
      );
      const result = childProcess.spawnSync(process.execPath, [driver], {
        timeout: 10_000,
        encoding: 'utf8',
      });
      assert.strictEqual(result.status, 0, result.stderr);
      const pid = Number(fs.readFileSync(pidFile, 'utf8'));
      assert.ok(pid > 0);
      assert.strictEqual(
        await waitFor(() => {
          return !pidAlive(pid);
        }),
        true,
        'child should be killed when the driver exits',
      );
    } finally {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });
});
