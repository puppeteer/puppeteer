/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type FS from 'node:fs';
import type Path from 'node:path';

import type {ScreenRecorder} from './node/ScreenRecorder.js';

/**
 * @internal
 */
export const isNode = !!(typeof process !== 'undefined' && process.version);

export interface EnvironmentDependencies {
  fs: typeof FS;
  path?: typeof Path;
  ScreenRecorder: typeof ScreenRecorder;
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
    get ScreenRecorder(): typeof ScreenRecorder {
      throw new Error('ScreenRecorder is not available in this environment');
    },
  },
};

/**
 * Whether to ignore tab targets.
 * Some chrome versions do not support tab targets. eg: chrome 114 and above.
 *
 * @defaultValue false
 */
export const IGNORE_TAB_TARGET =
  typeof process !== 'undefined'
    ? process.env['PUPPETEER_IGNORE_TAB_TARGET'] === 'true'
    : false;
