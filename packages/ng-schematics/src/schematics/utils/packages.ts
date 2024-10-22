/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {get} from 'https';

import type {Tree} from '@angular-devkit/schematics';

import {getNgCommandName} from './files.js';
import {
  getAngularConfig,
  getApplicationProjects,
  getJsonFileAsObject,
  getObjectAsJson,
} from './json.js';
import {type SchematicsOptions, TestRunner} from './types.js';
export interface NodePackage {
  name: string;
  version: string;
}
export interface NodeScripts {
  name: string;
  script: string;
}

export enum DependencyType {
  Default = 'dependencies',
  Dev = 'devDependencies',
  Peer = 'peerDependencies',
  Optional = 'optionalDependencies',
}

export function getPackageLatestNpmVersion(name: string): Promise<NodePackage> {
  return new Promise(resolve => {
    let version = 'latest';

    return get(`https://registry.npmjs.org/${name}`, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          version = response?.['dist-tags']?.latest ?? version;
        } catch {
        } finally {
          resolve({
            name,
            version,
          });
        }
      });
    }).on('error', () => {
      resolve({
        name,
        version,
      });
    });
  });
}

function updateJsonValues(
  json: Record<string, any>,
  target: string,
  updates: Array<{name: string; value: any}>,
  overwrite = false,
) {
  updates.forEach(({name, value}) => {
    if (!json[target][name] || overwrite) {
      json[target] = {
        ...json[target],
        [name]: value,
      };
    }
  });
}

export function addPackageJsonDependencies(
  tree: Tree,
  packages: NodePackage[],
  type: DependencyType,
  overwrite?: boolean,
  fileLocation = './package.json',
): Tree {
  const packageJson = getJsonFileAsObject(tree, fileLocation);

  updateJsonValues(
    packageJson,
    type,
    packages.map(({name, version}) => {
      return {name, value: version};
    }),
    overwrite,
  );

  tree.overwrite(fileLocation, getObjectAsJson(packageJson));

  return tree;
}

export function getDependenciesFromOptions(
  options: SchematicsOptions,
): string[] {
  const dependencies = ['puppeteer'];

  switch (options.testRunner) {
    case TestRunner.Jasmine:
      dependencies.push('jasmine');
      break;
    case TestRunner.Jest:
      dependencies.push('jest', '@types/jest');
      break;
    case TestRunner.Mocha:
      dependencies.push('mocha', '@types/mocha');
      break;
    case TestRunner.Node:
      dependencies.push('@types/node');
      break;
  }

  return dependencies;
}

export function addPackageJsonScripts(
  tree: Tree,
  scripts: NodeScripts[],
  overwrite?: boolean,
  fileLocation = './package.json',
): Tree {
  const packageJson = getJsonFileAsObject(tree, fileLocation);

  updateJsonValues(
    packageJson,
    'scripts',
    scripts.map(({name, script}) => {
      return {name, value: script};
    }),
    overwrite,
  );

  tree.overwrite(fileLocation, getObjectAsJson(packageJson));

  return tree;
}

export function updateAngularJsonScripts(
  tree: Tree,
  options: SchematicsOptions,
  overwrite = true,
): Tree {
  const angularJson = getAngularConfig(tree);
  const projects = getApplicationProjects(tree);
  const name = getNgCommandName(projects);

  Object.keys(projects).forEach(project => {
    const e2eScript = [
      {
        name,
        value: {
          builder: '@puppeteer/ng-schematics:puppeteer',
          options: {
            devServerTarget: `${project}:serve`,
            testRunner: options.testRunner,
          },
          configurations: {
            production: {
              devServerTarget: `${project}:serve:production`,
            },
          },
        },
      },
    ];

    updateJsonValues(
      angularJson['projects'][project]!,
      'architect',
      e2eScript,
      overwrite,
    );
  });

  tree.overwrite('./angular.json', getObjectAsJson(angularJson as any));

  return tree;
}
