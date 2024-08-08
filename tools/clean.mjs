#!/usr/bin/env node

/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {exec} from 'child_process';
import {readdirSync} from 'fs';
import readline from 'node:readline';

let resolver;
let rejector;
const confirmation = new Promise((res, rej) => {
  resolver = res;
  rejector = rej;
});

if (process.env.npm_command !== 'run-script') {
  console.log('Running command directly may result in data loss.');
  console.log('Ref: https://github.com/puppeteer/puppeteer/issues/12917');
  console.log('Please use the provided npm scripts!');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Do you want to proceed? (y/N) ', answer => {
    rl.close();
    if (
      answer.localeCompare('y', undefined, {
        sensitivity: 'base',
      }) === 'y' ||
      answer === 'yes'
    ) {
      resolver();
    } else {
      rejector('Canceled');
    }
  });
} else {
  resolver();
}

try {
  await confirmation;
  exec(
    `git clean -Xf ${readdirSync(process.cwd())
      .filter(file => {
        return file !== 'node_modules';
      })
      .join(' ')}`
  );
} catch {}
