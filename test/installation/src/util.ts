/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {SpawnOptions} from 'child_process';
import {spawn} from 'child_process';
import {readFile} from 'fs/promises';
import {join} from 'path';

import {ASSETS_DIR} from './constants.js';

export const readAsset = async (...components: string[]): Promise<string> => {
  return await readFile(join(ASSETS_DIR, ...components), 'utf8');
};
export const spawnProcess = async (
  command: string,
  args: readonly string[],
  options: SpawnOptions
): Promise<void> => {
  return await new Promise((resolve, reject) => {
    const process = spawn(command, args, options);
    let error: string | null = null;

    process.on('error', err => {
      error = err.toString();
    });

    process.on('close', () => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};
