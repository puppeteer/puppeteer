/**
 * Copyright 2021 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
