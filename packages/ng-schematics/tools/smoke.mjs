/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execSync} from 'node:child_process';
import {parseArgs} from 'node:util';

import {AngularProjectMulti, AngularProjectSingle} from './projects.mjs';

const {values: args} = parseArgs({
  options: {
    testRunner: {
      type: 'string',
      short: 't',
      default: undefined,
    },
    name: {
      type: 'string',
      short: 'n',
      default: undefined,
    },
  },
});

if (process.env.CI) {
  // Need to install in CI
  execSync('npm install -g @angular/cli@latest @angular-devkit/schematics-cli');
  const runners = ['jasmine', 'jest', 'mocha', 'node'];
  const projects = [];

  for (const runner of runners) {
    projects.push(new AngularProjectSingle(runner));
    projects.push(new AngularProjectMulti(runner));
  }

  await Promise.all(
    projects.map(async project => {
      return await project.create();
    })
  );
  await Promise.all(
    projects.map(async project => {
      return await project.runSmoke();
    })
  );
} else {
  const single = new AngularProjectSingle(args.testRunner, args.name);
  const multi = new AngularProjectMulti(args.testRunner, args.name);

  await Promise.all([single.create(), multi.create()]);
  await Promise.all([single.runSmoke(), multi.runSmoke()]);
}
