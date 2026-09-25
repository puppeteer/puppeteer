/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import {assert} from 'chai';

import {
  buildTestingTree,
  getMultiApplicationFile,
  setupHttpHooks,
} from './utils.js';

void describe('@puppeteer/ng-schematics: config', () => {
  setupHttpHooks();

  void describe('Single Project', () => {
    void it('should create default file', async () => {
      const tree = await buildTestingTree('config', 'single');
      assert.include(tree.files, '/.puppeteerrc.mjs');
    });
  });

  void describe('Multi projects', () => {
    void it('should create default file', async () => {
      const tree = await buildTestingTree('config', 'multi');
      assert.include(tree.files, '/.puppeteerrc.mjs');
      assert.notInclude(
        tree.files,
        getMultiApplicationFile('.puppeteerrc.mjs'),
      );
    });
  });
});
