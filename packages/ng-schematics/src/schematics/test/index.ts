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
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';

import {addBaseFiles} from '../utils/files.js';
import {getAngularConfig} from '../utils/json.js';
import {
  TestingFramework,
  SchematicsSpec,
  SchematicsOptions,
  AngularProject,
} from '../utils/types.js';

// You don't have to export the function as default. You can also have more than one rule
// factory per file.
export function test(options: SchematicsSpec): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([addSpecFile(options)])(tree, context);
  };
}

function findTestingOption<Property extends keyof SchematicsOptions>(
  [name, project]: [string, AngularProject | undefined],
  property: Property
): SchematicsOptions[Property] {
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

function addSpecFile(options: SchematicsSpec): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Spec file.');

    const {projects} = getAngularConfig(tree);
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
        `Project not found! Please use -p to specify in which project to run.`
      );
    }

    const testingFramework = findTestingOption(
      foundProject,
      'testingFramework'
    );
    const port = findTestingOption(foundProject, 'port');

    context.logger.debug('Creating Spec file.');

    return addBaseFiles(tree, context, {
      projects: {[foundProject[0]]: foundProject[1]},
      options: {
        name: options.name,
        testingFramework,
        // Node test runner does not support glob patterns
        // It looks for files `*.test.js`
        ext: testingFramework === TestingFramework.Node ? 'test' : 'e2e',
        port,
      },
    });
  };
}
