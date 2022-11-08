import expect from 'expect';
import {join} from 'path';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing/schematic-test-runner';

const WORKSPACE_OPTIONS = {
  name: 'workspace',
  newProjectRoot: 'projects',
  version: '14.0.0',
};

const APPLICATION_OPTIONS = {
  name: 'sandbox',
};

function getProjectFile(file: string): string {
  return `/projects/sandbox/${file}`;
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

describe('puppeteer-schematics: ng-add', () => {
  it('should create base files', async () => {
    const {files} = await buildTestingTree();

    expect(files).toContain(getProjectFile('e2e/tsconfig.json'));
    expect(files).toContain(getProjectFile('e2e/tests/app.e2e.ts'));
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

  it('should not create Jasmine files', async () => {
    const {files} = await buildTestingTree({
      testingFramework: 'jasmine',
    });

    expect(files).toContain(getProjectFile('e2e/support/jasmine.json'));
    expect(files).toContain(getProjectFile('e2e/helpers/babel.js'));
  });
});
