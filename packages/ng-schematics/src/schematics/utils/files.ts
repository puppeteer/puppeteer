import {getSystemPath, normalize, strings} from '@angular-devkit/core';
import {
  SchematicContext,
  SchematicsException,
  Tree,
  apply,
  applyTemplates,
  chain,
  filter,
  mergeWith,
  move,
  url,
} from '@angular-devkit/schematics';
import {relative, resolve} from 'path';
import {SchematicsOptions, TestingFramework} from './types.js';

export interface FilesOptions {
  projects: any;
  options: SchematicsOptions;
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

      const baseUrl = getProjectBaseUrl(project);

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

function getProjectBaseUrl(project: any): string {
  let options = {protocol: 'http', port: 4200, host: 'localhost'};

  if (project.architect?.serve?.options) {
    const projectOptions = project.architect?.serve?.options;

    options = {...options, ...projectOptions};
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

export function getScriptFromOptions(options: SchematicsOptions): string {
  switch (options.testingFramework) {
    case TestingFramework.Jasmine:
      return 'jasmine --config=./e2e/support/jasmine.json';
    default:
      throw new SchematicsException('Testing framework not supported.');
  }
}
