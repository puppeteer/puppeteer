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

void describe('@puppeteer/ng-schematics: e2e', () => {
  setupHttpHooks();

  void describe('Single Project', () => {
    void it('should create default file', async () => {
      const tree = await buildTestingTree('e2e', 'single', {
        name: 'myTest',
      });
      expect(tree.files).toContain('/e2e/tests/my-test.e2e.ts');
      expect(tree.files).not.toContain('/e2e/tests/my-test.test.ts');
    });

    void it('should create Node file', async () => {
      const tree = await buildTestingTree('e2e', 'single', {
        name: 'myTest',
        testRunner: 'node',
      });
      expect(tree.files).not.toContain('/e2e/tests/my-test.e2e.ts');
      expect(tree.files).toContain('/e2e/tests/my-test.test.ts');
    });

    void it('should create file with route', async () => {
      const route = 'home';
      const tree = await buildTestingTree('e2e', 'single', {
        name: 'myTest',
        route,
      });
      expect(tree.files).toContain('/e2e/tests/my-test.e2e.ts');
      expect(tree.readContent('/e2e/tests/my-test.e2e.ts')).toContain(
        `setupBrowserHooks('${route}');`
      );
    });

    void it('should create with route with starting slash', async () => {
      const route = '/home';
      const tree = await buildTestingTree('e2e', 'single', {
        name: 'myTest',
        route,
      });
      expect(tree.files).toContain('/e2e/tests/my-test.e2e.ts');
      expect(tree.readContent('/e2e/tests/my-test.e2e.ts')).toContain(
        `setupBrowserHooks('home');`
      );
    });
  });

  void describe('Multi projects', () => {
    void it('should create default file', async () => {
      const tree = await buildTestingTree('e2e', 'multi', {
        name: 'myTest',
      });
      expect(tree.files).toContain(
        getMultiApplicationFile('e2e/tests/my-test.e2e.ts')
      );
      expect(tree.files).not.toContain(
        getMultiApplicationFile('e2e/tests/my-test.test.ts')
      );
    });

    void it('should create Node file', async () => {
      const tree = await buildTestingTree('e2e', 'multi', {
        name: 'myTest',
        testRunner: 'node',
      });
      expect(tree.files).not.toContain(
        getMultiApplicationFile('e2e/tests/my-test.e2e.ts')
      );
      expect(tree.files).toContain(
        getMultiApplicationFile('e2e/tests/my-test.test.ts')
      );
    });

    void it('should create file with route', async () => {
      const route = 'home';
      const tree = await buildTestingTree('e2e', 'multi', {
        name: 'myTest',
        route,
      });
      expect(tree.files).toContain(
        getMultiApplicationFile('e2e/tests/my-test.e2e.ts')
      );
      expect(
        tree.readContent(getMultiApplicationFile('e2e/tests/my-test.e2e.ts'))
      ).toContain(`setupBrowserHooks('${route}');`);
    });

    void it('should create with route with starting slash', async () => {
      const route = '/home';
      const tree = await buildTestingTree('e2e', 'multi', {
        name: 'myTest',
        route,
      });
      expect(tree.files).toContain(
        getMultiApplicationFile('e2e/tests/my-test.e2e.ts')
      );
      expect(
        tree.readContent(getMultiApplicationFile('e2e/tests/my-test.e2e.ts'))
      ).toContain(`setupBrowserHooks('home');`);
    });
  });
});
