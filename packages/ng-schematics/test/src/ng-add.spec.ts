import expect from 'expect';

import {
  buildTestingTree,
  getAngularJsonScripts,
  getPackageJson,
  getProjectFile,
  setupHttpHooks,
} from './utils.js';

describe('@puppeteer/ng-schematics: ng-add', () => {
  setupHttpHooks();

  it('should create base files and update to "package.json"', async () => {
    const tree = await buildTestingTree('ng-add');
    const {devDependencies, scripts} = getPackageJson(tree);
    const {builder, configurations} = getAngularJsonScripts(tree);

    expect(tree.files).toContain(getProjectFile('e2e/tsconfig.json'));
    expect(tree.files).toContain(getProjectFile('e2e/tests/app.e2e.ts'));
    expect(tree.files).toContain(getProjectFile('e2e/tests/utils.ts'));
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
    const tree = await buildTestingTree('ng-add', {
      isDefaultTester: false,
    });
    const {scripts} = getPackageJson(tree);
    const {builder} = getAngularJsonScripts(tree, false);

    expect(scripts['puppeteer']).toBe('ng run sandbox:puppeteer');
    expect(builder).toBe('@puppeteer/ng-schematics:puppeteer');
  });

  it('should create Puppeteer config', async () => {
    const {files} = await buildTestingTree('ng-add', {
      exportConfig: true,
    });

    expect(files).toContain(getProjectFile('.puppeteerrc.cjs'));
  });

  it('should not create Puppeteer config', async () => {
    const {files} = await buildTestingTree('ng-add', {
      exportConfig: false,
    });

    expect(files).not.toContain(getProjectFile('.puppeteerrc.cjs'));
  });

  it('should create Jasmine files and update "package.json"', async () => {
    const tree = await buildTestingTree('ng-add', {
      testingFramework: 'jasmine',
    });
    const {devDependencies} = getPackageJson(tree);
    const {options} = getAngularJsonScripts(tree);

    expect(tree.files).toContain(getProjectFile('e2e/support/jasmine.json'));
    expect(tree.files).toContain(getProjectFile('e2e/helpers/babel.js'));
    expect(devDependencies).toContain('jasmine');
    expect(devDependencies).toContain('@babel/core');
    expect(devDependencies).toContain('@babel/register');
    expect(devDependencies).toContain('@babel/preset-typescript');
    expect(options['commands']).toEqual([
      [`jasmine`, '--config=./e2e/support/jasmine.json'],
    ]);
  });

  it('should create Jest files and update "package.json"', async () => {
    const tree = await buildTestingTree('ng-add', {
      testingFramework: 'jest',
    });
    const {devDependencies} = getPackageJson(tree);
    const {options} = getAngularJsonScripts(tree);

    expect(tree.files).toContain(getProjectFile('e2e/jest.config.js'));
    expect(devDependencies).toContain('jest');
    expect(devDependencies).toContain('@types/jest');
    expect(devDependencies).toContain('ts-jest');
    expect(options['commands']).toEqual([[`jest`, '-c', 'e2e/jest.config.js']]);
  });

  it('should create Mocha files and update "package.json"', async () => {
    const tree = await buildTestingTree('ng-add', {
      testingFramework: 'mocha',
    });
    const {devDependencies} = getPackageJson(tree);
    const {options} = getAngularJsonScripts(tree);

    expect(tree.files).toContain(getProjectFile('e2e/.mocharc.js'));
    expect(tree.files).toContain(getProjectFile('e2e/babel.js'));
    expect(devDependencies).toContain('mocha');
    expect(devDependencies).toContain('@types/mocha');
    expect(devDependencies).toContain('@babel/core');
    expect(devDependencies).toContain('@babel/register');
    expect(devDependencies).toContain('@babel/preset-typescript');
    expect(options['commands']).toEqual([
      [`mocha`, '--config=./e2e/.mocharc.js'],
    ]);
  });

  it('should create Node files', async () => {
    const tree = await buildTestingTree('ng-add', {
      testingFramework: 'node',
    });
    const {options} = getAngularJsonScripts(tree);

    expect(tree.files).toContain(getProjectFile('e2e/.gitignore'));
    expect(tree.files).not.toContain(getProjectFile('e2e/tests/app.e2e.ts'));
    expect(tree.files).toContain(getProjectFile('e2e/tests/app.test.ts'));
    expect(options['commands']).toEqual([
      [`tsc`, '-p', 'e2e/tsconfig.json'],
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
    const tree = await buildTestingTree('ng-add', {
      port,
    });

    const {options} = getAngularJsonScripts(tree);
    expect(options['port']).toBe(port);
  });
});
