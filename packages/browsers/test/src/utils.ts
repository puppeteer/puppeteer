/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import * as readline from 'node:readline';
import {Writable, Readable} from 'node:stream';

import {TestServer} from '@pptr/testserver';

import {isErrorLike} from '../../lib/cjs/launch.js';
import {Cache} from '../../lib/cjs/main.js';

export function createMockedReadlineInterface(
  input: string,
): readline.Interface {
  const waitForQuestion = Promise.withResolvers<void>();
  async function* readableGen() {
    await waitForQuestion.promise;
    yield input;
  }

  const readable = Readable.from(readableGen());
  const writable = new Writable({
    write(_chunk, _encoding, callback) {
      // Suppress the output to keep the test clean
      callback();
      waitForQuestion.resolve();
    },
  });

  return readline.createInterface({
    input: readable,
    output: writable,
  });
}

const startServer = async () => {
  const assetsPath = path.join(__dirname, '..', '.cache', 'server');
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
