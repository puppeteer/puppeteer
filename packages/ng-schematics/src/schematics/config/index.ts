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

import {addFilesSingle} from '../utils/files.js';
import {TestRunner, AngularProject} from '../utils/types.js';

// You don't have to export the function as default. You can also have more than one rule
// factory per file.
export function config(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([addPuppeteerConfig()])(tree, context);
  };
}

function addPuppeteerConfig(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Puppeteer config file.');

    return addFilesSingle(tree, context, '', {root: ''} as AngularProject, {
      // No-op here to fill types
      options: {
        testRunner: TestRunner.Jasmine,
        port: 4200,
      },
      applyPath: './files',
      relativeToWorkspacePath: `/`,
    });
  };
}
