/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';

/**
 * Awaits the given promise (or calls the given async function) and asserts
 * that it rejects. Returns the rejection reason so that callers can make
 * further assertions on it.
 *
 * @internal
 */
export const assertRejects = async (
  promise: Promise<unknown> | (() => Promise<unknown>),
): Promise<any> => {
  const resolved = Symbol('resolved');
  const result = await (typeof promise === 'function' ? promise() : promise)
    .then(() => {
      return resolved;
    })
    .catch((error: unknown) => {
      return error;
    });
  assert.notStrictEqual(
    result,
    resolved,
    'Expected promise to reject, but it resolved',
  );
  return result;
};
