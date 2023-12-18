/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @internal
 */
export const isNode = !!(typeof process !== 'undefined' && process.version);

/**
 * @internal
 */
export const DEFERRED_PROMISE_DEBUG_TIMEOUT =
  typeof process !== 'undefined' &&
  typeof process.env['PUPPETEER_DEFERRED_PROMISE_DEBUG_TIMEOUT'] !== 'undefined'
    ? Number(process.env['PUPPETEER_DEFERRED_PROMISE_DEBUG_TIMEOUT'])
    : -1;
