import expect from 'expect';

import {
  buildTestingTree,
  getAngularJsonScripts,
  getMultiProjectFile,
  getPackageJson,
  setupHttpHooks,
} from './utils.js';

describe('@puppeteer/ng-schematics: ng-add', () => {
  setupHttpHooks();

  describe('Single Project', () => {
    it('should create base files and update to "package.json"', async () => {
      const tree = await buildTestingTree('ng-add');
      const {devDependencies, scripts} = getPackageJson(tree);
      const {builder, configurations} = getAngularJsonScripts(tree);

      expect(tree.files).toContain('/e2e/tsconfig.json');
      expect(tree.files).toContain('/e2e/tests/app.e2e.ts');
      expect(tree.files).toContain('/e2e/tests/utils.ts');
      expect(devDependencies).toContain('puppeteer');
      expect(scripts['e2e']).toBe('ng e2e');
      expect(builder).toBe('@puppeteer/ng-schematics:puppeteer');
      expect(configurations).toEqual({
        production: {
          devServerTarget: 'sandbox:serve:production',
        },
      });
    });
    it('should update create proper "ng" command for non default tester', async () => {
      const tree = await buildTestingTree('ng-add', 'single', {
        isDefaultTester: false,
      });
      const {scripts} = getPackageJson(tree);
      const {builder} = getAngularJsonScripts(tree, false);

      expect(scripts['puppeteer']).toBe('ng run sandbox:puppeteer');
      expect(builder).toBe('@puppeteer/ng-schematics:puppeteer');
    });
    it('should create Puppeteer config', async () => {
      const {files} = await buildTestingTree('ng-add', 'single', {
        exportConfig: true,
      });

      expect(files).toContain('/.puppeteerrc.cjs');
    });
    it('should not create Puppeteer config', async () => {
      const {files} = await buildTestingTree('ng-add', 'single', {
        exportConfig: false,
      });

      expect(files).not.toContain('/.puppeteerrc.cjs');
    });
    it('should create Jasmine files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'single', {
        testingFramework: 'jasmine',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      expect(tree.files).toContain('/e2e/support/jasmine.json');
      expect(tree.files).toContain('/e2e/helpers/babel.js');
      expect(devDependencies).toContain('jasmine');
      expect(devDependencies).toContain('@babel/core');
      expect(devDependencies).toContain('@babel/register');
      expect(devDependencies).toContain('@babel/preset-typescript');
      expect(options['commands']).toEqual([
        [`./node_modules/.bin/jasmine`, '--config=./e2e/support/jasmine.json'],
      ]);
    });
    it('should create Jest files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'single', {
        testingFramework: 'jest',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      expect(tree.files).toContain('/e2e/jest.config.js');
      expect(devDependencies).toContain('jest');
      expect(devDependencies).toContain('@types/jest');
      expect(devDependencies).toContain('ts-jest');
      expect(options['commands']).toEqual([
        [`./node_modules/.bin/jest`, '-c', 'e2e/jest.config.js'],
      ]);
    });
    it('should create Mocha files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'single', {
        testingFramework: 'mocha',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      expect(tree.files).toContain('/e2e/.mocharc.js');
      expect(tree.files).toContain('/e2e/babel.js');
      expect(devDependencies).toContain('mocha');
      expect(devDependencies).toContain('@types/mocha');
      expect(devDependencies).toContain('@babel/core');
      expect(devDependencies).toContain('@babel/register');
      expect(devDependencies).toContain('@babel/preset-typescript');
      expect(options['commands']).toEqual([
        [`./node_modules/.bin/mocha`, '--config=./e2e/.mocharc.js'],
      ]);
    });
    it('should create Node files', async () => {
      const tree = await buildTestingTree('ng-add', 'single', {
        testingFramework: 'node',
      });
      const {options} = getAngularJsonScripts(tree);

      expect(tree.files).toContain('/e2e/.gitignore');
      expect(tree.files).not.toContain('/e2e/tests/app.e2e.ts');
      expect(tree.files).toContain('/e2e/tests/app.test.ts');
      expect(options['commands']).toEqual([
        [`./node_modules/.bin/tsc`, '-p', 'e2e/tsconfig.json'],
        ['node', '--test', '--test-reporter', 'spec', 'e2e/build/'],
      ]);
    });
    it('should not create port option', async () => {
      const tree = await buildTestingTree('ng-add');

      const {options} = getAngularJsonScripts(tree);
      expect(options['port']).toBeUndefined();
    });
    it('should create port option when specified', async () => {
      const port = 8080;
      const tree = await buildTestingTree('ng-add', 'single', {
        port,
      });

      const {options} = getAngularJsonScripts(tree);
      expect(options['port']).toBe(port);
    });
  });

  describe('Multi projects', () => {
    it('should create base files and update to "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'multi');
      const {devDependencies, scripts} = getPackageJson(tree);
      const {builder, configurations} = getAngularJsonScripts(tree);

      expect(tree.files).toContain(getMultiProjectFile('e2e/tsconfig.json'));
      expect(tree.files).toContain(getMultiProjectFile('e2e/tests/app.e2e.ts'));
      expect(tree.files).toContain(getMultiProjectFile('e2e/tests/utils.ts'));
      expect(devDependencies).toContain('puppeteer');
      expect(scripts['e2e']).toBe('ng e2e');
      expect(builder).toBe('@puppeteer/ng-schematics:puppeteer');
      expect(configurations).toEqual({
        production: {
          devServerTarget: 'sandbox:serve:production',
        },
      });
    });
    it('should update create proper "ng" command for non default tester', async () => {
      const tree = await buildTestingTree('ng-add', 'multi', {
        isDefaultTester: false,
      });
      const {scripts} = getPackageJson(tree);
      const {builder} = getAngularJsonScripts(tree, false);

      expect(scripts['puppeteer']).toBe('ng run sandbox:puppeteer');
      expect(builder).toBe('@puppeteer/ng-schematics:puppeteer');
    });
    it('should create Puppeteer config', async () => {
      const {files} = await buildTestingTree('ng-add', 'multi', {
        exportConfig: true,
      });

      expect(files).toContain('/.puppeteerrc.cjs');
    });
    it('should not create Puppeteer config', async () => {
      const {files} = await buildTestingTree('ng-add', 'multi', {
        exportConfig: false,
      });

      expect(files).not.toContain(getMultiProjectFile('.puppeteerrc.cjs'));
      expect(files).not.toContain('/.puppeteerrc.cjs');
    });
    it('should create Jasmine files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'multi', {
        testingFramework: 'jasmine',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      expect(tree.files).toContain(
        getMultiProjectFile('e2e/support/jasmine.json')
      );
      expect(tree.files).toContain(getMultiProjectFile('e2e/helpers/babel.js'));
      expect(devDependencies).toContain('jasmine');
      expect(devDependencies).toContain('@babel/core');
      expect(devDependencies).toContain('@babel/register');
      expect(devDependencies).toContain('@babel/preset-typescript');
      expect(options['commands']).toEqual([
        [
          `../../node_modules/.bin/jasmine`,
          '--config=./e2e/support/jasmine.json',
        ],
      ]);
    });
    it('should create Jest files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'multi', {
        testingFramework: 'jest',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      expect(tree.files).toContain(getMultiProjectFile('e2e/jest.config.js'));
      expect(devDependencies).toContain('jest');
      expect(devDependencies).toContain('@types/jest');
      expect(devDependencies).toContain('ts-jest');
      expect(options['commands']).toEqual([
        [`../../node_modules/.bin/jest`, '-c', 'e2e/jest.config.js'],
      ]);
    });
    it('should create Mocha files and update "package.json"', async () => {
      const tree = await buildTestingTree('ng-add', 'multi', {
        testingFramework: 'mocha',
      });
      const {devDependencies} = getPackageJson(tree);
      const {options} = getAngularJsonScripts(tree);

      expect(tree.files).toContain(getMultiProjectFile('e2e/.mocharc.js'));
      expect(tree.files).toContain(getMultiProjectFile('e2e/babel.js'));
      expect(devDependencies).toContain('mocha');
      expect(devDependencies).toContain('@types/mocha');
      expect(devDependencies).toContain('@babel/core');
      expect(devDependencies).toContain('@babel/register');
      expect(devDependencies).toContain('@babel/preset-typescript');
      expect(options['commands']).toEqual([
        [`../../node_modules/.bin/mocha`, '--config=./e2e/.mocharc.js'],
      ]);
    });
    it('should create Node files', async () => {
      const tree = await buildTestingTree('ng-add', 'multi', {
        testingFramework: 'node',
      });
      const {options} = getAngularJsonScripts(tree);

      expect(tree.files).toContain(getMultiProjectFile('e2e/.gitignore'));
      expect(tree.files).not.toContain(
        getMultiProjectFile('e2e/tests/app.e2e.ts')
      );
      expect(tree.files).toContain(
        getMultiProjectFile('e2e/tests/app.test.ts')
      );
      expect(options['commands']).toEqual([
        [`../../node_modules/.bin/tsc`, '-p', 'e2e/tsconfig.json'],
        ['node', '--test', '--test-reporter', 'spec', 'e2e/build/'],
      ]);
    });
    it('should not create port option', async () => {
      const tree = await buildTestingTree('ng-add');

      const {options} = getAngularJsonScripts(tree);
      expect(options['port']).toBeUndefined();
    });
    it('should create port option when specified', async () => {
      const port = 8080;
      const tree = await buildTestingTree('ng-add', 'multi', {
        port,
      });

      const {options} = getAngularJsonScripts(tree);
      expect(options['port']).toBe(port);
    });
  });
});
