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
import { EventEmitter } from './EventEmitter.js';
import { Connection, CDPSessionEmittedEvents, } from './Connection.js';
import { Dialog } from './Dialog.js';
import { EmulationManager } from './EmulationManager.js';
import { FrameManager, FrameManagerEmittedEvents, } from './FrameManager.js';
import { Keyboard, Mouse, Touchscreen } from './Input.js';
import { Tracing } from './Tracing.js';
import { assert } from './assert.js';
import { helper, debugError } from './helper.js';
import { Coverage } from './Coverage.js';
import { WebWorker } from './WebWorker.js';
import { createJSHandle } from './JSHandle.js';
import { NetworkManagerEmittedEvents, } from './NetworkManager.js';
import { Accessibility } from './Accessibility.js';
import { TimeoutSettings } from './TimeoutSettings.js';
import { FileChooser } from './FileChooser.js';
import { ConsoleMessage } from './ConsoleMessage.js';
import { paperFormats } from './PDFOptions.js';
import { isNode } from '../environment.js';
class ScreenshotTaskQueue {
    constructor() {
        this._chain = Promise.resolve(undefined);
    }
    postTask(task) {
        const result = this._chain.then(task);
        this._chain = result.catch(() => { });
        return result;
    }
}
/**
 * Page provides methods to interact with a single tab or
 * {@link https://developer.chrome.com/extensions/background_pages | extension background page} in Chromium.
 *
 * @remarks
 *
 * One Browser instance might have multiple Page instances.
 *
 * @example
 * This example creates a page, navigates it to a URL, and then * saves a screenshot:
 * ```js
 * const puppeteer = require('puppeteer');
 *
 * (async () => {
 *   const browser = await puppeteer.launch();
 *   const page = await browser.newPage();
 *   await page.goto('https://example.com');
 *   await page.screenshot({path: 'screenshot.png'});
 *   await browser.close();
 * })();
 * ```
 *
 * The Page class extends from Puppeteer's {@link EventEmitter} class and will
 * emit various events which are documented in the {@link PageEmittedEvents} enum.
 *
 * @example
 * This example logs a message for a single page `load` event:
 * ```js
 * page.once('load', () => console.log('Page loaded!'));
 * ```
 *
 * To unsubscribe from events use the `off` method:
 *
 * ```js
 * function logRequest(interceptedRequest) {
 *   console.log('A request was made:', interceptedRequest.url());
 * }
 * page.on('request', logRequest);
 * // Sometime later...
 * page.off('request', logRequest);
 * ```
 * @public
 */
export class Page extends EventEmitter {
    /**
     * @internal
     */
    constructor(client, target, ignoreHTTPSErrors) {
        super();
        this._closed = false;
        this._timeoutSettings = new TimeoutSettings();
        this._pageBindings = new Map();
        this._javascriptEnabled = true;
        this._workers = new Map();
        // TODO: improve this typedef - it's a function that takes a file chooser or
        // something?
        this._fileChooserInterceptors = new Set();
        this._client = client;
        this._target = target;
        this._keyboard = new Keyboard(client);
        this._mouse = new Mouse(client, this._keyboard);
        this._touchscreen = new Touchscreen(client, this._keyboard);
        this._accessibility = new Accessibility(client);
        this._frameManager = new FrameManager(client, this, ignoreHTTPSErrors, this._timeoutSettings);
        this._emulationManager = new EmulationManager(client);
        this._tracing = new Tracing(client);
        this._coverage = new Coverage(client);
        this._screenshotTaskQueue = new ScreenshotTaskQueue();
        this._viewport = null;
        client.on('Target.attachedToTarget', (event) => {
            if (event.targetInfo.type !== 'worker') {
                // If we don't detach from service workers, they will never die.
                client
                    .send('Target.detachFromTarget', {
                    sessionId: event.sessionId,
                })
                    .catch(debugError);
                return;
            }
            const session = Connection.fromSession(client).session(event.sessionId);
            const worker = new WebWorker(session, event.targetInfo.url, this._addConsoleMessage.bind(this), this._handleException.bind(this));
            this._workers.set(event.sessionId, worker);
            this.emit("workercreated" /* WorkerCreated */, worker);
        });
        client.on('Target.detachedFromTarget', (event) => {
            const worker = this._workers.get(event.sessionId);
            if (!worker)
                return;
            this.emit("workerdestroyed" /* WorkerDestroyed */, worker);
            this._workers.delete(event.sessionId);
        });
        this._frameManager.on(FrameManagerEmittedEvents.FrameAttached, (event) => this.emit("frameattached" /* FrameAttached */, event));
        this._frameManager.on(FrameManagerEmittedEvents.FrameDetached, (event) => this.emit("framedetached" /* FrameDetached */, event));
        this._frameManager.on(FrameManagerEmittedEvents.FrameNavigated, (event) => this.emit("framenavigated" /* FrameNavigated */, event));
        const networkManager = this._frameManager.networkManager();
        networkManager.on(NetworkManagerEmittedEvents.Request, (event) => this.emit("request" /* Request */, event));
        networkManager.on(NetworkManagerEmittedEvents.RequestServedFromCache, (event) => this.emit("requestservedfromcache" /* RequestServedFromCache */, event));
        networkManager.on(NetworkManagerEmittedEvents.Response, (event) => this.emit("response" /* Response */, event));
        networkManager.on(NetworkManagerEmittedEvents.RequestFailed, (event) => this.emit("requestfailed" /* RequestFailed */, event));
        networkManager.on(NetworkManagerEmittedEvents.RequestFinished, (event) => this.emit("requestfinished" /* RequestFinished */, event));
        this._fileChooserInterceptors = new Set();
        client.on('Page.domContentEventFired', () => this.emit("domcontentloaded" /* DOMContentLoaded */));
        client.on('Page.loadEventFired', () => this.emit("load" /* Load */));
        client.on('Runtime.consoleAPICalled', (event) => this._onConsoleAPI(event));
        client.on('Runtime.bindingCalled', (event) => this._onBindingCalled(event));
        client.on('Page.javascriptDialogOpening', (event) => this._onDialog(event));
        client.on('Runtime.exceptionThrown', (exception) => this._handleException(exception.exceptionDetails));
        client.on('Inspector.targetCrashed', () => this._onTargetCrashed());
        client.on('Performance.metrics', (event) => this._emitMetrics(event));
        client.on('Log.entryAdded', (event) => this._onLogEntryAdded(event));
        client.on('Page.fileChooserOpened', (event) => this._onFileChooser(event));
        this._target._isClosedPromise.then(() => {
            this.emit("close" /* Close */);
            this._closed = true;
        });
    }
    /**
     * @internal
     */
    static async create(client, target, ignoreHTTPSErrors, defaultViewport) {
        const page = new Page(client, target, ignoreHTTPSErrors);
        await page._initialize();
        if (defaultViewport)
            await page.setViewport(defaultViewport);
        return page;
    }
    async _initialize() {
        await Promise.all([
            this._frameManager.initialize(),
            this._client.send('Target.setAutoAttach', {
                autoAttach: true,
                waitForDebuggerOnStart: false,
                flatten: true,
            }),
            this._client.send('Performance.enable'),
            this._client.send('Log.enable'),
        ]);
    }
    async _onFileChooser(event) {
        if (!this._fileChooserInterceptors.size)
            return;
        const frame = this._frameManager.frame(event.frameId);
        const context = await frame.executionContext();
        const element = await context._adoptBackendNodeId(event.backendNodeId);
        const interceptors = Array.from(this._fileChooserInterceptors);
        this._fileChooserInterceptors.clear();
        const fileChooser = new FileChooser(element, event);
        for (const interceptor of interceptors)
            interceptor.call(null, fileChooser);
    }
    /**
     * @returns `true` if the page has JavaScript enabled, `false` otherwise.
     */
    isJavaScriptEnabled() {
        return this._javascriptEnabled;
    }
    /**
     * @param options - Optional waiting parameters
     * @returns Resolves after a page requests a file picker.
     */
    async waitForFileChooser(options = {}) {
        if (!this._fileChooserInterceptors.size)
            await this._client.send('Page.setInterceptFileChooserDialog', {
                enabled: true,
            });
        const { timeout = this._timeoutSettings.timeout() } = options;
        let callback;
        const promise = new Promise((x) => (callback = x));
        this._fileChooserInterceptors.add(callback);
        return helper
            .waitWithTimeout(promise, 'waiting for file chooser', timeout)
            .catch((error) => {
            this._fileChooserInterceptors.delete(callback);
            throw error;
        });
    }
    /**
     * Sets the page's geolocation.
     *
     * @remarks
     * Consider using {@link BrowserContext.overridePermissions} to grant
     * permissions for the page to read its geolocation.
     *
     * @example
     * ```js
     * await page.setGeolocation({latitude: 59.95, longitude: 30.31667});
     * ```
     */
    async setGeolocation(options) {
        const { longitude, latitude, accuracy = 0 } = options;
        if (longitude < -180 || longitude > 180)
            throw new Error(`Invalid longitude "${longitude}": precondition -180 <= LONGITUDE <= 180 failed.`);
        if (latitude < -90 || latitude > 90)
            throw new Error(`Invalid latitude "${latitude}": precondition -90 <= LATITUDE <= 90 failed.`);
        if (accuracy < 0)
            throw new Error(`Invalid accuracy "${accuracy}": precondition 0 <= ACCURACY failed.`);
        await this._client.send('Emulation.setGeolocationOverride', {
            longitude,
            latitude,
            accuracy,
        });
    }
    /**
     * @returns A target this page was created from.
     */
    target() {
        return this._target;
    }
    /**
     * @returns The browser this page belongs to.
     */
    browser() {
        return this._target.browser();
    }
    /**
     * @returns The browser context that the page belongs to
     */
    browserContext() {
        return this._target.browserContext();
    }
    _onTargetCrashed() {
        this.emit('error', new Error('Page crashed!'));
    }
    _onLogEntryAdded(event) {
        const { level, text, args, source, url, lineNumber } = event.entry;
        if (args)
            args.map((arg) => helper.releaseObject(this._client, arg));
        if (source !== 'worker')
            this.emit("console" /* Console */, new ConsoleMessage(level, text, [], [{ url, lineNumber }]));
    }
    /**
     * @returns The page's main frame.
     */
    mainFrame() {
        return this._frameManager.mainFrame();
    }
    get keyboard() {
        return this._keyboard;
    }
    get touchscreen() {
        return this._touchscreen;
    }
    get coverage() {
        return this._coverage;
    }
    get tracing() {
        return this._tracing;
    }
    get accessibility() {
        return this._accessibility;
    }
    /**
     * @returns An array of all frames attached to the page.
     */
    frames() {
        return this._frameManager.frames();
    }
    /**
     * @returns all of the dedicated
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API | WebWorkers}
     * associated with the page.
     */
    workers() {
        return Array.from(this._workers.values());
    }
    /**
     * @param value - Whether to enable request interception.
     * @param cacheSafe - Whether to trust browser caching. If set to false,
     * enabling request interception disables page caching. Defaults to false.
     *
     * @remarks
     * Activating request interception enables {@link HTTPRequest.abort},
     * {@link HTTPRequest.continue} and {@link HTTPRequest.respond} methods.  This
     * provides the capability to modify network requests that are made by a page.
     *
     * Once request interception is enabled, every request will stall unless it's
     * continued, responded or aborted; or completed using the browser cache.
     *
     * @example
     * An example of a naïve request interceptor that aborts all image requests:
     * ```js
     * const puppeteer = require('puppeteer');
     * (async () => {
     *   const browser = await puppeteer.launch();
     *   const page = await browser.newPage();
     *   await page.setRequestInterception(true);
     *   page.on('request', interceptedRequest => {
     *     if (interceptedRequest.url().endsWith('.png') ||
     *         interceptedRequest.url().endsWith('.jpg'))
     *       interceptedRequest.abort();
     *     else
     *       interceptedRequest.continue();
     *     });
     *   await page.goto('https://example.com');
     *   await browser.close();
     * })();
     * ```
     */
    async setRequestInterception(value, cacheSafe = false) {
        return this._frameManager
            .networkManager()
            .setRequestInterception(value, cacheSafe);
    }
    /**
     * @param enabled - When `true`, enables offline mode for the page.
     */
    setOfflineMode(enabled) {
        return this._frameManager.networkManager().setOfflineMode(enabled);
    }
    emulateNetworkConditions(networkConditions) {
        return this._frameManager
            .networkManager()
            .emulateNetworkConditions(networkConditions);
    }
    /**
     * @param timeout - Maximum navigation time in milliseconds.
     */
    setDefaultNavigationTimeout(timeout) {
        this._timeoutSettings.setDefaultNavigationTimeout(timeout);
    }
    /**
     * @param timeout - Maximum time in milliseconds.
     */
    setDefaultTimeout(timeout) {
        this._timeoutSettings.setDefaultTimeout(timeout);
    }
    /**
     * Runs `document.querySelector` within the page. If no element matches the
     * selector, the return value resolves to `null`.
     *
     * @remarks
     * Shortcut for {@link Frame.$ | Page.mainFrame().$(selector) }.
     *
     * @param selector - A
     * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
     * to query page for.
     */
    async $(selector) {
        return this.mainFrame().$(selector);
    }
    /**
     * @remarks
     *
     * The only difference between {@link Page.evaluate | page.evaluate} and
     * `page.evaluateHandle` is that `evaluateHandle` will return the value
     * wrapped in an in-page object.
     *
     * If the function passed to `page.evaluteHandle` returns a Promise, the
     * function will wait for the promise to resolve and return its value.
     *
     * You can pass a string instead of a function (although functions are
     * recommended as they are easier to debug and use with TypeScript):
     *
     * @example
     * ```
     * const aHandle = await page.evaluateHandle('document')
     * ```
     *
     * @example
     * {@link JSHandle} instances can be passed as arguments to the `pageFunction`:
     * ```
     * const aHandle = await page.evaluateHandle(() => document.body);
     * const resultHandle = await page.evaluateHandle(body => body.innerHTML, aHandle);
     * console.log(await resultHandle.jsonValue());
     * await resultHandle.dispose();
     * ```
     *
     * Most of the time this function returns a {@link JSHandle},
     * but if `pageFunction` returns a reference to an element,
     * you instead get an {@link ElementHandle} back:
     *
     * @example
     * ```
     * const button = await page.evaluateHandle(() => document.querySelector('button'));
     * // can call `click` because `button` is an `ElementHandle`
     * await button.click();
     * ```
     *
     * The TypeScript definitions assume that `evaluateHandle` returns
     *  a `JSHandle`, but if you know it's going to return an
     * `ElementHandle`, pass it as the generic argument:
     *
     * ```
     * const button = await page.evaluateHandle<ElementHandle>(...);
     * ```
     *
     * @param pageFunction - a function that is run within the page
     * @param args - arguments to be passed to the pageFunction
     */
    async evaluateHandle(pageFunction, ...args) {
        const context = await this.mainFrame().executionContext();
        return context.evaluateHandle(pageFunction, ...args);
    }
    /**
     * This method iterates the JavaScript heap and finds all objects with the
     * given prototype.
     *
     * @remarks
     *
     * @example
     *
     * ```js
     * // Create a Map object
     * await page.evaluate(() => window.map = new Map());
     * // Get a handle to the Map object prototype
     * const mapPrototype = await page.evaluateHandle(() => Map.prototype);
     * // Query all map instances into an array
     * const mapInstances = await page.queryObjects(mapPrototype);
     * // Count amount of map objects in heap
     * const count = await page.evaluate(maps => maps.length, mapInstances);
     * await mapInstances.dispose();
     * await mapPrototype.dispose();
     * ```
     * @param prototypeHandle - a handle to the object prototype.
     */
    async queryObjects(prototypeHandle) {
        const context = await this.mainFrame().executionContext();
        return context.queryObjects(prototypeHandle);
    }
    /**
     * This method runs `document.querySelector` within the page and passes the
     * result as the first argument to the `pageFunction`.
     *
     * @remarks
     *
     * If no element is found matching `selector`, the method will throw an error.
     *
     * If `pageFunction` returns a promise `$eval` will wait for the promise to
     * resolve and then return its value.
     *
     * @example
     *
     * ```
     * const searchValue = await page.$eval('#search', el => el.value);
     * const preloadHref = await page.$eval('link[rel=preload]', el => el.href);
     * const html = await page.$eval('.main-container', el => el.outerHTML);
     * ```
     *
     * If you are using TypeScript, you may have to provide an explicit type to the
     * first argument of the `pageFunction`.
     * By default it is typed as `Element`, but you may need to provide a more
     * specific sub-type:
     *
     * @example
     *
     * ```
     * // if you don't provide HTMLInputElement here, TS will error
     * // as `value` is not on `Element`
     * const searchValue = await page.$eval('#search', (el: HTMLInputElement) => el.value);
     * ```
     *
     * The compiler should be able to infer the return type
     * from the `pageFunction` you provide. If it is unable to, you can use the generic
     * type to tell the compiler what return type you expect from `$eval`:
     *
     * @example
     *
     * ```
     * // The compiler can infer the return type in this case, but if it can't
     * // or if you want to be more explicit, provide it as the generic type.
     * const searchValue = await page.$eval<string>(
     *  '#search', (el: HTMLInputElement) => el.value
     * );
     * ```
     *
     * @param selector - the
     * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
     * to query for
     * @param pageFunction - the function to be evaluated in the page context.
     * Will be passed the result of `document.querySelector(selector)` as its
     * first argument.
     * @param args - any additional arguments to pass through to `pageFunction`.
     *
     * @returns The result of calling `pageFunction`. If it returns an element it
     * is wrapped in an {@link ElementHandle}, else the raw value itself is
     * returned.
     */
    async $eval(selector, pageFunction, ...args) {
        return this.mainFrame().$eval(selector, pageFunction, ...args);
    }
    /**
     * This method runs `Array.from(document.querySelectorAll(selector))` within
     * the page and passes the result as the first argument to the `pageFunction`.
     *
     * @remarks
     *
     * If `pageFunction` returns a promise `$$eval` will wait for the promise to
     * resolve and then return its value.
     *
     * @example
     *
     * ```
     * // get the amount of divs on the page
     * const divCount = await page.$$eval('div', divs => divs.length);
     *
     * // get the text content of all the `.options` elements:
     * const options = await page.$$eval('div > span.options', options => {
     *   return options.map(option => option.textContent)
     * });
     * ```
     *
     * If you are using TypeScript, you may have to provide an explicit type to the
     * first argument of the `pageFunction`.
     * By default it is typed as `Element[]`, but you may need to provide a more
     * specific sub-type:
     *
     * @example
     *
     * ```
     * // if you don't provide HTMLInputElement here, TS will error
     * // as `value` is not on `Element`
     * await page.$$eval('input', (elements: HTMLInputElement[]) => {
     *   return elements.map(e => e.value);
     * });
     * ```
     *
     * The compiler should be able to infer the return type
     * from the `pageFunction` you provide. If it is unable to, you can use the generic
     * type to tell the compiler what return type you expect from `$$eval`:
     *
     * @example
     *
     * ```
     * // The compiler can infer the return type in this case, but if it can't
     * // or if you want to be more explicit, provide it as the generic type.
     * const allInputValues = await page.$$eval<string[]>(
     *  'input', (elements: HTMLInputElement[]) => elements.map(e => e.textContent)
     * );
     * ```
     *
     * @param selector the
     * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors | selector}
     * to query for
     * @param pageFunction the function to be evaluated in the page context. Will
     * be passed the result of `Array.from(document.querySelectorAll(selector))`
     * as its first argument.
     * @param args any additional arguments to pass through to `pageFunction`.
     *
     * @returns The result of calling `pageFunction`. If it returns an element it
     * is wrapped in an {@link ElementHandle}, else the raw value itself is
     * returned.
     */
    async $$eval(selector, pageFunction, ...args) {
        return this.mainFrame().$$eval(selector, pageFunction, ...args);
    }
    async $$(selector) {
        return this.mainFrame().$$(selector);
    }
    async $x(expression) {
        return this.mainFrame().$x(expression);
    }
    /**
     * If no URLs are specified, this method returns cookies for the current page
     * URL. If URLs are specified, only cookies for those URLs are returned.
     */
    async cookies(...urls) {
        const originalCookies = (await this._client.send('Network.getCookies', {
            urls: urls.length ? urls : [this.url()],
        })).cookies;
        const unsupportedCookieAttributes = ['priority'];
        const filterUnsupportedAttributes = (cookie) => {
            for (const attr of unsupportedCookieAttributes)
                delete cookie[attr];
            return cookie;
        };
        return originalCookies.map(filterUnsupportedAttributes);
    }
    async deleteCookie(...cookies) {
        const pageURL = this.url();
        for (const cookie of cookies) {
            const item = Object.assign({}, cookie);
            if (!cookie.url && pageURL.startsWith('http'))
                item.url = pageURL;
            await this._client.send('Network.deleteCookies', item);
        }
    }
    async setCookie(...cookies) {
        const pageURL = this.url();
        const startsWithHTTP = pageURL.startsWith('http');
        const items = cookies.map((cookie) => {
            const item = Object.assign({}, cookie);
            if (!item.url && startsWithHTTP)
                item.url = pageURL;
            assert(item.url !== 'about:blank', `Blank page can not have cookie "${item.name}"`);
            assert(!String.prototype.startsWith.call(item.url || '', 'data:'), `Data URL page can not have cookie "${item.name}"`);
            return item;
        });
        await this.deleteCookie(...items);
        if (items.length)
            await this._client.send('Network.setCookies', { cookies: items });
    }
    async addScriptTag(options) {
        return this.mainFrame().addScriptTag(options);
    }
    async addStyleTag(options) {
        return this.mainFrame().addStyleTag(options);
    }
    async exposeFunction(name, puppeteerFunction) {
        if (this._pageBindings.has(name))
            throw new Error(`Failed to add page binding with name ${name}: window['${name}'] already exists!`);
        this._pageBindings.set(name, puppeteerFunction);
        const expression = helper.pageBindingInitString('exposedFun', name);
        await this._client.send('Runtime.addBinding', { name: name });
        await this._client.send('Page.addScriptToEvaluateOnNewDocument', {
            source: expression,
        });
        await Promise.all(this.frames().map((frame) => frame.evaluate(expression).catch(debugError)));
    }
    async authenticate(credentials) {
        return this._frameManager.networkManager().authenticate(credentials);
    }
    async setExtraHTTPHeaders(headers) {
        return this._frameManager.networkManager().setExtraHTTPHeaders(headers);
    }
    async setUserAgent(userAgent) {
        return this._frameManager.networkManager().setUserAgent(userAgent);
    }
    async metrics() {
        const response = await this._client.send('Performance.getMetrics');
        return this._buildMetricsObject(response.metrics);
    }
    _emitMetrics(event) {
        this.emit("metrics" /* Metrics */, {
            title: event.title,
            metrics: this._buildMetricsObject(event.metrics),
        });
    }
    _buildMetricsObject(metrics) {
        const result = {};
        for (const metric of metrics || []) {
            if (supportedMetrics.has(metric.name))
                result[metric.name] = metric.value;
        }
        return result;
    }
    _handleException(exceptionDetails) {
        const message = helper.getExceptionMessage(exceptionDetails);
        const err = new Error(message);
        err.stack = ''; // Don't report clientside error with a node stack attached
        this.emit("pageerror" /* PageError */, err);
    }
    async _onConsoleAPI(event) {
        if (event.executionContextId === 0) {
            // DevTools protocol stores the last 1000 console messages. These
            // messages are always reported even for removed execution contexts. In
            // this case, they are marked with executionContextId = 0 and are
            // reported upon enabling Runtime agent.
            //
            // Ignore these messages since:
            // - there's no execution context we can use to operate with message
            //   arguments
            // - these messages are reported before Puppeteer clients can subscribe
            //   to the 'console'
            //   page event.
            //
            // @see https://github.com/puppeteer/puppeteer/issues/3865
            return;
        }
        const context = this._frameManager.executionContextById(event.executionContextId);
        const values = event.args.map((arg) => createJSHandle(context, arg));
        this._addConsoleMessage(event.type, values, event.stackTrace);
    }
    async _onBindingCalled(event) {
        let payload;
        try {
            payload = JSON.parse(event.payload);
        }
        catch {
            // The binding was either called by something in the page or it was
            // called before our wrapper was initialized.
            return;
        }
        const { type, name, seq, args } = payload;
        if (type !== 'exposedFun' || !this._pageBindings.has(name))
            return;
        let expression = null;
        try {
            const result = await this._pageBindings.get(name)(...args);
            expression = helper.pageBindingDeliverResultString(name, seq, result);
        }
        catch (error) {
            if (error instanceof Error)
                expression = helper.pageBindingDeliverErrorString(name, seq, error.message, error.stack);
            else
                expression = helper.pageBindingDeliverErrorValueString(name, seq, error);
        }
        this._client
            .send('Runtime.evaluate', {
            expression,
            contextId: event.executionContextId,
        })
            .catch(debugError);
    }
    _addConsoleMessage(type, args, stackTrace) {
        if (!this.listenerCount("console" /* Console */)) {
            args.forEach((arg) => arg.dispose());
            return;
        }
        const textTokens = [];
        for (const arg of args) {
            const remoteObject = arg._remoteObject;
            if (remoteObject.objectId)
                textTokens.push(arg.toString());
            else
                textTokens.push(helper.valueFromRemoteObject(remoteObject));
        }
        const stackTraceLocations = [];
        if (stackTrace) {
            for (const callFrame of stackTrace.callFrames) {
                stackTraceLocations.push({
                    url: callFrame.url,
                    lineNumber: callFrame.lineNumber,
                    columnNumber: callFrame.columnNumber,
                });
            }
        }
        const message = new ConsoleMessage(type, textTokens.join(' '), args, stackTraceLocations);
        this.emit("console" /* Console */, message);
    }
    _onDialog(event) {
        let dialogType = null;
        const validDialogTypes = new Set([
            'alert',
            'confirm',
            'prompt',
            'beforeunload',
        ]);
        if (validDialogTypes.has(event.type)) {
            dialogType = event.type;
        }
        assert(dialogType, 'Unknown javascript dialog type: ' + event.type);
        const dialog = new Dialog(this._client, dialogType, event.message, event.defaultPrompt);
        this.emit("dialog" /* Dialog */, dialog);
    }
    /**
     * Resets default white background
     */
    async _resetDefaultBackgroundColor() {
        await this._client.send('Emulation.setDefaultBackgroundColorOverride');
    }
    /**
     * Hides default white background
     */
    async _setTransparentBackgroundColor() {
        await this._client.send('Emulation.setDefaultBackgroundColorOverride', {
            color: { r: 0, g: 0, b: 0, a: 0 },
        });
    }
    url() {
        return this.mainFrame().url();
    }
    async content() {
        return await this._frameManager.mainFrame().content();
    }
    async setContent(html, options = {}) {
        await this._frameManager.mainFrame().setContent(html, options);
    }
    async goto(url, options = {}) {
        return await this._frameManager.mainFrame().goto(url, options);
    }
    async reload(options) {
        const result = await Promise.all([
            this.waitForNavigation(options),
            this._client.send('Page.reload'),
        ]);
        return result[0];
    }
    async waitForNavigation(options = {}) {
        return await this._frameManager.mainFrame().waitForNavigation(options);
    }
    _sessionClosePromise() {
        if (!this._disconnectPromise)
            this._disconnectPromise = new Promise((fulfill) => this._client.once(CDPSessionEmittedEvents.Disconnected, () => fulfill(new Error('Target closed'))));
        return this._disconnectPromise;
    }
    async waitForRequest(urlOrPredicate, options = {}) {
        const { timeout = this._timeoutSettings.timeout() } = options;
        return helper.waitForEvent(this._frameManager.networkManager(), NetworkManagerEmittedEvents.Request, (request) => {
            if (helper.isString(urlOrPredicate))
                return urlOrPredicate === request.url();
            if (typeof urlOrPredicate === 'function')
                return !!urlOrPredicate(request);
            return false;
        }, timeout, this._sessionClosePromise());
    }
    async waitForResponse(urlOrPredicate, options = {}) {
        const { timeout = this._timeoutSettings.timeout() } = options;
        return helper.waitForEvent(this._frameManager.networkManager(), NetworkManagerEmittedEvents.Response, async (response) => {
            if (helper.isString(urlOrPredicate))
                return urlOrPredicate === response.url();
            if (typeof urlOrPredicate === 'function')
                return !!(await urlOrPredicate(response));
            return false;
        }, timeout, this._sessionClosePromise());
    }
    async goBack(options = {}) {
        return this._go(-1, options);
    }
    async goForward(options = {}) {
        return this._go(+1, options);
    }
    async _go(delta, options) {
        const history = await this._client.send('Page.getNavigationHistory');
        const entry = history.entries[history.currentIndex + delta];
        if (!entry)
            return null;
        const result = await Promise.all([
            this.waitForNavigation(options),
            this._client.send('Page.navigateToHistoryEntry', { entryId: entry.id }),
        ]);
        return result[0];
    }
    async bringToFront() {
        await this._client.send('Page.bringToFront');
    }
    async emulate(options) {
        await Promise.all([
            this.setViewport(options.viewport),
            this.setUserAgent(options.userAgent),
        ]);
    }
    async setJavaScriptEnabled(enabled) {
        if (this._javascriptEnabled === enabled)
            return;
        this._javascriptEnabled = enabled;
        await this._client.send('Emulation.setScriptExecutionDisabled', {
            value: !enabled,
        });
    }
    async setBypassCSP(enabled) {
        await this._client.send('Page.setBypassCSP', { enabled });
    }
    async emulateMediaType(type) {
        assert(type === 'screen' || type === 'print' || type === null, 'Unsupported media type: ' + type);
        await this._client.send('Emulation.setEmulatedMedia', {
            media: type || '',
        });
    }
    async emulateMediaFeatures(features) {
        if (features === null)
            await this._client.send('Emulation.setEmulatedMedia', { features: null });
        if (Array.isArray(features)) {
            features.every((mediaFeature) => {
                const name = mediaFeature.name;
                assert(/^(?:prefers-(?:color-scheme|reduced-motion)|color-gamut)$/.test(name), 'Unsupported media feature: ' + name);
                return true;
            });
            await this._client.send('Emulation.setEmulatedMedia', {
                features: features,
            });
        }
    }
    async emulateTimezone(timezoneId) {
        try {
            await this._client.send('Emulation.setTimezoneOverride', {
                timezoneId: timezoneId || '',
            });
        }
        catch (error) {
            if (error.message.includes('Invalid timezone'))
                throw new Error(`Invalid timezone ID: ${timezoneId}`);
            throw error;
        }
    }
    /**
     * Emulates the idle state.
     * If no arguments set, clears idle state emulation.
     *
     * @example
     * ```js
     * // set idle emulation
     * await page.emulateIdleState({isUserActive: true, isScreenUnlocked: false});
     *
     * // do some checks here
     * ...
     *
     * // clear idle emulation
     * await page.emulateIdleState();
     * ```
     *
     * @param overrides Mock idle state. If not set, clears idle overrides
     * @param isUserActive Mock isUserActive
     * @param isScreenUnlocked Mock isScreenUnlocked
     */
    async emulateIdleState(overrides) {
        if (overrides) {
            await this._client.send('Emulation.setIdleOverride', {
                isUserActive: overrides.isUserActive,
                isScreenUnlocked: overrides.isScreenUnlocked,
            });
        }
        else {
            await this._client.send('Emulation.clearIdleOverride');
        }
    }
    /**
     * Simulates the given vision deficiency on the page.
     *
     * @example
     * ```js
     * const puppeteer = require('puppeteer');
     *
     * (async () => {
     *   const browser = await puppeteer.launch();
     *   const page = await browser.newPage();
     *   await page.goto('https://v8.dev/blog/10-years');
     *
     *   await page.emulateVisionDeficiency('achromatopsia');
     *   await page.screenshot({ path: 'achromatopsia.png' });
     *
     *   await page.emulateVisionDeficiency('deuteranopia');
     *   await page.screenshot({ path: 'deuteranopia.png' });
     *
     *   await page.emulateVisionDeficiency('blurredVision');
     *   await page.screenshot({ path: 'blurred-vision.png' });
     *
     *   await browser.close();
     * })();
     * ```
     *
     * @param type - the type of deficiency to simulate, or `'none'` to reset.
     */
    async emulateVisionDeficiency(type) {
        const visionDeficiencies = new Set([
            'none',
            'achromatopsia',
            'blurredVision',
            'deuteranopia',
            'protanopia',
            'tritanopia',
        ]);
        try {
            assert(!type || visionDeficiencies.has(type), `Unsupported vision deficiency: ${type}`);
            await this._client.send('Emulation.setEmulatedVisionDeficiency', {
                type: type || 'none',
            });
        }
        catch (error) {
            throw error;
        }
    }
    async setViewport(viewport) {
        const needsReload = await this._emulationManager.emulateViewport(viewport);
        this._viewport = viewport;
        if (needsReload)
            await this.reload();
    }
    viewport() {
        return this._viewport;
    }
    /**
     * @remarks
     *
     * Evaluates a function in the page's context and returns the result.
     *
     * If the function passed to `page.evaluteHandle` returns a Promise, the
     * function will wait for the promise to resolve and return its value.
     *
     * @example
     *
     * ```js
     * const result = await frame.evaluate(() => {
     *   return Promise.resolve(8 * 7);
     * });
     * console.log(result); // prints "56"
     * ```
     *
     * You can pass a string instead of a function (although functions are
     * recommended as they are easier to debug and use with TypeScript):
     *
     * @example
     * ```
     * const aHandle = await page.evaluate('1 + 2');
     * ```
     *
     * To get the best TypeScript experience, you should pass in as the
     * generic the type of `pageFunction`:
     *
     * ```
     * const aHandle = await page.evaluate<() => number>(() => 2);
     * ```
     *
     * @example
     *
     * {@link ElementHandle} instances (including {@link JSHandle}s) can be passed
     * as arguments to the `pageFunction`:
     *
     * ```
     * const bodyHandle = await page.$('body');
     * const html = await page.evaluate(body => body.innerHTML, bodyHandle);
     * await bodyHandle.dispose();
     * ```
     *
     * @param pageFunction - a function that is run within the page
     * @param args - arguments to be passed to the pageFunction
     *
     * @returns the return value of `pageFunction`.
     */
    async evaluate(pageFunction, ...args) {
        return this._frameManager.mainFrame().evaluate(pageFunction, ...args);
    }
    async evaluateOnNewDocument(pageFunction, ...args) {
        const source = helper.evaluationString(pageFunction, ...args);
        await this._client.send('Page.addScriptToEvaluateOnNewDocument', {
            source,
        });
    }
    async setCacheEnabled(enabled = true) {
        await this._frameManager.networkManager().setCacheEnabled(enabled);
    }
    async screenshot(options = {}) {
        let screenshotType = null;
        // options.type takes precedence over inferring the type from options.path
        // because it may be a 0-length file with no extension created beforehand
        // (i.e. as a temp file).
        if (options.type) {
            assert(options.type === 'png' || options.type === 'jpeg', 'Unknown options.type value: ' + options.type);
            screenshotType = options.type;
        }
        else if (options.path) {
            const filePath = options.path;
            const extension = filePath
                .slice(filePath.lastIndexOf('.') + 1)
                .toLowerCase();
            if (extension === 'png')
                screenshotType = 'png';
            else if (extension === 'jpg' || extension === 'jpeg')
                screenshotType = 'jpeg';
            assert(screenshotType, `Unsupported screenshot type for extension \`.${extension}\``);
        }
        if (!screenshotType)
            screenshotType = 'png';
        if (options.quality) {
            assert(screenshotType === 'jpeg', 'options.quality is unsupported for the ' +
                screenshotType +
                ' screenshots');
            assert(typeof options.quality === 'number', 'Expected options.quality to be a number but found ' +
                typeof options.quality);
            assert(Number.isInteger(options.quality), 'Expected options.quality to be an integer');
            assert(options.quality >= 0 && options.quality <= 100, 'Expected options.quality to be between 0 and 100 (inclusive), got ' +
                options.quality);
        }
        assert(!options.clip || !options.fullPage, 'options.clip and options.fullPage are exclusive');
        if (options.clip) {
            assert(typeof options.clip.x === 'number', 'Expected options.clip.x to be a number but found ' +
                typeof options.clip.x);
            assert(typeof options.clip.y === 'number', 'Expected options.clip.y to be a number but found ' +
                typeof options.clip.y);
            assert(typeof options.clip.width === 'number', 'Expected options.clip.width to be a number but found ' +
                typeof options.clip.width);
            assert(typeof options.clip.height === 'number', 'Expected options.clip.height to be a number but found ' +
                typeof options.clip.height);
            assert(options.clip.width !== 0, 'Expected options.clip.width not to be 0.');
            assert(options.clip.height !== 0, 'Expected options.clip.height not to be 0.');
        }
        return this._screenshotTaskQueue.postTask(() => this._screenshotTask(screenshotType, options));
    }
    async _screenshotTask(format, options) {
        await this._client.send('Target.activateTarget', {
            targetId: this._target._targetId,
        });
        let clip = options.clip ? processClip(options.clip) : undefined;
        if (options.fullPage) {
            const metrics = await this._client.send('Page.getLayoutMetrics');
            const width = Math.ceil(metrics.contentSize.width);
            const height = Math.ceil(metrics.contentSize.height);
            // Overwrite clip for full page.
            clip = { x: 0, y: 0, width, height, scale: 1 };
        }
        const shouldSetDefaultBackground = options.omitBackground && format === 'png';
        if (shouldSetDefaultBackground) {
            await this._setTransparentBackgroundColor();
        }
        const result = await this._client.send('Page.captureScreenshot', {
            format,
            quality: options.quality,
            clip,
            captureBeyondViewport: true,
        });
        if (shouldSetDefaultBackground) {
            await this._resetDefaultBackgroundColor();
        }
        if (options.fullPage && this._viewport)
            await this.setViewport(this._viewport);
        const buffer = options.encoding === 'base64'
            ? result.data
            : Buffer.from(result.data, 'base64');
        if (options.path) {
            if (!isNode) {
                throw new Error('Screenshots can only be written to a file path in a Node environment.');
            }
            const fs = await helper.importFSModule();
            await fs.promises.writeFile(options.path, buffer);
        }
        return buffer;
        function processClip(clip) {
            const x = Math.round(clip.x);
            const y = Math.round(clip.y);
            const width = Math.round(clip.width + clip.x - x);
            const height = Math.round(clip.height + clip.y - y);
            return { x, y, width, height, scale: 1 };
        }
    }
    /**
     * Generatees a PDF of the page with the `print` CSS media type.
     * @remarks
     *
     * IMPORTANT: PDF generation is only supported in Chrome headless mode.
     *
     * To generate a PDF with the `screen` media type, call
     * {@link Page.emulateMediaType | `page.emulateMediaType('screen')`} before
     * calling `page.pdf()`.
     *
     * By default, `page.pdf()` generates a pdf with modified colors for printing.
     * Use the
     * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-print-color-adjust | `-webkit-print-color-adjust`}
     * property to force rendering of exact colors.
     *
     *
     * @param options - options for generating the PDF.
     */
    async pdf(options = {}) {
        const { scale = 1, displayHeaderFooter = false, headerTemplate = '', footerTemplate = '', printBackground = false, landscape = false, pageRanges = '', preferCSSPageSize = false, margin = {}, path = null, omitBackground = false, } = options;
        let paperWidth = 8.5;
        let paperHeight = 11;
        if (options.format) {
            const format = paperFormats[options.format.toLowerCase()];
            assert(format, 'Unknown paper format: ' + options.format);
            paperWidth = format.width;
            paperHeight = format.height;
        }
        else {
            paperWidth = convertPrintParameterToInches(options.width) || paperWidth;
            paperHeight =
                convertPrintParameterToInches(options.height) || paperHeight;
        }
        const marginTop = convertPrintParameterToInches(margin.top) || 0;
        const marginLeft = convertPrintParameterToInches(margin.left) || 0;
        const marginBottom = convertPrintParameterToInches(margin.bottom) || 0;
        const marginRight = convertPrintParameterToInches(margin.right) || 0;
        if (omitBackground) {
            await this._setTransparentBackgroundColor();
        }
        const result = await this._client.send('Page.printToPDF', {
            transferMode: 'ReturnAsStream',
            landscape,
            displayHeaderFooter,
            headerTemplate,
            footerTemplate,
            printBackground,
            scale,
            paperWidth,
            paperHeight,
            marginTop,
            marginBottom,
            marginLeft,
            marginRight,
            pageRanges,
            preferCSSPageSize,
        });
        if (omitBackground) {
            await this._resetDefaultBackgroundColor();
        }
        return await helper.readProtocolStream(this._client, result.stream, path);
    }
    async title() {
        return this.mainFrame().title();
    }
    async close(options = { runBeforeUnload: undefined }) {
        assert(!!this._client._connection, 'Protocol error: Connection closed. Most likely the page has been closed.');
        const runBeforeUnload = !!options.runBeforeUnload;
        if (runBeforeUnload) {
            await this._client.send('Page.close');
        }
        else {
            await this._client._connection.send('Target.closeTarget', {
                targetId: this._target._targetId,
            });
            await this._target._isClosedPromise;
        }
    }
    isClosed() {
        return this._closed;
    }
    get mouse() {
        return this._mouse;
    }
    click(selector, options = {}) {
        return this.mainFrame().click(selector, options);
    }
    focus(selector) {
        return this.mainFrame().focus(selector);
    }
    hover(selector) {
        return this.mainFrame().hover(selector);
    }
    select(selector, ...values) {
        return this.mainFrame().select(selector, ...values);
    }
    tap(selector) {
        return this.mainFrame().tap(selector);
    }
    type(selector, text, options) {
        return this.mainFrame().type(selector, text, options);
    }
    /**
     * @remarks
     *
     * This method behaves differently depending on the first parameter. If it's a
     * `string`, it will be treated as a `selector` or `xpath` (if the string
     * starts with `//`). This method then is a shortcut for
     * {@link Page.waitForSelector} or {@link Page.waitForXPath}.
     *
     * If the first argument is a function this method is a shortcut for
     * {@link Page.waitForFunction}.
     *
     * If the first argument is a `number`, it's treated as a timeout in
     * milliseconds and the method returns a promise which resolves after the
     * timeout.
     *
     * @param selectorOrFunctionOrTimeout - a selector, predicate or timeout to
     * wait for.
     * @param options - optional waiting parameters.
     * @param args - arguments to pass to `pageFunction`.
     *
     * @deprecated Don't use this method directly. Instead use the more explicit
     * methods available: {@link Page.waitForSelector},
     * {@link Page.waitForXPath}, {@link Page.waitForFunction} or
     * {@link Page.waitForTimeout}.
     */
    waitFor(selectorOrFunctionOrTimeout, options = {}, ...args) {
        return this.mainFrame().waitFor(selectorOrFunctionOrTimeout, options, ...args);
    }
    /**
     * Causes your script to wait for the given number of milliseconds.
     *
     * @remarks
     *
     * It's generally recommended to not wait for a number of seconds, but instead
     * use {@link Page.waitForSelector}, {@link Page.waitForXPath} or
     * {@link Page.waitForFunction} to wait for exactly the conditions you want.
     *
     * @example
     *
     * Wait for 1 second:
     *
     * ```
     * await page.waitForTimeout(1000);
     * ```
     *
     * @param milliseconds - the number of milliseconds to wait.
     */
    waitForTimeout(milliseconds) {
        return this.mainFrame().waitForTimeout(milliseconds);
    }
    waitForSelector(selector, options = {}) {
        return this.mainFrame().waitForSelector(selector, options);
    }
    waitForXPath(xpath, options = {}) {
        return this.mainFrame().waitForXPath(xpath, options);
    }
    waitForFunction(pageFunction, options = {}, ...args) {
        return this.mainFrame().waitForFunction(pageFunction, options, ...args);
    }
}
const supportedMetrics = new Set([
    'Timestamp',
    'Documents',
    'Frames',
    'JSEventListeners',
    'Nodes',
    'LayoutCount',
    'RecalcStyleCount',
    'LayoutDuration',
    'RecalcStyleDuration',
    'ScriptDuration',
    'TaskDuration',
    'JSHeapUsedSize',
    'JSHeapTotalSize',
]);
const unitToPixels = {
    px: 1,
    in: 96,
    cm: 37.8,
    mm: 3.78,
};
function convertPrintParameterToInches(parameter) {
    if (typeof parameter === 'undefined')
        return undefined;
    let pixels;
    if (helper.isNumber(parameter)) {
        // Treat numbers as pixel values to be aligned with phantom's paperSize.
        pixels = /** @type {number} */ parameter;
    }
    else if (helper.isString(parameter)) {
        const text = /** @type {string} */ parameter;
        let unit = text.substring(text.length - 2).toLowerCase();
        let valueText = '';
        if (unitToPixels.hasOwnProperty(unit)) {
            valueText = text.substring(0, text.length - 2);
        }
        else {
            // In case of unknown unit try to parse the whole parameter as number of pixels.
            // This is consistent with phantom's paperSize behavior.
            unit = 'px';
            valueText = text;
        }
        const value = Number(valueText);
        assert(!isNaN(value), 'Failed to parse parameter value: ' + text);
        pixels = value * unitToPixels[unit];
    }
    else {
        throw new Error('page.pdf() Cannot handle parameter type: ' + typeof parameter);
    }
    return pixels / 96;
}
//# sourceMappingURL=Page.js.map