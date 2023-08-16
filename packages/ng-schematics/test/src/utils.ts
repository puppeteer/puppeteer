import https from 'https';
import {join} from 'path';

import {JsonObject} from '@angular-devkit/core';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import sinon from 'sinon';

const WORKSPACE_OPTIONS = {
  name: 'workspace',
  newProjectRoot: 'projects',
  version: '14.0.0',
};

const MULTI_APPLICATION_OPTIONS = {
  name: 'sandbox',
};

const SINGLE_APPLICATION_OPTIONS = {
  name: 'sandbox',
  directory: '.',
  createApplication: true,
  version: '14.0.0',
};

export function setupHttpHooks(): void {
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
}

export function getAngularJsonScripts(
  tree: UnitTestTree,
  isDefault = true
): {
  builder: string;
  configurations: Record<string, any>;
  options: Record<string, any>;
} {
  const angularJson = tree.readJson('angular.json') as any;
  const e2eScript = isDefault ? 'e2e' : 'puppeteer';
  return angularJson['projects']?.[SINGLE_APPLICATION_OPTIONS.name]?.[
    'architect'
  ][e2eScript];
}

export function getPackageJson(tree: UnitTestTree): {
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

export function getMultiProjectFile(file: string): string {
  return `/${WORKSPACE_OPTIONS.newProjectRoot}/${MULTI_APPLICATION_OPTIONS.name}/${file}`;
}

export async function buildTestingTree(
  command: 'ng-add' | 'test' | 'config',
  type: 'single' | 'multi' = 'single',
  userOptions?: Record<string, any>
): Promise<UnitTestTree> {
  const runner = new SchematicTestRunner(
    'schematics',
    join(__dirname, '../../lib/schematics/collection.json')
  );
  const options = {
    testingFramework: 'jasmine',
    ...userOptions,
  };
  let workingTree: UnitTestTree;

  // Build workspace
  if (type === 'single') {
    workingTree = await runner.runExternalSchematic(
      '@schematics/angular',
      'ng-new',
      SINGLE_APPLICATION_OPTIONS
    );
  } else {
    // Build workspace
    workingTree = await runner.runExternalSchematic(
      '@schematics/angular',
      'workspace',
      WORKSPACE_OPTIONS
    );
    // Build dummy application
    workingTree = await runner.runExternalSchematic(
      '@schematics/angular',
      'application',
      MULTI_APPLICATION_OPTIONS,
      workingTree
    );
  }
  workingTree;

  if (command !== 'ng-add') {
    // We want to create update the proper files with `ng-add`
    // First else the angular.json will have wrong data
    workingTree = await runner.runSchematic('ng-add', options, workingTree);
  }

  return await runner.runSchematic(command, options, workingTree);
}

export async function runSchematic(
  tree: UnitTestTree,
  command: 'ng-add' | 'test',
  options?: Record<string, any>
): Promise<UnitTestTree> {
  const runner = new SchematicTestRunner(
    'schematics',
    join(__dirname, '../../lib/schematics/collection.json')
  );
  return await runner.runSchematic(command, options, tree);
}
