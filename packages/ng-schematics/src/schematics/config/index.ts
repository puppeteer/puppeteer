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

import {addFilesSingle} from '../utils/files.js';
import {TestRunner, type AngularProject} from '../utils/types.js';

// You don't have to export the function as default. You can also have more than one rule
// factory per file.
export function config(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([addPuppeteerConfig()])(tree, context);
  };
}

function addPuppeteerConfig(): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Puppeteer config file.');

    return addFilesSingle('', {root: ''} as AngularProject, {
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
