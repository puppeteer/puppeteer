/**
 * @license
 * Copyright 2021 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {readdirSync, readFileSync} from 'fs';
import {join} from 'path';

import {devDependencies} from '../package.json';

const LOCAL_PACKAGE_NAMES: string[] = [];

const packagesDir = join(__dirname, '..', 'packages');
for (const packageName of readdirSync(packagesDir)) {
  const {name} = JSON.parse(
    readFileSync(join(packagesDir, packageName, 'package.json'), 'utf8')
  );
  LOCAL_PACKAGE_NAMES.push(name);
}

const allDeps = {...devDependencies};

const invalidDeps = new Map<string, string>();

for (const [depKey, depValue] of Object.entries(allDeps)) {
  if (depValue.startsWith('file:')) {
    continue;
  }
  if (LOCAL_PACKAGE_NAMES.includes(depKey)) {
    continue;
  }
  if (/[0-9]/.test(depValue[0]!)) {
    continue;
  }

  invalidDeps.set(depKey, depValue);
}

if (invalidDeps.size > 0) {
  console.error('Found non-pinned dependencies in package.json:');
  console.log(
    [...invalidDeps.keys()]
      .map(k => {
        return `  ${k}`;
      })
      .join('\n')
  );
  process.exit(1);
}

process.exit(0);
