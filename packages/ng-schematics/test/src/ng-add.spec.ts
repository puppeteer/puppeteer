import https from 'https';

import expect from 'expect';
import sinon from 'sinon';

import {
  buildTestingTree,
  getAngularJsonScripts,
  getPackageJson,
  getProjectFile,
} from './utils.js';

describe('@puppeteer/ng-schematics: ng-add', () => {
  // Stop outgoing Request for version fetching
  before(() => {
    const httpsGetStub = sinon.stub(https, 'get');
    httpsGetStub.returns({
      on: (_: any, callback: () => void) => {
        callback();
      },
    } as any);
  });

  after(() => {
    sinon.restore();
  });

  it('should create base files and update to "package.json"', async () => {
    const tree = await buildTestingTree();
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
    const tree = await buildTestingTree({
      isDefaultTester: false,
    });
    const {scripts} = getPackageJson(tree);
    const {builder} = getAngularJsonScripts(tree, false);

    expect(scripts['puppeteer']).toBe('ng run sandbox:puppeteer');
    expect(builder).toBe('@puppeteer/ng-schematics:puppeteer');
  });

  it('should create Puppeteer config', async () => {
    const {files} = await buildTestingTree({
      exportConfig: true,
    });

    expect(files).toContain(getProjectFile('.puppeteerrc.cjs'));
  });

  it('should not create Puppeteer config', async () => {
    const {files} = await buildTestingTree({
      exportConfig: false,
    });

    expect(files).not.toContain(getProjectFile('.puppeteerrc.cjs'));
  });

  it('should create Jasmine files and update "package.json"', async () => {
    const tree = await buildTestingTree({
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
    const tree = await buildTestingTree({
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
    const tree = await buildTestingTree({
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

  it('should create Node files"', async () => {
    const tree = await buildTestingTree({
      testingFramework: 'node',
    });
    const {options} = getAngularJsonScripts(tree);

    expect(tree.files).toContain(getProjectFile('e2e/.gitignore'));
    expect(tree.files).not.toContain(getProjectFile('e2e/tests/app.e2e.ts'));
    expect(tree.files).toContain(getProjectFile('e2e/tests/app.test.ts'));
    expect(options['commands']).toEqual([
      [`tsc`, '-p', 'e2e/tsconfig.json'],
      ['node', '--test', 'e2e/'],
    ]);
  });
});
