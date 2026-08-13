/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import {debuglog} from 'node:util';

import {environment} from './environment.js';

const WRITE_NOFOLLOW_FLAGS =
  fs.constants.O_WRONLY |
  fs.constants.O_CREAT |
  fs.constants.O_TRUNC |
  fs.constants.O_NOFOLLOW;
const WRITE_NOFOLLOW_MODE = 0o600;

async function readFile(
  path: string,
  encoding: 'utf8' | 'ascii',
): Promise<string>;
async function readFile(path: string): Promise<Uint8Array>;
async function readFile(
  path: string,
  encoding?: 'utf8' | 'ascii',
): Promise<string | Uint8Array> {
  if (
    !environment.value.followSymlinks &&
    fs.constants.O_NOFOLLOW !== undefined
  ) {
    return await fs.promises.readFile(path, {
      encoding,
      flag: fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW,
    });
  }
  return await fs.promises.readFile(path, {encoding});
}

environment.value = {
  path,
  debuglog,
  ScreenRecorder: environment.value.ScreenRecorder,
  followSymlinks: true,
  readFile,
  writeFile: async (filePath, data) => {
    if (
      !environment.value.followSymlinks &&
      fs.constants.O_NOFOLLOW !== undefined
    ) {
      await fs.promises.writeFile(filePath, data, {
        flag: WRITE_NOFOLLOW_FLAGS,
        mode: WRITE_NOFOLLOW_MODE,
      });
    } else {
      await fs.promises.writeFile(filePath, data);
    }
  },
  openFileForWriting: async filePath => {
    if (
      !environment.value.followSymlinks &&
      fs.constants.O_NOFOLLOW !== undefined
    ) {
      return await fs.promises.open(
        filePath,
        WRITE_NOFOLLOW_FLAGS,
        WRITE_NOFOLLOW_MODE,
      );
    }
    return await fs.promises.open(filePath, 'w+');
  },
  createWriteStream: (filePath, options) => {
    const encoding = options?.encoding;
    if (
      !environment.value.followSymlinks &&
      fs.constants.O_NOFOLLOW !== undefined
    ) {
      const fd = fs.openSync(
        filePath,
        WRITE_NOFOLLOW_FLAGS,
        WRITE_NOFOLLOW_MODE,
      );
      return fs.createWriteStream('', {
        fd,
        mode: WRITE_NOFOLLOW_MODE,
        encoding,
      });
    }
    return fs.createWriteStream(filePath, encoding ? {encoding} : undefined);
  },
};
