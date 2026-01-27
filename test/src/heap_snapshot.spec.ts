/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('Heap Snapshot', function () {
  setupTestBrowserHooks();

  it('should capture heap snapshot', async () => {
    const {page} = await getTestState();
    const filePath = path.join(
      import.meta.dirname,
      '../assets/heap.heapsnapshot',
    );

    await page.captureHeapSnapshot({path: filePath});

    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    const snapshot = JSON.parse(content);
    expect(snapshot.snapshot).toBeDefined();
    expect(snapshot.nodes).toBeDefined();
    expect(snapshot.edges).toBeDefined();

    fs.unlinkSync(filePath);
  });
});
