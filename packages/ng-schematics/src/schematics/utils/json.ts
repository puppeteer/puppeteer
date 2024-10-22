/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {SchematicsException, type Tree} from '@angular-devkit/schematics';

import type {AngularJson, AngularProject} from './types.js';

export function getJsonFileAsObject(
  tree: Tree,
  path: string
): Record<string, unknown> {
  try {
    const buffer = tree.read(path) as Buffer;
    const content = buffer.toString();
    return JSON.parse(content);
  } catch {
    throw new SchematicsException(`Unable to retrieve file at ${path}.`);
  }
}

export function getObjectAsJson(object: Record<string, unknown>): string {
  return JSON.stringify(object, null, 2);
}

export function getAngularConfig(tree: Tree): AngularJson {
  return getJsonFileAsObject(tree, './angular.json') as unknown as AngularJson;
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
