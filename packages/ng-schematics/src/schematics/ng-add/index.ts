/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  chain,
  type Rule,
  type SchematicContext,
  type Tree,
} from '@angular-devkit/schematics';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import {of} from 'rxjs';
import {concatMap, map, scan} from 'rxjs/operators';

import {
  addCommonFiles as addCommonFilesHelper,
  addFrameworkFiles,
  getNgCommandName,
  hasE2ETester,
} from '../utils/files.js';
import {getApplicationProjects} from '../utils/json.js';
import {
  addPackageJsonDependencies,
  addPackageJsonScripts,
  getDependenciesFromOptions,
  getPackageLatestNpmVersion,
  DependencyType,
  type NodePackage,
  updateAngularJsonScripts,
} from '../utils/packages.js';
import {TestRunner, type SchematicsOptions} from '../utils/types.js';

const DEFAULT_PORT = 4200;

// You don't have to export the function as default. You can also have more than one rule
// factory per file.
export function ngAdd(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      addDependencies(options),
      addCommonFiles(options),
      addOtherFiles(options),
      updateScripts(),
      updateAngularConfig(options),
    ])(tree, context);
  };
}

function addDependencies(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding dependencies to "package.json"');
    const dependencies = getDependenciesFromOptions(options);

    return of(...dependencies).pipe(
      concatMap((packageName: string) => {
        return getPackageLatestNpmVersion(packageName);
      }),
      scan((array, nodePackage) => {
        array.push(nodePackage);
        return array;
      }, [] as NodePackage[]),
      map(packages => {
        context.logger.debug('Updating dependencies...');
        addPackageJsonDependencies(tree, packages, DependencyType.Dev);
        context.addTask(
          new NodePackageInstallTask({
            // Trigger Post-Install hooks to download the browser
            allowScripts: true,
          })
        );

        return tree;
      })
    );
  };
}

function updateScripts(): Rule {
  return (tree: Tree, context: SchematicContext): Tree => {
    context.logger.debug('Updating "package.json" scripts');
    const projects = getApplicationProjects(tree);
    const projectsKeys = Object.keys(projects);

    if (projectsKeys.length === 1) {
      const name = getNgCommandName(projects);
      const prefix = hasE2ETester(projects) ? `run ${projectsKeys[0]}:` : '';
      return addPackageJsonScripts(tree, [
        {
          name,
          script: `ng ${prefix}${name}`,
        },
      ]);
    }
    return tree;
  };
}

function addCommonFiles(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Puppeteer base files.');
    const projects = getApplicationProjects(tree);

    return addCommonFilesHelper(projects, {
      options: {
        ...options,
        port: DEFAULT_PORT,
        ext: options.testRunner === TestRunner.Node ? 'test' : 'e2e',
      },
    });
  };
}

function addOtherFiles(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Puppeteer additional files.');
    const projects = getApplicationProjects(tree);

    return addFrameworkFiles(projects, {
      options: {
        ...options,
        port: DEFAULT_PORT,
      },
    });
  };
}

function updateAngularConfig(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext): Tree => {
    context.logger.debug('Updating "angular.json".');

    return updateAngularJsonScripts(tree, options);
  };
}
