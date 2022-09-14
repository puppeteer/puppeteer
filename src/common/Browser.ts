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

import {ChildProcess} from 'child_process';
import {Protocol} from 'devtools-protocol';
import {assert} from '../util/assert.js';
import {CDPSession, Connection, ConnectionEmittedEvents} from './Connection.js';
import {waitWithTimeout} from './util.js';
import {Page} from './Page.js';
import {Viewport} from './PuppeteerViewport.js';
import {Target} from './Target.js';
import {TaskQueue} from './TaskQueue.js';
import {TargetManager, TargetManagerEmittedEvents} from './TargetManager.js';
import {ChromeTargetManager} from './ChromeTargetManager.js';
import {FirefoxTargetManager} from './FirefoxTargetManager.js';
import * as BrowserApi from '../api/Browser.js';

/**
 * @internal
 */
export class CDPBrowser extends BrowserApi.Browser {
  /**
   * @internal
   */
  static async _create(
    product: 'firefox' | 'chrome' | undefined,
    connection: Connection,
    contextIds: string[],
    ignoreHTTPSErrors: boolean,
    defaultViewport?: Viewport | null,
    process?: ChildProcess,
    closeCallback?: BrowserApi.BrowserCloseCallback,
    targetFilterCallback?: BrowserApi.TargetFilterCallback,
    isPageTargetCallback?: BrowserApi.IsPageTargetCallback
  ): Promise<CDPBrowser> {
    const browser = new CDPBrowser(
      product,
      connection,
      contextIds,
      ignoreHTTPSErrors,
      defaultViewport,
      process,
      closeCallback,
      targetFilterCallback,
      isPageTargetCallback
    );
    await browser._attach();
    return browser;
  }
  #ignoreHTTPSErrors: boolean;
  #defaultViewport?: Viewport | null;
  #process?: ChildProcess;
  #connection: Connection;
  #closeCallback: BrowserApi.BrowserCloseCallback;
  #targetFilterCallback: BrowserApi.TargetFilterCallback;
  #isPageTargetCallback!: BrowserApi.IsPageTargetCallback;
  #defaultContext: CDPBrowserContext;
  #contexts: Map<string, CDPBrowserContext>;
  #screenshotTaskQueue: TaskQueue;
  #targetManager: TargetManager;

  /**
   * @internal
   */
  override get _targets(): Map<string, Target> {
    return this.#targetManager.getAvailableTargets();
  }

  /**
   * @internal
   */
  constructor(
    product: 'chrome' | 'firefox' | undefined,
    connection: Connection,
    contextIds: string[],
    ignoreHTTPSErrors: boolean,
    defaultViewport?: Viewport | null,
    process?: ChildProcess,
    closeCallback?: BrowserApi.BrowserCloseCallback,
    targetFilterCallback?: BrowserApi.TargetFilterCallback,
    isPageTargetCallback?: BrowserApi.IsPageTargetCallback
  ) {
    super();
    product = product || 'chrome';
    this.#ignoreHTTPSErrors = ignoreHTTPSErrors;
    this.#defaultViewport = defaultViewport;
    this.#process = process;
    this.#screenshotTaskQueue = new TaskQueue();
    this.#connection = connection;
    this.#closeCallback = closeCallback || function (): void {};
    this.#targetFilterCallback =
      targetFilterCallback ||
      ((): boolean => {
        return true;
      });
    this.#setIsPageTargetCallback(isPageTargetCallback);
    if (product === 'firefox') {
      this.#targetManager = new FirefoxTargetManager(
        connection,
        this.#createTarget,
        this.#targetFilterCallback
      );
    } else {
      this.#targetManager = new ChromeTargetManager(
        connection,
        this.#createTarget,
        this.#targetFilterCallback
      );
    }
    this.#defaultContext = new CDPBrowserContext(this.#connection, this);
    this.#contexts = new Map();
    for (const contextId of contextIds) {
      this.#contexts.set(
        contextId,
        new CDPBrowserContext(this.#connection, this, contextId)
      );
    }
  }

  #emitDisconnected = () => {
    this.emit(BrowserApi.BrowserEmittedEvents.Disconnected);
  };

  /**
   * @internal
   */
  override async _attach(): Promise<void> {
    this.#connection.on(
      ConnectionEmittedEvents.Disconnected,
      this.#emitDisconnected
    );
    this.#targetManager.on(
      TargetManagerEmittedEvents.TargetAvailable,
      this.#onAttachedToTarget
    );
    this.#targetManager.on(
      TargetManagerEmittedEvents.TargetGone,
      this.#onDetachedFromTarget
    );
    this.#targetManager.on(
      TargetManagerEmittedEvents.TargetChanged,
      this.#onTargetChanged
    );
    this.#targetManager.on(
      TargetManagerEmittedEvents.TargetDiscovered,
      this.#onTargetDiscovered
    );
    await this.#targetManager.initialize();
  }

  /**
   * @internal
   */
  override _detach(): void {
    this.#connection.off(
      ConnectionEmittedEvents.Disconnected,
      this.#emitDisconnected
    );
    this.#targetManager.off(
      TargetManagerEmittedEvents.TargetAvailable,
      this.#onAttachedToTarget
    );
    this.#targetManager.off(
      TargetManagerEmittedEvents.TargetGone,
      this.#onDetachedFromTarget
    );
    this.#targetManager.off(
      TargetManagerEmittedEvents.TargetChanged,
      this.#onTargetChanged
    );
    this.#targetManager.off(
      TargetManagerEmittedEvents.TargetDiscovered,
      this.#onTargetDiscovered
    );
  }

  /**
   * The spawned browser process. Returns `null` if the browser instance was created with
   * {@link Puppeteer.connect}.
   */
  override process(): ChildProcess | null {
    return this.#process ?? null;
  }

  /**
   * @internal
   */
  _targetManager(): TargetManager {
    return this.#targetManager;
  }

  #setIsPageTargetCallback(
    isPageTargetCallback?: BrowserApi.IsPageTargetCallback
  ): void {
    this.#isPageTargetCallback =
      isPageTargetCallback ||
      ((target: Protocol.Target.TargetInfo): boolean => {
        return (
          target.type === 'page' ||
          target.type === 'background_page' ||
          target.type === 'webview'
        );
      });
  }

  /**
   * @internal
   */
  override _getIsPageTargetCallback():
    | BrowserApi.IsPageTargetCallback
    | undefined {
    return this.#isPageTargetCallback;
  }

  /**
   * Creates a new incognito browser context. This won't share cookies/cache with other
   * browser contexts.
   *
   * @example
   *
   * ```ts
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   // Create a new incognito browser context.
   *   const context = await browser.createIncognitoBrowserContext();
   *   // Create a new page in a pristine context.
   *   const page = await context.newPage();
   *   // Do stuff
   *   await page.goto('https://example.com');
   * })();
   * ```
   */
  override async createIncognitoBrowserContext(
    options: BrowserApi.BrowserContextOptions = {}
  ): Promise<CDPBrowserContext> {
    const {proxyServer, proxyBypassList} = options;

    const {browserContextId} = await this.#connection.send(
      'Target.createBrowserContext',
      {
        proxyServer,
        proxyBypassList: proxyBypassList && proxyBypassList.join(','),
      }
    );
    const context = new CDPBrowserContext(
      this.#connection,
      this,
      browserContextId
    );
    this.#contexts.set(browserContextId, context);
    return context;
  }

  /**
   * Returns an array of all open browser contexts. In a newly created browser, this will
   * return a single instance of {@link BrowserContext}.
   */
  override browserContexts(): CDPBrowserContext[] {
    return [this.#defaultContext, ...Array.from(this.#contexts.values())];
  }

  /**
   * Returns the default browser context. The default browser context cannot be closed.
   */
  override defaultBrowserContext(): CDPBrowserContext {
    return this.#defaultContext;
  }

  /**
   * @internal
   */
  override async _disposeContext(contextId?: string): Promise<void> {
    if (!contextId) {
      return;
    }
    await this.#connection.send('Target.disposeBrowserContext', {
      browserContextId: contextId,
    });
    this.#contexts.delete(contextId);
  }

  #createTarget = (
    targetInfo: Protocol.Target.TargetInfo,
    session?: CDPSession
  ) => {
    const {browserContextId} = targetInfo;
    const context =
      browserContextId && this.#contexts.has(browserContextId)
        ? this.#contexts.get(browserContextId)
        : this.#defaultContext;

    if (!context) {
      throw new Error('Missing browser context');
    }

    return new Target(
      targetInfo,
      session,
      context,
      this.#targetManager,
      (isAutoAttachEmulated: boolean) => {
        return this.#connection._createSession(
          targetInfo,
          isAutoAttachEmulated
        );
      },
      this.#ignoreHTTPSErrors,
      this.#defaultViewport ?? null,
      this.#screenshotTaskQueue,
      this.#isPageTargetCallback
    );
  };

  #onAttachedToTarget = async (target: Target) => {
    if (await target._initializedPromise) {
      this.emit(BrowserApi.BrowserEmittedEvents.TargetCreated, target);
      target
        .browserContext()
        .emit(BrowserApi.BrowserContextEmittedEvents.TargetCreated, target);
    }
  };

  #onDetachedFromTarget = async (target: Target): Promise<void> => {
    target._initializedCallback(false);
    target._closedCallback();
    if (await target._initializedPromise) {
      this.emit(BrowserApi.BrowserEmittedEvents.TargetDestroyed, target);
      target
        .browserContext()
        .emit(BrowserApi.BrowserContextEmittedEvents.TargetDestroyed, target);
    }
  };

  #onTargetChanged = ({
    target,
    targetInfo,
  }: {
    target: Target;
    targetInfo: Protocol.Target.TargetInfo;
  }): void => {
    const previousURL = target.url();
    const wasInitialized = target._isInitialized;
    target._targetInfoChanged(targetInfo);
    if (wasInitialized && previousURL !== target.url()) {
      this.emit(BrowserApi.BrowserEmittedEvents.TargetChanged, target);
      target
        .browserContext()
        .emit(BrowserApi.BrowserContextEmittedEvents.TargetChanged, target);
    }
  };

  #onTargetDiscovered = (targetInfo: Protocol.Target.TargetInfo): void => {
    this.emit('targetdiscovered', targetInfo);
  };

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
  override wsEndpoint(): string {
    return this.#connection.url();
  }

  /**
   * Promise which resolves to a new {@link Page} object. The Page is created in
   * a default browser context.
   */
  override async newPage(): Promise<Page> {
    return this.#defaultContext.newPage();
  }

  /**
   * @internal
   */
  override async _createPageInContext(contextId?: string): Promise<Page> {
    const {targetId} = await this.#connection.send('Target.createTarget', {
      url: 'about:blank',
      browserContextId: contextId || undefined,
    });
    const target = this.#targetManager.getAvailableTargets().get(targetId);
    if (!target) {
      throw new Error(`Missing target for page (id = ${targetId})`);
    }
    const initialized = await target._initializedPromise;
    if (!initialized) {
      throw new Error(`Failed to create target for page (id = ${targetId})`);
    }
    const page = await target.page();
    if (!page) {
      throw new Error(
        `Failed to create a page for context (id = ${contextId})`
      );
    }
    return page;
  }

  /**
   * All active targets inside the Browser. In case of multiple browser contexts, returns
   * an array with all the targets in all browser contexts.
   */
  override targets(): Target[] {
    return Array.from(
      this.#targetManager.getAvailableTargets().values()
    ).filter(target => {
      return target._isInitialized;
    });
  }

  /**
   * The target associated with the browser.
   */
  override target(): Target {
    const browserTarget = this.targets().find(target => {
      return target.type() === 'browser';
    });
    if (!browserTarget) {
      throw new Error('Browser target is not found');
    }
    return browserTarget;
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
   *
   * ```ts
   * await page.evaluate(() => window.open('https://www.example.com/'));
   * const newWindowTarget = await browser.waitForTarget(
   *   target => target.url() === 'https://www.example.com/'
   * );
   * ```
   */
  override async waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options: BrowserApi.WaitForTargetOptions = {}
  ): Promise<Target> {
    const {timeout = 30000} = options;
    let resolve: (value: Target | PromiseLike<Target>) => void;
    let isResolved = false;
    const targetPromise = new Promise<Target>(x => {
      return (resolve = x);
    });
    this.on(BrowserApi.BrowserEmittedEvents.TargetCreated, check);
    this.on(BrowserApi.BrowserEmittedEvents.TargetChanged, check);
    try {
      this.targets().forEach(check);
      if (!timeout) {
        return await targetPromise;
      }
      return await waitWithTimeout(targetPromise, 'target', timeout);
    } finally {
      this.off(BrowserApi.BrowserEmittedEvents.TargetCreated, check);
      this.off(BrowserApi.BrowserEmittedEvents.TargetChanged, check);
    }

    async function check(target: Target): Promise<void> {
      if ((await predicate(target)) && !isResolved) {
        isResolved = true;
        resolve(target);
      }
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
  override async pages(): Promise<Page[]> {
    const contextPages = await Promise.all(
      this.browserContexts().map(context => {
        return context.pages();
      })
    );
    // Flatten array.
    return contextPages.reduce((acc, x) => {
      return acc.concat(x);
    }, []);
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
  override async version(): Promise<string> {
    const version = await this.#getVersion();
    return version.product;
  }

  /**
   * The browser's original user agent. Pages can override the browser user agent with
   * {@link Page.setUserAgent}.
   */
  override async userAgent(): Promise<string> {
    const version = await this.#getVersion();
    return version.userAgent;
  }

  /**
   * Closes Chromium and all of its pages (if any were opened). The {@link Browser} object
   * itself is considered to be disposed and cannot be used anymore.
   */
  override async close(): Promise<void> {
    await this.#closeCallback.call(null);
    this.disconnect();
  }

  /**
   * Disconnects Puppeteer from the browser, but leaves the Chromium process running.
   * After calling `disconnect`, the {@link Browser} object is considered disposed and
   * cannot be used anymore.
   */
  override disconnect(): void {
    this.#targetManager.dispose();
    this.#connection.dispose();
  }

  /**
   * Indicates that the browser is connected.
   */
  override isConnected(): boolean {
    return !this.#connection._closed;
  }

  #getVersion(): Promise<Protocol.Browser.GetVersionResponse> {
    return this.#connection.send('Browser.getVersion');
  }
}

/**
 * @internal
 */
export class CDPBrowserContext extends BrowserApi.BrowserContext {
  #connection: Connection;
  #browser: CDPBrowser;
  #id?: string;

  /**
   * @internal
   */
  constructor(connection: Connection, browser: CDPBrowser, contextId?: string) {
    super();
    this.#connection = connection;
    this.#browser = browser;
    this.#id = contextId;
  }

  /**
   * An array of all active targets inside the browser context.
   */
  override targets(): Target[] {
    return this.#browser.targets().filter(target => {
      return target.browserContext() === this;
    });
  }

  /**
   * This searches for a target in this specific browser context.
   *
   * @example
   * An example of finding a target for a page opened via `window.open`:
   *
   * ```ts
   * await page.evaluate(() => window.open('https://www.example.com/'));
   * const newWindowTarget = await browserContext.waitForTarget(
   *   target => target.url() === 'https://www.example.com/'
   * );
   * ```
   *
   * @param predicate - A function to be run for every target
   * @param options - An object of options. Accepts a timout,
   * which is the maximum wait time in milliseconds.
   * Pass `0` to disable the timeout. Defaults to 30 seconds.
   * @returns Promise which resolves to the first target found
   * that matches the `predicate` function.
   */
  override waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options: {timeout?: number} = {}
  ): Promise<Target> {
    return this.#browser.waitForTarget(target => {
      return target.browserContext() === this && predicate(target);
    }, options);
  }

  /**
   * An array of all pages inside the browser context.
   *
   * @returns Promise which resolves to an array of all open pages.
   * Non visible pages, such as `"background_page"`, will not be listed here.
   * You can find them using {@link Target.page | the target page}.
   */
  override async pages(): Promise<Page[]> {
    const pages = await Promise.all(
      this.targets()
        .filter(target => {
          return (
            target.type() === 'page' ||
            (target.type() === 'other' &&
              this.#browser._getIsPageTargetCallback()?.(
                target._getTargetInfo()
              ))
          );
        })
        .map(target => {
          return target.page();
        })
    );
    return pages.filter((page): page is Page => {
      return !!page;
    });
  }

  /**
   * Returns whether BrowserContext is incognito.
   * The default browser context is the only non-incognito browser context.
   *
   * @remarks
   * The default browser context cannot be closed.
   */
  override isIncognito(): boolean {
    return !!this.#id;
  }

  /**
   * @example
   *
   * ```ts
   * const context = browser.defaultBrowserContext();
   * await context.overridePermissions('https://html5demos.com', [
   *   'geolocation',
   * ]);
   * ```
   *
   * @param origin - The origin to grant permissions to, e.g. "https://example.com".
   * @param permissions - An array of permissions to grant.
   * All permissions that are not listed here will be automatically denied.
   */
  override async overridePermissions(
    origin: string,
    permissions: BrowserApi.Permission[]
  ): Promise<void> {
    const protocolPermissions = permissions.map(permission => {
      const protocolPermission =
        BrowserApi.WEB_PERMISSION_TO_PROTOCOL_PERMISSION.get(permission);
      if (!protocolPermission) {
        throw new Error('Unknown permission: ' + permission);
      }
      return protocolPermission;
    });
    await this.#connection.send('Browser.grantPermissions', {
      origin,
      browserContextId: this.#id || undefined,
      permissions: protocolPermissions,
    });
  }

  /**
   * Clears all permission overrides for the browser context.
   *
   * @example
   *
   * ```ts
   * const context = browser.defaultBrowserContext();
   * context.overridePermissions('https://example.com', ['clipboard-read']);
   * // do stuff ..
   * context.clearPermissionOverrides();
   * ```
   */
  override async clearPermissionOverrides(): Promise<void> {
    await this.#connection.send('Browser.resetPermissions', {
      browserContextId: this.#id || undefined,
    });
  }

  /**
   * Creates a new page in the browser context.
   */
  override newPage(): Promise<Page> {
    return this.#browser._createPageInContext(this.#id);
  }

  /**
   * The browser this browser context belongs to.
   */
  override browser(): CDPBrowser {
    return this.#browser;
  }

  /**
   * Closes the browser context. All the targets that belong to the browser context
   * will be closed.
   *
   * @remarks
   * Only incognito browser contexts can be closed.
   */
  override async close(): Promise<void> {
    assert(this.#id, 'Non-incognito profiles cannot be closed!');
    await this.#browser._disposeContext(this.#id);
  }
}
