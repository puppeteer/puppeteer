/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ExecFileOptions} from 'node:child_process';
import {execFile as nodeExecFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

import {ASSETS_DIR} from './constants.js';

interface ExecFileResult {
  stdout: string;
  stderr: string;
}

export const execFile = async (
  file: string,
  args: string[],
  options: ExecFileOptions,
): Promise<ExecFileResult> => {
  console.log(file, args);
  let resolve: (param: ExecFileResult) => void;
  let reject: (param: Error) => void;
  const promise = new Promise<{
    stdout: string;
    stderr: string;
  }>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  nodeExecFile(file, args, options, (error, stdout, stderr) => {
    const stdoutStr = stdout.toString();
    const stderrStr = stderr.toString();
    console.log('stdout', stdoutStr);
    console.log('stderr', stderrStr);
    if (error) {
      reject(error);
    }
    resolve({
      stdout: stdoutStr,
      stderr: stderrStr,
    });
  });

  return await promise;
};
export const readAsset = (...components: string[]): Promise<string> => {
  return readFile(join(ASSETS_DIR, ...components), 'utf8');
};
