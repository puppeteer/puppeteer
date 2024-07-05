/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type FS from 'fs/promises';

/**
 * @internal
 */
export const isNode = !!(typeof process !== 'undefined' && process.version);

export interface EnvironmentDependencies {
  fs: typeof FS;
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
      throw new Error('fs/promises is not available in this environment');
    },
  },
};
