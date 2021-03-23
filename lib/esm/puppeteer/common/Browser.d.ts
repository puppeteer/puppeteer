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
/// <reference types="node" />
import { Target } from './Target.js';
import { EventEmitter } from './EventEmitter.js';
import { Connection } from './Connection.js';
import { Page } from './Page.js';
import { ChildProcess } from 'child_process';
import { Viewport } from './PuppeteerViewport.js';
declare type BrowserCloseCallback = () => Promise<void> | void;
/**
 * @public
 */
export declare type Permission = 'geolocation' | 'midi' | 'notifications' | 'camera' | 'microphone' | 'background-sync' | 'ambient-light-sensor' | 'accelerometer' | 'gyroscope' | 'magnetometer' | 'accessibility-events' | 'clipboard-read' | 'clipboard-write' | 'payment-handler' | 'idle-detection' | 'midi-sysex';
/**
 * @public
 */
export interface WaitForTargetOptions {
    /**
     * Maximum wait time in milliseconds. Pass `0` to disable the timeout.
     * @defaultValue 30 seconds.
     */
    timeout?: number;
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
export {};
//# sourceMappingURL=Browser.d.ts.map