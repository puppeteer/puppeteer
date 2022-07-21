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

import {Protocol} from 'devtools-protocol';
import {assert} from './assert.js';
import {CDPSession} from './Connection.js';
import {DOMWorld, WaitForSelectorOptions} from './DOMWorld.js';
import {ElementHandle} from './ElementHandle.js';
import {EventEmitter} from './EventEmitter.js';
import {EVALUATION_SCRIPT_URL, ExecutionContext} from './ExecutionContext.js';
import {HTTPResponse} from './HTTPResponse.js';
import {MouseButton} from './Input.js';
import {LifecycleWatcher, PuppeteerLifeCycleEvent} from './LifecycleWatcher.js';
import {NetworkManager} from './NetworkManager.js';
import {Page} from './Page.js';
import {Target} from './Target.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {EvaluateFunc, HandleFor, NodeFor} from './types.js';
import {debugError, isErrorLike} from './util.js';

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
  FrameSwapped: Symbol('FrameManager.FrameSwapped'),
  LifecycleEvent: Symbol('FrameManager.LifecycleEvent'),
  FrameNavigatedWithinDocument: Symbol(
    'FrameManager.FrameNavigatedWithinDocument'
  ),
  ExecutionContextCreated: Symbol('FrameManager.ExecutionContextCreated'),
  ExecutionContextDestroyed: Symbol('FrameManager.ExecutionContextDestroyed'),
};

/**
 * @internal
 */
export class FrameManager extends EventEmitter {
  #page: Page;
  #networkManager: NetworkManager;
  #timeoutSettings: TimeoutSettings;
  #frames = new Map<string, Frame>();
  #contextIdToContext = new Map<string, ExecutionContext>();
  #isolatedWorlds = new Set<string>();
  #mainFrame?: Frame;
  #client: CDPSession;

  /**
   * @internal
   */
  get _timeoutSettings(): TimeoutSettings {
    return this.#timeoutSettings;
  }

  /**
   * @internal
   */
  get _client(): CDPSession {
    return this.#client;
  }

  constructor(
    client: CDPSession,
    page: Page,
    ignoreHTTPSErrors: boolean,
    timeoutSettings: TimeoutSettings
  ) {
    super();
    this.#client = client;
    this.#page = page;
    this.#networkManager = new NetworkManager(client, ignoreHTTPSErrors, this);
    this.#timeoutSettings = timeoutSettings;
    this.setupEventListeners(this.#client);
  }

  private setupEventListeners(session: CDPSession) {
    session.on('Page.frameAttached', event => {
      this.#onFrameAttached(session, event.frameId, event.parentFrameId);
    });
    session.on('Page.frameNavigated', event => {
      this.#onFrameNavigated(event.frame);
    });
    session.on('Page.navigatedWithinDocument', event => {
      this.#onFrameNavigatedWithinDocument(event.frameId, event.url);
    });
    session.on(
      'Page.frameDetached',
      (event: Protocol.Page.FrameDetachedEvent) => {
        this.#onFrameDetached(
          event.frameId,
          event.reason as Protocol.Page.FrameDetachedEventReason
        );
      }
    );
    session.on('Page.frameStartedLoading', event => {
      this.#onFrameStartedLoading(event.frameId);
    });
    session.on('Page.frameStoppedLoading', event => {
      this.#onFrameStoppedLoading(event.frameId);
    });
    session.on('Runtime.executionContextCreated', event => {
      this.#onExecutionContextCreated(event.context, session);
    });
    session.on('Runtime.executionContextDestroyed', event => {
      this.#onExecutionContextDestroyed(event.executionContextId, session);
    });
    session.on('Runtime.executionContextsCleared', () => {
      this.#onExecutionContextsCleared(session);
    });
    session.on('Page.lifecycleEvent', event => {
      this.#onLifecycleEvent(event);
    });
  }

  async initialize(client: CDPSession = this.#client): Promise<void> {
    try {
      const result = await Promise.all([
        client.send('Page.enable'),
        client.send('Page.getFrameTree'),
      ]);

      const {frameTree} = result[1];
      this.#handleFrameTree(client, frameTree);
      await Promise.all([
        client.send('Page.setLifecycleEventsEnabled', {enabled: true}),
        client.send('Runtime.enable').then(() => {
          return this._ensureIsolatedWorld(client, UTILITY_WORLD_NAME);
        }),
        // TODO: Network manager is not aware of OOP iframes yet.
        client === this.#client
          ? this.#networkManager.initialize()
          : Promise.resolve(),
      ]);
    } catch (error) {
      // The target might have been closed before the initialization finished.
      if (
        isErrorLike(error) &&
        (error.message.includes('Target closed') ||
          error.message.includes('Session closed'))
      ) {
        return;
      }

      throw error;
    }
  }

  networkManager(): NetworkManager {
    return this.#networkManager;
  }

  async navigateFrame(
    frame: Frame,
    url: string,
    options: {
      referer?: string;
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<HTTPResponse | null> {
    assertNoLegacyNavigationOptions(options);
    const {
      referer = this.#networkManager.extraHTTPHeaders()['referer'],
      waitUntil = ['load'],
      timeout = this.#timeoutSettings.navigationTimeout(),
    } = options;

    const watcher = new LifecycleWatcher(this, frame, waitUntil, timeout);
    let error = await Promise.race([
      navigate(this.#client, url, referer, frame._id),
      watcher.timeoutOrTerminationPromise(),
    ]);
    if (!error) {
      error = await Promise.race([
        watcher.timeoutOrTerminationPromise(),
        watcher.newDocumentNavigationPromise(),
        watcher.sameDocumentNavigationPromise(),
      ]);
    }
    watcher.dispose();
    if (error) {
      throw error;
    }
    return await watcher.navigationResponse();

    async function navigate(
      client: CDPSession,
      url: string,
      referrer: string | undefined,
      frameId: string
    ): Promise<Error | null> {
      try {
        const response = await client.send('Page.navigate', {
          url,
          referrer,
          frameId,
        });
        return response.errorText
          ? new Error(`${response.errorText} at ${url}`)
          : null;
      } catch (error) {
        if (isErrorLike(error)) {
          return error;
        }
        throw error;
      }
    }
  }

  async waitForFrameNavigation(
    frame: Frame,
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<HTTPResponse | null> {
    assertNoLegacyNavigationOptions(options);
    const {
      waitUntil = ['load'],
      timeout = this.#timeoutSettings.navigationTimeout(),
    } = options;
    const watcher = new LifecycleWatcher(this, frame, waitUntil, timeout);
    const error = await Promise.race([
      watcher.timeoutOrTerminationPromise(),
      watcher.sameDocumentNavigationPromise(),
      watcher.newDocumentNavigationPromise(),
    ]);
    watcher.dispose();
    if (error) {
      throw error;
    }
    return await watcher.navigationResponse();
  }

  async onAttachedToTarget(target: Target): Promise<void> {
    if (target._getTargetInfo().type !== 'iframe') {
      return;
    }

    const frame = this.#frames.get(target._getTargetInfo().targetId);
    if (frame) {
      frame._updateClient(target._session()!);
    }
    this.setupEventListeners(target._session()!);
    this.initialize(target._session());
  }

  async onDetachedFromTarget(target: Target): Promise<void> {
    const frame = this.#frames.get(target._targetId);
    if (frame && frame.isOOPFrame()) {
      // When an OOP iframe is removed from the page, it
      // will only get a Target.detachedFromTarget event.
      this.#removeFramesRecursively(frame);
    }
  }

  #onLifecycleEvent(event: Protocol.Page.LifecycleEventEvent): void {
    const frame = this.#frames.get(event.frameId);
    if (!frame) {
      return;
    }
    frame._onLifecycleEvent(event.loaderId, event.name);
    this.emit(FrameManagerEmittedEvents.LifecycleEvent, frame);
  }

  #onFrameStartedLoading(frameId: string): void {
    const frame = this.#frames.get(frameId);
    if (!frame) {
      return;
    }
    frame._onLoadingStarted();
  }

  #onFrameStoppedLoading(frameId: string): void {
    const frame = this.#frames.get(frameId);
    if (!frame) {
      return;
    }
    frame._onLoadingStopped();
    this.emit(FrameManagerEmittedEvents.LifecycleEvent, frame);
  }

  #handleFrameTree(
    session: CDPSession,
    frameTree: Protocol.Page.FrameTree
  ): void {
    if (frameTree.frame.parentId) {
      this.#onFrameAttached(
        session,
        frameTree.frame.id,
        frameTree.frame.parentId
      );
    }
    this.#onFrameNavigated(frameTree.frame);
    if (!frameTree.childFrames) {
      return;
    }

    for (const child of frameTree.childFrames) {
      this.#handleFrameTree(session, child);
    }
  }

  page(): Page {
    return this.#page;
  }

  mainFrame(): Frame {
    assert(this.#mainFrame, 'Requesting main frame too early!');
    return this.#mainFrame;
  }

  frames(): Frame[] {
    return Array.from(this.#frames.values());
  }

  frame(frameId: string): Frame | null {
    return this.#frames.get(frameId) || null;
  }

  #onFrameAttached(
    session: CDPSession,
    frameId: string,
    parentFrameId?: string
  ): void {
    if (this.#frames.has(frameId)) {
      const frame = this.#frames.get(frameId)!;
      if (session && frame.isOOPFrame()) {
        // If an OOP iframes becomes a normal iframe again
        // it is first attached to the parent page before
        // the target is removed.
        frame._updateClient(session);
      }
      return;
    }
    assert(parentFrameId);
    const parentFrame = this.#frames.get(parentFrameId);
    assert(parentFrame, `Parent frame ${parentFrameId} not found`);
    const frame = new Frame(this, parentFrame, frameId, session);
    this.#frames.set(frame._id, frame);
    this.emit(FrameManagerEmittedEvents.FrameAttached, frame);
  }

  #onFrameNavigated(framePayload: Protocol.Page.Frame): void {
    const isMainFrame = !framePayload.parentId;
    let frame = isMainFrame
      ? this.#mainFrame
      : this.#frames.get(framePayload.id);
    assert(
      isMainFrame || frame,
      'We either navigate top level or have old version of the navigated frame'
    );

    // Detach all child frames first.
    if (frame) {
      for (const child of frame.childFrames()) {
        this.#removeFramesRecursively(child);
      }
    }

    // Update or create main frame.
    if (isMainFrame) {
      if (frame) {
        // Update frame id to retain frame identity on cross-process navigation.
        this.#frames.delete(frame._id);
        frame._id = framePayload.id;
      } else {
        // Initial main frame navigation.
        frame = new Frame(this, null, framePayload.id, this.#client);
      }
      this.#frames.set(framePayload.id, frame);
      this.#mainFrame = frame;
    }

    // Update frame payload.
    assert(frame);
    frame._navigated(framePayload);

    this.emit(FrameManagerEmittedEvents.FrameNavigated, frame);
  }

  async _ensureIsolatedWorld(session: CDPSession, name: string): Promise<void> {
    const key = `${session.id()}:${name}`;
    if (this.#isolatedWorlds.has(key)) {
      return;
    }
    this.#isolatedWorlds.add(key);

    await session.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `//# sourceURL=${EVALUATION_SCRIPT_URL}`,
      worldName: name,
    });
    // Frames might be removed before we send this.
    await Promise.all(
      this.frames()
        .filter(frame => {
          return frame._client() === session;
        })
        .map(frame => {
          return session
            .send('Page.createIsolatedWorld', {
              frameId: frame._id,
              worldName: name,
              grantUniveralAccess: true,
            })
            .catch(debugError);
        })
    );
  }

  #onFrameNavigatedWithinDocument(frameId: string, url: string): void {
    const frame = this.#frames.get(frameId);
    if (!frame) {
      return;
    }
    frame._navigatedWithinDocument(url);
    this.emit(FrameManagerEmittedEvents.FrameNavigatedWithinDocument, frame);
    this.emit(FrameManagerEmittedEvents.FrameNavigated, frame);
  }

  #onFrameDetached(
    frameId: string,
    reason: Protocol.Page.FrameDetachedEventReason
  ): void {
    const frame = this.#frames.get(frameId);
    if (reason === 'remove') {
      // Only remove the frame if the reason for the detached event is
      // an actual removement of the frame.
      // For frames that become OOP iframes, the reason would be 'swap'.
      if (frame) {
        this.#removeFramesRecursively(frame);
      }
    } else if (reason === 'swap') {
      this.emit(FrameManagerEmittedEvents.FrameSwapped, frame);
    }
  }

  #onExecutionContextCreated(
    contextPayload: Protocol.Runtime.ExecutionContextDescription,
    session: CDPSession
  ): void {
    const auxData = contextPayload.auxData as {frameId?: string} | undefined;
    const frameId = auxData && auxData.frameId;
    const frame =
      typeof frameId === 'string' ? this.#frames.get(frameId) : undefined;
    let world: DOMWorld | undefined;
    if (frame) {
      // Only care about execution contexts created for the current session.
      if (frame._client() !== session) {
        return;
      }

      if (contextPayload.auxData && !!contextPayload.auxData['isDefault']) {
        world = frame._mainWorld;
      } else if (
        contextPayload.name === UTILITY_WORLD_NAME &&
        !frame._secondaryWorld._hasContext()
      ) {
        // In case of multiple sessions to the same target, there's a race between
        // connections so we might end up creating multiple isolated worlds.
        // We can use either.
        world = frame._secondaryWorld;
      }
    }
    const context = new ExecutionContext(
      frame?._client() || this.#client,
      contextPayload,
      world
    );
    if (world) {
      world._setContext(context);
    }
    const key = `${session.id()}:${contextPayload.id}`;
    this.#contextIdToContext.set(key, context);
  }

  #onExecutionContextDestroyed(
    executionContextId: number,
    session: CDPSession
  ): void {
    const key = `${session.id()}:${executionContextId}`;
    const context = this.#contextIdToContext.get(key);
    if (!context) {
      return;
    }
    this.#contextIdToContext.delete(key);
    if (context._world) {
      context._world._setContext(null);
    }
  }

  #onExecutionContextsCleared(session: CDPSession): void {
    for (const [key, context] of this.#contextIdToContext.entries()) {
      // Make sure to only clear execution contexts that belong
      // to the current session.
      if (context._client !== session) {
        continue;
      }
      if (context._world) {
        context._world._setContext(null);
      }
      this.#contextIdToContext.delete(key);
    }
  }

  executionContextById(
    contextId: number,
    session: CDPSession = this.#client
  ): ExecutionContext {
    const key = `${session.id()}:${contextId}`;
    const context = this.#contextIdToContext.get(key);
    assert(context, 'INTERNAL ERROR: missing context with id = ' + contextId);
    return context;
  }

  #removeFramesRecursively(frame: Frame): void {
    for (const child of frame.childFrames()) {
      this.#removeFramesRecursively(child);
    }
    frame._detach();
    this.#frames.delete(frame._id);
    this.emit(FrameManagerEmittedEvents.FrameDetached, frame);
  }
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
 * ```ts
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
 * ```ts
 * const frame = page.frames().find(frame => frame.name() === 'myframe');
 * const text = await frame.$eval('.selector', element => element.textContent);
 * console.log(text);
 * ```
 *
 * @public
 */
export class Frame {
  #parentFrame: Frame | null;
  #url = '';
  #detached = false;
  #client!: CDPSession;

  /**
   * @internal
   */
  _frameManager: FrameManager;
  /**
   * @internal
   */
  _id: string;
  /**
   * @internal
   */
  _loaderId = '';
  /**
   * @internal
   */
  _name?: string;
  /**
   * @internal
   */
  _hasStartedLoading = false;
  /**
   * @internal
   */
  _lifecycleEvents = new Set<string>();
  /**
   * @internal
   */
  _mainWorld!: DOMWorld;
  /**
   * @internal
   */
  _secondaryWorld!: DOMWorld;
  /**
   * @internal
   */
  _childFrames: Set<Frame>;

  /**
   * @internal
   */
  constructor(
    frameManager: FrameManager,
    parentFrame: Frame | null,
    frameId: string,
    client: CDPSession
  ) {
    this._frameManager = frameManager;
    this.#parentFrame = parentFrame ?? null;
    this.#url = '';
    this._id = frameId;
    this.#detached = false;

    this._loaderId = '';

    this._childFrames = new Set();
    if (this.#parentFrame) {
      this.#parentFrame._childFrames.add(this);
    }

    this._updateClient(client);
  }

  /**
   * @internal
   */
  _updateClient(client: CDPSession): void {
    this.#client = client;
    this._mainWorld = new DOMWorld(
      this.#client,
      this._frameManager,
      this,
      this._frameManager._timeoutSettings
    );
    this._secondaryWorld = new DOMWorld(
      this.#client,
      this._frameManager,
      this,
      this._frameManager._timeoutSettings
    );
  }

  /**
   * @returns a page associated with the frame.
   */
  page(): Page {
    return this._frameManager.page();
  }

  /**
   * @remarks
   *
   * @returns `true` if the frame is an OOP frame, or `false` otherwise.
   */
  isOOPFrame(): boolean {
    return this.#client !== this._frameManager._client;
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
  async goto(
    url: string,
    options: {
      referer?: string;
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<HTTPResponse | null> {
    return await this._frameManager.navigateFrame(this, url, options);
  }

  /**
   * @remarks
   *
   * This resolves when the frame navigates to a new URL. It is useful for when
   * you run code which will indirectly cause the frame to navigate. Consider
   * this example:
   *
   * ```ts
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
  async waitForNavigation(
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<HTTPResponse | null> {
    return await this._frameManager.waitForFrameNavigation(this, options);
  }

  /**
   * @internal
   */
  _client(): CDPSession {
    return this.#client;
  }

  /**
   * @returns a promise that resolves to the frame's default execution context.
   */
  executionContext(): Promise<ExecutionContext> {
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
  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
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
  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this._mainWorld.evaluate(pageFunction, ...args);
  }

  /**
   * This method queries the frame for the given selector.
   *
   * @param selector - a selector to query for.
   * @returns A promise which resolves to an `ElementHandle` pointing at the
   * element, or `null` if it was not found.
   */
  async $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    return this._mainWorld.$(selector);
  }

  /**
   * This runs `document.querySelectorAll` in the frame and returns the result.
   *
   * @param selector - a selector to search for
   * @returns An array of element handles pointing to the found frame elements.
   */
  async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
    return this._mainWorld.$$(selector);
  }

  /**
   * This method evaluates the given XPath expression and returns the results.
   *
   * @param expression - the XPath expression to evaluate.
   */
  async $x(expression: string): Promise<Array<ElementHandle<Node>>> {
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
   * ```ts
   * const searchValue = await frame.$eval('#search', el => el.value);
   * ```
   *
   * @param selector - the selector to query for
   * @param pageFunction - the function to be evaluated in the frame's context
   * @param args - additional arguments to pass to `pageFunction`
   */
  async $eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [ElementHandle<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[ElementHandle<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
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
   * ```ts
   * const divsCounts = await frame.$$eval('div', divs => divs.length);
   * ```
   *
   * @param selector - the selector to query for
   * @param pageFunction - the function to be evaluated in the frame's context
   * @param args - additional arguments to pass to `pageFunction`
   */
  async $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [Array<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[Array<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this._mainWorld.$$eval(selector, pageFunction, ...args);
  }

  /**
   * @returns the full HTML contents of the frame, including the doctype.
   */
  async content(): Promise<string> {
    return this._secondaryWorld.content();
  }

  /**
   * Set the content of the frame.
   *
   * @param html - HTML markup to assign to the page.
   * @param options - options to configure how long before timing out and at
   * what point to consider the content setting successful.
   */
  async setContent(
    html: string,
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<void> {
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
  name(): string {
    return this._name || '';
  }

  /**
   * @returns the frame's URL.
   */
  url(): string {
    return this.#url;
  }

  /**
   * @returns the parent `Frame`, if any. Detached and main frames return `null`.
   */
  parentFrame(): Frame | null {
    return this.#parentFrame;
  }

  /**
   * @returns an array of child frames.
   */
  childFrames(): Frame[] {
    return Array.from(this._childFrames);
  }

  /**
   * @returns `true` if the frame has been detached, or `false` otherwise.
   */
  isDetached(): boolean {
    return this.#detached;
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
  async addScriptTag(
    options: FrameAddScriptTagOptions
  ): Promise<ElementHandle<HTMLScriptElement>> {
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
  async addStyleTag(
    options: FrameAddStyleTagOptions
  ): Promise<ElementHandle<Node>> {
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
  async click(
    selector: string,
    options: {
      delay?: number;
      button?: MouseButton;
      clickCount?: number;
    } = {}
  ): Promise<void> {
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
  async focus(selector: string): Promise<void> {
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
  async hover(selector: string): Promise<void> {
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
   * ```ts
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
  select(selector: string, ...values: string[]): Promise<string[]> {
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
  async tap(selector: string): Promise<void> {
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
   * ```ts
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
  async type(
    selector: string,
    text: string,
    options?: {delay: number}
  ): Promise<void> {
    return this._mainWorld.type(selector, text, options);
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
  waitForTimeout(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
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
   * ```ts
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
  async waitForSelector<Selector extends string>(
    selector: Selector,
    options: WaitForSelectorOptions = {}
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    const handle = await this._secondaryWorld.waitForSelector(
      selector,
      options
    );
    if (!handle) {
      return null;
    }
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
  async waitForXPath(
    xpath: string,
    options: WaitForSelectorOptions = {}
  ): Promise<ElementHandle<Node> | null> {
    const handle = await this._secondaryWorld.waitForXPath(xpath, options);
    if (!handle) {
      return null;
    }
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
   * ```ts
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
   * ```ts
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
  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    options: FrameWaitForFunctionOptions = {},
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    // TODO: Fix when NodeHandle has been added.
    return this._mainWorld.waitForFunction(
      pageFunction,
      options,
      ...args
    ) as Promise<HandleFor<Awaited<ReturnType<Func>>>>;
  }

  /**
   * @returns the frame's title.
   */
  async title(): Promise<string> {
    return this._secondaryWorld.title();
  }

  /**
   * @internal
   */
  _navigated(framePayload: Protocol.Page.Frame): void {
    this._name = framePayload.name;
    this.#url = `${framePayload.url}${framePayload.urlFragment || ''}`;
  }

  /**
   * @internal
   */
  _navigatedWithinDocument(url: string): void {
    this.#url = url;
  }

  /**
   * @internal
   */
  _onLifecycleEvent(loaderId: string, name: string): void {
    if (name === 'init') {
      this._loaderId = loaderId;
      this._lifecycleEvents.clear();
    }
    this._lifecycleEvents.add(name);
  }

  /**
   * @internal
   */
  _onLoadingStopped(): void {
    this._lifecycleEvents.add('DOMContentLoaded');
    this._lifecycleEvents.add('load');
  }

  /**
   * @internal
   */
  _onLoadingStarted(): void {
    this._hasStartedLoading = true;
  }

  /**
   * @internal
   */
  _detach(): void {
    this.#detached = true;
    this._mainWorld._detach();
    this._secondaryWorld._detach();
    if (this.#parentFrame) {
      this.#parentFrame._childFrames.delete(this);
    }
    this.#parentFrame = null;
  }
}

function assertNoLegacyNavigationOptions(options: {
  [optionName: string]: unknown;
}): void {
  assert(
    options['networkIdleTimeout'] === undefined,
    'ERROR: networkIdleTimeout option is no longer supported.'
  );
  assert(
    options['networkIdleInflight'] === undefined,
    'ERROR: networkIdleInflight option is no longer supported.'
  );
  assert(
    options['waitUntil'] !== 'networkidle',
    'ERROR: "networkidle" option is no longer supported. Use "networkidle2" instead'
  );
}
