/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {
  chain,
  type Rule,
  type SchematicContext,
  SchematicsException,
  type Tree,
} from '@angular-devkit/schematics';

import {addCommonFiles} from '../utils/files.js';
import {getApplicationProjects} from '../utils/json.js';
import {
  TestRunner,
  type SchematicsSpec,
  type AngularProject,
  type PuppeteerSchematicsConfig,
} from '../utils/types.js';

// You don't have to export the function as default. You can also have more than one rule
// factory per file.
export function e2e(userArgs: Record<string, string>): Rule {
  const options = parseUserTestArgs(userArgs);

  return (tree: Tree, context: SchematicContext) => {
    return chain([addE2EFile(options)])(tree, context);
  };
}

function parseUserTestArgs(userArgs: Record<string, string>): SchematicsSpec {
  const options: Partial<SchematicsSpec> = {
    ...userArgs,
  };
  if ('p' in userArgs) {
    options['project'] = userArgs['p'];
  }
  if ('n' in userArgs) {
    options['name'] = userArgs['n'];
  }
  if ('r' in userArgs) {
    options['route'] = userArgs['r'];
  }

  if (options['route'] && options['route'].startsWith('/')) {
    options['route'] = options['route'].substring(1);
  }

  return options as SchematicsSpec;
}

function findTestingOption<
  Property extends keyof PuppeteerSchematicsConfig['options'],
>(
  [name, project]: [string, AngularProject | undefined],
  property: Property
): PuppeteerSchematicsConfig['options'][Property] {
  if (!project) {
    throw new Error(`Project "${name}" not found.`);
  }

  const e2e = project.architect?.e2e;
  const puppeteer = project.architect?.puppeteer;
  const builder = '@puppeteer/ng-schematics:puppeteer';

  if (e2e?.builder === builder) {
    return e2e.options[property];
  } else if (puppeteer?.builder === builder) {
    return puppeteer.options[property];
  }

  throw new Error(`Can't find property "${property}" for project "${name}".`);
}

function addE2EFile(options: SchematicsSpec): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Spec file.');

    const projects = getApplicationProjects(tree);
    const projectNames = Object.keys(projects) as [string, ...string[]];
    const foundProject: [string, AngularProject | undefined] | undefined =
      projectNames.length === 1
        ? [projectNames[0], projects[projectNames[0]]]
        : Object.entries(projects).find(([name, project]) => {
            return options.project
              ? options.project === name
              : project.root === '';
          });
    if (!foundProject) {
      throw new SchematicsException(
        `Project not found! Please run "ng generate @puppeteer/ng-schematics:test <Test> <Project>"`
      );
    }

    const testRunner = findTestingOption(foundProject, 'testRunner');
    const port = findTestingOption(foundProject, 'port');

    context.logger.debug('Creating Spec file.');

    return addCommonFiles(
      tree,
      context,
      {[foundProject[0]]: foundProject[1]} as Record<string, AngularProject>,
      {
        options: {
          name: options.name,
          route: options.route,
          testRunner,
          // Node test runner does not support glob patterns
          // It looks for files `*.test.js`
          ext: testRunner === TestRunner.Node ? 'test' : 'e2e',
          port,
        },
      }
    );
  };
}
