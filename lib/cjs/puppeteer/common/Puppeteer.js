"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Puppeteer = void 0;
/**
 * Copyright 2017 Google Inc. All rights reserved.
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
const Errors_js_1 = require("./Errors.js");
const DeviceDescriptors_js_1 = require("./DeviceDescriptors.js");
const QueryHandler_js_1 = require("./QueryHandler.js");
const BrowserConnector_js_1 = require("./BrowserConnector.js");
const NetworkConditions_js_1 = require("./NetworkConditions.js");
/**
 * The main Puppeteer class.
 *
 * IMPORTANT: if you are using Puppeteer in a Node environment, you will get an
 * instance of {@link PuppeteerNode} when you import or require `puppeteer`.
 * That class extends `Puppeteer`, so has all the methods documented below as
 * well as all that are defined on {@link PuppeteerNode}.
 * @public
 */
class Puppeteer {
    /**
     * @internal
     */
    constructor(settings) {
        this._changedProduct = false;
        this._isPuppeteerCore = settings.isPuppeteerCore;
    }
    /**
     * This method attaches Puppeteer to an existing browser instance.
     *
     * @remarks
     *
     * @param options - Set of configurable options to set on the browser.
     * @returns Promise which resolves to browser instance.
     */
    connect(options) {
        return BrowserConnector_js_1.connectToBrowser(options);
    }
    /**
     * @remarks
     * A list of devices to be used with `page.emulate(options)`. Actual list of devices can be found in {@link https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts | src/common/DeviceDescriptors.ts}.
     *
     * @example
     *
     * ```js
     * const puppeteer = require('puppeteer');
     * const iPhone = puppeteer.devices['iPhone 6'];
     *
     * (async () => {
     *   const browser = await puppeteer.launch();
     *   const page = await browser.newPage();
     *   await page.emulate(iPhone);
     *   await page.goto('https://www.google.com');
     *   // other actions...
     *   await browser.close();
     * })();
     * ```
     *
     */
    get devices() {
        return DeviceDescriptors_js_1.devicesMap;
    }
    /**
     * @remarks
     *
     * Puppeteer methods might throw errors if they are unable to fulfill a request.
     * For example, `page.waitForSelector(selector[, options])` might fail if
     * the selector doesn't match any nodes during the given timeframe.
     *
     * For certain types of errors Puppeteer uses specific error classes.
     * These classes are available via `puppeteer.errors`.
     *
     * @example
     * An example of handling a timeout error:
     * ```js
     * try {
     *   await page.waitForSelector('.foo');
     * } catch (e) {
     *   if (e instanceof puppeteer.errors.TimeoutError) {
     *     // Do something if this is a timeout.
     *   }
     * }
     * ```
     */
    get errors() {
        return Errors_js_1.puppeteerErrors;
    }
    /**
     * @remarks
     * Returns a list of network conditions to be used with `page.emulateNetworkConditions(networkConditions)`. Actual list of predefined conditions can be found in {@link https://github.com/puppeteer/puppeteer/blob/main/src/common/NetworkConditions.ts | src/common/NetworkConditions.ts}.
     *
     * @example
     *
     * ```js
     * const puppeteer = require('puppeteer');
     * const slow3G = puppeteer.networkConditions['Slow 3G'];
     *
     * (async () => {
     *   const browser = await puppeteer.launch();
     *   const page = await browser.newPage();
     *   await page.emulateNetworkConditions(slow3G);
     *   await page.goto('https://www.google.com');
     *   // other actions...
     *   await browser.close();
     * })();
     * ```
     *
     */
    get networkConditions() {
        return NetworkConditions_js_1.networkConditions;
    }
    /**
     * Registers a {@link CustomQueryHandler | custom query handler}. After
     * registration, the handler can be used everywhere where a selector is
     * expected by prepending the selection string with `<name>/`. The name is
     * only allowed to consist of lower- and upper case latin letters.
     * @example
     * ```
     * puppeteer.registerCustomQueryHandler('text', { … });
     * const aHandle = await page.$('text/…');
     * ```
     * @param name - The name that the custom query handler will be registered under.
     * @param queryHandler - The {@link CustomQueryHandler | custom query handler} to
     * register.
     */
    registerCustomQueryHandler(name, queryHandler) {
        QueryHandler_js_1.registerCustomQueryHandler(name, queryHandler);
    }
    /**
     * @param name - The name of the query handler to unregistered.
     */
    unregisterCustomQueryHandler(name) {
        QueryHandler_js_1.unregisterCustomQueryHandler(name);
    }
    /**
     * @returns a list with the names of all registered custom query handlers.
     */
    customQueryHandlerNames() {
        return QueryHandler_js_1.customQueryHandlerNames();
    }
    /**
     * Clears all registered handlers.
     */
    clearCustomQueryHandlers() {
        QueryHandler_js_1.clearCustomQueryHandlers();
    }
}
exports.Puppeteer = Puppeteer;
//# sourceMappingURL=Puppeteer.js.map