/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import {assert} from 'chai';

import {
  MULTI_LIBRARY_OPTIONS,
  buildTestingTree,
  getAngularJsonScripts,
  getMultiApplicationFile,
  getMultiLibraryFile,
  getPackageJson,
  runSchematic,
  setupHttpHooks,
} from './utils.js';

void describe('@puppeteer/ng-schematics: ng-add', () => {
  setupHttpHooks();

  void describe('Single Project', () => {
    void it('should create base files and update to "package.json"', async () => {
      const tree = await buildTestingTree('ng-add');
      const {devDependencies, scripts} = getPackageJson(tree);
      const {builder, configurations} = getAngularJsonScripts(tree);

      assert.include(tree.files, '/e2e/tsconfig.json');
      assert.include(tree.files, '/e2e/tests/app.e2e.ts');
      assert.include(tree.files, '/e2e/tests/utils.ts');
      assert.include(devDependencies, 'puppeteer');
      assert.strictEqual(scripts['e2e'], 'ng e2e');
      assert.strictEqual(builder, '@puppeteer/ng-schematics:puppeteer');
      assert.deepEqual(configurations, {
        production: {
          devServerTarget: 'sandbox:serve:production',
        },
      });
    });
    void it('should update create proper "ng" command for non default tester', async () => {
      let tree = await buildTestingTree('ng-add', 'single');
      // Re-run schematic to have e2e populated
      tree = await runSchematic(tree, 'ng-add');
      const {scripts} = getPackageJson(tree);
      const {builder} = getAngularJsonScripts(tree, false);

      assert.strictEqual(scripts['puppeteer'], 'ng run sandbox:puppeteer');
      assert.strictEqual(builder, '@puppeteer/ng-schematics:puppeteer');
    });
    void it('should not create Puppeteer config', async () => {
      const {files} = await buildTestingTree('ng-add', 'single');

      assert.notInclude(files, '/.puppeteerrc.cjs');
    });
    void it('should create Jasmine files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'single', {
        testRunner: 'jasmine',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      assert.include(tree.files, '/e2e/jasmine.json');
      assert.include(devDependencies, 'jasmine');
      assert.include(devDependencies, '@types/jasmine');
      assert.strictEqual(options['testRunner'], 'jasmine');
    });
    void it('should create Jest files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'single', {
        testRunner: 'jest',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      assert.include(tree.files, '/e2e/jest.config.js');
      assert.include(devDependencies, 'jest');
      assert.include(devDependencies, '@types/jest');
      assert.strictEqual(options['testRunner'], 'jest');
    });
    void it('should create Mocha files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'single', {
        testRunner: 'mocha',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      assert.include(tree.files, '/e2e/.mocharc.cjs');
      assert.include(devDependencies, 'mocha');
      assert.include(devDependencies, '@types/mocha');
      assert.strictEqual(options['testRunner'], 'mocha');
    });
    void it('should create Node files', async () => {
      const tree = await buildTestingTree('ng-add', 'single', {
        testRunner: 'node',
      });
      const {options} = getAngularJsonScripts(tree);

      assert.include(tree.files, '/e2e/.gitignore');
      assert.notInclude(tree.files, '/e2e/tests/app.e2e.ts');
      assert.include(tree.files, '/e2e/tests/app.test.ts');
      assert.strictEqual(options['testRunner'], 'node');
    });
    void it('should create TypeScript files', async () => {
      const tree = await buildTestingTree('ng-add', 'single');
      const tsConfigPath = '/e2e/tsconfig.json';
      const tsConfig = tree.readJson(tsConfigPath);

      assert.include(tree.files, tsConfigPath);
      assert.containSubset(tsConfig, {
        extends: '../tsconfig.json',
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
        },
      });
    });
    void it('should not create port value', async () => {
      const tree = await buildTestingTree('ng-add');

      const {options} = getAngularJsonScripts(tree);
      assert.isUndefined(options['port']);
    });
  });

  void describe('Multi projects Application', () => {
    void it('should create base files and update to "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'multi');
      const {devDependencies, scripts} = getPackageJson(tree);
      const {builder, configurations} = getAngularJsonScripts(tree);

      assert.include(tree.files, getMultiApplicationFile('e2e/tsconfig.json'));
      assert.include(
        tree.files,
        getMultiApplicationFile('e2e/tests/app.e2e.ts'),
      );
      assert.include(tree.files, getMultiApplicationFile('e2e/tests/utils.ts'));
      assert.include(devDependencies, 'puppeteer');
      assert.strictEqual(scripts['e2e'], 'ng e2e');
      assert.strictEqual(builder, '@puppeteer/ng-schematics:puppeteer');
      assert.deepEqual(configurations, {
        production: {
          devServerTarget: 'sandbox:serve:production',
        },
      });
    });
    void it('should update create proper "ng" command for non default tester', async () => {
      let tree = await buildTestingTree('ng-add', 'multi');
      // Re-run schematic to have e2e populated
      tree = await runSchematic(tree, 'ng-add');
      const {scripts} = getPackageJson(tree);
      const {builder} = getAngularJsonScripts(tree, false);

      assert.strictEqual(scripts['puppeteer'], 'ng run sandbox:puppeteer');
      assert.strictEqual(builder, '@puppeteer/ng-schematics:puppeteer');
    });
    void it('should not create Puppeteer config', async () => {
      const {files} = await buildTestingTree('ng-add', 'multi');

      assert.notInclude(files, getMultiApplicationFile('.puppeteerrc.cjs'));
      assert.notInclude(files, '/.puppeteerrc.cjs');
    });
    void it('should create Jasmine files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'multi', {
        testRunner: 'jasmine',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      assert.include(tree.files, getMultiApplicationFile('e2e/jasmine.json'));
      assert.include(devDependencies, 'jasmine');
      assert.include(devDependencies, '@types/jasmine');
      assert.strictEqual(options['testRunner'], 'jasmine');
    });
    void it('should create Jest files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'multi', {
        testRunner: 'jest',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      assert.include(tree.files, getMultiApplicationFile('e2e/jest.config.js'));
      assert.include(devDependencies, 'jest');
      assert.include(devDependencies, '@types/jest');
      assert.strictEqual(options['testRunner'], 'jest');
    });
    void it('should create Mocha files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'multi', {
        testRunner: 'mocha',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      assert.include(tree.files, getMultiApplicationFile('e2e/.mocharc.cjs'));
      assert.include(devDependencies, 'mocha');
      assert.include(devDependencies, '@types/mocha');
      assert.strictEqual(options['testRunner'], 'mocha');
    });
    void it('should create Node files', async () => {
      const tree = await buildTestingTree('ng-add', 'multi', {
        testRunner: 'node',
      });
      const {options} = getAngularJsonScripts(tree);

      assert.include(tree.files, getMultiApplicationFile('e2e/.gitignore'));
      assert.notInclude(
        tree.files,
        getMultiApplicationFile('e2e/tests/app.e2e.ts'),
      );
      assert.include(
        tree.files,
        getMultiApplicationFile('e2e/tests/app.test.ts'),
      );
      assert.strictEqual(options['testRunner'], 'node');
    });
    void it('should create TypeScript files', async () => {
      const tree = await buildTestingTree('ng-add', 'multi');
      const tsConfigPath = getMultiApplicationFile('e2e/tsconfig.json');
      const tsConfig = tree.readJson(tsConfigPath);

      assert.include(tree.files, tsConfigPath);
      assert.containSubset(tsConfig, {
        extends: '../../../tsconfig.json',
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
        },
      });
    });
    void it('should not create port value', async () => {
      const tree = await buildTestingTree('ng-add');

      const {options} = getAngularJsonScripts(tree);
      assert.isUndefined(options['port']);
    });
  });

  void describe('Multi projects Library', () => {
    void it('should create base files and update to "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'multi');
      const config = getAngularJsonScripts(
        tree,
        true,
        MULTI_LIBRARY_OPTIONS.name,
      );

      assert.notInclude(tree.files, getMultiLibraryFile('e2e/tsconfig.json'));
      assert.notInclude(
        tree.files,
        getMultiLibraryFile('e2e/tests/app.e2e.ts'),
      );
      assert.notInclude(tree.files, getMultiLibraryFile('e2e/tests/utils.ts'));
      assert.isUndefined(config);
    });

    void it('should not create Puppeteer config', async () => {
      const {files} = await buildTestingTree('ng-add', 'multi');

      assert.notInclude(files, getMultiLibraryFile('.puppeteerrc.cjs'));
      assert.notInclude(files, '/.puppeteerrc.cjs');
    });
  });
});
