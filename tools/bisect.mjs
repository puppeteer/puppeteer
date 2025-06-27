/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A tiny wrapper around the Chromium bisect script
 * that runs Puppeteer tests
 * It's recommended to add .only to the failing test so
 * the script runs quicker.
 */
import {spawn} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

const {chromium, good, bad, test} = await yargs(hideBin(process.argv))
  .options('chromium', {
    type: 'string',
    default: path.join(os.homedir(), 'chromium', 'src'),
    alias: 'c',
    desc: 'Path to chromium download',
  })
  .option('good', {
    type: 'string',
    alias: 'g',
    demandOption: true,
    desc: 'Last known good version',
  })
  .option('bad', {
    type: 'string',
    alias: 'b',
    demandOption: true,
    desc: 'First known bad version',
  })
  .option('test', {
    type: 'string',
    alias: 't',
    default: 'test:chrome:headless',
    desc: 'Test type to run, example `test:chrome:headful`',
  })
  .version(false)
  .help()
  .parse();

const pythonExecutable = 'python3';
const bisectScript = path.join(chromium, 'tools', 'bisect-builds.py');

const args = [
  bisectScript,
  '-g',
  good,
  '-b',
  bad,
  '-cft',
  '-v',
  '--verify-range',
  '--not-interactive',
  '-c',
  `"BINARY=%p npm run ${test}"`,
];

await new Promise((resolve, reject) => {
  const createProcess = spawn(pythonExecutable, args, {
    shell: true,
    stdio: 'inherit',
  });

  createProcess.on('error', message => {
    reject(message);
  });

  createProcess.on('exit', () => {
    resolve();
  });
});
