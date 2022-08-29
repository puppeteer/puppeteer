import path from 'path';
import fs from 'fs';
import {TestDimensionValue} from './types.js';

export function* traverseMatrix(
  combination: TestDimensionValue[],
  dimensions: TestDimensionValue[][]
): Generator<TestDimensionValue[]> {
  if (dimensions.length === 0) {
    yield combination;
    return;
  }
  const nextDimension = dimensions.shift() as TestDimensionValue[];
  for (const dimensionValue of nextDimension) {
    yield* traverseMatrix([...combination, dimensionValue], [...dimensions]);
  }
}

export function extendProcessEnv(
  combination: TestDimensionValue[]
): NodeJS.ProcessEnv {
  return combination.reduce(
    (acc: object, item: object) => {
      Object.assign(acc, item);
      return acc;
    },
    {
      ...process.env,
    }
  ) as NodeJS.ProcessEnv;
}

export function getFilename(file: string): string {
  return path.basename(file).replace(path.extname(file), '');
}

export function isEqualObject(
  a: {[key: string]: unknown},
  b: {[key: string]: unknown}
): boolean {
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false;
  }
  for (const key of Object.keys(a)) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

export function validatePlatfrom(platform: NodeJS.Platform): void {
  if (!['linux', 'darwin', 'win32'].includes(platform)) {
    throw new Error('Unsupported platform');
  }
}

export function readJSON(path: string): unknown {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

export function filterByPlatform<T extends {platforms: NodeJS.Platform[]}>(
  items: T[],
  platform: NodeJS.Platform
): T[] {
  return items.filter(item => {
    return item.platforms.includes(platform);
  });
}

export function prettyPrintJSON(json: unknown): void {
  console.log(JSON.stringify(json, null, 2));
}
