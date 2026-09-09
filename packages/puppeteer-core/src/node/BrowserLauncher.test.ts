/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {existsSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, it} from 'node:test';

import expect from 'expect';

import {registerProcessExitCleanup} from './BrowserLauncher.js';

class ProcessEmitter {
  #listeners = new Set<() => void>();

  once(_event: 'exit', listener: () => void): void {
    this.#listeners.add(listener);
  }

  off(_event: 'exit', listener: () => void): void {
    this.#listeners.delete(listener);
  }

  emit(_event: 'exit'): void {
    for (const listener of this.#listeners) {
      listener();
    }
    this.#listeners.clear();
  }
}

const logger = (_prefix: string) => {
  return undefined;
};

describe('registerProcessExitCleanup', () => {
  it('removes a temporary profile synchronously on process exit', () => {
    const userDataDir = mkdtempSync(
      join(tmpdir(), 'puppeteer-process-exit-cleanup-'),
    );
    writeFileSync(join(userDataDir, 'profile'), 'profile');
    const processEmitter = new ProcessEmitter();

    registerProcessExitCleanup(userDataDir, logger, processEmitter);
    processEmitter.emit('exit');

    expect(existsSync(userDataDir)).toBe(false);
  });

  it('can unregister cleanup after the browser process exits', () => {
    const userDataDir = mkdtempSync(
      join(tmpdir(), 'puppeteer-process-exit-cleanup-'),
    );
    const processEmitter = new ProcessEmitter();
    const unregister = registerProcessExitCleanup(
      userDataDir,
      logger,
      processEmitter,
    );

    unregister();
    processEmitter.emit('exit');

    expect(existsSync(userDataDir)).toBe(true);
    rmSync(userDataDir, {recursive: true, force: true});
  });
});
