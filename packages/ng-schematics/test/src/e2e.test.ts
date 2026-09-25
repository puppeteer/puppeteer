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

void describe('@puppeteer/ng-schematics: e2e', () => {
  setupHttpHooks();

  void describe('Single Project', () => {
    void it('should create default file', async () => {
      const tree = await buildTestingTree('e2e', 'single', {
        name: 'myTest',
      });
      assert.include(tree.files, '/e2e/tests/my-test.e2e.ts');
      assert.notInclude(tree.files, '/e2e/tests/my-test.test.ts');
    });

    void it('should create Node file', async () => {
      const tree = await buildTestingTree('e2e', 'single', {
        name: 'myTest',
        testRunner: 'node',
      });
      assert.notInclude(tree.files, '/e2e/tests/my-test.e2e.ts');
      assert.include(tree.files, '/e2e/tests/my-test.test.ts');
    });

    void it('should create file with route', async () => {
      const route = 'home';
      const tree = await buildTestingTree('e2e', 'single', {
        name: 'myTest',
        route,
      });
      assert.include(tree.files, '/e2e/tests/my-test.e2e.ts');
      assert.include(
        tree.readContent('/e2e/tests/my-test.e2e.ts'),
        `setupBrowserHooks('${route}');`,
      );
    });

    void it('should create with route with starting slash', async () => {
      const route = '/home';
      const tree = await buildTestingTree('e2e', 'single', {
        name: 'myTest',
        route,
      });
      assert.include(tree.files, '/e2e/tests/my-test.e2e.ts');
      assert.include(
        tree.readContent('/e2e/tests/my-test.e2e.ts'),
        `setupBrowserHooks('home');`,
      );
    });
  });

  void describe('Multi projects', () => {
    void it('should create default file', async () => {
      const tree = await buildTestingTree('e2e', 'multi', {
        name: 'myTest',
      });
      assert.include(
        tree.files,
        getMultiApplicationFile('e2e/tests/my-test.e2e.ts'),
      );
      assert.notInclude(
        tree.files,
        getMultiApplicationFile('e2e/tests/my-test.test.ts'),
      );
    });

    void it('should create Node file', async () => {
      const tree = await buildTestingTree('e2e', 'multi', {
        name: 'myTest',
        testRunner: 'node',
      });
      assert.notInclude(
        tree.files,
        getMultiApplicationFile('e2e/tests/my-test.e2e.ts'),
      );
      assert.include(
        tree.files,
        getMultiApplicationFile('e2e/tests/my-test.test.ts'),
      );
    });

    void it('should create file with route', async () => {
      const route = 'home';
      const tree = await buildTestingTree('e2e', 'multi', {
        name: 'myTest',
        route,
      });
      assert.include(
        tree.files,
        getMultiApplicationFile('e2e/tests/my-test.e2e.ts'),
      );
      assert.include(
        tree.readContent(getMultiApplicationFile('e2e/tests/my-test.e2e.ts')),
        `setupBrowserHooks('${route}');`,
      );
    });

    void it('should create with route with starting slash', async () => {
      const route = '/home';
      const tree = await buildTestingTree('e2e', 'multi', {
        name: 'myTest',
        route,
      });
      assert.include(
        tree.files,
        getMultiApplicationFile('e2e/tests/my-test.e2e.ts'),
      );
      assert.include(
        tree.readContent(getMultiApplicationFile('e2e/tests/my-test.e2e.ts')),
        `setupBrowserHooks('home');`,
      );
    });
  });
});
