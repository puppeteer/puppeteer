#!/usr/bin/env node

/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {exec} from 'child_process';
import {readdirSync} from 'fs';
import path from 'path';
import url from 'url';
import {promisify} from 'util';

const execAsync = promisify(exec);

try {
  await execAsync('git status');
} catch {
  // If `git status` threw an error, we are not in a git repository, bail out.
  console.log('Not inside a .git repository');
  process.exit(0);
}

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const puppeteerRoot = path.join(__dirname, '../');

const {stdout} = await execAsync('git rev-parse --show-toplevel');
const gitTopLevel = stdout.replaceAll('\n', '').trim();

// https://github.com/puppeteer/puppeteer/issues/12917
if (path.relative(gitTopLevel, puppeteerRoot) !== '') {
  console.log('Top level .git is not Puppeteer');
  process.exit(1);
}

// Prevents cleaning config files such as in `.vscode`
if (path.relative(puppeteerRoot, process.cwd()) === '') {
  console.log('Trying to execute from Puppeteer root');
  process.exit(1);
}

await execAsync(
  `git clean -Xf ${readdirSync(process.cwd())
    .filter(file => {
      return file !== 'node_modules';
    })
    .join(' ')}`,
);
