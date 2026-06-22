/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type FS from 'node:fs';
import type Path from 'node:path';
import type {debuglog} from 'node:util';

import type {ScreenRecorder} from './node/ScreenRecorder.js';

/**
 * @internal
 */
export const isNode = !!(typeof process !== 'undefined' && process.version);

export interface EnvironmentDependencies {
  fs: typeof FS;
  path?: typeof Path;
  ScreenRecorder: typeof ScreenRecorder;
  debuglog?: typeof debuglog;
}

/**
 * Holder for environment dependencies. These dependencies cannot
 * be used during the module instantiation.
 */
export const environment: {
  value: EnvironmentDependencies;
} = {
  value: {
    get fs(): typeof FS {
      throw new Error('fs is not available in this environment');
    },
    ScreenRecorder: class {
      constructor() {
        throw new Error('ScreenRecorder is not available in this environment');
      }
    } as unknown as typeof ScreenRecorder,
  },
};
