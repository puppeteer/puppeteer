/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {execSync} from 'child_process';
import os from 'os';
import path from 'path';
import * as readline from 'readline';
import {Writable, Readable} from 'stream';

import {TestServer} from '@pptr/testserver';

import {isErrorLike} from '../../lib/cjs/launch.js';
import {Cache} from '../../lib/cjs/main.js';

export function createMockedReadlineInterface(
  input: string
): readline.Interface {
  const readable = Readable.from([input]);
  const writable = new Writable({
    write(_chunk, _encoding, callback) {
      // Suppress the output to keep the test clean
      callback();
    },
  });

  return readline.createInterface({
    input: readable,
    output: writable,
  });
}

const startServer = async () => {
  const assetsPath = path.join(__dirname, '..', 'cache', 'server');
  return await TestServer.create(assetsPath);
};

interface ServerState {
  server: TestServer;
}

const state: Partial<ServerState> = {};

export function setupTestServer(): void {
  before(async () => {
    state.server = await startServer();
  });

  after(async () => {
    await state.server!.stop();
    state.server = undefined;
  });
}

export function getServerUrl(): string {
  return `http://localhost:${state.server!.port}`;
}

export function clearCache(tmpDir: string): void {
  try {
    new Cache(tmpDir).clear();
  } catch (err) {
    if (os.platform() === 'win32') {
      console.log(execSync('tasklist').toString('utf-8'));
      // Sometimes on Windows the folder cannot be removed due to unknown reasons.
      // We suppress the error to avoud flakiness.
      if (isErrorLike(err) && err.message.includes('EBUSY')) {
        return;
      }
    }
    throw err;
  }
}
