/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {isNode} from '../environment.js';

declare global {
  // eslint-disable-next-line no-var
  var __PUPPETEER_DEBUG: string;
}

/**
 * @internal
 */
let debugModule: typeof import('debug') | null = null;
/**
 * @internal
 */
export async function importDebug(): Promise<typeof import('debug')> {
  if (!debugModule) {
    debugModule = (await import('debug')).default;
  }
  return debugModule;
}

/**
 * A debug function that can be used in any environment.
 *
 * @remarks
 * If used in Node, it falls back to the
 * {@link https://www.npmjs.com/package/debug | debug module}. In the browser it
 * uses `console.log`.
 *
 * In Node, use the `DEBUG` environment variable to control logging:
 *
 * ```
 * DEBUG=* // logs all channels
 * DEBUG=foo // logs the `foo` channel
 * DEBUG=foo* // logs any channels starting with `foo`
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
export const debug = (prefix: string): ((...args: unknown[]) => void) => {
  if (isNode) {
    return async (...logArgs: unknown[]) => {
      (await importDebug())(prefix)(logArgs);
    };
  }

  return (...logArgs: unknown[]): void => {
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
        ? prefix.startsWith(debugLevel)
        : prefix === debugLevel);

    if (!prefixMatchesDebugLevel) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`${prefix}:`, ...logArgs);
  };
};
