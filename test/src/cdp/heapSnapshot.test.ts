/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';

describe('Heap Snapshot', function () {
  setupTestBrowserHooks();

  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'heap-snapshot-'));
  });

  afterEach(async () => {
    await rm(tempDir, {recursive: true, force: true});
  });

  it('should capture heap snapshot', async () => {
    const {page} = await getTestState();
    const filePath = path.join(tempDir, 'heap.heapsnapshot');

    await page.captureHeapSnapshot({path: filePath});

    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    const snapshot = JSON.parse(content);
    expect(snapshot.snapshot).toBeDefined();
    expect(snapshot.nodes).toBeDefined();
    expect(snapshot.edges).toBeDefined();
  });

  it('should reject without an unhandled rejection when the file cannot be opened', async () => {
    const {page} = await getTestState();
    const filePath = path.join(tempDir, 'missing', 'heap.heapsnapshot');

    const unhandledRejections: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) => {
      unhandledRejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandledRejection);
    try {
      await expect(page.captureHeapSnapshot({path: filePath})).rejects.toThrow(
        'ENOENT',
      );
      expect(unhandledRejections).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
    }
  });
});
