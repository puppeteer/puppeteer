/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {FileHandle} from 'node:fs/promises';
import type Path from 'node:path';
import type {Writable} from 'node:stream';
import type {debuglog} from 'node:util';

import type {ScreenRecorder} from './node/ScreenRecorder.js';

/**
 * @internal
 */
export const isNode = !!(typeof process !== 'undefined' && process.version);

export interface EnvironmentDependencies {
  path?: typeof Path;
  ScreenRecorder: typeof ScreenRecorder;
  debuglog?: typeof debuglog;
  followSymlinks: boolean;
  readFile: {
    (path: string, encoding: 'utf8' | 'ascii'): Promise<string>;
    (path: string): Promise<Uint8Array>;
  };
  writeFile: (path: string, data: Uint8Array | string) => Promise<void>;
  openFileForWriting: (path: string) => Promise<FileHandle>;
  createWriteStream: (
    path: string,
    options?: {
      encoding?: BufferEncoding;
      overwrite?: boolean;
    },
  ) => Writable;
  mkdir: (path: string, options?: {recursive?: boolean}) => Promise<void>;
}

/**
 * Holder for environment dependencies. These dependencies cannot
 * be used during the module instantiation.
 */
export const environment: {
  value: EnvironmentDependencies;
} = {
  value: {
    followSymlinks: true,
    ScreenRecorder: class {
      constructor() {
        throw new Error('ScreenRecorder is not available in this environment');
      }
    } as unknown as typeof ScreenRecorder,
    readFile: (() => {
      throw new Error('readFile is not available in this environment');
    }) as unknown as EnvironmentDependencies['readFile'],
    writeFile: () => {
      throw new Error('writeFile is not available in this environment');
    },
    openFileForWriting: () => {
      throw new Error(
        'openFileForWriting is not available in this environment',
      );
    },
    createWriteStream: () => {
      throw new Error('createWriteStream is not available in this environment');
    },
    mkdir: () => {
      throw new Error('mkdir is not available in this environment');
    },
  },
};
