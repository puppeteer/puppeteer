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

import {relative, resolve} from 'path';

import {getSystemPath, normalize, strings} from '@angular-devkit/core';
import {
  SchematicContext,
  Tree,
  apply,
  applyTemplates,
  chain,
  filter,
  mergeWith,
  move,
  url,
} from '@angular-devkit/schematics';

import {SchematicsOptions, TestingFramework} from './types.js';

export interface FilesOptions {
  projects: Record<string, any>;
  options: {
    testingFramework: TestingFramework;
    port: number;
    name?: string;
    exportConfig?: boolean;
    ext?: string;
  };
  applyPath: string;
  relativeToWorkspacePath: string;
  movePath?: string;
  filterPredicate?: (path: string) => boolean;
}

const PUPPETEER_CONFIG_TEMPLATE = '.puppeteerrc.cjs.template';

export function addFiles(
  tree: Tree,
  context: SchematicContext,
  {
    projects,
    options,
    applyPath,
    movePath,
    relativeToWorkspacePath,
    filterPredicate,
  }: FilesOptions
): any {
  return chain(
    Object.keys(projects).map(name => {
      const project = projects[name];
      const projectPath = resolve(getSystemPath(normalize(project.root)));
      const workspacePath = resolve(getSystemPath(normalize('')));

      const relativeToWorkspace = relative(
        `${projectPath}${relativeToWorkspacePath}`,
        workspacePath
      );

      const baseUrl = getProjectBaseUrl(project, options.port);

      return mergeWith(
        apply(url(applyPath), [
          filter(
            filterPredicate ??
              (() => {
                return true;
              })
          ),
          move(movePath ? `${project.root}${movePath}` : project.root),
          applyTemplates({
            ...options,
            ...strings,
            root: project.root ? `${project.root}/` : project.root,
            baseUrl,
            project: name,
            relativeToWorkspace,
          }),
        ])
      );
    })
  )(tree, context);
}

function getProjectBaseUrl(project: any, port: number): string {
  let options = {protocol: 'http', port, host: 'localhost'};

  if (project.architect?.serve?.options) {
    const projectOptions = project.architect?.serve?.options;
    const projectPort = port !== 4200 ? port : projectOptions?.port ?? port;
    options = {...options, ...projectOptions, port: projectPort};
    options.protocol = projectOptions.ssl ? 'https' : 'http';
  }

  return `${options.protocol}://${options.host}:${options.port}`;
}

export function addBaseFiles(
  tree: Tree,
  context: SchematicContext,
  filesOptions: Omit<FilesOptions, 'applyPath' | 'relativeToWorkspacePath'>
): any {
  const options: FilesOptions = {
    ...filesOptions,
    applyPath: './files/base',
    relativeToWorkspacePath: `/`,
    filterPredicate: path => {
      return path.includes(PUPPETEER_CONFIG_TEMPLATE) &&
        !filesOptions.options.exportConfig
        ? false
        : true;
    },
  };

  return addFiles(tree, context, options);
}

export function addFrameworkFiles(
  tree: Tree,
  context: SchematicContext,
  filesOptions: Omit<FilesOptions, 'applyPath' | 'relativeToWorkspacePath'>
): any {
  const testingFramework = filesOptions.options.testingFramework;
  const options: FilesOptions = {
    ...filesOptions,
    applyPath: `./files/${testingFramework}`,
    relativeToWorkspacePath: `/`,
  };

  return addFiles(tree, context, options);
}

export function getScriptFromOptions(options: SchematicsOptions): string[][] {
  switch (options.testingFramework) {
    case TestingFramework.Jasmine:
      return [[`jasmine`, '--config=./e2e/support/jasmine.json']];
    case TestingFramework.Jest:
      return [[`jest`, '-c', 'e2e/jest.config.js']];
    case TestingFramework.Mocha:
      return [[`mocha`, '--config=./e2e/.mocharc.js']];
    case TestingFramework.Node:
      return [
        [`tsc`, '-p', 'e2e/tsconfig.json'],
        ['node', '--test', '--test-reporter', 'spec', 'e2e/build/'],
      ];
  }
}

export function getNgCommandName(options: SchematicsOptions): string {
  if (options.isDefaultTester) {
    return 'e2e';
  }
  return 'puppeteer';
}
