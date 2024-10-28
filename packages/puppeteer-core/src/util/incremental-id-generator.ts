/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @internal
 */
export function createIncrementalIdGenerator(): GetIdFn {
  let id = 0;
  return (): number => {
    return ++id;
  };
}

/**
 * @internal
 */
export type GetIdFn = () => number;
