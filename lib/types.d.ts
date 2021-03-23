/// <reference types="node" />
import { ChildProcess } from 'child_process';

/**
 * The Accessibility class provides methods for inspecting Chromium's
 * accessibility tree. The accessibility tree is used by assistive technology
 * such as {@link https://en.wikipedia.org/wiki/Screen_reader | screen readers} or
 * {@link https://en.wikipedia.org/wiki/Switch_access | switches}.
 *
 * @remarks
 *
 * Accessibility is a very platform-specific thing. On different platforms,
 * there are different screen readers that might have wildly different output.
 *
 * Blink - Chrome's rendering engine - has a concept of "accessibility tree",
 * which is then translated into different platform-specific APIs. Accessibility
 * namespace gives users access to the Blink Accessibility Tree.
 *
 * Most of the accessibility tree gets filtered out when converting from Blink
 * AX Tree to Platform-specific AX-Tree or by assistive technologies themselves.
 * By default, Puppeteer tries to approximate this filtering, exposing only
 * the "interesting" nodes of the tree.
 *
 * @public
 */
declare class Accessibility {
    private _client;
    /**
     * @internal
     */
    constructor(client: CDPSession);
    /**
     * Captures the current state of the accessibility tree.
     * The returned object represents the root accessible node of the page.
     *
     * @remarks
     *
     * **NOTE** The Chromium accessibility tree contains nodes that go unused on
     * most platforms and by most screen readers. Puppeteer will discard them as
     * well for an easier to process tree, unless `interestingOnly` is set to
     * `false`.
     *
     * @example
     * An example of dumping the entire accessibility tree:
     * ```js
     * const snapshot = await page.accessibility.snapshot();
     * console.log(snapshot);
     * ```
     *
     * @example
     * An example of logging the focused node's name:
     * ```js
     * const snapshot = await page.accessibility.snapshot();
     * const node = findFocusedNode(snapshot);
     * console.log(node && node.name);
     *
     * function findFocusedNode(node) {
     *   if (node.focused)
     *     return node;
     *   for (const child of node.children || []) {
     *     const foundNode = findFocusedNode(child);
     *     return foundNode;
     *   }
     *   return null;
     * }
     * ```
     *
     * @returns An AXNode object representing the snapshot.
     *
     */
    snapshot(options?: SnapshotOptions): Promise<SerializedAXNode>;
    private serializeTree;
    private collectInterestingNodes;
}

/**
 * @public
 */
declare interface BoundingBox {
    /**
     * the x coordinate of the element in pixels.
     */
    x: number;
    /**
     * the y coordinate of the element in pixels.
     */
    y: number;
    /**
     * the width of the element in pixels.
     */
    width: number;
    /**
     * the height of the element in pixels.
     */
    height: number;
}

declare interface BoxModel {
    content: Array<{
        x: number;
        y: number;
    }>;
    padding: Array<{
        x: number;
        y: number;
    }>;
    border: Array<{
        x: number;
        y: number;
    }>;
    margin: Array<{
        x: number;
        y: number;
    }>;
    width: number;
    height: number;
}

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
export declare class Browser extends EventEmitter {
    /**
     * @internal
     */
    static create(connection: Connection, contextIds: string[], ignoreHTTPSErrors: boolean, defaultViewport?: Viewport, process?: ChildProcess, closeCallback?: BrowserCloseCallback): Promise<Browser>;
    private _ignoreHTTPSErrors;
    private _defaultViewport?;
    private _process?;
    private _connection;
    private _closeCallback;
    private _defaultContext;
    private _contexts;
    /**
     * @internal
     * Used in Target.ts directly so cannot be marked private.
     */
    _targets: Map<string, Target>;
    /**
     * @internal
     */
    constructor(connection: Connection, contextIds: string[], ignoreHTTPSErrors: boolean, defaultViewport?: Viewport, process?: ChildProcess, closeCallback?: BrowserCloseCallback);
    /**
     * The spawned browser process. Returns `null` if the browser instance was created with
     * {@link Puppeteer.connect}.
     */
    process(): ChildProcess | null;
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
    createIncognitoBrowserContext(): Promise<BrowserContext>;
    /**
     * Returns an array of all open browser contexts. In a newly created browser, this will
     * return a single instance of {@link BrowserContext}.
     */
    browserContexts(): BrowserContext[];
    /**
     * Returns the default browser context. The default browser context cannot be closed.
     */
    defaultBrowserContext(): BrowserContext;
    /**
     * @internal
     * Used by BrowserContext directly so cannot be marked private.
     */
    _disposeContext(contextId?: string): Promise<void>;
    private _targetCreated;
    private _targetDestroyed;
    private _targetInfoChanged;
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
    wsEndpoint(): string;
    /**
     * Creates a {@link Page} in the default browser context.
     */
    newPage(): Promise<Page>;
    /**
     * @internal
     * Used by BrowserContext directly so cannot be marked private.
     */
    _createPageInContext(contextId?: string): Promise<Page>;
    /**
     * All active targets inside the Browser. In case of multiple browser contexts, returns
     * an array with all the targets in all browser contexts.
     */
    targets(): Target[];
    /**
     * The target associated with the browser.
     */
    target(): Target;
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
    waitForTarget(predicate: (x: Target) => boolean, options?: WaitForTargetOptions): Promise<Target>;
    /**
     * An array of all open pages inside the Browser.
     *
     * @remarks
     *
     * In case of multiple browser contexts, returns an array with all the pages in all
     * browser contexts. Non-visible pages, such as `"background_page"`, will not be listed
     * here. You can find them using {@link Target.page}.
     */
    pages(): Promise<Page[]>;
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
    version(): Promise<string>;
    /**
     * The browser's original user agent. Pages can override the browser user agent with
     * {@link Page.setUserAgent}.
     */
    userAgent(): Promise<string>;
    /**
     * Closes Chromium and all of its pages (if any were opened). The {@link Browser} object
     * itself is considered to be disposed and cannot be used anymore.
     */
    close(): Promise<void>;
    /**
     * Disconnects Puppeteer from the browser, but leaves the Chromium process running.
     * After calling `disconnect`, the {@link Browser} object is considered disposed and
     * cannot be used anymore.
     */
    disconnect(): void;
    /**
     * Indicates that the browser is connected.
     */
    isConnected(): boolean;
    private _getVersion;
}

declare type BrowserCloseCallback = () => Promise<void> | void;

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
export declare class BrowserContext extends EventEmitter {
    private _connection;
    private _browser;
    private _id?;
    /**
     * @internal
     */
    constructor(connection: Connection, browser: Browser, contextId?: string);
    /**
     * An array of all active targets inside the browser context.
     */
    targets(): Target[];
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
    waitForTarget(predicate: (x: Target) => boolean, options?: {
        timeout?: number;
    }): Promise<Target>;
    /**
     * An array of all pages inside the browser context.
     *
     * @returns Promise which resolves to an array of all open pages.
     * Non visible pages, such as `"background_page"`, will not be listed here.
     * You can find them using {@link Target.page | the target page}.
     */
    pages(): Promise<Page[]>;
    /**
     * Returns whether BrowserContext is incognito.
     * The default browser context is the only non-incognito browser context.
     *
     * @remarks
     * The default browser context cannot be closed.
     */
    isIncognito(): boolean;
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
    overridePermissions(origin: string, permissions: Permission[]): Promise<void>;
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
    clearPermissionOverrides(): Promise<void>;
    /**
     * Creates a new page in the browser context.
     */
    newPage(): Promise<Page>;
    /**
     * The browser this browser context belongs to.
     */
    browser(): Browser;
    /**
     * Closes the browser context. All the targets that belong to the browser context
     * will be closed.
     *
     * @remarks
     * Only incognito browser contexts can be closed.
     */
    close(): Promise<void>;
}

export declare const enum BrowserContextEmittedEvents {
    /**
     * Emitted when the url of a target inside the browser context changes.
     * Contains a {@link Target} instance.
     */
    TargetChanged = "targetchanged",
    /**
     * Emitted when a target is created within the browser context, for example
     * when a new page is opened by
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/open | window.open}
     * or by {@link BrowserContext.newPage | browserContext.newPage}
     *
     * Contains a {@link Target} instance.
     */
    TargetCreated = "targetcreated",
    /**
     * Emitted when a target is destroyed within the browser context, for example
     * when a page is closed. Contains a {@link Target} instance.
     */
    TargetDestroyed = "targetdestroyed"
}

/**
 * All the events a {@link Browser | browser instance} may emit.
 *
 * @public
 */
export declare const enum BrowserEmittedEvents {
    /**
     * Emitted when Puppeteer gets disconnected from the Chromium instance. This
     * might happen because of one of the following:
     *
     * - Chromium is closed or crashed
     *
     * - The {@link Browser.disconnect | browser.disconnect } method was called.
     */
    Disconnected = "disconnected",
    /**
     * Emitted when the url of a target changes. Contains a {@link Target} instance.
     *
     * @remarks
     *
     * Note that this includes target changes in incognito browser contexts.
     */
    TargetChanged = "targetchanged",
    /**
     * Emitted when a target is created, for example when a new page is opened by
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/open | window.open}
     * or by {@link Browser.newPage | browser.newPage}
     *
     * Contains a {@link Target} instance.
     *
     * @remarks
     *
     * Note that this includes target creations in incognito browser contexts.
     */
    TargetCreated = "targetcreated",
    /**
     * Emitted when a target is destroyed, for example when a page is closed.
     * Contains a {@link Target} instance.
     *
     * @remarks
     *
     * Note that this includes target destructions in incognito browser contexts.
     */
    TargetDestroyed = "targetdestroyed"
}

/**
 * The `CDPSession` instances are used to talk raw Chrome Devtools Protocol.
 *
 * @remarks
 *
 * Protocol methods can be called with {@link CDPSession.send} method and protocol
 * events can be subscribed to with `CDPSession.on` method.
 *
 * Useful links: {@link https://chromedevtools.github.io/devtools-protocol/ | DevTools Protocol Viewer}
 * and {@link https://github.com/aslushnikov/getting-started-with-cdp/blob/master/README.md | Getting Started with DevTools Protocol}.
 *
 * @example
 * ```js
 * const client = await page.target().createCDPSession();
 * await client.send('Animation.enable');
 * client.on('Animation.animationCreated', () => console.log('Animation created!'));
 * const response = await client.send('Animation.getPlaybackRate');
 * console.log('playback rate is ' + response.playbackRate);
 * await client.send('Animation.setPlaybackRate', {
 *   playbackRate: response.playbackRate / 2
 * });
 * ```
 *
 * @public
 */
declare class CDPSession extends EventEmitter {
    /**
     * @internal
     */
    _connection: Connection;
    private _sessionId;
    private _targetType;
    private _callbacks;
    /**
     * @internal
     */
    constructor(connection: Connection, targetType: string, sessionId: string);
    send<T extends keyof ProtocolMapping.Commands>(method: T, ...paramArgs: ProtocolMapping.Commands[T]['paramsType']): Promise<ProtocolMapping.Commands[T]['returnType']>;
    /**
     * @internal
     */
    _onMessage(object: CDPSessionOnMessageObject): void;
    /**
     * Detaches the cdpSession from the target. Once detached, the cdpSession object
     * won't emit any events and can't be used to send messages.
     */
    detach(): Promise<void>;
    /**
     * @internal
     */
    _onClosed(): void;
}

declare interface CDPSessionOnMessageObject {
    id?: number;
    method: string;
    params: Record<string, unknown>;
    error: {
        message: string;
        data: any;
    };
    result?: any;
}

/**
 * @public
 */
declare interface ClickOptions {
    /**
     * Time to wait between `mousedown` and `mouseup` in milliseconds.
     *
     * @defaultValue 0
     */
    delay?: number;
    /**
     * @defaultValue 'left'
     */
    button?: 'left' | 'right' | 'middle';
    /**
     * @defaultValue 1
     */
    clickCount?: number;
}

/**
 * @internal
 */
declare interface CommonEventEmitter {
    on(event: EventType, handler: Handler): CommonEventEmitter;
    off(event: EventType, handler: Handler): CommonEventEmitter;
    addListener(event: EventType, handler: Handler): CommonEventEmitter;
    removeListener(event: EventType, handler: Handler): CommonEventEmitter;
    emit(event: EventType, eventData?: any): boolean;
    once(event: EventType, handler: Handler): CommonEventEmitter;
    listenerCount(event: string): number;
    removeAllListeners(event?: EventType): CommonEventEmitter;
}

/**
 * @internal
 */
declare class Connection extends EventEmitter {
    _url: string;
    _transport: ConnectionTransport;
    _delay: number;
    _lastId: number;
    _sessions: Map<string, CDPSession>;
    _closed: boolean;
    _callbacks: Map<number, ConnectionCallback>;
    constructor(url: string, transport: ConnectionTransport, delay?: number);
    static fromSession(session: CDPSession): Connection;
    /**
     * @param {string} sessionId
     * @returns {?CDPSession}
     */
    session(sessionId: string): CDPSession | null;
    url(): string;
    send<T extends keyof ProtocolMapping.Commands>(method: T, ...paramArgs: ProtocolMapping.Commands[T]['paramsType']): Promise<ProtocolMapping.Commands[T]['returnType']>;
    _rawSend(message: Record<string, unknown>): number;
    _onMessage(message: string): Promise<void>;
    _onClose(): void;
    dispose(): void;
    /**
     * @param {Protocol.Target.TargetInfo} targetInfo
     * @returns {!Promise<!CDPSession>}
     */
    createSession(targetInfo: Protocol.Target.TargetInfo): Promise<CDPSession>;
}

declare interface ConnectionCallback {
    resolve: Function;
    reject: Function;
    error: Error;
    method: string;
}

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
declare interface ConnectionTransport {
    send(string: any): any;
    close(): any;
    onmessage?: (message: string) => void;
    onclose?: () => void;
}

/**
 * @internal
 */
declare type ConsoleAPICalledCallback = (eventType: string, handles: JSHandle[], trace: Protocol.Runtime.StackTrace) => void;

/**
 * @public
 */
declare interface ContinueRequestOverrides {
    /**
     * If set, the request URL will change. This is not a redirect.
     */
    url?: string;
    method?: string;
    postData?: string;
    headers?: Record<string, string>;
}

/**
 * The Coverage class provides methods to gathers information about parts of
 * JavaScript and CSS that were used by the page.
 *
 * @remarks
 * To output coverage in a form consumable by {@link https://github.com/istanbuljs | Istanbul},
 * see {@link https://github.com/istanbuljs/puppeteer-to-istanbul | puppeteer-to-istanbul}.
 *
 * @example
 * An example of using JavaScript and CSS coverage to get percentage of initially
 * executed code:
 * ```js
 * // Enable both JavaScript and CSS coverage
 * await Promise.all([
 *   page.coverage.startJSCoverage(),
 *   page.coverage.startCSSCoverage()
 * ]);
 * // Navigate to page
 * await page.goto('https://example.com');
 * // Disable both JavaScript and CSS coverage
 * const [jsCoverage, cssCoverage] = await Promise.all([
 *   page.coverage.stopJSCoverage(),
 *   page.coverage.stopCSSCoverage(),
 * ]);
 * let totalBytes = 0;
 * let usedBytes = 0;
 * const coverage = [...jsCoverage, ...cssCoverage];
 * for (const entry of coverage) {
 *   totalBytes += entry.text.length;
 *   for (const range of entry.ranges)
 *     usedBytes += range.end - range.start - 1;
 * }
 * console.log(`Bytes used: ${usedBytes / totalBytes * 100}%`);
 * ```
 * @public
 */
declare class Coverage {
    /**
     * @internal
     */
    _jsCoverage: JSCoverage;
    /**
     * @internal
     */
    _cssCoverage: CSSCoverage;
    constructor(client: CDPSession);
    /**
     * @param options - defaults to
     * `{ resetOnNavigation : true, reportAnonymousScripts : false }`
     * @returns Promise that resolves when coverage is started.
     *
     * @remarks
     * Anonymous scripts are ones that don't have an associated url. These are
     * scripts that are dynamically created on the page using `eval` or
     * `new Function`. If `reportAnonymousScripts` is set to `true`, anonymous
     * scripts will have `__puppeteer_evaluation_script__` as their URL.
     */
    startJSCoverage(options?: JSCoverageOptions): Promise<void>;
    /**
     * @returns Promise that resolves to the array of coverage reports for
     * all scripts.
     *
     * @remarks
     * JavaScript Coverage doesn't include anonymous scripts by default.
     * However, scripts with sourceURLs are reported.
     */
    stopJSCoverage(): Promise<CoverageEntry[]>;
    /**
     * @param options - defaults to `{ resetOnNavigation : true }`
     * @returns Promise that resolves when coverage is started.
     */
    startCSSCoverage(options?: CSSCoverageOptions): Promise<void>;
    /**
     * @returns Promise that resolves to the array of coverage reports
     * for all stylesheets.
     * @remarks
     * CSS Coverage doesn't include dynamically injected style tags
     * without sourceURLs.
     */
    stopCSSCoverage(): Promise<CoverageEntry[]>;
}

/**
 * The CoverageEntry class represents one entry of the coverage report.
 * @public
 */
declare interface CoverageEntry {
    /**
     * The URL of the style sheet or script.
     */
    url: string;
    /**
     * The content of the style sheet or script.
     */
    text: string;
    /**
     * The covered range as start and end positions.
     */
    ranges: Array<{
        start: number;
        end: number;
    }>;
}

/**
 * @public
 */
declare interface Credentials {
    username: string;
    password: string;
}

declare class CSSCoverage {
    _client: CDPSession;
    _enabled: boolean;
    _stylesheetURLs: Map<string, string>;
    _stylesheetSources: Map<string, string>;
    _eventListeners: PuppeteerEventListener[];
    _resetOnNavigation: boolean;
    _reportAnonymousScripts: boolean;
    constructor(client: CDPSession);
    start(options?: {
        resetOnNavigation?: boolean;
    }): Promise<void>;
    _onExecutionContextsCleared(): void;
    _onStyleSheet(event: Protocol.CSS.StyleSheetAddedEvent): Promise<void>;
    stop(): Promise<CoverageEntry[]>;
}

/**
 * Set of configurable options for CSS coverage.
 * @public
 */
declare interface CSSCoverageOptions {
    /**
     * Whether to reset coverage on every navigation.
     */
    resetOnNavigation?: boolean;
}

/**
 * @internal
 */
declare class DOMWorld {
    private _frameManager;
    private _frame;
    private _timeoutSettings;
    private _documentPromise?;
    private _contextPromise?;
    private _contextResolveCallback?;
    private _detached;
    /**
     * @internal
     */
    _waitTasks: Set<WaitTask>;
    /**
     * @internal
     * Contains mapping from functions that should be bound to Puppeteer functions.
     */
    _boundFunctions: Map<string, Function>;
    private _ctxBindings;
    private static bindingIdentifier;
    constructor(frameManager: FrameManager, frame: Frame, timeoutSettings: TimeoutSettings);
    frame(): Frame;
    _setContext(context?: ExecutionContext): Promise<void>;
    _hasContext(): boolean;
    _detach(): void;
    executionContext(): Promise<ExecutionContext>;
    evaluateHandle<HandlerType extends JSHandle = JSHandle>(pageFunction: EvaluateHandleFn, ...args: SerializableOrJSHandle[]): Promise<HandlerType>;
    evaluate<T extends EvaluateFn>(pageFunction: T, ...args: SerializableOrJSHandle[]): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>>;
    $(selector: string): Promise<ElementHandle | null>;
    _document(): Promise<ElementHandle>;
    $x(expression: string): Promise<ElementHandle[]>;
    $eval<ReturnType>(selector: string, pageFunction: (element: Element, ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    $$eval<ReturnType>(selector: string, pageFunction: (elements: Element[], ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    $$(selector: string): Promise<ElementHandle[]>;
    content(): Promise<string>;
    setContent(html: string, options?: {
        timeout?: number;
        waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }): Promise<void>;
    /**
     * Adds a script tag into the current context.
     *
     * @remarks
     *
     * You can pass a URL, filepath or string of contents. Note that when running Puppeteer
     * in a browser environment you cannot pass a filepath and should use either
     * `url` or `content`.
     */
    addScriptTag(options: {
        url?: string;
        path?: string;
        content?: string;
        type?: string;
    }): Promise<ElementHandle>;
    /**
     * Adds a style tag into the current context.
     *
     * @remarks
     *
     * You can pass a URL, filepath or string of contents. Note that when running Puppeteer
     * in a browser environment you cannot pass a filepath and should use either
     * `url` or `content`.
     *
     */
    addStyleTag(options: {
        url?: string;
        path?: string;
        content?: string;
    }): Promise<ElementHandle>;
    click(selector: string, options: {
        delay?: number;
        button?: MouseButton;
        clickCount?: number;
    }): Promise<void>;
    focus(selector: string): Promise<void>;
    hover(selector: string): Promise<void>;
    select(selector: string, ...values: string[]): Promise<string[]>;
    tap(selector: string): Promise<void>;
    type(selector: string, text: string, options?: {
        delay: number;
    }): Promise<void>;
    waitForSelector(selector: string, options: WaitForSelectorOptions): Promise<ElementHandle | null>;
    private _settingUpBinding;
    /**
     * @internal
     */
    addBindingToContext(context: ExecutionContext, name: string): Promise<void>;
    private _onBindingCalled;
    /**
     * @internal
     */
    waitForSelectorInPage(queryOne: Function, selector: string, options: WaitForSelectorOptions, binding?: PageBinding): Promise<ElementHandle | null>;
    waitForXPath(xpath: string, options: WaitForSelectorOptions): Promise<ElementHandle | null>;
    waitForFunction(pageFunction: Function | string, options?: {
        polling?: string | number;
        timeout?: number;
    }, ...args: SerializableOrJSHandle[]): Promise<JSHandle>;
    title(): Promise<string>;
}

/**
 * ElementHandle represents an in-page DOM element.
 *
 * @remarks
 *
 * ElementHandles can be created with the {@link Page.$} method.
 *
 * ```js
 * const puppeteer = require('puppeteer');
 *
 * (async () => {
 *  const browser = await puppeteer.launch();
 *  const page = await browser.newPage();
 *  await page.goto('https://example.com');
 *  const hrefElement = await page.$('a');
 *  await hrefElement.click();
 *  // ...
 * })();
 * ```
 *
 * ElementHandle prevents the DOM element from being garbage-collected unless the
 * handle is {@link JSHandle.dispose | disposed}. ElementHandles are auto-disposed
 * when their origin frame gets navigated.
 *
 * ElementHandle instances can be used as arguments in {@link Page.$eval} and
 * {@link Page.evaluate} methods.
 *
 * If you're using TypeScript, ElementHandle takes a generic argument that
 * denotes the type of element the handle is holding within. For example, if you
 * have a handle to a `<select>` element, you can type it as
 * `ElementHandle<HTMLSelectElement>` and you get some nicer type checks.
 *
 * @public
 */
declare class ElementHandle<ElementType extends Element = Element> extends JSHandle {
    private _page;
    private _frameManager;
    /**
     * @internal
     */
    constructor(context: ExecutionContext, client: CDPSession, remoteObject: Protocol.Runtime.RemoteObject, page: Page, frameManager: FrameManager);
    asElement(): ElementHandle<ElementType> | null;
    /**
     * Resolves to the content frame for element handles referencing
     * iframe nodes, or null otherwise
     */
    contentFrame(): Promise<Frame | null>;
    private _scrollIntoViewIfNeeded;
    private _clickablePoint;
    private _getBoxModel;
    private _fromProtocolQuad;
    private _intersectQuadWithViewport;
    /**
     * This method scrolls element into view if needed, and then
     * uses {@link Page.mouse} to hover over the center of the element.
     * If the element is detached from DOM, the method throws an error.
     */
    hover(): Promise<void>;
    /**
     * This method scrolls element into view if needed, and then
     * uses {@link Page.mouse} to click in the center of the element.
     * If the element is detached from DOM, the method throws an error.
     */
    click(options?: ClickOptions): Promise<void>;
    /**
     * Triggers a `change` and `input` event once all the provided options have been
     * selected. If there's no `<select>` element matching `selector`, the method
     * throws an error.
     *
     * @example
     * ```js
     * handle.select('blue'); // single selection
     * handle.select('red', 'green', 'blue'); // multiple selections
     * ```
     * @param values - Values of options to select. If the `<select>` has the
     *    `multiple` attribute, all values are considered, otherwise only the first
     *    one is taken into account.
     */
    select(...values: string[]): Promise<string[]>;
    /**
     * This method expects `elementHandle` to point to an
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input | input element}.
     * @param filePaths - Sets the value of the file input to these paths.
     *    If some of the  `filePaths` are relative paths, then they are resolved
     *    relative to the {@link https://nodejs.org/api/process.html#process_process_cwd | current working directory}
     */
    uploadFile(...filePaths: string[]): Promise<void>;
    /**
     * This method scrolls element into view if needed, and then uses
     * {@link Touchscreen.tap} to tap in the center of the element.
     * If the element is detached from DOM, the method throws an error.
     */
    tap(): Promise<void>;
    /**
     * Calls {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus | focus} on the element.
     */
    focus(): Promise<void>;
    /**
     * Focuses the element, and then sends a `keydown`, `keypress`/`input`, and
     * `keyup` event for each character in the text.
     *
     * To press a special key, like `Control` or `ArrowDown`,
     * use {@link ElementHandle.press}.
     *
     * @example
     * ```js
     * await elementHandle.type('Hello'); // Types instantly
     * await elementHandle.type('World', {delay: 100}); // Types slower, like a user
     * ```
     *
     * @example
     * An example of typing into a text field and then submitting the form:
     *
     * ```js
     * const elementHandle = await page.$('input');
     * await elementHandle.type('some text');
     * await elementHandle.press('Enter');
     * ```
     */
    type(text: string, options?: {
        delay: number;
    }): Promise<void>;
    /**
     * Focuses the element, and then uses {@link Keyboard.down} and {@link Keyboard.up}.
     *
     * @remarks
     * If `key` is a single character and no modifier keys besides `Shift`
     * are being held down, a `keypress`/`input` event will also be generated.
     * The `text` option can be specified to force an input event to be generated.
     *
     * **NOTE** Modifier keys DO affect `elementHandle.press`. Holding down `Shift`
     * will type the text in upper case.
     *
     * @param key - Name of key to press, such as `ArrowLeft`.
     *    See {@link KeyInput} for a list of all key names.
     */
    press(key: KeyInput, options?: PressOptions): Promise<void>;
    /**
     * This method returns the bounding box of the element (relative to the main frame),
     * or `null` if the element is not visible.
     */
    boundingBox(): Promise<BoundingBox | null>;
    /**
     * This method returns boxes of the element, or `null` if the element is not visible.
     *
     * @remarks
     *
     * Boxes are represented as an array of points;
     * Each Point is an object `{x, y}`. Box points are sorted clock-wise.
     */
    boxModel(): Promise<BoxModel | null>;
    /**
     * This method scrolls element into view if needed, and then uses
     * {@link Page.screenshot} to take a screenshot of the element.
     * If the element is detached from DOM, the method throws an error.
     */
    screenshot(options?: {}): Promise<string | Buffer | void>;
    /**
     * Runs `element.querySelector` within the page. If no element matches the selector,
     * the return value resolves to `null`.
     */
    $(selector: string): Promise<ElementHandle | null>;
    /**
     * Runs `element.querySelectorAll` within the page. If no elements match the selector,
     * the return value resolves to `[]`.
     */
    $$(selector: string): Promise<ElementHandle[]>;
    /**
     * This method runs `document.querySelector` within the element and passes it as
     * the first argument to `pageFunction`. If there's no element matching `selector`,
     * the method throws an error.
     *
     * If `pageFunction` returns a Promise, then `frame.$eval` would wait for the promise
     * to resolve and return its value.
     *
     * @example
     * ```js
     * const tweetHandle = await page.$('.tweet');
     * expect(await tweetHandle.$eval('.like', node => node.innerText)).toBe('100');
     * expect(await tweetHandle.$eval('.retweets', node => node.innerText)).toBe('10');
     * ```
     */
    $eval<ReturnType>(selector: string, pageFunction: (element: Element, ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    /**
     * This method runs `document.querySelectorAll` within the element and passes it as
     * the first argument to `pageFunction`. If there's no element matching `selector`,
     * the method throws an error.
     *
     * If `pageFunction` returns a Promise, then `frame.$$eval` would wait for the
     * promise to resolve and return its value.
     *
     * @example
     * ```html
     * <div class="feed">
     *   <div class="tweet">Hello!</div>
     *   <div class="tweet">Hi!</div>
     * </div>
     * ```
     *
     * @example
     * ```js
     * const feedHandle = await page.$('.feed');
     * expect(await feedHandle.$$eval('.tweet', nodes => nodes.map(n => n.innerText)))
     *  .toEqual(['Hello!', 'Hi!']);
     * ```
     */
    $$eval<ReturnType>(selector: string, pageFunction: (elements: Element[], ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    /**
     * The method evaluates the XPath expression relative to the elementHandle.
     * If there are no such elements, the method will resolve to an empty array.
     * @param expression - Expression to {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate | evaluate}
     */
    $x(expression: string): Promise<ElementHandle[]>;
    /**
     * Resolves to true if the element is visible in the current viewport.
     */
    isIntersectingViewport(): Promise<boolean>;
}

/**
 * @public
 */
declare type ErrorCode = 'aborted' | 'accessdenied' | 'addressunreachable' | 'blockedbyclient' | 'blockedbyresponse' | 'connectionaborted' | 'connectionclosed' | 'connectionfailed' | 'connectionrefused' | 'connectionreset' | 'internetdisconnected' | 'namenotresolved' | 'timedout' | 'failed';

/**
 * @public
 */
declare type EvaluateFn<T = any> = string | ((arg1: T, ...args: any[]) => any);

/**
 * @public
 */
declare type EvaluateFnReturnType<T extends EvaluateFn> = T extends (...args: any[]) => infer R ? R : any;

/**
 * @public
 */
declare type EvaluateHandleFn = string | ((...args: any[]) => any);

/**
 * The EventEmitter class that many Puppeteer classes extend.
 *
 * @remarks
 *
 * This allows you to listen to events that Puppeteer classes fire and act
 * accordingly. Therefore you'll mostly use {@link EventEmitter.on | on} and
 * {@link EventEmitter.off | off} to bind
 * and unbind to event listeners.
 *
 * @public
 */
declare class EventEmitter implements CommonEventEmitter {
    private emitter;
    private eventsMap;
    /**
     * @internal
     */
    constructor();
    /**
     * Bind an event listener to fire when an event occurs.
     * @param event - the event type you'd like to listen to. Can be a string or symbol.
     * @param handler  - the function to be called when the event occurs.
     * @returns `this` to enable you to chain calls.
     */
    on(event: EventType, handler: Handler): EventEmitter;
    /**
     * Remove an event listener from firing.
     * @param event - the event type you'd like to stop listening to.
     * @param handler  - the function that should be removed.
     * @returns `this` to enable you to chain calls.
     */
    off(event: EventType, handler: Handler): EventEmitter;
    /**
     * Remove an event listener.
     * @deprecated please use `off` instead.
     */
    removeListener(event: EventType, handler: Handler): EventEmitter;
    /**
     * Add an event listener.
     * @deprecated please use `on` instead.
     */
    addListener(event: EventType, handler: Handler): EventEmitter;
    /**
     * Emit an event and call any associated listeners.
     *
     * @param event - the event you'd like to emit
     * @param eventData - any data you'd like to emit with the event
     * @returns `true` if there are any listeners, `false` if there are not.
     */
    emit(event: EventType, eventData?: any): boolean;
    /**
     * Like `on` but the listener will only be fired once and then it will be removed.
     * @param event - the event you'd like to listen to
     * @param handler - the handler function to run when the event occurs
     * @returns `this` to enable you to chain calls.
     */
    once(event: EventType, handler: Handler): EventEmitter;
    /**
     * Gets the number of listeners for a given event.
     *
     * @param event - the event to get the listener count for
     * @returns the number of listeners bound to the given event
     */
    listenerCount(event: EventType): number;
    /**
     * Removes all listeners. If given an event argument, it will remove only
     * listeners for that event.
     * @param event - the event to remove listeners for.
     * @returns `this` to enable you to chain calls.
     */
    removeAllListeners(event?: EventType): EventEmitter;
    private eventListenersCount;
}

declare type EventType = string | symbol;

/**
 * @internal
 */
declare type ExceptionThrownCallback = (details: Protocol.Runtime.ExceptionDetails) => void;

/**
 * This class represents a context for JavaScript execution. A [Page] might have
 * many execution contexts:
 * - each
 *   {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe |
 *   frame } has "default" execution context that is always created after frame is
 *   attached to DOM. This context is returned by the
 *   {@link frame.executionContext()} method.
 * - {@link https://developer.chrome.com/extensions | Extension}'s content scripts
 *   create additional execution contexts.
 *
 * Besides pages, execution contexts can be found in
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API |
 * workers }.
 *
 * @public
 */
declare class ExecutionContext {
    /**
     * @internal
     */
    _client: CDPSession;
    /**
     * @internal
     */
    _world: DOMWorld;
    /**
     * @internal
     */
    _contextId: number;
    /**
     * @internal
     */
    _contextName: string;
    /**
     * @internal
     */
    constructor(client: CDPSession, contextPayload: Protocol.Runtime.ExecutionContextDescription, world: DOMWorld);
    /**
     * @remarks
     *
     * Not every execution context is associated with a frame. For
     * example, workers and extensions have execution contexts that are not
     * associated with frames.
     *
     * @returns The frame associated with this execution context.
     */
    frame(): Frame | null;
    /**
     * @remarks
     * If the function passed to the `executionContext.evaluate` returns a
     * Promise, then `executionContext.evaluate` would wait for the promise to
     * resolve and return its value. If the function passed to the
     * `executionContext.evaluate` returns a non-serializable value, then
     * `executionContext.evaluate` resolves to `undefined`. DevTools Protocol also
     * supports transferring some additional values that are not serializable by
     * `JSON`: `-0`, `NaN`, `Infinity`, `-Infinity`, and bigint literals.
     *
     *
     * @example
     * ```js
     * const executionContext = await page.mainFrame().executionContext();
     * const result = await executionContext.evaluate(() => Promise.resolve(8 * 7))* ;
     * console.log(result); // prints "56"
     * ```
     *
     * @example
     * A string can also be passed in instead of a function.
     *
     * ```js
     * console.log(await executionContext.evaluate('1 + 2')); // prints "3"
     * ```
     *
     * @example
     * {@link JSHandle} instances can be passed as arguments to the
     * `executionContext.* evaluate`:
     * ```js
     * const oneHandle = await executionContext.evaluateHandle(() => 1);
     * const twoHandle = await executionContext.evaluateHandle(() => 2);
     * const result = await executionContext.evaluate(
     *    (a, b) => a + b, oneHandle, * twoHandle
     * );
     * await oneHandle.dispose();
     * await twoHandle.dispose();
     * console.log(result); // prints '3'.
     * ```
     * @param pageFunction a function to be evaluated in the `executionContext`
     * @param args argument to pass to the page function
     *
     * @returns A promise that resolves to the return value of the given function.
     */
    evaluate<ReturnType extends any>(pageFunction: Function | string, ...args: unknown[]): Promise<ReturnType>;
    /**
     * @remarks
     * The only difference between `executionContext.evaluate` and
     * `executionContext.evaluateHandle` is that `executionContext.evaluateHandle`
     * returns an in-page object (a {@link JSHandle}).
     * If the function passed to the `executionContext.evaluateHandle` returns a
     * Promise, then `executionContext.evaluateHandle` would wait for the
     * promise to resolve and return its value.
     *
     * @example
     * ```js
     * const context = await page.mainFrame().executionContext();
     * const aHandle = await context.evaluateHandle(() => Promise.resolve(self));
     * aHandle; // Handle for the global object.
     * ```
     *
     * @example
     * A string can also be passed in instead of a function.
     *
     * ```js
     * // Handle for the '3' * object.
     * const aHandle = await context.evaluateHandle('1 + 2');
     * ```
     *
     * @example
     * JSHandle instances can be passed as arguments
     * to the `executionContext.* evaluateHandle`:
     *
     * ```js
     * const aHandle = await context.evaluateHandle(() => document.body);
     * const resultHandle = await context.evaluateHandle(body => body.innerHTML, * aHandle);
     * console.log(await resultHandle.jsonValue()); // prints body's innerHTML
     * await aHandle.dispose();
     * await resultHandle.dispose();
     * ```
     *
     * @param pageFunction a function to be evaluated in the `executionContext`
     * @param args argument to pass to the page function
     *
     * @returns A promise that resolves to the return value of the given function
     * as an in-page object (a {@link JSHandle}).
     */
    evaluateHandle<HandleType extends JSHandle | ElementHandle = JSHandle>(pageFunction: EvaluateHandleFn, ...args: SerializableOrJSHandle[]): Promise<HandleType>;
    private _evaluateInternal;
    /**
     * This method iterates the JavaScript heap and finds all the objects with the
     * given prototype.
     * @remarks
     * @example
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
     *
     * @param prototypeHandle a handle to the object prototype
     *
     * @returns A handle to an array of objects with the given prototype.
     */
    queryObjects(prototypeHandle: JSHandle): Promise<JSHandle>;
    /**
     * @internal
     */
    _adoptBackendNodeId(backendNodeId: Protocol.DOM.BackendNodeId): Promise<ElementHandle>;
    /**
     * @internal
     */
    _adoptElementHandle(elementHandle: ElementHandle): Promise<ElementHandle>;
}

/**
 * File choosers let you react to the page requesting for a file.
 * @remarks
 * `FileChooser` objects are returned via the `page.waitForFileChooser` method.
 * @example
 * An example of using `FileChooser`:
 * ```js
 * const [fileChooser] = await Promise.all([
 *   page.waitForFileChooser(),
 *   page.click('#upload-file-button'), // some button that triggers file selection
 * ]);
 * await fileChooser.accept(['/tmp/myfile.pdf']);
 * ```
 * **NOTE** In browsers, only one file chooser can be opened at a time.
 * All file choosers must be accepted or canceled. Not doing so will prevent
 * subsequent file choosers from appearing.
 */
declare class FileChooser {
    private _element;
    private _multiple;
    private _handled;
    /**
     * @internal
     */
    constructor(element: ElementHandle, event: Protocol.Page.FileChooserOpenedEvent);
    /**
     * Whether file chooser allow for {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#attr-multiple | multiple} file selection.
     */
    isMultiple(): boolean;
    /**
     * Accept the file chooser request with given paths.
     * @param filePaths - If some of the  `filePaths` are relative paths,
     * then they are resolved relative to the {@link https://nodejs.org/api/process.html#process_process_cwd | current working directory}.
     */
    accept(filePaths: string[]): Promise<void>;
    /**
     * Closes the file chooser without selecting any files.
     */
    cancel(): void;
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
declare class Frame {
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

/**
 * @public
 */
declare interface FrameAddScriptTagOptions {
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
declare interface FrameAddStyleTagOptions {
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
 * @internal
 */
declare class FrameManager extends EventEmitter {
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
declare interface FrameWaitForFunctionOptions {
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
declare interface GeolocationOptions {
    /**
     * Latitude between -90 and 90.
     */
    longitude: number;
    /**
     * Longitude between -180 and 180.
     */
    latitude: number;
    /**
     * Optional non-negative accuracy value.
     */
    accuracy?: number;
}

declare type Handler<T = any> = (event?: T) => void;

/**
 *
 * Represents an HTTP request sent by a page.
 * @remarks
 *
 * Whenever the page sends a request, such as for a network resource, the
 * following events are emitted by Puppeteer's `page`:
 *
 * - `request`:  emitted when the request is issued by the page.
 * - `requestfinished` - emitted when the response body is downloaded and the
 *   request is complete.
 *
 * If request fails at some point, then instead of `requestfinished` event the
 * `requestfailed` event is emitted.
 *
 * All of these events provide an instance of `HTTPRequest` representing the
 * request that occurred:
 *
 * ```
 * page.on('request', request => ...)
 * ```
 *
 * NOTE: HTTP Error responses, such as 404 or 503, are still successful
 * responses from HTTP standpoint, so request will complete with
 * `requestfinished` event.
 *
 * If request gets a 'redirect' response, the request is successfully finished
 * with the `requestfinished` event, and a new request is issued to a
 * redirected url.
 *
 * @public
 */
declare class HTTPRequest {
    /**
     * @internal
     */
    _requestId: string;
    /**
     * @internal
     */
    _interceptionId: string;
    /**
     * @internal
     */
    _failureText: any;
    /**
     * @internal
     */
    _response: HTTPResponse | null;
    /**
     * @internal
     */
    _fromMemoryCache: boolean;
    /**
     * @internal
     */
    _redirectChain: HTTPRequest[];
    private _client;
    private _isNavigationRequest;
    private _allowInterception;
    private _interceptionHandled;
    private _url;
    private _resourceType;
    private _method;
    private _postData?;
    private _headers;
    private _frame;
    /**
     * @internal
     */
    constructor(client: CDPSession, frame: Frame, interceptionId: string, allowInterception: boolean, event: Protocol.Network.RequestWillBeSentEvent, redirectChain: HTTPRequest[]);
    /**
     * @returns the URL of the request
     */
    url(): string;
    /**
     * Contains the request's resource type as it was perceived by the rendering
     * engine.
     */
    resourceType(): ResourceType;
    /**
     * @returns the method used (`GET`, `POST`, etc.)
     */
    method(): string;
    /**
     * @returns the request's post body, if any.
     */
    postData(): string | undefined;
    /**
     * @returns an object with HTTP headers associated with the request. All
     * header names are lower-case.
     */
    headers(): Record<string, string>;
    /**
     * @returns the response for this request, if a response has been received.
     */
    response(): HTTPResponse | null;
    /**
     * @returns the frame that initiated the request.
     */
    frame(): Frame | null;
    /**
     * @returns true if the request is the driver of the current frame's navigation.
     */
    isNavigationRequest(): boolean;
    /**
     * @remarks
     *
     * `redirectChain` is shared between all the requests of the same chain.
     *
     * For example, if the website `http://example.com` has a single redirect to
     * `https://example.com`, then the chain will contain one request:
     *
     * ```js
     * const response = await page.goto('http://example.com');
     * const chain = response.request().redirectChain();
     * console.log(chain.length); // 1
     * console.log(chain[0].url()); // 'http://example.com'
     * ```
     *
     * If the website `https://google.com` has no redirects, then the chain will be empty:
     *
     * ```js
     * const response = await page.goto('https://google.com');
     * const chain = response.request().redirectChain();
     * console.log(chain.length); // 0
     * ```
     *
     * @returns the chain of requests - if a server responds with at least a
     * single redirect, this chain will contain all requests that were redirected.
     */
    redirectChain(): HTTPRequest[];
    /**
     * Access information about the request's failure.
     *
     * @remarks
     *
     * @example
     *
     * Example of logging all failed requests:
     *
     * ```js
     * page.on('requestfailed', request => {
     *   console.log(request.url() + ' ' + request.failure().errorText);
     * });
     * ```
     *
     * @returns `null` unless the request failed. If the request fails this can
     * return an object with `errorText` containing a human-readable error
     * message, e.g. `net::ERR_FAILED`. It is not guaranteeded that there will be
     * failure text if the request fails.
     */
    failure(): {
        errorText: string;
    } | null;
    /**
     * Continues request with optional request overrides.
     *
     * @remarks
     *
     * To use this, request
     * interception should be enabled with {@link Page.setRequestInterception}.
     *
     * Exception is immediately thrown if the request interception is not enabled.
     *
     * @example
     * ```js
     * await page.setRequestInterception(true);
     * page.on('request', request => {
     *   // Override headers
     *   const headers = Object.assign({}, request.headers(), {
     *     foo: 'bar', // set "foo" header
     *     origin: undefined, // remove "origin" header
     *   });
     *   request.continue({headers});
     * });
     * ```
     *
     * @param overrides - optional overrides to apply to the request.
     */
    continue(overrides?: ContinueRequestOverrides): Promise<void>;
    /**
     * Fulfills a request with the given response.
     *
     * @remarks
     *
     * To use this, request
     * interception should be enabled with {@link Page.setRequestInterception}.
     *
     * Exception is immediately thrown if the request interception is not enabled.
     *
     * @example
     * An example of fulfilling all requests with 404 responses:
     * ```js
     * await page.setRequestInterception(true);
     * page.on('request', request => {
     *   request.respond({
     *     status: 404,
     *     contentType: 'text/plain',
     *     body: 'Not Found!'
     *   });
     * });
     * ```
     *
     * NOTE: Mocking responses for dataURL requests is not supported.
     * Calling `request.respond` for a dataURL request is a noop.
     *
     * @param response - the response to fulfill the request with.
     */
    respond(response: ResponseForRequest): Promise<void>;
    /**
     * Aborts a request.
     *
     * @remarks
     * To use this, request interception should be enabled with
     * {@link Page.setRequestInterception}. If it is not enabled, this method will
     * throw an exception immediately.
     *
     * @param errorCode - optional error code to provide.
     */
    abort(errorCode?: ErrorCode): Promise<void>;
}

/**
 * The HTTPResponse class represents responses which are received by the
 * {@link Page} class.
 *
 * @public
 */
declare class HTTPResponse {
    private _client;
    private _request;
    private _contentPromise;
    private _bodyLoadedPromise;
    private _bodyLoadedPromiseFulfill;
    private _remoteAddress;
    private _status;
    private _statusText;
    private _url;
    private _fromDiskCache;
    private _fromServiceWorker;
    private _headers;
    private _securityDetails;
    /**
     * @internal
     */
    constructor(client: CDPSession, request: HTTPRequest, responsePayload: Protocol.Network.Response);
    /**
     * @internal
     */
    _resolveBody(err: Error | null): void;
    /**
     * @returns The IP address and port number used to connect to the remote
     * server.
     */
    remoteAddress(): RemoteAddress;
    /**
     * @returns The URL of the response.
     */
    url(): string;
    /**
     * @returns True if the response was successful (status in the range 200-299).
     */
    ok(): boolean;
    /**
     * @returns The status code of the response (e.g., 200 for a success).
     */
    status(): number;
    /**
     * @returns  The status text of the response (e.g. usually an "OK" for a
     * success).
     */
    statusText(): string;
    /**
     * @returns An object with HTTP headers associated with the response. All
     * header names are lower-case.
     */
    headers(): Record<string, string>;
    /**
     * @returns {@link SecurityDetails} if the response was received over the
     * secure connection, or `null` otherwise.
     */
    securityDetails(): SecurityDetails | null;
    /**
     * @returns Promise which resolves to a buffer with response body.
     */
    buffer(): Promise<Buffer>;
    /**
     * @returns Promise which resolves to a text representation of response body.
     */
    text(): Promise<string>;
    /**
     *
     * @returns Promise which resolves to a JSON representation of response body.
     *
     * @remarks
     *
     * This method will throw if the response body is not parsable via
     * `JSON.parse`.
     */
    json(): Promise<any>;
    /**
     * @returns A matching {@link HTTPRequest} object.
     */
    request(): HTTPRequest;
    /**
     * @returns True if the response was served from either the browser's disk
     * cache or memory cache.
     */
    fromCache(): boolean;
    /**
     * @returns True if the response was served by a service worker.
     */
    fromServiceWorker(): boolean;
    /**
     * @returns A {@link Frame} that initiated this response, or `null` if
     * navigating to error pages.
     */
    frame(): Frame | null;
}

declare interface InternalNetworkConditions extends NetworkConditions {
    offline: boolean;
}

declare class JSCoverage {
    _client: CDPSession;
    _enabled: boolean;
    _scriptURLs: Map<string, string>;
    _scriptSources: Map<string, string>;
    _eventListeners: PuppeteerEventListener[];
    _resetOnNavigation: boolean;
    _reportAnonymousScripts: boolean;
    constructor(client: CDPSession);
    start(options?: {
        resetOnNavigation?: boolean;
        reportAnonymousScripts?: boolean;
    }): Promise<void>;
    _onExecutionContextsCleared(): void;
    _onScriptParsed(event: Protocol.Debugger.ScriptParsedEvent): Promise<void>;
    stop(): Promise<CoverageEntry[]>;
}

/**
 * Set of configurable options for JS coverage.
 * @public
 */
declare interface JSCoverageOptions {
    /**
     * Whether to reset coverage on every navigation.
     */
    resetOnNavigation?: boolean;
    /**
     * Whether anonymous scripts generated by the page should be reported.
     */
    reportAnonymousScripts?: boolean;
}

/**
 * Represents an in-page JavaScript object. JSHandles can be created with the
 * {@link Page.evaluateHandle | page.evaluateHandle} method.
 *
 * @example
 * ```js
 * const windowHandle = await page.evaluateHandle(() => window);
 * ```
 *
 * JSHandle prevents the referenced JavaScript object from being garbage-collected
 * unless the handle is {@link JSHandle.dispose | disposed}. JSHandles are auto-
 * disposed when their origin frame gets navigated or the parent context gets destroyed.
 *
 * JSHandle instances can be used as arguments for {@link Page.$eval},
 * {@link Page.evaluate}, and {@link Page.evaluateHandle}.
 *
 * @public
 */
declare class JSHandle {
    /**
     * @internal
     */
    _context: ExecutionContext;
    /**
     * @internal
     */
    _client: CDPSession;
    /**
     * @internal
     */
    _remoteObject: Protocol.Runtime.RemoteObject;
    /**
     * @internal
     */
    _disposed: boolean;
    /**
     * @internal
     */
    constructor(context: ExecutionContext, client: CDPSession, remoteObject: Protocol.Runtime.RemoteObject);
    /** Returns the execution context the handle belongs to.
     */
    executionContext(): ExecutionContext;
    /**
     * This method passes this handle as the first argument to `pageFunction`.
     * If `pageFunction` returns a Promise, then `handle.evaluate` would wait
     * for the promise to resolve and return its value.
     *
     * @example
     * ```js
     * const tweetHandle = await page.$('.tweet .retweets');
     * expect(await tweetHandle.evaluate(node => node.innerText)).toBe('10');
     * ```
     */
    evaluate<T extends EvaluateFn>(pageFunction: T | string, ...args: SerializableOrJSHandle[]): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>>;
    /**
     * This method passes this handle as the first argument to `pageFunction`.
     *
     * @remarks
     *
     * The only difference between `jsHandle.evaluate` and
     * `jsHandle.evaluateHandle` is that `jsHandle.evaluateHandle`
     * returns an in-page object (JSHandle).
     *
     * If the function passed to `jsHandle.evaluateHandle` returns a Promise,
     * then `evaluateHandle.evaluateHandle` waits for the promise to resolve and
     * returns its value.
     *
     * See {@link Page.evaluateHandle} for more details.
     */
    evaluateHandle<HandleType extends JSHandle = JSHandle>(pageFunction: EvaluateHandleFn, ...args: SerializableOrJSHandle[]): Promise<HandleType>;
    /** Fetches a single property from the referenced object.
     */
    getProperty(propertyName: string): Promise<JSHandle | undefined>;
    /**
     * The method returns a map with property names as keys and JSHandle
     * instances for the property values.
     *
     * @example
     * ```js
     * const listHandle = await page.evaluateHandle(() => document.body.children);
     * const properties = await listHandle.getProperties();
     * const children = [];
     * for (const property of properties.values()) {
     *   const element = property.asElement();
     *   if (element)
     *     children.push(element);
     * }
     * children; // holds elementHandles to all children of document.body
     * ```
     */
    getProperties(): Promise<Map<string, JSHandle>>;
    /**
     * Returns a JSON representation of the object.
     *
     * @remarks
     *
     * The JSON is generated by running {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify | JSON.stringify}
     * on the object in page and consequent {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | JSON.parse} in puppeteer.
     * **NOTE** The method throws if the referenced object is not stringifiable.
     */
    jsonValue<T = unknown>(): Promise<T>;
    /**
     * Returns either `null` or the object handle itself, if the object handle is
     * an instance of {@link ElementHandle}.
     */
    asElement(): ElementHandle | null;
    /**
     * Stops referencing the element handle, and resolves when the object handle is
     * successfully disposed of.
     */
    dispose(): Promise<void>;
    /**
     * Returns a string representation of the JSHandle.
     *
     * @remarks Useful during debugging.
     */
    toString(): string;
}

/**
 * @public
 */
declare type JSONArray = Serializable[];

/**
 * @public
 */
declare interface JSONObject {
    [key: string]: Serializable;
}

/**
 * Keyboard provides an api for managing a virtual keyboard.
 * The high level api is {@link Keyboard."type"},
 * which takes raw characters and generates proper keydown, keypress/input,
 * and keyup events on your page.
 *
 * @remarks
 * For finer control, you can use {@link Keyboard.down},
 * {@link Keyboard.up}, and {@link Keyboard.sendCharacter}
 * to manually fire events as if they were generated from a real keyboard.
 *
 * On MacOS, keyboard shortcuts like `⌘ A` -\> Select All do not work.
 * See {@link https://github.com/puppeteer/puppeteer/issues/1313 | #1313}.
 *
 * @example
 * An example of holding down `Shift` in order to select and delete some text:
 * ```js
 * await page.keyboard.type('Hello World!');
 * await page.keyboard.press('ArrowLeft');
 *
 * await page.keyboard.down('Shift');
 * for (let i = 0; i < ' World'.length; i++)
 *   await page.keyboard.press('ArrowLeft');
 * await page.keyboard.up('Shift');
 *
 * await page.keyboard.press('Backspace');
 * // Result text will end up saying 'Hello!'
 * ```
 *
 * @example
 * An example of pressing `A`
 * ```js
 * await page.keyboard.down('Shift');
 * await page.keyboard.press('KeyA');
 * await page.keyboard.up('Shift');
 * ```
 *
 * @public
 */
declare class Keyboard {
    private _client;
    /** @internal */
    _modifiers: number;
    private _pressedKeys;
    /** @internal */
    constructor(client: CDPSession);
    /**
     * Dispatches a `keydown` event.
     *
     * @remarks
     * If `key` is a single character and no modifier keys besides `Shift`
     * are being held down, a `keypress`/`input` event will also generated.
     * The `text` option can be specified to force an input event to be generated.
     * If `key` is a modifier key, `Shift`, `Meta`, `Control`, or `Alt`,
     * subsequent key presses will be sent with that modifier active.
     * To release the modifier key, use {@link Keyboard.up}.
     *
     * After the key is pressed once, subsequent calls to
     * {@link Keyboard.down} will have
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat | repeat}
     * set to true. To release the key, use {@link Keyboard.up}.
     *
     * Modifier keys DO influence {@link Keyboard.down}.
     * Holding down `Shift` will type the text in upper case.
     *
     * @param key - Name of key to press, such as `ArrowLeft`.
     * See {@link KeyInput} for a list of all key names.
     *
     * @param options - An object of options. Accepts text which, if specified,
     * generates an input event with this text.
     */
    down(key: KeyInput, options?: {
        text?: string;
    }): Promise<void>;
    private _modifierBit;
    private _keyDescriptionForString;
    /**
     * Dispatches a `keyup` event.
     *
     * @param key - Name of key to release, such as `ArrowLeft`.
     * See {@link KeyInput | KeyInput}
     * for a list of all key names.
     */
    up(key: KeyInput): Promise<void>;
    /**
     * Dispatches a `keypress` and `input` event.
     * This does not send a `keydown` or `keyup` event.
     *
     * @remarks
     * Modifier keys DO NOT effect {@link Keyboard.sendCharacter | Keyboard.sendCharacter}.
     * Holding down `Shift` will not type the text in upper case.
     *
     * @example
     * ```js
     * page.keyboard.sendCharacter('嗨');
     * ```
     *
     * @param char - Character to send into the page.
     */
    sendCharacter(char: string): Promise<void>;
    private charIsKey;
    /**
     * Sends a `keydown`, `keypress`/`input`,
     * and `keyup` event for each character in the text.
     *
     * @remarks
     * To press a special key, like `Control` or `ArrowDown`,
     * use {@link Keyboard.press}.
     *
     * Modifier keys DO NOT effect `keyboard.type`.
     * Holding down `Shift` will not type the text in upper case.
     *
     * @example
     * ```js
     * await page.keyboard.type('Hello'); // Types instantly
     * await page.keyboard.type('World', {delay: 100}); // Types slower, like a user
     * ```
     *
     * @param text - A text to type into a focused element.
     * @param options - An object of options. Accepts delay which,
     * if specified, is the time to wait between `keydown` and `keyup` in milliseconds.
     * Defaults to 0.
     */
    type(text: string, options?: {
        delay?: number;
    }): Promise<void>;
    /**
     * Shortcut for {@link Keyboard.down}
     * and {@link Keyboard.up}.
     *
     * @remarks
     * If `key` is a single character and no modifier keys besides `Shift`
     * are being held down, a `keypress`/`input` event will also generated.
     * The `text` option can be specified to force an input event to be generated.
     *
     * Modifier keys DO effect {@link Keyboard.press}.
     * Holding down `Shift` will type the text in upper case.
     *
     * @param key - Name of key to press, such as `ArrowLeft`.
     * See {@link KeyInput} for a list of all key names.
     *
     * @param options - An object of options. Accepts text which, if specified,
     * generates an input event with this text. Accepts delay which,
     * if specified, is the time to wait between `keydown` and `keyup` in milliseconds.
     * Defaults to 0.
     */
    press(key: KeyInput, options?: {
        delay?: number;
        text?: string;
    }): Promise<void>;
}

/**
 * All the valid keys that can be passed to functions that take user input, such
 * as {@link Keyboard.press | keyboard.press }
 *
 * @public
 */
declare type KeyInput = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'Power' | 'Eject' | 'Abort' | 'Help' | 'Backspace' | 'Tab' | 'Numpad5' | 'NumpadEnter' | 'Enter' | '\r' | '\n' | 'ShiftLeft' | 'ShiftRight' | 'ControlLeft' | 'ControlRight' | 'AltLeft' | 'AltRight' | 'Pause' | 'CapsLock' | 'Escape' | 'Convert' | 'NonConvert' | 'Space' | 'Numpad9' | 'PageUp' | 'Numpad3' | 'PageDown' | 'End' | 'Numpad1' | 'Home' | 'Numpad7' | 'ArrowLeft' | 'Numpad4' | 'Numpad8' | 'ArrowUp' | 'ArrowRight' | 'Numpad6' | 'Numpad2' | 'ArrowDown' | 'Select' | 'Open' | 'PrintScreen' | 'Insert' | 'Numpad0' | 'Delete' | 'NumpadDecimal' | 'Digit0' | 'Digit1' | 'Digit2' | 'Digit3' | 'Digit4' | 'Digit5' | 'Digit6' | 'Digit7' | 'Digit8' | 'Digit9' | 'KeyA' | 'KeyB' | 'KeyC' | 'KeyD' | 'KeyE' | 'KeyF' | 'KeyG' | 'KeyH' | 'KeyI' | 'KeyJ' | 'KeyK' | 'KeyL' | 'KeyM' | 'KeyN' | 'KeyO' | 'KeyP' | 'KeyQ' | 'KeyR' | 'KeyS' | 'KeyT' | 'KeyU' | 'KeyV' | 'KeyW' | 'KeyX' | 'KeyY' | 'KeyZ' | 'MetaLeft' | 'MetaRight' | 'ContextMenu' | 'NumpadMultiply' | 'NumpadAdd' | 'NumpadSubtract' | 'NumpadDivide' | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12' | 'F13' | 'F14' | 'F15' | 'F16' | 'F17' | 'F18' | 'F19' | 'F20' | 'F21' | 'F22' | 'F23' | 'F24' | 'NumLock' | 'ScrollLock' | 'AudioVolumeMute' | 'AudioVolumeDown' | 'AudioVolumeUp' | 'MediaTrackNext' | 'MediaTrackPrevious' | 'MediaStop' | 'MediaPlayPause' | 'Semicolon' | 'Equal' | 'NumpadEqual' | 'Comma' | 'Minus' | 'Period' | 'Slash' | 'Backquote' | 'BracketLeft' | 'Backslash' | 'BracketRight' | 'Quote' | 'AltGraph' | 'Props' | 'Cancel' | 'Clear' | 'Shift' | 'Control' | 'Alt' | 'Accept' | 'ModeChange' | ' ' | 'Print' | 'Execute' | '\u0000' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' | 'Meta' | '*' | '+' | '-' | '/' | ';' | '=' | ',' | '.' | '`' | '[' | '\\' | ']' | "'" | 'Attn' | 'CrSel' | 'ExSel' | 'EraseEof' | 'Play' | 'ZoomOut' | ')' | '!' | '@' | '#' | '$' | '%' | '^' | '&' | '(' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z' | ':' | '<' | '_' | '>' | '?' | '~' | '{' | '|' | '}' | '"' | 'SoftLeft' | 'SoftRight' | 'Camera' | 'Call' | 'EndCall' | 'VolumeDown' | 'VolumeUp';

declare interface MediaFeature {
    name: string;
    value: string;
}

/**
 * @public
 */
declare interface Metrics {
    Timestamp?: number;
    Documents?: number;
    Frames?: number;
    JSEventListeners?: number;
    Nodes?: number;
    LayoutCount?: number;
    RecalcStyleCount?: number;
    LayoutDuration?: number;
    RecalcStyleDuration?: number;
    ScriptDuration?: number;
    TaskDuration?: number;
    JSHeapUsedSize?: number;
    JSHeapTotalSize?: number;
}

/**
 * The Mouse class operates in main-frame CSS pixels
 * relative to the top-left corner of the viewport.
 * @remarks
 * Every `page` object has its own Mouse, accessible with [`page.mouse`](#pagemouse).
 *
 * @example
 * ```js
 * // Using ‘page.mouse’ to trace a 100x100 square.
 * await page.mouse.move(0, 0);
 * await page.mouse.down();
 * await page.mouse.move(0, 100);
 * await page.mouse.move(100, 100);
 * await page.mouse.move(100, 0);
 * await page.mouse.move(0, 0);
 * await page.mouse.up();
 * ```
 *
 * **Note**: The mouse events trigger synthetic `MouseEvent`s.
 * This means that it does not fully replicate the functionality of what a normal user
 * would be able to do with their mouse.
 *
 * For example, dragging and selecting text is not possible using `page.mouse`.
 * Instead, you can use the {@link https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/getSelection | `DocumentOrShadowRoot.getSelection()`} functionality implemented in the platform.
 *
 * @example
 * For example, if you want to select all content between nodes:
 * ```js
 * await page.evaluate((from, to) => {
 *   const selection = from.getRootNode().getSelection();
 *   const range = document.createRange();
 *   range.setStartBefore(from);
 *   range.setEndAfter(to);
 *   selection.removeAllRanges();
 *   selection.addRange(range);
 * }, fromJSHandle, toJSHandle);
 * ```
 * If you then would want to copy-paste your selection, you can use the clipboard api:
 * ```js
 * // The clipboard api does not allow you to copy, unless the tab is focused.
 * await page.bringToFront();
 * await page.evaluate(() => {
 *   // Copy the selected content to the clipboard
 *   document.execCommand('copy');
 *   // Obtain the content of the clipboard as a string
 *   return navigator.clipboard.readText();
 * });
 * ```
 * **Note**: If you want access to the clipboard API,
 * you have to give it permission to do so:
 * ```js
 * await browser.defaultBrowserContext().overridePermissions(
 *   '<your origin>', ['clipboard-read', 'clipboard-write']
 * );
 * ```
 * @public
 */
declare class Mouse {
    private _client;
    private _keyboard;
    private _x;
    private _y;
    private _button;
    /**
     * @internal
     */
    constructor(client: CDPSession, keyboard: Keyboard);
    /**
     * Dispatches a `mousemove` event.
     * @param x - Horizontal position of the mouse.
     * @param y - Vertical position of the mouse.
     * @param options - Optional object. If specified, the `steps` property
     * sends intermediate `mousemove` events when set to `1` (default).
     */
    move(x: number, y: number, options?: {
        steps?: number;
    }): Promise<void>;
    /**
     * Shortcut for `mouse.move`, `mouse.down` and `mouse.up`.
     * @param x - Horizontal position of the mouse.
     * @param y - Vertical position of the mouse.
     * @param options - Optional `MouseOptions`.
     */
    click(x: number, y: number, options?: MouseOptions & {
        delay?: number;
    }): Promise<void>;
    /**
     * Dispatches a `mousedown` event.
     * @param options - Optional `MouseOptions`.
     */
    down(options?: MouseOptions): Promise<void>;
    /**
     * Dispatches a `mouseup` event.
     * @param options - Optional `MouseOptions`.
     */
    up(options?: MouseOptions): Promise<void>;
    /**
     * Dispatches a `mousewheel` event.
     * @param options - Optional: `MouseWheelOptions`.
     *
     * @example
     * An example of zooming into an element:
     * ```js
     * await page.goto('https://mdn.mozillademos.org/en-US/docs/Web/API/Element/wheel_event$samples/Scaling_an_element_via_the_wheel?revision=1587366');
     *
     * const elem = await page.$('div');
     * const boundingBox = await elem.boundingBox();
     * await page.mouse.move(
     *   boundingBox.x + boundingBox.width / 2,
     *   boundingBox.y + boundingBox.height / 2
     * );
     *
     * await page.mouse.wheel({ deltaY: -100 })
     * ```
     */
    wheel(options?: MouseWheelOptions): Promise<void>;
}

/**
 * @public
 */
declare type MouseButton = 'left' | 'right' | 'middle';

/**
 * @public
 */
declare interface MouseOptions {
    button?: MouseButton;
    clickCount?: number;
}

/**
 * @public
 */
declare interface MouseWheelOptions {
    deltaX?: number;
    deltaY?: number;
}

/**
 * @public
 */
declare interface NetworkConditions {
    download: number;
    upload: number;
    latency: number;
}

/**
 * @internal
 */
declare class NetworkManager extends EventEmitter {
    _client: CDPSession;
    _ignoreHTTPSErrors: boolean;
    _frameManager: FrameManager;
    _requestIdToRequest: Map<string, HTTPRequest>;
    _requestIdToRequestWillBeSentEvent: Map<string, Protocol.Network.RequestWillBeSentEvent>;
    _extraHTTPHeaders: Record<string, string>;
    _credentials?: Credentials;
    _attemptedAuthentications: Set<string>;
    _userRequestInterceptionEnabled: boolean;
    _userRequestInterceptionCacheSafe: boolean;
    _protocolRequestInterceptionEnabled: boolean;
    _userCacheDisabled: boolean;
    _requestIdToInterceptionId: Map<string, string>;
    _emulatedNetworkConditions: InternalNetworkConditions;
    constructor(client: CDPSession, ignoreHTTPSErrors: boolean, frameManager: FrameManager);
    initialize(): Promise<void>;
    authenticate(credentials?: Credentials): Promise<void>;
    setExtraHTTPHeaders(extraHTTPHeaders: Record<string, string>): Promise<void>;
    extraHTTPHeaders(): Record<string, string>;
    setOfflineMode(value: boolean): Promise<void>;
    emulateNetworkConditions(networkConditions: NetworkConditions | null): Promise<void>;
    _updateNetworkConditions(): Promise<void>;
    setUserAgent(userAgent: string): Promise<void>;
    setCacheEnabled(enabled: boolean): Promise<void>;
    setRequestInterception(value: boolean, cacheSafe?: boolean): Promise<void>;
    _updateProtocolRequestInterception(): Promise<void>;
    _updateProtocolCacheDisabled(): Promise<void>;
    _onRequestWillBeSent(event: Protocol.Network.RequestWillBeSentEvent): void;
    _onAuthRequired(event: Protocol.Fetch.AuthRequiredEvent): void;
    _onRequestPaused(event: Protocol.Fetch.RequestPausedEvent): void;
    _onRequest(event: Protocol.Network.RequestWillBeSentEvent, interceptionId?: string): void;
    _onRequestServedFromCache(event: Protocol.Network.RequestServedFromCacheEvent): void;
    _handleRequestRedirect(request: HTTPRequest, responsePayload: Protocol.Network.Response): void;
    _onResponseReceived(event: Protocol.Network.ResponseReceivedEvent): void;
    _onLoadingFinished(event: Protocol.Network.LoadingFinishedEvent): void;
    _onLoadingFailed(event: Protocol.Network.LoadingFailedEvent): void;
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
declare class Page extends EventEmitter {
    /**
     * @internal
     */
    static create(client: CDPSession, target: Target, ignoreHTTPSErrors: boolean, defaultViewport: Viewport | null): Promise<Page>;
    private _closed;
    private _client;
    private _target;
    private _keyboard;
    private _mouse;
    private _timeoutSettings;
    private _touchscreen;
    private _accessibility;
    private _frameManager;
    private _emulationManager;
    private _tracing;
    private _pageBindings;
    private _coverage;
    private _javascriptEnabled;
    private _viewport;
    private _screenshotTaskQueue;
    private _workers;
    private _fileChooserInterceptors;
    private _disconnectPromise?;
    /**
     * @internal
     */
    constructor(client: CDPSession, target: Target, ignoreHTTPSErrors: boolean);
    private _initialize;
    private _onFileChooser;
    /**
     * @returns `true` if the page has JavaScript enabled, `false` otherwise.
     */
    isJavaScriptEnabled(): boolean;
    /**
     * @param options - Optional waiting parameters
     * @returns Resolves after a page requests a file picker.
     */
    waitForFileChooser(options?: WaitTimeoutOptions): Promise<FileChooser>;
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
    setGeolocation(options: GeolocationOptions): Promise<void>;
    /**
     * @returns A target this page was created from.
     */
    target(): Target;
    /**
     * @returns The browser this page belongs to.
     */
    browser(): Browser;
    /**
     * @returns The browser context that the page belongs to
     */
    browserContext(): BrowserContext;
    private _onTargetCrashed;
    private _onLogEntryAdded;
    /**
     * @returns The page's main frame.
     */
    mainFrame(): Frame;
    get keyboard(): Keyboard;
    get touchscreen(): Touchscreen;
    get coverage(): Coverage;
    get tracing(): Tracing;
    get accessibility(): Accessibility;
    /**
     * @returns An array of all frames attached to the page.
     */
    frames(): Frame[];
    /**
     * @returns all of the dedicated
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API | WebWorkers}
     * associated with the page.
     */
    workers(): WebWorker[];
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
    setRequestInterception(value: boolean, cacheSafe?: boolean): Promise<void>;
    /**
     * @param enabled - When `true`, enables offline mode for the page.
     */
    setOfflineMode(enabled: boolean): Promise<void>;
    emulateNetworkConditions(networkConditions: NetworkConditions | null): Promise<void>;
    /**
     * @param timeout - Maximum navigation time in milliseconds.
     */
    setDefaultNavigationTimeout(timeout: number): void;
    /**
     * @param timeout - Maximum time in milliseconds.
     */
    setDefaultTimeout(timeout: number): void;
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
    $(selector: string): Promise<ElementHandle | null>;
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
    evaluateHandle<HandlerType extends JSHandle = JSHandle>(pageFunction: EvaluateHandleFn, ...args: SerializableOrJSHandle[]): Promise<HandlerType>;
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
    queryObjects(prototypeHandle: JSHandle): Promise<JSHandle>;
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
    $eval<ReturnType>(selector: string, pageFunction: (element: Element, ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
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
    $$eval<ReturnType>(selector: string, pageFunction: (elements: Element[], ...args: unknown[]) => ReturnType | Promise<ReturnType>, ...args: SerializableOrJSHandle[]): Promise<WrapElementHandle<ReturnType>>;
    $$(selector: string): Promise<ElementHandle[]>;
    $x(expression: string): Promise<ElementHandle[]>;
    /**
     * If no URLs are specified, this method returns cookies for the current page
     * URL. If URLs are specified, only cookies for those URLs are returned.
     */
    cookies(...urls: string[]): Promise<Protocol.Network.Cookie[]>;
    deleteCookie(...cookies: Protocol.Network.DeleteCookiesRequest[]): Promise<void>;
    setCookie(...cookies: Protocol.Network.CookieParam[]): Promise<void>;
    addScriptTag(options: {
        url?: string;
        path?: string;
        content?: string;
        type?: string;
    }): Promise<ElementHandle>;
    addStyleTag(options: {
        url?: string;
        path?: string;
        content?: string;
    }): Promise<ElementHandle>;
    exposeFunction(name: string, puppeteerFunction: Function): Promise<void>;
    authenticate(credentials: Credentials): Promise<void>;
    setExtraHTTPHeaders(headers: Record<string, string>): Promise<void>;
    setUserAgent(userAgent: string): Promise<void>;
    metrics(): Promise<Metrics>;
    private _emitMetrics;
    private _buildMetricsObject;
    private _handleException;
    private _onConsoleAPI;
    private _onBindingCalled;
    private _addConsoleMessage;
    private _onDialog;
    /**
     * Resets default white background
     */
    private _resetDefaultBackgroundColor;
    /**
     * Hides default white background
     */
    private _setTransparentBackgroundColor;
    url(): string;
    content(): Promise<string>;
    setContent(html: string, options?: WaitForOptions): Promise<void>;
    goto(url: string, options?: WaitForOptions & {
        referer?: string;
    }): Promise<HTTPResponse>;
    reload(options?: WaitForOptions): Promise<HTTPResponse | null>;
    waitForNavigation(options?: WaitForOptions): Promise<HTTPResponse | null>;
    private _sessionClosePromise;
    waitForRequest(urlOrPredicate: string | Function, options?: {
        timeout?: number;
    }): Promise<HTTPRequest>;
    waitForResponse(urlOrPredicate: string | Function, options?: {
        timeout?: number;
    }): Promise<HTTPResponse>;
    goBack(options?: WaitForOptions): Promise<HTTPResponse | null>;
    goForward(options?: WaitForOptions): Promise<HTTPResponse | null>;
    private _go;
    bringToFront(): Promise<void>;
    emulate(options: {
        viewport: Viewport;
        userAgent: string;
    }): Promise<void>;
    setJavaScriptEnabled(enabled: boolean): Promise<void>;
    setBypassCSP(enabled: boolean): Promise<void>;
    emulateMediaType(type?: string): Promise<void>;
    emulateMediaFeatures(features?: MediaFeature[]): Promise<void>;
    emulateTimezone(timezoneId?: string): Promise<void>;
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
    emulateIdleState(overrides?: {
        isUserActive: boolean;
        isScreenUnlocked: boolean;
    }): Promise<void>;
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
    emulateVisionDeficiency(type?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']): Promise<void>;
    setViewport(viewport: Viewport): Promise<void>;
    viewport(): Viewport | null;
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
    evaluate<T extends EvaluateFn>(pageFunction: T, ...args: SerializableOrJSHandle[]): Promise<UnwrapPromiseLike<EvaluateFnReturnType<T>>>;
    evaluateOnNewDocument(pageFunction: Function | string, ...args: unknown[]): Promise<void>;
    setCacheEnabled(enabled?: boolean): Promise<void>;
    screenshot(options?: ScreenshotOptions): Promise<Buffer | string | void>;
    private _screenshotTask;
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
    pdf(options?: PDFOptions): Promise<Buffer>;
    title(): Promise<string>;
    close(options?: {
        runBeforeUnload?: boolean;
    }): Promise<void>;
    isClosed(): boolean;
    get mouse(): Mouse;
    click(selector: string, options?: {
        delay?: number;
        button?: MouseButton;
        clickCount?: number;
    }): Promise<void>;
    focus(selector: string): Promise<void>;
    hover(selector: string): Promise<void>;
    select(selector: string, ...values: string[]): Promise<string[]>;
    tap(selector: string): Promise<void>;
    type(selector: string, text: string, options?: {
        delay: number;
    }): Promise<void>;
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
    waitFor(selectorOrFunctionOrTimeout: string | number | Function, options?: {
        visible?: boolean;
        hidden?: boolean;
        timeout?: number;
        polling?: string | number;
    }, ...args: SerializableOrJSHandle[]): Promise<JSHandle>;
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
    waitForTimeout(milliseconds: number): Promise<void>;
    waitForSelector(selector: string, options?: {
        visible?: boolean;
        hidden?: boolean;
        timeout?: number;
    }): Promise<ElementHandle | null>;
    waitForXPath(xpath: string, options?: {
        visible?: boolean;
        hidden?: boolean;
        timeout?: number;
    }): Promise<ElementHandle | null>;
    waitForFunction(pageFunction: Function | string, options?: {
        timeout?: number;
        polling?: string | number;
    }, ...args: SerializableOrJSHandle[]): Promise<JSHandle>;
}

/**
 * @internal
 */
declare interface PageBinding {
    name: string;
    pptrFunction: Function;
}

/**
 * All the valid paper format types when printing a PDF.
 *
 * @remarks
 *
 * The sizes of each format are as follows:
 * - `Letter`: 8.5in x 11in
 *
 * - `Legal`: 8.5in x 14in
 *
 * - `Tabloid`: 11in x 17in
 *
 * - `Ledger`: 17in x 11in
 *
 * - `A0`: 33.1in x 46.8in
 *
 * - `A1`: 23.4in x 33.1in
 *
 * - `A2`: 16.54in x 23.4in
 *
 * - `A3`: 11.7in x 16.54in
 *
 * - `A4`: 8.27in x 11.7in
 *
 * - `A5`: 5.83in x 8.27in
 *
 * - `A6`: 4.13in x 5.83in
 *
 * @public
 */
declare type PaperFormat = 'letter' | 'legal' | 'tabloid' | 'ledger' | 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6';

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
/**
 * @public
 */
declare interface PDFMargin {
    top?: string | number;
    bottom?: string | number;
    left?: string | number;
    right?: string | number;
}

/**
 * Valid options to configure PDF generation via {@link Page.pdf}.
 * @public
 */
declare interface PDFOptions {
    /**
     * Scales the rendering of the web page. Amount must be between `0.1` and `2`.
     * @defaultValue 1
     */
    scale?: number;
    /**
     * Whether to show the header and footer.
     * @defaultValue false
     */
    displayHeaderFooter?: boolean;
    /**
     * HTML template for the print header. Should be valid HTML with the following
     * classes used to inject values into them:
     * - `date` formatted print date
     *
     * - `title` document title
     *
     * - `url` document location
     *
     * - `pageNumber` current page number
     *
     * - `totalPages` total pages in the document
     */
    headerTemplate?: string;
    /**
     * HTML template for the print footer. Has the same constraints and support
     * for special classes as {@link PDFOptions.headerTemplate}.
     */
    footerTemplate?: string;
    /**
     * Set to `true` to print background graphics.
     * @defaultValue false
     */
    printBackground?: boolean;
    /**
     * Whether to print in landscape orientation.
     * @defaultValue = false
     */
    landscape?: boolean;
    /**
     * Paper ranges to print, e.g. `1-5, 8, 11-13`.
     * @defaultValue The empty string, which means all pages are printed.
     */
    pageRanges?: string;
    /**
     * @remarks
     * If set, this takes priority over the `width` and `height` options.
     * @defaultValue `letter`.
     */
    format?: PaperFormat;
    /**
     * Sets the width of paper. You can pass in a number or a string with a unit.
     */
    width?: string | number;
    /**
     * Sets the height of paper. You can pass in a number or a string with a unit.
     */
    height?: string | number;
    /**
     * Give any CSS `@page` size declared in the page priority over what is
     * declared in the `width` or `height` or `format` option.
     * @defaultValue `false`, which will scale the content to fit the paper size.
     */
    preferCSSPageSize?: boolean;
    /**
     * Set the PDF margins.
     * @defaultValue no margins are set.
     */
    margin?: PDFMargin;
    /**
     * The path to save the file to.
     *
     * @remarks
     *
     * If the path is relative, it's resolved relative to the current working directory.
     *
     * @defaultValue the empty string, which means the PDF will not be written to disk.
     */
    path?: string;
    /**
     * Hides default white background and allows generating pdfs with transparency.
     * @defaultValue false
     */
    omitBackground?: boolean;
}

/**
 * @public
 */
export declare type Permission = 'geolocation' | 'midi' | 'notifications' | 'camera' | 'microphone' | 'background-sync' | 'ambient-light-sensor' | 'accelerometer' | 'gyroscope' | 'magnetometer' | 'accessibility-events' | 'clipboard-read' | 'clipboard-write' | 'payment-handler' | 'idle-detection' | 'midi-sysex';

/**
 * @public
 */
declare interface PressOptions {
    /**
     * Time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0.
     */
    delay?: number;
    /**
     * If specified, generates an input event with this text.
     */
    text?: string;
}

/**********************************************************************
 * Auto-generated by protocol-dts-generator.ts, do not edit manually. *
 **********************************************************************/

/**
 * The Chrome DevTools Protocol.
 * @public
 */
declare namespace Protocol {

    type integer = number

    /**
     * This domain is deprecated - use Runtime or Log instead.
     */
    namespace Console {

        const enum ConsoleMessageSource {
            XML = 'xml',
            Javascript = 'javascript',
            Network = 'network',
            ConsoleAPI = 'console-api',
            Storage = 'storage',
            Appcache = 'appcache',
            Rendering = 'rendering',
            Security = 'security',
            Other = 'other',
            Deprecation = 'deprecation',
            Worker = 'worker',
        }

        const enum ConsoleMessageLevel {
            Log = 'log',
            Warning = 'warning',
            Error = 'error',
            Debug = 'debug',
            Info = 'info',
        }

        /**
         * Console message.
         */
        interface ConsoleMessage {
            /**
             * Message source. (ConsoleMessageSource enum)
             */
            source: ('xml' | 'javascript' | 'network' | 'console-api' | 'storage' | 'appcache' | 'rendering' | 'security' | 'other' | 'deprecation' | 'worker');
            /**
             * Message severity. (ConsoleMessageLevel enum)
             */
            level: ('log' | 'warning' | 'error' | 'debug' | 'info');
            /**
             * Message text.
             */
            text: string;
            /**
             * URL of the message origin.
             */
            url?: string;
            /**
             * Line number in the resource that generated this message (1-based).
             */
            line?: integer;
            /**
             * Column number in the resource that generated this message (1-based).
             */
            column?: integer;
        }

        /**
         * Issued when new console message is added.
         */
        interface MessageAddedEvent {
            /**
             * Console message that has been added.
             */
            message: ConsoleMessage;
        }
    }

    /**
     * Debugger domain exposes JavaScript debugging capabilities. It allows setting and removing
     * breakpoints, stepping through execution, exploring stack traces, etc.
     */
    namespace Debugger {

        /**
         * Breakpoint identifier.
         */
        type BreakpointId = string;

        /**
         * Call frame identifier.
         */
        type CallFrameId = string;

        /**
         * Location in the source code.
         */
        interface Location {
            /**
             * Script identifier as reported in the `Debugger.scriptParsed`.
             */
            scriptId: Runtime.ScriptId;
            /**
             * Line number in the script (0-based).
             */
            lineNumber: integer;
            /**
             * Column number in the script (0-based).
             */
            columnNumber?: integer;
        }

        /**
         * Location in the source code.
         */
        interface ScriptPosition {
            lineNumber: integer;
            columnNumber: integer;
        }

        /**
         * Location range within one script.
         */
        interface LocationRange {
            scriptId: Runtime.ScriptId;
            start: ScriptPosition;
            end: ScriptPosition;
        }

        /**
         * JavaScript call frame. Array of call frames form the call stack.
         */
        interface CallFrame {
            /**
             * Call frame identifier. This identifier is only valid while the virtual machine is paused.
             */
            callFrameId: CallFrameId;
            /**
             * Name of the JavaScript function called on this call frame.
             */
            functionName: string;
            /**
             * Location in the source code.
             */
            functionLocation?: Location;
            /**
             * Location in the source code.
             */
            location: Location;
            /**
             * JavaScript script name or url.
             */
            url: string;
            /**
             * Scope chain for this call frame.
             */
            scopeChain: Scope[];
            /**
             * `this` object for this call frame.
             */
            this: Runtime.RemoteObject;
            /**
             * The value being returned, if the function is at return point.
             */
            returnValue?: Runtime.RemoteObject;
        }

        const enum ScopeType {
            Global = 'global',
            Local = 'local',
            With = 'with',
            Closure = 'closure',
            Catch = 'catch',
            Block = 'block',
            Script = 'script',
            Eval = 'eval',
            Module = 'module',
            WasmExpressionStack = 'wasm-expression-stack',
        }

        /**
         * Scope description.
         */
        interface Scope {
            /**
             * Scope type. (ScopeType enum)
             */
            type: ('global' | 'local' | 'with' | 'closure' | 'catch' | 'block' | 'script' | 'eval' | 'module' | 'wasm-expression-stack');
            /**
             * Object representing the scope. For `global` and `with` scopes it represents the actual
             * object; for the rest of the scopes, it is artificial transient object enumerating scope
             * variables as its properties.
             */
            object: Runtime.RemoteObject;
            name?: string;
            /**
             * Location in the source code where scope starts
             */
            startLocation?: Location;
            /**
             * Location in the source code where scope ends
             */
            endLocation?: Location;
        }

        /**
         * Search match for resource.
         */
        interface SearchMatch {
            /**
             * Line number in resource content.
             */
            lineNumber: number;
            /**
             * Line with match content.
             */
            lineContent: string;
        }

        const enum BreakLocationType {
            DebuggerStatement = 'debuggerStatement',
            Call = 'call',
            Return = 'return',
        }

        interface BreakLocation {
            /**
             * Script identifier as reported in the `Debugger.scriptParsed`.
             */
            scriptId: Runtime.ScriptId;
            /**
             * Line number in the script (0-based).
             */
            lineNumber: integer;
            /**
             * Column number in the script (0-based).
             */
            columnNumber?: integer;
            /**
             *  (BreakLocationType enum)
             */
            type?: ('debuggerStatement' | 'call' | 'return');
        }

        /**
         * Enum of possible script languages.
         */
        type ScriptLanguage = ('JavaScript' | 'WebAssembly');

        const enum DebugSymbolsType {
            None = 'None',
            SourceMap = 'SourceMap',
            EmbeddedDWARF = 'EmbeddedDWARF',
            ExternalDWARF = 'ExternalDWARF',
        }

        /**
         * Debug symbols available for a wasm script.
         */
        interface DebugSymbols {
            /**
             * Type of the debug symbols. (DebugSymbolsType enum)
             */
            type: ('None' | 'SourceMap' | 'EmbeddedDWARF' | 'ExternalDWARF');
            /**
             * URL of the external symbol source.
             */
            externalURL?: string;
        }

        const enum ContinueToLocationRequestTargetCallFrames {
            Any = 'any',
            Current = 'current',
        }

        interface ContinueToLocationRequest {
            /**
             * Location to continue to.
             */
            location: Location;
            /**
             *  (ContinueToLocationRequestTargetCallFrames enum)
             */
            targetCallFrames?: ('any' | 'current');
        }

        interface EnableRequest {
            /**
             * The maximum size in bytes of collected scripts (not referenced by other heap objects)
             * the debugger can hold. Puts no limit if paramter is omitted.
             */
            maxScriptsCacheSize?: number;
        }

        interface EnableResponse {
            /**
             * Unique identifier of the debugger.
             */
            debuggerId: Runtime.UniqueDebuggerId;
        }

        interface EvaluateOnCallFrameRequest {
            /**
             * Call frame identifier to evaluate on.
             */
            callFrameId: CallFrameId;
            /**
             * Expression to evaluate.
             */
            expression: string;
            /**
             * String object group name to put result into (allows rapid releasing resulting object handles
             * using `releaseObjectGroup`).
             */
            objectGroup?: string;
            /**
             * Specifies whether command line API should be available to the evaluated expression, defaults
             * to false.
             */
            includeCommandLineAPI?: boolean;
            /**
             * In silent mode exceptions thrown during evaluation are not reported and do not pause
             * execution. Overrides `setPauseOnException` state.
             */
            silent?: boolean;
            /**
             * Whether the result is expected to be a JSON object that should be sent by value.
             */
            returnByValue?: boolean;
            /**
             * Whether preview should be generated for the result.
             */
            generatePreview?: boolean;
            /**
             * Whether to throw an exception if side effect cannot be ruled out during evaluation.
             */
            throwOnSideEffect?: boolean;
            /**
             * Terminate execution after timing out (number of milliseconds).
             */
            timeout?: Runtime.TimeDelta;
        }

        interface EvaluateOnCallFrameResponse {
            /**
             * Object wrapper for the evaluation result.
             */
            result: Runtime.RemoteObject;
            /**
             * Exception details.
             */
            exceptionDetails?: Runtime.ExceptionDetails;
        }

        interface ExecuteWasmEvaluatorRequest {
            /**
             * WebAssembly call frame identifier to evaluate on.
             */
            callFrameId: CallFrameId;
            /**
             * Code of the evaluator module. (Encoded as a base64 string when passed over JSON)
             */
            evaluator: string;
            /**
             * Terminate execution after timing out (number of milliseconds).
             */
            timeout?: Runtime.TimeDelta;
        }

        interface ExecuteWasmEvaluatorResponse {
            /**
             * Object wrapper for the evaluation result.
             */
            result: Runtime.RemoteObject;
            /**
             * Exception details.
             */
            exceptionDetails?: Runtime.ExceptionDetails;
        }

        interface GetPossibleBreakpointsRequest {
            /**
             * Start of range to search possible breakpoint locations in.
             */
            start: Location;
            /**
             * End of range to search possible breakpoint locations in (excluding). When not specified, end
             * of scripts is used as end of range.
             */
            end?: Location;
            /**
             * Only consider locations which are in the same (non-nested) function as start.
             */
            restrictToFunction?: boolean;
        }

        interface GetPossibleBreakpointsResponse {
            /**
             * List of the possible breakpoint locations.
             */
            locations: BreakLocation[];
        }

        interface GetScriptSourceRequest {
            /**
             * Id of the script to get source for.
             */
            scriptId: Runtime.ScriptId;
        }

        interface GetScriptSourceResponse {
            /**
             * Script source (empty in case of Wasm bytecode).
             */
            scriptSource: string;
            /**
             * Wasm bytecode. (Encoded as a base64 string when passed over JSON)
             */
            bytecode?: string;
        }

        interface GetWasmBytecodeRequest {
            /**
             * Id of the Wasm script to get source for.
             */
            scriptId: Runtime.ScriptId;
        }

        interface GetWasmBytecodeResponse {
            /**
             * Script source. (Encoded as a base64 string when passed over JSON)
             */
            bytecode: string;
        }

        interface GetStackTraceRequest {
            stackTraceId: Runtime.StackTraceId;
        }

        interface GetStackTraceResponse {
            stackTrace: Runtime.StackTrace;
        }

        interface PauseOnAsyncCallRequest {
            /**
             * Debugger will pause when async call with given stack trace is started.
             */
            parentStackTraceId: Runtime.StackTraceId;
        }

        interface RemoveBreakpointRequest {
            breakpointId: BreakpointId;
        }

        interface RestartFrameRequest {
            /**
             * Call frame identifier to evaluate on.
             */
            callFrameId: CallFrameId;
        }

        interface RestartFrameResponse {
            /**
             * New stack trace.
             */
            callFrames: CallFrame[];
            /**
             * Async stack trace, if any.
             */
            asyncStackTrace?: Runtime.StackTrace;
            /**
             * Async stack trace, if any.
             */
            asyncStackTraceId?: Runtime.StackTraceId;
        }

        interface ResumeRequest {
            /**
             * Set to true to terminate execution upon resuming execution. In contrast
             * to Runtime.terminateExecution, this will allows to execute further
             * JavaScript (i.e. via evaluation) until execution of the paused code
             * is actually resumed, at which point termination is triggered.
             * If execution is currently not paused, this parameter has no effect.
             */
            terminateOnResume?: boolean;
        }

        interface SearchInContentRequest {
            /**
             * Id of the script to search in.
             */
            scriptId: Runtime.ScriptId;
            /**
             * String to search for.
             */
            query: string;
            /**
             * If true, search is case sensitive.
             */
            caseSensitive?: boolean;
            /**
             * If true, treats string parameter as regex.
             */
            isRegex?: boolean;
        }

        interface SearchInContentResponse {
            /**
             * List of search matches.
             */
            result: SearchMatch[];
        }

        interface SetAsyncCallStackDepthRequest {
            /**
             * Maximum depth of async call stacks. Setting to `0` will effectively disable collecting async
             * call stacks (default).
             */
            maxDepth: integer;
        }

        interface SetBlackboxPatternsRequest {
            /**
             * Array of regexps that will be used to check script url for blackbox state.
             */
            patterns: string[];
        }

        interface SetBlackboxedRangesRequest {
            /**
             * Id of the script.
             */
            scriptId: Runtime.ScriptId;
            positions: ScriptPosition[];
        }

        interface SetBreakpointRequest {
            /**
             * Location to set breakpoint in.
             */
            location: Location;
            /**
             * Expression to use as a breakpoint condition. When specified, debugger will only stop on the
             * breakpoint if this expression evaluates to true.
             */
            condition?: string;
        }

        interface SetBreakpointResponse {
            /**
             * Id of the created breakpoint for further reference.
             */
            breakpointId: BreakpointId;
            /**
             * Location this breakpoint resolved into.
             */
            actualLocation: Location;
        }

        const enum SetInstrumentationBreakpointRequestInstrumentation {
            BeforeScriptExecution = 'beforeScriptExecution',
            BeforeScriptWithSourceMapExecution = 'beforeScriptWithSourceMapExecution',
        }

        interface SetInstrumentationBreakpointRequest {
            /**
             * Instrumentation name. (SetInstrumentationBreakpointRequestInstrumentation enum)
             */
            instrumentation: ('beforeScriptExecution' | 'beforeScriptWithSourceMapExecution');
        }

        interface SetInstrumentationBreakpointResponse {
            /**
             * Id of the created breakpoint for further reference.
             */
            breakpointId: BreakpointId;
        }

        interface SetBreakpointByUrlRequest {
            /**
             * Line number to set breakpoint at.
             */
            lineNumber: integer;
            /**
             * URL of the resources to set breakpoint on.
             */
            url?: string;
            /**
             * Regex pattern for the URLs of the resources to set breakpoints on. Either `url` or
             * `urlRegex` must be specified.
             */
            urlRegex?: string;
            /**
             * Script hash of the resources to set breakpoint on.
             */
            scriptHash?: string;
            /**
             * Offset in the line to set breakpoint at.
             */
            columnNumber?: integer;
            /**
             * Expression to use as a breakpoint condition. When specified, debugger will only stop on the
             * breakpoint if this expression evaluates to true.
             */
            condition?: string;
        }

        interface SetBreakpointByUrlResponse {
            /**
             * Id of the created breakpoint for further reference.
             */
            breakpointId: BreakpointId;
            /**
             * List of the locations this breakpoint resolved into upon addition.
             */
            locations: Location[];
        }

        interface SetBreakpointOnFunctionCallRequest {
            /**
             * Function object id.
             */
            objectId: Runtime.RemoteObjectId;
            /**
             * Expression to use as a breakpoint condition. When specified, debugger will
             * stop on the breakpoint if this expression evaluates to true.
             */
            condition?: string;
        }

        interface SetBreakpointOnFunctionCallResponse {
            /**
             * Id of the created breakpoint for further reference.
             */
            breakpointId: BreakpointId;
        }

        interface SetBreakpointsActiveRequest {
            /**
             * New value for breakpoints active state.
             */
            active: boolean;
        }

        const enum SetPauseOnExceptionsRequestState {
            None = 'none',
            Uncaught = 'uncaught',
            All = 'all',
        }

        interface SetPauseOnExceptionsRequest {
            /**
             * Pause on exceptions mode. (SetPauseOnExceptionsRequestState enum)
             */
            state: ('none' | 'uncaught' | 'all');
        }

        interface SetReturnValueRequest {
            /**
             * New return value.
             */
            newValue: Runtime.CallArgument;
        }

        interface SetScriptSourceRequest {
            /**
             * Id of the script to edit.
             */
            scriptId: Runtime.ScriptId;
            /**
             * New content of the script.
             */
            scriptSource: string;
            /**
             * If true the change will not actually be applied. Dry run may be used to get result
             * description without actually modifying the code.
             */
            dryRun?: boolean;
        }

        interface SetScriptSourceResponse {
            /**
             * New stack trace in case editing has happened while VM was stopped.
             */
            callFrames?: CallFrame[];
            /**
             * Whether current call stack  was modified after applying the changes.
             */
            stackChanged?: boolean;
            /**
             * Async stack trace, if any.
             */
            asyncStackTrace?: Runtime.StackTrace;
            /**
             * Async stack trace, if any.
             */
            asyncStackTraceId?: Runtime.StackTraceId;
            /**
             * Exception details if any.
             */
            exceptionDetails?: Runtime.ExceptionDetails;
        }

        interface SetSkipAllPausesRequest {
            /**
             * New value for skip pauses state.
             */
            skip: boolean;
        }

        interface SetVariableValueRequest {
            /**
             * 0-based number of scope as was listed in scope chain. Only 'local', 'closure' and 'catch'
             * scope types are allowed. Other scopes could be manipulated manually.
             */
            scopeNumber: integer;
            /**
             * Variable name.
             */
            variableName: string;
            /**
             * New variable value.
             */
            newValue: Runtime.CallArgument;
            /**
             * Id of callframe that holds variable.
             */
            callFrameId: CallFrameId;
        }

        interface StepIntoRequest {
            /**
             * Debugger will pause on the execution of the first async task which was scheduled
             * before next pause.
             */
            breakOnAsyncCall?: boolean;
            /**
             * The skipList specifies location ranges that should be skipped on step into.
             */
            skipList?: LocationRange[];
        }

        interface StepOverRequest {
            /**
             * The skipList specifies location ranges that should be skipped on step over.
             */
            skipList?: LocationRange[];
        }

        /**
         * Fired when breakpoint is resolved to an actual script and location.
         */
        interface BreakpointResolvedEvent {
            /**
             * Breakpoint unique identifier.
             */
            breakpointId: BreakpointId;
            /**
             * Actual breakpoint location.
             */
            location: Location;
        }

        const enum PausedEventReason {
            Ambiguous = 'ambiguous',
            Assert = 'assert',
            DebugCommand = 'debugCommand',
            DOM = 'DOM',
            EventListener = 'EventListener',
            Exception = 'exception',
            Instrumentation = 'instrumentation',
            OOM = 'OOM',
            Other = 'other',
            PromiseRejection = 'promiseRejection',
            XHR = 'XHR',
        }

        /**
         * Fired when the virtual machine stopped on breakpoint or exception or any other stop criteria.
         */
        interface PausedEvent {
            /**
             * Call stack the virtual machine stopped on.
             */
            callFrames: CallFrame[];
            /**
             * Pause reason. (PausedEventReason enum)
             */
            reason: ('ambiguous' | 'assert' | 'debugCommand' | 'DOM' | 'EventListener' | 'exception' | 'instrumentation' | 'OOM' | 'other' | 'promiseRejection' | 'XHR');
            /**
             * Object containing break-specific auxiliary properties.
             */
            data?: any;
            /**
             * Hit breakpoints IDs
             */
            hitBreakpoints?: string[];
            /**
             * Async stack trace, if any.
             */
            asyncStackTrace?: Runtime.StackTrace;
            /**
             * Async stack trace, if any.
             */
            asyncStackTraceId?: Runtime.StackTraceId;
            /**
             * Never present, will be removed.
             */
            asyncCallStackTraceId?: Runtime.StackTraceId;
        }

        /**
         * Fired when virtual machine fails to parse the script.
         */
        interface ScriptFailedToParseEvent {
            /**
             * Identifier of the script parsed.
             */
            scriptId: Runtime.ScriptId;
            /**
             * URL or name of the script parsed (if any).
             */
            url: string;
            /**
             * Line offset of the script within the resource with given URL (for script tags).
             */
            startLine: integer;
            /**
             * Column offset of the script within the resource with given URL.
             */
            startColumn: integer;
            /**
             * Last line of the script.
             */
            endLine: integer;
            /**
             * Length of the last line of the script.
             */
            endColumn: integer;
            /**
             * Specifies script creation context.
             */
            executionContextId: Runtime.ExecutionContextId;
            /**
             * Content hash of the script.
             */
            hash: string;
            /**
             * Embedder-specific auxiliary data.
             */
            executionContextAuxData?: any;
            /**
             * URL of source map associated with script (if any).
             */
            sourceMapURL?: string;
            /**
             * True, if this script has sourceURL.
             */
            hasSourceURL?: boolean;
            /**
             * True, if this script is ES6 module.
             */
            isModule?: boolean;
            /**
             * This script length.
             */
            length?: integer;
            /**
             * JavaScript top stack frame of where the script parsed event was triggered if available.
             */
            stackTrace?: Runtime.StackTrace;
            /**
             * If the scriptLanguage is WebAssembly, the code section offset in the module.
             */
            codeOffset?: integer;
            /**
             * The language of the script.
             */
            scriptLanguage?: Debugger.ScriptLanguage;
            /**
             * The name the embedder supplied for this script.
             */
            embedderName?: string;
        }

        /**
         * Fired when virtual machine parses script. This event is also fired for all known and uncollected
         * scripts upon enabling debugger.
         */
        interface ScriptParsedEvent {
            /**
             * Identifier of the script parsed.
             */
            scriptId: Runtime.ScriptId;
            /**
             * URL or name of the script parsed (if any).
             */
            url: string;
            /**
             * Line offset of the script within the resource with given URL (for script tags).
             */
            startLine: integer;
            /**
             * Column offset of the script within the resource with given URL.
             */
            startColumn: integer;
            /**
             * Last line of the script.
             */
            endLine: integer;
            /**
             * Length of the last line of the script.
             */
            endColumn: integer;
            /**
             * Specifies script creation context.
             */
            executionContextId: Runtime.ExecutionContextId;
            /**
             * Content hash of the script.
             */
            hash: string;
            /**
             * Embedder-specific auxiliary data.
             */
            executionContextAuxData?: any;
            /**
             * True, if this script is generated as a result of the live edit operation.
             */
            isLiveEdit?: boolean;
            /**
             * URL of source map associated with script (if any).
             */
            sourceMapURL?: string;
            /**
             * True, if this script has sourceURL.
             */
            hasSourceURL?: boolean;
            /**
             * True, if this script is ES6 module.
             */
            isModule?: boolean;
            /**
             * This script length.
             */
            length?: integer;
            /**
             * JavaScript top stack frame of where the script parsed event was triggered if available.
             */
            stackTrace?: Runtime.StackTrace;
            /**
             * If the scriptLanguage is WebAssembly, the code section offset in the module.
             */
            codeOffset?: integer;
            /**
             * The language of the script.
             */
            scriptLanguage?: Debugger.ScriptLanguage;
            /**
             * If the scriptLanguage is WebASsembly, the source of debug symbols for the module.
             */
            debugSymbols?: Debugger.DebugSymbols;
            /**
             * The name the embedder supplied for this script.
             */
            embedderName?: string;
        }
    }

    namespace HeapProfiler {

        /**
         * Heap snapshot object id.
         */
        type HeapSnapshotObjectId = string;

        /**
         * Sampling Heap Profile node. Holds callsite information, allocation statistics and child nodes.
         */
        interface SamplingHeapProfileNode {
            /**
             * Function location.
             */
            callFrame: Runtime.CallFrame;
            /**
             * Allocations size in bytes for the node excluding children.
             */
            selfSize: number;
            /**
             * Node id. Ids are unique across all profiles collected between startSampling and stopSampling.
             */
            id: integer;
            /**
             * Child nodes.
             */
            children: SamplingHeapProfileNode[];
        }

        /**
         * A single sample from a sampling profile.
         */
        interface SamplingHeapProfileSample {
            /**
             * Allocation size in bytes attributed to the sample.
             */
            size: number;
            /**
             * Id of the corresponding profile tree node.
             */
            nodeId: integer;
            /**
             * Time-ordered sample ordinal number. It is unique across all profiles retrieved
             * between startSampling and stopSampling.
             */
            ordinal: number;
        }

        /**
         * Sampling profile.
         */
        interface SamplingHeapProfile {
            head: SamplingHeapProfileNode;
            samples: SamplingHeapProfileSample[];
        }

        interface AddInspectedHeapObjectRequest {
            /**
             * Heap snapshot object id to be accessible by means of $x command line API.
             */
            heapObjectId: HeapSnapshotObjectId;
        }

        interface GetHeapObjectIdRequest {
            /**
             * Identifier of the object to get heap object id for.
             */
            objectId: Runtime.RemoteObjectId;
        }

        interface GetHeapObjectIdResponse {
            /**
             * Id of the heap snapshot object corresponding to the passed remote object id.
             */
            heapSnapshotObjectId: HeapSnapshotObjectId;
        }

        interface GetObjectByHeapObjectIdRequest {
            objectId: HeapSnapshotObjectId;
            /**
             * Symbolic group name that can be used to release multiple objects.
             */
            objectGroup?: string;
        }

        interface GetObjectByHeapObjectIdResponse {
            /**
             * Evaluation result.
             */
            result: Runtime.RemoteObject;
        }

        interface GetSamplingProfileResponse {
            /**
             * Return the sampling profile being collected.
             */
            profile: SamplingHeapProfile;
        }

        interface StartSamplingRequest {
            /**
             * Average sample interval in bytes. Poisson distribution is used for the intervals. The
             * default value is 32768 bytes.
             */
            samplingInterval?: number;
        }

        interface StartTrackingHeapObjectsRequest {
            trackAllocations?: boolean;
        }

        interface StopSamplingResponse {
            /**
             * Recorded sampling heap profile.
             */
            profile: SamplingHeapProfile;
        }

        interface StopTrackingHeapObjectsRequest {
            /**
             * If true 'reportHeapSnapshotProgress' events will be generated while snapshot is being taken
             * when the tracking is stopped.
             */
            reportProgress?: boolean;
            treatGlobalObjectsAsRoots?: boolean;
        }

        interface TakeHeapSnapshotRequest {
            /**
             * If true 'reportHeapSnapshotProgress' events will be generated while snapshot is being taken.
             */
            reportProgress?: boolean;
            /**
             * If true, a raw snapshot without artifical roots will be generated
             */
            treatGlobalObjectsAsRoots?: boolean;
        }

        interface AddHeapSnapshotChunkEvent {
            chunk: string;
        }

        /**
         * If heap objects tracking has been started then backend may send update for one or more fragments
         */
        interface HeapStatsUpdateEvent {
            /**
             * An array of triplets. Each triplet describes a fragment. The first integer is the fragment
             * index, the second integer is a total count of objects for the fragment, the third integer is
             * a total size of the objects for the fragment.
             */
            statsUpdate: integer[];
        }

        /**
         * If heap objects tracking has been started then backend regularly sends a current value for last
         * seen object id and corresponding timestamp. If the were changes in the heap since last event
         * then one or more heapStatsUpdate events will be sent before a new lastSeenObjectId event.
         */
        interface LastSeenObjectIdEvent {
            lastSeenObjectId: integer;
            timestamp: number;
        }

        interface ReportHeapSnapshotProgressEvent {
            done: integer;
            total: integer;
            finished?: boolean;
        }
    }

    namespace Profiler {

        /**
         * Profile node. Holds callsite information, execution statistics and child nodes.
         */
        interface ProfileNode {
            /**
             * Unique id of the node.
             */
            id: integer;
            /**
             * Function location.
             */
            callFrame: Runtime.CallFrame;
            /**
             * Number of samples where this node was on top of the call stack.
             */
            hitCount?: integer;
            /**
             * Child node ids.
             */
            children?: integer[];
            /**
             * The reason of being not optimized. The function may be deoptimized or marked as don't
             * optimize.
             */
            deoptReason?: string;
            /**
             * An array of source position ticks.
             */
            positionTicks?: PositionTickInfo[];
        }

        /**
         * Profile.
         */
        interface Profile {
            /**
             * The list of profile nodes. First item is the root node.
             */
            nodes: ProfileNode[];
            /**
             * Profiling start timestamp in microseconds.
             */
            startTime: number;
            /**
             * Profiling end timestamp in microseconds.
             */
            endTime: number;
            /**
             * Ids of samples top nodes.
             */
            samples?: integer[];
            /**
             * Time intervals between adjacent samples in microseconds. The first delta is relative to the
             * profile startTime.
             */
            timeDeltas?: integer[];
        }

        /**
         * Specifies a number of samples attributed to a certain source position.
         */
        interface PositionTickInfo {
            /**
             * Source line number (1-based).
             */
            line: integer;
            /**
             * Number of samples attributed to the source line.
             */
            ticks: integer;
        }

        /**
         * Coverage data for a source range.
         */
        interface CoverageRange {
            /**
             * JavaScript script source offset for the range start.
             */
            startOffset: integer;
            /**
             * JavaScript script source offset for the range end.
             */
            endOffset: integer;
            /**
             * Collected execution count of the source range.
             */
            count: integer;
        }

        /**
         * Coverage data for a JavaScript function.
         */
        interface FunctionCoverage {
            /**
             * JavaScript function name.
             */
            functionName: string;
            /**
             * Source ranges inside the function with coverage data.
             */
            ranges: CoverageRange[];
            /**
             * Whether coverage data for this function has block granularity.
             */
            isBlockCoverage: boolean;
        }

        /**
         * Coverage data for a JavaScript script.
         */
        interface ScriptCoverage {
            /**
             * JavaScript script id.
             */
            scriptId: Runtime.ScriptId;
            /**
             * JavaScript script name or url.
             */
            url: string;
            /**
             * Functions contained in the script that has coverage data.
             */
            functions: FunctionCoverage[];
        }

        /**
         * Describes a type collected during runtime.
         */
        interface TypeObject {
            /**
             * Name of a type collected with type profiling.
             */
            name: string;
        }

        /**
         * Source offset and types for a parameter or return value.
         */
        interface TypeProfileEntry {
            /**
             * Source offset of the parameter or end of function for return values.
             */
            offset: integer;
            /**
             * The types for this parameter or return value.
             */
            types: TypeObject[];
        }

        /**
         * Type profile data collected during runtime for a JavaScript script.
         */
        interface ScriptTypeProfile {
            /**
             * JavaScript script id.
             */
            scriptId: Runtime.ScriptId;
            /**
             * JavaScript script name or url.
             */
            url: string;
            /**
             * Type profile entries for parameters and return values of the functions in the script.
             */
            entries: TypeProfileEntry[];
        }

        /**
         * Collected counter information.
         */
        interface CounterInfo {
            /**
             * Counter name.
             */
            name: string;
            /**
             * Counter value.
             */
            value: integer;
        }

        /**
         * Runtime call counter information.
         */
        interface RuntimeCallCounterInfo {
            /**
             * Counter name.
             */
            name: string;
            /**
             * Counter value.
             */
            value: number;
            /**
             * Counter time in seconds.
             */
            time: number;
        }

        interface GetBestEffortCoverageResponse {
            /**
             * Coverage data for the current isolate.
             */
            result: ScriptCoverage[];
        }

        interface SetSamplingIntervalRequest {
            /**
             * New sampling interval in microseconds.
             */
            interval: integer;
        }

        interface StartPreciseCoverageRequest {
            /**
             * Collect accurate call counts beyond simple 'covered' or 'not covered'.
             */
            callCount?: boolean;
            /**
             * Collect block-based coverage.
             */
            detailed?: boolean;
            /**
             * Allow the backend to send updates on its own initiative
             */
            allowTriggeredUpdates?: boolean;
        }

        interface StartPreciseCoverageResponse {
            /**
             * Monotonically increasing time (in seconds) when the coverage update was taken in the backend.
             */
            timestamp: number;
        }

        interface StopResponse {
            /**
             * Recorded profile.
             */
            profile: Profile;
        }

        interface TakePreciseCoverageResponse {
            /**
             * Coverage data for the current isolate.
             */
            result: ScriptCoverage[];
            /**
             * Monotonically increasing time (in seconds) when the coverage update was taken in the backend.
             */
            timestamp: number;
        }

        interface TakeTypeProfileResponse {
            /**
             * Type profile for all scripts since startTypeProfile() was turned on.
             */
            result: ScriptTypeProfile[];
        }

        interface GetCountersResponse {
            /**
             * Collected counters information.
             */
            result: CounterInfo[];
        }

        interface GetRuntimeCallStatsResponse {
            /**
             * Collected runtime call counter information.
             */
            result: RuntimeCallCounterInfo[];
        }

        interface ConsoleProfileFinishedEvent {
            id: string;
            /**
             * Location of console.profileEnd().
             */
            location: Debugger.Location;
            profile: Profile;
            /**
             * Profile title passed as an argument to console.profile().
             */
            title?: string;
        }

        /**
         * Sent when new profile recording is started using console.profile() call.
         */
        interface ConsoleProfileStartedEvent {
            id: string;
            /**
             * Location of console.profile().
             */
            location: Debugger.Location;
            /**
             * Profile title passed as an argument to console.profile().
             */
            title?: string;
        }

        /**
         * Reports coverage delta since the last poll (either from an event like this, or from
         * `takePreciseCoverage` for the current isolate. May only be sent if precise code
         * coverage has been started. This event can be trigged by the embedder to, for example,
         * trigger collection of coverage data immediatelly at a certain point in time.
         */
        interface PreciseCoverageDeltaUpdateEvent {
            /**
             * Monotonically increasing time (in seconds) when the coverage update was taken in the backend.
             */
            timestamp: number;
            /**
             * Identifier for distinguishing coverage events.
             */
            occassion: string;
            /**
             * Coverage data for the current isolate.
             */
            result: ScriptCoverage[];
        }
    }

    /**
     * Runtime domain exposes JavaScript runtime by means of remote evaluation and mirror objects.
     * Evaluation results are returned as mirror object that expose object type, string representation
     * and unique identifier that can be used for further object reference. Original objects are
     * maintained in memory unless they are either explicitly released or are released along with the
     * other objects in their object group.
     */
    namespace Runtime {

        /**
         * Unique script identifier.
         */
        type ScriptId = string;

        /**
         * Unique object identifier.
         */
        type RemoteObjectId = string;

        /**
         * Primitive value which cannot be JSON-stringified. Includes values `-0`, `NaN`, `Infinity`,
         * `-Infinity`, and bigint literals.
         */
        type UnserializableValue = string;

        const enum RemoteObjectType {
            Object = 'object',
            Function = 'function',
            Undefined = 'undefined',
            String = 'string',
            Number = 'number',
            Boolean = 'boolean',
            Symbol = 'symbol',
            Bigint = 'bigint',
            Wasm = 'wasm',
        }

        const enum RemoteObjectSubtype {
            Array = 'array',
            Null = 'null',
            Node = 'node',
            Regexp = 'regexp',
            Date = 'date',
            Map = 'map',
            Set = 'set',
            Weakmap = 'weakmap',
            Weakset = 'weakset',
            Iterator = 'iterator',
            Generator = 'generator',
            Error = 'error',
            Proxy = 'proxy',
            Promise = 'promise',
            Typedarray = 'typedarray',
            Arraybuffer = 'arraybuffer',
            Dataview = 'dataview',
            I32 = 'i32',
            I64 = 'i64',
            F32 = 'f32',
            F64 = 'f64',
            V128 = 'v128',
            Externref = 'externref',
        }

        /**
         * Mirror object referencing original JavaScript object.
         */
        interface RemoteObject {
            /**
             * Object type. (RemoteObjectType enum)
             */
            type: ('object' | 'function' | 'undefined' | 'string' | 'number' | 'boolean' | 'symbol' | 'bigint' | 'wasm');
            /**
             * Object subtype hint. Specified for `object` or `wasm` type values only. (RemoteObjectSubtype enum)
             */
            subtype?: ('array' | 'null' | 'node' | 'regexp' | 'date' | 'map' | 'set' | 'weakmap' | 'weakset' | 'iterator' | 'generator' | 'error' | 'proxy' | 'promise' | 'typedarray' | 'arraybuffer' | 'dataview' | 'i32' | 'i64' | 'f32' | 'f64' | 'v128' | 'externref');
            /**
             * Object class (constructor) name. Specified for `object` type values only.
             */
            className?: string;
            /**
             * Remote object value in case of primitive values or JSON values (if it was requested).
             */
            value?: any;
            /**
             * Primitive value which can not be JSON-stringified does not have `value`, but gets this
             * property.
             */
            unserializableValue?: UnserializableValue;
            /**
             * String representation of the object.
             */
            description?: string;
            /**
             * Unique object identifier (for non-primitive values).
             */
            objectId?: RemoteObjectId;
            /**
             * Preview containing abbreviated property values. Specified for `object` type values only.
             */
            preview?: ObjectPreview;
            customPreview?: CustomPreview;
        }

        interface CustomPreview {
            /**
             * The JSON-stringified result of formatter.header(object, config) call.
             * It contains json ML array that represents RemoteObject.
             */
            header: string;
            /**
             * If formatter returns true as a result of formatter.hasBody call then bodyGetterId will
             * contain RemoteObjectId for the function that returns result of formatter.body(object, config) call.
             * The result value is json ML array.
             */
            bodyGetterId?: RemoteObjectId;
        }

        const enum ObjectPreviewType {
            Object = 'object',
            Function = 'function',
            Undefined = 'undefined',
            String = 'string',
            Number = 'number',
            Boolean = 'boolean',
            Symbol = 'symbol',
            Bigint = 'bigint',
        }

        const enum ObjectPreviewSubtype {
            Array = 'array',
            Null = 'null',
            Node = 'node',
            Regexp = 'regexp',
            Date = 'date',
            Map = 'map',
            Set = 'set',
            Weakmap = 'weakmap',
            Weakset = 'weakset',
            Iterator = 'iterator',
            Generator = 'generator',
            Error = 'error',
        }

        /**
         * Object containing abbreviated remote object value.
         */
        interface ObjectPreview {
            /**
             * Object type. (ObjectPreviewType enum)
             */
            type: ('object' | 'function' | 'undefined' | 'string' | 'number' | 'boolean' | 'symbol' | 'bigint');
            /**
             * Object subtype hint. Specified for `object` type values only. (ObjectPreviewSubtype enum)
             */
            subtype?: ('array' | 'null' | 'node' | 'regexp' | 'date' | 'map' | 'set' | 'weakmap' | 'weakset' | 'iterator' | 'generator' | 'error');
            /**
             * String representation of the object.
             */
            description?: string;
            /**
             * True iff some of the properties or entries of the original object did not fit.
             */
            overflow: boolean;
            /**
             * List of the properties.
             */
            properties: PropertyPreview[];
            /**
             * List of the entries. Specified for `map` and `set` subtype values only.
             */
            entries?: EntryPreview[];
        }

        const enum PropertyPreviewType {
            Object = 'object',
            Function = 'function',
            Undefined = 'undefined',
            String = 'string',
            Number = 'number',
            Boolean = 'boolean',
            Symbol = 'symbol',
            Accessor = 'accessor',
            Bigint = 'bigint',
        }

        const enum PropertyPreviewSubtype {
            Array = 'array',
            Null = 'null',
            Node = 'node',
            Regexp = 'regexp',
            Date = 'date',
            Map = 'map',
            Set = 'set',
            Weakmap = 'weakmap',
            Weakset = 'weakset',
            Iterator = 'iterator',
            Generator = 'generator',
            Error = 'error',
        }

        interface PropertyPreview {
            /**
             * Property name.
             */
            name: string;
            /**
             * Object type. Accessor means that the property itself is an accessor property. (PropertyPreviewType enum)
             */
            type: ('object' | 'function' | 'undefined' | 'string' | 'number' | 'boolean' | 'symbol' | 'accessor' | 'bigint');
            /**
             * User-friendly property value string.
             */
            value?: string;
            /**
             * Nested value preview.
             */
            valuePreview?: ObjectPreview;
            /**
             * Object subtype hint. Specified for `object` type values only. (PropertyPreviewSubtype enum)
             */
            subtype?: ('array' | 'null' | 'node' | 'regexp' | 'date' | 'map' | 'set' | 'weakmap' | 'weakset' | 'iterator' | 'generator' | 'error');
        }

        interface EntryPreview {
            /**
             * Preview of the key. Specified for map-like collection entries.
             */
            key?: ObjectPreview;
            /**
             * Preview of the value.
             */
            value: ObjectPreview;
        }

        /**
         * Object property descriptor.
         */
        interface PropertyDescriptor {
            /**
             * Property name or symbol description.
             */
            name: string;
            /**
             * The value associated with the property.
             */
            value?: RemoteObject;
            /**
             * True if the value associated with the property may be changed (data descriptors only).
             */
            writable?: boolean;
            /**
             * A function which serves as a getter for the property, or `undefined` if there is no getter
             * (accessor descriptors only).
             */
            get?: RemoteObject;
            /**
             * A function which serves as a setter for the property, or `undefined` if there is no setter
             * (accessor descriptors only).
             */
            set?: RemoteObject;
            /**
             * True if the type of this property descriptor may be changed and if the property may be
             * deleted from the corresponding object.
             */
            configurable: boolean;
            /**
             * True if this property shows up during enumeration of the properties on the corresponding
             * object.
             */
            enumerable: boolean;
            /**
             * True if the result was thrown during the evaluation.
             */
            wasThrown?: boolean;
            /**
             * True if the property is owned for the object.
             */
            isOwn?: boolean;
            /**
             * Property symbol object, if the property is of the `symbol` type.
             */
            symbol?: RemoteObject;
        }

        /**
         * Object internal property descriptor. This property isn't normally visible in JavaScript code.
         */
        interface InternalPropertyDescriptor {
            /**
             * Conventional property name.
             */
            name: string;
            /**
             * The value associated with the property.
             */
            value?: RemoteObject;
        }

        /**
         * Object private field descriptor.
         */
        interface PrivatePropertyDescriptor {
            /**
             * Private property name.
             */
            name: string;
            /**
             * The value associated with the private property.
             */
            value?: RemoteObject;
            /**
             * A function which serves as a getter for the private property,
             * or `undefined` if there is no getter (accessor descriptors only).
             */
            get?: RemoteObject;
            /**
             * A function which serves as a setter for the private property,
             * or `undefined` if there is no setter (accessor descriptors only).
             */
            set?: RemoteObject;
        }

        /**
         * Represents function call argument. Either remote object id `objectId`, primitive `value`,
         * unserializable primitive value or neither of (for undefined) them should be specified.
         */
        interface CallArgument {
            /**
             * Primitive value or serializable javascript object.
             */
            value?: any;
            /**
             * Primitive value which can not be JSON-stringified.
             */
            unserializableValue?: UnserializableValue;
            /**
             * Remote object handle.
             */
            objectId?: RemoteObjectId;
        }

        /**
         * Id of an execution context.
         */
        type ExecutionContextId = integer;

        /**
         * Description of an isolated world.
         */
        interface ExecutionContextDescription {
            /**
             * Unique id of the execution context. It can be used to specify in which execution context
             * script evaluation should be performed.
             */
            id: ExecutionContextId;
            /**
             * Execution context origin.
             */
            origin: string;
            /**
             * Human readable name describing given context.
             */
            name: string;
            /**
             * Embedder-specific auxiliary data.
             */
            auxData?: any;
        }

        /**
         * Detailed information about exception (or error) that was thrown during script compilation or
         * execution.
         */
        interface ExceptionDetails {
            /**
             * Exception id.
             */
            exceptionId: integer;
            /**
             * Exception text, which should be used together with exception object when available.
             */
            text: string;
            /**
             * Line number of the exception location (0-based).
             */
            lineNumber: integer;
            /**
             * Column number of the exception location (0-based).
             */
            columnNumber: integer;
            /**
             * Script ID of the exception location.
             */
            scriptId?: ScriptId;
            /**
             * URL of the exception location, to be used when the script was not reported.
             */
            url?: string;
            /**
             * JavaScript stack trace if available.
             */
            stackTrace?: StackTrace;
            /**
             * Exception object if available.
             */
            exception?: RemoteObject;
            /**
             * Identifier of the context where exception happened.
             */
            executionContextId?: ExecutionContextId;
        }

        /**
         * Number of milliseconds since epoch.
         */
        type Timestamp = number;

        /**
         * Number of milliseconds.
         */
        type TimeDelta = number;

        /**
         * Stack entry for runtime errors and assertions.
         */
        interface CallFrame {
            /**
             * JavaScript function name.
             */
            functionName: string;
            /**
             * JavaScript script id.
             */
            scriptId: ScriptId;
            /**
             * JavaScript script name or url.
             */
            url: string;
            /**
             * JavaScript script line number (0-based).
             */
            lineNumber: integer;
            /**
             * JavaScript script column number (0-based).
             */
            columnNumber: integer;
        }

        /**
         * Call frames for assertions or error messages.
         */
        interface StackTrace {
            /**
             * String label of this stack trace. For async traces this may be a name of the function that
             * initiated the async call.
             */
            description?: string;
            /**
             * JavaScript function name.
             */
            callFrames: CallFrame[];
            /**
             * Asynchronous JavaScript stack trace that preceded this stack, if available.
             */
            parent?: StackTrace;
            /**
             * Asynchronous JavaScript stack trace that preceded this stack, if available.
             */
            parentId?: StackTraceId;
        }

        /**
         * Unique identifier of current debugger.
         */
        type UniqueDebuggerId = string;

        /**
         * If `debuggerId` is set stack trace comes from another debugger and can be resolved there. This
         * allows to track cross-debugger calls. See `Runtime.StackTrace` and `Debugger.paused` for usages.
         */
        interface StackTraceId {
            id: string;
            debuggerId?: UniqueDebuggerId;
        }

        interface AwaitPromiseRequest {
            /**
             * Identifier of the promise.
             */
            promiseObjectId: RemoteObjectId;
            /**
             * Whether the result is expected to be a JSON object that should be sent by value.
             */
            returnByValue?: boolean;
            /**
             * Whether preview should be generated for the result.
             */
            generatePreview?: boolean;
        }

        interface AwaitPromiseResponse {
            /**
             * Promise result. Will contain rejected value if promise was rejected.
             */
            result: RemoteObject;
            /**
             * Exception details if stack strace is available.
             */
            exceptionDetails?: ExceptionDetails;
        }

        interface CallFunctionOnRequest {
            /**
             * Declaration of the function to call.
             */
            functionDeclaration: string;
            /**
             * Identifier of the object to call function on. Either objectId or executionContextId should
             * be specified.
             */
            objectId?: RemoteObjectId;
            /**
             * Call arguments. All call arguments must belong to the same JavaScript world as the target
             * object.
             */
            arguments?: CallArgument[];
            /**
             * In silent mode exceptions thrown during evaluation are not reported and do not pause
             * execution. Overrides `setPauseOnException` state.
             */
            silent?: boolean;
            /**
             * Whether the result is expected to be a JSON object which should be sent by value.
             */
            returnByValue?: boolean;
            /**
             * Whether preview should be generated for the result.
             */
            generatePreview?: boolean;
            /**
             * Whether execution should be treated as initiated by user in the UI.
             */
            userGesture?: boolean;
            /**
             * Whether execution should `await` for resulting value and return once awaited promise is
             * resolved.
             */
            awaitPromise?: boolean;
            /**
             * Specifies execution context which global object will be used to call function on. Either
             * executionContextId or objectId should be specified.
             */
            executionContextId?: ExecutionContextId;
            /**
             * Symbolic group name that can be used to release multiple objects. If objectGroup is not
             * specified and objectId is, objectGroup will be inherited from object.
             */
            objectGroup?: string;
        }

        interface CallFunctionOnResponse {
            /**
             * Call result.
             */
            result: RemoteObject;
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails;
        }

        interface CompileScriptRequest {
            /**
             * Expression to compile.
             */
            expression: string;
            /**
             * Source url to be set for the script.
             */
            sourceURL: string;
            /**
             * Specifies whether the compiled script should be persisted.
             */
            persistScript: boolean;
            /**
             * Specifies in which execution context to perform script run. If the parameter is omitted the
             * evaluation will be performed in the context of the inspected page.
             */
            executionContextId?: ExecutionContextId;
        }

        interface CompileScriptResponse {
            /**
             * Id of the script.
             */
            scriptId?: ScriptId;
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails;
        }

        interface EvaluateRequest {
            /**
             * Expression to evaluate.
             */
            expression: string;
            /**
             * Symbolic group name that can be used to release multiple objects.
             */
            objectGroup?: string;
            /**
             * Determines whether Command Line API should be available during the evaluation.
             */
            includeCommandLineAPI?: boolean;
            /**
             * In silent mode exceptions thrown during evaluation are not reported and do not pause
             * execution. Overrides `setPauseOnException` state.
             */
            silent?: boolean;
            /**
             * Specifies in which execution context to perform evaluation. If the parameter is omitted the
             * evaluation will be performed in the context of the inspected page.
             */
            contextId?: ExecutionContextId;
            /**
             * Whether the result is expected to be a JSON object that should be sent by value.
             */
            returnByValue?: boolean;
            /**
             * Whether preview should be generated for the result.
             */
            generatePreview?: boolean;
            /**
             * Whether execution should be treated as initiated by user in the UI.
             */
            userGesture?: boolean;
            /**
             * Whether execution should `await` for resulting value and return once awaited promise is
             * resolved.
             */
            awaitPromise?: boolean;
            /**
             * Whether to throw an exception if side effect cannot be ruled out during evaluation.
             * This implies `disableBreaks` below.
             */
            throwOnSideEffect?: boolean;
            /**
             * Terminate execution after timing out (number of milliseconds).
             */
            timeout?: TimeDelta;
            /**
             * Disable breakpoints during execution.
             */
            disableBreaks?: boolean;
            /**
             * Setting this flag to true enables `let` re-declaration and top-level `await`.
             * Note that `let` variables can only be re-declared if they originate from
             * `replMode` themselves.
             */
            replMode?: boolean;
            /**
             * The Content Security Policy (CSP) for the target might block 'unsafe-eval'
             * which includes eval(), Function(), setTimeout() and setInterval()
             * when called with non-callable arguments. This flag bypasses CSP for this
             * evaluation and allows unsafe-eval. Defaults to true.
             */
            allowUnsafeEvalBlockedByCSP?: boolean;
        }

        interface EvaluateResponse {
            /**
             * Evaluation result.
             */
            result: RemoteObject;
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails;
        }

        interface GetIsolateIdResponse {
            /**
             * The isolate id.
             */
            id: string;
        }

        interface GetHeapUsageResponse {
            /**
             * Used heap size in bytes.
             */
            usedSize: number;
            /**
             * Allocated heap size in bytes.
             */
            totalSize: number;
        }

        interface GetPropertiesRequest {
            /**
             * Identifier of the object to return properties for.
             */
            objectId: RemoteObjectId;
            /**
             * If true, returns properties belonging only to the element itself, not to its prototype
             * chain.
             */
            ownProperties?: boolean;
            /**
             * If true, returns accessor properties (with getter/setter) only; internal properties are not
             * returned either.
             */
            accessorPropertiesOnly?: boolean;
            /**
             * Whether preview should be generated for the results.
             */
            generatePreview?: boolean;
        }

        interface GetPropertiesResponse {
            /**
             * Object properties.
             */
            result: PropertyDescriptor[];
            /**
             * Internal object properties (only of the element itself).
             */
            internalProperties?: InternalPropertyDescriptor[];
            /**
             * Object private properties.
             */
            privateProperties?: PrivatePropertyDescriptor[];
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails;
        }

        interface GlobalLexicalScopeNamesRequest {
            /**
             * Specifies in which execution context to lookup global scope variables.
             */
            executionContextId?: ExecutionContextId;
        }

        interface GlobalLexicalScopeNamesResponse {
            names: string[];
        }

        interface QueryObjectsRequest {
            /**
             * Identifier of the prototype to return objects for.
             */
            prototypeObjectId: RemoteObjectId;
            /**
             * Symbolic group name that can be used to release the results.
             */
            objectGroup?: string;
        }

        interface QueryObjectsResponse {
            /**
             * Array with objects.
             */
            objects: RemoteObject;
        }

        interface ReleaseObjectRequest {
            /**
             * Identifier of the object to release.
             */
            objectId: RemoteObjectId;
        }

        interface ReleaseObjectGroupRequest {
            /**
             * Symbolic object group name.
             */
            objectGroup: string;
        }

        interface RunScriptRequest {
            /**
             * Id of the script to run.
             */
            scriptId: ScriptId;
            /**
             * Specifies in which execution context to perform script run. If the parameter is omitted the
             * evaluation will be performed in the context of the inspected page.
             */
            executionContextId?: ExecutionContextId;
            /**
             * Symbolic group name that can be used to release multiple objects.
             */
            objectGroup?: string;
            /**
             * In silent mode exceptions thrown during evaluation are not reported and do not pause
             * execution. Overrides `setPauseOnException` state.
             */
            silent?: boolean;
            /**
             * Determines whether Command Line API should be available during the evaluation.
             */
            includeCommandLineAPI?: boolean;
            /**
             * Whether the result is expected to be a JSON object which should be sent by value.
             */
            returnByValue?: boolean;
            /**
             * Whether preview should be generated for the result.
             */
            generatePreview?: boolean;
            /**
             * Whether execution should `await` for resulting value and return once awaited promise is
             * resolved.
             */
            awaitPromise?: boolean;
        }

        interface RunScriptResponse {
            /**
             * Run result.
             */
            result: RemoteObject;
            /**
             * Exception details.
             */
            exceptionDetails?: ExceptionDetails;
        }

        interface SetAsyncCallStackDepthRequest {
            /**
             * Maximum depth of async call stacks. Setting to `0` will effectively disable collecting async
             * call stacks (default).
             */
            maxDepth: integer;
        }

        interface SetCustomObjectFormatterEnabledRequest {
            enabled: boolean;
        }

        interface SetMaxCallStackSizeToCaptureRequest {
            size: integer;
        }

        interface AddBindingRequest {
            name: string;
            executionContextId?: ExecutionContextId;
        }

        interface RemoveBindingRequest {
            name: string;
        }

        /**
         * Notification is issued every time when binding is called.
         */
        interface BindingCalledEvent {
            name: string;
            payload: string;
            /**
             * Identifier of the context where the call was made.
             */
            executionContextId: ExecutionContextId;
        }

        const enum ConsoleAPICalledEventType {
            Log = 'log',
            Debug = 'debug',
            Info = 'info',
            Error = 'error',
            Warning = 'warning',
            Dir = 'dir',
            DirXML = 'dirxml',
            Table = 'table',
            Trace = 'trace',
            Clear = 'clear',
            StartGroup = 'startGroup',
            StartGroupCollapsed = 'startGroupCollapsed',
            EndGroup = 'endGroup',
            Assert = 'assert',
            Profile = 'profile',
            ProfileEnd = 'profileEnd',
            Count = 'count',
            TimeEnd = 'timeEnd',
        }

        /**
         * Issued when console API was called.
         */
        interface ConsoleAPICalledEvent {
            /**
             * Type of the call. (ConsoleAPICalledEventType enum)
             */
            type: ('log' | 'debug' | 'info' | 'error' | 'warning' | 'dir' | 'dirxml' | 'table' | 'trace' | 'clear' | 'startGroup' | 'startGroupCollapsed' | 'endGroup' | 'assert' | 'profile' | 'profileEnd' | 'count' | 'timeEnd');
            /**
             * Call arguments.
             */
            args: RemoteObject[];
            /**
             * Identifier of the context where the call was made.
             */
            executionContextId: ExecutionContextId;
            /**
             * Call timestamp.
             */
            timestamp: Timestamp;
            /**
             * Stack trace captured when the call was made. The async stack chain is automatically reported for
             * the following call types: `assert`, `error`, `trace`, `warning`. For other types the async call
             * chain can be retrieved using `Debugger.getStackTrace` and `stackTrace.parentId` field.
             */
            stackTrace?: StackTrace;
            /**
             * Console context descriptor for calls on non-default console context (not console.*):
             * 'anonymous#unique-logger-id' for call on unnamed context, 'name#unique-logger-id' for call
             * on named context.
             */
            context?: string;
        }

        /**
         * Issued when unhandled exception was revoked.
         */
        interface ExceptionRevokedEvent {
            /**
             * Reason describing why exception was revoked.
             */
            reason: string;
            /**
             * The id of revoked exception, as reported in `exceptionThrown`.
             */
            exceptionId: integer;
        }

        /**
         * Issued when exception was thrown and unhandled.
         */
        interface ExceptionThrownEvent {
            /**
             * Timestamp of the exception.
             */
            timestamp: Timestamp;
            exceptionDetails: ExceptionDetails;
        }

        /**
         * Issued when new execution context is created.
         */
        interface ExecutionContextCreatedEvent {
            /**
             * A newly created execution context.
             */
            context: ExecutionContextDescription;
        }

        /**
         * Issued when execution context is destroyed.
         */
        interface ExecutionContextDestroyedEvent {
            /**
             * Id of the destroyed context
             */
            executionContextId: ExecutionContextId;
        }

        /**
         * Issued when object should be inspected (for example, as a result of inspect() command line API
         * call).
         */
        interface InspectRequestedEvent {
            object: RemoteObject;
            hints: any;
        }
    }

    /**
     * This domain is deprecated.
     */
    namespace Schema {

        /**
         * Description of the protocol domain.
         */
        interface Domain {
            /**
             * Domain name.
             */
            name: string;
            /**
             * Domain version.
             */
            version: string;
        }

        interface GetDomainsResponse {
            /**
             * List of supported domains.
             */
            domains: Domain[];
        }
    }

    namespace Accessibility {

        /**
         * Unique accessibility node identifier.
         */
        type AXNodeId = string;

        /**
         * Enum of possible property types.
         */
        type AXValueType = ('boolean' | 'tristate' | 'booleanOrUndefined' | 'idref' | 'idrefList' | 'integer' | 'node' | 'nodeList' | 'number' | 'string' | 'computedString' | 'token' | 'tokenList' | 'domRelation' | 'role' | 'internalRole' | 'valueUndefined');

        /**
         * Enum of possible property sources.
         */
        type AXValueSourceType = ('attribute' | 'implicit' | 'style' | 'contents' | 'placeholder' | 'relatedElement');

        /**
         * Enum of possible native property sources (as a subtype of a particular AXValueSourceType).
         */
        type AXValueNativeSourceType = ('figcaption' | 'label' | 'labelfor' | 'labelwrapped' | 'legend' | 'rubyannotation' | 'tablecaption' | 'title' | 'other');

        /**
         * A single source for a computed AX property.
         */
        interface AXValueSource {
            /**
             * What type of source this is.
             */
            type: AXValueSourceType;
            /**
             * The value of this property source.
             */
            value?: AXValue;
            /**
             * The name of the relevant attribute, if any.
             */
            attribute?: string;
            /**
             * The value of the relevant attribute, if any.
             */
            attributeValue?: AXValue;
            /**
             * Whether this source is superseded by a higher priority source.
             */
            superseded?: boolean;
            /**
             * The native markup source for this value, e.g. a <label> element.
             */
            nativeSource?: AXValueNativeSourceType;
            /**
             * The value, such as a node or node list, of the native source.
             */
            nativeSourceValue?: AXValue;
            /**
             * Whether the value for this property is invalid.
             */
            invalid?: boolean;
            /**
             * Reason for the value being invalid, if it is.
             */
            invalidReason?: string;
        }

        interface AXRelatedNode {
            /**
             * The BackendNodeId of the related DOM node.
             */
            backendDOMNodeId: DOM.BackendNodeId;
            /**
             * The IDRef value provided, if any.
             */
            idref?: string;
            /**
             * The text alternative of this node in the current context.
             */
            text?: string;
        }

        interface AXProperty {
            /**
             * The name of this property.
             */
            name: AXPropertyName;
            /**
             * The value of this property.
             */
            value: AXValue;
        }

        /**
         * A single computed AX property.
         */
        interface AXValue {
            /**
             * The type of this value.
             */
            type: AXValueType;
            /**
             * The computed value of this property.
             */
            value?: any;
            /**
             * One or more related nodes, if applicable.
             */
            relatedNodes?: AXRelatedNode[];
            /**
             * The sources which contributed to the computation of this property.
             */
            sources?: AXValueSource[];
        }

        /**
         * Values of AXProperty name:
         * - from 'busy' to 'roledescription': states which apply to every AX node
         * - from 'live' to 'root': attributes which apply to nodes in live regions
         * - from 'autocomplete' to 'valuetext': attributes which apply to widgets
         * - from 'checked' to 'selected': states which apply to widgets
         * - from 'activedescendant' to 'owns' - relationships between elements other than parent/child/sibling.
         */
        type AXPropertyName = ('busy' | 'disabled' | 'editable' | 'focusable' | 'focused' | 'hidden' | 'hiddenRoot' | 'invalid' | 'keyshortcuts' | 'settable' | 'roledescription' | 'live' | 'atomic' | 'relevant' | 'root' | 'autocomplete' | 'hasPopup' | 'level' | 'multiselectable' | 'orientation' | 'multiline' | 'readonly' | 'required' | 'valuemin' | 'valuemax' | 'valuetext' | 'checked' | 'expanded' | 'modal' | 'pressed' | 'selected' | 'activedescendant' | 'controls' | 'describedby' | 'details' | 'errormessage' | 'flowto' | 'labelledby' | 'owns');

        /**
         * A node in the accessibility tree.
         */
        interface AXNode {
            /**
             * Unique identifier for this node.
             */
            nodeId: AXNodeId;
            /**
             * Whether this node is ignored for accessibility
             */
            ignored: boolean;
            /**
             * Collection of reasons why this node is hidden.
             */
            ignoredReasons?: AXProperty[];
            /**
             * This `Node`'s role, whether explicit or implicit.
             */
            role?: AXValue;
            /**
             * The accessible name for this `Node`.
             */
            name?: AXValue;
            /**
             * The accessible description for this `Node`.
             */
            description?: AXValue;
            /**
             * The value for this `Node`.
             */
            value?: AXValue;
            /**
             * All other properties
             */
            properties?: AXProperty[];
            /**
             * IDs for each of this node's child nodes.
             */
            childIds?: AXNodeId[];
            /**
             * The backend ID for the associated DOM node, if any.
             */
            backendDOMNodeId?: DOM.BackendNodeId;
        }

        interface GetPartialAXTreeRequest {
            /**
             * Identifier of the node to get the partial accessibility tree for.
             */
            nodeId?: DOM.NodeId;
            /**
             * Identifier of the backend node to get the partial accessibility tree for.
             */
            backendNodeId?: DOM.BackendNodeId;
            /**
             * JavaScript object id of the node wrapper to get the partial accessibility tree for.
             */
            objectId?: Runtime.RemoteObjectId;
            /**
             * Whether to fetch this nodes ancestors, siblings and children. Defaults to true.
             */
            fetchRelatives?: boolean;
        }

        interface GetPartialAXTreeResponse {
            /**
             * The `Accessibility.AXNode` for this DOM node, if it exists, plus its ancestors, siblings and
             * children, if requested.
             */
            nodes: AXNode[];
        }

        interface GetFullAXTreeRequest {
            /**
             * The maximum depth at which descendants of the root node should be retrieved.
             * If omitted, the full tree is returned.
             */
            max_depth?: integer;
        }

        interface GetFullAXTreeResponse {
            nodes: AXNode[];
        }

        interface GetChildAXNodesRequest {
            id: AXNodeId;
        }

        interface GetChildAXNodesResponse {
            nodes: AXNode[];
        }

        interface QueryAXTreeRequest {
            /**
             * Identifier of the node for the root to query.
             */
            nodeId?: DOM.NodeId;
            /**
             * Identifier of the backend node for the root to query.
             */
            backendNodeId?: DOM.BackendNodeId;
            /**
             * JavaScript object id of the node wrapper for the root to query.
             */
            objectId?: Runtime.RemoteObjectId;
            /**
             * Find nodes with this computed name.
             */
            accessibleName?: string;
            /**
             * Find nodes with this computed role.
             */
            role?: string;
        }

        interface QueryAXTreeResponse {
            /**
             * A list of `Accessibility.AXNode` matching the specified attributes,
             * including nodes that are ignored for accessibility.
             */
            nodes: AXNode[];
        }
    }

    namespace Animation {

        const enum AnimationType {
            CSSTransition = 'CSSTransition',
            CSSAnimation = 'CSSAnimation',
            WebAnimation = 'WebAnimation',
        }

        /**
         * Animation instance.
         */
        interface Animation {
            /**
             * `Animation`'s id.
             */
            id: string;
            /**
             * `Animation`'s name.
             */
            name: string;
            /**
             * `Animation`'s internal paused state.
             */
            pausedState: boolean;
            /**
             * `Animation`'s play state.
             */
            playState: string;
            /**
             * `Animation`'s playback rate.
             */
            playbackRate: number;
            /**
             * `Animation`'s start time.
             */
            startTime: number;
            /**
             * `Animation`'s current time.
             */
            currentTime: number;
            /**
             * Animation type of `Animation`. (AnimationType enum)
             */
            type: ('CSSTransition' | 'CSSAnimation' | 'WebAnimation');
            /**
             * `Animation`'s source animation node.
             */
            source?: AnimationEffect;
            /**
             * A unique ID for `Animation` representing the sources that triggered this CSS
             * animation/transition.
             */
            cssId?: string;
        }

        /**
         * AnimationEffect instance
         */
        interface AnimationEffect {
            /**
             * `AnimationEffect`'s delay.
             */
            delay: number;
            /**
             * `AnimationEffect`'s end delay.
             */
            endDelay: number;
            /**
             * `AnimationEffect`'s iteration start.
             */
            iterationStart: number;
            /**
             * `AnimationEffect`'s iterations.
             */
            iterations: number;
            /**
             * `AnimationEffect`'s iteration duration.
             */
            duration: number;
            /**
             * `AnimationEffect`'s playback direction.
             */
            direction: string;
            /**
             * `AnimationEffect`'s fill mode.
             */
            fill: string;
            /**
             * `AnimationEffect`'s target node.
             */
            backendNodeId?: DOM.BackendNodeId;
            /**
             * `AnimationEffect`'s keyframes.
             */
            keyframesRule?: KeyframesRule;
            /**
             * `AnimationEffect`'s timing function.
             */
            easing: string;
        }

        /**
         * Keyframes Rule
         */
        interface KeyframesRule {
            /**
             * CSS keyframed animation's name.
             */
            name?: string;
            /**
             * List of animation keyframes.
             */
            keyframes: KeyframeStyle[];
        }

        /**
         * Keyframe Style
         */
        interface KeyframeStyle {
            /**
             * Keyframe's time offset.
             */
            offset: string;
            /**
             * `AnimationEffect`'s timing function.
             */
            easing: string;
        }

        interface GetCurrentTimeRequest {
            /**
             * Id of animation.
             */
            id: string;
        }

        interface GetCurrentTimeResponse {
            /**
             * Current time of the page.
             */
            currentTime: number;
        }

        interface GetPlaybackRateResponse {
            /**
             * Playback rate for animations on page.
             */
            playbackRate: number;
        }

        interface ReleaseAnimationsRequest {
            /**
             * List of animation ids to seek.
             */
            animations: string[];
        }

        interface ResolveAnimationRequest {
            /**
             * Animation id.
             */
            animationId: string;
        }

        interface ResolveAnimationResponse {
            /**
             * Corresponding remote object.
             */
            remoteObject: Runtime.RemoteObject;
        }

        interface SeekAnimationsRequest {
            /**
             * List of animation ids to seek.
             */
            animations: string[];
            /**
             * Set the current time of each animation.
             */
            currentTime: number;
        }

        interface SetPausedRequest {
            /**
             * Animations to set the pause state of.
             */
            animations: string[];
            /**
             * Paused state to set to.
             */
            paused: boolean;
        }

        interface SetPlaybackRateRequest {
            /**
             * Playback rate for animations on page
             */
            playbackRate: number;
        }

        interface SetTimingRequest {
            /**
             * Animation id.
             */
            animationId: string;
            /**
             * Duration of the animation.
             */
            duration: number;
            /**
             * Delay of the animation.
             */
            delay: number;
        }

        /**
         * Event for when an animation has been cancelled.
         */
        interface AnimationCanceledEvent {
            /**
             * Id of the animation that was cancelled.
             */
            id: string;
        }

        /**
         * Event for each animation that has been created.
         */
        interface AnimationCreatedEvent {
            /**
             * Id of the animation that was created.
             */
            id: string;
        }

        /**
         * Event for animation that has been started.
         */
        interface AnimationStartedEvent {
            /**
             * Animation that was started.
             */
            animation: Animation;
        }
    }

    namespace ApplicationCache {

        /**
         * Detailed application cache resource information.
         */
        interface ApplicationCacheResource {
            /**
             * Resource url.
             */
            url: string;
            /**
             * Resource size.
             */
            size: integer;
            /**
             * Resource type.
             */
            type: string;
        }

        /**
         * Detailed application cache information.
         */
        interface ApplicationCache {
            /**
             * Manifest URL.
             */
            manifestURL: string;
            /**
             * Application cache size.
             */
            size: number;
            /**
             * Application cache creation time.
             */
            creationTime: number;
            /**
             * Application cache update time.
             */
            updateTime: number;
            /**
             * Application cache resources.
             */
            resources: ApplicationCacheResource[];
        }

        /**
         * Frame identifier - manifest URL pair.
         */
        interface FrameWithManifest {
            /**
             * Frame identifier.
             */
            frameId: Page.FrameId;
            /**
             * Manifest URL.
             */
            manifestURL: string;
            /**
             * Application cache status.
             */
            status: integer;
        }

        interface GetApplicationCacheForFrameRequest {
            /**
             * Identifier of the frame containing document whose application cache is retrieved.
             */
            frameId: Page.FrameId;
        }

        interface GetApplicationCacheForFrameResponse {
            /**
             * Relevant application cache data for the document in given frame.
             */
            applicationCache: ApplicationCache;
        }

        interface GetFramesWithManifestsResponse {
            /**
             * Array of frame identifiers with manifest urls for each frame containing a document
             * associated with some application cache.
             */
            frameIds: FrameWithManifest[];
        }

        interface GetManifestForFrameRequest {
            /**
             * Identifier of the frame containing document whose manifest is retrieved.
             */
            frameId: Page.FrameId;
        }

        interface GetManifestForFrameResponse {
            /**
             * Manifest URL for document in the given frame.
             */
            manifestURL: string;
        }

        interface ApplicationCacheStatusUpdatedEvent {
            /**
             * Identifier of the frame containing document whose application cache updated status.
             */
            frameId: Page.FrameId;
            /**
             * Manifest URL.
             */
            manifestURL: string;
            /**
             * Updated application cache status.
             */
            status: integer;
        }

        interface NetworkStateUpdatedEvent {
            isNowOnline: boolean;
        }
    }

    /**
     * Audits domain allows investigation of page violations and possible improvements.
     */
    namespace Audits {

        /**
         * Information about a cookie that is affected by an inspector issue.
         */
        interface AffectedCookie {
            /**
             * The following three properties uniquely identify a cookie
             */
            name: string;
            path: string;
            domain: string;
        }

        /**
         * Information about a request that is affected by an inspector issue.
         */
        interface AffectedRequest {
            /**
             * The unique request id.
             */
            requestId: Network.RequestId;
            url?: string;
        }

        /**
         * Information about the frame affected by an inspector issue.
         */
        interface AffectedFrame {
            frameId: Page.FrameId;
        }

        type SameSiteCookieExclusionReason = ('ExcludeSameSiteUnspecifiedTreatedAsLax' | 'ExcludeSameSiteNoneInsecure' | 'ExcludeSameSiteLax' | 'ExcludeSameSiteStrict');

        type SameSiteCookieWarningReason = ('WarnSameSiteUnspecifiedCrossSiteContext' | 'WarnSameSiteNoneInsecure' | 'WarnSameSiteUnspecifiedLaxAllowUnsafe' | 'WarnSameSiteStrictLaxDowngradeStrict' | 'WarnSameSiteStrictCrossDowngradeStrict' | 'WarnSameSiteStrictCrossDowngradeLax' | 'WarnSameSiteLaxCrossDowngradeStrict' | 'WarnSameSiteLaxCrossDowngradeLax');

        type SameSiteCookieOperation = ('SetCookie' | 'ReadCookie');

        /**
         * This information is currently necessary, as the front-end has a difficult
         * time finding a specific cookie. With this, we can convey specific error
         * information without the cookie.
         */
        interface SameSiteCookieIssueDetails {
            cookie: AffectedCookie;
            cookieWarningReasons: SameSiteCookieWarningReason[];
            cookieExclusionReasons: SameSiteCookieExclusionReason[];
            /**
             * Optionally identifies the site-for-cookies and the cookie url, which
             * may be used by the front-end as additional context.
             */
            operation: SameSiteCookieOperation;
            siteForCookies?: string;
            cookieUrl?: string;
            request?: AffectedRequest;
        }

        type MixedContentResolutionStatus = ('MixedContentBlocked' | 'MixedContentAutomaticallyUpgraded' | 'MixedContentWarning');

        type MixedContentResourceType = ('Audio' | 'Beacon' | 'CSPReport' | 'Download' | 'EventSource' | 'Favicon' | 'Font' | 'Form' | 'Frame' | 'Image' | 'Import' | 'Manifest' | 'Ping' | 'PluginData' | 'PluginResource' | 'Prefetch' | 'Resource' | 'Script' | 'ServiceWorker' | 'SharedWorker' | 'Stylesheet' | 'Track' | 'Video' | 'Worker' | 'XMLHttpRequest' | 'XSLT');

        interface MixedContentIssueDetails {
            /**
             * The type of resource causing the mixed content issue (css, js, iframe,
             * form,...). Marked as optional because it is mapped to from
             * blink::mojom::RequestContextType, which will be replaced
             * by network::mojom::RequestDestination
             */
            resourceType?: MixedContentResourceType;
            /**
             * The way the mixed content issue is being resolved.
             */
            resolutionStatus: MixedContentResolutionStatus;
            /**
             * The unsafe http url causing the mixed content issue.
             */
            insecureURL: string;
            /**
             * The url responsible for the call to an unsafe url.
             */
            mainResourceURL: string;
            /**
             * The mixed content request.
             * Does not always exist (e.g. for unsafe form submission urls).
             */
            request?: AffectedRequest;
            /**
             * Optional because not every mixed content issue is necessarily linked to a frame.
             */
            frame?: AffectedFrame;
        }

        /**
         * Enum indicating the reason a response has been blocked. These reasons are
         * refinements of the net error BLOCKED_BY_RESPONSE.
         */
        type BlockedByResponseReason = ('CoepFrameResourceNeedsCoepHeader' | 'CoopSandboxedIFrameCannotNavigateToCoopPage' | 'CorpNotSameOrigin' | 'CorpNotSameOriginAfterDefaultedToSameOriginByCoep' | 'CorpNotSameSite');

        /**
         * Details for a request that has been blocked with the BLOCKED_BY_RESPONSE
         * code. Currently only used for COEP/COOP, but may be extended to include
         * some CSP errors in the future.
         */
        interface BlockedByResponseIssueDetails {
            request: AffectedRequest;
            parentFrame?: AffectedFrame;
            blockedFrame?: AffectedFrame;
            reason: BlockedByResponseReason;
        }

        type HeavyAdResolutionStatus = ('HeavyAdBlocked' | 'HeavyAdWarning');

        type HeavyAdReason = ('NetworkTotalLimit' | 'CpuTotalLimit' | 'CpuPeakLimit');

        interface HeavyAdIssueDetails {
            /**
             * The resolution status, either blocking the content or warning.
             */
            resolution: HeavyAdResolutionStatus;
            /**
             * The reason the ad was blocked, total network or cpu or peak cpu.
             */
            reason: HeavyAdReason;
            /**
             * The frame that was blocked.
             */
            frame: AffectedFrame;
        }

        type ContentSecurityPolicyViolationType = ('kInlineViolation' | 'kEvalViolation' | 'kURLViolation' | 'kTrustedTypesSinkViolation' | 'kTrustedTypesPolicyViolation');

        interface SourceCodeLocation {
            scriptId?: Runtime.ScriptId;
            url: string;
            lineNumber: integer;
            columnNumber: integer;
        }

        interface ContentSecurityPolicyIssueDetails {
            /**
             * The url not included in allowed sources.
             */
            blockedURL?: string;
            /**
             * Specific directive that is violated, causing the CSP issue.
             */
            violatedDirective: string;
            isReportOnly: boolean;
            contentSecurityPolicyViolationType: ContentSecurityPolicyViolationType;
            frameAncestor?: AffectedFrame;
            sourceCodeLocation?: SourceCodeLocation;
            violatingNodeId?: DOM.BackendNodeId;
        }

        type SharedArrayBufferIssueType = ('TransferIssue' | 'CreationIssue');

        /**
         * Details for a issue arising from an SAB being instantiated in, or
         * transfered to a context that is not cross-origin isolated.
         */
        interface SharedArrayBufferIssueDetails {
            sourceCodeLocation: SourceCodeLocation;
            isWarning: boolean;
            type: SharedArrayBufferIssueType;
        }

        type TwaQualityEnforcementViolationType = ('kHttpError' | 'kUnavailableOffline' | 'kDigitalAssetLinks');

        interface TrustedWebActivityIssueDetails {
            /**
             * The url that triggers the violation.
             */
            url: string;
            violationType: TwaQualityEnforcementViolationType;
            httpStatusCode?: integer;
            /**
             * The package name of the Trusted Web Activity client app. This field is
             * only used when violation type is kDigitalAssetLinks.
             */
            packageName?: string;
            /**
             * The signature of the Trusted Web Activity client app. This field is only
             * used when violation type is kDigitalAssetLinks.
             */
            signature?: string;
        }

        interface LowTextContrastIssueDetails {
            violatingNodeId: DOM.BackendNodeId;
            violatingNodeSelector: string;
            contrastRatio: number;
            thresholdAA: number;
            thresholdAAA: number;
            fontSize: string;
            fontWeight: string;
        }

        /**
         * Details for a CORS related issue, e.g. a warning or error related to
         * CORS RFC1918 enforcement.
         */
        interface CorsIssueDetails {
            corsErrorStatus: Network.CorsErrorStatus;
            isWarning: boolean;
            request: AffectedRequest;
            resourceIPAddressSpace?: Network.IPAddressSpace;
            clientSecurityState?: Network.ClientSecurityState;
        }

        /**
         * A unique identifier for the type of issue. Each type may use one of the
         * optional fields in InspectorIssueDetails to convey more specific
         * information about the kind of issue.
         */
        type InspectorIssueCode = ('SameSiteCookieIssue' | 'MixedContentIssue' | 'BlockedByResponseIssue' | 'HeavyAdIssue' | 'ContentSecurityPolicyIssue' | 'SharedArrayBufferIssue' | 'TrustedWebActivityIssue' | 'LowTextContrastIssue' | 'CorsIssue');

        /**
         * This struct holds a list of optional fields with additional information
         * specific to the kind of issue. When adding a new issue code, please also
         * add a new optional field to this type.
         */
        interface InspectorIssueDetails {
            sameSiteCookieIssueDetails?: SameSiteCookieIssueDetails;
            mixedContentIssueDetails?: MixedContentIssueDetails;
            blockedByResponseIssueDetails?: BlockedByResponseIssueDetails;
            heavyAdIssueDetails?: HeavyAdIssueDetails;
            contentSecurityPolicyIssueDetails?: ContentSecurityPolicyIssueDetails;
            sharedArrayBufferIssueDetails?: SharedArrayBufferIssueDetails;
            twaQualityEnforcementDetails?: TrustedWebActivityIssueDetails;
            lowTextContrastIssueDetails?: LowTextContrastIssueDetails;
            corsIssueDetails?: CorsIssueDetails;
        }

        /**
         * An inspector issue reported from the back-end.
         */
        interface InspectorIssue {
            code: InspectorIssueCode;
            details: InspectorIssueDetails;
        }

        const enum GetEncodedResponseRequestEncoding {
            Webp = 'webp',
            Jpeg = 'jpeg',
            Png = 'png',
        }

        interface GetEncodedResponseRequest {
            /**
             * Identifier of the network request to get content for.
             */
            requestId: Network.RequestId;
            /**
             * The encoding to use. (GetEncodedResponseRequestEncoding enum)
             */
            encoding: ('webp' | 'jpeg' | 'png');
            /**
             * The quality of the encoding (0-1). (defaults to 1)
             */
            quality?: number;
            /**
             * Whether to only return the size information (defaults to false).
             */
            sizeOnly?: boolean;
        }

        interface GetEncodedResponseResponse {
            /**
             * The encoded body as a base64 string. Omitted if sizeOnly is true. (Encoded as a base64 string when passed over JSON)
             */
            body?: string;
            /**
             * Size before re-encoding.
             */
            originalSize: integer;
            /**
             * Size after re-encoding.
             */
            encodedSize: integer;
        }

        interface IssueAddedEvent {
            issue: InspectorIssue;
        }
    }

    /**
     * Defines events for background web platform features.
     */
    namespace BackgroundService {

        /**
         * The Background Service that will be associated with the commands/events.
         * Every Background Service operates independently, but they share the same
         * API.
         */
        type ServiceName = ('backgroundFetch' | 'backgroundSync' | 'pushMessaging' | 'notifications' | 'paymentHandler' | 'periodicBackgroundSync');

        /**
         * A key-value pair for additional event information to pass along.
         */
        interface EventMetadata {
            key: string;
            value: string;
        }

        interface BackgroundServiceEvent {
            /**
             * Timestamp of the event (in seconds).
             */
            timestamp: Network.TimeSinceEpoch;
            /**
             * The origin this event belongs to.
             */
            origin: string;
            /**
             * The Service Worker ID that initiated the event.
             */
            serviceWorkerRegistrationId: ServiceWorker.RegistrationID;
            /**
             * The Background Service this event belongs to.
             */
            service: ServiceName;
            /**
             * A description of the event.
             */
            eventName: string;
            /**
             * An identifier that groups related events together.
             */
            instanceId: string;
            /**
             * A list of event-specific information.
             */
            eventMetadata: EventMetadata[];
        }

        interface StartObservingRequest {
            service: ServiceName;
        }

        interface StopObservingRequest {
            service: ServiceName;
        }

        interface SetRecordingRequest {
            shouldRecord: boolean;
            service: ServiceName;
        }

        interface ClearEventsRequest {
            service: ServiceName;
        }

        /**
         * Called when the recording state for the service has been updated.
         */
        interface RecordingStateChangedEvent {
            isRecording: boolean;
            service: ServiceName;
        }

        /**
         * Called with all existing backgroundServiceEvents when enabled, and all new
         * events afterwards if enabled and recording.
         */
        interface BackgroundServiceEventReceivedEvent {
            backgroundServiceEvent: BackgroundServiceEvent;
        }
    }

    /**
     * The Browser domain defines methods and events for browser managing.
     */
    namespace Browser {

        type BrowserContextID = string;

        type WindowID = integer;

        /**
         * The state of the browser window.
         */
        type WindowState = ('normal' | 'minimized' | 'maximized' | 'fullscreen');

        /**
         * Browser window bounds information
         */
        interface Bounds {
            /**
             * The offset from the left edge of the screen to the window in pixels.
             */
            left?: integer;
            /**
             * The offset from the top edge of the screen to the window in pixels.
             */
            top?: integer;
            /**
             * The window width in pixels.
             */
            width?: integer;
            /**
             * The window height in pixels.
             */
            height?: integer;
            /**
             * The window state. Default to normal.
             */
            windowState?: WindowState;
        }

        type PermissionType = ('accessibilityEvents' | 'audioCapture' | 'backgroundSync' | 'backgroundFetch' | 'clipboardReadWrite' | 'clipboardSanitizedWrite' | 'displayCapture' | 'durableStorage' | 'flash' | 'geolocation' | 'midi' | 'midiSysex' | 'nfc' | 'notifications' | 'paymentHandler' | 'periodicBackgroundSync' | 'protectedMediaIdentifier' | 'sensors' | 'videoCapture' | 'videoCapturePanTiltZoom' | 'idleDetection' | 'wakeLockScreen' | 'wakeLockSystem');

        type PermissionSetting = ('granted' | 'denied' | 'prompt');

        /**
         * Definition of PermissionDescriptor defined in the Permissions API:
         * https://w3c.github.io/permissions/#dictdef-permissiondescriptor.
         */
        interface PermissionDescriptor {
            /**
             * Name of permission.
             * See https://cs.chromium.org/chromium/src/third_party/blink/renderer/modules/permissions/permission_descriptor.idl for valid permission names.
             */
            name: string;
            /**
             * For "midi" permission, may also specify sysex control.
             */
            sysex?: boolean;
            /**
             * For "push" permission, may specify userVisibleOnly.
             * Note that userVisibleOnly = true is the only currently supported type.
             */
            userVisibleOnly?: boolean;
            /**
             * For "clipboard" permission, may specify allowWithoutSanitization.
             */
            allowWithoutSanitization?: boolean;
            /**
             * For "camera" permission, may specify panTiltZoom.
             */
            panTiltZoom?: boolean;
        }

        /**
         * Browser command ids used by executeBrowserCommand.
         */
        type BrowserCommandId = ('openTabSearch' | 'closeTabSearch');

        /**
         * Chrome histogram bucket.
         */
        interface Bucket {
            /**
             * Minimum value (inclusive).
             */
            low: integer;
            /**
             * Maximum value (exclusive).
             */
            high: integer;
            /**
             * Number of samples.
             */
            count: integer;
        }

        /**
         * Chrome histogram.
         */
        interface Histogram {
            /**
             * Name.
             */
            name: string;
            /**
             * Sum of sample values.
             */
            sum: integer;
            /**
             * Total number of samples.
             */
            count: integer;
            /**
             * Buckets.
             */
            buckets: Bucket[];
        }

        interface SetPermissionRequest {
            /**
             * Descriptor of permission to override.
             */
            permission: PermissionDescriptor;
            /**
             * Setting of the permission.
             */
            setting: PermissionSetting;
            /**
             * Origin the permission applies to, all origins if not specified.
             */
            origin?: string;
            /**
             * Context to override. When omitted, default browser context is used.
             */
            browserContextId?: BrowserContextID;
        }

        interface GrantPermissionsRequest {
            permissions: PermissionType[];
            /**
             * Origin the permission applies to, all origins if not specified.
             */
            origin?: string;
            /**
             * BrowserContext to override permissions. When omitted, default browser context is used.
             */
            browserContextId?: BrowserContextID;
        }

        interface ResetPermissionsRequest {
            /**
             * BrowserContext to reset permissions. When omitted, default browser context is used.
             */
            browserContextId?: BrowserContextID;
        }

        const enum SetDownloadBehaviorRequestBehavior {
            Deny = 'deny',
            Allow = 'allow',
            AllowAndName = 'allowAndName',
            Default = 'default',
        }

        interface SetDownloadBehaviorRequest {
            /**
             * Whether to allow all or deny all download requests, or use default Chrome behavior if
             * available (otherwise deny). |allowAndName| allows download and names files according to
             * their dowmload guids. (SetDownloadBehaviorRequestBehavior enum)
             */
            behavior: ('deny' | 'allow' | 'allowAndName' | 'default');
            /**
             * BrowserContext to set download behavior. When omitted, default browser context is used.
             */
            browserContextId?: BrowserContextID;
            /**
             * The default path to save downloaded files to. This is requred if behavior is set to 'allow'
             * or 'allowAndName'.
             */
            downloadPath?: string;
        }

        interface GetVersionResponse {
            /**
             * Protocol version.
             */
            protocolVersion: string;
            /**
             * Product name.
             */
            product: string;
            /**
             * Product revision.
             */
            revision: string;
            /**
             * User-Agent.
             */
            userAgent: string;
            /**
             * V8 version.
             */
            jsVersion: string;
        }

        interface GetBrowserCommandLineResponse {
            /**
             * Commandline parameters
             */
            arguments: string[];
        }

        interface GetHistogramsRequest {
            /**
             * Requested substring in name. Only histograms which have query as a
             * substring in their name are extracted. An empty or absent query returns
             * all histograms.
             */
            query?: string;
            /**
             * If true, retrieve delta since last call.
             */
            delta?: boolean;
        }

        interface GetHistogramsResponse {
            /**
             * Histograms.
             */
            histograms: Histogram[];
        }

        interface GetHistogramRequest {
            /**
             * Requested histogram name.
             */
            name: string;
            /**
             * If true, retrieve delta since last call.
             */
            delta?: boolean;
        }

        interface GetHistogramResponse {
            /**
             * Histogram.
             */
            histogram: Histogram;
        }

        interface GetWindowBoundsRequest {
            /**
             * Browser window id.
             */
            windowId: WindowID;
        }

        interface GetWindowBoundsResponse {
            /**
             * Bounds information of the window. When window state is 'minimized', the restored window
             * position and size are returned.
             */
            bounds: Bounds;
        }

        interface GetWindowForTargetRequest {
            /**
             * Devtools agent host id. If called as a part of the session, associated targetId is used.
             */
            targetId?: Target.TargetID;
        }

        interface GetWindowForTargetResponse {
            /**
             * Browser window id.
             */
            windowId: WindowID;
            /**
             * Bounds information of the window. When window state is 'minimized', the restored window
             * position and size are returned.
             */
            bounds: Bounds;
        }

        interface SetWindowBoundsRequest {
            /**
             * Browser window id.
             */
            windowId: WindowID;
            /**
             * New window bounds. The 'minimized', 'maximized' and 'fullscreen' states cannot be combined
             * with 'left', 'top', 'width' or 'height'. Leaves unspecified fields unchanged.
             */
            bounds: Bounds;
        }

        interface SetDockTileRequest {
            badgeLabel?: string;
            /**
             * Png encoded image. (Encoded as a base64 string when passed over JSON)
             */
            image?: string;
        }

        interface ExecuteBrowserCommandRequest {
            commandId: BrowserCommandId;
        }
    }

    /**
     * This domain exposes CSS read/write operations. All CSS objects (stylesheets, rules, and styles)
     * have an associated `id` used in subsequent operations on the related object. Each object type has
     * a specific `id` structure, and those are not interchangeable between objects of different kinds.
     * CSS objects can be loaded using the `get*ForNode()` calls (which accept a DOM node id). A client
     * can also keep track of stylesheets via the `styleSheetAdded`/`styleSheetRemoved` events and
     * subsequently load the required stylesheet contents using the `getStyleSheet[Text]()` methods.
     */
    namespace CSS {

        type StyleSheetId = string;

        /**
         * Stylesheet type: "injected" for stylesheets injected via extension, "user-agent" for user-agent
         * stylesheets, "inspector" for stylesheets created by the inspector (i.e. those holding the "via
         * inspector" rules), "regular" for regular stylesheets.
         */
        type StyleSheetOrigin = ('injected' | 'user-agent' | 'inspector' | 'regular');

        /**
         * CSS rule collection for a single pseudo style.
         */
        interface PseudoElementMatches {
            /**
             * Pseudo element type.
             */
            pseudoType: DOM.PseudoType;
            /**
             * Matches of CSS rules applicable to the pseudo style.
             */
            matches: RuleMatch[];
        }

        /**
         * Inherited CSS rule collection from ancestor node.
         */
        interface InheritedStyleEntry {
            /**
             * The ancestor node's inline style, if any, in the style inheritance chain.
             */
            inlineStyle?: CSSStyle;
            /**
             * Matches of CSS rules matching the ancestor node in the style inheritance chain.
             */
            matchedCSSRules: RuleMatch[];
        }

        /**
         * Match data for a CSS rule.
         */
        interface RuleMatch {
            /**
             * CSS rule in the match.
             */
            rule: CSSRule;
            /**
             * Matching selector indices in the rule's selectorList selectors (0-based).
             */
            matchingSelectors: integer[];
        }

        /**
         * Data for a simple selector (these are delimited by commas in a selector list).
         */
        interface Value {
            /**
             * Value text.
             */
            text: string;
            /**
             * Value range in the underlying resource (if available).
             */
            range?: SourceRange;
        }

        /**
         * Selector list data.
         */
        interface SelectorList {
            /**
             * Selectors in the list.
             */
            selectors: Value[];
            /**
             * Rule selector text.
             */
            text: string;
        }

        /**
         * CSS stylesheet metainformation.
         */
        interface CSSStyleSheetHeader {
            /**
             * The stylesheet identifier.
             */
            styleSheetId: StyleSheetId;
            /**
             * Owner frame identifier.
             */
            frameId: Page.FrameId;
            /**
             * Stylesheet resource URL.
             */
            sourceURL: string;
            /**
             * URL of source map associated with the stylesheet (if any).
             */
            sourceMapURL?: string;
            /**
             * Stylesheet origin.
             */
            origin: StyleSheetOrigin;
            /**
             * Stylesheet title.
             */
            title: string;
            /**
             * The backend id for the owner node of the stylesheet.
             */
            ownerNode?: DOM.BackendNodeId;
            /**
             * Denotes whether the stylesheet is disabled.
             */
            disabled: boolean;
            /**
             * Whether the sourceURL field value comes from the sourceURL comment.
             */
            hasSourceURL?: boolean;
            /**
             * Whether this stylesheet is created for STYLE tag by parser. This flag is not set for
             * document.written STYLE tags.
             */
            isInline: boolean;
            /**
             * Whether this stylesheet is mutable. Inline stylesheets become mutable
             * after they have been modified via CSSOM API.
             * <link> element's stylesheets become mutable only if DevTools modifies them.
             * Constructed stylesheets (new CSSStyleSheet()) are mutable immediately after creation.
             */
            isMutable: boolean;
            /**
             * Whether this stylesheet is a constructed stylesheet (created using new CSSStyleSheet()).
             */
            isConstructed: boolean;
            /**
             * Line offset of the stylesheet within the resource (zero based).
             */
            startLine: number;
            /**
             * Column offset of the stylesheet within the resource (zero based).
             */
            startColumn: number;
            /**
             * Size of the content (in characters).
             */
            length: number;
            /**
             * Line offset of the end of the stylesheet within the resource (zero based).
             */
            endLine: number;
            /**
             * Column offset of the end of the stylesheet within the resource (zero based).
             */
            endColumn: number;
        }

        /**
         * CSS rule representation.
         */
        interface CSSRule {
            /**
             * The css style sheet identifier (absent for user agent stylesheet and user-specified
             * stylesheet rules) this rule came from.
             */
            styleSheetId?: StyleSheetId;
            /**
             * Rule selector data.
             */
            selectorList: SelectorList;
            /**
             * Parent stylesheet's origin.
             */
            origin: StyleSheetOrigin;
            /**
             * Associated style declaration.
             */
            style: CSSStyle;
            /**
             * Media list array (for rules involving media queries). The array enumerates media queries
             * starting with the innermost one, going outwards.
             */
            media?: CSSMedia[];
        }

        /**
         * CSS coverage information.
         */
        interface RuleUsage {
            /**
             * The css style sheet identifier (absent for user agent stylesheet and user-specified
             * stylesheet rules) this rule came from.
             */
            styleSheetId: StyleSheetId;
            /**
             * Offset of the start of the rule (including selector) from the beginning of the stylesheet.
             */
            startOffset: number;
            /**
             * Offset of the end of the rule body from the beginning of the stylesheet.
             */
            endOffset: number;
            /**
             * Indicates whether the rule was actually used by some element in the page.
             */
            used: boolean;
        }

        /**
         * Text range within a resource. All numbers are zero-based.
         */
        interface SourceRange {
            /**
             * Start line of range.
             */
            startLine: integer;
            /**
             * Start column of range (inclusive).
             */
            startColumn: integer;
            /**
             * End line of range
             */
            endLine: integer;
            /**
             * End column of range (exclusive).
             */
            endColumn: integer;
        }

        interface ShorthandEntry {
            /**
             * Shorthand name.
             */
            name: string;
            /**
             * Shorthand value.
             */
            value: string;
            /**
             * Whether the property has "!important" annotation (implies `false` if absent).
             */
            important?: boolean;
        }

        interface CSSComputedStyleProperty {
            /**
             * Computed style property name.
             */
            name: string;
            /**
             * Computed style property value.
             */
            value: string;
        }

        /**
         * CSS style representation.
         */
        interface CSSStyle {
            /**
             * The css style sheet identifier (absent for user agent stylesheet and user-specified
             * stylesheet rules) this rule came from.
             */
            styleSheetId?: StyleSheetId;
            /**
             * CSS properties in the style.
             */
            cssProperties: CSSProperty[];
            /**
             * Computed values for all shorthands found in the style.
             */
            shorthandEntries: ShorthandEntry[];
            /**
             * Style declaration text (if available).
             */
            cssText?: string;
            /**
             * Style declaration range in the enclosing stylesheet (if available).
             */
            range?: SourceRange;
        }

        /**
         * CSS property declaration data.
         */
        interface CSSProperty {
            /**
             * The property name.
             */
            name: string;
            /**
             * The property value.
             */
            value: string;
            /**
             * Whether the property has "!important" annotation (implies `false` if absent).
             */
            important?: boolean;
            /**
             * Whether the property is implicit (implies `false` if absent).
             */
            implicit?: boolean;
            /**
             * The full property text as specified in the style.
             */
            text?: string;
            /**
             * Whether the property is understood by the browser (implies `true` if absent).
             */
            parsedOk?: boolean;
            /**
             * Whether the property is disabled by the user (present for source-based properties only).
             */
            disabled?: boolean;
            /**
             * The entire property range in the enclosing style declaration (if available).
             */
            range?: SourceRange;
        }

        const enum CSSMediaSource {
            MediaRule = 'mediaRule',
            ImportRule = 'importRule',
            LinkedSheet = 'linkedSheet',
            InlineSheet = 'inlineSheet',
        }

        /**
         * CSS media rule descriptor.
         */
        interface CSSMedia {
            /**
             * Media query text.
             */
            text: string;
            /**
             * Source of the media query: "mediaRule" if specified by a @media rule, "importRule" if
             * specified by an @import rule, "linkedSheet" if specified by a "media" attribute in a linked
             * stylesheet's LINK tag, "inlineSheet" if specified by a "media" attribute in an inline
             * stylesheet's STYLE tag. (CSSMediaSource enum)
             */
            source: ('mediaRule' | 'importRule' | 'linkedSheet' | 'inlineSheet');
            /**
             * URL of the document containing the media query description.
             */
            sourceURL?: string;
            /**
             * The associated rule (@media or @import) header range in the enclosing stylesheet (if
             * available).
             */
            range?: SourceRange;
            /**
             * Identifier of the stylesheet containing this object (if exists).
             */
            styleSheetId?: StyleSheetId;
            /**
             * Array of media queries.
             */
            mediaList?: MediaQuery[];
        }

        /**
         * Media query descriptor.
         */
        interface MediaQuery {
            /**
             * Array of media query expressions.
             */
            expressions: MediaQueryExpression[];
            /**
             * Whether the media query condition is satisfied.
             */
            active: boolean;
        }

        /**
         * Media query expression descriptor.
         */
        interface MediaQueryExpression {
            /**
             * Media query expression value.
             */
            value: number;
            /**
             * Media query expression units.
             */
            unit: string;
            /**
             * Media query expression feature.
             */
            feature: string;
            /**
             * The associated range of the value text in the enclosing stylesheet (if available).
             */
            valueRange?: SourceRange;
            /**
             * Computed length of media query expression (if applicable).
             */
            computedLength?: number;
        }

        /**
         * Information about amount of glyphs that were rendered with given font.
         */
        interface PlatformFontUsage {
            /**
             * Font's family name reported by platform.
             */
            familyName: string;
            /**
             * Indicates if the font was downloaded or resolved locally.
             */
            isCustomFont: boolean;
            /**
             * Amount of glyphs that were rendered with this font.
             */
            glyphCount: number;
        }

        /**
         * Information about font variation axes for variable fonts
         */
        interface FontVariationAxis {
            /**
             * The font-variation-setting tag (a.k.a. "axis tag").
             */
            tag: string;
            /**
             * Human-readable variation name in the default language (normally, "en").
             */
            name: string;
            /**
             * The minimum value (inclusive) the font supports for this tag.
             */
            minValue: number;
            /**
             * The maximum value (inclusive) the font supports for this tag.
             */
            maxValue: number;
            /**
             * The default value.
             */
            defaultValue: number;
        }

        /**
         * Properties of a web font: https://www.w3.org/TR/2008/REC-CSS2-20080411/fonts.html#font-descriptions
         * and additional information such as platformFontFamily and fontVariationAxes.
         */
        interface FontFace {
            /**
             * The font-family.
             */
            fontFamily: string;
            /**
             * The font-style.
             */
            fontStyle: string;
            /**
             * The font-variant.
             */
            fontVariant: string;
            /**
             * The font-weight.
             */
            fontWeight: string;
            /**
             * The font-stretch.
             */
            fontStretch: string;
            /**
             * The unicode-range.
             */
            unicodeRange: string;
            /**
             * The src.
             */
            src: string;
            /**
             * The resolved platform font family
             */
            platformFontFamily: string;
            /**
             * Available variation settings (a.k.a. "axes").
             */
            fontVariationAxes?: FontVariationAxis[];
        }

        /**
         * CSS keyframes rule representation.
         */
        interface CSSKeyframesRule {
            /**
             * Animation name.
             */
            animationName: Value;
            /**
             * List of keyframes.
             */
            keyframes: CSSKeyframeRule[];
        }

        /**
         * CSS keyframe rule representation.
         */
        interface CSSKeyframeRule {
            /**
             * The css style sheet identifier (absent for user agent stylesheet and user-specified
             * stylesheet rules) this rule came from.
             */
            styleSheetId?: StyleSheetId;
            /**
             * Parent stylesheet's origin.
             */
            origin: StyleSheetOrigin;
            /**
             * Associated key text.
             */
            keyText: Value;
            /**
             * Associated style declaration.
             */
            style: CSSStyle;
        }

        /**
         * A descriptor of operation to mutate style declaration text.
         */
        interface StyleDeclarationEdit {
            /**
             * The css style sheet identifier.
             */
            styleSheetId: StyleSheetId;
            /**
             * The range of the style text in the enclosing stylesheet.
             */
            range: SourceRange;
            /**
             * New style text.
             */
            text: string;
        }

        interface AddRuleRequest {
            /**
             * The css style sheet identifier where a new rule should be inserted.
             */
            styleSheetId: StyleSheetId;
            /**
             * The text of a new rule.
             */
            ruleText: string;
            /**
             * Text position of a new rule in the target style sheet.
             */
            location: SourceRange;
        }

        interface AddRuleResponse {
            /**
             * The newly created rule.
             */
            rule: CSSRule;
        }

        interface CollectClassNamesRequest {
            styleSheetId: StyleSheetId;
        }

        interface CollectClassNamesResponse {
            /**
             * Class name list.
             */
            classNames: string[];
        }

        interface CreateStyleSheetRequest {
            /**
             * Identifier of the frame where "via-inspector" stylesheet should be created.
             */
            frameId: Page.FrameId;
        }

        interface CreateStyleSheetResponse {
            /**
             * Identifier of the created "via-inspector" stylesheet.
             */
            styleSheetId: StyleSheetId;
        }

        interface ForcePseudoStateRequest {
            /**
             * The element id for which to force the pseudo state.
             */
            nodeId: DOM.NodeId;
            /**
             * Element pseudo classes to force when computing the element's style.
             */
            forcedPseudoClasses: string[];
        }

        interface GetBackgroundColorsRequest {
            /**
             * Id of the node to get background colors for.
             */
            nodeId: DOM.NodeId;
        }

        interface GetBackgroundColorsResponse {
            /**
             * The range of background colors behind this element, if it contains any visible text. If no
             * visible text is present, this will be undefined. In the case of a flat background color,
             * this will consist of simply that color. In the case of a gradient, this will consist of each
             * of the color stops. For anything more complicated, this will be an empty array. Images will
             * be ignored (as if the image had failed to load).
             */
            backgroundColors?: string[];
            /**
             * The computed font size for this node, as a CSS computed value string (e.g. '12px').
             */
            computedFontSize?: string;
            /**
             * The computed font weight for this node, as a CSS computed value string (e.g. 'normal' or
             * '100').
             */
            computedFontWeight?: string;
        }

        interface GetComputedStyleForNodeRequest {
            nodeId: DOM.NodeId;
        }

        interface GetComputedStyleForNodeResponse {
            /**
             * Computed style for the specified DOM node.
             */
            computedStyle: CSSComputedStyleProperty[];
        }

        interface GetInlineStylesForNodeRequest {
            nodeId: DOM.NodeId;
        }

        interface GetInlineStylesForNodeResponse {
            /**
             * Inline style for the specified DOM node.
             */
            inlineStyle?: CSSStyle;
            /**
             * Attribute-defined element style (e.g. resulting from "width=20 height=100%").
             */
            attributesStyle?: CSSStyle;
        }

        interface GetMatchedStylesForNodeRequest {
            nodeId: DOM.NodeId;
        }

        interface GetMatchedStylesForNodeResponse {
            /**
             * Inline style for the specified DOM node.
             */
            inlineStyle?: CSSStyle;
            /**
             * Attribute-defined element style (e.g. resulting from "width=20 height=100%").
             */
            attributesStyle?: CSSStyle;
            /**
             * CSS rules matching this node, from all applicable stylesheets.
             */
            matchedCSSRules?: RuleMatch[];
            /**
             * Pseudo style matches for this node.
             */
            pseudoElements?: PseudoElementMatches[];
            /**
             * A chain of inherited styles (from the immediate node parent up to the DOM tree root).
             */
            inherited?: InheritedStyleEntry[];
            /**
             * A list of CSS keyframed animations matching this node.
             */
            cssKeyframesRules?: CSSKeyframesRule[];
        }

        interface GetMediaQueriesResponse {
            medias: CSSMedia[];
        }

        interface GetPlatformFontsForNodeRequest {
            nodeId: DOM.NodeId;
        }

        interface GetPlatformFontsForNodeResponse {
            /**
             * Usage statistics for every employed platform font.
             */
            fonts: PlatformFontUsage[];
        }

        interface GetStyleSheetTextRequest {
            styleSheetId: StyleSheetId;
        }

        interface GetStyleSheetTextResponse {
            /**
             * The stylesheet text.
             */
            text: string;
        }

        interface TrackComputedStyleUpdatesRequest {
            propertiesToTrack: CSSComputedStyleProperty[];
        }

        interface TakeComputedStyleUpdatesResponse {
            /**
             * The list of node Ids that have their tracked computed styles updated
             */
            nodeIds: DOM.NodeId[];
        }

        interface SetEffectivePropertyValueForNodeRequest {
            /**
             * The element id for which to set property.
             */
            nodeId: DOM.NodeId;
            propertyName: string;
            value: string;
        }

        interface SetKeyframeKeyRequest {
            styleSheetId: StyleSheetId;
            range: SourceRange;
            keyText: string;
        }

        interface SetKeyframeKeyResponse {
            /**
             * The resulting key text after modification.
             */
            keyText: Value;
        }

        interface SetMediaTextRequest {
            styleSheetId: StyleSheetId;
            range: SourceRange;
            text: string;
        }

        interface SetMediaTextResponse {
            /**
             * The resulting CSS media rule after modification.
             */
            media: CSSMedia;
        }

        interface SetRuleSelectorRequest {
            styleSheetId: StyleSheetId;
            range: SourceRange;
            selector: string;
        }

        interface SetRuleSelectorResponse {
            /**
             * The resulting selector list after modification.
             */
            selectorList: SelectorList;
        }

        interface SetStyleSheetTextRequest {
            styleSheetId: StyleSheetId;
            text: string;
        }

        interface SetStyleSheetTextResponse {
            /**
             * URL of source map associated with script (if any).
             */
            sourceMapURL?: string;
        }

        interface SetStyleTextsRequest {
            edits: StyleDeclarationEdit[];
        }

        interface SetStyleTextsResponse {
            /**
             * The resulting styles after modification.
             */
            styles: CSSStyle[];
        }

        interface StopRuleUsageTrackingResponse {
            ruleUsage: RuleUsage[];
        }

        interface TakeCoverageDeltaResponse {
            coverage: RuleUsage[];
            /**
             * Monotonically increasing time, in seconds.
             */
            timestamp: number;
        }

        interface SetLocalFontsEnabledRequest {
            /**
             * Whether rendering of local fonts is enabled.
             */
            enabled: boolean;
        }

        /**
         * Fires whenever a web font is updated.  A non-empty font parameter indicates a successfully loaded
         * web font
         */
        interface FontsUpdatedEvent {
            /**
             * The web font that has loaded.
             */
            font?: FontFace;
        }

        /**
         * Fired whenever an active document stylesheet is added.
         */
        interface StyleSheetAddedEvent {
            /**
             * Added stylesheet metainfo.
             */
            header: CSSStyleSheetHeader;
        }

        /**
         * Fired whenever a stylesheet is changed as a result of the client operation.
         */
        interface StyleSheetChangedEvent {
            styleSheetId: StyleSheetId;
        }

        /**
         * Fired whenever an active document stylesheet is removed.
         */
        interface StyleSheetRemovedEvent {
            /**
             * Identifier of the removed stylesheet.
             */
            styleSheetId: StyleSheetId;
        }
    }

    namespace CacheStorage {

        /**
         * Unique identifier of the Cache object.
         */
        type CacheId = string;

        /**
         * type of HTTP response cached
         */
        type CachedResponseType = ('basic' | 'cors' | 'default' | 'error' | 'opaqueResponse' | 'opaqueRedirect');

        /**
         * Data entry.
         */
        interface DataEntry {
            /**
             * Request URL.
             */
            requestURL: string;
            /**
             * Request method.
             */
            requestMethod: string;
            /**
             * Request headers
             */
            requestHeaders: Header[];
            /**
             * Number of seconds since epoch.
             */
            responseTime: number;
            /**
             * HTTP response status code.
             */
            responseStatus: integer;
            /**
             * HTTP response status text.
             */
            responseStatusText: string;
            /**
             * HTTP response type
             */
            responseType: CachedResponseType;
            /**
             * Response headers
             */
            responseHeaders: Header[];
        }

        /**
         * Cache identifier.
         */
        interface Cache {
            /**
             * An opaque unique id of the cache.
             */
            cacheId: CacheId;
            /**
             * Security origin of the cache.
             */
            securityOrigin: string;
            /**
             * The name of the cache.
             */
            cacheName: string;
        }

        interface Header {
            name: string;
            value: string;
        }

        /**
         * Cached response
         */
        interface CachedResponse {
            /**
             * Entry content, base64-encoded. (Encoded as a base64 string when passed over JSON)
             */
            body: string;
        }

        interface DeleteCacheRequest {
            /**
             * Id of cache for deletion.
             */
            cacheId: CacheId;
        }

        interface DeleteEntryRequest {
            /**
             * Id of cache where the entry will be deleted.
             */
            cacheId: CacheId;
            /**
             * URL spec of the request.
             */
            request: string;
        }

        interface RequestCacheNamesRequest {
            /**
             * Security origin.
             */
            securityOrigin: string;
        }

        interface RequestCacheNamesResponse {
            /**
             * Caches for the security origin.
             */
            caches: Cache[];
        }

        interface RequestCachedResponseRequest {
            /**
             * Id of cache that contains the entry.
             */
            cacheId: CacheId;
            /**
             * URL spec of the request.
             */
            requestURL: string;
            /**
             * headers of the request.
             */
            requestHeaders: Header[];
        }

        interface RequestCachedResponseResponse {
            /**
             * Response read from the cache.
             */
            response: CachedResponse;
        }

        interface RequestEntriesRequest {
            /**
             * ID of cache to get entries from.
             */
            cacheId: CacheId;
            /**
             * Number of records to skip.
             */
            skipCount?: integer;
            /**
             * Number of records to fetch.
             */
            pageSize?: integer;
            /**
             * If present, only return the entries containing this substring in the path
             */
            pathFilter?: string;
        }

        interface RequestEntriesResponse {
            /**
             * Array of object store data entries.
             */
            cacheDataEntries: DataEntry[];
            /**
             * Count of returned entries from this storage. If pathFilter is empty, it
             * is the count of all entries from this storage.
             */
            returnCount: number;
        }
    }

    /**
     * A domain for interacting with Cast, Presentation API, and Remote Playback API
     * functionalities.
     */
    namespace Cast {

        interface Sink {
            name: string;
            id: string;
            /**
             * Text describing the current session. Present only if there is an active
             * session on the sink.
             */
            session?: string;
        }

        interface EnableRequest {
            presentationUrl?: string;
        }

        interface SetSinkToUseRequest {
            sinkName: string;
        }

        interface StartTabMirroringRequest {
            sinkName: string;
        }

        interface StopCastingRequest {
            sinkName: string;
        }

        /**
         * This is fired whenever the list of available sinks changes. A sink is a
         * device or a software surface that you can cast to.
         */
        interface SinksUpdatedEvent {
            sinks: Sink[];
        }

        /**
         * This is fired whenever the outstanding issue/error message changes.
         * |issueMessage| is empty if there is no issue.
         */
        interface IssueUpdatedEvent {
            issueMessage: string;
        }
    }

    /**
     * This domain exposes DOM read/write operations. Each DOM Node is represented with its mirror object
     * that has an `id`. This `id` can be used to get additional information on the Node, resolve it into
     * the JavaScript object wrapper, etc. It is important that client receives DOM events only for the
     * nodes that are known to the client. Backend keeps track of the nodes that were sent to the client
     * and never sends the same node twice. It is client's responsibility to collect information about
     * the nodes that were sent to the client.<p>Note that `iframe` owner elements will return
     * corresponding document elements as their child nodes.</p>
     */
    namespace DOM {

        /**
         * Unique DOM node identifier.
         */
        type NodeId = integer;

        /**
         * Unique DOM node identifier used to reference a node that may not have been pushed to the
         * front-end.
         */
        type BackendNodeId = integer;

        /**
         * Backend node with a friendly name.
         */
        interface BackendNode {
            /**
             * `Node`'s nodeType.
             */
            nodeType: integer;
            /**
             * `Node`'s nodeName.
             */
            nodeName: string;
            backendNodeId: BackendNodeId;
        }

        /**
         * Pseudo element type.
         */
        type PseudoType = ('first-line' | 'first-letter' | 'before' | 'after' | 'marker' | 'backdrop' | 'selection' | 'target-text' | 'spelling-error' | 'grammar-error' | 'first-line-inherited' | 'scrollbar' | 'scrollbar-thumb' | 'scrollbar-button' | 'scrollbar-track' | 'scrollbar-track-piece' | 'scrollbar-corner' | 'resizer' | 'input-list-button');

        /**
         * Shadow root type.
         */
        type ShadowRootType = ('user-agent' | 'open' | 'closed');

        /**
         * DOM interaction is implemented in terms of mirror objects that represent the actual DOM nodes.
         * DOMNode is a base node mirror type.
         */
        interface Node {
            /**
             * Node identifier that is passed into the rest of the DOM messages as the `nodeId`. Backend
             * will only push node with given `id` once. It is aware of all requested nodes and will only
             * fire DOM events for nodes known to the client.
             */
            nodeId: NodeId;
            /**
             * The id of the parent node if any.
             */
            parentId?: NodeId;
            /**
             * The BackendNodeId for this node.
             */
            backendNodeId: BackendNodeId;
            /**
             * `Node`'s nodeType.
             */
            nodeType: integer;
            /**
             * `Node`'s nodeName.
             */
            nodeName: string;
            /**
             * `Node`'s localName.
             */
            localName: string;
            /**
             * `Node`'s nodeValue.
             */
            nodeValue: string;
            /**
             * Child count for `Container` nodes.
             */
            childNodeCount?: integer;
            /**
             * Child nodes of this node when requested with children.
             */
            children?: Node[];
            /**
             * Attributes of the `Element` node in the form of flat array `[name1, value1, name2, value2]`.
             */
            attributes?: string[];
            /**
             * Document URL that `Document` or `FrameOwner` node points to.
             */
            documentURL?: string;
            /**
             * Base URL that `Document` or `FrameOwner` node uses for URL completion.
             */
            baseURL?: string;
            /**
             * `DocumentType`'s publicId.
             */
            publicId?: string;
            /**
             * `DocumentType`'s systemId.
             */
            systemId?: string;
            /**
             * `DocumentType`'s internalSubset.
             */
            internalSubset?: string;
            /**
             * `Document`'s XML version in case of XML documents.
             */
            xmlVersion?: string;
            /**
             * `Attr`'s name.
             */
            name?: string;
            /**
             * `Attr`'s value.
             */
            value?: string;
            /**
             * Pseudo element type for this node.
             */
            pseudoType?: PseudoType;
            /**
             * Shadow root type.
             */
            shadowRootType?: ShadowRootType;
            /**
             * Frame ID for frame owner elements.
             */
            frameId?: Page.FrameId;
            /**
             * Content document for frame owner elements.
             */
            contentDocument?: Node;
            /**
             * Shadow root list for given element host.
             */
            shadowRoots?: Node[];
            /**
             * Content document fragment for template elements.
             */
            templateContent?: Node;
            /**
             * Pseudo elements associated with this node.
             */
            pseudoElements?: Node[];
            /**
             * Import document for the HTMLImport links.
             */
            importedDocument?: Node;
            /**
             * Distributed nodes for given insertion point.
             */
            distributedNodes?: BackendNode[];
            /**
             * Whether the node is SVG.
             */
            isSVG?: boolean;
        }

        /**
         * A structure holding an RGBA color.
         */
        interface RGBA {
            /**
             * The red component, in the [0-255] range.
             */
            r: integer;
            /**
             * The green component, in the [0-255] range.
             */
            g: integer;
            /**
             * The blue component, in the [0-255] range.
             */
            b: integer;
            /**
             * The alpha component, in the [0-1] range (default: 1).
             */
            a?: number;
        }

        /**
         * An array of quad vertices, x immediately followed by y for each point, points clock-wise.
         */
        type Quad = number[];

        /**
         * Box model.
         */
        interface BoxModel {
            /**
             * Content box
             */
            content: Quad;
            /**
             * Padding box
             */
            padding: Quad;
            /**
             * Border box
             */
            border: Quad;
            /**
             * Margin box
             */
            margin: Quad;
            /**
             * Node width
             */
            width: integer;
            /**
             * Node height
             */
            height: integer;
            /**
             * Shape outside coordinates
             */
            shapeOutside?: ShapeOutsideInfo;
        }

        /**
         * CSS Shape Outside details.
         */
        interface ShapeOutsideInfo {
            /**
             * Shape bounds
             */
            bounds: Quad;
            /**
             * Shape coordinate details
             */
            shape: any[];
            /**
             * Margin shape bounds
             */
            marginShape: any[];
        }

        /**
         * Rectangle.
         */
        interface Rect {
            /**
             * X coordinate
             */
            x: number;
            /**
             * Y coordinate
             */
            y: number;
            /**
             * Rectangle width
             */
            width: number;
            /**
             * Rectangle height
             */
            height: number;
        }

        interface CSSComputedStyleProperty {
            /**
             * Computed style property name.
             */
            name: string;
            /**
             * Computed style property value.
             */
            value: string;
        }

        interface CollectClassNamesFromSubtreeRequest {
            /**
             * Id of the node to collect class names.
             */
            nodeId: NodeId;
        }

        interface CollectClassNamesFromSubtreeResponse {
            /**
             * Class name list.
             */
            classNames: string[];
        }

        interface CopyToRequest {
            /**
             * Id of the node to copy.
             */
            nodeId: NodeId;
            /**
             * Id of the element to drop the copy into.
             */
            targetNodeId: NodeId;
            /**
             * Drop the copy before this node (if absent, the copy becomes the last child of
             * `targetNodeId`).
             */
            insertBeforeNodeId?: NodeId;
        }

        interface CopyToResponse {
            /**
             * Id of the node clone.
             */
            nodeId: NodeId;
        }

        interface DescribeNodeRequest {
            /**
             * Identifier of the node.
             */
            nodeId?: NodeId;
            /**
             * Identifier of the backend node.
             */
            backendNodeId?: BackendNodeId;
            /**
             * JavaScript object id of the node wrapper.
             */
            objectId?: Runtime.RemoteObjectId;
            /**
             * The maximum depth at which children should be retrieved, defaults to 1. Use -1 for the
             * entire subtree or provide an integer larger than 0.
             */
            depth?: integer;
            /**
             * Whether or not iframes and shadow roots should be traversed when returning the subtree
             * (default is false).
             */
            pierce?: boolean;
        }

        interface DescribeNodeResponse {
            /**
             * Node description.
             */
            node: Node;
        }

        interface ScrollIntoViewIfNeededRequest {
            /**
             * Identifier of the node.
             */
            nodeId?: NodeId;
            /**
             * Identifier of the backend node.
             */
            backendNodeId?: BackendNodeId;
            /**
             * JavaScript object id of the node wrapper.
             */
            objectId?: Runtime.RemoteObjectId;
            /**
             * The rect to be scrolled into view, relative to the node's border box, in CSS pixels.
             * When omitted, center of the node will be used, similar to Element.scrollIntoView.
             */
            rect?: Rect;
        }

        interface DiscardSearchResultsRequest {
            /**
             * Unique search session identifier.
             */
            searchId: string;
        }

        interface FocusRequest {
            /**
             * Identifier of the node.
             */
            nodeId?: NodeId;
            /**
             * Identifier of the backend node.
             */
            backendNodeId?: BackendNodeId;
            /**
             * JavaScript object id of the node wrapper.
             */
            objectId?: Runtime.RemoteObjectId;
        }

        interface GetAttributesRequest {
            /**
             * Id of the node to retrieve attibutes for.
             */
            nodeId: NodeId;
        }

        interface GetAttributesResponse {
            /**
             * An interleaved array of node attribute names and values.
             */
            attributes: string[];
        }

        interface GetBoxModelRequest {
            /**
             * Identifier of the node.
             */
            nodeId?: NodeId;
            /**
             * Identifier of the backend node.
             */
            backendNodeId?: BackendNodeId;
            /**
             * JavaScript object id of the node wrapper.
             */
            objectId?: Runtime.RemoteObjectId;
        }

        interface GetBoxModelResponse {
            /**
             * Box model for the node.
             */
            model: BoxModel;
        }

        interface GetContentQuadsRequest {
            /**
             * Identifier of the node.
             */
            nodeId?: NodeId;
            /**
             * Identifier of the backend node.
             */
            backendNodeId?: BackendNodeId;
            /**
             * JavaScript object id of the node wrapper.
             */
            objectId?: Runtime.RemoteObjectId;
        }

        interface GetContentQuadsResponse {
            /**
             * Quads that describe node layout relative to viewport.
             */
            quads: Quad[];
        }

        interface GetDocumentRequest {
            /**
             * The maximum depth at which children should be retrieved, defaults to 1. Use -1 for the
             * entire subtree or provide an integer larger than 0.
             */
            depth?: integer;
            /**
             * Whether or not iframes and shadow roots should be traversed when returning the subtree
             * (default is false).
             */
            pierce?: boolean;
        }

        interface GetDocumentResponse {
            /**
             * Resulting node.
             */
            root: Node;
        }

        interface GetFlattenedDocumentRequest {
            /**
             * The maximum depth at which children should be retrieved, defaults to 1. Use -1 for the
             * entire subtree or provide an integer larger than 0.
             */
            depth?: integer;
            /**
             * Whether or not iframes and shadow roots should be traversed when returning the subtree
             * (default is false).
             */
            pierce?: boolean;
        }

        interface GetFlattenedDocumentResponse {
            /**
             * Resulting node.
             */
            nodes: Node[];
        }

        interface GetNodesForSubtreeByStyleRequest {
            /**
             * Node ID pointing to the root of a subtree.
             */
            nodeId: NodeId;
            /**
             * The style to filter nodes by (includes nodes if any of properties matches).
             */
            computedStyles: CSSComputedStyleProperty[];
            /**
             * Whether or not iframes and shadow roots in the same target should be traversed when returning the
             * results (default is false).
             */
            pierce?: boolean;
        }

        interface GetNodesForSubtreeByStyleResponse {
            /**
             * Resulting nodes.
             */
            nodeIds: NodeId[];
        }

        interface GetNodeForLocationRequest {
            /**
             * X coordinate.
             */
            x: integer;
            /**
             * Y coordinate.
             */
            y: integer;
            /**
             * False to skip to the nearest non-UA shadow root ancestor (default: false).
             */
            includeUserAgentShadowDOM?: boolean;
            /**
             * Whether to ignore pointer-events: none on elements and hit test them.
             */
            ignorePointerEventsNone?: boolean;
        }

        interface GetNodeForLocationResponse {
            /**
             * Resulting node.
             */
            backendNodeId: BackendNodeId;
            /**
             * Frame this node belongs to.
             */
            frameId: Page.FrameId;
            /**
             * Id of the node at given coordinates, only when enabled and requested document.
             */
            nodeId?: NodeId;
        }

        interface GetOuterHTMLRequest {
            /**
             * Identifier of the node.
             */
            nodeId?: NodeId;
            /**
             * Identifier of the backend node.
             */
            backendNodeId?: BackendNodeId;
            /**
             * JavaScript object id of the node wrapper.
             */
            objectId?: Runtime.RemoteObjectId;
        }

        interface GetOuterHTMLResponse {
            /**
             * Outer HTML markup.
             */
            outerHTML: string;
        }

        interface GetRelayoutBoundaryRequest {
            /**
             * Id of the node.
             */
            nodeId: NodeId;
        }

        interface GetRelayoutBoundaryResponse {
            /**
             * Relayout boundary node id for the given node.
             */
            nodeId: NodeId;
        }

        interface GetSearchResultsRequest {
            /**
             * Unique search session identifier.
             */
            searchId: string;
            /**
             * Start index of the search result to be returned.
             */
            fromIndex: integer;
            /**
             * End index of the search result to be returned.
             */
            toIndex: integer;
        }

        interface GetSearchResultsResponse {
            /**
             * Ids of the search result nodes.
             */
            nodeIds: NodeId[];
        }

        interface MoveToRequest {
            /**
             * Id of the node to move.
             */
            nodeId: NodeId;
            /**
             * Id of the element to drop the moved node into.
             */
            targetNodeId: NodeId;
            /**
             * Drop node before this one (if absent, the moved node becomes the last child of
             * `targetNodeId`).
             */
            insertBeforeNodeId?: NodeId;
        }

        interface MoveToResponse {
            /**
             * New id of the moved node.
             */
            nodeId: NodeId;
        }

        interface PerformSearchRequest {
            /**
             * Plain text or query selector or XPath search query.
             */
            query: string;
            /**
             * True to search in user agent shadow DOM.
             */
            includeUserAgentShadowDOM?: boolean;
        }

        interface PerformSearchResponse {
            /**
             * Unique search session identifier.
             */
            searchId: string;
            /**
             * Number of search results.
             */
            resultCount: integer;
        }

        interface PushNodeByPathToFrontendRequest {
            /**
             * Path to node in the proprietary format.
             */
            path: string;
        }

        interface PushNodeByPathToFrontendResponse {
            /**
             * Id of the node for given path.
             */
            nodeId: NodeId;
        }

        interface PushNodesByBackendIdsToFrontendRequest {
            /**
             * The array of backend node ids.
             */
            backendNodeIds: BackendNodeId[];
        }

        interface PushNodesByBackendIdsToFrontendResponse {
            /**
             * The array of ids of pushed nodes that correspond to the backend ids specified in
             * backendNodeIds.
             */
            nodeIds: NodeId[];
        }

        interface QuerySelectorRequest {
            /**
             * Id of the node to query upon.
             */
            nodeId: NodeId;
            /**
             * Selector string.
             */
            selector: string;
        }

        interface QuerySelectorResponse {
            /**
             * Query selector result.
             */
            nodeId: NodeId;
        }

        interface QuerySelectorAllRequest {
            /**
             * Id of the node to query upon.
             */
            nodeId: NodeId;
            /**
             * Selector string.
             */
            selector: string;
        }

        interface QuerySelectorAllResponse {
            /**
             * Query selector result.
             */
            nodeIds: NodeId[];
        }

        interface RemoveAttributeRequest {
            /**
             * Id of the element to remove attribute from.
             */
            nodeId: NodeId;
            /**
             * Name of the attribute to remove.
             */
            name: string;
        }

        interface RemoveNodeRequest {
            /**
             * Id of the node to remove.
             */
            nodeId: NodeId;
        }

        interface RequestChildNodesRequest {
            /**
             * Id of the node to get children for.
             */
            nodeId: NodeId;
            /**
             * The maximum depth at which children should be retrieved, defaults to 1. Use -1 for the
             * entire subtree or provide an integer larger than 0.
             */
            depth?: integer;
            /**
             * Whether or not iframes and shadow roots should be traversed when returning the sub-tree
             * (default is false).
             */
            pierce?: boolean;
        }

        interface RequestNodeRequest {
            /**
             * JavaScript object id to convert into node.
             */
            objectId: Runtime.RemoteObjectId;
        }

        interface RequestNodeResponse {
            /**
             * Node id for given object.
             */
            nodeId: NodeId;
        }

        interface ResolveNodeRequest {
            /**
             * Id of the node to resolve.
             */
            nodeId?: NodeId;
            /**
             * Backend identifier of the node to resolve.
             */
            backendNodeId?: DOM.BackendNodeId;
            /**
             * Symbolic group name that can be used to release multiple objects.
             */
            objectGroup?: string;
            /**
             * Execution context in which to resolve the node.
             */
            executionContextId?: Runtime.ExecutionContextId;
        }

        interface ResolveNodeResponse {
            /**
             * JavaScript object wrapper for given node.
             */
            object: Runtime.RemoteObject;
        }

        interface SetAttributeValueRequest {
            /**
             * Id of the element to set attribute for.
             */
            nodeId: NodeId;
            /**
             * Attribute name.
             */
            name: string;
            /**
             * Attribute value.
             */
            value: string;
        }

        interface SetAttributesAsTextRequest {
            /**
             * Id of the element to set attributes for.
             */
            nodeId: NodeId;
            /**
             * Text with a number of attributes. Will parse this text using HTML parser.
             */
            text: string;
            /**
             * Attribute name to replace with new attributes derived from text in case text parsed
             * successfully.
             */
            name?: string;
        }

        interface SetFileInputFilesRequest {
            /**
             * Array of file paths to set.
             */
            files: string[];
            /**
             * Identifier of the node.
             */
            nodeId?: NodeId;
            /**
             * Identifier of the backend node.
             */
            backendNodeId?: BackendNodeId;
            /**
             * JavaScript object id of the node wrapper.
             */
            objectId?: Runtime.RemoteObjectId;
        }

        interface SetNodeStackTracesEnabledRequest {
            /**
             * Enable or disable.
             */
            enable: boolean;
        }

        interface GetNodeStackTracesRequest {
            /**
             * Id of the node to get stack traces for.
             */
            nodeId: NodeId;
        }

        interface GetNodeStackTracesResponse {
            /**
             * Creation stack trace, if available.
             */
            creation?: Runtime.StackTrace;
        }

        interface GetFileInfoRequest {
            /**
             * JavaScript object id of the node wrapper.
             */
            objectId: Runtime.RemoteObjectId;
        }

        interface GetFileInfoResponse {
            path: string;
        }

        interface SetInspectedNodeRequest {
            /**
             * DOM node id to be accessible by means of $x command line API.
             */
            nodeId: NodeId;
        }

        interface SetNodeNameRequest {
            /**
             * Id of the node to set name for.
             */
            nodeId: NodeId;
            /**
             * New node's name.
             */
            name: string;
        }

        interface SetNodeNameResponse {
            /**
             * New node's id.
             */
            nodeId: NodeId;
        }

        interface SetNodeValueRequest {
            /**
             * Id of the node to set value for.
             */
            nodeId: NodeId;
            /**
             * New node's value.
             */
            value: string;
        }

        interface SetOuterHTMLRequest {
            /**
             * Id of the node to set markup for.
             */
            nodeId: NodeId;
            /**
             * Outer HTML markup to set.
             */
            outerHTML: string;
        }

        interface GetFrameOwnerRequest {
            frameId: Page.FrameId;
        }

        interface GetFrameOwnerResponse {
            /**
             * Resulting node.
             */
            backendNodeId: BackendNodeId;
            /**
             * Id of the node at given coordinates, only when enabled and requested document.
             */
            nodeId?: NodeId;
        }

        /**
         * Fired when `Element`'s attribute is modified.
         */
        interface AttributeModifiedEvent {
            /**
             * Id of the node that has changed.
             */
            nodeId: NodeId;
            /**
             * Attribute name.
             */
            name: string;
            /**
             * Attribute value.
             */
            value: string;
        }

        /**
         * Fired when `Element`'s attribute is removed.
         */
        interface AttributeRemovedEvent {
            /**
             * Id of the node that has changed.
             */
            nodeId: NodeId;
            /**
             * A ttribute name.
             */
            name: string;
        }

        /**
         * Mirrors `DOMCharacterDataModified` event.
         */
        interface CharacterDataModifiedEvent {
            /**
             * Id of the node that has changed.
             */
            nodeId: NodeId;
            /**
             * New text value.
             */
            characterData: string;
        }

        /**
         * Fired when `Container`'s child node count has changed.
         */
        interface ChildNodeCountUpdatedEvent {
            /**
             * Id of the node that has changed.
             */
            nodeId: NodeId;
            /**
             * New node count.
             */
            childNodeCount: integer;
        }

        /**
         * Mirrors `DOMNodeInserted` event.
         */
        interface ChildNodeInsertedEvent {
            /**
             * Id of the node that has changed.
             */
            parentNodeId: NodeId;
            /**
             * If of the previous siblint.
             */
            previousNodeId: NodeId;
            /**
             * Inserted node data.
             */
            node: Node;
        }

        /**
         * Mirrors `DOMNodeRemoved` event.
         */
        interface ChildNodeRemovedEvent {
            /**
             * Parent id.
             */
            parentNodeId: NodeId;
            /**
             * Id of the node that has been removed.
             */
            nodeId: NodeId;
        }

        /**
         * Called when distrubution is changed.
         */
        interface DistributedNodesUpdatedEvent {
            /**
             * Insertion point where distrubuted nodes were updated.
             */
            insertionPointId: NodeId;
            /**
             * Distributed nodes for given insertion point.
             */
            distributedNodes: BackendNode[];
        }

        /**
         * Fired when `Element`'s inline style is modified via a CSS property modification.
         */
        interface InlineStyleInvalidatedEvent {
            /**
             * Ids of the nodes for which the inline styles have been invalidated.
             */
            nodeIds: NodeId[];
        }

        /**
         * Called when a pseudo element is added to an element.
         */
        interface PseudoElementAddedEvent {
            /**
             * Pseudo element's parent element id.
             */
            parentId: NodeId;
            /**
             * The added pseudo element.
             */
            pseudoElement: Node;
        }

        /**
         * Called when a pseudo element is removed from an element.
         */
        interface PseudoElementRemovedEvent {
            /**
             * Pseudo element's parent element id.
             */
            parentId: NodeId;
            /**
             * The removed pseudo element id.
             */
            pseudoElementId: NodeId;
        }

        /**
         * Fired when backend wants to provide client with the missing DOM structure. This happens upon
         * most of the calls requesting node ids.
         */
        interface SetChildNodesEvent {
            /**
             * Parent node id to populate with children.
             */
            parentId: NodeId;
            /**
             * Child nodes array.
             */
            nodes: Node[];
        }

        /**
         * Called when shadow root is popped from the element.
         */
        interface ShadowRootPoppedEvent {
            /**
             * Host element id.
             */
            hostId: NodeId;
            /**
             * Shadow root id.
             */
            rootId: NodeId;
        }

        /**
         * Called when shadow root is pushed into the element.
         */
        interface ShadowRootPushedEvent {
            /**
             * Host element id.
             */
            hostId: NodeId;
            /**
             * Shadow root.
             */
            root: Node;
        }
    }

    /**
     * DOM debugging allows setting breakpoints on particular DOM operations and events. JavaScript
     * execution will stop on these operations as if there was a regular breakpoint set.
     */
    namespace DOMDebugger {

        /**
         * DOM breakpoint type.
         */
        type DOMBreakpointType = ('subtree-modified' | 'attribute-modified' | 'node-removed');

        /**
         * CSP Violation type.
         */
        type CSPViolationType = ('trustedtype-sink-violation' | 'trustedtype-policy-violation');

        /**
         * Object event listener.
         */
        interface EventListener {
            /**
             * `EventListener`'s type.
             */
            type: string;
            /**
             * `EventListener`'s useCapture.
             */
            useCapture: boolean;
            /**
             * `EventListener`'s passive flag.
             */
            passive: boolean;
            /**
             * `EventListener`'s once flag.
             */
            once: boolean;
            /**
             * Script id of the handler code.
             */
            scriptId: Runtime.ScriptId;
            /**
             * Line number in the script (0-based).
             */
            lineNumber: integer;
            /**
             * Column number in the script (0-based).
             */
            columnNumber: integer;
            /**
             * Event handler function value.
             */
            handler?: Runtime.RemoteObject;
            /**
             * Event original handler function value.
             */
            originalHandler?: Runtime.RemoteObject;
            /**
             * Node the listener is added to (if any).
             */
            backendNodeId?: DOM.BackendNodeId;
        }

        interface GetEventListenersRequest {
            /**
             * Identifier of the object to return listeners for.
             */
            objectId: Runtime.RemoteObjectId;
            /**
             * The maximum depth at which Node children should be retrieved, defaults to 1. Use -1 for the
             * entire subtree or provide an integer larger than 0.
             */
            depth?: integer;
            /**
             * Whether or not iframes and shadow roots should be traversed when returning the subtree
             * (default is false). Reports listeners for all contexts if pierce is enabled.
             */
            pierce?: boolean;
        }

        interface GetEventListenersResponse {
            /**
             * Array of relevant listeners.
             */
            listeners: EventListener[];
        }

        interface RemoveDOMBreakpointRequest {
            /**
             * Identifier of the node to remove breakpoint from.
             */
            nodeId: DOM.NodeId;
            /**
             * Type of the breakpoint to remove.
             */
            type: DOMBreakpointType;
        }

        interface RemoveEventListenerBreakpointRequest {
            /**
             * Event name.
             */
            eventName: string;
            /**
             * EventTarget interface name.
             */
            targetName?: string;
        }

        interface RemoveInstrumentationBreakpointRequest {
            /**
             * Instrumentation name to stop on.
             */
            eventName: string;
        }

        interface RemoveXHRBreakpointRequest {
            /**
             * Resource URL substring.
             */
            url: string;
        }

        interface SetBreakOnCSPViolationRequest {
            /**
             * CSP Violations to stop upon.
             */
            violationTypes: CSPViolationType[];
        }

        interface SetDOMBreakpointRequest {
            /**
             * Identifier of the node to set breakpoint on.
             */
            nodeId: DOM.NodeId;
            /**
             * Type of the operation to stop upon.
             */
            type: DOMBreakpointType;
        }

        interface SetEventListenerBreakpointRequest {
            /**
             * DOM Event name to stop on (any DOM event will do).
             */
            eventName: string;
            /**
             * EventTarget interface name to stop on. If equal to `"*"` or not provided, will stop on any
             * EventTarget.
             */
            targetName?: string;
        }

        interface SetInstrumentationBreakpointRequest {
            /**
             * Instrumentation name to stop on.
             */
            eventName: string;
        }

        interface SetXHRBreakpointRequest {
            /**
             * Resource URL substring. All XHRs having this substring in the URL will get stopped upon.
             */
            url: string;
        }
    }

    /**
     * This domain facilitates obtaining document snapshots with DOM, layout, and style information.
     */
    namespace DOMSnapshot {

        /**
         * A Node in the DOM tree.
         */
        interface DOMNode {
            /**
             * `Node`'s nodeType.
             */
            nodeType: integer;
            /**
             * `Node`'s nodeName.
             */
            nodeName: string;
            /**
             * `Node`'s nodeValue.
             */
            nodeValue: string;
            /**
             * Only set for textarea elements, contains the text value.
             */
            textValue?: string;
            /**
             * Only set for input elements, contains the input's associated text value.
             */
            inputValue?: string;
            /**
             * Only set for radio and checkbox input elements, indicates if the element has been checked
             */
            inputChecked?: boolean;
            /**
             * Only set for option elements, indicates if the element has been selected
             */
            optionSelected?: boolean;
            /**
             * `Node`'s id, corresponds to DOM.Node.backendNodeId.
             */
            backendNodeId: DOM.BackendNodeId;
            /**
             * The indexes of the node's child nodes in the `domNodes` array returned by `getSnapshot`, if
             * any.
             */
            childNodeIndexes?: integer[];
            /**
             * Attributes of an `Element` node.
             */
            attributes?: NameValue[];
            /**
             * Indexes of pseudo elements associated with this node in the `domNodes` array returned by
             * `getSnapshot`, if any.
             */
            pseudoElementIndexes?: integer[];
            /**
             * The index of the node's related layout tree node in the `layoutTreeNodes` array returned by
             * `getSnapshot`, if any.
             */
            layoutNodeIndex?: integer;
            /**
             * Document URL that `Document` or `FrameOwner` node points to.
             */
            documentURL?: string;
            /**
             * Base URL that `Document` or `FrameOwner` node uses for URL completion.
             */
            baseURL?: string;
            /**
             * Only set for documents, contains the document's content language.
             */
            contentLanguage?: string;
            /**
             * Only set for documents, contains the document's character set encoding.
             */
            documentEncoding?: string;
            /**
             * `DocumentType` node's publicId.
             */
            publicId?: string;
            /**
             * `DocumentType` node's systemId.
             */
            systemId?: string;
            /**
             * Frame ID for frame owner elements and also for the document node.
             */
            frameId?: Page.FrameId;
            /**
             * The index of a frame owner element's content document in the `domNodes` array returned by
             * `getSnapshot`, if any.
             */
            contentDocumentIndex?: integer;
            /**
             * Type of a pseudo element node.
             */
            pseudoType?: DOM.PseudoType;
            /**
             * Shadow root type.
             */
            shadowRootType?: DOM.ShadowRootType;
            /**
             * Whether this DOM node responds to mouse clicks. This includes nodes that have had click
             * event listeners attached via JavaScript as well as anchor tags that naturally navigate when
             * clicked.
             */
            isClickable?: boolean;
            /**
             * Details of the node's event listeners, if any.
             */
            eventListeners?: DOMDebugger.EventListener[];
            /**
             * The selected url for nodes with a srcset attribute.
             */
            currentSourceURL?: string;
            /**
             * The url of the script (if any) that generates this node.
             */
            originURL?: string;
            /**
             * Scroll offsets, set when this node is a Document.
             */
            scrollOffsetX?: number;
            scrollOffsetY?: number;
        }

        /**
         * Details of post layout rendered text positions. The exact layout should not be regarded as
         * stable and may change between versions.
         */
        interface InlineTextBox {
            /**
             * The bounding box in document coordinates. Note that scroll offset of the document is ignored.
             */
            boundingBox: DOM.Rect;
            /**
             * The starting index in characters, for this post layout textbox substring. Characters that
             * would be represented as a surrogate pair in UTF-16 have length 2.
             */
            startCharacterIndex: integer;
            /**
             * The number of characters in this post layout textbox substring. Characters that would be
             * represented as a surrogate pair in UTF-16 have length 2.
             */
            numCharacters: integer;
        }

        /**
         * Details of an element in the DOM tree with a LayoutObject.
         */
        interface LayoutTreeNode {
            /**
             * The index of the related DOM node in the `domNodes` array returned by `getSnapshot`.
             */
            domNodeIndex: integer;
            /**
             * The bounding box in document coordinates. Note that scroll offset of the document is ignored.
             */
            boundingBox: DOM.Rect;
            /**
             * Contents of the LayoutText, if any.
             */
            layoutText?: string;
            /**
             * The post-layout inline text nodes, if any.
             */
            inlineTextNodes?: InlineTextBox[];
            /**
             * Index into the `computedStyles` array returned by `getSnapshot`.
             */
            styleIndex?: integer;
            /**
             * Global paint order index, which is determined by the stacking order of the nodes. Nodes
             * that are painted together will have the same index. Only provided if includePaintOrder in
             * getSnapshot was true.
             */
            paintOrder?: integer;
            /**
             * Set to true to indicate the element begins a new stacking context.
             */
            isStackingContext?: boolean;
        }

        /**
         * A subset of the full ComputedStyle as defined by the request whitelist.
         */
        interface ComputedStyle {
            /**
             * Name/value pairs of computed style properties.
             */
            properties: NameValue[];
        }

        /**
         * A name/value pair.
         */
        interface NameValue {
            /**
             * Attribute/property name.
             */
            name: string;
            /**
             * Attribute/property value.
             */
            value: string;
        }

        /**
         * Index of the string in the strings table.
         */
        type StringIndex = integer;

        /**
         * Index of the string in the strings table.
         */
        type ArrayOfStrings = StringIndex[];

        /**
         * Data that is only present on rare nodes.
         */
        interface RareStringData {
            index: integer[];
            value: StringIndex[];
        }

        interface RareBooleanData {
            index: integer[];
        }

        interface RareIntegerData {
            index: integer[];
            value: integer[];
        }

        type Rectangle = number[];

        /**
         * Document snapshot.
         */
        interface DocumentSnapshot {
            /**
             * Document URL that `Document` or `FrameOwner` node points to.
             */
            documentURL: StringIndex;
            /**
             * Document title.
             */
            title: StringIndex;
            /**
             * Base URL that `Document` or `FrameOwner` node uses for URL completion.
             */
            baseURL: StringIndex;
            /**
             * Contains the document's content language.
             */
            contentLanguage: StringIndex;
            /**
             * Contains the document's character set encoding.
             */
            encodingName: StringIndex;
            /**
             * `DocumentType` node's publicId.
             */
            publicId: StringIndex;
            /**
             * `DocumentType` node's systemId.
             */
            systemId: StringIndex;
            /**
             * Frame ID for frame owner elements and also for the document node.
             */
            frameId: StringIndex;
            /**
             * A table with dom nodes.
             */
            nodes: NodeTreeSnapshot;
            /**
             * The nodes in the layout tree.
             */
            layout: LayoutTreeSnapshot;
            /**
             * The post-layout inline text nodes.
             */
            textBoxes: TextBoxSnapshot;
            /**
             * Horizontal scroll offset.
             */
            scrollOffsetX?: number;
            /**
             * Vertical scroll offset.
             */
            scrollOffsetY?: number;
            /**
             * Document content width.
             */
            contentWidth?: number;
            /**
             * Document content height.
             */
            contentHeight?: number;
        }

        /**
         * Table containing nodes.
         */
        interface NodeTreeSnapshot {
            /**
             * Parent node index.
             */
            parentIndex?: integer[];
            /**
             * `Node`'s nodeType.
             */
            nodeType?: integer[];
            /**
             * `Node`'s nodeName.
             */
            nodeName?: StringIndex[];
            /**
             * `Node`'s nodeValue.
             */
            nodeValue?: StringIndex[];
            /**
             * `Node`'s id, corresponds to DOM.Node.backendNodeId.
             */
            backendNodeId?: DOM.BackendNodeId[];
            /**
             * Attributes of an `Element` node. Flatten name, value pairs.
             */
            attributes?: ArrayOfStrings[];
            /**
             * Only set for textarea elements, contains the text value.
             */
            textValue?: RareStringData;
            /**
             * Only set for input elements, contains the input's associated text value.
             */
            inputValue?: RareStringData;
            /**
             * Only set for radio and checkbox input elements, indicates if the element has been checked
             */
            inputChecked?: RareBooleanData;
            /**
             * Only set for option elements, indicates if the element has been selected
             */
            optionSelected?: RareBooleanData;
            /**
             * The index of the document in the list of the snapshot documents.
             */
            contentDocumentIndex?: RareIntegerData;
            /**
             * Type of a pseudo element node.
             */
            pseudoType?: RareStringData;
            /**
             * Whether this DOM node responds to mouse clicks. This includes nodes that have had click
             * event listeners attached via JavaScript as well as anchor tags that naturally navigate when
             * clicked.
             */
            isClickable?: RareBooleanData;
            /**
             * The selected url for nodes with a srcset attribute.
             */
            currentSourceURL?: RareStringData;
            /**
             * The url of the script (if any) that generates this node.
             */
            originURL?: RareStringData;
        }

        /**
         * Table of details of an element in the DOM tree with a LayoutObject.
         */
        interface LayoutTreeSnapshot {
            /**
             * Index of the corresponding node in the `NodeTreeSnapshot` array returned by `captureSnapshot`.
             */
            nodeIndex: integer[];
            /**
             * Array of indexes specifying computed style strings, filtered according to the `computedStyles` parameter passed to `captureSnapshot`.
             */
            styles: ArrayOfStrings[];
            /**
             * The absolute position bounding box.
             */
            bounds: Rectangle[];
            /**
             * Contents of the LayoutText, if any.
             */
            text: StringIndex[];
            /**
             * Stacking context information.
             */
            stackingContexts: RareBooleanData;
            /**
             * Global paint order index, which is determined by the stacking order of the nodes. Nodes
             * that are painted together will have the same index. Only provided if includePaintOrder in
             * captureSnapshot was true.
             */
            paintOrders?: integer[];
            /**
             * The offset rect of nodes. Only available when includeDOMRects is set to true
             */
            offsetRects?: Rectangle[];
            /**
             * The scroll rect of nodes. Only available when includeDOMRects is set to true
             */
            scrollRects?: Rectangle[];
            /**
             * The client rect of nodes. Only available when includeDOMRects is set to true
             */
            clientRects?: Rectangle[];
        }

        /**
         * Table of details of the post layout rendered text positions. The exact layout should not be regarded as
         * stable and may change between versions.
         */
        interface TextBoxSnapshot {
            /**
             * Index of the layout tree node that owns this box collection.
             */
            layoutIndex: integer[];
            /**
             * The absolute position bounding box.
             */
            bounds: Rectangle[];
            /**
             * The starting index in characters, for this post layout textbox substring. Characters that
             * would be represented as a surrogate pair in UTF-16 have length 2.
             */
            start: integer[];
            /**
             * The number of characters in this post layout textbox substring. Characters that would be
             * represented as a surrogate pair in UTF-16 have length 2.
             */
            length: integer[];
        }

        interface GetSnapshotRequest {
            /**
             * Whitelist of computed styles to return.
             */
            computedStyleWhitelist: string[];
            /**
             * Whether or not to retrieve details of DOM listeners (default false).
             */
            includeEventListeners?: boolean;
            /**
             * Whether to determine and include the paint order index of LayoutTreeNodes (default false).
             */
            includePaintOrder?: boolean;
            /**
             * Whether to include UA shadow tree in the snapshot (default false).
             */
            includeUserAgentShadowTree?: boolean;
        }

        interface GetSnapshotResponse {
            /**
             * The nodes in the DOM tree. The DOMNode at index 0 corresponds to the root document.
             */
            domNodes: DOMNode[];
            /**
             * The nodes in the layout tree.
             */
            layoutTreeNodes: LayoutTreeNode[];
            /**
             * Whitelisted ComputedStyle properties for each node in the layout tree.
             */
            computedStyles: ComputedStyle[];
        }

        interface CaptureSnapshotRequest {
            /**
             * Whitelist of computed styles to return.
             */
            computedStyles: string[];
            /**
             * Whether to include layout object paint orders into the snapshot.
             */
            includePaintOrder?: boolean;
            /**
             * Whether to include DOM rectangles (offsetRects, clientRects, scrollRects) into the snapshot
             */
            includeDOMRects?: boolean;
        }

        interface CaptureSnapshotResponse {
            /**
             * The nodes in the DOM tree. The DOMNode at index 0 corresponds to the root document.
             */
            documents: DocumentSnapshot[];
            /**
             * Shared string table that all string properties refer to with indexes.
             */
            strings: string[];
        }
    }

    /**
     * Query and modify DOM storage.
     */
    namespace DOMStorage {

        /**
         * DOM Storage identifier.
         */
        interface StorageId {
            /**
             * Security origin for the storage.
             */
            securityOrigin: string;
            /**
             * Whether the storage is local storage (not session storage).
             */
            isLocalStorage: boolean;
        }

        /**
         * DOM Storage item.
         */
        type Item = string[];

        interface ClearRequest {
            storageId: StorageId;
        }

        interface GetDOMStorageItemsRequest {
            storageId: StorageId;
        }

        interface GetDOMStorageItemsResponse {
            entries: Item[];
        }

        interface RemoveDOMStorageItemRequest {
            storageId: StorageId;
            key: string;
        }

        interface SetDOMStorageItemRequest {
            storageId: StorageId;
            key: string;
            value: string;
        }

        interface DomStorageItemAddedEvent {
            storageId: StorageId;
            key: string;
            newValue: string;
        }

        interface DomStorageItemRemovedEvent {
            storageId: StorageId;
            key: string;
        }

        interface DomStorageItemUpdatedEvent {
            storageId: StorageId;
            key: string;
            oldValue: string;
            newValue: string;
        }

        interface DomStorageItemsClearedEvent {
            storageId: StorageId;
        }
    }

    namespace Database {

        /**
         * Unique identifier of Database object.
         */
        type DatabaseId = string;

        /**
         * Database object.
         */
        interface Database {
            /**
             * Database ID.
             */
            id: DatabaseId;
            /**
             * Database domain.
             */
            domain: string;
            /**
             * Database name.
             */
            name: string;
            /**
             * Database version.
             */
            version: string;
        }

        /**
         * Database error.
         */
        interface Error {
            /**
             * Error message.
             */
            message: string;
            /**
             * Error code.
             */
            code: integer;
        }

        interface ExecuteSQLRequest {
            databaseId: DatabaseId;
            query: string;
        }

        interface ExecuteSQLResponse {
            columnNames?: string[];
            values?: any[];
            sqlError?: Error;
        }

        interface GetDatabaseTableNamesRequest {
            databaseId: DatabaseId;
        }

        interface GetDatabaseTableNamesResponse {
            tableNames: string[];
        }

        interface AddDatabaseEvent {
            database: Database;
        }
    }

    namespace DeviceOrientation {

        interface SetDeviceOrientationOverrideRequest {
            /**
             * Mock alpha
             */
            alpha: number;
            /**
             * Mock beta
             */
            beta: number;
            /**
             * Mock gamma
             */
            gamma: number;
        }
    }

    /**
     * This domain emulates different environments for the page.
     */
    namespace Emulation {

        const enum ScreenOrientationType {
            PortraitPrimary = 'portraitPrimary',
            PortraitSecondary = 'portraitSecondary',
            LandscapePrimary = 'landscapePrimary',
            LandscapeSecondary = 'landscapeSecondary',
        }

        /**
         * Screen orientation.
         */
        interface ScreenOrientation {
            /**
             * Orientation type. (ScreenOrientationType enum)
             */
            type: ('portraitPrimary' | 'portraitSecondary' | 'landscapePrimary' | 'landscapeSecondary');
            /**
             * Orientation angle.
             */
            angle: integer;
        }

        const enum DisplayFeatureOrientation {
            Vertical = 'vertical',
            Horizontal = 'horizontal',
        }

        interface DisplayFeature {
            /**
             * Orientation of a display feature in relation to screen (DisplayFeatureOrientation enum)
             */
            orientation: ('vertical' | 'horizontal');
            /**
             * The offset from the screen origin in either the x (for vertical
             * orientation) or y (for horizontal orientation) direction.
             */
            offset: integer;
            /**
             * A display feature may mask content such that it is not physically
             * displayed - this length along with the offset describes this area.
             * A display feature that only splits content will have a 0 mask_length.
             */
            maskLength: integer;
        }

        interface MediaFeature {
            name: string;
            value: string;
        }

        /**
         * advance: If the scheduler runs out of immediate work, the virtual time base may fast forward to
         * allow the next delayed task (if any) to run; pause: The virtual time base may not advance;
         * pauseIfNetworkFetchesPending: The virtual time base may not advance if there are any pending
         * resource fetches.
         */
        type VirtualTimePolicy = ('advance' | 'pause' | 'pauseIfNetworkFetchesPending');

        /**
         * Used to specify User Agent Cient Hints to emulate. See https://wicg.github.io/ua-client-hints
         */
        interface UserAgentBrandVersion {
            brand: string;
            version: string;
        }

        /**
         * Used to specify User Agent Cient Hints to emulate. See https://wicg.github.io/ua-client-hints
         * Missing optional values will be filled in by the target with what it would normally use.
         */
        interface UserAgentMetadata {
            brands?: UserAgentBrandVersion[];
            fullVersion?: string;
            platform: string;
            platformVersion: string;
            architecture: string;
            model: string;
            mobile: boolean;
        }

        /**
         * Enum of image types that can be disabled.
         */
        type DisabledImageType = ('avif' | 'webp');

        interface CanEmulateResponse {
            /**
             * True if emulation is supported.
             */
            result: boolean;
        }

        interface SetFocusEmulationEnabledRequest {
            /**
             * Whether to enable to disable focus emulation.
             */
            enabled: boolean;
        }

        interface SetCPUThrottlingRateRequest {
            /**
             * Throttling rate as a slowdown factor (1 is no throttle, 2 is 2x slowdown, etc).
             */
            rate: number;
        }

        interface SetDefaultBackgroundColorOverrideRequest {
            /**
             * RGBA of the default background color. If not specified, any existing override will be
             * cleared.
             */
            color?: DOM.RGBA;
        }

        interface SetDeviceMetricsOverrideRequest {
            /**
             * Overriding width value in pixels (minimum 0, maximum 10000000). 0 disables the override.
             */
            width: integer;
            /**
             * Overriding height value in pixels (minimum 0, maximum 10000000). 0 disables the override.
             */
            height: integer;
            /**
             * Overriding device scale factor value. 0 disables the override.
             */
            deviceScaleFactor: number;
            /**
             * Whether to emulate mobile device. This includes viewport meta tag, overlay scrollbars, text
             * autosizing and more.
             */
            mobile: boolean;
            /**
             * Scale to apply to resulting view image.
             */
            scale?: number;
            /**
             * Overriding screen width value in pixels (minimum 0, maximum 10000000).
             */
            screenWidth?: integer;
            /**
             * Overriding screen height value in pixels (minimum 0, maximum 10000000).
             */
            screenHeight?: integer;
            /**
             * Overriding view X position on screen in pixels (minimum 0, maximum 10000000).
             */
            positionX?: integer;
            /**
             * Overriding view Y position on screen in pixels (minimum 0, maximum 10000000).
             */
            positionY?: integer;
            /**
             * Do not set visible view size, rely upon explicit setVisibleSize call.
             */
            dontSetVisibleSize?: boolean;
            /**
             * Screen orientation override.
             */
            screenOrientation?: ScreenOrientation;
            /**
             * If set, the visible area of the page will be overridden to this viewport. This viewport
             * change is not observed by the page, e.g. viewport-relative elements do not change positions.
             */
            viewport?: Page.Viewport;
            /**
             * If set, the display feature of a multi-segment screen. If not set, multi-segment support
             * is turned-off.
             */
            displayFeature?: DisplayFeature;
        }

        interface SetScrollbarsHiddenRequest {
            /**
             * Whether scrollbars should be always hidden.
             */
            hidden: boolean;
        }

        interface SetDocumentCookieDisabledRequest {
            /**
             * Whether document.coookie API should be disabled.
             */
            disabled: boolean;
        }

        const enum SetEmitTouchEventsForMouseRequestConfiguration {
            Mobile = 'mobile',
            Desktop = 'desktop',
        }

        interface SetEmitTouchEventsForMouseRequest {
            /**
             * Whether touch emulation based on mouse input should be enabled.
             */
            enabled: boolean;
            /**
             * Touch/gesture events configuration. Default: current platform. (SetEmitTouchEventsForMouseRequestConfiguration enum)
             */
            configuration?: ('mobile' | 'desktop');
        }

        interface SetEmulatedMediaRequest {
            /**
             * Media type to emulate. Empty string disables the override.
             */
            media?: string;
            /**
             * Media features to emulate.
             */
            features?: MediaFeature[];
        }

        const enum SetEmulatedVisionDeficiencyRequestType {
            None = 'none',
            Achromatopsia = 'achromatopsia',
            BlurredVision = 'blurredVision',
            Deuteranopia = 'deuteranopia',
            Protanopia = 'protanopia',
            Tritanopia = 'tritanopia',
        }

        interface SetEmulatedVisionDeficiencyRequest {
            /**
             * Vision deficiency to emulate. (SetEmulatedVisionDeficiencyRequestType enum)
             */
            type: ('none' | 'achromatopsia' | 'blurredVision' | 'deuteranopia' | 'protanopia' | 'tritanopia');
        }

        interface SetGeolocationOverrideRequest {
            /**
             * Mock latitude
             */
            latitude?: number;
            /**
             * Mock longitude
             */
            longitude?: number;
            /**
             * Mock accuracy
             */
            accuracy?: number;
        }

        interface SetIdleOverrideRequest {
            /**
             * Mock isUserActive
             */
            isUserActive: boolean;
            /**
             * Mock isScreenUnlocked
             */
            isScreenUnlocked: boolean;
        }

        interface SetNavigatorOverridesRequest {
            /**
             * The platform navigator.platform should return.
             */
            platform: string;
        }

        interface SetPageScaleFactorRequest {
            /**
             * Page scale factor.
             */
            pageScaleFactor: number;
        }

        interface SetScriptExecutionDisabledRequest {
            /**
             * Whether script execution should be disabled in the page.
             */
            value: boolean;
        }

        interface SetTouchEmulationEnabledRequest {
            /**
             * Whether the touch event emulation should be enabled.
             */
            enabled: boolean;
            /**
             * Maximum touch points supported. Defaults to one.
             */
            maxTouchPoints?: integer;
        }

        interface SetVirtualTimePolicyRequest {
            policy: VirtualTimePolicy;
            /**
             * If set, after this many virtual milliseconds have elapsed virtual time will be paused and a
             * virtualTimeBudgetExpired event is sent.
             */
            budget?: number;
            /**
             * If set this specifies the maximum number of tasks that can be run before virtual is forced
             * forwards to prevent deadlock.
             */
            maxVirtualTimeTaskStarvationCount?: integer;
            /**
             * If set the virtual time policy change should be deferred until any frame starts navigating.
             * Note any previous deferred policy change is superseded.
             */
            waitForNavigation?: boolean;
            /**
             * If set, base::Time::Now will be overriden to initially return this value.
             */
            initialVirtualTime?: Network.TimeSinceEpoch;
        }

        interface SetVirtualTimePolicyResponse {
            /**
             * Absolute timestamp at which virtual time was first enabled (up time in milliseconds).
             */
            virtualTimeTicksBase: number;
        }

        interface SetLocaleOverrideRequest {
            /**
             * ICU style C locale (e.g. "en_US"). If not specified or empty, disables the override and
             * restores default host system locale.
             */
            locale?: string;
        }

        interface SetTimezoneOverrideRequest {
            /**
             * The timezone identifier. If empty, disables the override and
             * restores default host system timezone.
             */
            timezoneId: string;
        }

        interface SetVisibleSizeRequest {
            /**
             * Frame width (DIP).
             */
            width: integer;
            /**
             * Frame height (DIP).
             */
            height: integer;
        }

        interface SetDisabledImageTypesRequest {
            /**
             * Image types to disable.
             */
            imageTypes: DisabledImageType[];
        }

        interface SetUserAgentOverrideRequest {
            /**
             * User agent to use.
             */
            userAgent: string;
            /**
             * Browser langugage to emulate.
             */
            acceptLanguage?: string;
            /**
             * The platform navigator.platform should return.
             */
            platform?: string;
            /**
             * To be sent in Sec-CH-UA-* headers and returned in navigator.userAgentData
             */
            userAgentMetadata?: UserAgentMetadata;
        }
    }

    /**
     * This domain provides experimental commands only supported in headless mode.
     */
    namespace HeadlessExperimental {

        const enum ScreenshotParamsFormat {
            Jpeg = 'jpeg',
            Png = 'png',
        }

        /**
         * Encoding options for a screenshot.
         */
        interface ScreenshotParams {
            /**
             * Image compression format (defaults to png). (ScreenshotParamsFormat enum)
             */
            format?: ('jpeg' | 'png');
            /**
             * Compression quality from range [0..100] (jpeg only).
             */
            quality?: integer;
        }

        interface BeginFrameRequest {
            /**
             * Timestamp of this BeginFrame in Renderer TimeTicks (milliseconds of uptime). If not set,
             * the current time will be used.
             */
            frameTimeTicks?: number;
            /**
             * The interval between BeginFrames that is reported to the compositor, in milliseconds.
             * Defaults to a 60 frames/second interval, i.e. about 16.666 milliseconds.
             */
            interval?: number;
            /**
             * Whether updates should not be committed and drawn onto the display. False by default. If
             * true, only side effects of the BeginFrame will be run, such as layout and animations, but
             * any visual updates may not be visible on the display or in screenshots.
             */
            noDisplayUpdates?: boolean;
            /**
             * If set, a screenshot of the frame will be captured and returned in the response. Otherwise,
             * no screenshot will be captured. Note that capturing a screenshot can fail, for example,
             * during renderer initialization. In such a case, no screenshot data will be returned.
             */
            screenshot?: ScreenshotParams;
        }

        interface BeginFrameResponse {
            /**
             * Whether the BeginFrame resulted in damage and, thus, a new frame was committed to the
             * display. Reported for diagnostic uses, may be removed in the future.
             */
            hasDamage: boolean;
            /**
             * Base64-encoded image data of the screenshot, if one was requested and successfully taken. (Encoded as a base64 string when passed over JSON)
             */
            screenshotData?: string;
        }

        /**
         * Issued when the target starts or stops needing BeginFrames.
         * Deprecated. Issue beginFrame unconditionally instead and use result from
         * beginFrame to detect whether the frames were suppressed.
         */
        interface NeedsBeginFramesChangedEvent {
            /**
             * True if BeginFrames are needed, false otherwise.
             */
            needsBeginFrames: boolean;
        }
    }

    /**
     * Input/Output operations for streams produced by DevTools.
     */
    namespace IO {

        /**
         * This is either obtained from another method or specifed as `blob:&lt;uuid&gt;` where
         * `&lt;uuid&gt` is an UUID of a Blob.
         */
        type StreamHandle = string;

        interface CloseRequest {
            /**
             * Handle of the stream to close.
             */
            handle: StreamHandle;
        }

        interface ReadRequest {
            /**
             * Handle of the stream to read.
             */
            handle: StreamHandle;
            /**
             * Seek to the specified offset before reading (if not specificed, proceed with offset
             * following the last read). Some types of streams may only support sequential reads.
             */
            offset?: integer;
            /**
             * Maximum number of bytes to read (left upon the agent discretion if not specified).
             */
            size?: integer;
        }

        interface ReadResponse {
            /**
             * Set if the data is base64-encoded
             */
            base64Encoded?: boolean;
            /**
             * Data that were read.
             */
            data: string;
            /**
             * Set if the end-of-file condition occured while reading.
             */
            eof: boolean;
        }

        interface ResolveBlobRequest {
            /**
             * Object id of a Blob object wrapper.
             */
            objectId: Runtime.RemoteObjectId;
        }

        interface ResolveBlobResponse {
            /**
             * UUID of the specified Blob.
             */
            uuid: string;
        }
    }

    namespace IndexedDB {

        /**
         * Database with an array of object stores.
         */
        interface DatabaseWithObjectStores {
            /**
             * Database name.
             */
            name: string;
            /**
             * Database version (type is not 'integer', as the standard
             * requires the version number to be 'unsigned long long')
             */
            version: number;
            /**
             * Object stores in this database.
             */
            objectStores: ObjectStore[];
        }

        /**
         * Object store.
         */
        interface ObjectStore {
            /**
             * Object store name.
             */
            name: string;
            /**
             * Object store key path.
             */
            keyPath: KeyPath;
            /**
             * If true, object store has auto increment flag set.
             */
            autoIncrement: boolean;
            /**
             * Indexes in this object store.
             */
            indexes: ObjectStoreIndex[];
        }

        /**
         * Object store index.
         */
        interface ObjectStoreIndex {
            /**
             * Index name.
             */
            name: string;
            /**
             * Index key path.
             */
            keyPath: KeyPath;
            /**
             * If true, index is unique.
             */
            unique: boolean;
            /**
             * If true, index allows multiple entries for a key.
             */
            multiEntry: boolean;
        }

        const enum KeyType {
            Number = 'number',
            String = 'string',
            Date = 'date',
            Array = 'array',
        }

        /**
         * Key.
         */
        interface Key {
            /**
             * Key type. (KeyType enum)
             */
            type: ('number' | 'string' | 'date' | 'array');
            /**
             * Number value.
             */
            number?: number;
            /**
             * String value.
             */
            string?: string;
            /**
             * Date value.
             */
            date?: number;
            /**
             * Array value.
             */
            array?: Key[];
        }

        /**
         * Key range.
         */
        interface KeyRange {
            /**
             * Lower bound.
             */
            lower?: Key;
            /**
             * Upper bound.
             */
            upper?: Key;
            /**
             * If true lower bound is open.
             */
            lowerOpen: boolean;
            /**
             * If true upper bound is open.
             */
            upperOpen: boolean;
        }

        /**
         * Data entry.
         */
        interface DataEntry {
            /**
             * Key object.
             */
            key: Runtime.RemoteObject;
            /**
             * Primary key object.
             */
            primaryKey: Runtime.RemoteObject;
            /**
             * Value object.
             */
            value: Runtime.RemoteObject;
        }

        const enum KeyPathType {
            Null = 'null',
            String = 'string',
            Array = 'array',
        }

        /**
         * Key path.
         */
        interface KeyPath {
            /**
             * Key path type. (KeyPathType enum)
             */
            type: ('null' | 'string' | 'array');
            /**
             * String value.
             */
            string?: string;
            /**
             * Array value.
             */
            array?: string[];
        }

        interface ClearObjectStoreRequest {
            /**
             * Security origin.
             */
            securityOrigin: string;
            /**
             * Database name.
             */
            databaseName: string;
            /**
             * Object store name.
             */
            objectStoreName: string;
        }

        interface DeleteDatabaseRequest {
            /**
             * Security origin.
             */
            securityOrigin: string;
            /**
             * Database name.
             */
            databaseName: string;
        }

        interface DeleteObjectStoreEntriesRequest {
            securityOrigin: string;
            databaseName: string;
            objectStoreName: string;
            /**
             * Range of entry keys to delete
             */
            keyRange: KeyRange;
        }

        interface RequestDataRequest {
            /**
             * Security origin.
             */
            securityOrigin: string;
            /**
             * Database name.
             */
            databaseName: string;
            /**
             * Object store name.
             */
            objectStoreName: string;
            /**
             * Index name, empty string for object store data requests.
             */
            indexName: string;
            /**
             * Number of records to skip.
             */
            skipCount: integer;
            /**
             * Number of records to fetch.
             */
            pageSize: integer;
            /**
             * Key range.
             */
            keyRange?: KeyRange;
        }

        interface RequestDataResponse {
            /**
             * Array of object store data entries.
             */
            objectStoreDataEntries: DataEntry[];
            /**
             * If true, there are more entries to fetch in the given range.
             */
            hasMore: boolean;
        }

        interface GetMetadataRequest {
            /**
             * Security origin.
             */
            securityOrigin: string;
            /**
             * Database name.
             */
            databaseName: string;
            /**
             * Object store name.
             */
            objectStoreName: string;
        }

        interface GetMetadataResponse {
            /**
             * the entries count
             */
            entriesCount: number;
            /**
             * the current value of key generator, to become the next inserted
             * key into the object store. Valid if objectStore.autoIncrement
             * is true.
             */
            keyGeneratorValue: number;
        }

        interface RequestDatabaseRequest {
            /**
             * Security origin.
             */
            securityOrigin: string;
            /**
             * Database name.
             */
            databaseName: string;
        }

        interface RequestDatabaseResponse {
            /**
             * Database with an array of object stores.
             */
            databaseWithObjectStores: DatabaseWithObjectStores;
        }

        interface RequestDatabaseNamesRequest {
            /**
             * Security origin.
             */
            securityOrigin: string;
        }

        interface RequestDatabaseNamesResponse {
            /**
             * Database names for origin.
             */
            databaseNames: string[];
        }
    }

    namespace Input {

        interface TouchPoint {
            /**
             * X coordinate of the event relative to the main frame's viewport in CSS pixels.
             */
            x: number;
            /**
             * Y coordinate of the event relative to the main frame's viewport in CSS pixels. 0 refers to
             * the top of the viewport and Y increases as it proceeds towards the bottom of the viewport.
             */
            y: number;
            /**
             * X radius of the touch area (default: 1.0).
             */
            radiusX?: number;
            /**
             * Y radius of the touch area (default: 1.0).
             */
            radiusY?: number;
            /**
             * Rotation angle (default: 0.0).
             */
            rotationAngle?: number;
            /**
             * Force (default: 1.0).
             */
            force?: number;
            /**
             * The normalized tangential pressure, which has a range of [-1,1] (default: 0).
             */
            tangentialPressure?: number;
            /**
             * The plane angle between the Y-Z plane and the plane containing both the stylus axis and the Y axis, in degrees of the range [-90,90], a positive tiltX is to the right (default: 0)
             */
            tiltX?: integer;
            /**
             * The plane angle between the X-Z plane and the plane containing both the stylus axis and the X axis, in degrees of the range [-90,90], a positive tiltY is towards the user (default: 0).
             */
            tiltY?: integer;
            /**
             * The clockwise rotation of a pen stylus around its own major axis, in degrees in the range [0,359] (default: 0).
             */
            twist?: integer;
            /**
             * Identifier used to track touch sources between events, must be unique within an event.
             */
            id?: number;
        }

        type GestureSourceType = ('default' | 'touch' | 'mouse');

        type MouseButton = ('none' | 'left' | 'middle' | 'right' | 'back' | 'forward');

        /**
         * UTC time in seconds, counted from January 1, 1970.
         */
        type TimeSinceEpoch = number;

        const enum DispatchKeyEventRequestType {
            KeyDown = 'keyDown',
            KeyUp = 'keyUp',
            RawKeyDown = 'rawKeyDown',
            Char = 'char',
        }

        interface DispatchKeyEventRequest {
            /**
             * Type of the key event. (DispatchKeyEventRequestType enum)
             */
            type: ('keyDown' | 'keyUp' | 'rawKeyDown' | 'char');
            /**
             * Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8
             * (default: 0).
             */
            modifiers?: integer;
            /**
             * Time at which the event occurred.
             */
            timestamp?: TimeSinceEpoch;
            /**
             * Text as generated by processing a virtual key code with a keyboard layout. Not needed for
             * for `keyUp` and `rawKeyDown` events (default: "")
             */
            text?: string;
            /**
             * Text that would have been generated by the keyboard if no modifiers were pressed (except for
             * shift). Useful for shortcut (accelerator) key handling (default: "").
             */
            unmodifiedText?: string;
            /**
             * Unique key identifier (e.g., 'U+0041') (default: "").
             */
            keyIdentifier?: string;
            /**
             * Unique DOM defined string value for each physical key (e.g., 'KeyA') (default: "").
             */
            code?: string;
            /**
             * Unique DOM defined string value describing the meaning of the key in the context of active
             * modifiers, keyboard layout, etc (e.g., 'AltGr') (default: "").
             */
            key?: string;
            /**
             * Windows virtual key code (default: 0).
             */
            windowsVirtualKeyCode?: integer;
            /**
             * Native virtual key code (default: 0).
             */
            nativeVirtualKeyCode?: integer;
            /**
             * Whether the event was generated from auto repeat (default: false).
             */
            autoRepeat?: boolean;
            /**
             * Whether the event was generated from the keypad (default: false).
             */
            isKeypad?: boolean;
            /**
             * Whether the event was a system key event (default: false).
             */
            isSystemKey?: boolean;
            /**
             * Whether the event was from the left or right side of the keyboard. 1=Left, 2=Right (default:
             * 0).
             */
            location?: integer;
            /**
             * Editing commands to send with the key event (e.g., 'selectAll') (default: []).
             * These are related to but not equal the command names used in `document.execCommand` and NSStandardKeyBindingResponding.
             * See https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/editing/commands/editor_command_names.h for valid command names.
             */
            commands?: string[];
        }

        interface InsertTextRequest {
            /**
             * The text to insert.
             */
            text: string;
        }

        const enum DispatchMouseEventRequestType {
            MousePressed = 'mousePressed',
            MouseReleased = 'mouseReleased',
            MouseMoved = 'mouseMoved',
            MouseWheel = 'mouseWheel',
        }

        const enum DispatchMouseEventRequestPointerType {
            Mouse = 'mouse',
            Pen = 'pen',
        }

        interface DispatchMouseEventRequest {
            /**
             * Type of the mouse event. (DispatchMouseEventRequestType enum)
             */
            type: ('mousePressed' | 'mouseReleased' | 'mouseMoved' | 'mouseWheel');
            /**
             * X coordinate of the event relative to the main frame's viewport in CSS pixels.
             */
            x: number;
            /**
             * Y coordinate of the event relative to the main frame's viewport in CSS pixels. 0 refers to
             * the top of the viewport and Y increases as it proceeds towards the bottom of the viewport.
             */
            y: number;
            /**
             * Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8
             * (default: 0).
             */
            modifiers?: integer;
            /**
             * Time at which the event occurred.
             */
            timestamp?: TimeSinceEpoch;
            /**
             * Mouse button (default: "none").
             */
            button?: MouseButton;
            /**
             * A number indicating which buttons are pressed on the mouse when a mouse event is triggered.
             * Left=1, Right=2, Middle=4, Back=8, Forward=16, None=0.
             */
            buttons?: integer;
            /**
             * Number of times the mouse button was clicked (default: 0).
             */
            clickCount?: integer;
            /**
             * The normalized pressure, which has a range of [0,1] (default: 0).
             */
            force?: number;
            /**
             * The normalized tangential pressure, which has a range of [-1,1] (default: 0).
             */
            tangentialPressure?: number;
            /**
             * The plane angle between the Y-Z plane and the plane containing both the stylus axis and the Y axis, in degrees of the range [-90,90], a positive tiltX is to the right (default: 0).
             */
            tiltX?: integer;
            /**
             * The plane angle between the X-Z plane and the plane containing both the stylus axis and the X axis, in degrees of the range [-90,90], a positive tiltY is towards the user (default: 0).
             */
            tiltY?: integer;
            /**
             * The clockwise rotation of a pen stylus around its own major axis, in degrees in the range [0,359] (default: 0).
             */
            twist?: integer;
            /**
             * X delta in CSS pixels for mouse wheel event (default: 0).
             */
            deltaX?: number;
            /**
             * Y delta in CSS pixels for mouse wheel event (default: 0).
             */
            deltaY?: number;
            /**
             * Pointer type (default: "mouse"). (DispatchMouseEventRequestPointerType enum)
             */
            pointerType?: ('mouse' | 'pen');
        }

        const enum DispatchTouchEventRequestType {
            TouchStart = 'touchStart',
            TouchEnd = 'touchEnd',
            TouchMove = 'touchMove',
            TouchCancel = 'touchCancel',
        }

        interface DispatchTouchEventRequest {
            /**
             * Type of the touch event. TouchEnd and TouchCancel must not contain any touch points, while
             * TouchStart and TouchMove must contains at least one. (DispatchTouchEventRequestType enum)
             */
            type: ('touchStart' | 'touchEnd' | 'touchMove' | 'touchCancel');
            /**
             * Active touch points on the touch device. One event per any changed point (compared to
             * previous touch event in a sequence) is generated, emulating pressing/moving/releasing points
             * one by one.
             */
            touchPoints: TouchPoint[];
            /**
             * Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8
             * (default: 0).
             */
            modifiers?: integer;
            /**
             * Time at which the event occurred.
             */
            timestamp?: TimeSinceEpoch;
        }

        const enum EmulateTouchFromMouseEventRequestType {
            MousePressed = 'mousePressed',
            MouseReleased = 'mouseReleased',
            MouseMoved = 'mouseMoved',
            MouseWheel = 'mouseWheel',
        }

        interface EmulateTouchFromMouseEventRequest {
            /**
             * Type of the mouse event. (EmulateTouchFromMouseEventRequestType enum)
             */
            type: ('mousePressed' | 'mouseReleased' | 'mouseMoved' | 'mouseWheel');
            /**
             * X coordinate of the mouse pointer in DIP.
             */
            x: integer;
            /**
             * Y coordinate of the mouse pointer in DIP.
             */
            y: integer;
            /**
             * Mouse button. Only "none", "left", "right" are supported.
             */
            button: MouseButton;
            /**
             * Time at which the event occurred (default: current time).
             */
            timestamp?: TimeSinceEpoch;
            /**
             * X delta in DIP for mouse wheel event (default: 0).
             */
            deltaX?: number;
            /**
             * Y delta in DIP for mouse wheel event (default: 0).
             */
            deltaY?: number;
            /**
             * Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8
             * (default: 0).
             */
            modifiers?: integer;
            /**
             * Number of times the mouse button was clicked (default: 0).
             */
            clickCount?: integer;
        }

        interface SetIgnoreInputEventsRequest {
            /**
             * Ignores input events processing when set to true.
             */
            ignore: boolean;
        }

        interface SynthesizePinchGestureRequest {
            /**
             * X coordinate of the start of the gesture in CSS pixels.
             */
            x: number;
            /**
             * Y coordinate of the start of the gesture in CSS pixels.
             */
            y: number;
            /**
             * Relative scale factor after zooming (>1.0 zooms in, <1.0 zooms out).
             */
            scaleFactor: number;
            /**
             * Relative pointer speed in pixels per second (default: 800).
             */
            relativeSpeed?: integer;
            /**
             * Which type of input events to be generated (default: 'default', which queries the platform
             * for the preferred input type).
             */
            gestureSourceType?: GestureSourceType;
        }

        interface SynthesizeScrollGestureRequest {
            /**
             * X coordinate of the start of the gesture in CSS pixels.
             */
            x: number;
            /**
             * Y coordinate of the start of the gesture in CSS pixels.
             */
            y: number;
            /**
             * The distance to scroll along the X axis (positive to scroll left).
             */
            xDistance?: number;
            /**
             * The distance to scroll along the Y axis (positive to scroll up).
             */
            yDistance?: number;
            /**
             * The number of additional pixels to scroll back along the X axis, in addition to the given
             * distance.
             */
            xOverscroll?: number;
            /**
             * The number of additional pixels to scroll back along the Y axis, in addition to the given
             * distance.
             */
            yOverscroll?: number;
            /**
             * Prevent fling (default: true).
             */
            preventFling?: boolean;
            /**
             * Swipe speed in pixels per second (default: 800).
             */
            speed?: integer;
            /**
             * Which type of input events to be generated (default: 'default', which queries the platform
             * for the preferred input type).
             */
            gestureSourceType?: GestureSourceType;
            /**
             * The number of times to repeat the gesture (default: 0).
             */
            repeatCount?: integer;
            /**
             * The number of milliseconds delay between each repeat. (default: 250).
             */
            repeatDelayMs?: integer;
            /**
             * The name of the interaction markers to generate, if not empty (default: "").
             */
            interactionMarkerName?: string;
        }

        interface SynthesizeTapGestureRequest {
            /**
             * X coordinate of the start of the gesture in CSS pixels.
             */
            x: number;
            /**
             * Y coordinate of the start of the gesture in CSS pixels.
             */
            y: number;
            /**
             * Duration between touchdown and touchup events in ms (default: 50).
             */
            duration?: integer;
            /**
             * Number of times to perform the tap (e.g. 2 for double tap, default: 1).
             */
            tapCount?: integer;
            /**
             * Which type of input events to be generated (default: 'default', which queries the platform
             * for the preferred input type).
             */
            gestureSourceType?: GestureSourceType;
        }
    }

    namespace Inspector {

        /**
         * Fired when remote debugging connection is about to be terminated. Contains detach reason.
         */
        interface DetachedEvent {
            /**
             * The reason why connection has been terminated.
             */
            reason: string;
        }
    }

    namespace LayerTree {

        /**
         * Unique Layer identifier.
         */
        type LayerId = string;

        /**
         * Unique snapshot identifier.
         */
        type SnapshotId = string;

        const enum ScrollRectType {
            RepaintsOnScroll = 'RepaintsOnScroll',
            TouchEventHandler = 'TouchEventHandler',
            WheelEventHandler = 'WheelEventHandler',
        }

        /**
         * Rectangle where scrolling happens on the main thread.
         */
        interface ScrollRect {
            /**
             * Rectangle itself.
             */
            rect: DOM.Rect;
            /**
             * Reason for rectangle to force scrolling on the main thread (ScrollRectType enum)
             */
            type: ('RepaintsOnScroll' | 'TouchEventHandler' | 'WheelEventHandler');
        }

        /**
         * Sticky position constraints.
         */
        interface StickyPositionConstraint {
            /**
             * Layout rectangle of the sticky element before being shifted
             */
            stickyBoxRect: DOM.Rect;
            /**
             * Layout rectangle of the containing block of the sticky element
             */
            containingBlockRect: DOM.Rect;
            /**
             * The nearest sticky layer that shifts the sticky box
             */
            nearestLayerShiftingStickyBox?: LayerId;
            /**
             * The nearest sticky layer that shifts the containing block
             */
            nearestLayerShiftingContainingBlock?: LayerId;
        }

        /**
         * Serialized fragment of layer picture along with its offset within the layer.
         */
        interface PictureTile {
            /**
             * Offset from owning layer left boundary
             */
            x: number;
            /**
             * Offset from owning layer top boundary
             */
            y: number;
            /**
             * Base64-encoded snapshot data. (Encoded as a base64 string when passed over JSON)
             */
            picture: string;
        }

        /**
         * Information about a compositing layer.
         */
        interface Layer {
            /**
             * The unique id for this layer.
             */
            layerId: LayerId;
            /**
             * The id of parent (not present for root).
             */
            parentLayerId?: LayerId;
            /**
             * The backend id for the node associated with this layer.
             */
            backendNodeId?: DOM.BackendNodeId;
            /**
             * Offset from parent layer, X coordinate.
             */
            offsetX: number;
            /**
             * Offset from parent layer, Y coordinate.
             */
            offsetY: number;
            /**
             * Layer width.
             */
            width: number;
            /**
             * Layer height.
             */
            height: number;
            /**
             * Transformation matrix for layer, default is identity matrix
             */
            transform?: number[];
            /**
             * Transform anchor point X, absent if no transform specified
             */
            anchorX?: number;
            /**
             * Transform anchor point Y, absent if no transform specified
             */
            anchorY?: number;
            /**
             * Transform anchor point Z, absent if no transform specified
             */
            anchorZ?: number;
            /**
             * Indicates how many time this layer has painted.
             */
            paintCount: integer;
            /**
             * Indicates whether this layer hosts any content, rather than being used for
             * transform/scrolling purposes only.
             */
            drawsContent: boolean;
            /**
             * Set if layer is not visible.
             */
            invisible?: boolean;
            /**
             * Rectangles scrolling on main thread only.
             */
            scrollRects?: ScrollRect[];
            /**
             * Sticky position constraint information
             */
            stickyPositionConstraint?: StickyPositionConstraint;
        }

        /**
         * Array of timings, one per paint step.
         */
        type PaintProfile = number[];

        interface CompositingReasonsRequest {
            /**
             * The id of the layer for which we want to get the reasons it was composited.
             */
            layerId: LayerId;
        }

        interface CompositingReasonsResponse {
            /**
             * A list of strings specifying reasons for the given layer to become composited.
             */
            compositingReasons: string[];
            /**
             * A list of strings specifying reason IDs for the given layer to become composited.
             */
            compositingReasonIds: string[];
        }

        interface LoadSnapshotRequest {
            /**
             * An array of tiles composing the snapshot.
             */
            tiles: PictureTile[];
        }

        interface LoadSnapshotResponse {
            /**
             * The id of the snapshot.
             */
            snapshotId: SnapshotId;
        }

        interface MakeSnapshotRequest {
            /**
             * The id of the layer.
             */
            layerId: LayerId;
        }

        interface MakeSnapshotResponse {
            /**
             * The id of the layer snapshot.
             */
            snapshotId: SnapshotId;
        }

        interface ProfileSnapshotRequest {
            /**
             * The id of the layer snapshot.
             */
            snapshotId: SnapshotId;
            /**
             * The maximum number of times to replay the snapshot (1, if not specified).
             */
            minRepeatCount?: integer;
            /**
             * The minimum duration (in seconds) to replay the snapshot.
             */
            minDuration?: number;
            /**
             * The clip rectangle to apply when replaying the snapshot.
             */
            clipRect?: DOM.Rect;
        }

        interface ProfileSnapshotResponse {
            /**
             * The array of paint profiles, one per run.
             */
            timings: PaintProfile[];
        }

        interface ReleaseSnapshotRequest {
            /**
             * The id of the layer snapshot.
             */
            snapshotId: SnapshotId;
        }

        interface ReplaySnapshotRequest {
            /**
             * The id of the layer snapshot.
             */
            snapshotId: SnapshotId;
            /**
             * The first step to replay from (replay from the very start if not specified).
             */
            fromStep?: integer;
            /**
             * The last step to replay to (replay till the end if not specified).
             */
            toStep?: integer;
            /**
             * The scale to apply while replaying (defaults to 1).
             */
            scale?: number;
        }

        interface ReplaySnapshotResponse {
            /**
             * A data: URL for resulting image.
             */
            dataURL: string;
        }

        interface SnapshotCommandLogRequest {
            /**
             * The id of the layer snapshot.
             */
            snapshotId: SnapshotId;
        }

        interface SnapshotCommandLogResponse {
            /**
             * The array of canvas function calls.
             */
            commandLog: any[];
        }

        interface LayerPaintedEvent {
            /**
             * The id of the painted layer.
             */
            layerId: LayerId;
            /**
             * Clip rectangle.
             */
            clip: DOM.Rect;
        }

        interface LayerTreeDidChangeEvent {
            /**
             * Layer tree, absent if not in the comspositing mode.
             */
            layers?: Layer[];
        }
    }

    /**
     * Provides access to log entries.
     */
    namespace Log {

        const enum LogEntrySource {
            XML = 'xml',
            Javascript = 'javascript',
            Network = 'network',
            Storage = 'storage',
            Appcache = 'appcache',
            Rendering = 'rendering',
            Security = 'security',
            Deprecation = 'deprecation',
            Worker = 'worker',
            Violation = 'violation',
            Intervention = 'intervention',
            Recommendation = 'recommendation',
            Other = 'other',
        }

        const enum LogEntryLevel {
            Verbose = 'verbose',
            Info = 'info',
            Warning = 'warning',
            Error = 'error',
        }

        /**
         * Log entry.
         */
        interface LogEntry {
            /**
             * Log entry source. (LogEntrySource enum)
             */
            source: ('xml' | 'javascript' | 'network' | 'storage' | 'appcache' | 'rendering' | 'security' | 'deprecation' | 'worker' | 'violation' | 'intervention' | 'recommendation' | 'other');
            /**
             * Log entry severity. (LogEntryLevel enum)
             */
            level: ('verbose' | 'info' | 'warning' | 'error');
            /**
             * Logged text.
             */
            text: string;
            /**
             * Timestamp when this entry was added.
             */
            timestamp: Runtime.Timestamp;
            /**
             * URL of the resource if known.
             */
            url?: string;
            /**
             * Line number in the resource.
             */
            lineNumber?: integer;
            /**
             * JavaScript stack trace.
             */
            stackTrace?: Runtime.StackTrace;
            /**
             * Identifier of the network request associated with this entry.
             */
            networkRequestId?: Network.RequestId;
            /**
             * Identifier of the worker associated with this entry.
             */
            workerId?: string;
            /**
             * Call arguments.
             */
            args?: Runtime.RemoteObject[];
        }

        const enum ViolationSettingName {
            LongTask = 'longTask',
            LongLayout = 'longLayout',
            BlockedEvent = 'blockedEvent',
            BlockedParser = 'blockedParser',
            DiscouragedAPIUse = 'discouragedAPIUse',
            Handler = 'handler',
            RecurringHandler = 'recurringHandler',
        }

        /**
         * Violation configuration setting.
         */
        interface ViolationSetting {
            /**
             * Violation type. (ViolationSettingName enum)
             */
            name: ('longTask' | 'longLayout' | 'blockedEvent' | 'blockedParser' | 'discouragedAPIUse' | 'handler' | 'recurringHandler');
            /**
             * Time threshold to trigger upon.
             */
            threshold: number;
        }

        interface StartViolationsReportRequest {
            /**
             * Configuration for violations.
             */
            config: ViolationSetting[];
        }

        /**
         * Issued when new message was logged.
         */
        interface EntryAddedEvent {
            /**
             * The entry.
             */
            entry: LogEntry;
        }
    }

    namespace Memory {

        /**
         * Memory pressure level.
         */
        type PressureLevel = ('moderate' | 'critical');

        /**
         * Heap profile sample.
         */
        interface SamplingProfileNode {
            /**
             * Size of the sampled allocation.
             */
            size: number;
            /**
             * Total bytes attributed to this sample.
             */
            total: number;
            /**
             * Execution stack at the point of allocation.
             */
            stack: string[];
        }

        /**
         * Array of heap profile samples.
         */
        interface SamplingProfile {
            samples: SamplingProfileNode[];
            modules: Module[];
        }

        /**
         * Executable module information
         */
        interface Module {
            /**
             * Name of the module.
             */
            name: string;
            /**
             * UUID of the module.
             */
            uuid: string;
            /**
             * Base address where the module is loaded into memory. Encoded as a decimal
             * or hexadecimal (0x prefixed) string.
             */
            baseAddress: string;
            /**
             * Size of the module in bytes.
             */
            size: number;
        }

        interface GetDOMCountersResponse {
            documents: integer;
            nodes: integer;
            jsEventListeners: integer;
        }

        interface SetPressureNotificationsSuppressedRequest {
            /**
             * If true, memory pressure notifications will be suppressed.
             */
            suppressed: boolean;
        }

        interface SimulatePressureNotificationRequest {
            /**
             * Memory pressure level of the notification.
             */
            level: PressureLevel;
        }

        interface StartSamplingRequest {
            /**
             * Average number of bytes between samples.
             */
            samplingInterval?: integer;
            /**
             * Do not randomize intervals between samples.
             */
            suppressRandomness?: boolean;
        }

        interface GetAllTimeSamplingProfileResponse {
            profile: SamplingProfile;
        }

        interface GetBrowserSamplingProfileResponse {
            profile: SamplingProfile;
        }

        interface GetSamplingProfileResponse {
            profile: SamplingProfile;
        }
    }

    /**
     * Network domain allows tracking network activities of the page. It exposes information about http,
     * file, data and other requests and responses, their headers, bodies, timing, etc.
     */
    namespace Network {

        /**
         * Resource type as it was perceived by the rendering engine.
         */
        type ResourceType = ('Document' | 'Stylesheet' | 'Image' | 'Media' | 'Font' | 'Script' | 'TextTrack' | 'XHR' | 'Fetch' | 'EventSource' | 'WebSocket' | 'Manifest' | 'SignedExchange' | 'Ping' | 'CSPViolationReport' | 'Preflight' | 'Other');

        /**
         * Unique loader identifier.
         */
        type LoaderId = string;

        /**
         * Unique request identifier.
         */
        type RequestId = string;

        /**
         * Unique intercepted request identifier.
         */
        type InterceptionId = string;

        /**
         * Network level fetch failure reason.
         */
        type ErrorReason = ('Failed' | 'Aborted' | 'TimedOut' | 'AccessDenied' | 'ConnectionClosed' | 'ConnectionReset' | 'ConnectionRefused' | 'ConnectionAborted' | 'ConnectionFailed' | 'NameNotResolved' | 'InternetDisconnected' | 'AddressUnreachable' | 'BlockedByClient' | 'BlockedByResponse');

        /**
         * UTC time in seconds, counted from January 1, 1970.
         */
        type TimeSinceEpoch = number;

        /**
         * Monotonically increasing time in seconds since an arbitrary point in the past.
         */
        type MonotonicTime = number;

        /**
         * Request / response headers as keys / values of JSON object.
         */
        interface Headers {
            [key: string]: string;
        }

        /**
         * The underlying connection technology that the browser is supposedly using.
         */
        type ConnectionType = ('none' | 'cellular2g' | 'cellular3g' | 'cellular4g' | 'bluetooth' | 'ethernet' | 'wifi' | 'wimax' | 'other');

        /**
         * Represents the cookie's 'SameSite' status:
         * https://tools.ietf.org/html/draft-west-first-party-cookies
         */
        type CookieSameSite = ('Strict' | 'Lax' | 'None');

        /**
         * Represents the cookie's 'Priority' status:
         * https://tools.ietf.org/html/draft-west-cookie-priority-00
         */
        type CookiePriority = ('Low' | 'Medium' | 'High');

        /**
         * Represents the source scheme of the origin that originally set the cookie.
         * A value of "Unset" allows protocol clients to emulate legacy cookie scope for the scheme.
         * This is a temporary ability and it will be removed in the future.
         */
        type CookieSourceScheme = ('Unset' | 'NonSecure' | 'Secure');

        /**
         * Timing information for the request.
         */
        interface ResourceTiming {
            /**
             * Timing's requestTime is a baseline in seconds, while the other numbers are ticks in
             * milliseconds relatively to this requestTime.
             */
            requestTime: number;
            /**
             * Started resolving proxy.
             */
            proxyStart: number;
            /**
             * Finished resolving proxy.
             */
            proxyEnd: number;
            /**
             * Started DNS address resolve.
             */
            dnsStart: number;
            /**
             * Finished DNS address resolve.
             */
            dnsEnd: number;
            /**
             * Started connecting to the remote host.
             */
            connectStart: number;
            /**
             * Connected to the remote host.
             */
            connectEnd: number;
            /**
             * Started SSL handshake.
             */
            sslStart: number;
            /**
             * Finished SSL handshake.
             */
            sslEnd: number;
            /**
             * Started running ServiceWorker.
             */
            workerStart: number;
            /**
             * Finished Starting ServiceWorker.
             */
            workerReady: number;
            /**
             * Started fetch event.
             */
            workerFetchStart: number;
            /**
             * Settled fetch event respondWith promise.
             */
            workerRespondWithSettled: number;
            /**
             * Started sending request.
             */
            sendStart: number;
            /**
             * Finished sending request.
             */
            sendEnd: number;
            /**
             * Time the server started pushing request.
             */
            pushStart: number;
            /**
             * Time the server finished pushing request.
             */
            pushEnd: number;
            /**
             * Finished receiving response headers.
             */
            receiveHeadersEnd: number;
        }

        /**
         * Loading priority of a resource request.
         */
        type ResourcePriority = ('VeryLow' | 'Low' | 'Medium' | 'High' | 'VeryHigh');

        /**
         * Post data entry for HTTP request
         */
        interface PostDataEntry {
            bytes?: string;
        }

        const enum RequestReferrerPolicy {
            UnsafeUrl = 'unsafe-url',
            NoReferrerWhenDowngrade = 'no-referrer-when-downgrade',
            NoReferrer = 'no-referrer',
            Origin = 'origin',
            OriginWhenCrossOrigin = 'origin-when-cross-origin',
            SameOrigin = 'same-origin',
            StrictOrigin = 'strict-origin',
            StrictOriginWhenCrossOrigin = 'strict-origin-when-cross-origin',
        }

        /**
         * HTTP request data.
         */
        interface Request {
            /**
             * Request URL (without fragment).
             */
            url: string;
            /**
             * Fragment of the requested URL starting with hash, if present.
             */
            urlFragment?: string;
            /**
             * HTTP request method.
             */
            method: string;
            /**
             * HTTP request headers.
             */
            headers: Headers;
            /**
             * HTTP POST request data.
             */
            postData?: string;
            /**
             * True when the request has POST data. Note that postData might still be omitted when this flag is true when the data is too long.
             */
            hasPostData?: boolean;
            /**
             * Request body elements. This will be converted from base64 to binary
             */
            postDataEntries?: PostDataEntry[];
            /**
             * The mixed content type of the request.
             */
            mixedContentType?: Security.MixedContentType;
            /**
             * Priority of the resource request at the time request is sent.
             */
            initialPriority: ResourcePriority;
            /**
             * The referrer policy of the request, as defined in https://www.w3.org/TR/referrer-policy/ (RequestReferrerPolicy enum)
             */
            referrerPolicy: ('unsafe-url' | 'no-referrer-when-downgrade' | 'no-referrer' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin');
            /**
             * Whether is loaded via link preload.
             */
            isLinkPreload?: boolean;
            /**
             * Set for requests when the TrustToken API is used. Contains the parameters
             * passed by the developer (e.g. via "fetch") as understood by the backend.
             */
            trustTokenParams?: TrustTokenParams;
        }

        /**
         * Details of a signed certificate timestamp (SCT).
         */
        interface SignedCertificateTimestamp {
            /**
             * Validation status.
             */
            status: string;
            /**
             * Origin.
             */
            origin: string;
            /**
             * Log name / description.
             */
            logDescription: string;
            /**
             * Log ID.
             */
            logId: string;
            /**
             * Issuance date.
             */
            timestamp: TimeSinceEpoch;
            /**
             * Hash algorithm.
             */
            hashAlgorithm: string;
            /**
             * Signature algorithm.
             */
            signatureAlgorithm: string;
            /**
             * Signature data.
             */
            signatureData: string;
        }

        /**
         * Security details about a request.
         */
        interface SecurityDetails {
            /**
             * Protocol name (e.g. "TLS 1.2" or "QUIC").
             */
            protocol: string;
            /**
             * Key Exchange used by the connection, or the empty string if not applicable.
             */
            keyExchange: string;
            /**
             * (EC)DH group used by the connection, if applicable.
             */
            keyExchangeGroup?: string;
            /**
             * Cipher name.
             */
            cipher: string;
            /**
             * TLS MAC. Note that AEAD ciphers do not have separate MACs.
             */
            mac?: string;
            /**
             * Certificate ID value.
             */
            certificateId: Security.CertificateId;
            /**
             * Certificate subject name.
             */
            subjectName: string;
            /**
             * Subject Alternative Name (SAN) DNS names and IP addresses.
             */
            sanList: string[];
            /**
             * Name of the issuing CA.
             */
            issuer: string;
            /**
             * Certificate valid from date.
             */
            validFrom: TimeSinceEpoch;
            /**
             * Certificate valid to (expiration) date
             */
            validTo: TimeSinceEpoch;
            /**
             * List of signed certificate timestamps (SCTs).
             */
            signedCertificateTimestampList: SignedCertificateTimestamp[];
            /**
             * Whether the request complied with Certificate Transparency policy
             */
            certificateTransparencyCompliance: CertificateTransparencyCompliance;
        }

        /**
         * Whether the request complied with Certificate Transparency policy.
         */
        type CertificateTransparencyCompliance = ('unknown' | 'not-compliant' | 'compliant');

        /**
         * The reason why request was blocked.
         */
        type BlockedReason = ('other' | 'csp' | 'mixed-content' | 'origin' | 'inspector' | 'subresource-filter' | 'content-type' | 'collapsed-by-client' | 'coep-frame-resource-needs-coep-header' | 'coop-sandboxed-iframe-cannot-navigate-to-coop-page' | 'corp-not-same-origin' | 'corp-not-same-origin-after-defaulted-to-same-origin-by-coep' | 'corp-not-same-site');

        /**
         * The reason why request was blocked.
         */
        type CorsError = ('DisallowedByMode' | 'InvalidResponse' | 'WildcardOriginNotAllowed' | 'MissingAllowOriginHeader' | 'MultipleAllowOriginValues' | 'InvalidAllowOriginValue' | 'AllowOriginMismatch' | 'InvalidAllowCredentials' | 'CorsDisabledScheme' | 'PreflightInvalidStatus' | 'PreflightDisallowedRedirect' | 'PreflightWildcardOriginNotAllowed' | 'PreflightMissingAllowOriginHeader' | 'PreflightMultipleAllowOriginValues' | 'PreflightInvalidAllowOriginValue' | 'PreflightAllowOriginMismatch' | 'PreflightInvalidAllowCredentials' | 'PreflightMissingAllowExternal' | 'PreflightInvalidAllowExternal' | 'InvalidAllowMethodsPreflightResponse' | 'InvalidAllowHeadersPreflightResponse' | 'MethodDisallowedByPreflightResponse' | 'HeaderDisallowedByPreflightResponse' | 'RedirectContainsCredentials' | 'InsecurePrivateNetwork');

        interface CorsErrorStatus {
            corsError: CorsError;
            failedParameter: string;
        }

        /**
         * Source of serviceworker response.
         */
        type ServiceWorkerResponseSource = ('cache-storage' | 'http-cache' | 'fallback-code' | 'network');

        const enum TrustTokenParamsRefreshPolicy {
            UseCached = 'UseCached',
            Refresh = 'Refresh',
        }

        /**
         * Determines what type of Trust Token operation is executed and
         * depending on the type, some additional parameters. The values
         * are specified in third_party/blink/renderer/core/fetch/trust_token.idl.
         */
        interface TrustTokenParams {
            type: TrustTokenOperationType;
            /**
             * Only set for "token-redemption" type and determine whether
             * to request a fresh SRR or use a still valid cached SRR. (TrustTokenParamsRefreshPolicy enum)
             */
            refreshPolicy: ('UseCached' | 'Refresh');
            /**
             * Origins of issuers from whom to request tokens or redemption
             * records.
             */
            issuers?: string[];
        }

        type TrustTokenOperationType = ('Issuance' | 'Redemption' | 'Signing');

        /**
         * HTTP response data.
         */
        interface Response {
            /**
             * Response URL. This URL can be different from CachedResource.url in case of redirect.
             */
            url: string;
            /**
             * HTTP response status code.
             */
            status: integer;
            /**
             * HTTP response status text.
             */
            statusText: string;
            /**
             * HTTP response headers.
             */
            headers: Headers;
            /**
             * HTTP response headers text.
             */
            headersText?: string;
            /**
             * Resource mimeType as determined by the browser.
             */
            mimeType: string;
            /**
             * Refined HTTP request headers that were actually transmitted over the network.
             */
            requestHeaders?: Headers;
            /**
             * HTTP request headers text.
             */
            requestHeadersText?: string;
            /**
             * Specifies whether physical connection was actually reused for this request.
             */
            connectionReused: boolean;
            /**
             * Physical connection id that was actually used for this request.
             */
            connectionId: number;
            /**
             * Remote IP address.
             */
            remoteIPAddress?: string;
            /**
             * Remote port.
             */
            remotePort?: integer;
            /**
             * Specifies that the request was served from the disk cache.
             */
            fromDiskCache?: boolean;
            /**
             * Specifies that the request was served from the ServiceWorker.
             */
            fromServiceWorker?: boolean;
            /**
             * Specifies that the request was served from the prefetch cache.
             */
            fromPrefetchCache?: boolean;
            /**
             * Total number of bytes received for this request so far.
             */
            encodedDataLength: number;
            /**
             * Timing information for the given request.
             */
            timing?: ResourceTiming;
            /**
             * Response source of response from ServiceWorker.
             */
            serviceWorkerResponseSource?: ServiceWorkerResponseSource;
            /**
             * The time at which the returned response was generated.
             */
            responseTime?: TimeSinceEpoch;
            /**
             * Cache Storage Cache Name.
             */
            cacheStorageCacheName?: string;
            /**
             * Protocol used to fetch this request.
             */
            protocol?: string;
            /**
             * Security state of the request resource.
             */
            securityState: Security.SecurityState;
            /**
             * Security details for the request.
             */
            securityDetails?: SecurityDetails;
        }

        /**
         * WebSocket request data.
         */
        interface WebSocketRequest {
            /**
             * HTTP request headers.
             */
            headers: Headers;
        }

        /**
         * WebSocket response data.
         */
        interface WebSocketResponse {
            /**
             * HTTP response status code.
             */
            status: integer;
            /**
             * HTTP response status text.
             */
            statusText: string;
            /**
             * HTTP response headers.
             */
            headers: Headers;
            /**
             * HTTP response headers text.
             */
            headersText?: string;
            /**
             * HTTP request headers.
             */
            requestHeaders?: Headers;
            /**
             * HTTP request headers text.
             */
            requestHeadersText?: string;
        }

        /**
         * WebSocket message data. This represents an entire WebSocket message, not just a fragmented frame as the name suggests.
         */
        interface WebSocketFrame {
            /**
             * WebSocket message opcode.
             */
            opcode: number;
            /**
             * WebSocket message mask.
             */
            mask: boolean;
            /**
             * WebSocket message payload data.
             * If the opcode is 1, this is a text message and payloadData is a UTF-8 string.
             * If the opcode isn't 1, then payloadData is a base64 encoded string representing binary data.
             */
            payloadData: string;
        }

        /**
         * Information about the cached resource.
         */
        interface CachedResource {
            /**
             * Resource URL. This is the url of the original network request.
             */
            url: string;
            /**
             * Type of this resource.
             */
            type: ResourceType;
            /**
             * Cached response data.
             */
            response?: Response;
            /**
             * Cached response body size.
             */
            bodySize: number;
        }

        const enum InitiatorType {
            Parser = 'parser',
            Script = 'script',
            Preload = 'preload',
            SignedExchange = 'SignedExchange',
            Preflight = 'preflight',
            Other = 'other',
        }

        /**
         * Information about the request initiator.
         */
        interface Initiator {
            /**
             * Type of this initiator. (InitiatorType enum)
             */
            type: ('parser' | 'script' | 'preload' | 'SignedExchange' | 'preflight' | 'other');
            /**
             * Initiator JavaScript stack trace, set for Script only.
             */
            stack?: Runtime.StackTrace;
            /**
             * Initiator URL, set for Parser type or for Script type (when script is importing module) or for SignedExchange type.
             */
            url?: string;
            /**
             * Initiator line number, set for Parser type or for Script type (when script is importing
             * module) (0-based).
             */
            lineNumber?: number;
            /**
             * Initiator column number, set for Parser type or for Script type (when script is importing
             * module) (0-based).
             */
            columnNumber?: number;
            /**
             * Set if another request triggered this request (e.g. preflight).
             */
            requestId?: RequestId;
        }

        /**
         * Cookie object
         */
        interface Cookie {
            /**
             * Cookie name.
             */
            name: string;
            /**
             * Cookie value.
             */
            value: string;
            /**
             * Cookie domain.
             */
            domain: string;
            /**
             * Cookie path.
             */
            path: string;
            /**
             * Cookie expiration date as the number of seconds since the UNIX epoch.
             */
            expires: number;
            /**
             * Cookie size.
             */
            size: integer;
            /**
             * True if cookie is http-only.
             */
            httpOnly: boolean;
            /**
             * True if cookie is secure.
             */
            secure: boolean;
            /**
             * True in case of session cookie.
             */
            session: boolean;
            /**
             * Cookie SameSite type.
             */
            sameSite?: CookieSameSite;
            /**
             * Cookie Priority
             */
            priority: CookiePriority;
            /**
             * True if cookie is SameParty.
             */
            sameParty: boolean;
            /**
             * Cookie source scheme type.
             */
            sourceScheme: CookieSourceScheme;
            /**
             * Cookie source port. Valid values are {-1, [1, 65535]}, -1 indicates an unspecified port.
             * An unspecified port value allows protocol clients to emulate legacy cookie scope for the port.
             * This is a temporary ability and it will be removed in the future.
             */
            sourcePort: integer;
        }

        /**
         * Types of reasons why a cookie may not be stored from a response.
         */
        type SetCookieBlockedReason = ('SecureOnly' | 'SameSiteStrict' | 'SameSiteLax' | 'SameSiteUnspecifiedTreatedAsLax' | 'SameSiteNoneInsecure' | 'UserPreferences' | 'SyntaxError' | 'SchemeNotSupported' | 'OverwriteSecure' | 'InvalidDomain' | 'InvalidPrefix' | 'UnknownError' | 'SchemefulSameSiteStrict' | 'SchemefulSameSiteLax' | 'SchemefulSameSiteUnspecifiedTreatedAsLax' | 'SamePartyFromCrossPartyContext' | 'SamePartyConflictsWithOtherAttributes');

        /**
         * Types of reasons why a cookie may not be sent with a request.
         */
        type CookieBlockedReason = ('SecureOnly' | 'NotOnPath' | 'DomainMismatch' | 'SameSiteStrict' | 'SameSiteLax' | 'SameSiteUnspecifiedTreatedAsLax' | 'SameSiteNoneInsecure' | 'UserPreferences' | 'UnknownError' | 'SchemefulSameSiteStrict' | 'SchemefulSameSiteLax' | 'SchemefulSameSiteUnspecifiedTreatedAsLax' | 'SamePartyFromCrossPartyContext');

        /**
         * A cookie which was not stored from a response with the corresponding reason.
         */
        interface BlockedSetCookieWithReason {
            /**
             * The reason(s) this cookie was blocked.
             */
            blockedReasons: SetCookieBlockedReason[];
            /**
             * The string representing this individual cookie as it would appear in the header.
             * This is not the entire "cookie" or "set-cookie" header which could have multiple cookies.
             */
            cookieLine: string;
            /**
             * The cookie object which represents the cookie which was not stored. It is optional because
             * sometimes complete cookie information is not available, such as in the case of parsing
             * errors.
             */
            cookie?: Cookie;
        }

        /**
         * A cookie with was not sent with a request with the corresponding reason.
         */
        interface BlockedCookieWithReason {
            /**
             * The reason(s) the cookie was blocked.
             */
            blockedReasons: CookieBlockedReason[];
            /**
             * The cookie object representing the cookie which was not sent.
             */
            cookie: Cookie;
        }

        /**
         * Cookie parameter object
         */
        interface CookieParam {
            /**
             * Cookie name.
             */
            name: string;
            /**
             * Cookie value.
             */
            value: string;
            /**
             * The request-URI to associate with the setting of the cookie. This value can affect the
             * default domain, path, source port, and source scheme values of the created cookie.
             */
            url?: string;
            /**
             * Cookie domain.
             */
            domain?: string;
            /**
             * Cookie path.
             */
            path?: string;
            /**
             * True if cookie is secure.
             */
            secure?: boolean;
            /**
             * True if cookie is http-only.
             */
            httpOnly?: boolean;
            /**
             * Cookie SameSite type.
             */
            sameSite?: CookieSameSite;
            /**
             * Cookie expiration date, session cookie if not set
             */
            expires?: TimeSinceEpoch;
            /**
             * Cookie Priority.
             */
            priority?: CookiePriority;
            /**
             * True if cookie is SameParty.
             */
            sameParty?: boolean;
            /**
             * Cookie source scheme type.
             */
            sourceScheme?: CookieSourceScheme;
            /**
             * Cookie source port. Valid values are {-1, [1, 65535]}, -1 indicates an unspecified port.
             * An unspecified port value allows protocol clients to emulate legacy cookie scope for the port.
             * This is a temporary ability and it will be removed in the future.
             */
            sourcePort?: integer;
        }

        const enum AuthChallengeSource {
            Server = 'Server',
            Proxy = 'Proxy',
        }

        /**
         * Authorization challenge for HTTP status code 401 or 407.
         */
        interface AuthChallenge {
            /**
             * Source of the authentication challenge. (AuthChallengeSource enum)
             */
            source?: ('Server' | 'Proxy');
            /**
             * Origin of the challenger.
             */
            origin: string;
            /**
             * The authentication scheme used, such as basic or digest
             */
            scheme: string;
            /**
             * The realm of the challenge. May be empty.
             */
            realm: string;
        }

        const enum AuthChallengeResponseResponse {
            Default = 'Default',
            CancelAuth = 'CancelAuth',
            ProvideCredentials = 'ProvideCredentials',
        }

        /**
         * Response to an AuthChallenge.
         */
        interface AuthChallengeResponse {
            /**
             * The decision on what to do in response to the authorization challenge.  Default means
             * deferring to the default behavior of the net stack, which will likely either the Cancel
             * authentication or display a popup dialog box. (AuthChallengeResponseResponse enum)
             */
            response: ('Default' | 'CancelAuth' | 'ProvideCredentials');
            /**
             * The username to provide, possibly empty. Should only be set if response is
             * ProvideCredentials.
             */
            username?: string;
            /**
             * The password to provide, possibly empty. Should only be set if response is
             * ProvideCredentials.
             */
            password?: string;
        }

        /**
         * Stages of the interception to begin intercepting. Request will intercept before the request is
         * sent. Response will intercept after the response is received.
         */
        type InterceptionStage = ('Request' | 'HeadersReceived');

        /**
         * Request pattern for interception.
         */
        interface RequestPattern {
            /**
             * Wildcards ('*' -> zero or more, '?' -> exactly one) are allowed. Escape character is
             * backslash. Omitting is equivalent to "*".
             */
            urlPattern?: string;
            /**
             * If set, only requests for matching resource types will be intercepted.
             */
            resourceType?: ResourceType;
            /**
             * Stage at wich to begin intercepting requests. Default is Request.
             */
            interceptionStage?: InterceptionStage;
        }

        /**
         * Information about a signed exchange signature.
         * https://wicg.github.io/webpackage/draft-yasskin-httpbis-origin-signed-exchanges-impl.html#rfc.section.3.1
         */
        interface SignedExchangeSignature {
            /**
             * Signed exchange signature label.
             */
            label: string;
            /**
             * The hex string of signed exchange signature.
             */
            signature: string;
            /**
             * Signed exchange signature integrity.
             */
            integrity: string;
            /**
             * Signed exchange signature cert Url.
             */
            certUrl?: string;
            /**
             * The hex string of signed exchange signature cert sha256.
             */
            certSha256?: string;
            /**
             * Signed exchange signature validity Url.
             */
            validityUrl: string;
            /**
             * Signed exchange signature date.
             */
            date: integer;
            /**
             * Signed exchange signature expires.
             */
            expires: integer;
            /**
             * The encoded certificates.
             */
            certificates?: string[];
        }

        /**
         * Information about a signed exchange header.
         * https://wicg.github.io/webpackage/draft-yasskin-httpbis-origin-signed-exchanges-impl.html#cbor-representation
         */
        interface SignedExchangeHeader {
            /**
             * Signed exchange request URL.
             */
            requestUrl: string;
            /**
             * Signed exchange response code.
             */
            responseCode: integer;
            /**
             * Signed exchange response headers.
             */
            responseHeaders: Headers;
            /**
             * Signed exchange response signature.
             */
            signatures: SignedExchangeSignature[];
            /**
             * Signed exchange header integrity hash in the form of "sha256-<base64-hash-value>".
             */
            headerIntegrity: string;
        }

        /**
         * Field type for a signed exchange related error.
         */
        type SignedExchangeErrorField = ('signatureSig' | 'signatureIntegrity' | 'signatureCertUrl' | 'signatureCertSha256' | 'signatureValidityUrl' | 'signatureTimestamps');

        /**
         * Information about a signed exchange response.
         */
        interface SignedExchangeError {
            /**
             * Error message.
             */
            message: string;
            /**
             * The index of the signature which caused the error.
             */
            signatureIndex?: integer;
            /**
             * The field which caused the error.
             */
            errorField?: SignedExchangeErrorField;
        }

        /**
         * Information about a signed exchange response.
         */
        interface SignedExchangeInfo {
            /**
             * The outer response of signed HTTP exchange which was received from network.
             */
            outerResponse: Response;
            /**
             * Information about the signed exchange header.
             */
            header?: SignedExchangeHeader;
            /**
             * Security details for the signed exchange header.
             */
            securityDetails?: SecurityDetails;
            /**
             * Errors occurred while handling the signed exchagne.
             */
            errors?: SignedExchangeError[];
        }

        type PrivateNetworkRequestPolicy = ('Allow' | 'BlockFromInsecureToMorePrivate' | 'WarnFromInsecureToMorePrivate');

        type IPAddressSpace = ('Local' | 'Private' | 'Public' | 'Unknown');

        interface ClientSecurityState {
            initiatorIsSecureContext: boolean;
            initiatorIPAddressSpace: IPAddressSpace;
            privateNetworkRequestPolicy: PrivateNetworkRequestPolicy;
        }

        type CrossOriginOpenerPolicyValue = ('SameOrigin' | 'SameOriginAllowPopups' | 'UnsafeNone' | 'SameOriginPlusCoep');

        interface CrossOriginOpenerPolicyStatus {
            value: CrossOriginOpenerPolicyValue;
            reportOnlyValue: CrossOriginOpenerPolicyValue;
            reportingEndpoint?: string;
            reportOnlyReportingEndpoint?: string;
        }

        type CrossOriginEmbedderPolicyValue = ('None' | 'RequireCorp');

        interface CrossOriginEmbedderPolicyStatus {
            value: CrossOriginEmbedderPolicyValue;
            reportOnlyValue: CrossOriginEmbedderPolicyValue;
            reportingEndpoint?: string;
            reportOnlyReportingEndpoint?: string;
        }

        interface SecurityIsolationStatus {
            coop?: CrossOriginOpenerPolicyStatus;
            coep?: CrossOriginEmbedderPolicyStatus;
        }

        /**
         * An object providing the result of a network resource load.
         */
        interface LoadNetworkResourcePageResult {
            success: boolean;
            /**
             * Optional values used for error reporting.
             */
            netError?: number;
            netErrorName?: string;
            httpStatusCode?: number;
            /**
             * If successful, one of the following two fields holds the result.
             */
            stream?: IO.StreamHandle;
            /**
             * Response headers.
             */
            headers?: Network.Headers;
        }

        /**
         * An options object that may be extended later to better support CORS,
         * CORB and streaming.
         */
        interface LoadNetworkResourceOptions {
            disableCache: boolean;
            includeCredentials: boolean;
        }

        interface CanClearBrowserCacheResponse {
            /**
             * True if browser cache can be cleared.
             */
            result: boolean;
        }

        interface CanClearBrowserCookiesResponse {
            /**
             * True if browser cookies can be cleared.
             */
            result: boolean;
        }

        interface CanEmulateNetworkConditionsResponse {
            /**
             * True if emulation of network conditions is supported.
             */
            result: boolean;
        }

        interface ContinueInterceptedRequestRequest {
            interceptionId: InterceptionId;
            /**
             * If set this causes the request to fail with the given reason. Passing `Aborted` for requests
             * marked with `isNavigationRequest` also cancels the navigation. Must not be set in response
             * to an authChallenge.
             */
            errorReason?: ErrorReason;
            /**
             * If set the requests completes using with the provided base64 encoded raw response, including
             * HTTP status line and headers etc... Must not be set in response to an authChallenge. (Encoded as a base64 string when passed over JSON)
             */
            rawResponse?: string;
            /**
             * If set the request url will be modified in a way that's not observable by page. Must not be
             * set in response to an authChallenge.
             */
            url?: string;
            /**
             * If set this allows the request method to be overridden. Must not be set in response to an
             * authChallenge.
             */
            method?: string;
            /**
             * If set this allows postData to be set. Must not be set in response to an authChallenge.
             */
            postData?: string;
            /**
             * If set this allows the request headers to be changed. Must not be set in response to an
             * authChallenge.
             */
            headers?: Headers;
            /**
             * Response to a requestIntercepted with an authChallenge. Must not be set otherwise.
             */
            authChallengeResponse?: AuthChallengeResponse;
        }

        interface DeleteCookiesRequest {
            /**
             * Name of the cookies to remove.
             */
            name: string;
            /**
             * If specified, deletes all the cookies with the given name where domain and path match
             * provided URL.
             */
            url?: string;
            /**
             * If specified, deletes only cookies with the exact domain.
             */
            domain?: string;
            /**
             * If specified, deletes only cookies with the exact path.
             */
            path?: string;
        }

        interface EmulateNetworkConditionsRequest {
            /**
             * True to emulate internet disconnection.
             */
            offline: boolean;
            /**
             * Minimum latency from request sent to response headers received (ms).
             */
            latency: number;
            /**
             * Maximal aggregated download throughput (bytes/sec). -1 disables download throttling.
             */
            downloadThroughput: number;
            /**
             * Maximal aggregated upload throughput (bytes/sec).  -1 disables upload throttling.
             */
            uploadThroughput: number;
            /**
             * Connection type if known.
             */
            connectionType?: ConnectionType;
        }

        interface EnableRequest {
            /**
             * Buffer size in bytes to use when preserving network payloads (XHRs, etc).
             */
            maxTotalBufferSize?: integer;
            /**
             * Per-resource buffer size in bytes to use when preserving network payloads (XHRs, etc).
             */
            maxResourceBufferSize?: integer;
            /**
             * Longest post body size (in bytes) that would be included in requestWillBeSent notification
             */
            maxPostDataSize?: integer;
        }

        interface GetAllCookiesResponse {
            /**
             * Array of cookie objects.
             */
            cookies: Cookie[];
        }

        interface GetCertificateRequest {
            /**
             * Origin to get certificate for.
             */
            origin: string;
        }

        interface GetCertificateResponse {
            tableNames: string[];
        }

        interface GetCookiesRequest {
            /**
             * The list of URLs for which applicable cookies will be fetched.
             * If not specified, it's assumed to be set to the list containing
             * the URLs of the page and all of its subframes.
             */
            urls?: string[];
        }

        interface GetCookiesResponse {
            /**
             * Array of cookie objects.
             */
            cookies: Cookie[];
        }

        interface GetResponseBodyRequest {
            /**
             * Identifier of the network request to get content for.
             */
            requestId: RequestId;
        }

        interface GetResponseBodyResponse {
            /**
             * Response body.
             */
            body: string;
            /**
             * True, if content was sent as base64.
             */
            base64Encoded: boolean;
        }

        interface GetRequestPostDataRequest {
            /**
             * Identifier of the network request to get content for.
             */
            requestId: RequestId;
        }

        interface GetRequestPostDataResponse {
            /**
             * Request body string, omitting files from multipart requests
             */
            postData: string;
        }

        interface GetResponseBodyForInterceptionRequest {
            /**
             * Identifier for the intercepted request to get body for.
             */
            interceptionId: InterceptionId;
        }

        interface GetResponseBodyForInterceptionResponse {
            /**
             * Response body.
             */
            body: string;
            /**
             * True, if content was sent as base64.
             */
            base64Encoded: boolean;
        }

        interface TakeResponseBodyForInterceptionAsStreamRequest {
            interceptionId: InterceptionId;
        }

        interface TakeResponseBodyForInterceptionAsStreamResponse {
            stream: IO.StreamHandle;
        }

        interface ReplayXHRRequest {
            /**
             * Identifier of XHR to replay.
             */
            requestId: RequestId;
        }

        interface SearchInResponseBodyRequest {
            /**
             * Identifier of the network response to search.
             */
            requestId: RequestId;
            /**
             * String to search for.
             */
            query: string;
            /**
             * If true, search is case sensitive.
             */
            caseSensitive?: boolean;
            /**
             * If true, treats string parameter as regex.
             */
            isRegex?: boolean;
        }

        interface SearchInResponseBodyResponse {
            /**
             * List of search matches.
             */
            result: Debugger.SearchMatch[];
        }

        interface SetBlockedURLsRequest {
            /**
             * URL patterns to block. Wildcards ('*') are allowed.
             */
            urls: string[];
        }

        interface SetBypassServiceWorkerRequest {
            /**
             * Bypass service worker and load from network.
             */
            bypass: boolean;
        }

        interface SetCacheDisabledRequest {
            /**
             * Cache disabled state.
             */
            cacheDisabled: boolean;
        }

        interface SetCookieRequest {
            /**
             * Cookie name.
             */
            name: string;
            /**
             * Cookie value.
             */
            value: string;
            /**
             * The request-URI to associate with the setting of the cookie. This value can affect the
             * default domain, path, source port, and source scheme values of the created cookie.
             */
            url?: string;
            /**
             * Cookie domain.
             */
            domain?: string;
            /**
             * Cookie path.
             */
            path?: string;
            /**
             * True if cookie is secure.
             */
            secure?: boolean;
            /**
             * True if cookie is http-only.
             */
            httpOnly?: boolean;
            /**
             * Cookie SameSite type.
             */
            sameSite?: CookieSameSite;
            /**
             * Cookie expiration date, session cookie if not set
             */
            expires?: TimeSinceEpoch;
            /**
             * Cookie Priority type.
             */
            priority?: CookiePriority;
            /**
             * True if cookie is SameParty.
             */
            sameParty?: boolean;
            /**
             * Cookie source scheme type.
             */
            sourceScheme?: CookieSourceScheme;
            /**
             * Cookie source port. Valid values are {-1, [1, 65535]}, -1 indicates an unspecified port.
             * An unspecified port value allows protocol clients to emulate legacy cookie scope for the port.
             * This is a temporary ability and it will be removed in the future.
             */
            sourcePort?: integer;
        }

        interface SetCookieResponse {
            /**
             * Always set to true. If an error occurs, the response indicates protocol error.
             */
            success: boolean;
        }

        interface SetCookiesRequest {
            /**
             * Cookies to be set.
             */
            cookies: CookieParam[];
        }

        interface SetDataSizeLimitsForTestRequest {
            /**
             * Maximum total buffer size.
             */
            maxTotalSize: integer;
            /**
             * Maximum per-resource size.
             */
            maxResourceSize: integer;
        }

        interface SetExtraHTTPHeadersRequest {
            /**
             * Map with extra HTTP headers.
             */
            headers: Headers;
        }

        interface SetAttachDebugStackRequest {
            /**
             * Whether to attach a page script stack for debugging purpose.
             */
            enabled: boolean;
        }

        interface SetRequestInterceptionRequest {
            /**
             * Requests matching any of these patterns will be forwarded and wait for the corresponding
             * continueInterceptedRequest call.
             */
            patterns: RequestPattern[];
        }

        interface SetUserAgentOverrideRequest {
            /**
             * User agent to use.
             */
            userAgent: string;
            /**
             * Browser langugage to emulate.
             */
            acceptLanguage?: string;
            /**
             * The platform navigator.platform should return.
             */
            platform?: string;
            /**
             * To be sent in Sec-CH-UA-* headers and returned in navigator.userAgentData
             */
            userAgentMetadata?: Emulation.UserAgentMetadata;
        }

        interface GetSecurityIsolationStatusRequest {
            /**
             * If no frameId is provided, the status of the target is provided.
             */
            frameId?: Page.FrameId;
        }

        interface GetSecurityIsolationStatusResponse {
            status: SecurityIsolationStatus;
        }

        interface LoadNetworkResourceRequest {
            /**
             * Frame id to get the resource for.
             */
            frameId: Page.FrameId;
            /**
             * URL of the resource to get content for.
             */
            url: string;
            /**
             * Options for the request.
             */
            options: LoadNetworkResourceOptions;
        }

        interface LoadNetworkResourceResponse {
            resource: LoadNetworkResourcePageResult;
        }

        /**
         * Fired when data chunk was received over the network.
         */
        interface DataReceivedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * Data chunk length.
             */
            dataLength: integer;
            /**
             * Actual bytes received (might be less than dataLength for compressed encodings).
             */
            encodedDataLength: integer;
        }

        /**
         * Fired when EventSource message is received.
         */
        interface EventSourceMessageReceivedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * Message type.
             */
            eventName: string;
            /**
             * Message identifier.
             */
            eventId: string;
            /**
             * Message content.
             */
            data: string;
        }

        /**
         * Fired when HTTP request has failed to load.
         */
        interface LoadingFailedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * Resource type.
             */
            type: ResourceType;
            /**
             * User friendly error message.
             */
            errorText: string;
            /**
             * True if loading was canceled.
             */
            canceled?: boolean;
            /**
             * The reason why loading was blocked, if any.
             */
            blockedReason?: BlockedReason;
            /**
             * The reason why loading was blocked by CORS, if any.
             */
            corsErrorStatus?: CorsErrorStatus;
        }

        /**
         * Fired when HTTP request has finished loading.
         */
        interface LoadingFinishedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * Total number of bytes received for this request.
             */
            encodedDataLength: number;
            /**
             * Set when 1) response was blocked by Cross-Origin Read Blocking and also
             * 2) this needs to be reported to the DevTools console.
             */
            shouldReportCorbBlocking?: boolean;
        }

        /**
         * Details of an intercepted HTTP request, which must be either allowed, blocked, modified or
         * mocked.
         * Deprecated, use Fetch.requestPaused instead.
         */
        interface RequestInterceptedEvent {
            /**
             * Each request the page makes will have a unique id, however if any redirects are encountered
             * while processing that fetch, they will be reported with the same id as the original fetch.
             * Likewise if HTTP authentication is needed then the same fetch id will be used.
             */
            interceptionId: InterceptionId;
            request: Request;
            /**
             * The id of the frame that initiated the request.
             */
            frameId: Page.FrameId;
            /**
             * How the requested resource will be used.
             */
            resourceType: ResourceType;
            /**
             * Whether this is a navigation request, which can abort the navigation completely.
             */
            isNavigationRequest: boolean;
            /**
             * Set if the request is a navigation that will result in a download.
             * Only present after response is received from the server (i.e. HeadersReceived stage).
             */
            isDownload?: boolean;
            /**
             * Redirect location, only sent if a redirect was intercepted.
             */
            redirectUrl?: string;
            /**
             * Details of the Authorization Challenge encountered. If this is set then
             * continueInterceptedRequest must contain an authChallengeResponse.
             */
            authChallenge?: AuthChallenge;
            /**
             * Response error if intercepted at response stage or if redirect occurred while intercepting
             * request.
             */
            responseErrorReason?: ErrorReason;
            /**
             * Response code if intercepted at response stage or if redirect occurred while intercepting
             * request or auth retry occurred.
             */
            responseStatusCode?: integer;
            /**
             * Response headers if intercepted at the response stage or if redirect occurred while
             * intercepting request or auth retry occurred.
             */
            responseHeaders?: Headers;
            /**
             * If the intercepted request had a corresponding requestWillBeSent event fired for it, then
             * this requestId will be the same as the requestId present in the requestWillBeSent event.
             */
            requestId?: RequestId;
        }

        /**
         * Fired if request ended up loading from cache.
         */
        interface RequestServedFromCacheEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
        }

        /**
         * Fired when page is about to send HTTP request.
         */
        interface RequestWillBeSentEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Loader identifier. Empty string if the request is fetched from worker.
             */
            loaderId: LoaderId;
            /**
             * URL of the document this request is loaded for.
             */
            documentURL: string;
            /**
             * Request data.
             */
            request: Request;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * Timestamp.
             */
            wallTime: TimeSinceEpoch;
            /**
             * Request initiator.
             */
            initiator: Initiator;
            /**
             * Redirect response data.
             */
            redirectResponse?: Response;
            /**
             * Type of this resource.
             */
            type?: ResourceType;
            /**
             * Frame identifier.
             */
            frameId?: Page.FrameId;
            /**
             * Whether the request is initiated by a user gesture. Defaults to false.
             */
            hasUserGesture?: boolean;
        }

        /**
         * Fired when resource loading priority is changed
         */
        interface ResourceChangedPriorityEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * New priority
             */
            newPriority: ResourcePriority;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
        }

        /**
         * Fired when a signed exchange was received over the network
         */
        interface SignedExchangeReceivedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Information about the signed exchange response.
             */
            info: SignedExchangeInfo;
        }

        /**
         * Fired when HTTP response is available.
         */
        interface ResponseReceivedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Loader identifier. Empty string if the request is fetched from worker.
             */
            loaderId: LoaderId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * Resource type.
             */
            type: ResourceType;
            /**
             * Response data.
             */
            response: Response;
            /**
             * Frame identifier.
             */
            frameId?: Page.FrameId;
        }

        /**
         * Fired when WebSocket is closed.
         */
        interface WebSocketClosedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
        }

        /**
         * Fired upon WebSocket creation.
         */
        interface WebSocketCreatedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * WebSocket request URL.
             */
            url: string;
            /**
             * Request initiator.
             */
            initiator?: Initiator;
        }

        /**
         * Fired when WebSocket message error occurs.
         */
        interface WebSocketFrameErrorEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * WebSocket error message.
             */
            errorMessage: string;
        }

        /**
         * Fired when WebSocket message is received.
         */
        interface WebSocketFrameReceivedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * WebSocket response data.
             */
            response: WebSocketFrame;
        }

        /**
         * Fired when WebSocket message is sent.
         */
        interface WebSocketFrameSentEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * WebSocket response data.
             */
            response: WebSocketFrame;
        }

        /**
         * Fired when WebSocket handshake response becomes available.
         */
        interface WebSocketHandshakeResponseReceivedEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * WebSocket response data.
             */
            response: WebSocketResponse;
        }

        /**
         * Fired when WebSocket is about to initiate handshake.
         */
        interface WebSocketWillSendHandshakeRequestEvent {
            /**
             * Request identifier.
             */
            requestId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * UTC Timestamp.
             */
            wallTime: TimeSinceEpoch;
            /**
             * WebSocket request data.
             */
            request: WebSocketRequest;
        }

        /**
         * Fired upon WebTransport creation.
         */
        interface WebTransportCreatedEvent {
            /**
             * WebTransport identifier.
             */
            transportId: RequestId;
            /**
             * WebTransport request URL.
             */
            url: string;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
            /**
             * Request initiator.
             */
            initiator?: Initiator;
        }

        /**
         * Fired when WebTransport handshake is finished.
         */
        interface WebTransportConnectionEstablishedEvent {
            /**
             * WebTransport identifier.
             */
            transportId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
        }

        /**
         * Fired when WebTransport is disposed.
         */
        interface WebTransportClosedEvent {
            /**
             * WebTransport identifier.
             */
            transportId: RequestId;
            /**
             * Timestamp.
             */
            timestamp: MonotonicTime;
        }

        /**
         * Fired when additional information about a requestWillBeSent event is available from the
         * network stack. Not every requestWillBeSent event will have an additional
         * requestWillBeSentExtraInfo fired for it, and there is no guarantee whether requestWillBeSent
         * or requestWillBeSentExtraInfo will be fired first for the same request.
         */
        interface RequestWillBeSentExtraInfoEvent {
            /**
             * Request identifier. Used to match this information to an existing requestWillBeSent event.
             */
            requestId: RequestId;
            /**
             * A list of cookies potentially associated to the requested URL. This includes both cookies sent with
             * the request and the ones not sent; the latter are distinguished by having blockedReason field set.
             */
            associatedCookies: BlockedCookieWithReason[];
            /**
             * Raw request headers as they will be sent over the wire.
             */
            headers: Headers;
            /**
             * The client security state set for the request.
             */
            clientSecurityState?: ClientSecurityState;
        }

        /**
         * Fired when additional information about a responseReceived event is available from the network
         * stack. Not every responseReceived event will have an additional responseReceivedExtraInfo for
         * it, and responseReceivedExtraInfo may be fired before or after responseReceived.
         */
        interface ResponseReceivedExtraInfoEvent {
            /**
             * Request identifier. Used to match this information to another responseReceived event.
             */
            requestId: RequestId;
            /**
             * A list of cookies which were not stored from the response along with the corresponding
             * reasons for blocking. The cookies here may not be valid due to syntax errors, which
             * are represented by the invalid cookie line string instead of a proper cookie.
             */
            blockedCookies: BlockedSetCookieWithReason[];
            /**
             * Raw response headers as they were received over the wire.
             */
            headers: Headers;
            /**
             * The IP address space of the resource. The address space can only be determined once the transport
             * established the connection, so we can't send it in `requestWillBeSentExtraInfo`.
             */
            resourceIPAddressSpace: IPAddressSpace;
            /**
             * Raw response header text as it was received over the wire. The raw text may not always be
             * available, such as in the case of HTTP/2 or QUIC.
             */
            headersText?: string;
        }

        const enum TrustTokenOperationDoneEventStatus {
            Ok = 'Ok',
            InvalidArgument = 'InvalidArgument',
            FailedPrecondition = 'FailedPrecondition',
            ResourceExhausted = 'ResourceExhausted',
            AlreadyExists = 'AlreadyExists',
            Unavailable = 'Unavailable',
            BadResponse = 'BadResponse',
            InternalError = 'InternalError',
            UnknownError = 'UnknownError',
            FulfilledLocally = 'FulfilledLocally',
        }

        /**
         * Fired exactly once for each Trust Token operation. Depending on
         * the type of the operation and whether the operation succeeded or
         * failed, the event is fired before the corresponding request was sent
         * or after the response was received.
         */
        interface TrustTokenOperationDoneEvent {
            /**
             * Detailed success or error status of the operation.
             * 'AlreadyExists' also signifies a successful operation, as the result
             * of the operation already exists und thus, the operation was abort
             * preemptively (e.g. a cache hit). (TrustTokenOperationDoneEventStatus enum)
             */
            status: ('Ok' | 'InvalidArgument' | 'FailedPrecondition' | 'ResourceExhausted' | 'AlreadyExists' | 'Unavailable' | 'BadResponse' | 'InternalError' | 'UnknownError' | 'FulfilledLocally');
            type: TrustTokenOperationType;
            requestId: RequestId;
            /**
             * Top level origin. The context in which the operation was attempted.
             */
            topLevelOrigin?: string;
            /**
             * Origin of the issuer in case of a "Issuance" or "Redemption" operation.
             */
            issuerOrigin?: string;
            /**
             * The number of obtained Trust Tokens on a successful "Issuance" operation.
             */
            issuedTokenCount?: integer;
        }
    }

    /**
     * This domain provides various functionality related to drawing atop the inspected page.
     */
    namespace Overlay {

        /**
         * Configuration data for drawing the source order of an elements children.
         */
        interface SourceOrderConfig {
            /**
             * the color to outline the givent element in.
             */
            parentOutlineColor: DOM.RGBA;
            /**
             * the color to outline the child elements in.
             */
            childOutlineColor: DOM.RGBA;
        }

        /**
         * Configuration data for the highlighting of Grid elements.
         */
        interface GridHighlightConfig {
            /**
             * Whether the extension lines from grid cells to the rulers should be shown (default: false).
             */
            showGridExtensionLines?: boolean;
            /**
             * Show Positive line number labels (default: false).
             */
            showPositiveLineNumbers?: boolean;
            /**
             * Show Negative line number labels (default: false).
             */
            showNegativeLineNumbers?: boolean;
            /**
             * Show area name labels (default: false).
             */
            showAreaNames?: boolean;
            /**
             * Show line name labels (default: false).
             */
            showLineNames?: boolean;
            /**
             * Show track size labels (default: false).
             */
            showTrackSizes?: boolean;
            /**
             * The grid container border highlight color (default: transparent).
             */
            gridBorderColor?: DOM.RGBA;
            /**
             * The cell border color (default: transparent). Deprecated, please use rowLineColor and columnLineColor instead.
             */
            cellBorderColor?: DOM.RGBA;
            /**
             * The row line color (default: transparent).
             */
            rowLineColor?: DOM.RGBA;
            /**
             * The column line color (default: transparent).
             */
            columnLineColor?: DOM.RGBA;
            /**
             * Whether the grid border is dashed (default: false).
             */
            gridBorderDash?: boolean;
            /**
             * Whether the cell border is dashed (default: false). Deprecated, please us rowLineDash and columnLineDash instead.
             */
            cellBorderDash?: boolean;
            /**
             * Whether row lines are dashed (default: false).
             */
            rowLineDash?: boolean;
            /**
             * Whether column lines are dashed (default: false).
             */
            columnLineDash?: boolean;
            /**
             * The row gap highlight fill color (default: transparent).
             */
            rowGapColor?: DOM.RGBA;
            /**
             * The row gap hatching fill color (default: transparent).
             */
            rowHatchColor?: DOM.RGBA;
            /**
             * The column gap highlight fill color (default: transparent).
             */
            columnGapColor?: DOM.RGBA;
            /**
             * The column gap hatching fill color (default: transparent).
             */
            columnHatchColor?: DOM.RGBA;
            /**
             * The named grid areas border color (Default: transparent).
             */
            areaBorderColor?: DOM.RGBA;
            /**
             * The grid container background color (Default: transparent).
             */
            gridBackgroundColor?: DOM.RGBA;
        }

        /**
         * Configuration data for the highlighting of Flex container elements.
         */
        interface FlexContainerHighlightConfig {
            /**
             * The style of the container border
             */
            containerBorder?: LineStyle;
            /**
             * The style of the separator between lines
             */
            lineSeparator?: LineStyle;
            /**
             * The style of the separator between items
             */
            itemSeparator?: LineStyle;
            /**
             * Style of content-distribution space on the main axis (justify-content).
             */
            mainDistributedSpace?: BoxStyle;
            /**
             * Style of content-distribution space on the cross axis (align-content).
             */
            crossDistributedSpace?: BoxStyle;
            /**
             * Style of empty space caused by row gaps (gap/row-gap).
             */
            rowGapSpace?: BoxStyle;
            /**
             * Style of empty space caused by columns gaps (gap/column-gap).
             */
            columnGapSpace?: BoxStyle;
            /**
             * Style of the self-alignment line (align-items).
             */
            crossAlignment?: LineStyle;
        }

        /**
         * Configuration data for the highlighting of Flex item elements.
         */
        interface FlexItemHighlightConfig {
            /**
             * Style of the box representing the item's base size
             */
            baseSizeBox?: BoxStyle;
            /**
             * Style of the border around the box representing the item's base size
             */
            baseSizeBorder?: LineStyle;
            /**
             * Style of the arrow representing if the item grew or shrank
             */
            flexibilityArrow?: LineStyle;
        }

        const enum LineStylePattern {
            Dashed = 'dashed',
            Dotted = 'dotted',
        }

        /**
         * Style information for drawing a line.
         */
        interface LineStyle {
            /**
             * The color of the line (default: transparent)
             */
            color?: DOM.RGBA;
            /**
             * The line pattern (default: solid) (LineStylePattern enum)
             */
            pattern?: ('dashed' | 'dotted');
        }

        /**
         * Style information for drawing a box.
         */
        interface BoxStyle {
            /**
             * The background color for the box (default: transparent)
             */
            fillColor?: DOM.RGBA;
            /**
             * The hatching color for the box (default: transparent)
             */
            hatchColor?: DOM.RGBA;
        }

        type ContrastAlgorithm = ('aa' | 'aaa' | 'apca');

        /**
         * Configuration data for the highlighting of page elements.
         */
        interface HighlightConfig {
            /**
             * Whether the node info tooltip should be shown (default: false).
             */
            showInfo?: boolean;
            /**
             * Whether the node styles in the tooltip (default: false).
             */
            showStyles?: boolean;
            /**
             * Whether the rulers should be shown (default: false).
             */
            showRulers?: boolean;
            /**
             * Whether the a11y info should be shown (default: true).
             */
            showAccessibilityInfo?: boolean;
            /**
             * Whether the extension lines from node to the rulers should be shown (default: false).
             */
            showExtensionLines?: boolean;
            /**
             * The content box highlight fill color (default: transparent).
             */
            contentColor?: DOM.RGBA;
            /**
             * The padding highlight fill color (default: transparent).
             */
            paddingColor?: DOM.RGBA;
            /**
             * The border highlight fill color (default: transparent).
             */
            borderColor?: DOM.RGBA;
            /**
             * The margin highlight fill color (default: transparent).
             */
            marginColor?: DOM.RGBA;
            /**
             * The event target element highlight fill color (default: transparent).
             */
            eventTargetColor?: DOM.RGBA;
            /**
             * The shape outside fill color (default: transparent).
             */
            shapeColor?: DOM.RGBA;
            /**
             * The shape margin fill color (default: transparent).
             */
            shapeMarginColor?: DOM.RGBA;
            /**
             * The grid layout color (default: transparent).
             */
            cssGridColor?: DOM.RGBA;
            /**
             * The color format used to format color styles (default: hex).
             */
            colorFormat?: ColorFormat;
            /**
             * The grid layout highlight configuration (default: all transparent).
             */
            gridHighlightConfig?: GridHighlightConfig;
            /**
             * The flex container highlight configuration (default: all transparent).
             */
            flexContainerHighlightConfig?: FlexContainerHighlightConfig;
            /**
             * The flex item highlight configuration (default: all transparent).
             */
            flexItemHighlightConfig?: FlexItemHighlightConfig;
            /**
             * The contrast algorithm to use for the contrast ratio (default: aa).
             */
            contrastAlgorithm?: ContrastAlgorithm;
        }

        type ColorFormat = ('rgb' | 'hsl' | 'hex');

        /**
         * Configurations for Persistent Grid Highlight
         */
        interface GridNodeHighlightConfig {
            /**
             * A descriptor for the highlight appearance.
             */
            gridHighlightConfig: GridHighlightConfig;
            /**
             * Identifier of the node to highlight.
             */
            nodeId: DOM.NodeId;
        }

        interface FlexNodeHighlightConfig {
            /**
             * A descriptor for the highlight appearance of flex containers.
             */
            flexContainerHighlightConfig: FlexContainerHighlightConfig;
            /**
             * Identifier of the node to highlight.
             */
            nodeId: DOM.NodeId;
        }

        /**
         * Configuration for dual screen hinge
         */
        interface HingeConfig {
            /**
             * A rectangle represent hinge
             */
            rect: DOM.Rect;
            /**
             * The content box highlight fill color (default: a dark color).
             */
            contentColor?: DOM.RGBA;
            /**
             * The content box highlight outline color (default: transparent).
             */
            outlineColor?: DOM.RGBA;
        }

        type InspectMode = ('searchForNode' | 'searchForUAShadowDOM' | 'captureAreaScreenshot' | 'showDistances' | 'none');

        interface GetHighlightObjectForTestRequest {
            /**
             * Id of the node to get highlight object for.
             */
            nodeId: DOM.NodeId;
            /**
             * Whether to include distance info.
             */
            includeDistance?: boolean;
            /**
             * Whether to include style info.
             */
            includeStyle?: boolean;
            /**
             * The color format to get config with (default: hex).
             */
            colorFormat?: ColorFormat;
            /**
             * Whether to show accessibility info (default: true).
             */
            showAccessibilityInfo?: boolean;
        }

        interface GetHighlightObjectForTestResponse {
            /**
             * Highlight data for the node.
             */
            highlight: any;
        }

        interface GetGridHighlightObjectsForTestRequest {
            /**
             * Ids of the node to get highlight object for.
             */
            nodeIds: DOM.NodeId[];
        }

        interface GetGridHighlightObjectsForTestResponse {
            /**
             * Grid Highlight data for the node ids provided.
             */
            highlights: any;
        }

        interface GetSourceOrderHighlightObjectForTestRequest {
            /**
             * Id of the node to highlight.
             */
            nodeId: DOM.NodeId;
        }

        interface GetSourceOrderHighlightObjectForTestResponse {
            /**
             * Source order highlight data for the node id provided.
             */
            highlight: any;
        }

        interface HighlightFrameRequest {
            /**
             * Identifier of the frame to highlight.
             */
            frameId: Page.FrameId;
            /**
             * The content box highlight fill color (default: transparent).
             */
            contentColor?: DOM.RGBA;
            /**
             * The content box highlight outline color (default: transparent).
             */
            contentOutlineColor?: DOM.RGBA;
        }

        interface HighlightNodeRequest {
            /**
             * A descriptor for the highlight appearance.
             */
            highlightConfig: HighlightConfig;
            /**
             * Identifier of the node to highlight.
             */
            nodeId?: DOM.NodeId;
            /**
             * Identifier of the backend node to highlight.
             */
            backendNodeId?: DOM.BackendNodeId;
            /**
             * JavaScript object id of the node to be highlighted.
             */
            objectId?: Runtime.RemoteObjectId;
            /**
             * Selectors to highlight relevant nodes.
             */
            selector?: string;
        }

        interface HighlightQuadRequest {
            /**
             * Quad to highlight
             */
            quad: DOM.Quad;
            /**
             * The highlight fill color (default: transparent).
             */
            color?: DOM.RGBA;
            /**
             * The highlight outline color (default: transparent).
             */
            outlineColor?: DOM.RGBA;
        }

        interface HighlightRectRequest {
            /**
             * X coordinate
             */
            x: integer;
            /**
             * Y coordinate
             */
            y: integer;
            /**
             * Rectangle width
             */
            width: integer;
            /**
             * Rectangle height
             */
            height: integer;
            /**
             * The highlight fill color (default: transparent).
             */
            color?: DOM.RGBA;
            /**
             * The highlight outline color (default: transparent).
             */
            outlineColor?: DOM.RGBA;
        }

        interface HighlightSourceOrderRequest {
            /**
             * A descriptor for the appearance of the overlay drawing.
             */
            sourceOrderConfig: SourceOrderConfig;
            /**
             * Identifier of the node to highlight.
             */
            nodeId?: DOM.NodeId;
            /**
             * Identifier of the backend node to highlight.
             */
            backendNodeId?: DOM.BackendNodeId;
            /**
             * JavaScript object id of the node to be highlighted.
             */
            objectId?: Runtime.RemoteObjectId;
        }

        interface SetInspectModeRequest {
            /**
             * Set an inspection mode.
             */
            mode: InspectMode;
            /**
             * A descriptor for the highlight appearance of hovered-over nodes. May be omitted if `enabled
             * == false`.
             */
            highlightConfig?: HighlightConfig;
        }

        interface SetShowAdHighlightsRequest {
            /**
             * True for showing ad highlights
             */
            show: boolean;
        }

        interface SetPausedInDebuggerMessageRequest {
            /**
             * The message to display, also triggers resume and step over controls.
             */
            message?: string;
        }

        interface SetShowDebugBordersRequest {
            /**
             * True for showing debug borders
             */
            show: boolean;
        }

        interface SetShowFPSCounterRequest {
            /**
             * True for showing the FPS counter
             */
            show: boolean;
        }

        interface SetShowGridOverlaysRequest {
            /**
             * An array of node identifiers and descriptors for the highlight appearance.
             */
            gridNodeHighlightConfigs: GridNodeHighlightConfig[];
        }

        interface SetShowFlexOverlaysRequest {
            /**
             * An array of node identifiers and descriptors for the highlight appearance.
             */
            flexNodeHighlightConfigs: FlexNodeHighlightConfig[];
        }

        interface SetShowPaintRectsRequest {
            /**
             * True for showing paint rectangles
             */
            result: boolean;
        }

        interface SetShowLayoutShiftRegionsRequest {
            /**
             * True for showing layout shift regions
             */
            result: boolean;
        }

        interface SetShowScrollBottleneckRectsRequest {
            /**
             * True for showing scroll bottleneck rects
             */
            show: boolean;
        }

        interface SetShowHitTestBordersRequest {
            /**
             * True for showing hit-test borders
             */
            show: boolean;
        }

        interface SetShowWebVitalsRequest {
            show: boolean;
        }

        interface SetShowViewportSizeOnResizeRequest {
            /**
             * Whether to paint size or not.
             */
            show: boolean;
        }

        interface SetShowHingeRequest {
            /**
             * hinge data, null means hideHinge
             */
            hingeConfig?: HingeConfig;
        }

        /**
         * Fired when the node should be inspected. This happens after call to `setInspectMode` or when
         * user manually inspects an element.
         */
        interface InspectNodeRequestedEvent {
            /**
             * Id of the node to inspect.
             */
            backendNodeId: DOM.BackendNodeId;
        }

        /**
         * Fired when the node should be highlighted. This happens after call to `setInspectMode`.
         */
        interface NodeHighlightRequestedEvent {
            nodeId: DOM.NodeId;
        }

        /**
         * Fired when user asks to capture screenshot of some area on the page.
         */
        interface ScreenshotRequestedEvent {
            /**
             * Viewport to capture, in device independent pixels (dip).
             */
            viewport: Page.Viewport;
        }
    }

    /**
     * Actions and events related to the inspected page belong to the page domain.
     */
    namespace Page {

        /**
         * Unique frame identifier.
         */
        type FrameId = string;

        /**
         * Indicates whether a frame has been identified as an ad.
         */
        type AdFrameType = ('none' | 'child' | 'root');

        /**
         * Indicates whether the frame is a secure context and why it is the case.
         */
        type SecureContextType = ('Secure' | 'SecureLocalhost' | 'InsecureScheme' | 'InsecureAncestor');

        /**
         * Indicates whether the frame is cross-origin isolated and why it is the case.
         */
        type CrossOriginIsolatedContextType = ('Isolated' | 'NotIsolated' | 'NotIsolatedFeatureDisabled');

        type GatedAPIFeatures = ('SharedArrayBuffers' | 'SharedArrayBuffersTransferAllowed' | 'PerformanceMeasureMemory' | 'PerformanceProfile');

        /**
         * All Permissions Policy features. This enum should match the one defined
         * in renderer/core/feature_policy/feature_policy_features.json5.
         */
        type PermissionsPolicyFeature = ('accelerometer' | 'ambient-light-sensor' | 'autoplay' | 'camera' | 'ch-dpr' | 'ch-device-memory' | 'ch-downlink' | 'ch-ect' | 'ch-lang' | 'ch-rtt' | 'ch-ua' | 'ch-ua-arch' | 'ch-ua-platform' | 'ch-ua-model' | 'ch-ua-mobile' | 'ch-ua-full-version' | 'ch-ua-platform-version' | 'ch-viewport-width' | 'ch-width' | 'clipboard-read' | 'clipboard-write' | 'conversion-measurement' | 'cross-origin-isolated' | 'display-capture' | 'document-domain' | 'encrypted-media' | 'execution-while-out-of-viewport' | 'execution-while-not-rendered' | 'focus-without-user-activation' | 'fullscreen' | 'frobulate' | 'gamepad' | 'geolocation' | 'gyroscope' | 'hid' | 'idle-detection' | 'interest-cohort' | 'magnetometer' | 'microphone' | 'midi' | 'otp-credentials' | 'payment' | 'picture-in-picture' | 'publickey-credentials-get' | 'screen-wake-lock' | 'serial' | 'storage-access-api' | 'sync-xhr' | 'trust-token-redemption' | 'usb' | 'vertical-scroll' | 'web-share' | 'xr-spatial-tracking');

        /**
         * Reason for a permissions policy feature to be disabled.
         */
        type PermissionsPolicyBlockReason = ('Header' | 'IframeAttribute');

        interface PermissionsPolicyBlockLocator {
            frameId: FrameId;
            blockReason: PermissionsPolicyBlockReason;
        }

        interface PermissionsPolicyFeatureState {
            feature: PermissionsPolicyFeature;
            allowed: boolean;
            locator?: PermissionsPolicyBlockLocator;
        }

        /**
         * Information about the Frame on the page.
         */
        interface Frame {
            /**
             * Frame unique identifier.
             */
            id: FrameId;
            /**
             * Parent frame identifier.
             */
            parentId?: string;
            /**
             * Identifier of the loader associated with this frame.
             */
            loaderId: Network.LoaderId;
            /**
             * Frame's name as specified in the tag.
             */
            name?: string;
            /**
             * Frame document's URL without fragment.
             */
            url: string;
            /**
             * Frame document's URL fragment including the '#'.
             */
            urlFragment?: string;
            /**
             * Frame document's registered domain, taking the public suffixes list into account.
             * Extracted from the Frame's url.
             * Example URLs: http://www.google.com/file.html -> "google.com"
             *               http://a.b.co.uk/file.html      -> "b.co.uk"
             */
            domainAndRegistry: string;
            /**
             * Frame document's security origin.
             */
            securityOrigin: string;
            /**
             * Frame document's mimeType as determined by the browser.
             */
            mimeType: string;
            /**
             * If the frame failed to load, this contains the URL that could not be loaded. Note that unlike url above, this URL may contain a fragment.
             */
            unreachableUrl?: string;
            /**
             * Indicates whether this frame was tagged as an ad.
             */
            adFrameType?: AdFrameType;
            /**
             * Indicates whether the main document is a secure context and explains why that is the case.
             */
            secureContextType: SecureContextType;
            /**
             * Indicates whether this is a cross origin isolated context.
             */
            crossOriginIsolatedContextType: CrossOriginIsolatedContextType;
            /**
             * Indicated which gated APIs / features are available.
             */
            gatedAPIFeatures: GatedAPIFeatures[];
        }

        /**
         * Information about the Resource on the page.
         */
        interface FrameResource {
            /**
             * Resource URL.
             */
            url: string;
            /**
             * Type of this resource.
             */
            type: Network.ResourceType;
            /**
             * Resource mimeType as determined by the browser.
             */
            mimeType: string;
            /**
             * last-modified timestamp as reported by server.
             */
            lastModified?: Network.TimeSinceEpoch;
            /**
             * Resource content size.
             */
            contentSize?: number;
            /**
             * True if the resource failed to load.
             */
            failed?: boolean;
            /**
             * True if the resource was canceled during loading.
             */
            canceled?: boolean;
        }

        /**
         * Information about the Frame hierarchy along with their cached resources.
         */
        interface FrameResourceTree {
            /**
             * Frame information for this tree item.
             */
            frame: Frame;
            /**
             * Child frames.
             */
            childFrames?: FrameResourceTree[];
            /**
             * Information about frame resources.
             */
            resources: FrameResource[];
        }

        /**
         * Information about the Frame hierarchy.
         */
        interface FrameTree {
            /**
             * Frame information for this tree item.
             */
            frame: Frame;
            /**
             * Child frames.
             */
            childFrames?: FrameTree[];
        }

        /**
         * Unique script identifier.
         */
        type ScriptIdentifier = string;

        /**
         * Transition type.
         */
        type TransitionType = ('link' | 'typed' | 'address_bar' | 'auto_bookmark' | 'auto_subframe' | 'manual_subframe' | 'generated' | 'auto_toplevel' | 'form_submit' | 'reload' | 'keyword' | 'keyword_generated' | 'other');

        /**
         * Navigation history entry.
         */
        interface NavigationEntry {
            /**
             * Unique id of the navigation history entry.
             */
            id: integer;
            /**
             * URL of the navigation history entry.
             */
            url: string;
            /**
             * URL that the user typed in the url bar.
             */
            userTypedURL: string;
            /**
             * Title of the navigation history entry.
             */
            title: string;
            /**
             * Transition type.
             */
            transitionType: TransitionType;
        }

        /**
         * Screencast frame metadata.
         */
        interface ScreencastFrameMetadata {
            /**
             * Top offset in DIP.
             */
            offsetTop: number;
            /**
             * Page scale factor.
             */
            pageScaleFactor: number;
            /**
             * Device screen width in DIP.
             */
            deviceWidth: number;
            /**
             * Device screen height in DIP.
             */
            deviceHeight: number;
            /**
             * Position of horizontal scroll in CSS pixels.
             */
            scrollOffsetX: number;
            /**
             * Position of vertical scroll in CSS pixels.
             */
            scrollOffsetY: number;
            /**
             * Frame swap timestamp.
             */
            timestamp?: Network.TimeSinceEpoch;
        }

        /**
         * Javascript dialog type.
         */
        type DialogType = ('alert' | 'confirm' | 'prompt' | 'beforeunload');

        /**
         * Error while paring app manifest.
         */
        interface AppManifestError {
            /**
             * Error message.
             */
            message: string;
            /**
             * If criticial, this is a non-recoverable parse error.
             */
            critical: integer;
            /**
             * Error line.
             */
            line: integer;
            /**
             * Error column.
             */
            column: integer;
        }

        /**
         * Parsed app manifest properties.
         */
        interface AppManifestParsedProperties {
            /**
             * Computed scope value
             */
            scope: string;
        }

        /**
         * Layout viewport position and dimensions.
         */
        interface LayoutViewport {
            /**
             * Horizontal offset relative to the document (CSS pixels).
             */
            pageX: integer;
            /**
             * Vertical offset relative to the document (CSS pixels).
             */
            pageY: integer;
            /**
             * Width (CSS pixels), excludes scrollbar if present.
             */
            clientWidth: integer;
            /**
             * Height (CSS pixels), excludes scrollbar if present.
             */
            clientHeight: integer;
        }

        /**
         * Visual viewport position, dimensions, and scale.
         */
        interface VisualViewport {
            /**
             * Horizontal offset relative to the layout viewport (CSS pixels).
             */
            offsetX: number;
            /**
             * Vertical offset relative to the layout viewport (CSS pixels).
             */
            offsetY: number;
            /**
             * Horizontal offset relative to the document (CSS pixels).
             */
            pageX: number;
            /**
             * Vertical offset relative to the document (CSS pixels).
             */
            pageY: number;
            /**
             * Width (CSS pixels), excludes scrollbar if present.
             */
            clientWidth: number;
            /**
             * Height (CSS pixels), excludes scrollbar if present.
             */
            clientHeight: number;
            /**
             * Scale relative to the ideal viewport (size at width=device-width).
             */
            scale: number;
            /**
             * Page zoom factor (CSS to device independent pixels ratio).
             */
            zoom?: number;
        }

        /**
         * Viewport for capturing screenshot.
         */
        interface Viewport {
            /**
             * X offset in device independent pixels (dip).
             */
            x: number;
            /**
             * Y offset in device independent pixels (dip).
             */
            y: number;
            /**
             * Rectangle width in device independent pixels (dip).
             */
            width: number;
            /**
             * Rectangle height in device independent pixels (dip).
             */
            height: number;
            /**
             * Page scale factor.
             */
            scale: number;
        }

        /**
         * Generic font families collection.
         */
        interface FontFamilies {
            /**
             * The standard font-family.
             */
            standard?: string;
            /**
             * The fixed font-family.
             */
            fixed?: string;
            /**
             * The serif font-family.
             */
            serif?: string;
            /**
             * The sansSerif font-family.
             */
            sansSerif?: string;
            /**
             * The cursive font-family.
             */
            cursive?: string;
            /**
             * The fantasy font-family.
             */
            fantasy?: string;
            /**
             * The pictograph font-family.
             */
            pictograph?: string;
        }

        /**
         * Default font sizes.
         */
        interface FontSizes {
            /**
             * Default standard font size.
             */
            standard?: integer;
            /**
             * Default fixed font size.
             */
            fixed?: integer;
        }

        type ClientNavigationReason = ('formSubmissionGet' | 'formSubmissionPost' | 'httpHeaderRefresh' | 'scriptInitiated' | 'metaTagRefresh' | 'pageBlockInterstitial' | 'reload' | 'anchorClick');

        type ClientNavigationDisposition = ('currentTab' | 'newTab' | 'newWindow' | 'download');

        interface InstallabilityErrorArgument {
            /**
             * Argument name (e.g. name:'minimum-icon-size-in-pixels').
             */
            name: string;
            /**
             * Argument value (e.g. value:'64').
             */
            value: string;
        }

        /**
         * The installability error
         */
        interface InstallabilityError {
            /**
             * The error id (e.g. 'manifest-missing-suitable-icon').
             */
            errorId: string;
            /**
             * The list of error arguments (e.g. {name:'minimum-icon-size-in-pixels', value:'64'}).
             */
            errorArguments: InstallabilityErrorArgument[];
        }

        /**
         * The referring-policy used for the navigation.
         */
        type ReferrerPolicy = ('noReferrer' | 'noReferrerWhenDowngrade' | 'origin' | 'originWhenCrossOrigin' | 'sameOrigin' | 'strictOrigin' | 'strictOriginWhenCrossOrigin' | 'unsafeUrl');

        interface AddScriptToEvaluateOnLoadRequest {
            scriptSource: string;
        }

        interface AddScriptToEvaluateOnLoadResponse {
            /**
             * Identifier of the added script.
             */
            identifier: ScriptIdentifier;
        }

        interface AddScriptToEvaluateOnNewDocumentRequest {
            source: string;
            /**
             * If specified, creates an isolated world with the given name and evaluates given script in it.
             * This world name will be used as the ExecutionContextDescription::name when the corresponding
             * event is emitted.
             */
            worldName?: string;
        }

        interface AddScriptToEvaluateOnNewDocumentResponse {
            /**
             * Identifier of the added script.
             */
            identifier: ScriptIdentifier;
        }

        const enum CaptureScreenshotRequestFormat {
            Jpeg = 'jpeg',
            Png = 'png',
        }

        interface CaptureScreenshotRequest {
            /**
             * Image compression format (defaults to png). (CaptureScreenshotRequestFormat enum)
             */
            format?: ('jpeg' | 'png');
            /**
             * Compression quality from range [0..100] (jpeg only).
             */
            quality?: integer;
            /**
             * Capture the screenshot of a given region only.
             */
            clip?: Viewport;
            /**
             * Capture the screenshot from the surface, rather than the view. Defaults to true.
             */
            fromSurface?: boolean;
            /**
             * Capture the screenshot beyond the viewport. Defaults to false.
             */
            captureBeyondViewport?: boolean;
        }

        interface CaptureScreenshotResponse {
            /**
             * Base64-encoded image data. (Encoded as a base64 string when passed over JSON)
             */
            data: string;
        }

        const enum CaptureSnapshotRequestFormat {
            MHTML = 'mhtml',
        }

        interface CaptureSnapshotRequest {
            /**
             * Format (defaults to mhtml). (CaptureSnapshotRequestFormat enum)
             */
            format?: ('mhtml');
        }

        interface CaptureSnapshotResponse {
            /**
             * Serialized page data.
             */
            data: string;
        }

        interface CreateIsolatedWorldRequest {
            /**
             * Id of the frame in which the isolated world should be created.
             */
            frameId: FrameId;
            /**
             * An optional name which is reported in the Execution Context.
             */
            worldName?: string;
            /**
             * Whether or not universal access should be granted to the isolated world. This is a powerful
             * option, use with caution.
             */
            grantUniveralAccess?: boolean;
        }

        interface CreateIsolatedWorldResponse {
            /**
             * Execution context of the isolated world.
             */
            executionContextId: Runtime.ExecutionContextId;
        }

        interface DeleteCookieRequest {
            /**
             * Name of the cookie to remove.
             */
            cookieName: string;
            /**
             * URL to match cooke domain and path.
             */
            url: string;
        }

        interface GetAppManifestResponse {
            /**
             * Manifest location.
             */
            url: string;
            errors: AppManifestError[];
            /**
             * Manifest content.
             */
            data?: string;
            /**
             * Parsed manifest properties
             */
            parsed?: AppManifestParsedProperties;
        }

        interface GetInstallabilityErrorsResponse {
            installabilityErrors: InstallabilityError[];
        }

        interface GetManifestIconsResponse {
            primaryIcon?: string;
        }

        interface GetCookiesResponse {
            /**
             * Array of cookie objects.
             */
            cookies: Network.Cookie[];
        }

        interface GetFrameTreeResponse {
            /**
             * Present frame tree structure.
             */
            frameTree: FrameTree;
        }

        interface GetLayoutMetricsResponse {
            /**
             * Metrics relating to the layout viewport.
             */
            layoutViewport: LayoutViewport;
            /**
             * Metrics relating to the visual viewport.
             */
            visualViewport: VisualViewport;
            /**
             * Size of scrollable area.
             */
            contentSize: DOM.Rect;
        }

        interface GetNavigationHistoryResponse {
            /**
             * Index of the current navigation history entry.
             */
            currentIndex: integer;
            /**
             * Array of navigation history entries.
             */
            entries: NavigationEntry[];
        }

        interface GetResourceContentRequest {
            /**
             * Frame id to get resource for.
             */
            frameId: FrameId;
            /**
             * URL of the resource to get content for.
             */
            url: string;
        }

        interface GetResourceContentResponse {
            /**
             * Resource content.
             */
            content: string;
            /**
             * True, if content was served as base64.
             */
            base64Encoded: boolean;
        }

        interface GetResourceTreeResponse {
            /**
             * Present frame / resource tree structure.
             */
            frameTree: FrameResourceTree;
        }

        interface HandleJavaScriptDialogRequest {
            /**
             * Whether to accept or dismiss the dialog.
             */
            accept: boolean;
            /**
             * The text to enter into the dialog prompt before accepting. Used only if this is a prompt
             * dialog.
             */
            promptText?: string;
        }

        interface NavigateRequest {
            /**
             * URL to navigate the page to.
             */
            url: string;
            /**
             * Referrer URL.
             */
            referrer?: string;
            /**
             * Intended transition type.
             */
            transitionType?: TransitionType;
            /**
             * Frame id to navigate, if not specified navigates the top frame.
             */
            frameId?: FrameId;
            /**
             * Referrer-policy used for the navigation.
             */
            referrerPolicy?: ReferrerPolicy;
        }

        interface NavigateResponse {
            /**
             * Frame id that has navigated (or failed to navigate)
             */
            frameId: FrameId;
            /**
             * Loader identifier.
             */
            loaderId?: Network.LoaderId;
            /**
             * User friendly error message, present if and only if navigation has failed.
             */
            errorText?: string;
        }

        interface NavigateToHistoryEntryRequest {
            /**
             * Unique id of the entry to navigate to.
             */
            entryId: integer;
        }

        const enum PrintToPDFRequestTransferMode {
            ReturnAsBase64 = 'ReturnAsBase64',
            ReturnAsStream = 'ReturnAsStream',
        }

        interface PrintToPDFRequest {
            /**
             * Paper orientation. Defaults to false.
             */
            landscape?: boolean;
            /**
             * Display header and footer. Defaults to false.
             */
            displayHeaderFooter?: boolean;
            /**
             * Print background graphics. Defaults to false.
             */
            printBackground?: boolean;
            /**
             * Scale of the webpage rendering. Defaults to 1.
             */
            scale?: number;
            /**
             * Paper width in inches. Defaults to 8.5 inches.
             */
            paperWidth?: number;
            /**
             * Paper height in inches. Defaults to 11 inches.
             */
            paperHeight?: number;
            /**
             * Top margin in inches. Defaults to 1cm (~0.4 inches).
             */
            marginTop?: number;
            /**
             * Bottom margin in inches. Defaults to 1cm (~0.4 inches).
             */
            marginBottom?: number;
            /**
             * Left margin in inches. Defaults to 1cm (~0.4 inches).
             */
            marginLeft?: number;
            /**
             * Right margin in inches. Defaults to 1cm (~0.4 inches).
             */
            marginRight?: number;
            /**
             * Paper ranges to print, e.g., '1-5, 8, 11-13'. Defaults to the empty string, which means
             * print all pages.
             */
            pageRanges?: string;
            /**
             * Whether to silently ignore invalid but successfully parsed page ranges, such as '3-2'.
             * Defaults to false.
             */
            ignoreInvalidPageRanges?: boolean;
            /**
             * HTML template for the print header. Should be valid HTML markup with following
             * classes used to inject printing values into them:
             * - `date`: formatted print date
             * - `title`: document title
             * - `url`: document location
             * - `pageNumber`: current page number
             * - `totalPages`: total pages in the document
             * 
             * For example, `<span class=title></span>` would generate span containing the title.
             */
            headerTemplate?: string;
            /**
             * HTML template for the print footer. Should use the same format as the `headerTemplate`.
             */
            footerTemplate?: string;
            /**
             * Whether or not to prefer page size as defined by css. Defaults to false,
             * in which case the content will be scaled to fit the paper size.
             */
            preferCSSPageSize?: boolean;
            /**
             * return as stream (PrintToPDFRequestTransferMode enum)
             */
            transferMode?: ('ReturnAsBase64' | 'ReturnAsStream');
        }

        interface PrintToPDFResponse {
            /**
             * Base64-encoded pdf data. Empty if |returnAsStream| is specified. (Encoded as a base64 string when passed over JSON)
             */
            data: string;
            /**
             * A handle of the stream that holds resulting PDF data.
             */
            stream?: IO.StreamHandle;
        }

        interface ReloadRequest {
            /**
             * If true, browser cache is ignored (as if the user pressed Shift+refresh).
             */
            ignoreCache?: boolean;
            /**
             * If set, the script will be injected into all frames of the inspected page after reload.
             * Argument will be ignored if reloading dataURL origin.
             */
            scriptToEvaluateOnLoad?: string;
        }

        interface RemoveScriptToEvaluateOnLoadRequest {
            identifier: ScriptIdentifier;
        }

        interface RemoveScriptToEvaluateOnNewDocumentRequest {
            identifier: ScriptIdentifier;
        }

        interface ScreencastFrameAckRequest {
            /**
             * Frame number.
             */
            sessionId: integer;
        }

        interface SearchInResourceRequest {
            /**
             * Frame id for resource to search in.
             */
            frameId: FrameId;
            /**
             * URL of the resource to search in.
             */
            url: string;
            /**
             * String to search for.
             */
            query: string;
            /**
             * If true, search is case sensitive.
             */
            caseSensitive?: boolean;
            /**
             * If true, treats string parameter as regex.
             */
            isRegex?: boolean;
        }

        interface SearchInResourceResponse {
            /**
             * List of search matches.
             */
            result: Debugger.SearchMatch[];
        }

        interface SetAdBlockingEnabledRequest {
            /**
             * Whether to block ads.
             */
            enabled: boolean;
        }

        interface SetBypassCSPRequest {
            /**
             * Whether to bypass page CSP.
             */
            enabled: boolean;
        }

        interface GetPermissionsPolicyStateRequest {
            frameId: FrameId;
        }

        interface GetPermissionsPolicyStateResponse {
            states: PermissionsPolicyFeatureState[];
        }

        interface SetDeviceMetricsOverrideRequest {
            /**
             * Overriding width value in pixels (minimum 0, maximum 10000000). 0 disables the override.
             */
            width: integer;
            /**
             * Overriding height value in pixels (minimum 0, maximum 10000000). 0 disables the override.
             */
            height: integer;
            /**
             * Overriding device scale factor value. 0 disables the override.
             */
            deviceScaleFactor: number;
            /**
             * Whether to emulate mobile device. This includes viewport meta tag, overlay scrollbars, text
             * autosizing and more.
             */
            mobile: boolean;
            /**
             * Scale to apply to resulting view image.
             */
            scale?: number;
            /**
             * Overriding screen width value in pixels (minimum 0, maximum 10000000).
             */
            screenWidth?: integer;
            /**
             * Overriding screen height value in pixels (minimum 0, maximum 10000000).
             */
            screenHeight?: integer;
            /**
             * Overriding view X position on screen in pixels (minimum 0, maximum 10000000).
             */
            positionX?: integer;
            /**
             * Overriding view Y position on screen in pixels (minimum 0, maximum 10000000).
             */
            positionY?: integer;
            /**
             * Do not set visible view size, rely upon explicit setVisibleSize call.
             */
            dontSetVisibleSize?: boolean;
            /**
             * Screen orientation override.
             */
            screenOrientation?: Emulation.ScreenOrientation;
            /**
             * The viewport dimensions and scale. If not set, the override is cleared.
             */
            viewport?: Viewport;
        }

        interface SetDeviceOrientationOverrideRequest {
            /**
             * Mock alpha
             */
            alpha: number;
            /**
             * Mock beta
             */
            beta: number;
            /**
             * Mock gamma
             */
            gamma: number;
        }

        interface SetFontFamiliesRequest {
            /**
             * Specifies font families to set. If a font family is not specified, it won't be changed.
             */
            fontFamilies: FontFamilies;
        }

        interface SetFontSizesRequest {
            /**
             * Specifies font sizes to set. If a font size is not specified, it won't be changed.
             */
            fontSizes: FontSizes;
        }

        interface SetDocumentContentRequest {
            /**
             * Frame id to set HTML for.
             */
            frameId: FrameId;
            /**
             * HTML content to set.
             */
            html: string;
        }

        const enum SetDownloadBehaviorRequestBehavior {
            Deny = 'deny',
            Allow = 'allow',
            Default = 'default',
        }

        interface SetDownloadBehaviorRequest {
            /**
             * Whether to allow all or deny all download requests, or use default Chrome behavior if
             * available (otherwise deny). (SetDownloadBehaviorRequestBehavior enum)
             */
            behavior: ('deny' | 'allow' | 'default');
            /**
             * The default path to save downloaded files to. This is requred if behavior is set to 'allow'
             */
            downloadPath?: string;
        }

        interface SetGeolocationOverrideRequest {
            /**
             * Mock latitude
             */
            latitude?: number;
            /**
             * Mock longitude
             */
            longitude?: number;
            /**
             * Mock accuracy
             */
            accuracy?: number;
        }

        interface SetLifecycleEventsEnabledRequest {
            /**
             * If true, starts emitting lifecycle events.
             */
            enabled: boolean;
        }

        const enum SetTouchEmulationEnabledRequestConfiguration {
            Mobile = 'mobile',
            Desktop = 'desktop',
        }

        interface SetTouchEmulationEnabledRequest {
            /**
             * Whether the touch event emulation should be enabled.
             */
            enabled: boolean;
            /**
             * Touch/gesture events configuration. Default: current platform. (SetTouchEmulationEnabledRequestConfiguration enum)
             */
            configuration?: ('mobile' | 'desktop');
        }

        const enum StartScreencastRequestFormat {
            Jpeg = 'jpeg',
            Png = 'png',
        }

        interface StartScreencastRequest {
            /**
             * Image compression format. (StartScreencastRequestFormat enum)
             */
            format?: ('jpeg' | 'png');
            /**
             * Compression quality from range [0..100].
             */
            quality?: integer;
            /**
             * Maximum screenshot width.
             */
            maxWidth?: integer;
            /**
             * Maximum screenshot height.
             */
            maxHeight?: integer;
            /**
             * Send every n-th frame.
             */
            everyNthFrame?: integer;
        }

        const enum SetWebLifecycleStateRequestState {
            Frozen = 'frozen',
            Active = 'active',
        }

        interface SetWebLifecycleStateRequest {
            /**
             * Target lifecycle state (SetWebLifecycleStateRequestState enum)
             */
            state: ('frozen' | 'active');
        }

        interface SetProduceCompilationCacheRequest {
            enabled: boolean;
        }

        interface AddCompilationCacheRequest {
            url: string;
            /**
             * Base64-encoded data (Encoded as a base64 string when passed over JSON)
             */
            data: string;
        }

        interface GenerateTestReportRequest {
            /**
             * Message to be displayed in the report.
             */
            message: string;
            /**
             * Specifies the endpoint group to deliver the report to.
             */
            group?: string;
        }

        interface SetInterceptFileChooserDialogRequest {
            enabled: boolean;
        }

        interface DomContentEventFiredEvent {
            timestamp: Network.MonotonicTime;
        }

        const enum FileChooserOpenedEventMode {
            SelectSingle = 'selectSingle',
            SelectMultiple = 'selectMultiple',
        }

        /**
         * Emitted only when `page.interceptFileChooser` is enabled.
         */
        interface FileChooserOpenedEvent {
            /**
             * Id of the frame containing input node.
             */
            frameId: FrameId;
            /**
             * Input node id.
             */
            backendNodeId: DOM.BackendNodeId;
            /**
             * Input mode. (FileChooserOpenedEventMode enum)
             */
            mode: ('selectSingle' | 'selectMultiple');
        }

        /**
         * Fired when frame has been attached to its parent.
         */
        interface FrameAttachedEvent {
            /**
             * Id of the frame that has been attached.
             */
            frameId: FrameId;
            /**
             * Parent frame identifier.
             */
            parentFrameId: FrameId;
            /**
             * JavaScript stack trace of when frame was attached, only set if frame initiated from script.
             */
            stack?: Runtime.StackTrace;
        }

        /**
         * Fired when frame no longer has a scheduled navigation.
         */
        interface FrameClearedScheduledNavigationEvent {
            /**
             * Id of the frame that has cleared its scheduled navigation.
             */
            frameId: FrameId;
        }

        const enum FrameDetachedEventReason {
            Remove = 'remove',
            Swap = 'swap',
        }

        /**
         * Fired when frame has been detached from its parent.
         */
        interface FrameDetachedEvent {
            /**
             * Id of the frame that has been detached.
             */
            frameId: FrameId;
            /**
             *  (FrameDetachedEventReason enum)
             */
            reason: ('remove' | 'swap');
        }

        /**
         * Fired once navigation of the frame has completed. Frame is now associated with the new loader.
         */
        interface FrameNavigatedEvent {
            /**
             * Frame object.
             */
            frame: Frame;
        }

        /**
         * Fired when opening document to write to.
         */
        interface DocumentOpenedEvent {
            /**
             * Frame object.
             */
            frame: Frame;
        }

        /**
         * Fired when a renderer-initiated navigation is requested.
         * Navigation may still be cancelled after the event is issued.
         */
        interface FrameRequestedNavigationEvent {
            /**
             * Id of the frame that is being navigated.
             */
            frameId: FrameId;
            /**
             * The reason for the navigation.
             */
            reason: ClientNavigationReason;
            /**
             * The destination URL for the requested navigation.
             */
            url: string;
            /**
             * The disposition for the navigation.
             */
            disposition: ClientNavigationDisposition;
        }

        /**
         * Fired when frame schedules a potential navigation.
         */
        interface FrameScheduledNavigationEvent {
            /**
             * Id of the frame that has scheduled a navigation.
             */
            frameId: FrameId;
            /**
             * Delay (in seconds) until the navigation is scheduled to begin. The navigation is not
             * guaranteed to start.
             */
            delay: number;
            /**
             * The reason for the navigation.
             */
            reason: ClientNavigationReason;
            /**
             * The destination URL for the scheduled navigation.
             */
            url: string;
        }

        /**
         * Fired when frame has started loading.
         */
        interface FrameStartedLoadingEvent {
            /**
             * Id of the frame that has started loading.
             */
            frameId: FrameId;
        }

        /**
         * Fired when frame has stopped loading.
         */
        interface FrameStoppedLoadingEvent {
            /**
             * Id of the frame that has stopped loading.
             */
            frameId: FrameId;
        }

        /**
         * Fired when page is about to start a download.
         */
        interface DownloadWillBeginEvent {
            /**
             * Id of the frame that caused download to begin.
             */
            frameId: FrameId;
            /**
             * Global unique identifier of the download.
             */
            guid: string;
            /**
             * URL of the resource being downloaded.
             */
            url: string;
            /**
             * Suggested file name of the resource (the actual name of the file saved on disk may differ).
             */
            suggestedFilename: string;
        }

        const enum DownloadProgressEventState {
            InProgress = 'inProgress',
            Completed = 'completed',
            Canceled = 'canceled',
        }

        /**
         * Fired when download makes progress. Last call has |done| == true.
         */
        interface DownloadProgressEvent {
            /**
             * Global unique identifier of the download.
             */
            guid: string;
            /**
             * Total expected bytes to download.
             */
            totalBytes: number;
            /**
             * Total bytes received.
             */
            receivedBytes: number;
            /**
             * Download status. (DownloadProgressEventState enum)
             */
            state: ('inProgress' | 'completed' | 'canceled');
        }

        /**
         * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) has been
         * closed.
         */
        interface JavascriptDialogClosedEvent {
            /**
             * Whether dialog was confirmed.
             */
            result: boolean;
            /**
             * User input in case of prompt.
             */
            userInput: string;
        }

        /**
         * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) is about to
         * open.
         */
        interface JavascriptDialogOpeningEvent {
            /**
             * Frame url.
             */
            url: string;
            /**
             * Message that will be displayed by the dialog.
             */
            message: string;
            /**
             * Dialog type.
             */
            type: DialogType;
            /**
             * True iff browser is capable showing or acting on the given dialog. When browser has no
             * dialog handler for given target, calling alert while Page domain is engaged will stall
             * the page execution. Execution can be resumed via calling Page.handleJavaScriptDialog.
             */
            hasBrowserHandler: boolean;
            /**
             * Default dialog prompt.
             */
            defaultPrompt?: string;
        }

        /**
         * Fired for top level page lifecycle events such as navigation, load, paint, etc.
         */
        interface LifecycleEventEvent {
            /**
             * Id of the frame.
             */
            frameId: FrameId;
            /**
             * Loader identifier. Empty string if the request is fetched from worker.
             */
            loaderId: Network.LoaderId;
            name: string;
            timestamp: Network.MonotonicTime;
        }

        interface LoadEventFiredEvent {
            timestamp: Network.MonotonicTime;
        }

        /**
         * Fired when same-document navigation happens, e.g. due to history API usage or anchor navigation.
         */
        interface NavigatedWithinDocumentEvent {
            /**
             * Id of the frame.
             */
            frameId: FrameId;
            /**
             * Frame's new url.
             */
            url: string;
        }

        /**
         * Compressed image data requested by the `startScreencast`.
         */
        interface ScreencastFrameEvent {
            /**
             * Base64-encoded compressed image. (Encoded as a base64 string when passed over JSON)
             */
            data: string;
            /**
             * Screencast frame metadata.
             */
            metadata: ScreencastFrameMetadata;
            /**
             * Frame number.
             */
            sessionId: integer;
        }

        /**
         * Fired when the page with currently enabled screencast was shown or hidden `.
         */
        interface ScreencastVisibilityChangedEvent {
            /**
             * True if the page is visible.
             */
            visible: boolean;
        }

        /**
         * Fired when a new window is going to be opened, via window.open(), link click, form submission,
         * etc.
         */
        interface WindowOpenEvent {
            /**
             * The URL for the new window.
             */
            url: string;
            /**
             * Window name.
             */
            windowName: string;
            /**
             * An array of enabled window features.
             */
            windowFeatures: string[];
            /**
             * Whether or not it was triggered by user gesture.
             */
            userGesture: boolean;
        }

        /**
         * Issued for every compilation cache generated. Is only available
         * if Page.setGenerateCompilationCache is enabled.
         */
        interface CompilationCacheProducedEvent {
            url: string;
            /**
             * Base64-encoded data (Encoded as a base64 string when passed over JSON)
             */
            data: string;
        }
    }

    namespace Performance {

        /**
         * Run-time execution metric.
         */
        interface Metric {
            /**
             * Metric name.
             */
            name: string;
            /**
             * Metric value.
             */
            value: number;
        }

        const enum EnableRequestTimeDomain {
            TimeTicks = 'timeTicks',
            ThreadTicks = 'threadTicks',
        }

        interface EnableRequest {
            /**
             * Time domain to use for collecting and reporting duration metrics. (EnableRequestTimeDomain enum)
             */
            timeDomain?: ('timeTicks' | 'threadTicks');
        }

        const enum SetTimeDomainRequestTimeDomain {
            TimeTicks = 'timeTicks',
            ThreadTicks = 'threadTicks',
        }

        interface SetTimeDomainRequest {
            /**
             * Time domain (SetTimeDomainRequestTimeDomain enum)
             */
            timeDomain: ('timeTicks' | 'threadTicks');
        }

        interface GetMetricsResponse {
            /**
             * Current values for run-time metrics.
             */
            metrics: Metric[];
        }

        /**
         * Current values of the metrics.
         */
        interface MetricsEvent {
            /**
             * Current values of the metrics.
             */
            metrics: Metric[];
            /**
             * Timestamp title.
             */
            title: string;
        }
    }

    /**
     * Reporting of performance timeline events, as specified in
     * https://w3c.github.io/performance-timeline/#dom-performanceobserver.
     */
    namespace PerformanceTimeline {

        /**
         * See https://github.com/WICG/LargestContentfulPaint and largest_contentful_paint.idl
         */
        interface LargestContentfulPaint {
            renderTime: Network.TimeSinceEpoch;
            loadTime: Network.TimeSinceEpoch;
            /**
             * The number of pixels being painted.
             */
            size: number;
            /**
             * The id attribute of the element, if available.
             */
            elementId?: string;
            /**
             * The URL of the image (may be trimmed).
             */
            url?: string;
            nodeId?: DOM.BackendNodeId;
        }

        interface LayoutShiftAttribution {
            previousRect: DOM.Rect;
            currentRect: DOM.Rect;
            nodeId?: DOM.BackendNodeId;
        }

        /**
         * See https://wicg.github.io/layout-instability/#sec-layout-shift and layout_shift.idl
         */
        interface LayoutShift {
            /**
             * Score increment produced by this event.
             */
            value: number;
            hadRecentInput: boolean;
            lastInputTime: Network.TimeSinceEpoch;
            sources: LayoutShiftAttribution[];
        }

        interface TimelineEvent {
            /**
             * Identifies the frame that this event is related to. Empty for non-frame targets.
             */
            frameId: Page.FrameId;
            /**
             * The event type, as specified in https://w3c.github.io/performance-timeline/#dom-performanceentry-entrytype
             * This determines which of the optional "details" fiedls is present.
             */
            type: string;
            /**
             * Name may be empty depending on the type.
             */
            name: string;
            /**
             * Time in seconds since Epoch, monotonically increasing within document lifetime.
             */
            time: Network.TimeSinceEpoch;
            /**
             * Event duration, if applicable.
             */
            duration?: number;
            lcpDetails?: LargestContentfulPaint;
            layoutShiftDetails?: LayoutShift;
        }

        interface EnableRequest {
            /**
             * The types of event to report, as specified in
             * https://w3c.github.io/performance-timeline/#dom-performanceentry-entrytype
             * The specified filter overrides any previous filters, passing empty
             * filter disables recording.
             * Note that not all types exposed to the web platform are currently supported.
             */
            eventTypes: string[];
        }

        /**
         * Sent when a performance timeline event is added. See reportPerformanceTimeline method.
         */
        interface TimelineEventAddedEvent {
            event: TimelineEvent;
        }
    }

    /**
     * Security
     */
    namespace Security {

        /**
         * An internal certificate ID value.
         */
        type CertificateId = integer;

        /**
         * A description of mixed content (HTTP resources on HTTPS pages), as defined by
         * https://www.w3.org/TR/mixed-content/#categories
         */
        type MixedContentType = ('blockable' | 'optionally-blockable' | 'none');

        /**
         * The security level of a page or resource.
         */
        type SecurityState = ('unknown' | 'neutral' | 'insecure' | 'secure' | 'info' | 'insecure-broken');

        /**
         * Details about the security state of the page certificate.
         */
        interface CertificateSecurityState {
            /**
             * Protocol name (e.g. "TLS 1.2" or "QUIC").
             */
            protocol: string;
            /**
             * Key Exchange used by the connection, or the empty string if not applicable.
             */
            keyExchange: string;
            /**
             * (EC)DH group used by the connection, if applicable.
             */
            keyExchangeGroup?: string;
            /**
             * Cipher name.
             */
            cipher: string;
            /**
             * TLS MAC. Note that AEAD ciphers do not have separate MACs.
             */
            mac?: string;
            /**
             * Page certificate.
             */
            certificate: string[];
            /**
             * Certificate subject name.
             */
            subjectName: string;
            /**
             * Name of the issuing CA.
             */
            issuer: string;
            /**
             * Certificate valid from date.
             */
            validFrom: Network.TimeSinceEpoch;
            /**
             * Certificate valid to (expiration) date
             */
            validTo: Network.TimeSinceEpoch;
            /**
             * The highest priority network error code, if the certificate has an error.
             */
            certificateNetworkError?: string;
            /**
             * True if the certificate uses a weak signature aglorithm.
             */
            certificateHasWeakSignature: boolean;
            /**
             * True if the certificate has a SHA1 signature in the chain.
             */
            certificateHasSha1Signature: boolean;
            /**
             * True if modern SSL
             */
            modernSSL: boolean;
            /**
             * True if the connection is using an obsolete SSL protocol.
             */
            obsoleteSslProtocol: boolean;
            /**
             * True if the connection is using an obsolete SSL key exchange.
             */
            obsoleteSslKeyExchange: boolean;
            /**
             * True if the connection is using an obsolete SSL cipher.
             */
            obsoleteSslCipher: boolean;
            /**
             * True if the connection is using an obsolete SSL signature.
             */
            obsoleteSslSignature: boolean;
        }

        type SafetyTipStatus = ('badReputation' | 'lookalike');

        interface SafetyTipInfo {
            /**
             * Describes whether the page triggers any safety tips or reputation warnings. Default is unknown.
             */
            safetyTipStatus: SafetyTipStatus;
            /**
             * The URL the safety tip suggested ("Did you mean?"). Only filled in for lookalike matches.
             */
            safeUrl?: string;
        }

        /**
         * Security state information about the page.
         */
        interface VisibleSecurityState {
            /**
             * The security level of the page.
             */
            securityState: SecurityState;
            /**
             * Security state details about the page certificate.
             */
            certificateSecurityState?: CertificateSecurityState;
            /**
             * The type of Safety Tip triggered on the page. Note that this field will be set even if the Safety Tip UI was not actually shown.
             */
            safetyTipInfo?: SafetyTipInfo;
            /**
             * Array of security state issues ids.
             */
            securityStateIssueIds: string[];
        }

        /**
         * An explanation of an factor contributing to the security state.
         */
        interface SecurityStateExplanation {
            /**
             * Security state representing the severity of the factor being explained.
             */
            securityState: SecurityState;
            /**
             * Title describing the type of factor.
             */
            title: string;
            /**
             * Short phrase describing the type of factor.
             */
            summary: string;
            /**
             * Full text explanation of the factor.
             */
            description: string;
            /**
             * The type of mixed content described by the explanation.
             */
            mixedContentType: MixedContentType;
            /**
             * Page certificate.
             */
            certificate: string[];
            /**
             * Recommendations to fix any issues.
             */
            recommendations?: string[];
        }

        /**
         * Information about insecure content on the page.
         */
        interface InsecureContentStatus {
            /**
             * Always false.
             */
            ranMixedContent: boolean;
            /**
             * Always false.
             */
            displayedMixedContent: boolean;
            /**
             * Always false.
             */
            containedMixedForm: boolean;
            /**
             * Always false.
             */
            ranContentWithCertErrors: boolean;
            /**
             * Always false.
             */
            displayedContentWithCertErrors: boolean;
            /**
             * Always set to unknown.
             */
            ranInsecureContentStyle: SecurityState;
            /**
             * Always set to unknown.
             */
            displayedInsecureContentStyle: SecurityState;
        }

        /**
         * The action to take when a certificate error occurs. continue will continue processing the
         * request and cancel will cancel the request.
         */
        type CertificateErrorAction = ('continue' | 'cancel');

        interface SetIgnoreCertificateErrorsRequest {
            /**
             * If true, all certificate errors will be ignored.
             */
            ignore: boolean;
        }

        interface HandleCertificateErrorRequest {
            /**
             * The ID of the event.
             */
            eventId: integer;
            /**
             * The action to take on the certificate error.
             */
            action: CertificateErrorAction;
        }

        interface SetOverrideCertificateErrorsRequest {
            /**
             * If true, certificate errors will be overridden.
             */
            override: boolean;
        }

        /**
         * There is a certificate error. If overriding certificate errors is enabled, then it should be
         * handled with the `handleCertificateError` command. Note: this event does not fire if the
         * certificate error has been allowed internally. Only one client per target should override
         * certificate errors at the same time.
         */
        interface CertificateErrorEvent {
            /**
             * The ID of the event.
             */
            eventId: integer;
            /**
             * The type of the error.
             */
            errorType: string;
            /**
             * The url that was requested.
             */
            requestURL: string;
        }

        /**
         * The security state of the page changed.
         */
        interface VisibleSecurityStateChangedEvent {
            /**
             * Security state information about the page.
             */
            visibleSecurityState: VisibleSecurityState;
        }

        /**
         * The security state of the page changed.
         */
        interface SecurityStateChangedEvent {
            /**
             * Security state.
             */
            securityState: SecurityState;
            /**
             * True if the page was loaded over cryptographic transport such as HTTPS.
             */
            schemeIsCryptographic: boolean;
            /**
             * List of explanations for the security state. If the overall security state is `insecure` or
             * `warning`, at least one corresponding explanation should be included.
             */
            explanations: SecurityStateExplanation[];
            /**
             * Information about insecure content on the page.
             */
            insecureContentStatus: InsecureContentStatus;
            /**
             * Overrides user-visible description of the state.
             */
            summary?: string;
        }
    }

    namespace ServiceWorker {

        type RegistrationID = string;

        /**
         * ServiceWorker registration.
         */
        interface ServiceWorkerRegistration {
            registrationId: RegistrationID;
            scopeURL: string;
            isDeleted: boolean;
        }

        type ServiceWorkerVersionRunningStatus = ('stopped' | 'starting' | 'running' | 'stopping');

        type ServiceWorkerVersionStatus = ('new' | 'installing' | 'installed' | 'activating' | 'activated' | 'redundant');

        /**
         * ServiceWorker version.
         */
        interface ServiceWorkerVersion {
            versionId: string;
            registrationId: RegistrationID;
            scriptURL: string;
            runningStatus: ServiceWorkerVersionRunningStatus;
            status: ServiceWorkerVersionStatus;
            /**
             * The Last-Modified header value of the main script.
             */
            scriptLastModified?: number;
            /**
             * The time at which the response headers of the main script were received from the server.
             * For cached script it is the last time the cache entry was validated.
             */
            scriptResponseTime?: number;
            controlledClients?: Target.TargetID[];
            targetId?: Target.TargetID;
        }

        /**
         * ServiceWorker error message.
         */
        interface ServiceWorkerErrorMessage {
            errorMessage: string;
            registrationId: RegistrationID;
            versionId: string;
            sourceURL: string;
            lineNumber: integer;
            columnNumber: integer;
        }

        interface DeliverPushMessageRequest {
            origin: string;
            registrationId: RegistrationID;
            data: string;
        }

        interface DispatchSyncEventRequest {
            origin: string;
            registrationId: RegistrationID;
            tag: string;
            lastChance: boolean;
        }

        interface DispatchPeriodicSyncEventRequest {
            origin: string;
            registrationId: RegistrationID;
            tag: string;
        }

        interface InspectWorkerRequest {
            versionId: string;
        }

        interface SetForceUpdateOnPageLoadRequest {
            forceUpdateOnPageLoad: boolean;
        }

        interface SkipWaitingRequest {
            scopeURL: string;
        }

        interface StartWorkerRequest {
            scopeURL: string;
        }

        interface StopWorkerRequest {
            versionId: string;
        }

        interface UnregisterRequest {
            scopeURL: string;
        }

        interface UpdateRegistrationRequest {
            scopeURL: string;
        }

        interface WorkerErrorReportedEvent {
            errorMessage: ServiceWorkerErrorMessage;
        }

        interface WorkerRegistrationUpdatedEvent {
            registrations: ServiceWorkerRegistration[];
        }

        interface WorkerVersionUpdatedEvent {
            versions: ServiceWorkerVersion[];
        }
    }

    namespace Storage {

        /**
         * Enum of possible storage types.
         */
        type StorageType = ('appcache' | 'cookies' | 'file_systems' | 'indexeddb' | 'local_storage' | 'shader_cache' | 'websql' | 'service_workers' | 'cache_storage' | 'all' | 'other');

        /**
         * Usage for a storage type.
         */
        interface UsageForType {
            /**
             * Name of storage type.
             */
            storageType: StorageType;
            /**
             * Storage usage (bytes).
             */
            usage: number;
        }

        /**
         * Pair of issuer origin and number of available (signed, but not used) Trust
         * Tokens from that issuer.
         */
        interface TrustTokens {
            issuerOrigin: string;
            count: number;
        }

        interface ClearDataForOriginRequest {
            /**
             * Security origin.
             */
            origin: string;
            /**
             * Comma separated list of StorageType to clear.
             */
            storageTypes: string;
        }

        interface GetCookiesRequest {
            /**
             * Browser context to use when called on the browser endpoint.
             */
            browserContextId?: Browser.BrowserContextID;
        }

        interface GetCookiesResponse {
            /**
             * Array of cookie objects.
             */
            cookies: Network.Cookie[];
        }

        interface SetCookiesRequest {
            /**
             * Cookies to be set.
             */
            cookies: Network.CookieParam[];
            /**
             * Browser context to use when called on the browser endpoint.
             */
            browserContextId?: Browser.BrowserContextID;
        }

        interface ClearCookiesRequest {
            /**
             * Browser context to use when called on the browser endpoint.
             */
            browserContextId?: Browser.BrowserContextID;
        }

        interface GetUsageAndQuotaRequest {
            /**
             * Security origin.
             */
            origin: string;
        }

        interface GetUsageAndQuotaResponse {
            /**
             * Storage usage (bytes).
             */
            usage: number;
            /**
             * Storage quota (bytes).
             */
            quota: number;
            /**
             * Whether or not the origin has an active storage quota override
             */
            overrideActive: boolean;
            /**
             * Storage usage per type (bytes).
             */
            usageBreakdown: UsageForType[];
        }

        interface OverrideQuotaForOriginRequest {
            /**
             * Security origin.
             */
            origin: string;
            /**
             * The quota size (in bytes) to override the original quota with.
             * If this is called multiple times, the overriden quota will be equal to
             * the quotaSize provided in the final call. If this is called without
             * specifying a quotaSize, the quota will be reset to the default value for
             * the specified origin. If this is called multiple times with different
             * origins, the override will be maintained for each origin until it is
             * disabled (called without a quotaSize).
             */
            quotaSize?: number;
        }

        interface TrackCacheStorageForOriginRequest {
            /**
             * Security origin.
             */
            origin: string;
        }

        interface TrackIndexedDBForOriginRequest {
            /**
             * Security origin.
             */
            origin: string;
        }

        interface UntrackCacheStorageForOriginRequest {
            /**
             * Security origin.
             */
            origin: string;
        }

        interface UntrackIndexedDBForOriginRequest {
            /**
             * Security origin.
             */
            origin: string;
        }

        interface GetTrustTokensResponse {
            tokens: TrustTokens[];
        }

        /**
         * A cache's contents have been modified.
         */
        interface CacheStorageContentUpdatedEvent {
            /**
             * Origin to update.
             */
            origin: string;
            /**
             * Name of cache in origin.
             */
            cacheName: string;
        }

        /**
         * A cache has been added/deleted.
         */
        interface CacheStorageListUpdatedEvent {
            /**
             * Origin to update.
             */
            origin: string;
        }

        /**
         * The origin's IndexedDB object store has been modified.
         */
        interface IndexedDBContentUpdatedEvent {
            /**
             * Origin to update.
             */
            origin: string;
            /**
             * Database to update.
             */
            databaseName: string;
            /**
             * ObjectStore to update.
             */
            objectStoreName: string;
        }

        /**
         * The origin's IndexedDB database list has been modified.
         */
        interface IndexedDBListUpdatedEvent {
            /**
             * Origin to update.
             */
            origin: string;
        }
    }

    /**
     * The SystemInfo domain defines methods and events for querying low-level system information.
     */
    namespace SystemInfo {

        /**
         * Describes a single graphics processor (GPU).
         */
        interface GPUDevice {
            /**
             * PCI ID of the GPU vendor, if available; 0 otherwise.
             */
            vendorId: number;
            /**
             * PCI ID of the GPU device, if available; 0 otherwise.
             */
            deviceId: number;
            /**
             * Sub sys ID of the GPU, only available on Windows.
             */
            subSysId?: number;
            /**
             * Revision of the GPU, only available on Windows.
             */
            revision?: number;
            /**
             * String description of the GPU vendor, if the PCI ID is not available.
             */
            vendorString: string;
            /**
             * String description of the GPU device, if the PCI ID is not available.
             */
            deviceString: string;
            /**
             * String description of the GPU driver vendor.
             */
            driverVendor: string;
            /**
             * String description of the GPU driver version.
             */
            driverVersion: string;
        }

        /**
         * Describes the width and height dimensions of an entity.
         */
        interface Size {
            /**
             * Width in pixels.
             */
            width: integer;
            /**
             * Height in pixels.
             */
            height: integer;
        }

        /**
         * Describes a supported video decoding profile with its associated minimum and
         * maximum resolutions.
         */
        interface VideoDecodeAcceleratorCapability {
            /**
             * Video codec profile that is supported, e.g. VP9 Profile 2.
             */
            profile: string;
            /**
             * Maximum video dimensions in pixels supported for this |profile|.
             */
            maxResolution: Size;
            /**
             * Minimum video dimensions in pixels supported for this |profile|.
             */
            minResolution: Size;
        }

        /**
         * Describes a supported video encoding profile with its associated maximum
         * resolution and maximum framerate.
         */
        interface VideoEncodeAcceleratorCapability {
            /**
             * Video codec profile that is supported, e.g H264 Main.
             */
            profile: string;
            /**
             * Maximum video dimensions in pixels supported for this |profile|.
             */
            maxResolution: Size;
            /**
             * Maximum encoding framerate in frames per second supported for this
             * |profile|, as fraction's numerator and denominator, e.g. 24/1 fps,
             * 24000/1001 fps, etc.
             */
            maxFramerateNumerator: integer;
            maxFramerateDenominator: integer;
        }

        /**
         * YUV subsampling type of the pixels of a given image.
         */
        type SubsamplingFormat = ('yuv420' | 'yuv422' | 'yuv444');

        /**
         * Image format of a given image.
         */
        type ImageType = ('jpeg' | 'webp' | 'unknown');

        /**
         * Describes a supported image decoding profile with its associated minimum and
         * maximum resolutions and subsampling.
         */
        interface ImageDecodeAcceleratorCapability {
            /**
             * Image coded, e.g. Jpeg.
             */
            imageType: ImageType;
            /**
             * Maximum supported dimensions of the image in pixels.
             */
            maxDimensions: Size;
            /**
             * Minimum supported dimensions of the image in pixels.
             */
            minDimensions: Size;
            /**
             * Optional array of supported subsampling formats, e.g. 4:2:0, if known.
             */
            subsamplings: SubsamplingFormat[];
        }

        /**
         * Provides information about the GPU(s) on the system.
         */
        interface GPUInfo {
            /**
             * The graphics devices on the system. Element 0 is the primary GPU.
             */
            devices: GPUDevice[];
            /**
             * An optional dictionary of additional GPU related attributes.
             */
            auxAttributes?: any;
            /**
             * An optional dictionary of graphics features and their status.
             */
            featureStatus?: any;
            /**
             * An optional array of GPU driver bug workarounds.
             */
            driverBugWorkarounds: string[];
            /**
             * Supported accelerated video decoding capabilities.
             */
            videoDecoding: VideoDecodeAcceleratorCapability[];
            /**
             * Supported accelerated video encoding capabilities.
             */
            videoEncoding: VideoEncodeAcceleratorCapability[];
            /**
             * Supported accelerated image decoding capabilities.
             */
            imageDecoding: ImageDecodeAcceleratorCapability[];
        }

        /**
         * Represents process info.
         */
        interface ProcessInfo {
            /**
             * Specifies process type.
             */
            type: string;
            /**
             * Specifies process id.
             */
            id: integer;
            /**
             * Specifies cumulative CPU usage in seconds across all threads of the
             * process since the process start.
             */
            cpuTime: number;
        }

        interface GetInfoResponse {
            /**
             * Information about the GPUs on the system.
             */
            gpu: GPUInfo;
            /**
             * A platform-dependent description of the model of the machine. On Mac OS, this is, for
             * example, 'MacBookPro'. Will be the empty string if not supported.
             */
            modelName: string;
            /**
             * A platform-dependent description of the version of the machine. On Mac OS, this is, for
             * example, '10.1'. Will be the empty string if not supported.
             */
            modelVersion: string;
            /**
             * The command line string used to launch the browser. Will be the empty string if not
             * supported.
             */
            commandLine: string;
        }

        interface GetProcessInfoResponse {
            /**
             * An array of process info blocks.
             */
            processInfo: ProcessInfo[];
        }
    }

    /**
     * Supports additional targets discovery and allows to attach to them.
     */
    namespace Target {

        type TargetID = string;

        /**
         * Unique identifier of attached debugging session.
         */
        type SessionID = string;

        interface TargetInfo {
            targetId: TargetID;
            type: string;
            title: string;
            url: string;
            /**
             * Whether the target has an attached client.
             */
            attached: boolean;
            /**
             * Opener target Id
             */
            openerId?: TargetID;
            /**
             * Whether the target has access to the originating window.
             */
            canAccessOpener: boolean;
            /**
             * Frame id of originating window (is only set if target has an opener).
             */
            openerFrameId?: Page.FrameId;
            browserContextId?: Browser.BrowserContextID;
        }

        interface RemoteLocation {
            host: string;
            port: integer;
        }

        interface ActivateTargetRequest {
            targetId: TargetID;
        }

        interface AttachToTargetRequest {
            targetId: TargetID;
            /**
             * Enables "flat" access to the session via specifying sessionId attribute in the commands.
             * We plan to make this the default, deprecate non-flattened mode,
             * and eventually retire it. See crbug.com/991325.
             */
            flatten?: boolean;
        }

        interface AttachToTargetResponse {
            /**
             * Id assigned to the session.
             */
            sessionId: SessionID;
        }

        interface AttachToBrowserTargetResponse {
            /**
             * Id assigned to the session.
             */
            sessionId: SessionID;
        }

        interface CloseTargetRequest {
            targetId: TargetID;
        }

        interface CloseTargetResponse {
            /**
             * Always set to true. If an error occurs, the response indicates protocol error.
             */
            success: boolean;
        }

        interface ExposeDevToolsProtocolRequest {
            targetId: TargetID;
            /**
             * Binding name, 'cdp' if not specified.
             */
            bindingName?: string;
        }

        interface CreateBrowserContextRequest {
            /**
             * If specified, disposes this context when debugging session disconnects.
             */
            disposeOnDetach?: boolean;
            /**
             * Proxy server, similar to the one passed to --proxy-server
             */
            proxyServer?: string;
            /**
             * Proxy bypass list, similar to the one passed to --proxy-bypass-list
             */
            proxyBypassList?: string;
        }

        interface CreateBrowserContextResponse {
            /**
             * The id of the context created.
             */
            browserContextId: Browser.BrowserContextID;
        }

        interface GetBrowserContextsResponse {
            /**
             * An array of browser context ids.
             */
            browserContextIds: Browser.BrowserContextID[];
        }

        interface CreateTargetRequest {
            /**
             * The initial URL the page will be navigated to.
             */
            url: string;
            /**
             * Frame width in DIP (headless chrome only).
             */
            width?: integer;
            /**
             * Frame height in DIP (headless chrome only).
             */
            height?: integer;
            /**
             * The browser context to create the page in.
             */
            browserContextId?: Browser.BrowserContextID;
            /**
             * Whether BeginFrames for this target will be controlled via DevTools (headless chrome only,
             * not supported on MacOS yet, false by default).
             */
            enableBeginFrameControl?: boolean;
            /**
             * Whether to create a new Window or Tab (chrome-only, false by default).
             */
            newWindow?: boolean;
            /**
             * Whether to create the target in background or foreground (chrome-only,
             * false by default).
             */
            background?: boolean;
        }

        interface CreateTargetResponse {
            /**
             * The id of the page opened.
             */
            targetId: TargetID;
        }

        interface DetachFromTargetRequest {
            /**
             * Session to detach.
             */
            sessionId?: SessionID;
            /**
             * Deprecated.
             */
            targetId?: TargetID;
        }

        interface DisposeBrowserContextRequest {
            browserContextId: Browser.BrowserContextID;
        }

        interface GetTargetInfoRequest {
            targetId?: TargetID;
        }

        interface GetTargetInfoResponse {
            targetInfo: TargetInfo;
        }

        interface GetTargetsResponse {
            /**
             * The list of targets.
             */
            targetInfos: TargetInfo[];
        }

        interface SendMessageToTargetRequest {
            message: string;
            /**
             * Identifier of the session.
             */
            sessionId?: SessionID;
            /**
             * Deprecated.
             */
            targetId?: TargetID;
        }

        interface SetAutoAttachRequest {
            /**
             * Whether to auto-attach to related targets.
             */
            autoAttach: boolean;
            /**
             * Whether to pause new targets when attaching to them. Use `Runtime.runIfWaitingForDebugger`
             * to run paused targets.
             */
            waitForDebuggerOnStart: boolean;
            /**
             * Enables "flat" access to the session via specifying sessionId attribute in the commands.
             * We plan to make this the default, deprecate non-flattened mode,
             * and eventually retire it. See crbug.com/991325.
             */
            flatten?: boolean;
        }

        interface SetDiscoverTargetsRequest {
            /**
             * Whether to discover available targets.
             */
            discover: boolean;
        }

        interface SetRemoteLocationsRequest {
            /**
             * List of remote locations.
             */
            locations: RemoteLocation[];
        }

        /**
         * Issued when attached to target because of auto-attach or `attachToTarget` command.
         */
        interface AttachedToTargetEvent {
            /**
             * Identifier assigned to the session used to send/receive messages.
             */
            sessionId: SessionID;
            targetInfo: TargetInfo;
            waitingForDebugger: boolean;
        }

        /**
         * Issued when detached from target for any reason (including `detachFromTarget` command). Can be
         * issued multiple times per target if multiple sessions have been attached to it.
         */
        interface DetachedFromTargetEvent {
            /**
             * Detached session identifier.
             */
            sessionId: SessionID;
            /**
             * Deprecated.
             */
            targetId?: TargetID;
        }

        /**
         * Notifies about a new protocol message received from the session (as reported in
         * `attachedToTarget` event).
         */
        interface ReceivedMessageFromTargetEvent {
            /**
             * Identifier of a session which sends a message.
             */
            sessionId: SessionID;
            message: string;
            /**
             * Deprecated.
             */
            targetId?: TargetID;
        }

        /**
         * Issued when a possible inspection target is created.
         */
        interface TargetCreatedEvent {
            targetInfo: TargetInfo;
        }

        /**
         * Issued when a target is destroyed.
         */
        interface TargetDestroyedEvent {
            targetId: TargetID;
        }

        /**
         * Issued when a target has crashed.
         */
        interface TargetCrashedEvent {
            targetId: TargetID;
            /**
             * Termination status type.
             */
            status: string;
            /**
             * Termination error code.
             */
            errorCode: integer;
        }

        /**
         * Issued when some information about a target has changed. This only happens between
         * `targetCreated` and `targetDestroyed`.
         */
        interface TargetInfoChangedEvent {
            targetInfo: TargetInfo;
        }
    }

    /**
     * The Tethering domain defines methods and events for browser port binding.
     */
    namespace Tethering {

        interface BindRequest {
            /**
             * Port number to bind.
             */
            port: integer;
        }

        interface UnbindRequest {
            /**
             * Port number to unbind.
             */
            port: integer;
        }

        /**
         * Informs that port was successfully bound and got a specified connection id.
         */
        interface AcceptedEvent {
            /**
             * Port number that was successfully bound.
             */
            port: integer;
            /**
             * Connection id to be used.
             */
            connectionId: string;
        }
    }

    namespace Tracing {

        /**
         * Configuration for memory dump. Used only when "memory-infra" category is enabled.
         */
        interface MemoryDumpConfig {
            [key: string]: string;
        }

        const enum TraceConfigRecordMode {
            RecordUntilFull = 'recordUntilFull',
            RecordContinuously = 'recordContinuously',
            RecordAsMuchAsPossible = 'recordAsMuchAsPossible',
            EchoToConsole = 'echoToConsole',
        }

        interface TraceConfig {
            /**
             * Controls how the trace buffer stores data. (TraceConfigRecordMode enum)
             */
            recordMode?: ('recordUntilFull' | 'recordContinuously' | 'recordAsMuchAsPossible' | 'echoToConsole');
            /**
             * Turns on JavaScript stack sampling.
             */
            enableSampling?: boolean;
            /**
             * Turns on system tracing.
             */
            enableSystrace?: boolean;
            /**
             * Turns on argument filter.
             */
            enableArgumentFilter?: boolean;
            /**
             * Included category filters.
             */
            includedCategories?: string[];
            /**
             * Excluded category filters.
             */
            excludedCategories?: string[];
            /**
             * Configuration to synthesize the delays in tracing.
             */
            syntheticDelays?: string[];
            /**
             * Configuration for memory dump triggers. Used only when "memory-infra" category is enabled.
             */
            memoryDumpConfig?: MemoryDumpConfig;
        }

        /**
         * Data format of a trace. Can be either the legacy JSON format or the
         * protocol buffer format. Note that the JSON format will be deprecated soon.
         */
        type StreamFormat = ('json' | 'proto');

        /**
         * Compression type to use for traces returned via streams.
         */
        type StreamCompression = ('none' | 'gzip');

        /**
         * Details exposed when memory request explicitly declared.
         * Keep consistent with memory_dump_request_args.h and
         * memory_instrumentation.mojom
         */
        type MemoryDumpLevelOfDetail = ('background' | 'light' | 'detailed');

        interface GetCategoriesResponse {
            /**
             * A list of supported tracing categories.
             */
            categories: string[];
        }

        interface RecordClockSyncMarkerRequest {
            /**
             * The ID of this clock sync marker
             */
            syncId: string;
        }

        interface RequestMemoryDumpRequest {
            /**
             * Enables more deterministic results by forcing garbage collection
             */
            deterministic?: boolean;
            /**
             * Specifies level of details in memory dump. Defaults to "detailed".
             */
            levelOfDetail?: MemoryDumpLevelOfDetail;
        }

        interface RequestMemoryDumpResponse {
            /**
             * GUID of the resulting global memory dump.
             */
            dumpGuid: string;
            /**
             * True iff the global memory dump succeeded.
             */
            success: boolean;
        }

        const enum StartRequestTransferMode {
            ReportEvents = 'ReportEvents',
            ReturnAsStream = 'ReturnAsStream',
        }

        interface StartRequest {
            /**
             * Category/tag filter
             */
            categories?: string;
            /**
             * Tracing options
             */
            options?: string;
            /**
             * If set, the agent will issue bufferUsage events at this interval, specified in milliseconds
             */
            bufferUsageReportingInterval?: number;
            /**
             * Whether to report trace events as series of dataCollected events or to save trace to a
             * stream (defaults to `ReportEvents`). (StartRequestTransferMode enum)
             */
            transferMode?: ('ReportEvents' | 'ReturnAsStream');
            /**
             * Trace data format to use. This only applies when using `ReturnAsStream`
             * transfer mode (defaults to `json`).
             */
            streamFormat?: StreamFormat;
            /**
             * Compression format to use. This only applies when using `ReturnAsStream`
             * transfer mode (defaults to `none`)
             */
            streamCompression?: StreamCompression;
            traceConfig?: TraceConfig;
            /**
             * Base64-encoded serialized perfetto.protos.TraceConfig protobuf message
             * When specified, the parameters `categories`, `options`, `traceConfig`
             * are ignored. (Encoded as a base64 string when passed over JSON)
             */
            perfettoConfig?: string;
        }

        interface BufferUsageEvent {
            /**
             * A number in range [0..1] that indicates the used size of event buffer as a fraction of its
             * total size.
             */
            percentFull?: number;
            /**
             * An approximate number of events in the trace log.
             */
            eventCount?: number;
            /**
             * A number in range [0..1] that indicates the used size of event buffer as a fraction of its
             * total size.
             */
            value?: number;
        }

        /**
         * Contains an bucket of collected trace events. When tracing is stopped collected events will be
         * send as a sequence of dataCollected events followed by tracingComplete event.
         */
        interface DataCollectedEvent {
            value: any[];
        }

        /**
         * Signals that tracing is stopped and there is no trace buffers pending flush, all data were
         * delivered via dataCollected events.
         */
        interface TracingCompleteEvent {
            /**
             * Indicates whether some trace data is known to have been lost, e.g. because the trace ring
             * buffer wrapped around.
             */
            dataLossOccurred: boolean;
            /**
             * A handle of the stream that holds resulting trace data.
             */
            stream?: IO.StreamHandle;
            /**
             * Trace data format of returned stream.
             */
            traceFormat?: StreamFormat;
            /**
             * Compression format of returned stream.
             */
            streamCompression?: StreamCompression;
        }
    }

    /**
     * A domain for letting clients substitute browser's network layer with client code.
     */
    namespace Fetch {

        /**
         * Unique request identifier.
         */
        type RequestId = string;

        /**
         * Stages of the request to handle. Request will intercept before the request is
         * sent. Response will intercept after the response is received (but before response
         * body is received.
         */
        type RequestStage = ('Request' | 'Response');

        interface RequestPattern {
            /**
             * Wildcards ('*' -> zero or more, '?' -> exactly one) are allowed. Escape character is
             * backslash. Omitting is equivalent to "*".
             */
            urlPattern?: string;
            /**
             * If set, only requests for matching resource types will be intercepted.
             */
            resourceType?: Network.ResourceType;
            /**
             * Stage at wich to begin intercepting requests. Default is Request.
             */
            requestStage?: RequestStage;
        }

        /**
         * Response HTTP header entry
         */
        interface HeaderEntry {
            name: string;
            value: string;
        }

        const enum AuthChallengeSource {
            Server = 'Server',
            Proxy = 'Proxy',
        }

        /**
         * Authorization challenge for HTTP status code 401 or 407.
         */
        interface AuthChallenge {
            /**
             * Source of the authentication challenge. (AuthChallengeSource enum)
             */
            source?: ('Server' | 'Proxy');
            /**
             * Origin of the challenger.
             */
            origin: string;
            /**
             * The authentication scheme used, such as basic or digest
             */
            scheme: string;
            /**
             * The realm of the challenge. May be empty.
             */
            realm: string;
        }

        const enum AuthChallengeResponseResponse {
            Default = 'Default',
            CancelAuth = 'CancelAuth',
            ProvideCredentials = 'ProvideCredentials',
        }

        /**
         * Response to an AuthChallenge.
         */
        interface AuthChallengeResponse {
            /**
             * The decision on what to do in response to the authorization challenge.  Default means
             * deferring to the default behavior of the net stack, which will likely either the Cancel
             * authentication or display a popup dialog box. (AuthChallengeResponseResponse enum)
             */
            response: ('Default' | 'CancelAuth' | 'ProvideCredentials');
            /**
             * The username to provide, possibly empty. Should only be set if response is
             * ProvideCredentials.
             */
            username?: string;
            /**
             * The password to provide, possibly empty. Should only be set if response is
             * ProvideCredentials.
             */
            password?: string;
        }

        interface EnableRequest {
            /**
             * If specified, only requests matching any of these patterns will produce
             * fetchRequested event and will be paused until clients response. If not set,
             * all requests will be affected.
             */
            patterns?: RequestPattern[];
            /**
             * If true, authRequired events will be issued and requests will be paused
             * expecting a call to continueWithAuth.
             */
            handleAuthRequests?: boolean;
        }

        interface FailRequestRequest {
            /**
             * An id the client received in requestPaused event.
             */
            requestId: RequestId;
            /**
             * Causes the request to fail with the given reason.
             */
            errorReason: Network.ErrorReason;
        }

        interface FulfillRequestRequest {
            /**
             * An id the client received in requestPaused event.
             */
            requestId: RequestId;
            /**
             * An HTTP response code.
             */
            responseCode: integer;
            /**
             * Response headers.
             */
            responseHeaders?: HeaderEntry[];
            /**
             * Alternative way of specifying response headers as a \0-separated
             * series of name: value pairs. Prefer the above method unless you
             * need to represent some non-UTF8 values that can't be transmitted
             * over the protocol as text. (Encoded as a base64 string when passed over JSON)
             */
            binaryResponseHeaders?: string;
            /**
             * A response body. (Encoded as a base64 string when passed over JSON)
             */
            body?: string;
            /**
             * A textual representation of responseCode.
             * If absent, a standard phrase matching responseCode is used.
             */
            responsePhrase?: string;
        }

        interface ContinueRequestRequest {
            /**
             * An id the client received in requestPaused event.
             */
            requestId: RequestId;
            /**
             * If set, the request url will be modified in a way that's not observable by page.
             */
            url?: string;
            /**
             * If set, the request method is overridden.
             */
            method?: string;
            /**
             * If set, overrides the post data in the request. (Encoded as a base64 string when passed over JSON)
             */
            postData?: string;
            /**
             * If set, overrides the request headers.
             */
            headers?: HeaderEntry[];
        }

        interface ContinueWithAuthRequest {
            /**
             * An id the client received in authRequired event.
             */
            requestId: RequestId;
            /**
             * Response to  with an authChallenge.
             */
            authChallengeResponse: AuthChallengeResponse;
        }

        interface GetResponseBodyRequest {
            /**
             * Identifier for the intercepted request to get body for.
             */
            requestId: RequestId;
        }

        interface GetResponseBodyResponse {
            /**
             * Response body.
             */
            body: string;
            /**
             * True, if content was sent as base64.
             */
            base64Encoded: boolean;
        }

        interface TakeResponseBodyAsStreamRequest {
            requestId: RequestId;
        }

        interface TakeResponseBodyAsStreamResponse {
            stream: IO.StreamHandle;
        }

        /**
         * Issued when the domain is enabled and the request URL matches the
         * specified filter. The request is paused until the client responds
         * with one of continueRequest, failRequest or fulfillRequest.
         * The stage of the request can be determined by presence of responseErrorReason
         * and responseStatusCode -- the request is at the response stage if either
         * of these fields is present and in the request stage otherwise.
         */
        interface RequestPausedEvent {
            /**
             * Each request the page makes will have a unique id.
             */
            requestId: RequestId;
            /**
             * The details of the request.
             */
            request: Network.Request;
            /**
             * The id of the frame that initiated the request.
             */
            frameId: Page.FrameId;
            /**
             * How the requested resource will be used.
             */
            resourceType: Network.ResourceType;
            /**
             * Response error if intercepted at response stage.
             */
            responseErrorReason?: Network.ErrorReason;
            /**
             * Response code if intercepted at response stage.
             */
            responseStatusCode?: integer;
            /**
             * Response headers if intercepted at the response stage.
             */
            responseHeaders?: HeaderEntry[];
            /**
             * If the intercepted request had a corresponding Network.requestWillBeSent event fired for it,
             * then this networkId will be the same as the requestId present in the requestWillBeSent event.
             */
            networkId?: RequestId;
        }

        /**
         * Issued when the domain is enabled with handleAuthRequests set to true.
         * The request is paused until client responds with continueWithAuth.
         */
        interface AuthRequiredEvent {
            /**
             * Each request the page makes will have a unique id.
             */
            requestId: RequestId;
            /**
             * The details of the request.
             */
            request: Network.Request;
            /**
             * The id of the frame that initiated the request.
             */
            frameId: Page.FrameId;
            /**
             * How the requested resource will be used.
             */
            resourceType: Network.ResourceType;
            /**
             * Details of the Authorization Challenge encountered.
             * If this is set, client should respond with continueRequest that
             * contains AuthChallengeResponse.
             */
            authChallenge: AuthChallenge;
        }
    }

    /**
     * This domain allows inspection of Web Audio API.
     * https://webaudio.github.io/web-audio-api/
     */
    namespace WebAudio {

        /**
         * An unique ID for a graph object (AudioContext, AudioNode, AudioParam) in Web Audio API
         */
        type GraphObjectId = string;

        /**
         * Enum of BaseAudioContext types
         */
        type ContextType = ('realtime' | 'offline');

        /**
         * Enum of AudioContextState from the spec
         */
        type ContextState = ('suspended' | 'running' | 'closed');

        /**
         * Enum of AudioNode types
         */
        type NodeType = string;

        /**
         * Enum of AudioNode::ChannelCountMode from the spec
         */
        type ChannelCountMode = ('clamped-max' | 'explicit' | 'max');

        /**
         * Enum of AudioNode::ChannelInterpretation from the spec
         */
        type ChannelInterpretation = ('discrete' | 'speakers');

        /**
         * Enum of AudioParam types
         */
        type ParamType = string;

        /**
         * Enum of AudioParam::AutomationRate from the spec
         */
        type AutomationRate = ('a-rate' | 'k-rate');

        /**
         * Fields in AudioContext that change in real-time.
         */
        interface ContextRealtimeData {
            /**
             * The current context time in second in BaseAudioContext.
             */
            currentTime: number;
            /**
             * The time spent on rendering graph divided by render qunatum duration,
             * and multiplied by 100. 100 means the audio renderer reached the full
             * capacity and glitch may occur.
             */
            renderCapacity: number;
            /**
             * A running mean of callback interval.
             */
            callbackIntervalMean: number;
            /**
             * A running variance of callback interval.
             */
            callbackIntervalVariance: number;
        }

        /**
         * Protocol object for BaseAudioContext
         */
        interface BaseAudioContext {
            contextId: GraphObjectId;
            contextType: ContextType;
            contextState: ContextState;
            realtimeData?: ContextRealtimeData;
            /**
             * Platform-dependent callback buffer size.
             */
            callbackBufferSize: number;
            /**
             * Number of output channels supported by audio hardware in use.
             */
            maxOutputChannelCount: number;
            /**
             * Context sample rate.
             */
            sampleRate: number;
        }

        /**
         * Protocol object for AudioListener
         */
        interface AudioListener {
            listenerId: GraphObjectId;
            contextId: GraphObjectId;
        }

        /**
         * Protocol object for AudioNode
         */
        interface AudioNode {
            nodeId: GraphObjectId;
            contextId: GraphObjectId;
            nodeType: NodeType;
            numberOfInputs: number;
            numberOfOutputs: number;
            channelCount: number;
            channelCountMode: ChannelCountMode;
            channelInterpretation: ChannelInterpretation;
        }

        /**
         * Protocol object for AudioParam
         */
        interface AudioParam {
            paramId: GraphObjectId;
            nodeId: GraphObjectId;
            contextId: GraphObjectId;
            paramType: ParamType;
            rate: AutomationRate;
            defaultValue: number;
            minValue: number;
            maxValue: number;
        }

        interface GetRealtimeDataRequest {
            contextId: GraphObjectId;
        }

        interface GetRealtimeDataResponse {
            realtimeData: ContextRealtimeData;
        }

        /**
         * Notifies that a new BaseAudioContext has been created.
         */
        interface ContextCreatedEvent {
            context: BaseAudioContext;
        }

        /**
         * Notifies that an existing BaseAudioContext will be destroyed.
         */
        interface ContextWillBeDestroyedEvent {
            contextId: GraphObjectId;
        }

        /**
         * Notifies that existing BaseAudioContext has changed some properties (id stays the same)..
         */
        interface ContextChangedEvent {
            context: BaseAudioContext;
        }

        /**
         * Notifies that the construction of an AudioListener has finished.
         */
        interface AudioListenerCreatedEvent {
            listener: AudioListener;
        }

        /**
         * Notifies that a new AudioListener has been created.
         */
        interface AudioListenerWillBeDestroyedEvent {
            contextId: GraphObjectId;
            listenerId: GraphObjectId;
        }

        /**
         * Notifies that a new AudioNode has been created.
         */
        interface AudioNodeCreatedEvent {
            node: AudioNode;
        }

        /**
         * Notifies that an existing AudioNode has been destroyed.
         */
        interface AudioNodeWillBeDestroyedEvent {
            contextId: GraphObjectId;
            nodeId: GraphObjectId;
        }

        /**
         * Notifies that a new AudioParam has been created.
         */
        interface AudioParamCreatedEvent {
            param: AudioParam;
        }

        /**
         * Notifies that an existing AudioParam has been destroyed.
         */
        interface AudioParamWillBeDestroyedEvent {
            contextId: GraphObjectId;
            nodeId: GraphObjectId;
            paramId: GraphObjectId;
        }

        /**
         * Notifies that two AudioNodes are connected.
         */
        interface NodesConnectedEvent {
            contextId: GraphObjectId;
            sourceId: GraphObjectId;
            destinationId: GraphObjectId;
            sourceOutputIndex?: number;
            destinationInputIndex?: number;
        }

        /**
         * Notifies that AudioNodes are disconnected. The destination can be null, and it means all the outgoing connections from the source are disconnected.
         */
        interface NodesDisconnectedEvent {
            contextId: GraphObjectId;
            sourceId: GraphObjectId;
            destinationId: GraphObjectId;
            sourceOutputIndex?: number;
            destinationInputIndex?: number;
        }

        /**
         * Notifies that an AudioNode is connected to an AudioParam.
         */
        interface NodeParamConnectedEvent {
            contextId: GraphObjectId;
            sourceId: GraphObjectId;
            destinationId: GraphObjectId;
            sourceOutputIndex?: number;
        }

        /**
         * Notifies that an AudioNode is disconnected to an AudioParam.
         */
        interface NodeParamDisconnectedEvent {
            contextId: GraphObjectId;
            sourceId: GraphObjectId;
            destinationId: GraphObjectId;
            sourceOutputIndex?: number;
        }
    }

    /**
     * This domain allows configuring virtual authenticators to test the WebAuthn
     * API.
     */
    namespace WebAuthn {

        type AuthenticatorId = string;

        type AuthenticatorProtocol = ('u2f' | 'ctap2');

        type Ctap2Version = ('ctap2_0' | 'ctap2_1');

        type AuthenticatorTransport = ('usb' | 'nfc' | 'ble' | 'cable' | 'internal');

        interface VirtualAuthenticatorOptions {
            protocol: AuthenticatorProtocol;
            /**
             * Defaults to ctap2_0. Ignored if |protocol| == u2f.
             */
            ctap2Version?: Ctap2Version;
            transport: AuthenticatorTransport;
            /**
             * Defaults to false.
             */
            hasResidentKey?: boolean;
            /**
             * Defaults to false.
             */
            hasUserVerification?: boolean;
            /**
             * If set to true, the authenticator will support the largeBlob extension.
             * https://w3c.github.io/webauthn#largeBlob
             * Defaults to false.
             */
            hasLargeBlob?: boolean;
            /**
             * If set to true, tests of user presence will succeed immediately.
             * Otherwise, they will not be resolved. Defaults to true.
             */
            automaticPresenceSimulation?: boolean;
            /**
             * Sets whether User Verification succeeds or fails for an authenticator.
             * Defaults to false.
             */
            isUserVerified?: boolean;
        }

        interface Credential {
            credentialId: string;
            isResidentCredential: boolean;
            /**
             * Relying Party ID the credential is scoped to. Must be set when adding a
             * credential.
             */
            rpId?: string;
            /**
             * The ECDSA P-256 private key in PKCS#8 format. (Encoded as a base64 string when passed over JSON)
             */
            privateKey: string;
            /**
             * An opaque byte sequence with a maximum size of 64 bytes mapping the
             * credential to a specific user. (Encoded as a base64 string when passed over JSON)
             */
            userHandle?: string;
            /**
             * Signature counter. This is incremented by one for each successful
             * assertion.
             * See https://w3c.github.io/webauthn/#signature-counter
             */
            signCount: integer;
            /**
             * The large blob associated with the credential.
             * See https://w3c.github.io/webauthn/#sctn-large-blob-extension (Encoded as a base64 string when passed over JSON)
             */
            largeBlob?: string;
        }

        interface AddVirtualAuthenticatorRequest {
            options: VirtualAuthenticatorOptions;
        }

        interface AddVirtualAuthenticatorResponse {
            authenticatorId: AuthenticatorId;
        }

        interface RemoveVirtualAuthenticatorRequest {
            authenticatorId: AuthenticatorId;
        }

        interface AddCredentialRequest {
            authenticatorId: AuthenticatorId;
            credential: Credential;
        }

        interface GetCredentialRequest {
            authenticatorId: AuthenticatorId;
            credentialId: string;
        }

        interface GetCredentialResponse {
            credential: Credential;
        }

        interface GetCredentialsRequest {
            authenticatorId: AuthenticatorId;
        }

        interface GetCredentialsResponse {
            credentials: Credential[];
        }

        interface RemoveCredentialRequest {
            authenticatorId: AuthenticatorId;
            credentialId: string;
        }

        interface ClearCredentialsRequest {
            authenticatorId: AuthenticatorId;
        }

        interface SetUserVerifiedRequest {
            authenticatorId: AuthenticatorId;
            isUserVerified: boolean;
        }

        interface SetAutomaticPresenceSimulationRequest {
            authenticatorId: AuthenticatorId;
            enabled: boolean;
        }
    }

    /**
     * This domain allows detailed inspection of media elements
     */
    namespace Media {

        /**
         * Players will get an ID that is unique within the agent context.
         */
        type PlayerId = string;

        type Timestamp = number;

        const enum PlayerMessageLevel {
            Error = 'error',
            Warning = 'warning',
            Info = 'info',
            Debug = 'debug',
        }

        /**
         * Have one type per entry in MediaLogRecord::Type
         * Corresponds to kMessage
         */
        interface PlayerMessage {
            /**
             * Keep in sync with MediaLogMessageLevel
             * We are currently keeping the message level 'error' separate from the
             * PlayerError type because right now they represent different things,
             * this one being a DVLOG(ERROR) style log message that gets printed
             * based on what log level is selected in the UI, and the other is a
             * representation of a media::PipelineStatus object. Soon however we're
             * going to be moving away from using PipelineStatus for errors and
             * introducing a new error type which should hopefully let us integrate
             * the error log level into the PlayerError type. (PlayerMessageLevel enum)
             */
            level: ('error' | 'warning' | 'info' | 'debug');
            message: string;
        }

        /**
         * Corresponds to kMediaPropertyChange
         */
        interface PlayerProperty {
            name: string;
            value: string;
        }

        /**
         * Corresponds to kMediaEventTriggered
         */
        interface PlayerEvent {
            timestamp: Timestamp;
            value: string;
        }

        const enum PlayerErrorType {
            Pipeline_error = 'pipeline_error',
            Media_error = 'media_error',
        }

        /**
         * Corresponds to kMediaError
         */
        interface PlayerError {
            /**
             *  (PlayerErrorType enum)
             */
            type: ('pipeline_error' | 'media_error');
            /**
             * When this switches to using media::Status instead of PipelineStatus
             * we can remove "errorCode" and replace it with the fields from
             * a Status instance. This also seems like a duplicate of the error
             * level enum - there is a todo bug to have that level removed and
             * use this instead. (crbug.com/1068454)
             */
            errorCode: string;
        }

        /**
         * This can be called multiple times, and can be used to set / override /
         * remove player properties. A null propValue indicates removal.
         */
        interface PlayerPropertiesChangedEvent {
            playerId: PlayerId;
            properties: PlayerProperty[];
        }

        /**
         * Send events as a list, allowing them to be batched on the browser for less
         * congestion. If batched, events must ALWAYS be in chronological order.
         */
        interface PlayerEventsAddedEvent {
            playerId: PlayerId;
            events: PlayerEvent[];
        }

        /**
         * Send a list of any messages that need to be delivered.
         */
        interface PlayerMessagesLoggedEvent {
            playerId: PlayerId;
            messages: PlayerMessage[];
        }

        /**
         * Send a list of any errors that need to be delivered.
         */
        interface PlayerErrorsRaisedEvent {
            playerId: PlayerId;
            errors: PlayerError[];
        }

        /**
         * Called whenever a player is created, or when a new agent joins and recieves
         * a list of active players. If an agent is restored, it will recieve the full
         * list of player ids and all events again.
         */
        interface PlayersCreatedEvent {
            players: PlayerId[];
        }
    }
}

/**
 * Mappings from protocol event and command names to the types required for them.
 */
declare namespace ProtocolMapping {
    interface Events {
        /**
         * Issued when new console message is added.
         */
        'Console.messageAdded': [Protocol.Console.MessageAddedEvent];
        /**
         * Fired when breakpoint is resolved to an actual script and location.
         */
        'Debugger.breakpointResolved': [Protocol.Debugger.BreakpointResolvedEvent];
        /**
         * Fired when the virtual machine stopped on breakpoint or exception or any other stop criteria.
         */
        'Debugger.paused': [Protocol.Debugger.PausedEvent];
        /**
         * Fired when the virtual machine resumed execution.
         */
        'Debugger.resumed': [];
        /**
         * Fired when virtual machine fails to parse the script.
         */
        'Debugger.scriptFailedToParse': [Protocol.Debugger.ScriptFailedToParseEvent];
        /**
         * Fired when virtual machine parses script. This event is also fired for all known and uncollected
         * scripts upon enabling debugger.
         */
        'Debugger.scriptParsed': [Protocol.Debugger.ScriptParsedEvent];
        'HeapProfiler.addHeapSnapshotChunk': [Protocol.HeapProfiler.AddHeapSnapshotChunkEvent];
        /**
         * If heap objects tracking has been started then backend may send update for one or more fragments
         */
        'HeapProfiler.heapStatsUpdate': [Protocol.HeapProfiler.HeapStatsUpdateEvent];
        /**
         * If heap objects tracking has been started then backend regularly sends a current value for last
         * seen object id and corresponding timestamp. If the were changes in the heap since last event
         * then one or more heapStatsUpdate events will be sent before a new lastSeenObjectId event.
         */
        'HeapProfiler.lastSeenObjectId': [Protocol.HeapProfiler.LastSeenObjectIdEvent];
        'HeapProfiler.reportHeapSnapshotProgress': [Protocol.HeapProfiler.ReportHeapSnapshotProgressEvent];
        'HeapProfiler.resetProfiles': [];
        'Profiler.consoleProfileFinished': [Protocol.Profiler.ConsoleProfileFinishedEvent];
        /**
         * Sent when new profile recording is started using console.profile() call.
         */
        'Profiler.consoleProfileStarted': [Protocol.Profiler.ConsoleProfileStartedEvent];
        /**
         * Reports coverage delta since the last poll (either from an event like this, or from
         * `takePreciseCoverage` for the current isolate. May only be sent if precise code
         * coverage has been started. This event can be trigged by the embedder to, for example,
         * trigger collection of coverage data immediatelly at a certain point in time.
         */
        'Profiler.preciseCoverageDeltaUpdate': [Protocol.Profiler.PreciseCoverageDeltaUpdateEvent];
        /**
         * Notification is issued every time when binding is called.
         */
        'Runtime.bindingCalled': [Protocol.Runtime.BindingCalledEvent];
        /**
         * Issued when console API was called.
         */
        'Runtime.consoleAPICalled': [Protocol.Runtime.ConsoleAPICalledEvent];
        /**
         * Issued when unhandled exception was revoked.
         */
        'Runtime.exceptionRevoked': [Protocol.Runtime.ExceptionRevokedEvent];
        /**
         * Issued when exception was thrown and unhandled.
         */
        'Runtime.exceptionThrown': [Protocol.Runtime.ExceptionThrownEvent];
        /**
         * Issued when new execution context is created.
         */
        'Runtime.executionContextCreated': [Protocol.Runtime.ExecutionContextCreatedEvent];
        /**
         * Issued when execution context is destroyed.
         */
        'Runtime.executionContextDestroyed': [Protocol.Runtime.ExecutionContextDestroyedEvent];
        /**
         * Issued when all executionContexts were cleared in browser
         */
        'Runtime.executionContextsCleared': [];
        /**
         * Issued when object should be inspected (for example, as a result of inspect() command line API
         * call).
         */
        'Runtime.inspectRequested': [Protocol.Runtime.InspectRequestedEvent];
        /**
         * Event for when an animation has been cancelled.
         */
        'Animation.animationCanceled': [Protocol.Animation.AnimationCanceledEvent];
        /**
         * Event for each animation that has been created.
         */
        'Animation.animationCreated': [Protocol.Animation.AnimationCreatedEvent];
        /**
         * Event for animation that has been started.
         */
        'Animation.animationStarted': [Protocol.Animation.AnimationStartedEvent];
        'ApplicationCache.applicationCacheStatusUpdated': [Protocol.ApplicationCache.ApplicationCacheStatusUpdatedEvent];
        'ApplicationCache.networkStateUpdated': [Protocol.ApplicationCache.NetworkStateUpdatedEvent];
        'Audits.issueAdded': [Protocol.Audits.IssueAddedEvent];
        /**
         * Called when the recording state for the service has been updated.
         */
        'BackgroundService.recordingStateChanged': [Protocol.BackgroundService.RecordingStateChangedEvent];
        /**
         * Called with all existing backgroundServiceEvents when enabled, and all new
         * events afterwards if enabled and recording.
         */
        'BackgroundService.backgroundServiceEventReceived': [Protocol.BackgroundService.BackgroundServiceEventReceivedEvent];
        /**
         * Fires whenever a web font is updated.  A non-empty font parameter indicates a successfully loaded
         * web font
         */
        'CSS.fontsUpdated': [Protocol.CSS.FontsUpdatedEvent];
        /**
         * Fires whenever a MediaQuery result changes (for example, after a browser window has been
         * resized.) The current implementation considers only viewport-dependent media features.
         */
        'CSS.mediaQueryResultChanged': [];
        /**
         * Fired whenever an active document stylesheet is added.
         */
        'CSS.styleSheetAdded': [Protocol.CSS.StyleSheetAddedEvent];
        /**
         * Fired whenever a stylesheet is changed as a result of the client operation.
         */
        'CSS.styleSheetChanged': [Protocol.CSS.StyleSheetChangedEvent];
        /**
         * Fired whenever an active document stylesheet is removed.
         */
        'CSS.styleSheetRemoved': [Protocol.CSS.StyleSheetRemovedEvent];
        /**
         * This is fired whenever the list of available sinks changes. A sink is a
         * device or a software surface that you can cast to.
         */
        'Cast.sinksUpdated': [Protocol.Cast.SinksUpdatedEvent];
        /**
         * This is fired whenever the outstanding issue/error message changes.
         * |issueMessage| is empty if there is no issue.
         */
        'Cast.issueUpdated': [Protocol.Cast.IssueUpdatedEvent];
        /**
         * Fired when `Element`'s attribute is modified.
         */
        'DOM.attributeModified': [Protocol.DOM.AttributeModifiedEvent];
        /**
         * Fired when `Element`'s attribute is removed.
         */
        'DOM.attributeRemoved': [Protocol.DOM.AttributeRemovedEvent];
        /**
         * Mirrors `DOMCharacterDataModified` event.
         */
        'DOM.characterDataModified': [Protocol.DOM.CharacterDataModifiedEvent];
        /**
         * Fired when `Container`'s child node count has changed.
         */
        'DOM.childNodeCountUpdated': [Protocol.DOM.ChildNodeCountUpdatedEvent];
        /**
         * Mirrors `DOMNodeInserted` event.
         */
        'DOM.childNodeInserted': [Protocol.DOM.ChildNodeInsertedEvent];
        /**
         * Mirrors `DOMNodeRemoved` event.
         */
        'DOM.childNodeRemoved': [Protocol.DOM.ChildNodeRemovedEvent];
        /**
         * Called when distrubution is changed.
         */
        'DOM.distributedNodesUpdated': [Protocol.DOM.DistributedNodesUpdatedEvent];
        /**
         * Fired when `Document` has been totally updated. Node ids are no longer valid.
         */
        'DOM.documentUpdated': [];
        /**
         * Fired when `Element`'s inline style is modified via a CSS property modification.
         */
        'DOM.inlineStyleInvalidated': [Protocol.DOM.InlineStyleInvalidatedEvent];
        /**
         * Called when a pseudo element is added to an element.
         */
        'DOM.pseudoElementAdded': [Protocol.DOM.PseudoElementAddedEvent];
        /**
         * Called when a pseudo element is removed from an element.
         */
        'DOM.pseudoElementRemoved': [Protocol.DOM.PseudoElementRemovedEvent];
        /**
         * Fired when backend wants to provide client with the missing DOM structure. This happens upon
         * most of the calls requesting node ids.
         */
        'DOM.setChildNodes': [Protocol.DOM.SetChildNodesEvent];
        /**
         * Called when shadow root is popped from the element.
         */
        'DOM.shadowRootPopped': [Protocol.DOM.ShadowRootPoppedEvent];
        /**
         * Called when shadow root is pushed into the element.
         */
        'DOM.shadowRootPushed': [Protocol.DOM.ShadowRootPushedEvent];
        'DOMStorage.domStorageItemAdded': [Protocol.DOMStorage.DomStorageItemAddedEvent];
        'DOMStorage.domStorageItemRemoved': [Protocol.DOMStorage.DomStorageItemRemovedEvent];
        'DOMStorage.domStorageItemUpdated': [Protocol.DOMStorage.DomStorageItemUpdatedEvent];
        'DOMStorage.domStorageItemsCleared': [Protocol.DOMStorage.DomStorageItemsClearedEvent];
        'Database.addDatabase': [Protocol.Database.AddDatabaseEvent];
        /**
         * Notification sent after the virtual time budget for the current VirtualTimePolicy has run out.
         */
        'Emulation.virtualTimeBudgetExpired': [];
        /**
         * Issued when the target starts or stops needing BeginFrames.
         * Deprecated. Issue beginFrame unconditionally instead and use result from
         * beginFrame to detect whether the frames were suppressed.
         */
        'HeadlessExperimental.needsBeginFramesChanged': [Protocol.HeadlessExperimental.NeedsBeginFramesChangedEvent];
        /**
         * Fired when remote debugging connection is about to be terminated. Contains detach reason.
         */
        'Inspector.detached': [Protocol.Inspector.DetachedEvent];
        /**
         * Fired when debugging target has crashed
         */
        'Inspector.targetCrashed': [];
        /**
         * Fired when debugging target has reloaded after crash
         */
        'Inspector.targetReloadedAfterCrash': [];
        'LayerTree.layerPainted': [Protocol.LayerTree.LayerPaintedEvent];
        'LayerTree.layerTreeDidChange': [Protocol.LayerTree.LayerTreeDidChangeEvent];
        /**
         * Issued when new message was logged.
         */
        'Log.entryAdded': [Protocol.Log.EntryAddedEvent];
        /**
         * Fired when data chunk was received over the network.
         */
        'Network.dataReceived': [Protocol.Network.DataReceivedEvent];
        /**
         * Fired when EventSource message is received.
         */
        'Network.eventSourceMessageReceived': [Protocol.Network.EventSourceMessageReceivedEvent];
        /**
         * Fired when HTTP request has failed to load.
         */
        'Network.loadingFailed': [Protocol.Network.LoadingFailedEvent];
        /**
         * Fired when HTTP request has finished loading.
         */
        'Network.loadingFinished': [Protocol.Network.LoadingFinishedEvent];
        /**
         * Details of an intercepted HTTP request, which must be either allowed, blocked, modified or
         * mocked.
         * Deprecated, use Fetch.requestPaused instead.
         */
        'Network.requestIntercepted': [Protocol.Network.RequestInterceptedEvent];
        /**
         * Fired if request ended up loading from cache.
         */
        'Network.requestServedFromCache': [Protocol.Network.RequestServedFromCacheEvent];
        /**
         * Fired when page is about to send HTTP request.
         */
        'Network.requestWillBeSent': [Protocol.Network.RequestWillBeSentEvent];
        /**
         * Fired when resource loading priority is changed
         */
        'Network.resourceChangedPriority': [Protocol.Network.ResourceChangedPriorityEvent];
        /**
         * Fired when a signed exchange was received over the network
         */
        'Network.signedExchangeReceived': [Protocol.Network.SignedExchangeReceivedEvent];
        /**
         * Fired when HTTP response is available.
         */
        'Network.responseReceived': [Protocol.Network.ResponseReceivedEvent];
        /**
         * Fired when WebSocket is closed.
         */
        'Network.webSocketClosed': [Protocol.Network.WebSocketClosedEvent];
        /**
         * Fired upon WebSocket creation.
         */
        'Network.webSocketCreated': [Protocol.Network.WebSocketCreatedEvent];
        /**
         * Fired when WebSocket message error occurs.
         */
        'Network.webSocketFrameError': [Protocol.Network.WebSocketFrameErrorEvent];
        /**
         * Fired when WebSocket message is received.
         */
        'Network.webSocketFrameReceived': [Protocol.Network.WebSocketFrameReceivedEvent];
        /**
         * Fired when WebSocket message is sent.
         */
        'Network.webSocketFrameSent': [Protocol.Network.WebSocketFrameSentEvent];
        /**
         * Fired when WebSocket handshake response becomes available.
         */
        'Network.webSocketHandshakeResponseReceived': [Protocol.Network.WebSocketHandshakeResponseReceivedEvent];
        /**
         * Fired when WebSocket is about to initiate handshake.
         */
        'Network.webSocketWillSendHandshakeRequest': [Protocol.Network.WebSocketWillSendHandshakeRequestEvent];
        /**
         * Fired upon WebTransport creation.
         */
        'Network.webTransportCreated': [Protocol.Network.WebTransportCreatedEvent];
        /**
         * Fired when WebTransport handshake is finished.
         */
        'Network.webTransportConnectionEstablished': [Protocol.Network.WebTransportConnectionEstablishedEvent];
        /**
         * Fired when WebTransport is disposed.
         */
        'Network.webTransportClosed': [Protocol.Network.WebTransportClosedEvent];
        /**
         * Fired when additional information about a requestWillBeSent event is available from the
         * network stack. Not every requestWillBeSent event will have an additional
         * requestWillBeSentExtraInfo fired for it, and there is no guarantee whether requestWillBeSent
         * or requestWillBeSentExtraInfo will be fired first for the same request.
         */
        'Network.requestWillBeSentExtraInfo': [Protocol.Network.RequestWillBeSentExtraInfoEvent];
        /**
         * Fired when additional information about a responseReceived event is available from the network
         * stack. Not every responseReceived event will have an additional responseReceivedExtraInfo for
         * it, and responseReceivedExtraInfo may be fired before or after responseReceived.
         */
        'Network.responseReceivedExtraInfo': [Protocol.Network.ResponseReceivedExtraInfoEvent];
        /**
         * Fired exactly once for each Trust Token operation. Depending on
         * the type of the operation and whether the operation succeeded or
         * failed, the event is fired before the corresponding request was sent
         * or after the response was received.
         */
        'Network.trustTokenOperationDone': [Protocol.Network.TrustTokenOperationDoneEvent];
        /**
         * Fired when the node should be inspected. This happens after call to `setInspectMode` or when
         * user manually inspects an element.
         */
        'Overlay.inspectNodeRequested': [Protocol.Overlay.InspectNodeRequestedEvent];
        /**
         * Fired when the node should be highlighted. This happens after call to `setInspectMode`.
         */
        'Overlay.nodeHighlightRequested': [Protocol.Overlay.NodeHighlightRequestedEvent];
        /**
         * Fired when user asks to capture screenshot of some area on the page.
         */
        'Overlay.screenshotRequested': [Protocol.Overlay.ScreenshotRequestedEvent];
        /**
         * Fired when user cancels the inspect mode.
         */
        'Overlay.inspectModeCanceled': [];
        'Page.domContentEventFired': [Protocol.Page.DomContentEventFiredEvent];
        /**
         * Emitted only when `page.interceptFileChooser` is enabled.
         */
        'Page.fileChooserOpened': [Protocol.Page.FileChooserOpenedEvent];
        /**
         * Fired when frame has been attached to its parent.
         */
        'Page.frameAttached': [Protocol.Page.FrameAttachedEvent];
        /**
         * Fired when frame no longer has a scheduled navigation.
         */
        'Page.frameClearedScheduledNavigation': [Protocol.Page.FrameClearedScheduledNavigationEvent];
        /**
         * Fired when frame has been detached from its parent.
         */
        'Page.frameDetached': [Protocol.Page.FrameDetachedEvent];
        /**
         * Fired once navigation of the frame has completed. Frame is now associated with the new loader.
         */
        'Page.frameNavigated': [Protocol.Page.FrameNavigatedEvent];
        /**
         * Fired when opening document to write to.
         */
        'Page.documentOpened': [Protocol.Page.DocumentOpenedEvent];
        'Page.frameResized': [];
        /**
         * Fired when a renderer-initiated navigation is requested.
         * Navigation may still be cancelled after the event is issued.
         */
        'Page.frameRequestedNavigation': [Protocol.Page.FrameRequestedNavigationEvent];
        /**
         * Fired when frame schedules a potential navigation.
         */
        'Page.frameScheduledNavigation': [Protocol.Page.FrameScheduledNavigationEvent];
        /**
         * Fired when frame has started loading.
         */
        'Page.frameStartedLoading': [Protocol.Page.FrameStartedLoadingEvent];
        /**
         * Fired when frame has stopped loading.
         */
        'Page.frameStoppedLoading': [Protocol.Page.FrameStoppedLoadingEvent];
        /**
         * Fired when page is about to start a download.
         */
        'Page.downloadWillBegin': [Protocol.Page.DownloadWillBeginEvent];
        /**
         * Fired when download makes progress. Last call has |done| == true.
         */
        'Page.downloadProgress': [Protocol.Page.DownloadProgressEvent];
        /**
         * Fired when interstitial page was hidden
         */
        'Page.interstitialHidden': [];
        /**
         * Fired when interstitial page was shown
         */
        'Page.interstitialShown': [];
        /**
         * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) has been
         * closed.
         */
        'Page.javascriptDialogClosed': [Protocol.Page.JavascriptDialogClosedEvent];
        /**
         * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) is about to
         * open.
         */
        'Page.javascriptDialogOpening': [Protocol.Page.JavascriptDialogOpeningEvent];
        /**
         * Fired for top level page lifecycle events such as navigation, load, paint, etc.
         */
        'Page.lifecycleEvent': [Protocol.Page.LifecycleEventEvent];
        'Page.loadEventFired': [Protocol.Page.LoadEventFiredEvent];
        /**
         * Fired when same-document navigation happens, e.g. due to history API usage or anchor navigation.
         */
        'Page.navigatedWithinDocument': [Protocol.Page.NavigatedWithinDocumentEvent];
        /**
         * Compressed image data requested by the `startScreencast`.
         */
        'Page.screencastFrame': [Protocol.Page.ScreencastFrameEvent];
        /**
         * Fired when the page with currently enabled screencast was shown or hidden `.
         */
        'Page.screencastVisibilityChanged': [Protocol.Page.ScreencastVisibilityChangedEvent];
        /**
         * Fired when a new window is going to be opened, via window.open(), link click, form submission,
         * etc.
         */
        'Page.windowOpen': [Protocol.Page.WindowOpenEvent];
        /**
         * Issued for every compilation cache generated. Is only available
         * if Page.setGenerateCompilationCache is enabled.
         */
        'Page.compilationCacheProduced': [Protocol.Page.CompilationCacheProducedEvent];
        /**
         * Current values of the metrics.
         */
        'Performance.metrics': [Protocol.Performance.MetricsEvent];
        /**
         * Sent when a performance timeline event is added. See reportPerformanceTimeline method.
         */
        'PerformanceTimeline.timelineEventAdded': [Protocol.PerformanceTimeline.TimelineEventAddedEvent];
        /**
         * There is a certificate error. If overriding certificate errors is enabled, then it should be
         * handled with the `handleCertificateError` command. Note: this event does not fire if the
         * certificate error has been allowed internally. Only one client per target should override
         * certificate errors at the same time.
         */
        'Security.certificateError': [Protocol.Security.CertificateErrorEvent];
        /**
         * The security state of the page changed.
         */
        'Security.visibleSecurityStateChanged': [Protocol.Security.VisibleSecurityStateChangedEvent];
        /**
         * The security state of the page changed.
         */
        'Security.securityStateChanged': [Protocol.Security.SecurityStateChangedEvent];
        'ServiceWorker.workerErrorReported': [Protocol.ServiceWorker.WorkerErrorReportedEvent];
        'ServiceWorker.workerRegistrationUpdated': [Protocol.ServiceWorker.WorkerRegistrationUpdatedEvent];
        'ServiceWorker.workerVersionUpdated': [Protocol.ServiceWorker.WorkerVersionUpdatedEvent];
        /**
         * A cache's contents have been modified.
         */
        'Storage.cacheStorageContentUpdated': [Protocol.Storage.CacheStorageContentUpdatedEvent];
        /**
         * A cache has been added/deleted.
         */
        'Storage.cacheStorageListUpdated': [Protocol.Storage.CacheStorageListUpdatedEvent];
        /**
         * The origin's IndexedDB object store has been modified.
         */
        'Storage.indexedDBContentUpdated': [Protocol.Storage.IndexedDBContentUpdatedEvent];
        /**
         * The origin's IndexedDB database list has been modified.
         */
        'Storage.indexedDBListUpdated': [Protocol.Storage.IndexedDBListUpdatedEvent];
        /**
         * Issued when attached to target because of auto-attach or `attachToTarget` command.
         */
        'Target.attachedToTarget': [Protocol.Target.AttachedToTargetEvent];
        /**
         * Issued when detached from target for any reason (including `detachFromTarget` command). Can be
         * issued multiple times per target if multiple sessions have been attached to it.
         */
        'Target.detachedFromTarget': [Protocol.Target.DetachedFromTargetEvent];
        /**
         * Notifies about a new protocol message received from the session (as reported in
         * `attachedToTarget` event).
         */
        'Target.receivedMessageFromTarget': [Protocol.Target.ReceivedMessageFromTargetEvent];
        /**
         * Issued when a possible inspection target is created.
         */
        'Target.targetCreated': [Protocol.Target.TargetCreatedEvent];
        /**
         * Issued when a target is destroyed.
         */
        'Target.targetDestroyed': [Protocol.Target.TargetDestroyedEvent];
        /**
         * Issued when a target has crashed.
         */
        'Target.targetCrashed': [Protocol.Target.TargetCrashedEvent];
        /**
         * Issued when some information about a target has changed. This only happens between
         * `targetCreated` and `targetDestroyed`.
         */
        'Target.targetInfoChanged': [Protocol.Target.TargetInfoChangedEvent];
        /**
         * Informs that port was successfully bound and got a specified connection id.
         */
        'Tethering.accepted': [Protocol.Tethering.AcceptedEvent];
        'Tracing.bufferUsage': [Protocol.Tracing.BufferUsageEvent];
        /**
         * Contains an bucket of collected trace events. When tracing is stopped collected events will be
         * send as a sequence of dataCollected events followed by tracingComplete event.
         */
        'Tracing.dataCollected': [Protocol.Tracing.DataCollectedEvent];
        /**
         * Signals that tracing is stopped and there is no trace buffers pending flush, all data were
         * delivered via dataCollected events.
         */
        'Tracing.tracingComplete': [Protocol.Tracing.TracingCompleteEvent];
        /**
         * Issued when the domain is enabled and the request URL matches the
         * specified filter. The request is paused until the client responds
         * with one of continueRequest, failRequest or fulfillRequest.
         * The stage of the request can be determined by presence of responseErrorReason
         * and responseStatusCode -- the request is at the response stage if either
         * of these fields is present and in the request stage otherwise.
         */
        'Fetch.requestPaused': [Protocol.Fetch.RequestPausedEvent];
        /**
         * Issued when the domain is enabled with handleAuthRequests set to true.
         * The request is paused until client responds with continueWithAuth.
         */
        'Fetch.authRequired': [Protocol.Fetch.AuthRequiredEvent];
        /**
         * Notifies that a new BaseAudioContext has been created.
         */
        'WebAudio.contextCreated': [Protocol.WebAudio.ContextCreatedEvent];
        /**
         * Notifies that an existing BaseAudioContext will be destroyed.
         */
        'WebAudio.contextWillBeDestroyed': [Protocol.WebAudio.ContextWillBeDestroyedEvent];
        /**
         * Notifies that existing BaseAudioContext has changed some properties (id stays the same)..
         */
        'WebAudio.contextChanged': [Protocol.WebAudio.ContextChangedEvent];
        /**
         * Notifies that the construction of an AudioListener has finished.
         */
        'WebAudio.audioListenerCreated': [Protocol.WebAudio.AudioListenerCreatedEvent];
        /**
         * Notifies that a new AudioListener has been created.
         */
        'WebAudio.audioListenerWillBeDestroyed': [Protocol.WebAudio.AudioListenerWillBeDestroyedEvent];
        /**
         * Notifies that a new AudioNode has been created.
         */
        'WebAudio.audioNodeCreated': [Protocol.WebAudio.AudioNodeCreatedEvent];
        /**
         * Notifies that an existing AudioNode has been destroyed.
         */
        'WebAudio.audioNodeWillBeDestroyed': [Protocol.WebAudio.AudioNodeWillBeDestroyedEvent];
        /**
         * Notifies that a new AudioParam has been created.
         */
        'WebAudio.audioParamCreated': [Protocol.WebAudio.AudioParamCreatedEvent];
        /**
         * Notifies that an existing AudioParam has been destroyed.
         */
        'WebAudio.audioParamWillBeDestroyed': [Protocol.WebAudio.AudioParamWillBeDestroyedEvent];
        /**
         * Notifies that two AudioNodes are connected.
         */
        'WebAudio.nodesConnected': [Protocol.WebAudio.NodesConnectedEvent];
        /**
         * Notifies that AudioNodes are disconnected. The destination can be null, and it means all the outgoing connections from the source are disconnected.
         */
        'WebAudio.nodesDisconnected': [Protocol.WebAudio.NodesDisconnectedEvent];
        /**
         * Notifies that an AudioNode is connected to an AudioParam.
         */
        'WebAudio.nodeParamConnected': [Protocol.WebAudio.NodeParamConnectedEvent];
        /**
         * Notifies that an AudioNode is disconnected to an AudioParam.
         */
        'WebAudio.nodeParamDisconnected': [Protocol.WebAudio.NodeParamDisconnectedEvent];
        /**
         * This can be called multiple times, and can be used to set / override /
         * remove player properties. A null propValue indicates removal.
         */
        'Media.playerPropertiesChanged': [Protocol.Media.PlayerPropertiesChangedEvent];
        /**
         * Send events as a list, allowing them to be batched on the browser for less
         * congestion. If batched, events must ALWAYS be in chronological order.
         */
        'Media.playerEventsAdded': [Protocol.Media.PlayerEventsAddedEvent];
        /**
         * Send a list of any messages that need to be delivered.
         */
        'Media.playerMessagesLogged': [Protocol.Media.PlayerMessagesLoggedEvent];
        /**
         * Send a list of any errors that need to be delivered.
         */
        'Media.playerErrorsRaised': [Protocol.Media.PlayerErrorsRaisedEvent];
        /**
         * Called whenever a player is created, or when a new agent joins and recieves
         * a list of active players. If an agent is restored, it will recieve the full
         * list of player ids and all events again.
         */
        'Media.playersCreated': [Protocol.Media.PlayersCreatedEvent];
    }

    interface Commands {
        /**
         * Does nothing.
         */
        'Console.clearMessages': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Disables console domain, prevents further console messages from being reported to the client.
         */
        'Console.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables console domain, sends the messages collected so far to the client by means of the
         * `messageAdded` notification.
         */
        'Console.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Continues execution until specific location is reached.
         */
        'Debugger.continueToLocation': {
            paramsType: [Protocol.Debugger.ContinueToLocationRequest];
            returnType: void;
        };
        /**
         * Disables debugger for given page.
         */
        'Debugger.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables debugger for the given page. Clients should not assume that the debugging has been
         * enabled until the result for this command is received.
         */
        'Debugger.enable': {
            paramsType: [Protocol.Debugger.EnableRequest?];
            returnType: Protocol.Debugger.EnableResponse;
        };
        /**
         * Evaluates expression on a given call frame.
         */
        'Debugger.evaluateOnCallFrame': {
            paramsType: [Protocol.Debugger.EvaluateOnCallFrameRequest];
            returnType: Protocol.Debugger.EvaluateOnCallFrameResponse;
        };
        /**
         * Execute a Wasm Evaluator module on a given call frame.
         */
        'Debugger.executeWasmEvaluator': {
            paramsType: [Protocol.Debugger.ExecuteWasmEvaluatorRequest];
            returnType: Protocol.Debugger.ExecuteWasmEvaluatorResponse;
        };
        /**
         * Returns possible locations for breakpoint. scriptId in start and end range locations should be
         * the same.
         */
        'Debugger.getPossibleBreakpoints': {
            paramsType: [Protocol.Debugger.GetPossibleBreakpointsRequest];
            returnType: Protocol.Debugger.GetPossibleBreakpointsResponse;
        };
        /**
         * Returns source for the script with given id.
         */
        'Debugger.getScriptSource': {
            paramsType: [Protocol.Debugger.GetScriptSourceRequest];
            returnType: Protocol.Debugger.GetScriptSourceResponse;
        };
        /**
         * This command is deprecated. Use getScriptSource instead.
         */
        'Debugger.getWasmBytecode': {
            paramsType: [Protocol.Debugger.GetWasmBytecodeRequest];
            returnType: Protocol.Debugger.GetWasmBytecodeResponse;
        };
        /**
         * Returns stack trace with given `stackTraceId`.
         */
        'Debugger.getStackTrace': {
            paramsType: [Protocol.Debugger.GetStackTraceRequest];
            returnType: Protocol.Debugger.GetStackTraceResponse;
        };
        /**
         * Stops on the next JavaScript statement.
         */
        'Debugger.pause': {
            paramsType: [];
            returnType: void;
        };
        'Debugger.pauseOnAsyncCall': {
            paramsType: [Protocol.Debugger.PauseOnAsyncCallRequest];
            returnType: void;
        };
        /**
         * Removes JavaScript breakpoint.
         */
        'Debugger.removeBreakpoint': {
            paramsType: [Protocol.Debugger.RemoveBreakpointRequest];
            returnType: void;
        };
        /**
         * Restarts particular call frame from the beginning.
         */
        'Debugger.restartFrame': {
            paramsType: [Protocol.Debugger.RestartFrameRequest];
            returnType: Protocol.Debugger.RestartFrameResponse;
        };
        /**
         * Resumes JavaScript execution.
         */
        'Debugger.resume': {
            paramsType: [Protocol.Debugger.ResumeRequest?];
            returnType: void;
        };
        /**
         * Searches for given string in script content.
         */
        'Debugger.searchInContent': {
            paramsType: [Protocol.Debugger.SearchInContentRequest];
            returnType: Protocol.Debugger.SearchInContentResponse;
        };
        /**
         * Enables or disables async call stacks tracking.
         */
        'Debugger.setAsyncCallStackDepth': {
            paramsType: [Protocol.Debugger.SetAsyncCallStackDepthRequest];
            returnType: void;
        };
        /**
         * Replace previous blackbox patterns with passed ones. Forces backend to skip stepping/pausing in
         * scripts with url matching one of the patterns. VM will try to leave blackboxed script by
         * performing 'step in' several times, finally resorting to 'step out' if unsuccessful.
         */
        'Debugger.setBlackboxPatterns': {
            paramsType: [Protocol.Debugger.SetBlackboxPatternsRequest];
            returnType: void;
        };
        /**
         * Makes backend skip steps in the script in blackboxed ranges. VM will try leave blacklisted
         * scripts by performing 'step in' several times, finally resorting to 'step out' if unsuccessful.
         * Positions array contains positions where blackbox state is changed. First interval isn't
         * blackboxed. Array should be sorted.
         */
        'Debugger.setBlackboxedRanges': {
            paramsType: [Protocol.Debugger.SetBlackboxedRangesRequest];
            returnType: void;
        };
        /**
         * Sets JavaScript breakpoint at a given location.
         */
        'Debugger.setBreakpoint': {
            paramsType: [Protocol.Debugger.SetBreakpointRequest];
            returnType: Protocol.Debugger.SetBreakpointResponse;
        };
        /**
         * Sets instrumentation breakpoint.
         */
        'Debugger.setInstrumentationBreakpoint': {
            paramsType: [Protocol.Debugger.SetInstrumentationBreakpointRequest];
            returnType: Protocol.Debugger.SetInstrumentationBreakpointResponse;
        };
        /**
         * Sets JavaScript breakpoint at given location specified either by URL or URL regex. Once this
         * command is issued, all existing parsed scripts will have breakpoints resolved and returned in
         * `locations` property. Further matching script parsing will result in subsequent
         * `breakpointResolved` events issued. This logical breakpoint will survive page reloads.
         */
        'Debugger.setBreakpointByUrl': {
            paramsType: [Protocol.Debugger.SetBreakpointByUrlRequest];
            returnType: Protocol.Debugger.SetBreakpointByUrlResponse;
        };
        /**
         * Sets JavaScript breakpoint before each call to the given function.
         * If another function was created from the same source as a given one,
         * calling it will also trigger the breakpoint.
         */
        'Debugger.setBreakpointOnFunctionCall': {
            paramsType: [Protocol.Debugger.SetBreakpointOnFunctionCallRequest];
            returnType: Protocol.Debugger.SetBreakpointOnFunctionCallResponse;
        };
        /**
         * Activates / deactivates all breakpoints on the page.
         */
        'Debugger.setBreakpointsActive': {
            paramsType: [Protocol.Debugger.SetBreakpointsActiveRequest];
            returnType: void;
        };
        /**
         * Defines pause on exceptions state. Can be set to stop on all exceptions, uncaught exceptions or
         * no exceptions. Initial pause on exceptions state is `none`.
         */
        'Debugger.setPauseOnExceptions': {
            paramsType: [Protocol.Debugger.SetPauseOnExceptionsRequest];
            returnType: void;
        };
        /**
         * Changes return value in top frame. Available only at return break position.
         */
        'Debugger.setReturnValue': {
            paramsType: [Protocol.Debugger.SetReturnValueRequest];
            returnType: void;
        };
        /**
         * Edits JavaScript source live.
         */
        'Debugger.setScriptSource': {
            paramsType: [Protocol.Debugger.SetScriptSourceRequest];
            returnType: Protocol.Debugger.SetScriptSourceResponse;
        };
        /**
         * Makes page not interrupt on any pauses (breakpoint, exception, dom exception etc).
         */
        'Debugger.setSkipAllPauses': {
            paramsType: [Protocol.Debugger.SetSkipAllPausesRequest];
            returnType: void;
        };
        /**
         * Changes value of variable in a callframe. Object-based scopes are not supported and must be
         * mutated manually.
         */
        'Debugger.setVariableValue': {
            paramsType: [Protocol.Debugger.SetVariableValueRequest];
            returnType: void;
        };
        /**
         * Steps into the function call.
         */
        'Debugger.stepInto': {
            paramsType: [Protocol.Debugger.StepIntoRequest?];
            returnType: void;
        };
        /**
         * Steps out of the function call.
         */
        'Debugger.stepOut': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Steps over the statement.
         */
        'Debugger.stepOver': {
            paramsType: [Protocol.Debugger.StepOverRequest?];
            returnType: void;
        };
        /**
         * Enables console to refer to the node with given id via $x (see Command Line API for more details
         * $x functions).
         */
        'HeapProfiler.addInspectedHeapObject': {
            paramsType: [Protocol.HeapProfiler.AddInspectedHeapObjectRequest];
            returnType: void;
        };
        'HeapProfiler.collectGarbage': {
            paramsType: [];
            returnType: void;
        };
        'HeapProfiler.disable': {
            paramsType: [];
            returnType: void;
        };
        'HeapProfiler.enable': {
            paramsType: [];
            returnType: void;
        };
        'HeapProfiler.getHeapObjectId': {
            paramsType: [Protocol.HeapProfiler.GetHeapObjectIdRequest];
            returnType: Protocol.HeapProfiler.GetHeapObjectIdResponse;
        };
        'HeapProfiler.getObjectByHeapObjectId': {
            paramsType: [Protocol.HeapProfiler.GetObjectByHeapObjectIdRequest];
            returnType: Protocol.HeapProfiler.GetObjectByHeapObjectIdResponse;
        };
        'HeapProfiler.getSamplingProfile': {
            paramsType: [];
            returnType: Protocol.HeapProfiler.GetSamplingProfileResponse;
        };
        'HeapProfiler.startSampling': {
            paramsType: [Protocol.HeapProfiler.StartSamplingRequest?];
            returnType: void;
        };
        'HeapProfiler.startTrackingHeapObjects': {
            paramsType: [Protocol.HeapProfiler.StartTrackingHeapObjectsRequest?];
            returnType: void;
        };
        'HeapProfiler.stopSampling': {
            paramsType: [];
            returnType: Protocol.HeapProfiler.StopSamplingResponse;
        };
        'HeapProfiler.stopTrackingHeapObjects': {
            paramsType: [Protocol.HeapProfiler.StopTrackingHeapObjectsRequest?];
            returnType: void;
        };
        'HeapProfiler.takeHeapSnapshot': {
            paramsType: [Protocol.HeapProfiler.TakeHeapSnapshotRequest?];
            returnType: void;
        };
        'Profiler.disable': {
            paramsType: [];
            returnType: void;
        };
        'Profiler.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Collect coverage data for the current isolate. The coverage data may be incomplete due to
         * garbage collection.
         */
        'Profiler.getBestEffortCoverage': {
            paramsType: [];
            returnType: Protocol.Profiler.GetBestEffortCoverageResponse;
        };
        /**
         * Changes CPU profiler sampling interval. Must be called before CPU profiles recording started.
         */
        'Profiler.setSamplingInterval': {
            paramsType: [Protocol.Profiler.SetSamplingIntervalRequest];
            returnType: void;
        };
        'Profiler.start': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enable precise code coverage. Coverage data for JavaScript executed before enabling precise code
         * coverage may be incomplete. Enabling prevents running optimized code and resets execution
         * counters.
         */
        'Profiler.startPreciseCoverage': {
            paramsType: [Protocol.Profiler.StartPreciseCoverageRequest?];
            returnType: Protocol.Profiler.StartPreciseCoverageResponse;
        };
        /**
         * Enable type profile.
         */
        'Profiler.startTypeProfile': {
            paramsType: [];
            returnType: void;
        };
        'Profiler.stop': {
            paramsType: [];
            returnType: Protocol.Profiler.StopResponse;
        };
        /**
         * Disable precise code coverage. Disabling releases unnecessary execution count records and allows
         * executing optimized code.
         */
        'Profiler.stopPreciseCoverage': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Disable type profile. Disabling releases type profile data collected so far.
         */
        'Profiler.stopTypeProfile': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Collect coverage data for the current isolate, and resets execution counters. Precise code
         * coverage needs to have started.
         */
        'Profiler.takePreciseCoverage': {
            paramsType: [];
            returnType: Protocol.Profiler.TakePreciseCoverageResponse;
        };
        /**
         * Collect type profile.
         */
        'Profiler.takeTypeProfile': {
            paramsType: [];
            returnType: Protocol.Profiler.TakeTypeProfileResponse;
        };
        /**
         * Enable counters collection.
         */
        'Profiler.enableCounters': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Disable counters collection.
         */
        'Profiler.disableCounters': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Retrieve counters.
         */
        'Profiler.getCounters': {
            paramsType: [];
            returnType: Protocol.Profiler.GetCountersResponse;
        };
        /**
         * Enable run time call stats collection.
         */
        'Profiler.enableRuntimeCallStats': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Disable run time call stats collection.
         */
        'Profiler.disableRuntimeCallStats': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Retrieve run time call stats.
         */
        'Profiler.getRuntimeCallStats': {
            paramsType: [];
            returnType: Protocol.Profiler.GetRuntimeCallStatsResponse;
        };
        /**
         * Add handler to promise with given promise object id.
         */
        'Runtime.awaitPromise': {
            paramsType: [Protocol.Runtime.AwaitPromiseRequest];
            returnType: Protocol.Runtime.AwaitPromiseResponse;
        };
        /**
         * Calls function with given declaration on the given object. Object group of the result is
         * inherited from the target object.
         */
        'Runtime.callFunctionOn': {
            paramsType: [Protocol.Runtime.CallFunctionOnRequest];
            returnType: Protocol.Runtime.CallFunctionOnResponse;
        };
        /**
         * Compiles expression.
         */
        'Runtime.compileScript': {
            paramsType: [Protocol.Runtime.CompileScriptRequest];
            returnType: Protocol.Runtime.CompileScriptResponse;
        };
        /**
         * Disables reporting of execution contexts creation.
         */
        'Runtime.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Discards collected exceptions and console API calls.
         */
        'Runtime.discardConsoleEntries': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables reporting of execution contexts creation by means of `executionContextCreated` event.
         * When the reporting gets enabled the event will be sent immediately for each existing execution
         * context.
         */
        'Runtime.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Evaluates expression on global object.
         */
        'Runtime.evaluate': {
            paramsType: [Protocol.Runtime.EvaluateRequest];
            returnType: Protocol.Runtime.EvaluateResponse;
        };
        /**
         * Returns the isolate id.
         */
        'Runtime.getIsolateId': {
            paramsType: [];
            returnType: Protocol.Runtime.GetIsolateIdResponse;
        };
        /**
         * Returns the JavaScript heap usage.
         * It is the total usage of the corresponding isolate not scoped to a particular Runtime.
         */
        'Runtime.getHeapUsage': {
            paramsType: [];
            returnType: Protocol.Runtime.GetHeapUsageResponse;
        };
        /**
         * Returns properties of a given object. Object group of the result is inherited from the target
         * object.
         */
        'Runtime.getProperties': {
            paramsType: [Protocol.Runtime.GetPropertiesRequest];
            returnType: Protocol.Runtime.GetPropertiesResponse;
        };
        /**
         * Returns all let, const and class variables from global scope.
         */
        'Runtime.globalLexicalScopeNames': {
            paramsType: [Protocol.Runtime.GlobalLexicalScopeNamesRequest?];
            returnType: Protocol.Runtime.GlobalLexicalScopeNamesResponse;
        };
        'Runtime.queryObjects': {
            paramsType: [Protocol.Runtime.QueryObjectsRequest];
            returnType: Protocol.Runtime.QueryObjectsResponse;
        };
        /**
         * Releases remote object with given id.
         */
        'Runtime.releaseObject': {
            paramsType: [Protocol.Runtime.ReleaseObjectRequest];
            returnType: void;
        };
        /**
         * Releases all remote objects that belong to a given group.
         */
        'Runtime.releaseObjectGroup': {
            paramsType: [Protocol.Runtime.ReleaseObjectGroupRequest];
            returnType: void;
        };
        /**
         * Tells inspected instance to run if it was waiting for debugger to attach.
         */
        'Runtime.runIfWaitingForDebugger': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Runs script with given id in a given context.
         */
        'Runtime.runScript': {
            paramsType: [Protocol.Runtime.RunScriptRequest];
            returnType: Protocol.Runtime.RunScriptResponse;
        };
        /**
         * Enables or disables async call stacks tracking.
         */
        'Runtime.setAsyncCallStackDepth': {
            paramsType: [Protocol.Runtime.SetAsyncCallStackDepthRequest];
            returnType: void;
        };
        'Runtime.setCustomObjectFormatterEnabled': {
            paramsType: [Protocol.Runtime.SetCustomObjectFormatterEnabledRequest];
            returnType: void;
        };
        'Runtime.setMaxCallStackSizeToCapture': {
            paramsType: [Protocol.Runtime.SetMaxCallStackSizeToCaptureRequest];
            returnType: void;
        };
        /**
         * Terminate current or next JavaScript execution.
         * Will cancel the termination when the outer-most script execution ends.
         */
        'Runtime.terminateExecution': {
            paramsType: [];
            returnType: void;
        };
        /**
         * If executionContextId is empty, adds binding with the given name on the
         * global objects of all inspected contexts, including those created later,
         * bindings survive reloads.
         * If executionContextId is specified, adds binding only on global object of
         * given execution context.
         * Binding function takes exactly one argument, this argument should be string,
         * in case of any other input, function throws an exception.
         * Each binding function call produces Runtime.bindingCalled notification.
         */
        'Runtime.addBinding': {
            paramsType: [Protocol.Runtime.AddBindingRequest];
            returnType: void;
        };
        /**
         * This method does not remove binding function from global object but
         * unsubscribes current runtime agent from Runtime.bindingCalled notifications.
         */
        'Runtime.removeBinding': {
            paramsType: [Protocol.Runtime.RemoveBindingRequest];
            returnType: void;
        };
        /**
         * Returns supported domains.
         */
        'Schema.getDomains': {
            paramsType: [];
            returnType: Protocol.Schema.GetDomainsResponse;
        };
        /**
         * Disables the accessibility domain.
         */
        'Accessibility.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables the accessibility domain which causes `AXNodeId`s to remain consistent between method calls.
         * This turns on accessibility for the page, which can impact performance until accessibility is disabled.
         */
        'Accessibility.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Fetches the accessibility node and partial accessibility tree for this DOM node, if it exists.
         */
        'Accessibility.getPartialAXTree': {
            paramsType: [Protocol.Accessibility.GetPartialAXTreeRequest?];
            returnType: Protocol.Accessibility.GetPartialAXTreeResponse;
        };
        /**
         * Fetches the entire accessibility tree for the root Document
         */
        'Accessibility.getFullAXTree': {
            paramsType: [Protocol.Accessibility.GetFullAXTreeRequest?];
            returnType: Protocol.Accessibility.GetFullAXTreeResponse;
        };
        /**
         * Fetches a particular accessibility node by AXNodeId.
         * Requires `enable()` to have been called previously.
         */
        'Accessibility.getChildAXNodes': {
            paramsType: [Protocol.Accessibility.GetChildAXNodesRequest];
            returnType: Protocol.Accessibility.GetChildAXNodesResponse;
        };
        /**
         * Query a DOM node's accessibility subtree for accessible name and role.
         * This command computes the name and role for all nodes in the subtree, including those that are
         * ignored for accessibility, and returns those that mactch the specified name and role. If no DOM
         * node is specified, or the DOM node does not exist, the command returns an error. If neither
         * `accessibleName` or `role` is specified, it returns all the accessibility nodes in the subtree.
         */
        'Accessibility.queryAXTree': {
            paramsType: [Protocol.Accessibility.QueryAXTreeRequest?];
            returnType: Protocol.Accessibility.QueryAXTreeResponse;
        };
        /**
         * Disables animation domain notifications.
         */
        'Animation.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables animation domain notifications.
         */
        'Animation.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Returns the current time of the an animation.
         */
        'Animation.getCurrentTime': {
            paramsType: [Protocol.Animation.GetCurrentTimeRequest];
            returnType: Protocol.Animation.GetCurrentTimeResponse;
        };
        /**
         * Gets the playback rate of the document timeline.
         */
        'Animation.getPlaybackRate': {
            paramsType: [];
            returnType: Protocol.Animation.GetPlaybackRateResponse;
        };
        /**
         * Releases a set of animations to no longer be manipulated.
         */
        'Animation.releaseAnimations': {
            paramsType: [Protocol.Animation.ReleaseAnimationsRequest];
            returnType: void;
        };
        /**
         * Gets the remote object of the Animation.
         */
        'Animation.resolveAnimation': {
            paramsType: [Protocol.Animation.ResolveAnimationRequest];
            returnType: Protocol.Animation.ResolveAnimationResponse;
        };
        /**
         * Seek a set of animations to a particular time within each animation.
         */
        'Animation.seekAnimations': {
            paramsType: [Protocol.Animation.SeekAnimationsRequest];
            returnType: void;
        };
        /**
         * Sets the paused state of a set of animations.
         */
        'Animation.setPaused': {
            paramsType: [Protocol.Animation.SetPausedRequest];
            returnType: void;
        };
        /**
         * Sets the playback rate of the document timeline.
         */
        'Animation.setPlaybackRate': {
            paramsType: [Protocol.Animation.SetPlaybackRateRequest];
            returnType: void;
        };
        /**
         * Sets the timing of an animation node.
         */
        'Animation.setTiming': {
            paramsType: [Protocol.Animation.SetTimingRequest];
            returnType: void;
        };
        /**
         * Enables application cache domain notifications.
         */
        'ApplicationCache.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Returns relevant application cache data for the document in given frame.
         */
        'ApplicationCache.getApplicationCacheForFrame': {
            paramsType: [Protocol.ApplicationCache.GetApplicationCacheForFrameRequest];
            returnType: Protocol.ApplicationCache.GetApplicationCacheForFrameResponse;
        };
        /**
         * Returns array of frame identifiers with manifest urls for each frame containing a document
         * associated with some application cache.
         */
        'ApplicationCache.getFramesWithManifests': {
            paramsType: [];
            returnType: Protocol.ApplicationCache.GetFramesWithManifestsResponse;
        };
        /**
         * Returns manifest URL for document in the given frame.
         */
        'ApplicationCache.getManifestForFrame': {
            paramsType: [Protocol.ApplicationCache.GetManifestForFrameRequest];
            returnType: Protocol.ApplicationCache.GetManifestForFrameResponse;
        };
        /**
         * Returns the response body and size if it were re-encoded with the specified settings. Only
         * applies to images.
         */
        'Audits.getEncodedResponse': {
            paramsType: [Protocol.Audits.GetEncodedResponseRequest];
            returnType: Protocol.Audits.GetEncodedResponseResponse;
        };
        /**
         * Disables issues domain, prevents further issues from being reported to the client.
         */
        'Audits.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables issues domain, sends the issues collected so far to the client by means of the
         * `issueAdded` event.
         */
        'Audits.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Runs the contrast check for the target page. Found issues are reported
         * using Audits.issueAdded event.
         */
        'Audits.checkContrast': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables event updates for the service.
         */
        'BackgroundService.startObserving': {
            paramsType: [Protocol.BackgroundService.StartObservingRequest];
            returnType: void;
        };
        /**
         * Disables event updates for the service.
         */
        'BackgroundService.stopObserving': {
            paramsType: [Protocol.BackgroundService.StopObservingRequest];
            returnType: void;
        };
        /**
         * Set the recording state for the service.
         */
        'BackgroundService.setRecording': {
            paramsType: [Protocol.BackgroundService.SetRecordingRequest];
            returnType: void;
        };
        /**
         * Clears all stored data for the service.
         */
        'BackgroundService.clearEvents': {
            paramsType: [Protocol.BackgroundService.ClearEventsRequest];
            returnType: void;
        };
        /**
         * Set permission settings for given origin.
         */
        'Browser.setPermission': {
            paramsType: [Protocol.Browser.SetPermissionRequest];
            returnType: void;
        };
        /**
         * Grant specific permissions to the given origin and reject all others.
         */
        'Browser.grantPermissions': {
            paramsType: [Protocol.Browser.GrantPermissionsRequest];
            returnType: void;
        };
        /**
         * Reset all permission management for all origins.
         */
        'Browser.resetPermissions': {
            paramsType: [Protocol.Browser.ResetPermissionsRequest?];
            returnType: void;
        };
        /**
         * Set the behavior when downloading a file.
         */
        'Browser.setDownloadBehavior': {
            paramsType: [Protocol.Browser.SetDownloadBehaviorRequest];
            returnType: void;
        };
        /**
         * Close browser gracefully.
         */
        'Browser.close': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Crashes browser on the main thread.
         */
        'Browser.crash': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Crashes GPU process.
         */
        'Browser.crashGpuProcess': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Returns version information.
         */
        'Browser.getVersion': {
            paramsType: [];
            returnType: Protocol.Browser.GetVersionResponse;
        };
        /**
         * Returns the command line switches for the browser process if, and only if
         * --enable-automation is on the commandline.
         */
        'Browser.getBrowserCommandLine': {
            paramsType: [];
            returnType: Protocol.Browser.GetBrowserCommandLineResponse;
        };
        /**
         * Get Chrome histograms.
         */
        'Browser.getHistograms': {
            paramsType: [Protocol.Browser.GetHistogramsRequest?];
            returnType: Protocol.Browser.GetHistogramsResponse;
        };
        /**
         * Get a Chrome histogram by name.
         */
        'Browser.getHistogram': {
            paramsType: [Protocol.Browser.GetHistogramRequest];
            returnType: Protocol.Browser.GetHistogramResponse;
        };
        /**
         * Get position and size of the browser window.
         */
        'Browser.getWindowBounds': {
            paramsType: [Protocol.Browser.GetWindowBoundsRequest];
            returnType: Protocol.Browser.GetWindowBoundsResponse;
        };
        /**
         * Get the browser window that contains the devtools target.
         */
        'Browser.getWindowForTarget': {
            paramsType: [Protocol.Browser.GetWindowForTargetRequest?];
            returnType: Protocol.Browser.GetWindowForTargetResponse;
        };
        /**
         * Set position and/or size of the browser window.
         */
        'Browser.setWindowBounds': {
            paramsType: [Protocol.Browser.SetWindowBoundsRequest];
            returnType: void;
        };
        /**
         * Set dock tile details, platform-specific.
         */
        'Browser.setDockTile': {
            paramsType: [Protocol.Browser.SetDockTileRequest?];
            returnType: void;
        };
        /**
         * Invoke custom browser commands used by telemetry.
         */
        'Browser.executeBrowserCommand': {
            paramsType: [Protocol.Browser.ExecuteBrowserCommandRequest];
            returnType: void;
        };
        /**
         * Inserts a new rule with the given `ruleText` in a stylesheet with given `styleSheetId`, at the
         * position specified by `location`.
         */
        'CSS.addRule': {
            paramsType: [Protocol.CSS.AddRuleRequest];
            returnType: Protocol.CSS.AddRuleResponse;
        };
        /**
         * Returns all class names from specified stylesheet.
         */
        'CSS.collectClassNames': {
            paramsType: [Protocol.CSS.CollectClassNamesRequest];
            returnType: Protocol.CSS.CollectClassNamesResponse;
        };
        /**
         * Creates a new special "via-inspector" stylesheet in the frame with given `frameId`.
         */
        'CSS.createStyleSheet': {
            paramsType: [Protocol.CSS.CreateStyleSheetRequest];
            returnType: Protocol.CSS.CreateStyleSheetResponse;
        };
        /**
         * Disables the CSS agent for the given page.
         */
        'CSS.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables the CSS agent for the given page. Clients should not assume that the CSS agent has been
         * enabled until the result of this command is received.
         */
        'CSS.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Ensures that the given node will have specified pseudo-classes whenever its style is computed by
         * the browser.
         */
        'CSS.forcePseudoState': {
            paramsType: [Protocol.CSS.ForcePseudoStateRequest];
            returnType: void;
        };
        'CSS.getBackgroundColors': {
            paramsType: [Protocol.CSS.GetBackgroundColorsRequest];
            returnType: Protocol.CSS.GetBackgroundColorsResponse;
        };
        /**
         * Returns the computed style for a DOM node identified by `nodeId`.
         */
        'CSS.getComputedStyleForNode': {
            paramsType: [Protocol.CSS.GetComputedStyleForNodeRequest];
            returnType: Protocol.CSS.GetComputedStyleForNodeResponse;
        };
        /**
         * Returns the styles defined inline (explicitly in the "style" attribute and implicitly, using DOM
         * attributes) for a DOM node identified by `nodeId`.
         */
        'CSS.getInlineStylesForNode': {
            paramsType: [Protocol.CSS.GetInlineStylesForNodeRequest];
            returnType: Protocol.CSS.GetInlineStylesForNodeResponse;
        };
        /**
         * Returns requested styles for a DOM node identified by `nodeId`.
         */
        'CSS.getMatchedStylesForNode': {
            paramsType: [Protocol.CSS.GetMatchedStylesForNodeRequest];
            returnType: Protocol.CSS.GetMatchedStylesForNodeResponse;
        };
        /**
         * Returns all media queries parsed by the rendering engine.
         */
        'CSS.getMediaQueries': {
            paramsType: [];
            returnType: Protocol.CSS.GetMediaQueriesResponse;
        };
        /**
         * Requests information about platform fonts which we used to render child TextNodes in the given
         * node.
         */
        'CSS.getPlatformFontsForNode': {
            paramsType: [Protocol.CSS.GetPlatformFontsForNodeRequest];
            returnType: Protocol.CSS.GetPlatformFontsForNodeResponse;
        };
        /**
         * Returns the current textual content for a stylesheet.
         */
        'CSS.getStyleSheetText': {
            paramsType: [Protocol.CSS.GetStyleSheetTextRequest];
            returnType: Protocol.CSS.GetStyleSheetTextResponse;
        };
        /**
         * Starts tracking the given computed styles for updates. The specified array of properties
         * replaces the one previously specified. Pass empty array to disable tracking.
         * Use takeComputedStyleUpdates to retrieve the list of nodes that had properties modified.
         * The changes to computed style properties are only tracked for nodes pushed to the front-end
         * by the DOM agent. If no changes to the tracked properties occur after the node has been pushed
         * to the front-end, no updates will be issued for the node.
         */
        'CSS.trackComputedStyleUpdates': {
            paramsType: [Protocol.CSS.TrackComputedStyleUpdatesRequest];
            returnType: void;
        };
        /**
         * Polls the next batch of computed style updates.
         */
        'CSS.takeComputedStyleUpdates': {
            paramsType: [];
            returnType: Protocol.CSS.TakeComputedStyleUpdatesResponse;
        };
        /**
         * Find a rule with the given active property for the given node and set the new value for this
         * property
         */
        'CSS.setEffectivePropertyValueForNode': {
            paramsType: [Protocol.CSS.SetEffectivePropertyValueForNodeRequest];
            returnType: void;
        };
        /**
         * Modifies the keyframe rule key text.
         */
        'CSS.setKeyframeKey': {
            paramsType: [Protocol.CSS.SetKeyframeKeyRequest];
            returnType: Protocol.CSS.SetKeyframeKeyResponse;
        };
        /**
         * Modifies the rule selector.
         */
        'CSS.setMediaText': {
            paramsType: [Protocol.CSS.SetMediaTextRequest];
            returnType: Protocol.CSS.SetMediaTextResponse;
        };
        /**
         * Modifies the rule selector.
         */
        'CSS.setRuleSelector': {
            paramsType: [Protocol.CSS.SetRuleSelectorRequest];
            returnType: Protocol.CSS.SetRuleSelectorResponse;
        };
        /**
         * Sets the new stylesheet text.
         */
        'CSS.setStyleSheetText': {
            paramsType: [Protocol.CSS.SetStyleSheetTextRequest];
            returnType: Protocol.CSS.SetStyleSheetTextResponse;
        };
        /**
         * Applies specified style edits one after another in the given order.
         */
        'CSS.setStyleTexts': {
            paramsType: [Protocol.CSS.SetStyleTextsRequest];
            returnType: Protocol.CSS.SetStyleTextsResponse;
        };
        /**
         * Enables the selector recording.
         */
        'CSS.startRuleUsageTracking': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Stop tracking rule usage and return the list of rules that were used since last call to
         * `takeCoverageDelta` (or since start of coverage instrumentation)
         */
        'CSS.stopRuleUsageTracking': {
            paramsType: [];
            returnType: Protocol.CSS.StopRuleUsageTrackingResponse;
        };
        /**
         * Obtain list of rules that became used since last call to this method (or since start of coverage
         * instrumentation)
         */
        'CSS.takeCoverageDelta': {
            paramsType: [];
            returnType: Protocol.CSS.TakeCoverageDeltaResponse;
        };
        /**
         * Enables/disables rendering of local CSS fonts (enabled by default).
         */
        'CSS.setLocalFontsEnabled': {
            paramsType: [Protocol.CSS.SetLocalFontsEnabledRequest];
            returnType: void;
        };
        /**
         * Deletes a cache.
         */
        'CacheStorage.deleteCache': {
            paramsType: [Protocol.CacheStorage.DeleteCacheRequest];
            returnType: void;
        };
        /**
         * Deletes a cache entry.
         */
        'CacheStorage.deleteEntry': {
            paramsType: [Protocol.CacheStorage.DeleteEntryRequest];
            returnType: void;
        };
        /**
         * Requests cache names.
         */
        'CacheStorage.requestCacheNames': {
            paramsType: [Protocol.CacheStorage.RequestCacheNamesRequest];
            returnType: Protocol.CacheStorage.RequestCacheNamesResponse;
        };
        /**
         * Fetches cache entry.
         */
        'CacheStorage.requestCachedResponse': {
            paramsType: [Protocol.CacheStorage.RequestCachedResponseRequest];
            returnType: Protocol.CacheStorage.RequestCachedResponseResponse;
        };
        /**
         * Requests data from cache.
         */
        'CacheStorage.requestEntries': {
            paramsType: [Protocol.CacheStorage.RequestEntriesRequest];
            returnType: Protocol.CacheStorage.RequestEntriesResponse;
        };
        /**
         * Starts observing for sinks that can be used for tab mirroring, and if set,
         * sinks compatible with |presentationUrl| as well. When sinks are found, a
         * |sinksUpdated| event is fired.
         * Also starts observing for issue messages. When an issue is added or removed,
         * an |issueUpdated| event is fired.
         */
        'Cast.enable': {
            paramsType: [Protocol.Cast.EnableRequest?];
            returnType: void;
        };
        /**
         * Stops observing for sinks and issues.
         */
        'Cast.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Sets a sink to be used when the web page requests the browser to choose a
         * sink via Presentation API, Remote Playback API, or Cast SDK.
         */
        'Cast.setSinkToUse': {
            paramsType: [Protocol.Cast.SetSinkToUseRequest];
            returnType: void;
        };
        /**
         * Starts mirroring the tab to the sink.
         */
        'Cast.startTabMirroring': {
            paramsType: [Protocol.Cast.StartTabMirroringRequest];
            returnType: void;
        };
        /**
         * Stops the active Cast session on the sink.
         */
        'Cast.stopCasting': {
            paramsType: [Protocol.Cast.StopCastingRequest];
            returnType: void;
        };
        /**
         * Collects class names for the node with given id and all of it's child nodes.
         */
        'DOM.collectClassNamesFromSubtree': {
            paramsType: [Protocol.DOM.CollectClassNamesFromSubtreeRequest];
            returnType: Protocol.DOM.CollectClassNamesFromSubtreeResponse;
        };
        /**
         * Creates a deep copy of the specified node and places it into the target container before the
         * given anchor.
         */
        'DOM.copyTo': {
            paramsType: [Protocol.DOM.CopyToRequest];
            returnType: Protocol.DOM.CopyToResponse;
        };
        /**
         * Describes node given its id, does not require domain to be enabled. Does not start tracking any
         * objects, can be used for automation.
         */
        'DOM.describeNode': {
            paramsType: [Protocol.DOM.DescribeNodeRequest?];
            returnType: Protocol.DOM.DescribeNodeResponse;
        };
        /**
         * Scrolls the specified rect of the given node into view if not already visible.
         * Note: exactly one between nodeId, backendNodeId and objectId should be passed
         * to identify the node.
         */
        'DOM.scrollIntoViewIfNeeded': {
            paramsType: [Protocol.DOM.ScrollIntoViewIfNeededRequest?];
            returnType: void;
        };
        /**
         * Disables DOM agent for the given page.
         */
        'DOM.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Discards search results from the session with the given id. `getSearchResults` should no longer
         * be called for that search.
         */
        'DOM.discardSearchResults': {
            paramsType: [Protocol.DOM.DiscardSearchResultsRequest];
            returnType: void;
        };
        /**
         * Enables DOM agent for the given page.
         */
        'DOM.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Focuses the given element.
         */
        'DOM.focus': {
            paramsType: [Protocol.DOM.FocusRequest?];
            returnType: void;
        };
        /**
         * Returns attributes for the specified node.
         */
        'DOM.getAttributes': {
            paramsType: [Protocol.DOM.GetAttributesRequest];
            returnType: Protocol.DOM.GetAttributesResponse;
        };
        /**
         * Returns boxes for the given node.
         */
        'DOM.getBoxModel': {
            paramsType: [Protocol.DOM.GetBoxModelRequest?];
            returnType: Protocol.DOM.GetBoxModelResponse;
        };
        /**
         * Returns quads that describe node position on the page. This method
         * might return multiple quads for inline nodes.
         */
        'DOM.getContentQuads': {
            paramsType: [Protocol.DOM.GetContentQuadsRequest?];
            returnType: Protocol.DOM.GetContentQuadsResponse;
        };
        /**
         * Returns the root DOM node (and optionally the subtree) to the caller.
         */
        'DOM.getDocument': {
            paramsType: [Protocol.DOM.GetDocumentRequest?];
            returnType: Protocol.DOM.GetDocumentResponse;
        };
        /**
         * Returns the root DOM node (and optionally the subtree) to the caller.
         * Deprecated, as it is not designed to work well with the rest of the DOM agent.
         * Use DOMSnapshot.captureSnapshot instead.
         */
        'DOM.getFlattenedDocument': {
            paramsType: [Protocol.DOM.GetFlattenedDocumentRequest?];
            returnType: Protocol.DOM.GetFlattenedDocumentResponse;
        };
        /**
         * Finds nodes with a given computed style in a subtree.
         */
        'DOM.getNodesForSubtreeByStyle': {
            paramsType: [Protocol.DOM.GetNodesForSubtreeByStyleRequest];
            returnType: Protocol.DOM.GetNodesForSubtreeByStyleResponse;
        };
        /**
         * Returns node id at given location. Depending on whether DOM domain is enabled, nodeId is
         * either returned or not.
         */
        'DOM.getNodeForLocation': {
            paramsType: [Protocol.DOM.GetNodeForLocationRequest];
            returnType: Protocol.DOM.GetNodeForLocationResponse;
        };
        /**
         * Returns node's HTML markup.
         */
        'DOM.getOuterHTML': {
            paramsType: [Protocol.DOM.GetOuterHTMLRequest?];
            returnType: Protocol.DOM.GetOuterHTMLResponse;
        };
        /**
         * Returns the id of the nearest ancestor that is a relayout boundary.
         */
        'DOM.getRelayoutBoundary': {
            paramsType: [Protocol.DOM.GetRelayoutBoundaryRequest];
            returnType: Protocol.DOM.GetRelayoutBoundaryResponse;
        };
        /**
         * Returns search results from given `fromIndex` to given `toIndex` from the search with the given
         * identifier.
         */
        'DOM.getSearchResults': {
            paramsType: [Protocol.DOM.GetSearchResultsRequest];
            returnType: Protocol.DOM.GetSearchResultsResponse;
        };
        /**
         * Hides any highlight.
         */
        'DOM.hideHighlight': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Highlights DOM node.
         */
        'DOM.highlightNode': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Highlights given rectangle.
         */
        'DOM.highlightRect': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Marks last undoable state.
         */
        'DOM.markUndoableState': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Moves node into the new container, places it before the given anchor.
         */
        'DOM.moveTo': {
            paramsType: [Protocol.DOM.MoveToRequest];
            returnType: Protocol.DOM.MoveToResponse;
        };
        /**
         * Searches for a given string in the DOM tree. Use `getSearchResults` to access search results or
         * `cancelSearch` to end this search session.
         */
        'DOM.performSearch': {
            paramsType: [Protocol.DOM.PerformSearchRequest];
            returnType: Protocol.DOM.PerformSearchResponse;
        };
        /**
         * Requests that the node is sent to the caller given its path. // FIXME, use XPath
         */
        'DOM.pushNodeByPathToFrontend': {
            paramsType: [Protocol.DOM.PushNodeByPathToFrontendRequest];
            returnType: Protocol.DOM.PushNodeByPathToFrontendResponse;
        };
        /**
         * Requests that a batch of nodes is sent to the caller given their backend node ids.
         */
        'DOM.pushNodesByBackendIdsToFrontend': {
            paramsType: [Protocol.DOM.PushNodesByBackendIdsToFrontendRequest];
            returnType: Protocol.DOM.PushNodesByBackendIdsToFrontendResponse;
        };
        /**
         * Executes `querySelector` on a given node.
         */
        'DOM.querySelector': {
            paramsType: [Protocol.DOM.QuerySelectorRequest];
            returnType: Protocol.DOM.QuerySelectorResponse;
        };
        /**
         * Executes `querySelectorAll` on a given node.
         */
        'DOM.querySelectorAll': {
            paramsType: [Protocol.DOM.QuerySelectorAllRequest];
            returnType: Protocol.DOM.QuerySelectorAllResponse;
        };
        /**
         * Re-does the last undone action.
         */
        'DOM.redo': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Removes attribute with given name from an element with given id.
         */
        'DOM.removeAttribute': {
            paramsType: [Protocol.DOM.RemoveAttributeRequest];
            returnType: void;
        };
        /**
         * Removes node with given id.
         */
        'DOM.removeNode': {
            paramsType: [Protocol.DOM.RemoveNodeRequest];
            returnType: void;
        };
        /**
         * Requests that children of the node with given id are returned to the caller in form of
         * `setChildNodes` events where not only immediate children are retrieved, but all children down to
         * the specified depth.
         */
        'DOM.requestChildNodes': {
            paramsType: [Protocol.DOM.RequestChildNodesRequest];
            returnType: void;
        };
        /**
         * Requests that the node is sent to the caller given the JavaScript node object reference. All
         * nodes that form the path from the node to the root are also sent to the client as a series of
         * `setChildNodes` notifications.
         */
        'DOM.requestNode': {
            paramsType: [Protocol.DOM.RequestNodeRequest];
            returnType: Protocol.DOM.RequestNodeResponse;
        };
        /**
         * Resolves the JavaScript node object for a given NodeId or BackendNodeId.
         */
        'DOM.resolveNode': {
            paramsType: [Protocol.DOM.ResolveNodeRequest?];
            returnType: Protocol.DOM.ResolveNodeResponse;
        };
        /**
         * Sets attribute for an element with given id.
         */
        'DOM.setAttributeValue': {
            paramsType: [Protocol.DOM.SetAttributeValueRequest];
            returnType: void;
        };
        /**
         * Sets attributes on element with given id. This method is useful when user edits some existing
         * attribute value and types in several attribute name/value pairs.
         */
        'DOM.setAttributesAsText': {
            paramsType: [Protocol.DOM.SetAttributesAsTextRequest];
            returnType: void;
        };
        /**
         * Sets files for the given file input element.
         */
        'DOM.setFileInputFiles': {
            paramsType: [Protocol.DOM.SetFileInputFilesRequest];
            returnType: void;
        };
        /**
         * Sets if stack traces should be captured for Nodes. See `Node.getNodeStackTraces`. Default is disabled.
         */
        'DOM.setNodeStackTracesEnabled': {
            paramsType: [Protocol.DOM.SetNodeStackTracesEnabledRequest];
            returnType: void;
        };
        /**
         * Gets stack traces associated with a Node. As of now, only provides stack trace for Node creation.
         */
        'DOM.getNodeStackTraces': {
            paramsType: [Protocol.DOM.GetNodeStackTracesRequest];
            returnType: Protocol.DOM.GetNodeStackTracesResponse;
        };
        /**
         * Returns file information for the given
         * File wrapper.
         */
        'DOM.getFileInfo': {
            paramsType: [Protocol.DOM.GetFileInfoRequest];
            returnType: Protocol.DOM.GetFileInfoResponse;
        };
        /**
         * Enables console to refer to the node with given id via $x (see Command Line API for more details
         * $x functions).
         */
        'DOM.setInspectedNode': {
            paramsType: [Protocol.DOM.SetInspectedNodeRequest];
            returnType: void;
        };
        /**
         * Sets node name for a node with given id.
         */
        'DOM.setNodeName': {
            paramsType: [Protocol.DOM.SetNodeNameRequest];
            returnType: Protocol.DOM.SetNodeNameResponse;
        };
        /**
         * Sets node value for a node with given id.
         */
        'DOM.setNodeValue': {
            paramsType: [Protocol.DOM.SetNodeValueRequest];
            returnType: void;
        };
        /**
         * Sets node HTML markup, returns new node id.
         */
        'DOM.setOuterHTML': {
            paramsType: [Protocol.DOM.SetOuterHTMLRequest];
            returnType: void;
        };
        /**
         * Undoes the last performed action.
         */
        'DOM.undo': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Returns iframe node that owns iframe with the given domain.
         */
        'DOM.getFrameOwner': {
            paramsType: [Protocol.DOM.GetFrameOwnerRequest];
            returnType: Protocol.DOM.GetFrameOwnerResponse;
        };
        /**
         * Returns event listeners of the given object.
         */
        'DOMDebugger.getEventListeners': {
            paramsType: [Protocol.DOMDebugger.GetEventListenersRequest];
            returnType: Protocol.DOMDebugger.GetEventListenersResponse;
        };
        /**
         * Removes DOM breakpoint that was set using `setDOMBreakpoint`.
         */
        'DOMDebugger.removeDOMBreakpoint': {
            paramsType: [Protocol.DOMDebugger.RemoveDOMBreakpointRequest];
            returnType: void;
        };
        /**
         * Removes breakpoint on particular DOM event.
         */
        'DOMDebugger.removeEventListenerBreakpoint': {
            paramsType: [Protocol.DOMDebugger.RemoveEventListenerBreakpointRequest];
            returnType: void;
        };
        /**
         * Removes breakpoint on particular native event.
         */
        'DOMDebugger.removeInstrumentationBreakpoint': {
            paramsType: [Protocol.DOMDebugger.RemoveInstrumentationBreakpointRequest];
            returnType: void;
        };
        /**
         * Removes breakpoint from XMLHttpRequest.
         */
        'DOMDebugger.removeXHRBreakpoint': {
            paramsType: [Protocol.DOMDebugger.RemoveXHRBreakpointRequest];
            returnType: void;
        };
        /**
         * Sets breakpoint on particular CSP violations.
         */
        'DOMDebugger.setBreakOnCSPViolation': {
            paramsType: [Protocol.DOMDebugger.SetBreakOnCSPViolationRequest];
            returnType: void;
        };
        /**
         * Sets breakpoint on particular operation with DOM.
         */
        'DOMDebugger.setDOMBreakpoint': {
            paramsType: [Protocol.DOMDebugger.SetDOMBreakpointRequest];
            returnType: void;
        };
        /**
         * Sets breakpoint on particular DOM event.
         */
        'DOMDebugger.setEventListenerBreakpoint': {
            paramsType: [Protocol.DOMDebugger.SetEventListenerBreakpointRequest];
            returnType: void;
        };
        /**
         * Sets breakpoint on particular native event.
         */
        'DOMDebugger.setInstrumentationBreakpoint': {
            paramsType: [Protocol.DOMDebugger.SetInstrumentationBreakpointRequest];
            returnType: void;
        };
        /**
         * Sets breakpoint on XMLHttpRequest.
         */
        'DOMDebugger.setXHRBreakpoint': {
            paramsType: [Protocol.DOMDebugger.SetXHRBreakpointRequest];
            returnType: void;
        };
        /**
         * Disables DOM snapshot agent for the given page.
         */
        'DOMSnapshot.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables DOM snapshot agent for the given page.
         */
        'DOMSnapshot.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Returns a document snapshot, including the full DOM tree of the root node (including iframes,
         * template contents, and imported documents) in a flattened array, as well as layout and
         * white-listed computed style information for the nodes. Shadow DOM in the returned DOM tree is
         * flattened.
         */
        'DOMSnapshot.getSnapshot': {
            paramsType: [Protocol.DOMSnapshot.GetSnapshotRequest];
            returnType: Protocol.DOMSnapshot.GetSnapshotResponse;
        };
        /**
         * Returns a document snapshot, including the full DOM tree of the root node (including iframes,
         * template contents, and imported documents) in a flattened array, as well as layout and
         * white-listed computed style information for the nodes. Shadow DOM in the returned DOM tree is
         * flattened.
         */
        'DOMSnapshot.captureSnapshot': {
            paramsType: [Protocol.DOMSnapshot.CaptureSnapshotRequest];
            returnType: Protocol.DOMSnapshot.CaptureSnapshotResponse;
        };
        'DOMStorage.clear': {
            paramsType: [Protocol.DOMStorage.ClearRequest];
            returnType: void;
        };
        /**
         * Disables storage tracking, prevents storage events from being sent to the client.
         */
        'DOMStorage.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables storage tracking, storage events will now be delivered to the client.
         */
        'DOMStorage.enable': {
            paramsType: [];
            returnType: void;
        };
        'DOMStorage.getDOMStorageItems': {
            paramsType: [Protocol.DOMStorage.GetDOMStorageItemsRequest];
            returnType: Protocol.DOMStorage.GetDOMStorageItemsResponse;
        };
        'DOMStorage.removeDOMStorageItem': {
            paramsType: [Protocol.DOMStorage.RemoveDOMStorageItemRequest];
            returnType: void;
        };
        'DOMStorage.setDOMStorageItem': {
            paramsType: [Protocol.DOMStorage.SetDOMStorageItemRequest];
            returnType: void;
        };
        /**
         * Disables database tracking, prevents database events from being sent to the client.
         */
        'Database.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables database tracking, database events will now be delivered to the client.
         */
        'Database.enable': {
            paramsType: [];
            returnType: void;
        };
        'Database.executeSQL': {
            paramsType: [Protocol.Database.ExecuteSQLRequest];
            returnType: Protocol.Database.ExecuteSQLResponse;
        };
        'Database.getDatabaseTableNames': {
            paramsType: [Protocol.Database.GetDatabaseTableNamesRequest];
            returnType: Protocol.Database.GetDatabaseTableNamesResponse;
        };
        /**
         * Clears the overridden Device Orientation.
         */
        'DeviceOrientation.clearDeviceOrientationOverride': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Overrides the Device Orientation.
         */
        'DeviceOrientation.setDeviceOrientationOverride': {
            paramsType: [Protocol.DeviceOrientation.SetDeviceOrientationOverrideRequest];
            returnType: void;
        };
        /**
         * Tells whether emulation is supported.
         */
        'Emulation.canEmulate': {
            paramsType: [];
            returnType: Protocol.Emulation.CanEmulateResponse;
        };
        /**
         * Clears the overriden device metrics.
         */
        'Emulation.clearDeviceMetricsOverride': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Clears the overriden Geolocation Position and Error.
         */
        'Emulation.clearGeolocationOverride': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Requests that page scale factor is reset to initial values.
         */
        'Emulation.resetPageScaleFactor': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables or disables simulating a focused and active page.
         */
        'Emulation.setFocusEmulationEnabled': {
            paramsType: [Protocol.Emulation.SetFocusEmulationEnabledRequest];
            returnType: void;
        };
        /**
         * Enables CPU throttling to emulate slow CPUs.
         */
        'Emulation.setCPUThrottlingRate': {
            paramsType: [Protocol.Emulation.SetCPUThrottlingRateRequest];
            returnType: void;
        };
        /**
         * Sets or clears an override of the default background color of the frame. This override is used
         * if the content does not specify one.
         */
        'Emulation.setDefaultBackgroundColorOverride': {
            paramsType: [Protocol.Emulation.SetDefaultBackgroundColorOverrideRequest?];
            returnType: void;
        };
        /**
         * Overrides the values of device screen dimensions (window.screen.width, window.screen.height,
         * window.innerWidth, window.innerHeight, and "device-width"/"device-height"-related CSS media
         * query results).
         */
        'Emulation.setDeviceMetricsOverride': {
            paramsType: [Protocol.Emulation.SetDeviceMetricsOverrideRequest];
            returnType: void;
        };
        'Emulation.setScrollbarsHidden': {
            paramsType: [Protocol.Emulation.SetScrollbarsHiddenRequest];
            returnType: void;
        };
        'Emulation.setDocumentCookieDisabled': {
            paramsType: [Protocol.Emulation.SetDocumentCookieDisabledRequest];
            returnType: void;
        };
        'Emulation.setEmitTouchEventsForMouse': {
            paramsType: [Protocol.Emulation.SetEmitTouchEventsForMouseRequest];
            returnType: void;
        };
        /**
         * Emulates the given media type or media feature for CSS media queries.
         */
        'Emulation.setEmulatedMedia': {
            paramsType: [Protocol.Emulation.SetEmulatedMediaRequest?];
            returnType: void;
        };
        /**
         * Emulates the given vision deficiency.
         */
        'Emulation.setEmulatedVisionDeficiency': {
            paramsType: [Protocol.Emulation.SetEmulatedVisionDeficiencyRequest];
            returnType: void;
        };
        /**
         * Overrides the Geolocation Position or Error. Omitting any of the parameters emulates position
         * unavailable.
         */
        'Emulation.setGeolocationOverride': {
            paramsType: [Protocol.Emulation.SetGeolocationOverrideRequest?];
            returnType: void;
        };
        /**
         * Overrides the Idle state.
         */
        'Emulation.setIdleOverride': {
            paramsType: [Protocol.Emulation.SetIdleOverrideRequest];
            returnType: void;
        };
        /**
         * Clears Idle state overrides.
         */
        'Emulation.clearIdleOverride': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Overrides value returned by the javascript navigator object.
         */
        'Emulation.setNavigatorOverrides': {
            paramsType: [Protocol.Emulation.SetNavigatorOverridesRequest];
            returnType: void;
        };
        /**
         * Sets a specified page scale factor.
         */
        'Emulation.setPageScaleFactor': {
            paramsType: [Protocol.Emulation.SetPageScaleFactorRequest];
            returnType: void;
        };
        /**
         * Switches script execution in the page.
         */
        'Emulation.setScriptExecutionDisabled': {
            paramsType: [Protocol.Emulation.SetScriptExecutionDisabledRequest];
            returnType: void;
        };
        /**
         * Enables touch on platforms which do not support them.
         */
        'Emulation.setTouchEmulationEnabled': {
            paramsType: [Protocol.Emulation.SetTouchEmulationEnabledRequest];
            returnType: void;
        };
        /**
         * Turns on virtual time for all frames (replacing real-time with a synthetic time source) and sets
         * the current virtual time policy.  Note this supersedes any previous time budget.
         */
        'Emulation.setVirtualTimePolicy': {
            paramsType: [Protocol.Emulation.SetVirtualTimePolicyRequest];
            returnType: Protocol.Emulation.SetVirtualTimePolicyResponse;
        };
        /**
         * Overrides default host system locale with the specified one.
         */
        'Emulation.setLocaleOverride': {
            paramsType: [Protocol.Emulation.SetLocaleOverrideRequest?];
            returnType: void;
        };
        /**
         * Overrides default host system timezone with the specified one.
         */
        'Emulation.setTimezoneOverride': {
            paramsType: [Protocol.Emulation.SetTimezoneOverrideRequest];
            returnType: void;
        };
        /**
         * Resizes the frame/viewport of the page. Note that this does not affect the frame's container
         * (e.g. browser window). Can be used to produce screenshots of the specified size. Not supported
         * on Android.
         */
        'Emulation.setVisibleSize': {
            paramsType: [Protocol.Emulation.SetVisibleSizeRequest];
            returnType: void;
        };
        'Emulation.setDisabledImageTypes': {
            paramsType: [Protocol.Emulation.SetDisabledImageTypesRequest];
            returnType: void;
        };
        /**
         * Allows overriding user agent with the given string.
         */
        'Emulation.setUserAgentOverride': {
            paramsType: [Protocol.Emulation.SetUserAgentOverrideRequest];
            returnType: void;
        };
        /**
         * Sends a BeginFrame to the target and returns when the frame was completed. Optionally captures a
         * screenshot from the resulting frame. Requires that the target was created with enabled
         * BeginFrameControl. Designed for use with --run-all-compositor-stages-before-draw, see also
         * https://goo.gl/3zHXhB for more background.
         */
        'HeadlessExperimental.beginFrame': {
            paramsType: [Protocol.HeadlessExperimental.BeginFrameRequest?];
            returnType: Protocol.HeadlessExperimental.BeginFrameResponse;
        };
        /**
         * Disables headless events for the target.
         */
        'HeadlessExperimental.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables headless events for the target.
         */
        'HeadlessExperimental.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Close the stream, discard any temporary backing storage.
         */
        'IO.close': {
            paramsType: [Protocol.IO.CloseRequest];
            returnType: void;
        };
        /**
         * Read a chunk of the stream
         */
        'IO.read': {
            paramsType: [Protocol.IO.ReadRequest];
            returnType: Protocol.IO.ReadResponse;
        };
        /**
         * Return UUID of Blob object specified by a remote object id.
         */
        'IO.resolveBlob': {
            paramsType: [Protocol.IO.ResolveBlobRequest];
            returnType: Protocol.IO.ResolveBlobResponse;
        };
        /**
         * Clears all entries from an object store.
         */
        'IndexedDB.clearObjectStore': {
            paramsType: [Protocol.IndexedDB.ClearObjectStoreRequest];
            returnType: void;
        };
        /**
         * Deletes a database.
         */
        'IndexedDB.deleteDatabase': {
            paramsType: [Protocol.IndexedDB.DeleteDatabaseRequest];
            returnType: void;
        };
        /**
         * Delete a range of entries from an object store
         */
        'IndexedDB.deleteObjectStoreEntries': {
            paramsType: [Protocol.IndexedDB.DeleteObjectStoreEntriesRequest];
            returnType: void;
        };
        /**
         * Disables events from backend.
         */
        'IndexedDB.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables events from backend.
         */
        'IndexedDB.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Requests data from object store or index.
         */
        'IndexedDB.requestData': {
            paramsType: [Protocol.IndexedDB.RequestDataRequest];
            returnType: Protocol.IndexedDB.RequestDataResponse;
        };
        /**
         * Gets metadata of an object store
         */
        'IndexedDB.getMetadata': {
            paramsType: [Protocol.IndexedDB.GetMetadataRequest];
            returnType: Protocol.IndexedDB.GetMetadataResponse;
        };
        /**
         * Requests database with given name in given frame.
         */
        'IndexedDB.requestDatabase': {
            paramsType: [Protocol.IndexedDB.RequestDatabaseRequest];
            returnType: Protocol.IndexedDB.RequestDatabaseResponse;
        };
        /**
         * Requests database names for given security origin.
         */
        'IndexedDB.requestDatabaseNames': {
            paramsType: [Protocol.IndexedDB.RequestDatabaseNamesRequest];
            returnType: Protocol.IndexedDB.RequestDatabaseNamesResponse;
        };
        /**
         * Dispatches a key event to the page.
         */
        'Input.dispatchKeyEvent': {
            paramsType: [Protocol.Input.DispatchKeyEventRequest];
            returnType: void;
        };
        /**
         * This method emulates inserting text that doesn't come from a key press,
         * for example an emoji keyboard or an IME.
         */
        'Input.insertText': {
            paramsType: [Protocol.Input.InsertTextRequest];
            returnType: void;
        };
        /**
         * Dispatches a mouse event to the page.
         */
        'Input.dispatchMouseEvent': {
            paramsType: [Protocol.Input.DispatchMouseEventRequest];
            returnType: void;
        };
        /**
         * Dispatches a touch event to the page.
         */
        'Input.dispatchTouchEvent': {
            paramsType: [Protocol.Input.DispatchTouchEventRequest];
            returnType: void;
        };
        /**
         * Emulates touch event from the mouse event parameters.
         */
        'Input.emulateTouchFromMouseEvent': {
            paramsType: [Protocol.Input.EmulateTouchFromMouseEventRequest];
            returnType: void;
        };
        /**
         * Ignores input events (useful while auditing page).
         */
        'Input.setIgnoreInputEvents': {
            paramsType: [Protocol.Input.SetIgnoreInputEventsRequest];
            returnType: void;
        };
        /**
         * Synthesizes a pinch gesture over a time period by issuing appropriate touch events.
         */
        'Input.synthesizePinchGesture': {
            paramsType: [Protocol.Input.SynthesizePinchGestureRequest];
            returnType: void;
        };
        /**
         * Synthesizes a scroll gesture over a time period by issuing appropriate touch events.
         */
        'Input.synthesizeScrollGesture': {
            paramsType: [Protocol.Input.SynthesizeScrollGestureRequest];
            returnType: void;
        };
        /**
         * Synthesizes a tap gesture over a time period by issuing appropriate touch events.
         */
        'Input.synthesizeTapGesture': {
            paramsType: [Protocol.Input.SynthesizeTapGestureRequest];
            returnType: void;
        };
        /**
         * Disables inspector domain notifications.
         */
        'Inspector.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables inspector domain notifications.
         */
        'Inspector.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Provides the reasons why the given layer was composited.
         */
        'LayerTree.compositingReasons': {
            paramsType: [Protocol.LayerTree.CompositingReasonsRequest];
            returnType: Protocol.LayerTree.CompositingReasonsResponse;
        };
        /**
         * Disables compositing tree inspection.
         */
        'LayerTree.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables compositing tree inspection.
         */
        'LayerTree.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Returns the snapshot identifier.
         */
        'LayerTree.loadSnapshot': {
            paramsType: [Protocol.LayerTree.LoadSnapshotRequest];
            returnType: Protocol.LayerTree.LoadSnapshotResponse;
        };
        /**
         * Returns the layer snapshot identifier.
         */
        'LayerTree.makeSnapshot': {
            paramsType: [Protocol.LayerTree.MakeSnapshotRequest];
            returnType: Protocol.LayerTree.MakeSnapshotResponse;
        };
        'LayerTree.profileSnapshot': {
            paramsType: [Protocol.LayerTree.ProfileSnapshotRequest];
            returnType: Protocol.LayerTree.ProfileSnapshotResponse;
        };
        /**
         * Releases layer snapshot captured by the back-end.
         */
        'LayerTree.releaseSnapshot': {
            paramsType: [Protocol.LayerTree.ReleaseSnapshotRequest];
            returnType: void;
        };
        /**
         * Replays the layer snapshot and returns the resulting bitmap.
         */
        'LayerTree.replaySnapshot': {
            paramsType: [Protocol.LayerTree.ReplaySnapshotRequest];
            returnType: Protocol.LayerTree.ReplaySnapshotResponse;
        };
        /**
         * Replays the layer snapshot and returns canvas log.
         */
        'LayerTree.snapshotCommandLog': {
            paramsType: [Protocol.LayerTree.SnapshotCommandLogRequest];
            returnType: Protocol.LayerTree.SnapshotCommandLogResponse;
        };
        /**
         * Clears the log.
         */
        'Log.clear': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Disables log domain, prevents further log entries from being reported to the client.
         */
        'Log.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables log domain, sends the entries collected so far to the client by means of the
         * `entryAdded` notification.
         */
        'Log.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * start violation reporting.
         */
        'Log.startViolationsReport': {
            paramsType: [Protocol.Log.StartViolationsReportRequest];
            returnType: void;
        };
        /**
         * Stop violation reporting.
         */
        'Log.stopViolationsReport': {
            paramsType: [];
            returnType: void;
        };
        'Memory.getDOMCounters': {
            paramsType: [];
            returnType: Protocol.Memory.GetDOMCountersResponse;
        };
        'Memory.prepareForLeakDetection': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Simulate OomIntervention by purging V8 memory.
         */
        'Memory.forciblyPurgeJavaScriptMemory': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enable/disable suppressing memory pressure notifications in all processes.
         */
        'Memory.setPressureNotificationsSuppressed': {
            paramsType: [Protocol.Memory.SetPressureNotificationsSuppressedRequest];
            returnType: void;
        };
        /**
         * Simulate a memory pressure notification in all processes.
         */
        'Memory.simulatePressureNotification': {
            paramsType: [Protocol.Memory.SimulatePressureNotificationRequest];
            returnType: void;
        };
        /**
         * Start collecting native memory profile.
         */
        'Memory.startSampling': {
            paramsType: [Protocol.Memory.StartSamplingRequest?];
            returnType: void;
        };
        /**
         * Stop collecting native memory profile.
         */
        'Memory.stopSampling': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Retrieve native memory allocations profile
         * collected since renderer process startup.
         */
        'Memory.getAllTimeSamplingProfile': {
            paramsType: [];
            returnType: Protocol.Memory.GetAllTimeSamplingProfileResponse;
        };
        /**
         * Retrieve native memory allocations profile
         * collected since browser process startup.
         */
        'Memory.getBrowserSamplingProfile': {
            paramsType: [];
            returnType: Protocol.Memory.GetBrowserSamplingProfileResponse;
        };
        /**
         * Retrieve native memory allocations profile collected since last
         * `startSampling` call.
         */
        'Memory.getSamplingProfile': {
            paramsType: [];
            returnType: Protocol.Memory.GetSamplingProfileResponse;
        };
        /**
         * Tells whether clearing browser cache is supported.
         */
        'Network.canClearBrowserCache': {
            paramsType: [];
            returnType: Protocol.Network.CanClearBrowserCacheResponse;
        };
        /**
         * Tells whether clearing browser cookies is supported.
         */
        'Network.canClearBrowserCookies': {
            paramsType: [];
            returnType: Protocol.Network.CanClearBrowserCookiesResponse;
        };
        /**
         * Tells whether emulation of network conditions is supported.
         */
        'Network.canEmulateNetworkConditions': {
            paramsType: [];
            returnType: Protocol.Network.CanEmulateNetworkConditionsResponse;
        };
        /**
         * Clears browser cache.
         */
        'Network.clearBrowserCache': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Clears browser cookies.
         */
        'Network.clearBrowserCookies': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Response to Network.requestIntercepted which either modifies the request to continue with any
         * modifications, or blocks it, or completes it with the provided response bytes. If a network
         * fetch occurs as a result which encounters a redirect an additional Network.requestIntercepted
         * event will be sent with the same InterceptionId.
         * Deprecated, use Fetch.continueRequest, Fetch.fulfillRequest and Fetch.failRequest instead.
         */
        'Network.continueInterceptedRequest': {
            paramsType: [Protocol.Network.ContinueInterceptedRequestRequest];
            returnType: void;
        };
        /**
         * Deletes browser cookies with matching name and url or domain/path pair.
         */
        'Network.deleteCookies': {
            paramsType: [Protocol.Network.DeleteCookiesRequest];
            returnType: void;
        };
        /**
         * Disables network tracking, prevents network events from being sent to the client.
         */
        'Network.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Activates emulation of network conditions.
         */
        'Network.emulateNetworkConditions': {
            paramsType: [Protocol.Network.EmulateNetworkConditionsRequest];
            returnType: void;
        };
        /**
         * Enables network tracking, network events will now be delivered to the client.
         */
        'Network.enable': {
            paramsType: [Protocol.Network.EnableRequest?];
            returnType: void;
        };
        /**
         * Returns all browser cookies. Depending on the backend support, will return detailed cookie
         * information in the `cookies` field.
         */
        'Network.getAllCookies': {
            paramsType: [];
            returnType: Protocol.Network.GetAllCookiesResponse;
        };
        /**
         * Returns the DER-encoded certificate.
         */
        'Network.getCertificate': {
            paramsType: [Protocol.Network.GetCertificateRequest];
            returnType: Protocol.Network.GetCertificateResponse;
        };
        /**
         * Returns all browser cookies for the current URL. Depending on the backend support, will return
         * detailed cookie information in the `cookies` field.
         */
        'Network.getCookies': {
            paramsType: [Protocol.Network.GetCookiesRequest?];
            returnType: Protocol.Network.GetCookiesResponse;
        };
        /**
         * Returns content served for the given request.
         */
        'Network.getResponseBody': {
            paramsType: [Protocol.Network.GetResponseBodyRequest];
            returnType: Protocol.Network.GetResponseBodyResponse;
        };
        /**
         * Returns post data sent with the request. Returns an error when no data was sent with the request.
         */
        'Network.getRequestPostData': {
            paramsType: [Protocol.Network.GetRequestPostDataRequest];
            returnType: Protocol.Network.GetRequestPostDataResponse;
        };
        /**
         * Returns content served for the given currently intercepted request.
         */
        'Network.getResponseBodyForInterception': {
            paramsType: [Protocol.Network.GetResponseBodyForInterceptionRequest];
            returnType: Protocol.Network.GetResponseBodyForInterceptionResponse;
        };
        /**
         * Returns a handle to the stream representing the response body. Note that after this command,
         * the intercepted request can't be continued as is -- you either need to cancel it or to provide
         * the response body. The stream only supports sequential read, IO.read will fail if the position
         * is specified.
         */
        'Network.takeResponseBodyForInterceptionAsStream': {
            paramsType: [Protocol.Network.TakeResponseBodyForInterceptionAsStreamRequest];
            returnType: Protocol.Network.TakeResponseBodyForInterceptionAsStreamResponse;
        };
        /**
         * This method sends a new XMLHttpRequest which is identical to the original one. The following
         * parameters should be identical: method, url, async, request body, extra headers, withCredentials
         * attribute, user, password.
         */
        'Network.replayXHR': {
            paramsType: [Protocol.Network.ReplayXHRRequest];
            returnType: void;
        };
        /**
         * Searches for given string in response content.
         */
        'Network.searchInResponseBody': {
            paramsType: [Protocol.Network.SearchInResponseBodyRequest];
            returnType: Protocol.Network.SearchInResponseBodyResponse;
        };
        /**
         * Blocks URLs from loading.
         */
        'Network.setBlockedURLs': {
            paramsType: [Protocol.Network.SetBlockedURLsRequest];
            returnType: void;
        };
        /**
         * Toggles ignoring of service worker for each request.
         */
        'Network.setBypassServiceWorker': {
            paramsType: [Protocol.Network.SetBypassServiceWorkerRequest];
            returnType: void;
        };
        /**
         * Toggles ignoring cache for each request. If `true`, cache will not be used.
         */
        'Network.setCacheDisabled': {
            paramsType: [Protocol.Network.SetCacheDisabledRequest];
            returnType: void;
        };
        /**
         * Sets a cookie with the given cookie data; may overwrite equivalent cookies if they exist.
         */
        'Network.setCookie': {
            paramsType: [Protocol.Network.SetCookieRequest];
            returnType: Protocol.Network.SetCookieResponse;
        };
        /**
         * Sets given cookies.
         */
        'Network.setCookies': {
            paramsType: [Protocol.Network.SetCookiesRequest];
            returnType: void;
        };
        /**
         * For testing.
         */
        'Network.setDataSizeLimitsForTest': {
            paramsType: [Protocol.Network.SetDataSizeLimitsForTestRequest];
            returnType: void;
        };
        /**
         * Specifies whether to always send extra HTTP headers with the requests from this page.
         */
        'Network.setExtraHTTPHeaders': {
            paramsType: [Protocol.Network.SetExtraHTTPHeadersRequest];
            returnType: void;
        };
        /**
         * Specifies whether to attach a page script stack id in requests
         */
        'Network.setAttachDebugStack': {
            paramsType: [Protocol.Network.SetAttachDebugStackRequest];
            returnType: void;
        };
        /**
         * Sets the requests to intercept that match the provided patterns and optionally resource types.
         * Deprecated, please use Fetch.enable instead.
         */
        'Network.setRequestInterception': {
            paramsType: [Protocol.Network.SetRequestInterceptionRequest];
            returnType: void;
        };
        /**
         * Allows overriding user agent with the given string.
         */
        'Network.setUserAgentOverride': {
            paramsType: [Protocol.Network.SetUserAgentOverrideRequest];
            returnType: void;
        };
        /**
         * Returns information about the COEP/COOP isolation status.
         */
        'Network.getSecurityIsolationStatus': {
            paramsType: [Protocol.Network.GetSecurityIsolationStatusRequest?];
            returnType: Protocol.Network.GetSecurityIsolationStatusResponse;
        };
        /**
         * Fetches the resource and returns the content.
         */
        'Network.loadNetworkResource': {
            paramsType: [Protocol.Network.LoadNetworkResourceRequest];
            returnType: Protocol.Network.LoadNetworkResourceResponse;
        };
        /**
         * Disables domain notifications.
         */
        'Overlay.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables domain notifications.
         */
        'Overlay.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * For testing.
         */
        'Overlay.getHighlightObjectForTest': {
            paramsType: [Protocol.Overlay.GetHighlightObjectForTestRequest];
            returnType: Protocol.Overlay.GetHighlightObjectForTestResponse;
        };
        /**
         * For Persistent Grid testing.
         */
        'Overlay.getGridHighlightObjectsForTest': {
            paramsType: [Protocol.Overlay.GetGridHighlightObjectsForTestRequest];
            returnType: Protocol.Overlay.GetGridHighlightObjectsForTestResponse;
        };
        /**
         * For Source Order Viewer testing.
         */
        'Overlay.getSourceOrderHighlightObjectForTest': {
            paramsType: [Protocol.Overlay.GetSourceOrderHighlightObjectForTestRequest];
            returnType: Protocol.Overlay.GetSourceOrderHighlightObjectForTestResponse;
        };
        /**
         * Hides any highlight.
         */
        'Overlay.hideHighlight': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Highlights owner element of the frame with given id.
         */
        'Overlay.highlightFrame': {
            paramsType: [Protocol.Overlay.HighlightFrameRequest];
            returnType: void;
        };
        /**
         * Highlights DOM node with given id or with the given JavaScript object wrapper. Either nodeId or
         * objectId must be specified.
         */
        'Overlay.highlightNode': {
            paramsType: [Protocol.Overlay.HighlightNodeRequest];
            returnType: void;
        };
        /**
         * Highlights given quad. Coordinates are absolute with respect to the main frame viewport.
         */
        'Overlay.highlightQuad': {
            paramsType: [Protocol.Overlay.HighlightQuadRequest];
            returnType: void;
        };
        /**
         * Highlights given rectangle. Coordinates are absolute with respect to the main frame viewport.
         */
        'Overlay.highlightRect': {
            paramsType: [Protocol.Overlay.HighlightRectRequest];
            returnType: void;
        };
        /**
         * Highlights the source order of the children of the DOM node with given id or with the given
         * JavaScript object wrapper. Either nodeId or objectId must be specified.
         */
        'Overlay.highlightSourceOrder': {
            paramsType: [Protocol.Overlay.HighlightSourceOrderRequest];
            returnType: void;
        };
        /**
         * Enters the 'inspect' mode. In this mode, elements that user is hovering over are highlighted.
         * Backend then generates 'inspectNodeRequested' event upon element selection.
         */
        'Overlay.setInspectMode': {
            paramsType: [Protocol.Overlay.SetInspectModeRequest];
            returnType: void;
        };
        /**
         * Highlights owner element of all frames detected to be ads.
         */
        'Overlay.setShowAdHighlights': {
            paramsType: [Protocol.Overlay.SetShowAdHighlightsRequest];
            returnType: void;
        };
        'Overlay.setPausedInDebuggerMessage': {
            paramsType: [Protocol.Overlay.SetPausedInDebuggerMessageRequest?];
            returnType: void;
        };
        /**
         * Requests that backend shows debug borders on layers
         */
        'Overlay.setShowDebugBorders': {
            paramsType: [Protocol.Overlay.SetShowDebugBordersRequest];
            returnType: void;
        };
        /**
         * Requests that backend shows the FPS counter
         */
        'Overlay.setShowFPSCounter': {
            paramsType: [Protocol.Overlay.SetShowFPSCounterRequest];
            returnType: void;
        };
        /**
         * Highlight multiple elements with the CSS Grid overlay.
         */
        'Overlay.setShowGridOverlays': {
            paramsType: [Protocol.Overlay.SetShowGridOverlaysRequest];
            returnType: void;
        };
        'Overlay.setShowFlexOverlays': {
            paramsType: [Protocol.Overlay.SetShowFlexOverlaysRequest];
            returnType: void;
        };
        /**
         * Requests that backend shows paint rectangles
         */
        'Overlay.setShowPaintRects': {
            paramsType: [Protocol.Overlay.SetShowPaintRectsRequest];
            returnType: void;
        };
        /**
         * Requests that backend shows layout shift regions
         */
        'Overlay.setShowLayoutShiftRegions': {
            paramsType: [Protocol.Overlay.SetShowLayoutShiftRegionsRequest];
            returnType: void;
        };
        /**
         * Requests that backend shows scroll bottleneck rects
         */
        'Overlay.setShowScrollBottleneckRects': {
            paramsType: [Protocol.Overlay.SetShowScrollBottleneckRectsRequest];
            returnType: void;
        };
        /**
         * Requests that backend shows hit-test borders on layers
         */
        'Overlay.setShowHitTestBorders': {
            paramsType: [Protocol.Overlay.SetShowHitTestBordersRequest];
            returnType: void;
        };
        /**
         * Request that backend shows an overlay with web vital metrics.
         */
        'Overlay.setShowWebVitals': {
            paramsType: [Protocol.Overlay.SetShowWebVitalsRequest];
            returnType: void;
        };
        /**
         * Paints viewport size upon main frame resize.
         */
        'Overlay.setShowViewportSizeOnResize': {
            paramsType: [Protocol.Overlay.SetShowViewportSizeOnResizeRequest];
            returnType: void;
        };
        /**
         * Add a dual screen device hinge
         */
        'Overlay.setShowHinge': {
            paramsType: [Protocol.Overlay.SetShowHingeRequest?];
            returnType: void;
        };
        /**
         * Deprecated, please use addScriptToEvaluateOnNewDocument instead.
         */
        'Page.addScriptToEvaluateOnLoad': {
            paramsType: [Protocol.Page.AddScriptToEvaluateOnLoadRequest];
            returnType: Protocol.Page.AddScriptToEvaluateOnLoadResponse;
        };
        /**
         * Evaluates given script in every frame upon creation (before loading frame's scripts).
         */
        'Page.addScriptToEvaluateOnNewDocument': {
            paramsType: [Protocol.Page.AddScriptToEvaluateOnNewDocumentRequest];
            returnType: Protocol.Page.AddScriptToEvaluateOnNewDocumentResponse;
        };
        /**
         * Brings page to front (activates tab).
         */
        'Page.bringToFront': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Capture page screenshot.
         */
        'Page.captureScreenshot': {
            paramsType: [Protocol.Page.CaptureScreenshotRequest?];
            returnType: Protocol.Page.CaptureScreenshotResponse;
        };
        /**
         * Returns a snapshot of the page as a string. For MHTML format, the serialization includes
         * iframes, shadow DOM, external resources, and element-inline styles.
         */
        'Page.captureSnapshot': {
            paramsType: [Protocol.Page.CaptureSnapshotRequest?];
            returnType: Protocol.Page.CaptureSnapshotResponse;
        };
        /**
         * Clears the overriden device metrics.
         */
        'Page.clearDeviceMetricsOverride': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Clears the overridden Device Orientation.
         */
        'Page.clearDeviceOrientationOverride': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Clears the overriden Geolocation Position and Error.
         */
        'Page.clearGeolocationOverride': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Creates an isolated world for the given frame.
         */
        'Page.createIsolatedWorld': {
            paramsType: [Protocol.Page.CreateIsolatedWorldRequest];
            returnType: Protocol.Page.CreateIsolatedWorldResponse;
        };
        /**
         * Deletes browser cookie with given name, domain and path.
         */
        'Page.deleteCookie': {
            paramsType: [Protocol.Page.DeleteCookieRequest];
            returnType: void;
        };
        /**
         * Disables page domain notifications.
         */
        'Page.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables page domain notifications.
         */
        'Page.enable': {
            paramsType: [];
            returnType: void;
        };
        'Page.getAppManifest': {
            paramsType: [];
            returnType: Protocol.Page.GetAppManifestResponse;
        };
        'Page.getInstallabilityErrors': {
            paramsType: [];
            returnType: Protocol.Page.GetInstallabilityErrorsResponse;
        };
        'Page.getManifestIcons': {
            paramsType: [];
            returnType: Protocol.Page.GetManifestIconsResponse;
        };
        /**
         * Returns all browser cookies. Depending on the backend support, will return detailed cookie
         * information in the `cookies` field.
         */
        'Page.getCookies': {
            paramsType: [];
            returnType: Protocol.Page.GetCookiesResponse;
        };
        /**
         * Returns present frame tree structure.
         */
        'Page.getFrameTree': {
            paramsType: [];
            returnType: Protocol.Page.GetFrameTreeResponse;
        };
        /**
         * Returns metrics relating to the layouting of the page, such as viewport bounds/scale.
         */
        'Page.getLayoutMetrics': {
            paramsType: [];
            returnType: Protocol.Page.GetLayoutMetricsResponse;
        };
        /**
         * Returns navigation history for the current page.
         */
        'Page.getNavigationHistory': {
            paramsType: [];
            returnType: Protocol.Page.GetNavigationHistoryResponse;
        };
        /**
         * Resets navigation history for the current page.
         */
        'Page.resetNavigationHistory': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Returns content of the given resource.
         */
        'Page.getResourceContent': {
            paramsType: [Protocol.Page.GetResourceContentRequest];
            returnType: Protocol.Page.GetResourceContentResponse;
        };
        /**
         * Returns present frame / resource tree structure.
         */
        'Page.getResourceTree': {
            paramsType: [];
            returnType: Protocol.Page.GetResourceTreeResponse;
        };
        /**
         * Accepts or dismisses a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload).
         */
        'Page.handleJavaScriptDialog': {
            paramsType: [Protocol.Page.HandleJavaScriptDialogRequest];
            returnType: void;
        };
        /**
         * Navigates current page to the given URL.
         */
        'Page.navigate': {
            paramsType: [Protocol.Page.NavigateRequest];
            returnType: Protocol.Page.NavigateResponse;
        };
        /**
         * Navigates current page to the given history entry.
         */
        'Page.navigateToHistoryEntry': {
            paramsType: [Protocol.Page.NavigateToHistoryEntryRequest];
            returnType: void;
        };
        /**
         * Print page as PDF.
         */
        'Page.printToPDF': {
            paramsType: [Protocol.Page.PrintToPDFRequest?];
            returnType: Protocol.Page.PrintToPDFResponse;
        };
        /**
         * Reloads given page optionally ignoring the cache.
         */
        'Page.reload': {
            paramsType: [Protocol.Page.ReloadRequest?];
            returnType: void;
        };
        /**
         * Deprecated, please use removeScriptToEvaluateOnNewDocument instead.
         */
        'Page.removeScriptToEvaluateOnLoad': {
            paramsType: [Protocol.Page.RemoveScriptToEvaluateOnLoadRequest];
            returnType: void;
        };
        /**
         * Removes given script from the list.
         */
        'Page.removeScriptToEvaluateOnNewDocument': {
            paramsType: [Protocol.Page.RemoveScriptToEvaluateOnNewDocumentRequest];
            returnType: void;
        };
        /**
         * Acknowledges that a screencast frame has been received by the frontend.
         */
        'Page.screencastFrameAck': {
            paramsType: [Protocol.Page.ScreencastFrameAckRequest];
            returnType: void;
        };
        /**
         * Searches for given string in resource content.
         */
        'Page.searchInResource': {
            paramsType: [Protocol.Page.SearchInResourceRequest];
            returnType: Protocol.Page.SearchInResourceResponse;
        };
        /**
         * Enable Chrome's experimental ad filter on all sites.
         */
        'Page.setAdBlockingEnabled': {
            paramsType: [Protocol.Page.SetAdBlockingEnabledRequest];
            returnType: void;
        };
        /**
         * Enable page Content Security Policy by-passing.
         */
        'Page.setBypassCSP': {
            paramsType: [Protocol.Page.SetBypassCSPRequest];
            returnType: void;
        };
        /**
         * Get Permissions Policy state on given frame.
         */
        'Page.getPermissionsPolicyState': {
            paramsType: [Protocol.Page.GetPermissionsPolicyStateRequest];
            returnType: Protocol.Page.GetPermissionsPolicyStateResponse;
        };
        /**
         * Overrides the values of device screen dimensions (window.screen.width, window.screen.height,
         * window.innerWidth, window.innerHeight, and "device-width"/"device-height"-related CSS media
         * query results).
         */
        'Page.setDeviceMetricsOverride': {
            paramsType: [Protocol.Page.SetDeviceMetricsOverrideRequest];
            returnType: void;
        };
        /**
         * Overrides the Device Orientation.
         */
        'Page.setDeviceOrientationOverride': {
            paramsType: [Protocol.Page.SetDeviceOrientationOverrideRequest];
            returnType: void;
        };
        /**
         * Set generic font families.
         */
        'Page.setFontFamilies': {
            paramsType: [Protocol.Page.SetFontFamiliesRequest];
            returnType: void;
        };
        /**
         * Set default font sizes.
         */
        'Page.setFontSizes': {
            paramsType: [Protocol.Page.SetFontSizesRequest];
            returnType: void;
        };
        /**
         * Sets given markup as the document's HTML.
         */
        'Page.setDocumentContent': {
            paramsType: [Protocol.Page.SetDocumentContentRequest];
            returnType: void;
        };
        /**
         * Set the behavior when downloading a file.
         */
        'Page.setDownloadBehavior': {
            paramsType: [Protocol.Page.SetDownloadBehaviorRequest];
            returnType: void;
        };
        /**
         * Overrides the Geolocation Position or Error. Omitting any of the parameters emulates position
         * unavailable.
         */
        'Page.setGeolocationOverride': {
            paramsType: [Protocol.Page.SetGeolocationOverrideRequest?];
            returnType: void;
        };
        /**
         * Controls whether page will emit lifecycle events.
         */
        'Page.setLifecycleEventsEnabled': {
            paramsType: [Protocol.Page.SetLifecycleEventsEnabledRequest];
            returnType: void;
        };
        /**
         * Toggles mouse event-based touch event emulation.
         */
        'Page.setTouchEmulationEnabled': {
            paramsType: [Protocol.Page.SetTouchEmulationEnabledRequest];
            returnType: void;
        };
        /**
         * Starts sending each frame using the `screencastFrame` event.
         */
        'Page.startScreencast': {
            paramsType: [Protocol.Page.StartScreencastRequest?];
            returnType: void;
        };
        /**
         * Force the page stop all navigations and pending resource fetches.
         */
        'Page.stopLoading': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Crashes renderer on the IO thread, generates minidumps.
         */
        'Page.crash': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Tries to close page, running its beforeunload hooks, if any.
         */
        'Page.close': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Tries to update the web lifecycle state of the page.
         * It will transition the page to the given state according to:
         * https://github.com/WICG/web-lifecycle/
         */
        'Page.setWebLifecycleState': {
            paramsType: [Protocol.Page.SetWebLifecycleStateRequest];
            returnType: void;
        };
        /**
         * Stops sending each frame in the `screencastFrame`.
         */
        'Page.stopScreencast': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Forces compilation cache to be generated for every subresource script.
         */
        'Page.setProduceCompilationCache': {
            paramsType: [Protocol.Page.SetProduceCompilationCacheRequest];
            returnType: void;
        };
        /**
         * Seeds compilation cache for given url. Compilation cache does not survive
         * cross-process navigation.
         */
        'Page.addCompilationCache': {
            paramsType: [Protocol.Page.AddCompilationCacheRequest];
            returnType: void;
        };
        /**
         * Clears seeded compilation cache.
         */
        'Page.clearCompilationCache': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Generates a report for testing.
         */
        'Page.generateTestReport': {
            paramsType: [Protocol.Page.GenerateTestReportRequest];
            returnType: void;
        };
        /**
         * Pauses page execution. Can be resumed using generic Runtime.runIfWaitingForDebugger.
         */
        'Page.waitForDebugger': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Intercept file chooser requests and transfer control to protocol clients.
         * When file chooser interception is enabled, native file chooser dialog is not shown.
         * Instead, a protocol event `Page.fileChooserOpened` is emitted.
         */
        'Page.setInterceptFileChooserDialog': {
            paramsType: [Protocol.Page.SetInterceptFileChooserDialogRequest];
            returnType: void;
        };
        /**
         * Disable collecting and reporting metrics.
         */
        'Performance.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enable collecting and reporting metrics.
         */
        'Performance.enable': {
            paramsType: [Protocol.Performance.EnableRequest?];
            returnType: void;
        };
        /**
         * Sets time domain to use for collecting and reporting duration metrics.
         * Note that this must be called before enabling metrics collection. Calling
         * this method while metrics collection is enabled returns an error.
         */
        'Performance.setTimeDomain': {
            paramsType: [Protocol.Performance.SetTimeDomainRequest];
            returnType: void;
        };
        /**
         * Retrieve current values of run-time metrics.
         */
        'Performance.getMetrics': {
            paramsType: [];
            returnType: Protocol.Performance.GetMetricsResponse;
        };
        /**
         * Previously buffered events would be reported before method returns.
         * See also: timelineEventAdded
         */
        'PerformanceTimeline.enable': {
            paramsType: [Protocol.PerformanceTimeline.EnableRequest];
            returnType: void;
        };
        /**
         * Disables tracking security state changes.
         */
        'Security.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables tracking security state changes.
         */
        'Security.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enable/disable whether all certificate errors should be ignored.
         */
        'Security.setIgnoreCertificateErrors': {
            paramsType: [Protocol.Security.SetIgnoreCertificateErrorsRequest];
            returnType: void;
        };
        /**
         * Handles a certificate error that fired a certificateError event.
         */
        'Security.handleCertificateError': {
            paramsType: [Protocol.Security.HandleCertificateErrorRequest];
            returnType: void;
        };
        /**
         * Enable/disable overriding certificate errors. If enabled, all certificate error events need to
         * be handled by the DevTools client and should be answered with `handleCertificateError` commands.
         */
        'Security.setOverrideCertificateErrors': {
            paramsType: [Protocol.Security.SetOverrideCertificateErrorsRequest];
            returnType: void;
        };
        'ServiceWorker.deliverPushMessage': {
            paramsType: [Protocol.ServiceWorker.DeliverPushMessageRequest];
            returnType: void;
        };
        'ServiceWorker.disable': {
            paramsType: [];
            returnType: void;
        };
        'ServiceWorker.dispatchSyncEvent': {
            paramsType: [Protocol.ServiceWorker.DispatchSyncEventRequest];
            returnType: void;
        };
        'ServiceWorker.dispatchPeriodicSyncEvent': {
            paramsType: [Protocol.ServiceWorker.DispatchPeriodicSyncEventRequest];
            returnType: void;
        };
        'ServiceWorker.enable': {
            paramsType: [];
            returnType: void;
        };
        'ServiceWorker.inspectWorker': {
            paramsType: [Protocol.ServiceWorker.InspectWorkerRequest];
            returnType: void;
        };
        'ServiceWorker.setForceUpdateOnPageLoad': {
            paramsType: [Protocol.ServiceWorker.SetForceUpdateOnPageLoadRequest];
            returnType: void;
        };
        'ServiceWorker.skipWaiting': {
            paramsType: [Protocol.ServiceWorker.SkipWaitingRequest];
            returnType: void;
        };
        'ServiceWorker.startWorker': {
            paramsType: [Protocol.ServiceWorker.StartWorkerRequest];
            returnType: void;
        };
        'ServiceWorker.stopAllWorkers': {
            paramsType: [];
            returnType: void;
        };
        'ServiceWorker.stopWorker': {
            paramsType: [Protocol.ServiceWorker.StopWorkerRequest];
            returnType: void;
        };
        'ServiceWorker.unregister': {
            paramsType: [Protocol.ServiceWorker.UnregisterRequest];
            returnType: void;
        };
        'ServiceWorker.updateRegistration': {
            paramsType: [Protocol.ServiceWorker.UpdateRegistrationRequest];
            returnType: void;
        };
        /**
         * Clears storage for origin.
         */
        'Storage.clearDataForOrigin': {
            paramsType: [Protocol.Storage.ClearDataForOriginRequest];
            returnType: void;
        };
        /**
         * Returns all browser cookies.
         */
        'Storage.getCookies': {
            paramsType: [Protocol.Storage.GetCookiesRequest?];
            returnType: Protocol.Storage.GetCookiesResponse;
        };
        /**
         * Sets given cookies.
         */
        'Storage.setCookies': {
            paramsType: [Protocol.Storage.SetCookiesRequest];
            returnType: void;
        };
        /**
         * Clears cookies.
         */
        'Storage.clearCookies': {
            paramsType: [Protocol.Storage.ClearCookiesRequest?];
            returnType: void;
        };
        /**
         * Returns usage and quota in bytes.
         */
        'Storage.getUsageAndQuota': {
            paramsType: [Protocol.Storage.GetUsageAndQuotaRequest];
            returnType: Protocol.Storage.GetUsageAndQuotaResponse;
        };
        /**
         * Override quota for the specified origin
         */
        'Storage.overrideQuotaForOrigin': {
            paramsType: [Protocol.Storage.OverrideQuotaForOriginRequest];
            returnType: void;
        };
        /**
         * Registers origin to be notified when an update occurs to its cache storage list.
         */
        'Storage.trackCacheStorageForOrigin': {
            paramsType: [Protocol.Storage.TrackCacheStorageForOriginRequest];
            returnType: void;
        };
        /**
         * Registers origin to be notified when an update occurs to its IndexedDB.
         */
        'Storage.trackIndexedDBForOrigin': {
            paramsType: [Protocol.Storage.TrackIndexedDBForOriginRequest];
            returnType: void;
        };
        /**
         * Unregisters origin from receiving notifications for cache storage.
         */
        'Storage.untrackCacheStorageForOrigin': {
            paramsType: [Protocol.Storage.UntrackCacheStorageForOriginRequest];
            returnType: void;
        };
        /**
         * Unregisters origin from receiving notifications for IndexedDB.
         */
        'Storage.untrackIndexedDBForOrigin': {
            paramsType: [Protocol.Storage.UntrackIndexedDBForOriginRequest];
            returnType: void;
        };
        /**
         * Returns the number of stored Trust Tokens per issuer for the
         * current browsing context.
         */
        'Storage.getTrustTokens': {
            paramsType: [];
            returnType: Protocol.Storage.GetTrustTokensResponse;
        };
        /**
         * Returns information about the system.
         */
        'SystemInfo.getInfo': {
            paramsType: [];
            returnType: Protocol.SystemInfo.GetInfoResponse;
        };
        /**
         * Returns information about all running processes.
         */
        'SystemInfo.getProcessInfo': {
            paramsType: [];
            returnType: Protocol.SystemInfo.GetProcessInfoResponse;
        };
        /**
         * Activates (focuses) the target.
         */
        'Target.activateTarget': {
            paramsType: [Protocol.Target.ActivateTargetRequest];
            returnType: void;
        };
        /**
         * Attaches to the target with given id.
         */
        'Target.attachToTarget': {
            paramsType: [Protocol.Target.AttachToTargetRequest];
            returnType: Protocol.Target.AttachToTargetResponse;
        };
        /**
         * Attaches to the browser target, only uses flat sessionId mode.
         */
        'Target.attachToBrowserTarget': {
            paramsType: [];
            returnType: Protocol.Target.AttachToBrowserTargetResponse;
        };
        /**
         * Closes the target. If the target is a page that gets closed too.
         */
        'Target.closeTarget': {
            paramsType: [Protocol.Target.CloseTargetRequest];
            returnType: Protocol.Target.CloseTargetResponse;
        };
        /**
         * Inject object to the target's main frame that provides a communication
         * channel with browser target.
         * 
         * Injected object will be available as `window[bindingName]`.
         * 
         * The object has the follwing API:
         * - `binding.send(json)` - a method to send messages over the remote debugging protocol
         * - `binding.onmessage = json => handleMessage(json)` - a callback that will be called for the protocol notifications and command responses.
         */
        'Target.exposeDevToolsProtocol': {
            paramsType: [Protocol.Target.ExposeDevToolsProtocolRequest];
            returnType: void;
        };
        /**
         * Creates a new empty BrowserContext. Similar to an incognito profile but you can have more than
         * one.
         */
        'Target.createBrowserContext': {
            paramsType: [Protocol.Target.CreateBrowserContextRequest?];
            returnType: Protocol.Target.CreateBrowserContextResponse;
        };
        /**
         * Returns all browser contexts created with `Target.createBrowserContext` method.
         */
        'Target.getBrowserContexts': {
            paramsType: [];
            returnType: Protocol.Target.GetBrowserContextsResponse;
        };
        /**
         * Creates a new page.
         */
        'Target.createTarget': {
            paramsType: [Protocol.Target.CreateTargetRequest];
            returnType: Protocol.Target.CreateTargetResponse;
        };
        /**
         * Detaches session with given id.
         */
        'Target.detachFromTarget': {
            paramsType: [Protocol.Target.DetachFromTargetRequest?];
            returnType: void;
        };
        /**
         * Deletes a BrowserContext. All the belonging pages will be closed without calling their
         * beforeunload hooks.
         */
        'Target.disposeBrowserContext': {
            paramsType: [Protocol.Target.DisposeBrowserContextRequest];
            returnType: void;
        };
        /**
         * Returns information about a target.
         */
        'Target.getTargetInfo': {
            paramsType: [Protocol.Target.GetTargetInfoRequest?];
            returnType: Protocol.Target.GetTargetInfoResponse;
        };
        /**
         * Retrieves a list of available targets.
         */
        'Target.getTargets': {
            paramsType: [];
            returnType: Protocol.Target.GetTargetsResponse;
        };
        /**
         * Sends protocol message over session with given id.
         * Consider using flat mode instead; see commands attachToTarget, setAutoAttach,
         * and crbug.com/991325.
         */
        'Target.sendMessageToTarget': {
            paramsType: [Protocol.Target.SendMessageToTargetRequest];
            returnType: void;
        };
        /**
         * Controls whether to automatically attach to new targets which are considered to be related to
         * this one. When turned on, attaches to all existing related targets as well. When turned off,
         * automatically detaches from all currently attached targets.
         */
        'Target.setAutoAttach': {
            paramsType: [Protocol.Target.SetAutoAttachRequest];
            returnType: void;
        };
        /**
         * Controls whether to discover available targets and notify via
         * `targetCreated/targetInfoChanged/targetDestroyed` events.
         */
        'Target.setDiscoverTargets': {
            paramsType: [Protocol.Target.SetDiscoverTargetsRequest];
            returnType: void;
        };
        /**
         * Enables target discovery for the specified locations, when `setDiscoverTargets` was set to
         * `true`.
         */
        'Target.setRemoteLocations': {
            paramsType: [Protocol.Target.SetRemoteLocationsRequest];
            returnType: void;
        };
        /**
         * Request browser port binding.
         */
        'Tethering.bind': {
            paramsType: [Protocol.Tethering.BindRequest];
            returnType: void;
        };
        /**
         * Request browser port unbinding.
         */
        'Tethering.unbind': {
            paramsType: [Protocol.Tethering.UnbindRequest];
            returnType: void;
        };
        /**
         * Stop trace events collection.
         */
        'Tracing.end': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Gets supported tracing categories.
         */
        'Tracing.getCategories': {
            paramsType: [];
            returnType: Protocol.Tracing.GetCategoriesResponse;
        };
        /**
         * Record a clock sync marker in the trace.
         */
        'Tracing.recordClockSyncMarker': {
            paramsType: [Protocol.Tracing.RecordClockSyncMarkerRequest];
            returnType: void;
        };
        /**
         * Request a global memory dump.
         */
        'Tracing.requestMemoryDump': {
            paramsType: [Protocol.Tracing.RequestMemoryDumpRequest?];
            returnType: Protocol.Tracing.RequestMemoryDumpResponse;
        };
        /**
         * Start trace events collection.
         */
        'Tracing.start': {
            paramsType: [Protocol.Tracing.StartRequest?];
            returnType: void;
        };
        /**
         * Disables the fetch domain.
         */
        'Fetch.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Enables issuing of requestPaused events. A request will be paused until client
         * calls one of failRequest, fulfillRequest or continueRequest/continueWithAuth.
         */
        'Fetch.enable': {
            paramsType: [Protocol.Fetch.EnableRequest?];
            returnType: void;
        };
        /**
         * Causes the request to fail with specified reason.
         */
        'Fetch.failRequest': {
            paramsType: [Protocol.Fetch.FailRequestRequest];
            returnType: void;
        };
        /**
         * Provides response to the request.
         */
        'Fetch.fulfillRequest': {
            paramsType: [Protocol.Fetch.FulfillRequestRequest];
            returnType: void;
        };
        /**
         * Continues the request, optionally modifying some of its parameters.
         */
        'Fetch.continueRequest': {
            paramsType: [Protocol.Fetch.ContinueRequestRequest];
            returnType: void;
        };
        /**
         * Continues a request supplying authChallengeResponse following authRequired event.
         */
        'Fetch.continueWithAuth': {
            paramsType: [Protocol.Fetch.ContinueWithAuthRequest];
            returnType: void;
        };
        /**
         * Causes the body of the response to be received from the server and
         * returned as a single string. May only be issued for a request that
         * is paused in the Response stage and is mutually exclusive with
         * takeResponseBodyForInterceptionAsStream. Calling other methods that
         * affect the request or disabling fetch domain before body is received
         * results in an undefined behavior.
         */
        'Fetch.getResponseBody': {
            paramsType: [Protocol.Fetch.GetResponseBodyRequest];
            returnType: Protocol.Fetch.GetResponseBodyResponse;
        };
        /**
         * Returns a handle to the stream representing the response body.
         * The request must be paused in the HeadersReceived stage.
         * Note that after this command the request can't be continued
         * as is -- client either needs to cancel it or to provide the
         * response body.
         * The stream only supports sequential read, IO.read will fail if the position
         * is specified.
         * This method is mutually exclusive with getResponseBody.
         * Calling other methods that affect the request or disabling fetch
         * domain before body is received results in an undefined behavior.
         */
        'Fetch.takeResponseBodyAsStream': {
            paramsType: [Protocol.Fetch.TakeResponseBodyAsStreamRequest];
            returnType: Protocol.Fetch.TakeResponseBodyAsStreamResponse;
        };
        /**
         * Enables the WebAudio domain and starts sending context lifetime events.
         */
        'WebAudio.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Disables the WebAudio domain.
         */
        'WebAudio.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Fetch the realtime data from the registered contexts.
         */
        'WebAudio.getRealtimeData': {
            paramsType: [Protocol.WebAudio.GetRealtimeDataRequest];
            returnType: Protocol.WebAudio.GetRealtimeDataResponse;
        };
        /**
         * Enable the WebAuthn domain and start intercepting credential storage and
         * retrieval with a virtual authenticator.
         */
        'WebAuthn.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Disable the WebAuthn domain.
         */
        'WebAuthn.disable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Creates and adds a virtual authenticator.
         */
        'WebAuthn.addVirtualAuthenticator': {
            paramsType: [Protocol.WebAuthn.AddVirtualAuthenticatorRequest];
            returnType: Protocol.WebAuthn.AddVirtualAuthenticatorResponse;
        };
        /**
         * Removes the given authenticator.
         */
        'WebAuthn.removeVirtualAuthenticator': {
            paramsType: [Protocol.WebAuthn.RemoveVirtualAuthenticatorRequest];
            returnType: void;
        };
        /**
         * Adds the credential to the specified authenticator.
         */
        'WebAuthn.addCredential': {
            paramsType: [Protocol.WebAuthn.AddCredentialRequest];
            returnType: void;
        };
        /**
         * Returns a single credential stored in the given virtual authenticator that
         * matches the credential ID.
         */
        'WebAuthn.getCredential': {
            paramsType: [Protocol.WebAuthn.GetCredentialRequest];
            returnType: Protocol.WebAuthn.GetCredentialResponse;
        };
        /**
         * Returns all the credentials stored in the given virtual authenticator.
         */
        'WebAuthn.getCredentials': {
            paramsType: [Protocol.WebAuthn.GetCredentialsRequest];
            returnType: Protocol.WebAuthn.GetCredentialsResponse;
        };
        /**
         * Removes a credential from the authenticator.
         */
        'WebAuthn.removeCredential': {
            paramsType: [Protocol.WebAuthn.RemoveCredentialRequest];
            returnType: void;
        };
        /**
         * Clears all the credentials from the specified device.
         */
        'WebAuthn.clearCredentials': {
            paramsType: [Protocol.WebAuthn.ClearCredentialsRequest];
            returnType: void;
        };
        /**
         * Sets whether User Verification succeeds or fails for an authenticator.
         * The default is true.
         */
        'WebAuthn.setUserVerified': {
            paramsType: [Protocol.WebAuthn.SetUserVerifiedRequest];
            returnType: void;
        };
        /**
         * Sets whether tests of user presence will succeed immediately (if true) or fail to resolve (if false) for an authenticator.
         * The default is true.
         */
        'WebAuthn.setAutomaticPresenceSimulation': {
            paramsType: [Protocol.WebAuthn.SetAutomaticPresenceSimulationRequest];
            returnType: void;
        };
        /**
         * Enables the Media domain
         */
        'Media.enable': {
            paramsType: [];
            returnType: void;
        };
        /**
         * Disables the Media domain.
         */
        'Media.disable': {
            paramsType: [];
            returnType: void;
        };
    }
}

declare interface PuppeteerEventListener {
    emitter: CommonEventEmitter;
    eventName: string | symbol;
    handler: (...args: any[]) => void;
}

declare type PuppeteerLifeCycleEvent = 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';

/**
 * @public
 */
declare interface RemoteAddress {
    ip: string;
    port: number;
}

/**
 * Resource types for HTTPRequests as perceived by the rendering engine.
 *
 * @public
 */
declare type ResourceType = Lowercase<Protocol.Network.ResourceType>;

/**
 * Required response data to fulfill a request with.
 *
 * @public
 */
declare interface ResponseForRequest {
    status: number;
    headers: Record<string, string>;
    contentType: string;
    body: string | Buffer;
}

/**
 * @public
 */
declare interface ScreenshotClip {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * @public
 */
declare interface ScreenshotOptions {
    /**
     * @defaultValue 'png'
     */
    type?: 'png' | 'jpeg';
    /**
     * The file path to save the image to. The screenshot type will be inferred
     * from file extension. If path is a relative path, then it is resolved
     * relative to current working directory. If no path is provided, the image
     * won't be saved to the disk.
     */
    path?: string;
    /**
     * When true, takes a screenshot of the full page.
     * @defaultValue false
     */
    fullPage?: boolean;
    /**
     * An object which specifies the clipping region of the page.
     */
    clip?: ScreenshotClip;
    /**
     * Quality of the image, between 0-100. Not applicable to `png` images.
     */
    quality?: number;
    /**
     * Hides default white background and allows capturing screenshots with transparency.
     * @defaultValue false
     */
    omitBackground?: boolean;
    /**
     * Encoding of the image.
     * @defaultValue 'binary'
     */
    encoding?: 'base64' | 'binary';
}

/**
 * The SecurityDetails class represents the security details of a
 * response that was received over a secure connection.
 *
 * @public
 */
declare class SecurityDetails {
    private _subjectName;
    private _issuer;
    private _validFrom;
    private _validTo;
    private _protocol;
    private _sanList;
    /**
     * @internal
     */
    constructor(securityPayload: Protocol.Network.SecurityDetails);
    /**
     * @returns The name of the issuer of the certificate.
     */
    issuer(): string;
    /**
     * @returns {@link https://en.wikipedia.org/wiki/Unix_time | Unix timestamp}
     * marking the start of the certificate's validity.
     */
    validFrom(): number;
    /**
     * @returns {@link https://en.wikipedia.org/wiki/Unix_time | Unix timestamp}
     * marking the end of the certificate's validity.
     */
    validTo(): number;
    /**
     * @returns The security protocol being used, e.g. "TLS 1.2".
     */
    protocol(): string;
    /**
     * @returns The name of the subject to which the certificate was issued.
     */
    subjectName(): string;
    /**
     * @returns The list of {@link https://en.wikipedia.org/wiki/Subject_Alternative_Name | subject alternative names (SANs)} of the certificate.
     */
    subjectAlternativeNames(): string[];
}

/**
 * @public
 */
declare type Serializable = number | string | boolean | null | BigInt | JSONArray | JSONObject;

/**
 * @public
 */
declare type SerializableOrJSHandle = Serializable | JSHandle;

/**
 * Represents a Node and the properties of it that are relevant to Accessibility.
 * @public
 */
declare interface SerializedAXNode {
    /**
     * The {@link https://www.w3.org/TR/wai-aria/#usage_intro | role} of the node.
     */
    role: string;
    /**
     * A human readable name for the node.
     */
    name?: string;
    /**
     * The current value of the node.
     */
    value?: string | number;
    /**
     * An additional human readable description of the node.
     */
    description?: string;
    /**
     * Any keyboard shortcuts associated with this node.
     */
    keyshortcuts?: string;
    /**
     * A human readable alternative to the role.
     */
    roledescription?: string;
    /**
     * A description of the current value.
     */
    valuetext?: string;
    disabled?: boolean;
    expanded?: boolean;
    focused?: boolean;
    modal?: boolean;
    multiline?: boolean;
    /**
     * Whether more than one child can be selected.
     */
    multiselectable?: boolean;
    readonly?: boolean;
    required?: boolean;
    selected?: boolean;
    /**
     * Whether the checkbox is checked, or in a
     * {@link https://www.w3.org/TR/wai-aria-practices/examples/checkbox/checkbox-2/checkbox-2.html | mixed state}.
     */
    checked?: boolean | 'mixed';
    /**
     * Whether the node is checked or in a mixed state.
     */
    pressed?: boolean | 'mixed';
    /**
     * The level of a heading.
     */
    level?: number;
    valuemin?: number;
    valuemax?: number;
    autocomplete?: string;
    haspopup?: string;
    /**
     * Whether and in what way this node's value is invalid.
     */
    invalid?: string;
    orientation?: string;
    /**
     * Children of this node, if there are any.
     */
    children?: SerializedAXNode[];
}

/**
 * @public
 */
declare interface SnapshotOptions {
    /**
     * Prune uninteresting nodes from the tree.
     * @defaultValue true
     */
    interestingOnly?: boolean;
    /**
     * Root node to get the accessibility tree for
     * @defaultValue The root node of the entire page.
     */
    root?: ElementHandle;
}

/**
 * @public
 */
declare class Target {
    private _targetInfo;
    private _browserContext;
    private _sessionFactory;
    private _ignoreHTTPSErrors;
    private _defaultViewport?;
    private _pagePromise?;
    private _workerPromise?;
    /**
     * @internal
     */
    _initializedPromise: Promise<boolean>;
    /**
     * @internal
     */
    _initializedCallback: (x: boolean) => void;
    /**
     * @internal
     */
    _isClosedPromise: Promise<void>;
    /**
     * @internal
     */
    _closedCallback: () => void;
    /**
     * @internal
     */
    _isInitialized: boolean;
    /**
     * @internal
     */
    _targetId: string;
    /**
     * @internal
     */
    constructor(targetInfo: Protocol.Target.TargetInfo, browserContext: BrowserContext, sessionFactory: () => Promise<CDPSession>, ignoreHTTPSErrors: boolean, defaultViewport: Viewport | null);
    /**
     * Creates a Chrome Devtools Protocol session attached to the target.
     */
    createCDPSession(): Promise<CDPSession>;
    /**
     * If the target is not of type `"page"` or `"background_page"`, returns `null`.
     */
    page(): Promise<Page | null>;
    /**
     * If the target is not of type `"service_worker"` or `"shared_worker"`, returns `null`.
     */
    worker(): Promise<WebWorker | null>;
    url(): string;
    /**
     * Identifies what kind of target this is.
     *
     * @remarks
     *
     * See {@link https://developer.chrome.com/extensions/background_pages | docs} for more info about background pages.
     */
    type(): 'page' | 'background_page' | 'service_worker' | 'shared_worker' | 'other' | 'browser' | 'webview';
    /**
     * Get the browser the target belongs to.
     */
    browser(): Browser;
    browserContext(): BrowserContext;
    /**
     * Get the target that opened this target. Top-level targets return `null`.
     */
    opener(): Target | null;
    /**
     * @internal
     */
    _targetInfoChanged(targetInfo: Protocol.Target.TargetInfo): void;
}

/**
 * Copyright 2019 Google Inc. All rights reserved.
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
/**
 * @internal
 */
declare class TimeoutSettings {
    _defaultTimeout: number | null;
    _defaultNavigationTimeout: number | null;
    constructor();
    setDefaultTimeout(timeout: number): void;
    setDefaultNavigationTimeout(timeout: number): void;
    navigationTimeout(): number;
    timeout(): number;
}

/**
 * The Touchscreen class exposes touchscreen events.
 * @public
 */
declare class Touchscreen {
    private _client;
    private _keyboard;
    /**
     * @internal
     */
    constructor(client: CDPSession, keyboard: Keyboard);
    /**
     * Dispatches a `touchstart` and `touchend` event.
     * @param x - Horizontal position of the tap.
     * @param y - Vertical position of the tap.
     */
    tap(x: number, y: number): Promise<void>;
}

/**
 * The Tracing class exposes the tracing audit interface.
 * @remarks
 * You can use `tracing.start` and `tracing.stop` to create a trace file
 * which can be opened in Chrome DevTools or {@link https://chromedevtools.github.io/timeline-viewer/ | timeline viewer}.
 *
 * @example
 * ```js
 * await page.tracing.start({path: 'trace.json'});
 * await page.goto('https://www.google.com');
 * await page.tracing.stop();
 * ```
 *
 * @public
 */
declare class Tracing {
    _client: CDPSession;
    _recording: boolean;
    _path: string;
    /**
     * @internal
     */
    constructor(client: CDPSession);
    /**
     * Starts a trace for the current page.
     * @remarks
     * Only one trace can be active at a time per browser.
     * @param options - Optional `TracingOptions`.
     */
    start(options?: TracingOptions): Promise<void>;
    /**
     * Stops a trace started with the `start` method.
     * @returns Promise which resolves to buffer with trace data.
     */
    stop(): Promise<Buffer>;
}

/**
 * @public
 */
declare interface TracingOptions {
    path?: string;
    screenshots?: boolean;
    categories?: string[];
}

declare type UnwrapPromiseLike<T> = T extends PromiseLike<infer U> ? U : T;

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
/**
 *
 * Sets the viewport of the page.
 * @public
 */
declare interface Viewport {
    /**
     * The page width in pixels.
     */
    width: number;
    /**
     * The page height in pixels.
     */
    height: number;
    /**
     * Specify device scale factor.
     * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio | devicePixelRatio} for more info.
     * @defaultValue 1
     */
    deviceScaleFactor?: number;
    /**
     * Whether the `meta viewport` tag is taken into account.
     * @defaultValue false
     */
    isMobile?: boolean;
    /**
     * Specifies if the viewport is in landscape mode.
     * @defaultValue false
     */
    isLandscape?: boolean;
    /**
     * Specify if the viewport supports touch events.
     * @defaultValue false
     */
    hasTouch?: boolean;
}

/**
 * @public
 */
declare interface WaitForOptions {
    /**
     * Maximum wait time in milliseconds, defaults to 30 seconds, pass `0` to
     * disable the timeout.
     *
     * @remarks
     * The default value can be changed by using the
     * {@link Page.setDefaultTimeout} or {@link Page.setDefaultNavigationTimeout}
     * methods.
     */
    timeout?: number;
    waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
}

/**
 * @public
 */
declare interface WaitForSelectorOptions {
    visible?: boolean;
    hidden?: boolean;
    timeout?: number;
}

/**
 * @public
 */
export declare interface WaitForTargetOptions {
    /**
     * Maximum wait time in milliseconds. Pass `0` to disable the timeout.
     * @defaultValue 30 seconds.
     */
    timeout?: number;
}

/**
 * @internal
 */
declare class WaitTask {
    _domWorld: DOMWorld;
    _polling: string | number;
    _timeout: number;
    _predicateBody: string;
    _args: SerializableOrJSHandle[];
    _binding: PageBinding;
    _runCount: number;
    promise: Promise<JSHandle>;
    _resolve: (x: JSHandle) => void;
    _reject: (x: Error) => void;
    _timeoutTimer?: NodeJS.Timeout;
    _terminated: boolean;
    constructor(options: WaitTaskOptions);
    terminate(error: Error): void;
    rerun(): Promise<void>;
    _cleanup(): void;
}

/**
 * @internal
 */
declare interface WaitTaskOptions {
    domWorld: DOMWorld;
    predicateBody: Function | string;
    title: string;
    polling: string | number;
    timeout: number;
    binding?: PageBinding;
    args: SerializableOrJSHandle[];
}

/**
 * @public
 */
declare interface WaitTimeoutOptions {
    /**
     * Maximum wait time in milliseconds, defaults to 30 seconds, pass `0` to
     * disable the timeout.
     *
     * @remarks
     * The default value can be changed by using the
     * {@link Page.setDefaultTimeout} method.
     */
    timeout?: number;
}

/**
 * The WebWorker class represents a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API | WebWorker}.
 *
 * @remarks
 * The events `workercreated` and `workerdestroyed` are emitted on the page
 * object to signal the worker lifecycle.
 *
 * @example
 * ```js
 * page.on('workercreated', worker => console.log('Worker created: ' + worker.url()));
 * page.on('workerdestroyed', worker => console.log('Worker destroyed: ' + worker.url()));
 *
 * console.log('Current workers:');
 * for (const worker of page.workers()) {
 *   console.log('  ' + worker.url());
 * }
 * ```
 *
 * @public
 */
declare class WebWorker extends EventEmitter {
    _client: CDPSession;
    _url: string;
    _executionContextPromise: Promise<ExecutionContext>;
    _executionContextCallback: (value: ExecutionContext) => void;
    /**
     *
     * @internal
     */
    constructor(client: CDPSession, url: string, consoleAPICalled: ConsoleAPICalledCallback, exceptionThrown: ExceptionThrownCallback);
    /**
     * @returns The URL of this web worker.
     */
    url(): string;
    /**
     * Returns the ExecutionContext the WebWorker runs in
     * @returns The ExecutionContext the web worker runs in.
     */
    executionContext(): Promise<ExecutionContext>;
    /**
     * If the function passed to the `worker.evaluate` returns a Promise, then
     * `worker.evaluate` would wait for the promise to resolve and return its
     * value. If the function passed to the `worker.evaluate` returns a
     * non-serializable value, then `worker.evaluate` resolves to `undefined`.
     * DevTools Protocol also supports transferring some additional values that
     * are not serializable by `JSON`: `-0`, `NaN`, `Infinity`, `-Infinity`, and
     * bigint literals.
     * Shortcut for `await worker.executionContext()).evaluate(pageFunction, ...args)`.
     *
     * @param pageFunction - Function to be evaluated in the worker context.
     * @param args - Arguments to pass to `pageFunction`.
     * @returns Promise which resolves to the return value of `pageFunction`.
     */
    evaluate<ReturnType extends any>(pageFunction: Function | string, ...args: any[]): Promise<ReturnType>;
    /**
     * The only difference between `worker.evaluate` and `worker.evaluateHandle`
     * is that `worker.evaluateHandle` returns in-page object (JSHandle). If the
     * function passed to the `worker.evaluateHandle` returns a [Promise], then
     * `worker.evaluateHandle` would wait for the promise to resolve and return
     * its value. Shortcut for
     * `await worker.executionContext()).evaluateHandle(pageFunction, ...args)`
     *
     * @param pageFunction - Function to be evaluated in the page context.
     * @param args - Arguments to pass to `pageFunction`.
     * @returns Promise which resolves to the return value of `pageFunction`.
     */
    evaluateHandle<HandlerType extends JSHandle = JSHandle>(pageFunction: EvaluateHandleFn, ...args: SerializableOrJSHandle[]): Promise<JSHandle>;
}

/**
 *  Wraps a DOM element into an ElementHandle instance
 * @public
 **/
declare type WrapElementHandle<X> = X extends Element ? ElementHandle<X> : X;

export { }
