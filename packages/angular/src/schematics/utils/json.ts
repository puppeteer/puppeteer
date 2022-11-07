import {SchematicsException, Tree} from '@angular-devkit/schematics';

export function getJsonFileAsObject(
  tree: Tree,
  path: string
): Record<string, any> {
  const buffer = tree.read(path);

  if (buffer === null) {
    throw new SchematicsException(`Could not read ${path}.`);
  }

  const content = buffer.toString();
  if (!content) {
    throw new SchematicsException(`Could not read ${content}.`);
  }

  try {
    const json = JSON.parse(content);

    return json;
  } catch {
    throw new SchematicsException(`Invalid ${path}. Was expecting an object`);
  }
}

export function getObjectAsJson(object: Record<string, any>): string {
  return JSON.stringify(object, null, 2);
}

export function getAngularConfig(tree: Tree): Record<string, any> {
  return getJsonFileAsObject(tree, './angular.json');
}
