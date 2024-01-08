/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execSync} from 'node:child_process';

import {AngularProjectMulti, AngularProjectSingle} from './projects.mjs';

if (process.env.CI) {
  // Need to install in CI
  execSync('npm install -g @angular/cli@latest @angular-devkit/schematics-cli');
}

const single = new AngularProjectSingle();
const multi = new AngularProjectMulti();

await Promise.all([single.create(), multi.create()]);
await Promise.all([single.runSmoke(), multi.runSmoke()]);
