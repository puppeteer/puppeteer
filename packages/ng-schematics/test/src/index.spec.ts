import expect from 'expect';
import sinon from 'sinon';
import https from 'https';
import {join} from 'path';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing/schematic-test-runner';
import {JsonObject} from '@angular-devkit/core';

const WORKSPACE_OPTIONS = {
  name: 'workspace',
  newProjectRoot: 'projects',
  version: '14.0.0',
};

const APPLICATION_OPTIONS = {
  name: 'sandbox',
};

function getProjectFile(file: string): string {
  return `/${WORKSPACE_OPTIONS.newProjectRoot}/${APPLICATION_OPTIONS.name}/${file}`;
}

function getPackageJson(tree: UnitTestTree): {
  scripts: Record<string, string>;
  devDependencies: string[];
} {
  const packageJson = tree.readJson('package.json') as JsonObject;
  return {
    scripts: packageJson['scripts'] as any,
    devDependencies: Object.keys(
      packageJson['devDependencies'] as Record<string, string>
    ),
  };
}

async function buildTestingTree(userOptions?: Record<string, any>) {
  const runner = new SchematicTestRunner(
    'schematics',
    join(__dirname, '../../lib/schematics/collection.json')
  );
  const options = {
    exportConfig: false,
    testingFramework: 'jasmine',
    ...userOptions,
  };
  let workingTree: UnitTestTree;

  // Build workspace
  workingTree = await runner
    .runExternalSchematicAsync(
      '@schematics/angular',
      'workspace',
      WORKSPACE_OPTIONS
    )
    .toPromise();
  // Build dummy application
  workingTree = await runner
    .runExternalSchematicAsync(
      '@schematics/angular',
      'application',
      APPLICATION_OPTIONS,
      workingTree
    )
    .toPromise();

  return await runner
    .runSchematicAsync('ng-add', options, workingTree)
    .toPromise();
}

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
    const {devDependencies} = getPackageJson(tree);

    expect(tree.files).toContain(getProjectFile('e2e/tsconfig.json'));
    expect(tree.files).toContain(getProjectFile('e2e/tests/app.e2e.ts'));
    expect(devDependencies).toContain('puppeteer');
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
    const {scripts, devDependencies} = getPackageJson(tree);

    expect(tree.files).toContain(getProjectFile('e2e/support/jasmine.json'));
    expect(tree.files).toContain(getProjectFile('e2e/helpers/babel.js'));
    expect(scripts['e2e']).toBe('jasmine --config=./e2e/support/jasmine.json');
    expect(devDependencies).toContain('jasmine');
    expect(devDependencies).toContain('@babel/core');
    expect(devDependencies).toContain('@babel/register');
    expect(devDependencies).toContain('@babel/preset-typescript');
  });

  it('should create Jest files and update "package.json"', async () => {
    const tree = await buildTestingTree({
      testingFramework: 'jest',
    });
    const {scripts, devDependencies} = getPackageJson(tree);

    expect(tree.files).toContain(getProjectFile('e2e/jest.config.js'));
    expect(scripts['e2e']).toBe('jest -c e2e/jest.config.js');
    expect(devDependencies).toContain('jest');
    expect(devDependencies).toContain('@types/jest');
    expect(devDependencies).toContain('ts-jest');
  });

  it('should create Jasmine files and update "package.json"', async () => {
    const tree = await buildTestingTree({
      testingFramework: 'mocha',
    });
    const {scripts, devDependencies} = getPackageJson(tree);

    expect(tree.files).toContain(getProjectFile('e2e/.mocharc.js'));
    expect(tree.files).toContain(getProjectFile('e2e/babel.js'));
    expect(scripts['e2e']).toBe('mocha --config=./e2e/.mocharc.js');
    expect(devDependencies).toContain('mocha');
    expect(devDependencies).toContain('@types/mocha');
    expect(devDependencies).toContain('@babel/core');
    expect(devDependencies).toContain('@babel/register');
    expect(devDependencies).toContain('@babel/preset-typescript');
  });
});
