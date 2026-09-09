/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

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
      expect(tree.files).toContain('/.puppeteerrc.mjs');
    });
  });

  void describe('Multi projects', () => {
    void it('should create default file', async () => {
      const tree = await buildTestingTree('config', 'multi');
      expect(tree.files).toContain('/.puppeteerrc.mjs');
      expect(tree.files).not.toContain(
        getMultiApplicationFile('.puppeteerrc.mjs'),
      );
    });
  });
});
