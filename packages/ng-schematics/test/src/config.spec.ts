import expect from 'expect';

import {
  buildTestingTree,
  getMultiApplicationFile,
  setupHttpHooks,
} from './utils.js';

describe('@puppeteer/ng-schematics: config', () => {
  setupHttpHooks();

  describe('Single Project', () => {
    it('should create default file', async () => {
      const tree = await buildTestingTree('config', 'single');
      expect(tree.files).toContain('/.puppeteerrc.mjs');
    });
  });

  describe('Multi projects', () => {
    it('should create default file', async () => {
      const tree = await buildTestingTree('config', 'multi');
      expect(tree.files).toContain('/.puppeteerrc.mjs');
      expect(tree.files).not.toContain(
        getMultiApplicationFile('.puppeteerrc.mjs')
      );
    });
  });
});
