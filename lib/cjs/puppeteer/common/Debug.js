"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = void 0;
const environment_js_1 = require("../environment.js");
/**
 * A debug function that can be used in any environment.
 *
 * @remarks
 *
 * If used in Node, it falls back to the
 * {@link https://www.npmjs.com/package/debug | debug module}. In the browser it
 * uses `console.log`.
 *
 * @param prefix - this will be prefixed to each log.
 * @returns a function that can be called to log to that debug channel.
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
 * ```
 * const log = debug('Page');
 *
 * log('new page created')
 * // logs "Page: new page created"
 * ```
 */
const debug = (prefix) => {
    if (environment_js_1.isNode) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require('debug')(prefix);
    }
    return (...logArgs) => {
        const debugLevel = globalThis.__PUPPETEER_DEBUG;
        if (!debugLevel)
            return;
        const everythingShouldBeLogged = debugLevel === '*';
        const prefixMatchesDebugLevel = everythingShouldBeLogged ||
            /**
             * If the debug level is `foo*`, that means we match any prefix that
             * starts with `foo`. If the level is `foo`, we match only the prefix
             * `foo`.
             */
            (debugLevel.endsWith('*')
                ? prefix.startsWith(debugLevel)
                : prefix === debugLevel);
        if (!prefixMatchesDebugLevel)
            return;
        // eslint-disable-next-line no-console
        console.log(`${prefix}:`, ...logArgs);
    };
};
exports.debug = debug;
//# sourceMappingURL=Debug.js.map