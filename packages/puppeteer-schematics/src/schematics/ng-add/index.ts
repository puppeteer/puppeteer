import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';

import {concatMap, map, scan} from 'rxjs/operators';
import {of} from 'rxjs';
import {
  addBaseFiles,
  addFrameworkFiles,
  updateAngularFile,
} from '../utils/files.js';
import {
  addPackageJsonDependencies,
  addPackageJsonScripts,
  getDependenciesFromOptions,
  getPackageLatestNpmVersion,
  DependencyType,
  type NodePackage,
} from '../utils/packages.js';

import {type SchematicsOptions} from '../utils/types.js';
import {getAngularConfig} from '../utils/json.js';

// You don't have to export the function as default. You can also have more than one rule
// factory per file.
export function ngAdd(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      addDependencies(options),
      addPuppeteerFiles(options),
      addOtherFiles(options),
      updateAngularConfig(options),
    ])(tree, context);
  };
}

function addDependencies(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
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

function updateAngularConfig(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext): Tree => {
    addPackageJsonScripts(tree, [
      {
        name: 'e2e',
        script: 'ng e2e',
      },
    ]);

    return updateAngularFile(tree, context, options);
  };
}

function addPuppeteerFiles(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Puppeteer files');
    const {projects} = getAngularConfig(tree);

    return addBaseFiles(tree, context, {
      projects,
      options,
    });
  };
}

function addOtherFiles(options: SchematicsOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.debug('Adding Puppeteer files');
    const {projects} = getAngularConfig(tree);

    return addFrameworkFiles(tree, context, {
      projects,
      options,
    });
  };
}
