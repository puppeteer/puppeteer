/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type Debug from 'debug';

/**
 * @internal
 */
let debugModule: typeof Debug | null = null;
/**
 * @internal
 */
async function importDebug(): Promise<typeof Debug> {
  if (!debugModule) {
    debugModule = (await import('debug')).default;
  }
  return debugModule;
}

export const debug = (prefix: string): ((...args: unknown[]) => void) => {
  return async (...logArgs: unknown[]) => {
    (await importDebug())(prefix)(logArgs);
  };
};
