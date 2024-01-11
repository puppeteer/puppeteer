/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {relative, resolve} from 'path';

import {getSystemPath, normalize, strings} from '@angular-devkit/core';
import type {Rule} from '@angular-devkit/schematics';
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  url,
} from '@angular-devkit/schematics';

import type {AngularProject, TestRunner} from './types.js';

export interface FilesOptions {
  options: {
    testRunner: TestRunner;
    port: number;
    name?: string;
    exportConfig?: boolean;
    ext?: string;
    route?: string;
  };
  applyPath: string;
  relativeToWorkspacePath: string;
  movePath?: string;
}

export function addFilesToProjects(
  projects: Record<string, AngularProject>,
  options: FilesOptions
): Rule {
  return chain(
    Object.keys(projects).map(name => {
      return addFilesSingle(name, projects[name] as AngularProject, options);
    })
  );
}

export function addFilesSingle(
  name: string,
  project: AngularProject,
  {options, applyPath, movePath, relativeToWorkspacePath}: FilesOptions
): Rule {
  const projectPath = resolve(getSystemPath(normalize(project.root)));
  const workspacePath = resolve(getSystemPath(normalize('')));

  const relativeToWorkspace = relative(
    `${projectPath}${relativeToWorkspacePath}`,
    workspacePath
  );

  const baseUrl = getProjectBaseUrl(project, options.port);
  const tsConfigPath = getTsConfigPath(project);

  return mergeWith(
    apply(url(applyPath), [
      move(movePath ? `${project.root}${movePath}` : project.root),
      applyTemplates({
        ...options,
        ...strings,
        root: project.root ? `${project.root}/` : project.root,
        baseUrl,
        tsConfigPath,
        project: name,
        relativeToWorkspace,
      }),
    ])
  );
}

function getProjectBaseUrl(project: AngularProject, port: number): string {
  let options = {protocol: 'http', port, host: 'localhost'};

  if (project.architect?.serve?.options) {
    const projectOptions = project.architect?.serve?.options;
    const projectPort = port !== 4200 ? port : projectOptions?.port ?? port;
    options = {...options, ...projectOptions, port: projectPort};
    options.protocol = projectOptions.ssl ? 'https' : 'http';
  }

  return `${options.protocol}://${options.host}:${options.port}/`;
}

function getTsConfigPath(project: AngularProject): string {
  const filename = 'tsconfig.json';

  if (!project.root) {
    return `../${filename}`;
  }

  const nested = project.root
    .split('/')
    .map(() => {
      return '../';
    })
    .join('');

  // Prepend a single `../` as we put the test inside `e2e` folder
  return `../${nested}${filename}`;
}

export function addCommonFiles(
  projects: Record<string, AngularProject>,
  filesOptions: Omit<FilesOptions, 'applyPath' | 'relativeToWorkspacePath'>
): Rule {
  const options: FilesOptions = {
    ...filesOptions,
    applyPath: './files/common',
    relativeToWorkspacePath: `/`,
  };

  return addFilesToProjects(projects, options);
}

export function addFrameworkFiles(
  projects: Record<string, AngularProject>,
  filesOptions: Omit<FilesOptions, 'applyPath' | 'relativeToWorkspacePath'>
): Rule {
  const testRunner = filesOptions.options.testRunner;
  const options: FilesOptions = {
    ...filesOptions,
    applyPath: `./files/${testRunner}`,
    relativeToWorkspacePath: `/`,
  };

  return addFilesToProjects(projects, options);
}

export function hasE2ETester(
  projects: Record<string, AngularProject>
): boolean {
  return Object.values(projects).some((project: AngularProject) => {
    return Boolean(project.architect?.e2e);
  });
}

export function getNgCommandName(
  projects: Record<string, AngularProject>
): string {
  if (!hasE2ETester(projects)) {
    return 'e2e';
  }
  return 'puppeteer';
}
