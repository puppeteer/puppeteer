import expect from 'expect';

import {
  buildTestingTree,
  getMultiProjectFile,
  setupHttpHooks,
} from './utils.js';

describe('@puppeteer/ng-schematics: test', () => {
  setupHttpHooks();

  describe('Single Project', () => {
    it('should create default file', async () => {
      const tree = await buildTestingTree('test', 'single', {
        name: 'myTest',
      });
      expect(tree.files).toContain('/e2e/tests/my-test.e2e.ts');
      expect(tree.files).not.toContain('/e2e/tests/my-test.test.ts');
    });

    it('should create Node file', async () => {
      const tree = await buildTestingTree('test', 'single', {
        name: 'myTest',
        testRunner: 'node',
      });
      expect(tree.files).not.toContain('/e2e/tests/my-test.e2e.ts');
      expect(tree.files).toContain('/e2e/tests/my-test.test.ts');
    });
  });

  describe('Multi projects', () => {
    it('should create default file', async () => {
      const tree = await buildTestingTree('test', 'multi', {
        name: 'myTest',
      });
      expect(tree.files).toContain(
        getMultiProjectFile('e2e/tests/my-test.e2e.ts')
      );
      expect(tree.files).not.toContain(
        getMultiProjectFile('e2e/tests/my-test.test.ts')
      );
    });

    it('should create Node file', async () => {
      const tree = await buildTestingTree('test', 'multi', {
        name: 'myTest',
        testRunner: 'node',
      });
      expect(tree.files).not.toContain(
        getMultiProjectFile('e2e/tests/my-test.e2e.ts')
      );
      expect(tree.files).toContain(
        getMultiProjectFile('e2e/tests/my-test.test.ts')
      );
    });
  });
});
