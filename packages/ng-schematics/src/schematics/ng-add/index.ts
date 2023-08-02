/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import {of} from 'rxjs';
import {concatMap, map, scan} from 'rxjs/operators';

import {
  addCommonFiles as addCommonFilesHelper,
  addFilesSingle,
  addFrameworkFiles,
  getNgCommandName,
} from '../utils/files.js';
import {getAngularConfig} from '../utils/json.js';
import {
  addPackageJsonDependencies,
  addPackageJsonScripts,
  getDependenciesFromOptions,
  getPackageLatestNpmVersion,
  DependencyType,
  type NodePackage,
  updateAngularJsonScripts,
} from '../utils/packages.js';
import {
  TestingFramework,
  type SchematicsOptions,
  AngularProject,
} from '../utils/types.js';

// You don't have to export the function as default. You can also have more than one rule
// factory per file.
export function ngAdd(userArgs: Record<string, string>): Rule {
  const options = parseUserAddArgs(userArgs);

  return (tree: Tree, context: SchematicContext) => {
    return chain([
      addDependencies(options),
      addPuppeteerConfig(options),
      addCommonFiles(options),
      addOtherFiles(options),
      updateScripts(options),
      updateAngularConfig(options),
    ])(tree, context);
  };
}

function parseUserAddArgs(userArgs: Record<string, string>): SchematicsOptions {
  const options: Partial<SchematicsOptions> = {
    ...userArgs,
  };
  if ('p' in userArgs) {
    options['port'] = Number(userArgs['p']);
  }
  if ('t' in userArgs) {
    options['testingFramework'] = userArgs['t'] as TestingFramework;
  }
  if ('c' in userArgs) {
    options['exportConfig'] =
      typeof userArgs['c'] === 'string'
        ? userArgs['c'] === 'true'
        : userArgs['c'];
  }
  if ('d' in userArgs) {
    options['isDefaultTester'] =
      typeof userArgs['d'] === 'string'
        ? userArgs['d'] === 'true'
        : userArgs['d'];
  }

  return options as SchematicsOptions;
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
        context.addTask(new NodePackageInstallTask());

        return tree;
      })
    );
  };
}

function updateScripts(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext): Tree => {
    context.logger.debug('Updating "package.json" scripts');
    const angularJson = getAngularConfig(tree);
    const projects = Object.keys(angularJson['projects']);

    if (projects.length === 1) {
      const name = getNgCommandName(options);
      const prefix = options.isDefaultTester ? '' : `run ${projects[0]}:`;
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

function addPuppeteerConfig(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Puppeteer config file.');

    if (options.exportConfig) {
      return addFilesSingle(tree, context, '', {root: ''} as AngularProject, {
        options: options,
        applyPath: './files/base',
        relativeToWorkspacePath: `/`,
      });
    }

    return tree;
  };
}

function addCommonFiles(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Puppeteer base files.');
    const {projects} = getAngularConfig(tree);

    return addCommonFilesHelper(tree, context, projects, {
      options: {
        ...options,
        ext:
          options.testingFramework === TestingFramework.Node ? 'test' : 'e2e',
      },
    });
  };
}

function addOtherFiles(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Puppeteer additional files.');
    const {projects} = getAngularConfig(tree);

    return addFrameworkFiles(tree, context, projects, {
      options,
    });
  };
}

function updateAngularConfig(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext): Tree => {
    context.logger.debug('Updating "angular.json".');

    return updateAngularJsonScripts(tree, options);
  };
}
