/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execFile as execFileAsync} from 'child_process';
import {readFile} from 'fs/promises';
import {join} from 'path';
import {promisify} from 'util';

import {ASSETS_DIR} from './constants.js';

export const execFile = promisify(execFileAsync);
export const readAsset = (...components: string[]): Promise<string> => {
  return readFile(join(ASSETS_DIR, ...components), 'utf8');
};
