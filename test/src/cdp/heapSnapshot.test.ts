/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

import {assert} from 'chai';

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

    assert.isTrue(fs.existsSync(filePath));
    const content = fs.readFileSync(filePath, 'utf8');
    const snapshot = JSON.parse(content);
    assert.isDefined(snapshot.snapshot);
    assert.isDefined(snapshot.nodes);
    assert.isDefined(snapshot.edges);
  });
});
