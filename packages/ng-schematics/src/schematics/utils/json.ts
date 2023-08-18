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

import {SchematicsException, Tree} from '@angular-devkit/schematics';

import type {AngularJson, AngularProject} from './types.js';

export function getJsonFileAsObject(
  tree: Tree,
  path: string
): Record<string, any> {
  try {
    const buffer = tree.read(path) as Buffer;
    const content = buffer.toString();
    return JSON.parse(content);
  } catch {
    throw new SchematicsException(`Unable to retrieve file at ${path}.`);
  }
}

export function getObjectAsJson(object: Record<string, any>): string {
  return JSON.stringify(object, null, 2);
}

export function getAngularConfig(tree: Tree): AngularJson {
  return getJsonFileAsObject(tree, './angular.json') as AngularJson;
}

export function getApplicationProjects(
  tree: Tree
): Record<string, AngularProject> {
  const {projects} = getAngularConfig(tree);

  const applications: Record<string, AngularProject> = {};
  for (const key in projects) {
    const project = projects[key]!;
    if (project.projectType === 'application') {
      applications[key] = project;
    }
  }
  return applications;
}
