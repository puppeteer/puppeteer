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
import { ExecutionContext } from './ExecutionContext.js';
import { PuppeteerLifeCycleEvent } from './LifecycleWatcher.js';
import { DOMWorld, WaitForSelectorOptions } from './DOMWorld.js';
import { NetworkManager } from './NetworkManager.js';
import { TimeoutSettings } from './TimeoutSettings.js';
import { CDPSession } from './Connection.js';
import { JSHandle, ElementHandle } from './JSHandle.js';
import { MouseButton } from './Input.js';
import { Page } from './Page.js';
import { HTTPResponse } from './HTTPResponse.js';
import { Protocol } from 'devtools-protocol';
import { SerializableOrJSHandle, EvaluateHandleFn, WrapElementHandle, EvaluateFn, EvaluateFnReturnType, UnwrapPromiseLike } from './EvalTypes.js';
/**
 * We use symbols to prevent external parties listening to these events.
 * They are internal to Puppeteer.
 *
 * @internal
 */
export declare const FrameManagerEmittedEvents: {
    FrameAttached: symbol;
    FrameNavigated: symbol;
    FrameDetached: symbol;
    LifecycleEvent: symbol;
    FrameNavigatedWithinDocument: symbol;
    ExecutionContextCreated: symbol;
    ExecutionContextDestroyed: symbol;
};
/**
 * @internal
 */
export declare class FrameManager extends EventEmitter {
    _client: CDPSession;
    private _page;
    private _networkManager;
    _timeoutSettings: TimeoutSettings;
    private _frames;
    private _contextIdToContext;
    private _isolatedWorlds;
    private _mainFrame;
    constructor(client: CDPSession, page: Page, ignoreHTTPSErrors: boolean, timeoutSettings: TimeoutSettings);
    initialize(): Promise<void>;
    networkManager(): NetworkManager;
    navigateFrame(frame: Frame, url: string, options?: {
        referer?: string;
        timeout?: number;
        waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }): Promise<HTTPResponse | null>;
    waitForFrameNavigation(frame: Frame, options?: {
        timeout?: number;
        waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }): Promise<HTTPResponse | null>;
    private _onFrameMoved;
    _onLifecycleEvent(event: Protocol.Page.LifecycleEventEvent): void;
    _onFrameStoppedLoading(frameId: string): void;
    _handleFrameTree(frameTree: Protocol.Page.FrameTree): void;
    page(): Page;
    mainFrame(): Frame;
    frames(): Frame[];
    frame(frameId: string): Frame | null;
    _onFrameAttached(frameId: string, parentFrameId?: string): void;
    _onFrameNavigated(framePayload: Protocol.Page.Frame): void;
    _ensureIsolatedWorld(name: string): Promise<void>;
    _onFrameNavigatedWithinDocument(frameId: string, url: string): void;
    _onFrameDetached(frameId: string): void;
    _onExecutionContextCreated(contextPayload: Protocol.Runtime.ExecutionContextDescription): void;
    private _onExecutionContextDestroyed;
    private _onExecutionContextsCleared;
    executionContextById(contextId: number): ExecutionContext;
    private _removeFramesRecursively;
}
/**
 * @public
 */
export interface FrameWaitForFunctionOptions {
    /**
     * An interval at which the `pageFunction` is executed, defaults to `raf`. If
     * `polling` is a number, then it is treated as an interval in milliseconds at
     * which the function would be executed. If `polling` is a string, then it can
     * be one of the following values:
     *
     * - `raf` - to constantly execute `pageFunction` in `requestAnimationFrame`
     *   callback. This is the tightest polling mode which is suitable to observe
     *   styling changes.
     *
     * - `mutation` - to execute `pageFunction` on every DOM mutation.
     */
    polling?: string | number;
    /**
     * Maximum time to wait in milliseconds. Defaults to `30000` (30 seconds).
     * Pass `0` to disable the timeout. Puppeteer's default timeout can be changed
     * using {@link Page.setDefaultTimeout}.
     */
    timeout?: number;
}
/**
 * @public
 */
export interface FrameAddScriptTagOptions {
    /**
     * the URL of the script to be added.
     */
    url?: string;
    /**
     * The path to a JavaScript file to be injected into the frame.
     * @remarks
     * If `path` is a relative path, it is resolved relative to the current
     * working directory (`process.cwd()` in Node.js).
     */
    path?: string;
    /**
     * Raw JavaScript content to be injected into the frame.
     */
    content?: string;
    /**
     * Set the script's `type`. Use `module` in order to load an ES2015 module.
     */
    type?: string;
}
/**
 * @public
 */
export interface FrameAddStyleTagOptions {
    /**
     * the URL of the CSS file to be added.
     */
    url?: string;
    /**
     * The path to a CSS file to be injected into the frame.
     * @remarks
     * If `path` is a relative path, it is resolved relative to the current
     * working directory (`process.cwd()` in Node.js).
     */
    path?: string;
    /**
     * Raw CSS content to be injected into the frame.
     */
    content?: string;
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
export declare class Frame {
    /**
     * @internal
     */
    _frameManager: FrameManager;
    private _parentFrame?;
    /**
     * @internal
     */
    _id: string;
    private _url;
    private _detached;
    /**
     * @internal
     */
    _loaderId: string;
    /**
     * @internal
     */
    _name?: string;
    /**
     * @internal
     */
    _lifecycleEvents: Set<string>;
    /**
     * @internal
     */
    _mainWorld: DOMWorld;
    /**
     * @internal
     */
    _secondaryWorld: DOMWorld;
    /**
     * @internal
     */
    _childFrames: Set<Frame>;
    /**
     * @internal
     */
    constructor(frameManager: FrameManager, parentFrame: Frame | null, frameId: string);
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
    goto(url: string, options?: {
        referer?: string;
        timeout?: number;
        waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }): Promise<HTTPResponse | null>;
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
    waitForNavigation(options?: {
        timeout?: number;
        waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }): Promise<HTTPResponse | null>;
    /**
     * @returns a promise that resolves to the frame's default execution context.
     */
    executionContext(): Promise<ExecutionContext>;
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
    evaluateHandle<HandlerType extends JSHandle = JSHandle>(pageFunction: EvaluateHandleFn, ...args: SerializableOrJSHandle[]): Promise<HandlerType>;
    /**
     * @remarks
     *
     * This method behaves identically to {@link Page.evaluate} except it's run
     * within the context of the `frame`, rather than the entire page.
     *
     * @param pageFunction - a function that is run within the frame
     * @param args - arguments to be passed to the pageFunction
     */
    evaluate<T extends EvaluateFn>(pageFunction: T, ...args: SerializableOrJSHandle[]): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>>;
    /**
     * This method queries the frame for the given selector.
     *
     * @param selector - a selector to query for.
     * @returns A promise which resolves to an `ElementHandle` pointing at the
     * element, or `null` if it was not found.
     */
    $(selector: string): Promise<ElementHandle | null>;
    /**
     * This method evaluates the given XPath expression and returns the results.
     *
     * @param expression - the XPath expression to evaluate.
     */
    $x(expression: string): Promise<ElementHandle[]>;
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
    $eval<ReturnType>(selector: string, pageFunction: (element: Element, ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
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
    $$eval<ReturnType>(selector: string, pageFunction: (elements: Element[], ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    /**
     * This runs `document.querySelectorAll` in the frame and returns the result.
     *
     * @param selector - a selector to search for
     * @returns An array of element handles pointing to the found frame elements.
     */
    $$(selector: string): Promise<ElementHandle[]>;
    /**
     * @returns the full HTML contents of the frame, including the doctype.
     */
    content(): Promise<string>;
    /**
     * Set the content of the frame.
     *
     * @param html - HTML markup to assign to the page.
     * @param options - options to configure how long before timing out and at
     * what point to consider the content setting successful.
     */
    setContent(html: string, options?: {
        timeout?: number;
        waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }): Promise<void>;
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
    name(): string;
    /**
     * @returns the frame's URL.
     */
    url(): string;
    /**
     * @returns the parent `Frame`, if any. Detached and main frames return `null`.
     */
    parentFrame(): Frame | null;
    /**
     * @returns an array of child frames.
     */
    childFrames(): Frame[];
    /**
     * @returns `true` if the frame has been detached, or `false` otherwise.
     */
    isDetached(): boolean;
    /**
     * Adds a `<script>` tag into the page with the desired url or content.
     *
     * @param options - configure the script to add to the page.
     *
     * @returns a promise that resolves to the added tag when the script's
     * `onload` event fires or when the script content was injected into the
     * frame.
     */
    addScriptTag(options: FrameAddScriptTagOptions): Promise<ElementHandle>;
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
    addStyleTag(options: FrameAddStyleTagOptions): Promise<ElementHandle>;
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
    click(selector: string, options?: {
        delay?: number;
        button?: MouseButton;
        clickCount?: number;
    }): Promise<void>;
    /**
     * This method fetches an element with `selector` and focuses it.
     *
     * @remarks
     * If there's no element matching `selector`, the method throws an error.
     *
     * @param selector - the selector for the element to focus. If there are
     * multiple elements, the first will be focused.
     */
    focus(selector: string): Promise<void>;
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
    hover(selector: string): Promise<void>;
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
    select(selector: string, ...values: string[]): Promise<string[]>;
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
    tap(selector: string): Promise<void>;
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
    type(selector: string, text: string, options?: {
        delay: number;
    }): Promise<void>;
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
    waitFor(selectorOrFunctionOrTimeout: string | number | Function, options?: Record<string, unknown>, ...args: SerializableOrJSHandle[]): Promise<JSHandle | null>;
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
    waitForTimeout(milliseconds: number): Promise<void>;
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
    waitForSelector(selector: string, options?: WaitForSelectorOptions): Promise<ElementHandle | null>;
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
    waitForXPath(xpath: string, options?: WaitForSelectorOptions): Promise<ElementHandle | null>;
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
    waitForFunction(pageFunction: Function | string, options?: FrameWaitForFunctionOptions, ...args: SerializableOrJSHandle[]): Promise<JSHandle>;
    /**
     * @returns the frame's title.
     */
    title(): Promise<string>;
    /**
     * @internal
     */
    _navigated(framePayload: Protocol.Page.Frame): void;
    /**
     * @internal
     */
    _navigatedWithinDocument(url: string): void;
    /**
     * @internal
     */
    _onLifecycleEvent(loaderId: string, name: string): void;
    /**
     * @internal
     */
    _onLoadingStopped(): void;
    /**
     * @internal
     */
    _detach(): void;
}
//# sourceMappingURL=FrameManager.d.ts.map