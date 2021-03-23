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
import { assert } from './assert.js';
import { helper } from './helper.js';
import { Target } from './Target.js';
import { EventEmitter } from './EventEmitter.js';
import { ConnectionEmittedEvents } from './Connection.js';
const WEB_PERMISSION_TO_PROTOCOL_PERMISSION = new Map([
    ['geolocation', 'geolocation'],
    ['midi', 'midi'],
    ['notifications', 'notifications'],
    // TODO: push isn't a valid type?
    // ['push', 'push'],
    ['camera', 'videoCapture'],
    ['microphone', 'audioCapture'],
    ['background-sync', 'backgroundSync'],
    ['ambient-light-sensor', 'sensors'],
    ['accelerometer', 'sensors'],
    ['gyroscope', 'sensors'],
    ['magnetometer', 'sensors'],
    ['accessibility-events', 'accessibilityEvents'],
    ['clipboard-read', 'clipboardReadWrite'],
    ['clipboard-write', 'clipboardReadWrite'],
    ['payment-handler', 'paymentHandler'],
    ['idle-detection', 'idleDetection'],
    // chrome-specific permissions we have.
    ['midi-sysex', 'midiSysex'],
]);
/**
 * A Browser is created when Puppeteer connects to a Chromium instance, either through
 * {@link PuppeteerNode.launch} or {@link Puppeteer.connect}.
 *
 * @remarks
 *
 * The Browser class extends from Puppeteer's {@link EventEmitter} class and will
 * emit various events which are documented in the {@link BrowserEmittedEvents} enum.
 *
 * @example
 *
 * An example of using a {@link Browser} to create a {@link Page}:
 * ```js
 * const puppeteer = require('puppeteer');
 *
 * (async () => {
 *   const browser = await puppeteer.launch();
 *   const page = await browser.newPage();
 *   await page.goto('https://example.com');
 *   await browser.close();
 * })();
 * ```
 *
 * @example
 *
 * An example of disconnecting from and reconnecting to a {@link Browser}:
 * ```js
 * const puppeteer = require('puppeteer');
 *
 * (async () => {
 *   const browser = await puppeteer.launch();
 *   // Store the endpoint to be able to reconnect to Chromium
 *   const browserWSEndpoint = browser.wsEndpoint();
 *   // Disconnect puppeteer from Chromium
 *   browser.disconnect();
 *
 *   // Use the endpoint to reestablish a connection
 *   const browser2 = await puppeteer.connect({browserWSEndpoint});
 *   // Close Chromium
 *   await browser2.close();
 * })();
 * ```
 *
 * @public
 */
export class Browser extends EventEmitter {
    /**
     * @internal
     */
    constructor(connection, contextIds, ignoreHTTPSErrors, defaultViewport, process, closeCallback) {
        super();
        this._ignoreHTTPSErrors = ignoreHTTPSErrors;
        this._defaultViewport = defaultViewport;
        this._process = process;
        this._connection = connection;
        this._closeCallback = closeCallback || function () { };
        this._defaultContext = new BrowserContext(this._connection, this, null);
        this._contexts = new Map();
        for (const contextId of contextIds)
            this._contexts.set(contextId, new BrowserContext(this._connection, this, contextId));
        this._targets = new Map();
        this._connection.on(ConnectionEmittedEvents.Disconnected, () => this.emit("disconnected" /* Disconnected */));
        this._connection.on('Target.targetCreated', this._targetCreated.bind(this));
        this._connection.on('Target.targetDestroyed', this._targetDestroyed.bind(this));
        this._connection.on('Target.targetInfoChanged', this._targetInfoChanged.bind(this));
    }
    /**
     * @internal
     */
    static async create(connection, contextIds, ignoreHTTPSErrors, defaultViewport, process, closeCallback) {
        const browser = new Browser(connection, contextIds, ignoreHTTPSErrors, defaultViewport, process, closeCallback);
        await connection.send('Target.setDiscoverTargets', { discover: true });
        return browser;
    }
    /**
     * The spawned browser process. Returns `null` if the browser instance was created with
     * {@link Puppeteer.connect}.
     */
    process() {
        return this._process;
    }
    /**
     * Creates a new incognito browser context. This won't share cookies/cache with other
     * browser contexts.
     *
     * @example
     * ```js
     * (async () => {
     *  const browser = await puppeteer.launch();
     *   // Create a new incognito browser context.
     *   const context = await browser.createIncognitoBrowserContext();
     *   // Create a new page in a pristine context.
     *   const page = await context.newPage();
     *   // Do stuff
     *   await page.goto('https://example.com');
     * })();
     * ```
     */
    async createIncognitoBrowserContext() {
        const { browserContextId } = await this._connection.send('Target.createBrowserContext');
        const context = new BrowserContext(this._connection, this, browserContextId);
        this._contexts.set(browserContextId, context);
        return context;
    }
    /**
     * Returns an array of all open browser contexts. In a newly created browser, this will
     * return a single instance of {@link BrowserContext}.
     */
    browserContexts() {
        return [this._defaultContext, ...Array.from(this._contexts.values())];
    }
    /**
     * Returns the default browser context. The default browser context cannot be closed.
     */
    defaultBrowserContext() {
        return this._defaultContext;
    }
    /**
     * @internal
     * Used by BrowserContext directly so cannot be marked private.
     */
    async _disposeContext(contextId) {
        await this._connection.send('Target.disposeBrowserContext', {
            browserContextId: contextId || undefined,
        });
        this._contexts.delete(contextId);
    }
    async _targetCreated(event) {
        const targetInfo = event.targetInfo;
        const { browserContextId } = targetInfo;
        const context = browserContextId && this._contexts.has(browserContextId)
            ? this._contexts.get(browserContextId)
            : this._defaultContext;
        const target = new Target(targetInfo, context, () => this._connection.createSession(targetInfo), this._ignoreHTTPSErrors, this._defaultViewport);
        assert(!this._targets.has(event.targetInfo.targetId), 'Target should not exist before targetCreated');
        this._targets.set(event.targetInfo.targetId, target);
        if (await target._initializedPromise) {
            this.emit("targetcreated" /* TargetCreated */, target);
            context.emit("targetcreated" /* TargetCreated */, target);
        }
    }
    async _targetDestroyed(event) {
        const target = this._targets.get(event.targetId);
        target._initializedCallback(false);
        this._targets.delete(event.targetId);
        target._closedCallback();
        if (await target._initializedPromise) {
            this.emit("targetdestroyed" /* TargetDestroyed */, target);
            target
                .browserContext()
                .emit("targetdestroyed" /* TargetDestroyed */, target);
        }
    }
    _targetInfoChanged(event) {
        const target = this._targets.get(event.targetInfo.targetId);
        assert(target, 'target should exist before targetInfoChanged');
        const previousURL = target.url();
        const wasInitialized = target._isInitialized;
        target._targetInfoChanged(event.targetInfo);
        if (wasInitialized && previousURL !== target.url()) {
            this.emit("targetchanged" /* TargetChanged */, target);
            target
                .browserContext()
                .emit("targetchanged" /* TargetChanged */, target);
        }
    }
    /**
     * The browser websocket endpoint which can be used as an argument to
     * {@link Puppeteer.connect}.
     *
     * @returns The Browser websocket url.
     *
     * @remarks
     *
     * The format is `ws://${host}:${port}/devtools/browser/<id>`.
     *
     * You can find the `webSocketDebuggerUrl` from `http://${host}:${port}/json/version`.
     * Learn more about the
     * {@link https://chromedevtools.github.io/devtools-protocol | devtools protocol} and
     * the {@link
     * https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target
     * | browser endpoint}.
     */
    wsEndpoint() {
        return this._connection.url();
    }
    /**
     * Creates a {@link Page} in the default browser context.
     */
    async newPage() {
        return this._defaultContext.newPage();
    }
    /**
     * @internal
     * Used by BrowserContext directly so cannot be marked private.
     */
    async _createPageInContext(contextId) {
        const { targetId } = await this._connection.send('Target.createTarget', {
            url: 'about:blank',
            browserContextId: contextId || undefined,
        });
        const target = await this._targets.get(targetId);
        assert(await target._initializedPromise, 'Failed to create target for page');
        const page = await target.page();
        return page;
    }
    /**
     * All active targets inside the Browser. In case of multiple browser contexts, returns
     * an array with all the targets in all browser contexts.
     */
    targets() {
        return Array.from(this._targets.values()).filter((target) => target._isInitialized);
    }
    /**
     * The target associated with the browser.
     */
    target() {
        return this.targets().find((target) => target.type() === 'browser');
    }
    /**
     * Searches for a target in all browser contexts.
     *
     * @param predicate - A function to be run for every target.
     * @returns The first target found that matches the `predicate` function.
     *
     * @example
     *
     * An example of finding a target for a page opened via `window.open`:
     * ```js
     * await page.evaluate(() => window.open('https://www.example.com/'));
     * const newWindowTarget = await browser.waitForTarget(target => target.url() === 'https://www.example.com/');
     * ```
     */
    async waitForTarget(predicate, options = {}) {
        const { timeout = 30000 } = options;
        const existingTarget = this.targets().find(predicate);
        if (existingTarget)
            return existingTarget;
        let resolve;
        const targetPromise = new Promise((x) => (resolve = x));
        this.on("targetcreated" /* TargetCreated */, check);
        this.on("targetchanged" /* TargetChanged */, check);
        try {
            if (!timeout)
                return await targetPromise;
            return await helper.waitWithTimeout(targetPromise, 'target', timeout);
        }
        finally {
            this.removeListener("targetcreated" /* TargetCreated */, check);
            this.removeListener("targetchanged" /* TargetChanged */, check);
        }
        function check(target) {
            if (predicate(target))
                resolve(target);
        }
    }
    /**
     * An array of all open pages inside the Browser.
     *
     * @remarks
     *
     * In case of multiple browser contexts, returns an array with all the pages in all
     * browser contexts. Non-visible pages, such as `"background_page"`, will not be listed
     * here. You can find them using {@link Target.page}.
     */
    async pages() {
        const contextPages = await Promise.all(this.browserContexts().map((context) => context.pages()));
        // Flatten array.
        return contextPages.reduce((acc, x) => acc.concat(x), []);
    }
    /**
     * A string representing the browser name and version.
     *
     * @remarks
     *
     * For headless Chromium, this is similar to `HeadlessChrome/61.0.3153.0`. For
     * non-headless, this is similar to `Chrome/61.0.3153.0`.
     *
     * The format of browser.version() might change with future releases of Chromium.
     */
    async version() {
        const version = await this._getVersion();
        return version.product;
    }
    /**
     * The browser's original user agent. Pages can override the browser user agent with
     * {@link Page.setUserAgent}.
     */
    async userAgent() {
        const version = await this._getVersion();
        return version.userAgent;
    }
    /**
     * Closes Chromium and all of its pages (if any were opened). The {@link Browser} object
     * itself is considered to be disposed and cannot be used anymore.
     */
    async close() {
        await this._closeCallback.call(null);
        this.disconnect();
    }
    /**
     * Disconnects Puppeteer from the browser, but leaves the Chromium process running.
     * After calling `disconnect`, the {@link Browser} object is considered disposed and
     * cannot be used anymore.
     */
    disconnect() {
        this._connection.dispose();
    }
    /**
     * Indicates that the browser is connected.
     */
    isConnected() {
        return !this._connection._closed;
    }
    _getVersion() {
        return this._connection.send('Browser.getVersion');
    }
}
/**
 * BrowserContexts provide a way to operate multiple independent browser
 * sessions. When a browser is launched, it has a single BrowserContext used by
 * default. The method {@link Browser.newPage | Browser.newPage} creates a page
 * in the default browser context.
 *
 * @remarks
 *
 * The Browser class extends from Puppeteer's {@link EventEmitter} class and
 * will emit various events which are documented in the
 * {@link BrowserContextEmittedEvents} enum.
 *
 * If a page opens another page, e.g. with a `window.open` call, the popup will
 * belong to the parent page's browser context.
 *
 * Puppeteer allows creation of "incognito" browser contexts with
 * {@link Browser.createIncognitoBrowserContext | Browser.createIncognitoBrowserContext}
 * method. "Incognito" browser contexts don't write any browsing data to disk.
 *
 * @example
 * ```js
 * // Create a new incognito browser context
 * const context = await browser.createIncognitoBrowserContext();
 * // Create a new page inside context.
 * const page = await context.newPage();
 * // ... do stuff with page ...
 * await page.goto('https://example.com');
 * // Dispose context once it's no longer needed.
 * await context.close();
 * ```
 */
export class BrowserContext extends EventEmitter {
    /**
     * @internal
     */
    constructor(connection, browser, contextId) {
        super();
        this._connection = connection;
        this._browser = browser;
        this._id = contextId;
    }
    /**
     * An array of all active targets inside the browser context.
     */
    targets() {
        return this._browser
            .targets()
            .filter((target) => target.browserContext() === this);
    }
    /**
     * This searches for a target in this specific browser context.
     *
     * @example
     * An example of finding a target for a page opened via `window.open`:
     * ```js
     * await page.evaluate(() => window.open('https://www.example.com/'));
     * const newWindowTarget = await browserContext.waitForTarget(target => target.url() === 'https://www.example.com/');
     * ```
     *
     * @param predicate - A function to be run for every target
     * @param options - An object of options. Accepts a timout,
     * which is the maximum wait time in milliseconds.
     * Pass `0` to disable the timeout. Defaults to 30 seconds.
     * @returns Promise which resolves to the first target found
     * that matches the `predicate` function.
     */
    waitForTarget(predicate, options = {}) {
        return this._browser.waitForTarget((target) => target.browserContext() === this && predicate(target), options);
    }
    /**
     * An array of all pages inside the browser context.
     *
     * @returns Promise which resolves to an array of all open pages.
     * Non visible pages, such as `"background_page"`, will not be listed here.
     * You can find them using {@link Target.page | the target page}.
     */
    async pages() {
        const pages = await Promise.all(this.targets()
            .filter((target) => target.type() === 'page')
            .map((target) => target.page()));
        return pages.filter((page) => !!page);
    }
    /**
     * Returns whether BrowserContext is incognito.
     * The default browser context is the only non-incognito browser context.
     *
     * @remarks
     * The default browser context cannot be closed.
     */
    isIncognito() {
        return !!this._id;
    }
    /**
     * @example
     * ```js
     * const context = browser.defaultBrowserContext();
     * await context.overridePermissions('https://html5demos.com', ['geolocation']);
     * ```
     *
     * @param origin - The origin to grant permissions to, e.g. "https://example.com".
     * @param permissions - An array of permissions to grant.
     * All permissions that are not listed here will be automatically denied.
     */
    async overridePermissions(origin, permissions) {
        const protocolPermissions = permissions.map((permission) => {
            const protocolPermission = WEB_PERMISSION_TO_PROTOCOL_PERMISSION.get(permission);
            if (!protocolPermission)
                throw new Error('Unknown permission: ' + permission);
            return protocolPermission;
        });
        await this._connection.send('Browser.grantPermissions', {
            origin,
            browserContextId: this._id || undefined,
            permissions: protocolPermissions,
        });
    }
    /**
     * Clears all permission overrides for the browser context.
     *
     * @example
     * ```js
     * const context = browser.defaultBrowserContext();
     * context.overridePermissions('https://example.com', ['clipboard-read']);
     * // do stuff ..
     * context.clearPermissionOverrides();
     * ```
     */
    async clearPermissionOverrides() {
        await this._connection.send('Browser.resetPermissions', {
            browserContextId: this._id || undefined,
        });
    }
    /**
     * Creates a new page in the browser context.
     */
    newPage() {
        return this._browser._createPageInContext(this._id);
    }
    /**
     * The browser this browser context belongs to.
     */
    browser() {
        return this._browser;
    }
    /**
     * Closes the browser context. All the targets that belong to the browser context
     * will be closed.
     *
     * @remarks
     * Only incognito browser contexts can be closed.
     */
    async close() {
        assert(this._id, 'Non-incognito profiles cannot be closed!');
        await this._browser._disposeContext(this._id);
    }
}
//# sourceMappingURL=Browser.js.map