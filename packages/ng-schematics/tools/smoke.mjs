/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {ok} from 'node:assert';
import {execSync} from 'node:child_process';
import {parseArgs} from 'node:util';

import {AngularProjectMulti, AngularProjectSingle} from './projects.mjs';

process.on('uncaughtException', (error, origin) => {
  console.error('Unhandled Error at:', error);
  console.error('Origin:', origin);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

const {values: args} = parseArgs({
  options: {
    runner: {
      type: 'string',
      short: 'r',
      default: undefined,
    },
    name: {
      type: 'string',
      short: 'n',
      default: undefined,
    },
  },
});

function verifyAngularCliInstalled() {
  if (process.env.CI) {
    // Need to install in CI
    execSync(
      'npm install -g @angular/cli@latest @angular-devkit/schematics-cli',
    );
    return;
  }
  const userDeps = execSync('npm list -g --depth=0');

  if (
    !userDeps.includes('@angular/cli') ||
    !userDeps.includes('@angular-devkit/schematics-cli')
  ) {
    console.error(
      'Angular CLI not installed run `npm install -g @angular/cli @angular-devkit/schematics-cli`',
    );
    process.exit(1);
  }
}

verifyAngularCliInstalled();

if (!args.runner) {
  const runners = ['node', 'jest', 'jasmine', 'mocha'];
  const groups = [];

  for (const runner of runners) {
    groups.push([
      new AngularProjectSingle(runner),
      new AngularProjectMulti(runner),
    ]);
  }

  const angularProjects = await Promise.allSettled(
    groups.flat().map(async project => {
      return await project.create();
    }),
  );
  ok(
    angularProjects.every(project => {
      return project.status === 'fulfilled';
    }),
    'Building of 1 or more projects failed!',
  );

  for await (const runnerGroup of groups) {
    const smokeResults = await Promise.allSettled(
      runnerGroup.map(async project => {
        return await project.runSmoke();
      }),
    );
    ok(
      smokeResults.every(project => {
        return project.status === 'fulfilled';
      }),
      `Smoke test for ${runnerGroup[0].runner} failed! ${smokeResults.map(
        project => {
          return project.reason;
        },
      )}`,
    );
  }
} else {
  const single = new AngularProjectSingle(args.testRunner, args.name);
  const multi = new AngularProjectMulti(args.testRunner, args.name);

  // Create Angular projects
  await Promise.all([single.create(), multi.create()]);

  // Add schematic to projects
  // Note we can't use Promise.all
  // As it will try to install browser and fail
  await single.runNgAdd();
  await multi.runNgAdd();

  // Run Angular E2E smoke tests
  await Promise.all([single.runSmoke(), multi.runSmoke()]);
}

console.log(`
<---------------->
Smoke test passed!
`);
