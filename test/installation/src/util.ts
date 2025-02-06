/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ExecFileOptions} from 'node:child_process';
import {execFile as execFileAsync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {promisify} from 'util';

import {ASSETS_DIR} from './constants.js';

const nodeExecFile = promisify(execFileAsync);

export const execFile = async (
  file: string,
  args: string[],
  options: ExecFileOptions,
): Promise<{
  stdout: string;
  stderr: string;
}> => {
  console.log(file, args);
  const result = await nodeExecFile(file, args, options);
  console.log('stdout', result.stdout);
  console.log('stderr', result.stderr);
  return result;
};
export const readAsset = (...components: string[]): Promise<string> => {
  return readFile(join(ASSETS_DIR, ...components), 'utf8');
};
