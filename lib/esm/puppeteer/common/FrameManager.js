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
import { debug } from '../common/Debug.js';
import { EventEmitter } from './EventEmitter.js';
import { assert } from './assert.js';
import { helper, debugError } from './helper.js';
import { ExecutionContext, EVALUATION_SCRIPT_URL } from './ExecutionContext.js';
import { LifecycleWatcher, } from './LifecycleWatcher.js';
import { DOMWorld } from './DOMWorld.js';
import { NetworkManager } from './NetworkManager.js';
const UTILITY_WORLD_NAME = '__puppeteer_utility_world__';
/**
 * We use symbols to prevent external parties listening to these events.
 * They are internal to Puppeteer.
 *
 * @internal
 */
export const FrameManagerEmittedEvents = {
    FrameAttached: Symbol('FrameManager.FrameAttached'),
    FrameNavigated: Symbol('FrameManager.FrameNavigated'),
    FrameDetached: Symbol('FrameManager.FrameDetached'),
    LifecycleEvent: Symbol('FrameManager.LifecycleEvent'),
    FrameNavigatedWithinDocument: Symbol('FrameManager.FrameNavigatedWithinDocument'),
    ExecutionContextCreated: Symbol('FrameManager.ExecutionContextCreated'),
    ExecutionContextDestroyed: Symbol('FrameManager.ExecutionContextDestroyed'),
};
/**
 * @internal
 */
export class FrameManager extends EventEmitter {
    constructor(client, page, ignoreHTTPSErrors, timeoutSettings) {
        super();
        this._frames = new Map();
        this._contextIdToContext = new Map();
        this._isolatedWorlds = new Set();
        this._client = client;
        this._page = page;
        this._networkManager = new NetworkManager(client, ignoreHTTPSErrors, this);
        this._timeoutSettings = timeoutSettings;
        this._client.on('Page.frameAttached', (event) => this._onFrameAttached(event.frameId, event.parentFrameId));
        this._client.on('Page.frameNavigated', (event) => this._onFrameNavigated(event.frame));
        this._client.on('Page.navigatedWithinDocument', (event) => this._onFrameNavigatedWithinDocument(event.frameId, event.url));
        this._client.on('Page.frameDetached', (event) => this._onFrameDetached(event.frameId));
        this._client.on('Page.frameStoppedLoading', (event) => this._onFrameStoppedLoading(event.frameId));
        this._client.on('Runtime.executionContextCreated', (event) => this._onExecutionContextCreated(event.context));
        this._client.on('Runtime.executionContextDestroyed', (event) => this._onExecutionContextDestroyed(event.executionContextId));
        this._client.on('Runtime.executionContextsCleared', () => this._onExecutionContextsCleared());
        this._client.on('Page.lifecycleEvent', (event) => this._onLifecycleEvent(event));
        this._client.on('Target.attachedToTarget', async (event) => this._onFrameMoved(event));
    }
    async initialize() {
        const result = await Promise.all([
            this._client.send('Page.enable'),
            this._client.send('Page.getFrameTree'),
        ]);
        const { frameTree } = result[1];
        this._handleFrameTree(frameTree);
        await Promise.all([
            this._client.send('Page.setLifecycleEventsEnabled', { enabled: true }),
            this._client
                .send('Runtime.enable')
                .then(() => this._ensureIsolatedWorld(UTILITY_WORLD_NAME)),
            this._networkManager.initialize(),
        ]);
    }
    networkManager() {
        return this._networkManager;
    }
    async navigateFrame(frame, url, options = {}) {
        assertNoLegacyNavigationOptions(options);
        const { referer = this._networkManager.extraHTTPHeaders()['referer'], waitUntil = ['load'], timeout = this._timeoutSettings.navigationTimeout(), } = options;
        const watcher = new LifecycleWatcher(this, frame, waitUntil, timeout);
        let ensureNewDocumentNavigation = false;
        let error = await Promise.race([
            navigate(this._client, url, referer, frame._id),
            watcher.timeoutOrTerminationPromise(),
        ]);
        if (!error) {
            error = await Promise.race([
                watcher.timeoutOrTerminationPromise(),
                ensureNewDocumentNavigation
                    ? watcher.newDocumentNavigationPromise()
                    : watcher.sameDocumentNavigationPromise(),
            ]);
        }
        watcher.dispose();
        if (error)
            throw error;
        return watcher.navigationResponse();
        async function navigate(client, url, referrer, frameId) {
            try {
                const response = await client.send('Page.navigate', {
                    url,
                    referrer,
                    frameId,
                });
                ensureNewDocumentNavigation = !!response.loaderId;
                return response.errorText
                    ? new Error(`${response.errorText} at ${url}`)
                    : null;
            }
            catch (error) {
                return error;
            }
        }
    }
    async waitForFrameNavigation(frame, options = {}) {
        assertNoLegacyNavigationOptions(options);
        const { waitUntil = ['load'], timeout = this._timeoutSettings.navigationTimeout(), } = options;
        const watcher = new LifecycleWatcher(this, frame, waitUntil, timeout);
        const error = await Promise.race([
            watcher.timeoutOrTerminationPromise(),
            watcher.sameDocumentNavigationPromise(),
            watcher.newDocumentNavigationPromise(),
        ]);
        watcher.dispose();
        if (error)
            throw error;
        return watcher.navigationResponse();
    }
    async _onFrameMoved(event) {
        if (event.targetInfo.type !== 'iframe') {
            return;
        }
        // TODO(sadym): Remove debug message once proper OOPIF support is
        // implemented: https://github.com/puppeteer/puppeteer/issues/2548
        debug('puppeteer:frame')(`The frame '${event.targetInfo.targetId}' moved to another session. ` +
            `Out-of-process iframes (OOPIF) are not supported by Puppeteer yet. ` +
            `https://github.com/puppeteer/puppeteer/issues/2548`);
    }
    _onLifecycleEvent(event) {
        const frame = this._frames.get(event.frameId);
        if (!frame)
            return;
        frame._onLifecycleEvent(event.loaderId, event.name);
        this.emit(FrameManagerEmittedEvents.LifecycleEvent, frame);
    }
    _onFrameStoppedLoading(frameId) {
        const frame = this._frames.get(frameId);
        if (!frame)
            return;
        frame._onLoadingStopped();
        this.emit(FrameManagerEmittedEvents.LifecycleEvent, frame);
    }
    _handleFrameTree(frameTree) {
        if (frameTree.frame.parentId)
            this._onFrameAttached(frameTree.frame.id, frameTree.frame.parentId);
        this._onFrameNavigated(frameTree.frame);
        if (!frameTree.childFrames)
            return;
        for (const child of frameTree.childFrames)
            this._handleFrameTree(child);
    }
    page() {
        return this._page;
    }
    mainFrame() {
        return this._mainFrame;
    }
    frames() {
        return Array.from(this._frames.values());
    }
    frame(frameId) {
        return this._frames.get(frameId) || null;
    }
    _onFrameAttached(frameId, parentFrameId) {
        if (this._frames.has(frameId))
            return;
        assert(parentFrameId);
        const parentFrame = this._frames.get(parentFrameId);
        const frame = new Frame(this, parentFrame, frameId);
        this._frames.set(frame._id, frame);
        this.emit(FrameManagerEmittedEvents.FrameAttached, frame);
    }
    _onFrameNavigated(framePayload) {
        const isMainFrame = !framePayload.parentId;
        let frame = isMainFrame
            ? this._mainFrame
            : this._frames.get(framePayload.id);
        assert(isMainFrame || frame, 'We either navigate top level or have old version of the navigated frame');
        // Detach all child frames first.
        if (frame) {
            for (const child of frame.childFrames())
                this._removeFramesRecursively(child);
        }
        // Update or create main frame.
        if (isMainFrame) {
            if (frame) {
                // Update frame id to retain frame identity on cross-process navigation.
                this._frames.delete(frame._id);
                frame._id = framePayload.id;
            }
            else {
                // Initial main frame navigation.
                frame = new Frame(this, null, framePayload.id);
            }
            this._frames.set(framePayload.id, frame);
            this._mainFrame = frame;
        }
        // Update frame payload.
        frame._navigated(framePayload);
        this.emit(FrameManagerEmittedEvents.FrameNavigated, frame);
    }
    async _ensureIsolatedWorld(name) {
        if (this._isolatedWorlds.has(name))
            return;
        this._isolatedWorlds.add(name);
        await this._client.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `//# sourceURL=${EVALUATION_SCRIPT_URL}`,
            worldName: name,
        });
        // Frames might be removed before we send this.
        await Promise.all(this.frames().map((frame) => this._client
            .send('Page.createIsolatedWorld', {
            frameId: frame._id,
            worldName: name,
            grantUniveralAccess: true,
        })
            .catch(debugError)));
    }
    _onFrameNavigatedWithinDocument(frameId, url) {
        const frame = this._frames.get(frameId);
        if (!frame)
            return;
        frame._navigatedWithinDocument(url);
        this.emit(FrameManagerEmittedEvents.FrameNavigatedWithinDocument, frame);
        this.emit(FrameManagerEmittedEvents.FrameNavigated, frame);
    }
    _onFrameDetached(frameId) {
        const frame = this._frames.get(frameId);
        if (frame)
            this._removeFramesRecursively(frame);
    }
    _onExecutionContextCreated(contextPayload) {
        const auxData = contextPayload.auxData;
        const frameId = auxData ? auxData.frameId : null;
        const frame = this._frames.get(frameId) || null;
        let world = null;
        if (frame) {
            if (contextPayload.auxData && !!contextPayload.auxData['isDefault']) {
                world = frame._mainWorld;
            }
            else if (contextPayload.name === UTILITY_WORLD_NAME &&
                !frame._secondaryWorld._hasContext()) {
                // In case of multiple sessions to the same target, there's a race between
                // connections so we might end up creating multiple isolated worlds.
                // We can use either.
                world = frame._secondaryWorld;
            }
        }
        const context = new ExecutionContext(this._client, contextPayload, world);
        if (world)
            world._setContext(context);
        this._contextIdToContext.set(contextPayload.id, context);
    }
    _onExecutionContextDestroyed(executionContextId) {
        const context = this._contextIdToContext.get(executionContextId);
        if (!context)
            return;
        this._contextIdToContext.delete(executionContextId);
        if (context._world)
            context._world._setContext(null);
    }
    _onExecutionContextsCleared() {
        for (const context of this._contextIdToContext.values()) {
            if (context._world)
                context._world._setContext(null);
        }
        this._contextIdToContext.clear();
    }
    executionContextById(contextId) {
        const context = this._contextIdToContext.get(contextId);
        assert(context, 'INTERNAL ERROR: missing context with id = ' + contextId);
        return context;
    }
    _removeFramesRecursively(frame) {
        for (const child of frame.childFrames())
            this._removeFramesRecursively(child);
        frame._detach();
        this._frames.delete(frame._id);
        this.emit(FrameManagerEmittedEvents.FrameDetached, frame);
    }
}
/**
 * At every point of time, page exposes its current frame tree via the
 * {@link Page.mainFrame | page.mainFrame} and
 * {@link Frame.childFrames | frame.childFrames} methods.
 *
 * @remarks
 *
 * `Frame` object lifecycles are controlled by three events that are all
 * dispatched on the page object:
 *
 * - {@link PageEmittedEvents.FrameAttached}
 *
 * - {@link PageEmittedEvents.FrameNavigated}
 *
 * - {@link PageEmittedEvents.FrameDetached}
 *
 * @Example
 * An example of dumping frame tree:
 *
 * ```js
 * const puppeteer = require('puppeteer');
 *
 * (async () => {
 *   const browser = await puppeteer.launch();
 *   const page = await browser.newPage();
 *   await page.goto('https://www.google.com/chrome/browser/canary.html');
 *   dumpFrameTree(page.mainFrame(), '');
 *   await browser.close();
 *
 *   function dumpFrameTree(frame, indent) {
 *     console.log(indent + frame.url());
 *     for (const child of frame.childFrames()) {
 *     dumpFrameTree(child, indent + '  ');
 *     }
 *   }
 * })();
 * ```
 *
 * @Example
 * An example of getting text from an iframe element:
 *
 * ```js
 * const frame = page.frames().find(frame => frame.name() === 'myframe');
 * const text = await frame.$eval('.selector', element => element.textContent);
 * console.log(text);
 * ```
 *
 * @public
 */
export class Frame {
    /**
     * @internal
     */
    constructor(frameManager, parentFrame, frameId) {
        this._url = '';
        this._detached = false;
        /**
         * @internal
         */
        this._loaderId = '';
        /**
         * @internal
         */
        this._lifecycleEvents = new Set();
        this._frameManager = frameManager;
        this._parentFrame = parentFrame;
        this._url = '';
        this._id = frameId;
        this._detached = false;
        this._loaderId = '';
        this._mainWorld = new DOMWorld(frameManager, this, frameManager._timeoutSettings);
        this._secondaryWorld = new DOMWorld(frameManager, this, frameManager._timeoutSettings);
        this._childFrames = new Set();
        if (this._parentFrame)
            this._parentFrame._childFrames.add(this);
    }
    /**
     * @remarks
     *
     * `frame.goto` will throw an error if:
     * - there's an SSL error (e.g. in case of self-signed certificates).
     *
     * - target URL is invalid.
     *
     * - the `timeout` is exceeded during navigation.
     *
     * - the remote server does not respond or is unreachable.
     *
     * - the main resource failed to load.
     *
     * `frame.goto` will not throw an error when any valid HTTP status code is
     * returned by the remote server, including 404 "Not Found" and 500 "Internal
     * Server Error".  The status code for such responses can be retrieved by
     * calling {@link HTTPResponse.status}.
     *
     * NOTE: `frame.goto` either throws an error or returns a main resource
     * response. The only exceptions are navigation to `about:blank` or
     * navigation to the same URL with a different hash, which would succeed and
     * return `null`.
     *
     * NOTE: Headless mode doesn't support navigation to a PDF document. See
     * the {@link https://bugs.chromium.org/p/chromium/issues/detail?id=761295 | upstream
     * issue}.
     *
     * @param url - the URL to navigate the frame to. This should include the
     * scheme, e.g. `https://`.
     * @param options - navigation options. `waitUntil` is useful to define when
     * the navigation should be considered successful - see the docs for
     * {@link PuppeteerLifeCycleEvent} for more details.
     *
     * @returns A promise which resolves to the main resource response. In case of
     * multiple redirects, the navigation will resolve with the response of the
     * last redirect.
     */
    async goto(url, options = {}) {
        return await this._frameManager.navigateFrame(this, url, options);
    }
    /**
     * @remarks
     *
     * This resolves when the frame navigates to a new URL. It is useful for when
     * you run code which will indirectly cause the frame to navigate. Consider
     * this example:
     *
     * ```js
     * const [response] = await Promise.all([
     *   // The navigation promise resolves after navigation has finished
     *   frame.waitForNavigation(),
     *   // Clicking the link will indirectly cause a navigation
     *   frame.click('a.my-link'),
     * ]);
     * ```
     *
     * Usage of the {@link https://developer.mozilla.org/en-US/docs/Web/API/History_API | History API} to change the URL is considered a navigation.
     *
     * @param options - options to configure when the navigation is consided finished.
     * @returns a promise that resolves when the frame navigates to a new URL.
     */
    async waitForNavigation(options = {}) {
        return await this._frameManager.waitForFrameNavigation(this, options);
    }
    /**
     * @returns a promise that resolves to the frame's default execution context.
     */
    executionContext() {
        return this._mainWorld.executionContext();
    }
    /**
     * @remarks
     *
     * The only difference between {@link Frame.evaluate} and
     * `frame.evaluateHandle` is that `evaluateHandle` will return the value
     * wrapped in an in-page object.
     *
     * This method behaves identically to {@link Page.evaluateHandle} except it's
     * run within the context of the `frame`, rather than the entire page.
     *
     * @param pageFunction - a function that is run within the frame
     * @param args - arguments to be passed to the pageFunction
     */
    async evaluateHandle(pageFunction, ...args) {
        return this._mainWorld.evaluateHandle(pageFunction, ...args);
    }
    /**
     * @remarks
     *
     * This method behaves identically to {@link Page.evaluate} except it's run
     * within the context of the `frame`, rather than the entire page.
     *
     * @param pageFunction - a function that is run within the frame
     * @param args - arguments to be passed to the pageFunction
     */
    async evaluate(pageFunction, ...args) {
        return this._mainWorld.evaluate(pageFunction, ...args);
    }
    /**
     * This method queries the frame for the given selector.
     *
     * @param selector - a selector to query for.
     * @returns A promise which resolves to an `ElementHandle` pointing at the
     * element, or `null` if it was not found.
     */
    async $(selector) {
        return this._mainWorld.$(selector);
    }
    /**
     * This method evaluates the given XPath expression and returns the results.
     *
     * @param expression - the XPath expression to evaluate.
     */
    async $x(expression) {
        return this._mainWorld.$x(expression);
    }
    /**
     * @remarks
     *
     * This method runs `document.querySelector` within
     * the frame and passes it as the first argument to `pageFunction`.
     *
     * If `pageFunction` returns a Promise, then `frame.$eval` would wait for
     * the promise to resolve and return its value.
     *
     * @example
     *
     * ```js
     * const searchValue = await frame.$eval('#search', el => el.value);
     * ```
     *
     * @param selector - the selector to query for
     * @param pageFunction - the function to be evaluated in the frame's context
     * @param args - additional arguments to pass to `pageFuncton`
     */
    async $eval(selector, pageFunction, ...args) {
        return this._mainWorld.$eval(selector, pageFunction, ...args);
    }
    /**
     * @remarks
     *
     * This method runs `Array.from(document.querySelectorAll(selector))` within
     * the frame and passes it as the first argument to `pageFunction`.
     *
     * If `pageFunction` returns a Promise, then `frame.$$eval` would wait for
     * the promise to resolve and return its value.
     *
     * @example
     *
     * ```js
     * const divsCounts = await frame.$$eval('div', divs => divs.length);
     * ```
     *
     * @param selector - the selector to query for
     * @param pageFunction - the function to be evaluated in the frame's context
     * @param args - additional arguments to pass to `pageFuncton`
     */
    async $$eval(selector, pageFunction, ...args) {
        return this._mainWorld.$$eval(selector, pageFunction, ...args);
    }
    /**
     * This runs `document.querySelectorAll` in the frame and returns the result.
     *
     * @param selector - a selector to search for
     * @returns An array of element handles pointing to the found frame elements.
     */
    async $$(selector) {
        return this._mainWorld.$$(selector);
    }
    /**
     * @returns the full HTML contents of the frame, including the doctype.
     */
    async content() {
        return this._secondaryWorld.content();
    }
    /**
     * Set the content of the frame.
     *
     * @param html - HTML markup to assign to the page.
     * @param options - options to configure how long before timing out and at
     * what point to consider the content setting successful.
     */
    async setContent(html, options = {}) {
        return this._secondaryWorld.setContent(html, options);
    }
    /**
     * @remarks
     *
     * If the name is empty, it returns the `id` attribute instead.
     *
     * Note: This value is calculated once when the frame is created, and will not
     * update if the attribute is changed later.
     *
     * @returns the frame's `name` attribute as specified in the tag.
     */
    name() {
        return this._name || '';
    }
    /**
     * @returns the frame's URL.
     */
    url() {
        return this._url;
    }
    /**
     * @returns the parent `Frame`, if any. Detached and main frames return `null`.
     */
    parentFrame() {
        return this._parentFrame;
    }
    /**
     * @returns an array of child frames.
     */
    childFrames() {
        return Array.from(this._childFrames);
    }
    /**
     * @returns `true` if the frame has been detached, or `false` otherwise.
     */
    isDetached() {
        return this._detached;
    }
    /**
     * Adds a `<script>` tag into the page with the desired url or content.
     *
     * @param options - configure the script to add to the page.
     *
     * @returns a promise that resolves to the added tag when the script's
     * `onload` event fires or when the script content was injected into the
     * frame.
     */
    async addScriptTag(options) {
        return this._mainWorld.addScriptTag(options);
    }
    /**
     * Adds a `<link rel="stylesheet">` tag into the page with the desired url or
     * a `<style type="text/css">` tag with the content.
     *
     * @param options - configure the CSS to add to the page.
     *
     * @returns a promise that resolves to the added tag when the stylesheets's
     * `onload` event fires or when the CSS content was injected into the
     * frame.
     */
    async addStyleTag(options) {
        return this._mainWorld.addStyleTag(options);
    }
    /**
     *
     * This method clicks the first element found that matches `selector`.
     *
     * @remarks
     *
     * This method scrolls the element into view if needed, and then uses
     * {@link Page.mouse} to click in the center of the element. If there's no
     * element matching `selector`, the method throws an error.
     *
     * Bear in mind that if `click()` triggers a navigation event and there's a
     * separate `page.waitForNavigation()` promise to be resolved, you may end up
     * with a race condition that yields unexpected results. The correct pattern
     * for click and wait for navigation is the following:
     *
     * ```javascript
     * const [response] = await Promise.all([
     *   page.waitForNavigation(waitOptions),
     *   frame.click(selector, clickOptions),
     * ]);
     * ```
     * @param selector - the selector to search for to click. If there are
     * multiple elements, the first will be clicked.
     */
    async click(selector, options = {}) {
        return this._secondaryWorld.click(selector, options);
    }
    /**
     * This method fetches an element with `selector` and focuses it.
     *
     * @remarks
     * If there's no element matching `selector`, the method throws an error.
     *
     * @param selector - the selector for the element to focus. If there are
     * multiple elements, the first will be focused.
     */
    async focus(selector) {
        return this._secondaryWorld.focus(selector);
    }
    /**
     * This method fetches an element with `selector`, scrolls it into view if
     * needed, and then uses {@link Page.mouse} to hover over the center of the
     * element.
     *
     * @remarks
     * If there's no element matching `selector`, the method throws an
     *
     * @param selector - the selector for the element to hover. If there are
     * multiple elements, the first will be hovered.
     */
    async hover(selector) {
        return this._secondaryWorld.hover(selector);
    }
    /**
     * Triggers a `change` and `input` event once all the provided options have
     * been selected.
     *
     * @remarks
     *
     * If there's no `<select>` element matching `selector`, the
     * method throws an error.
     *
     * @example
     * ```js
     * frame.select('select#colors', 'blue'); // single selection
     * frame.select('select#colors', 'red', 'green', 'blue'); // multiple selections
     * ```
     *
     * @param selector - a selector to query the frame for
     * @param values - an array of values to select. If the `<select>` has the
     * `multiple` attribute, all values are considered, otherwise only the first
     * one is taken into account.
     * @returns the list of values that were successfully selected.
     */
    select(selector, ...values) {
        return this._secondaryWorld.select(selector, ...values);
    }
    /**
     * This method fetches an element with `selector`, scrolls it into view if
     * needed, and then uses {@link Page.touchscreen} to tap in the center of the
     * element.
     *
     * @remarks
     *
     * If there's no element matching `selector`, the method throws an error.
     *
     * @param selector - the selector to tap.
     * @returns a promise that resolves when the element has been tapped.
     */
    async tap(selector) {
        return this._secondaryWorld.tap(selector);
    }
    /**
     * Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character
     * in the text.
     *
     * @remarks
     * To press a special key, like `Control` or `ArrowDown`, use
     * {@link Keyboard.press}.
     *
     * @example
     * ```js
     * await frame.type('#mytextarea', 'Hello'); // Types instantly
     * await frame.type('#mytextarea', 'World', {delay: 100}); // Types slower, like a user
     * ```
     *
     * @param selector - the selector for the element to type into. If there are
     * multiple the first will be used.
     * @param text - text to type into the element
     * @param options - takes one option, `delay`, which sets the time to wait
     * between key presses in milliseconds. Defaults to `0`.
     *
     * @returns a promise that resolves when the typing is complete.
     */
    async type(selector, text, options) {
        return this._mainWorld.type(selector, text, options);
    }
    /**
     * @remarks
     *
     * This method behaves differently depending on the first parameter. If it's a
     * `string`, it will be treated as a `selector` or `xpath` (if the string
     * starts with `//`). This method then is a shortcut for
     * {@link Frame.waitForSelector} or {@link Frame.waitForXPath}.
     *
     * If the first argument is a function this method is a shortcut for
     * {@link Frame.waitForFunction}.
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
     * methods available: {@link Frame.waitForSelector},
     * {@link Frame.waitForXPath}, {@link Frame.waitForFunction} or
     * {@link Frame.waitForTimeout}.
     */
    waitFor(selectorOrFunctionOrTimeout, options = {}, ...args) {
        const xPathPattern = '//';
        console.warn('waitFor is deprecated and will be removed in a future release. See https://github.com/puppeteer/puppeteer/issues/6214 for details and how to migrate your code.');
        if (helper.isString(selectorOrFunctionOrTimeout)) {
            const string = selectorOrFunctionOrTimeout;
            if (string.startsWith(xPathPattern))
                return this.waitForXPath(string, options);
            return this.waitForSelector(string, options);
        }
        if (helper.isNumber(selectorOrFunctionOrTimeout))
            return new Promise((fulfill) => setTimeout(fulfill, selectorOrFunctionOrTimeout));
        if (typeof selectorOrFunctionOrTimeout === 'function')
            return this.waitForFunction(selectorOrFunctionOrTimeout, options, ...args);
        return Promise.reject(new Error('Unsupported target type: ' + typeof selectorOrFunctionOrTimeout));
    }
    /**
     * Causes your script to wait for the given number of milliseconds.
     *
     * @remarks
     * It's generally recommended to not wait for a number of seconds, but instead
     * use {@link Frame.waitForSelector}, {@link Frame.waitForXPath} or
     * {@link Frame.waitForFunction} to wait for exactly the conditions you want.
     *
     * @example
     *
     * Wait for 1 second:
     *
     * ```
     * await frame.waitForTimeout(1000);
     * ```
     *
     * @param milliseconds - the number of milliseconds to wait.
     */
    waitForTimeout(milliseconds) {
        return new Promise((resolve) => {
            setTimeout(resolve, milliseconds);
        });
    }
    /**
     * @remarks
     *
     *
     * Wait for the `selector` to appear in page. If at the moment of calling the
     * method the `selector` already exists, the method will return immediately.
     * If the selector doesn't appear after the `timeout` milliseconds of waiting,
     * the function will throw.
     *
     * This method works across navigations.
     *
     * @example
     * ```js
     * const puppeteer = require('puppeteer');
     *
     * (async () => {
     *   const browser = await puppeteer.launch();
     *   const page = await browser.newPage();
     *   let currentURL;
     *   page.mainFrame()
     *   .waitForSelector('img')
     *   .then(() => console.log('First URL with image: ' + currentURL));
     *
     *   for (currentURL of ['https://example.com', 'https://google.com', 'https://bbc.com']) {
     *     await page.goto(currentURL);
     *   }
     *   await browser.close();
     * })();
     * ```
     * @param selector - the selector to wait for.
     * @param options - options to define if the element should be visible and how
     * long to wait before timing out.
     * @returns a promise which resolves when an element matching the selector
     * string is added to the DOM.
     */
    async waitForSelector(selector, options = {}) {
        const handle = await this._secondaryWorld.waitForSelector(selector, options);
        if (!handle)
            return null;
        const mainExecutionContext = await this._mainWorld.executionContext();
        const result = await mainExecutionContext._adoptElementHandle(handle);
        await handle.dispose();
        return result;
    }
    /**
     * @remarks
     * Wait for the `xpath` to appear in page. If at the moment of calling the
     * method the `xpath` already exists, the method will return immediately. If
     * the xpath doesn't appear after the `timeout` milliseconds of waiting, the
     * function will throw.
     *
     * For a code example, see the example for {@link Frame.waitForSelector}. That
     * function behaves identically other than taking a CSS selector rather than
     * an XPath.
     *
     * @param xpath - the XPath expression to wait for.
     * @param options  - options to configure the visiblity of the element and how
     * long to wait before timing out.
     */
    async waitForXPath(xpath, options = {}) {
        const handle = await this._secondaryWorld.waitForXPath(xpath, options);
        if (!handle)
            return null;
        const mainExecutionContext = await this._mainWorld.executionContext();
        const result = await mainExecutionContext._adoptElementHandle(handle);
        await handle.dispose();
        return result;
    }
    /**
     * @remarks
     *
     * @example
     *
     * The `waitForFunction` can be used to observe viewport size change:
     * ```js
     * const puppeteer = require('puppeteer');
     *
     * (async () => {
     * .  const browser = await puppeteer.launch();
     * .  const page = await browser.newPage();
     * .  const watchDog = page.mainFrame().waitForFunction('window.innerWidth < 100');
     * .  page.setViewport({width: 50, height: 50});
     * .  await watchDog;
     * .  await browser.close();
     * })();
     * ```
     *
     * To pass arguments from Node.js to the predicate of `page.waitForFunction` function:
     *
     * ```js
     * const selector = '.foo';
     * await frame.waitForFunction(
     *   selector => !!document.querySelector(selector),
     *   {}, // empty options object
     *   selector
     *);
     * ```
     *
     * @param pageFunction - the function to evaluate in the frame context.
     * @param options - options to configure the polling method and timeout.
     * @param args - arguments to pass to the `pageFunction`.
     * @returns the promise which resolve when the `pageFunction` returns a truthy value.
     */
    waitForFunction(pageFunction, options = {}, ...args) {
        return this._mainWorld.waitForFunction(pageFunction, options, ...args);
    }
    /**
     * @returns the frame's title.
     */
    async title() {
        return this._secondaryWorld.title();
    }
    /**
     * @internal
     */
    _navigated(framePayload) {
        this._name = framePayload.name;
        this._url = `${framePayload.url}${framePayload.urlFragment || ''}`;
    }
    /**
     * @internal
     */
    _navigatedWithinDocument(url) {
        this._url = url;
    }
    /**
     * @internal
     */
    _onLifecycleEvent(loaderId, name) {
        if (name === 'init') {
            this._loaderId = loaderId;
            this._lifecycleEvents.clear();
        }
        this._lifecycleEvents.add(name);
    }
    /**
     * @internal
     */
    _onLoadingStopped() {
        this._lifecycleEvents.add('DOMContentLoaded');
        this._lifecycleEvents.add('load');
    }
    /**
     * @internal
     */
    _detach() {
        this._detached = true;
        this._mainWorld._detach();
        this._secondaryWorld._detach();
        if (this._parentFrame)
            this._parentFrame._childFrames.delete(this);
        this._parentFrame = null;
    }
}
function assertNoLegacyNavigationOptions(options) {
    assert(options['networkIdleTimeout'] === undefined, 'ERROR: networkIdleTimeout option is no longer supported.');
    assert(options['networkIdleInflight'] === undefined, 'ERROR: networkIdleInflight option is no longer supported.');
    assert(options.waitUntil !== 'networkidle', 'ERROR: "networkidle" option is no longer supported. Use "networkidle2" instead');
}
//# sourceMappingURL=FrameManager.js.map