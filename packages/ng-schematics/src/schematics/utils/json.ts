import {SchematicsException, Tree} from '@angular-devkit/schematics';

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

export function getAngularConfig(tree: Tree): Record<string, any> {
  return getJsonFileAsObject(tree, './angular.json');
}
