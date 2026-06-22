/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {isNode, environment} from '../environment.js';

declare global {
  const __PUPPETEER_DEBUG: string;
}
/**
 * A debug function that can be used in any environment.
 *
 * @remarks
 * If used in Node, it falls back to Node's built-in
 * {@link https://nodejs.org/api/util.html#utildebuglogsection-callback | util.debuglog}. In the browser it
 * uses `console.log`.
 *
 * In Node, use the `NODE_DEBUG` environment variable to control logging:
 *
 * ```
 * NODE_DEBUG=* // logs all channels
 * NODE_DEBUG=foo // logs the `foo` channel
 * NODE_DEBUG=foo* // logs any channels starting with `foo`
 * ```
 *
 * In the browser, set `window.__PUPPETEER_DEBUG` to a string:
 *
 * ```
 * window.__PUPPETEER_DEBUG='*'; // logs all channels
 * window.__PUPPETEER_DEBUG='foo'; // logs the `foo` channel
 * window.__PUPPETEER_DEBUG='foo*'; // logs any channels starting with `foo`
 * ```
 *
 * @example
 *
 * ```
 * const log = debug('Page');
 *
 * log('new page created')
 * // logs "Page: new page created"
 * ```
 *
 * @param prefix - this will be prefixed to each log.
 * @returns a function that can be called to log to that debug channel.
 *
 * @internal
 */
export const debug = (
  prefix: string,
): ((...args: unknown[]) => void) | undefined => {
  if (isNode) {
    const nodeDebug = environment.value.debuglog(prefix);
    if (!nodeDebug || !nodeDebug.enabled) {
      return;
    }

    return (...logArgs: unknown[]) => {
      if (captureLogs) {
        capturedLogs.push(prefix + logArgs);
      }
      (nodeDebug as (...args: any[]) => void)(...logArgs);
    };
  }

  const debugLevel = (globalThis as any).__PUPPETEER_DEBUG;
  if (!debugLevel) {
    return;
  }

  const everythingShouldBeLogged = debugLevel === '*';

  const prefixMatchesDebugLevel =
    everythingShouldBeLogged ||
    /**
     * If the debug level is `foo*`, that means we match any prefix that
     * starts with `foo`. If the level is `foo`, we match only the prefix
     * `foo`.
     */
    (debugLevel.endsWith('*')
      ? prefix.startsWith(debugLevel.slice(0, -1))
      : prefix === debugLevel);

  if (!prefixMatchesDebugLevel) {
    return;
  }

  return (...logArgs: unknown[]): void => {
    console.log(`${prefix}:`, ...logArgs);
  };
};

/**
 * @internal
 */
let capturedLogs: string[] = [];
/**
 * @internal
 */
let captureLogs = false;

/**
 * @internal
 */
export function setLogCapture(value: boolean): void {
  capturedLogs = [];
  captureLogs = value;
}

/**
 * @internal
 */
export function getCapturedLogs(): string[] {
  return capturedLogs;
}
