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
import {ElementHandle} from './ElementHandle.js';
import {EventEmitter} from './EventEmitter.js';
import {EVALUATION_SCRIPT_URL, ExecutionContext} from './ExecutionContext.js';
import {HTTPResponse} from './HTTPResponse.js';
import {MouseButton} from './Input.js';
import {
  MAIN_WORLD,
  IsolatedWorld,
  IsolatedWorldChart,
  PUPPETEER_WORLD,
  WaitForSelectorOptions,
} from './IsolatedWorld.js';
import {LifecycleWatcher, PuppeteerLifeCycleEvent} from './LifecycleWatcher.js';
import {NetworkManager} from './NetworkManager.js';
import {Page} from './Page.js';
import {Target} from './Target.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {EvaluateFunc, HandleFor, NodeFor} from './types.js';
import {
  createDeferredPromiseWithTimer,
  debugError,
  DeferredPromise,
  isErrorLike,
} from './util.js';

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
 * A frame manager manages the frames for a given {@link Page | page}.
 *
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
   * Keeps track of OOPIF targets/frames (target ID == frame ID for OOPIFs)
   * that are being initialized.
   */
  #framesPendingTargetInit = new Map<string, DeferredPromise<void>>();
  /**
   * Keeps track of frames that are in the process of being attached in #onFrameAttached.
   */
  #framesPendingAttachment = new Map<string, DeferredPromise<void>>();

  get timeoutSettings(): TimeoutSettings {
    return this.#timeoutSettings;
  }

  get networkManager(): NetworkManager {
    return this.#networkManager;
  }

  get client(): CDPSession {
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

  async initialize(
    targetId: string,
    client: CDPSession = this.#client
  ): Promise<void> {
    try {
      if (!this.#framesPendingTargetInit.has(targetId)) {
        this.#framesPendingTargetInit.set(
          targetId,
          createDeferredPromiseWithTimer(
            `Waiting for target frame ${targetId} failed`
          )
        );
      }
      const result = await Promise.all([
        client.send('Page.enable'),
        client.send('Page.getFrameTree'),
      ]);

      const {frameTree} = result[1];
      this.#handleFrameTree(client, frameTree);
      await Promise.all([
        client.send('Page.setLifecycleEventsEnabled', {enabled: true}),
        client.send('Runtime.enable').then(() => {
          return this.#createIsolatedWorld(client, UTILITY_WORLD_NAME);
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
    } finally {
      this.#framesPendingTargetInit.get(targetId)?.resolve();
      this.#framesPendingTargetInit.delete(targetId);
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

  onAttachedToTarget(target: Target): void {
    if (target._getTargetInfo().type !== 'iframe') {
      return;
    }

    const frame = this.#frames.get(target._getTargetInfo().targetId);
    if (frame) {
      frame.updateClient(target._session()!);
    }
    this.setupEventListeners(target._session()!);
    this.initialize(target._getTargetInfo().targetId, target._session());
  }

  onDetachedFromTarget(target: Target): void {
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

  #onFrameAttached(
    session: CDPSession,
    frameId: string,
    parentFrameId: string
  ): void {
    if (this.#frames.has(frameId)) {
      const frame = this.#frames.get(frameId)!;
      if (session && frame.isOOPFrame()) {
        // If an OOP iframes becomes a normal iframe again
        // it is first attached to the parent page before
        // the target is removed.
        frame.updateClient(session);
      }
      return;
    }
    const parentFrame = this.#frames.get(parentFrameId);

    const complete = (parentFrame: Frame) => {
      assert(parentFrame, `Parent frame ${parentFrameId} not found`);
      const frame = new Frame(this, parentFrame, frameId, session);
      this.#frames.set(frame._id, frame);
      this.emit(FrameManagerEmittedEvents.FrameAttached, frame);
    };

    if (parentFrame) {
      return complete(parentFrame);
    }

    const frame = this.#framesPendingTargetInit.get(parentFrameId);
    if (frame) {
      if (!this.#framesPendingAttachment.has(frameId)) {
        this.#framesPendingAttachment.set(
          frameId,
          createDeferredPromiseWithTimer(
            `Waiting for frame ${frameId} to attach failed`
          )
        );
      }
      frame.then(() => {
        complete(this.#frames.get(parentFrameId)!);
        this.#framesPendingAttachment.get(frameId)?.resolve();
        this.#framesPendingAttachment.delete(frameId);
      });
      return;
    }

    throw new Error(`Parent frame ${parentFrameId} not found`);
  }

  #onFrameNavigated(framePayload: Protocol.Page.Frame): void {
    const frameId = framePayload.id;
    const isMainFrame = !framePayload.parentId;
    const frame = isMainFrame ? this.#mainFrame : this.#frames.get(frameId);

    const complete = (frame?: Frame) => {
      assert(
        isMainFrame || frame,
        `Missing frame isMainFrame=${isMainFrame}, frameId=${frameId}`
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
          frame._id = frameId;
        } else {
          // Initial main frame navigation.
          frame = new Frame(this, null, frameId, this.#client);
        }
        this.#frames.set(frameId, frame);
        this.#mainFrame = frame;
      }

      // Update frame payload.
      assert(frame);
      frame._navigated(framePayload);

      this.emit(FrameManagerEmittedEvents.FrameNavigated, frame);
    };
    const pendingFrame = this.#framesPendingAttachment.get(frameId);
    if (pendingFrame) {
      pendingFrame.then(() => {
        complete(isMainFrame ? this.#mainFrame : this.#frames.get(frameId));
      });
    } else {
      complete(frame);
    }
  }

  async #createIsolatedWorld(session: CDPSession, name: string): Promise<void> {
    const key = `${session.id()}:${name}`;

    if (this.#isolatedWorlds.has(key)) {
      return;
    }

    await session.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `//# sourceURL=${EVALUATION_SCRIPT_URL}`,
      worldName: name,
    });

    await Promise.all(
      this.frames()
        .filter(frame => {
          return frame._client() === session;
        })
        .map(frame => {
          // Frames might be removed before we send this, so we don't want to
          // throw an error.
          return session
            .send('Page.createIsolatedWorld', {
              frameId: frame._id,
              worldName: name,
              grantUniveralAccess: true,
            })
            .catch(debugError);
        })
    );

    this.#isolatedWorlds.add(key);
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
    let world: IsolatedWorld | undefined;
    if (frame) {
      // Only care about execution contexts created for the current session.
      if (frame._client() !== session) {
        return;
      }

      if (contextPayload.auxData && !!contextPayload.auxData['isDefault']) {
        world = frame.worlds[MAIN_WORLD];
      } else if (
        contextPayload.name === UTILITY_WORLD_NAME &&
        !frame.worlds[PUPPETEER_WORLD].hasContext()
      ) {
        // In case of multiple sessions to the same target, there's a race between
        // connections so we might end up creating multiple isolated worlds.
        // We can use either.
        world = frame.worlds[PUPPETEER_WORLD];
      }
    }
    const context = new ExecutionContext(
      frame?._client() || this.#client,
      contextPayload,
      world
    );
    if (world) {
      world.setContext(context);
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
      context._world.clearContext();
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
        context._world.clearContext();
      }
      this.#contextIdToContext.delete(key);
    }
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
 * Represents a DOM frame.
 *
 * To understand frames, you can think of frames as `<iframe>` elements. Just
 * like iframes, frames can be nested, and when JavaScript is executed in a
 * frame, the JavaScript does not effect frames inside the ambient frame the
 * JavaScript executes in.
 *
 * @example
 * At any point in time, {@link Page | pages} expose their current frame
 * tree via the {@link Page.mainFrame} and {@link Frame.childFrames} methods.
 *
 * @example
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
 *       dumpFrameTree(child, indent + '  ');
 *     }
 *   }
 * })();
 * ```
 *
 * @example
 * An example of getting text from an iframe element:
 *
 * ```ts
 * const frame = page.frames().find(frame => frame.name() === 'myframe');
 * const text = await frame.$eval('.selector', element => element.textContent);
 * console.log(text);
 * ```
 *
 * @remarks
 * Frame lifecycles are controlled by three events that are all dispatched on
 * the parent {@link Frame.page | page}:
 *
 * - {@link PageEmittedEvents.FrameAttached}
 * - {@link PageEmittedEvents.FrameNavigated}
 * - {@link PageEmittedEvents.FrameDetached}
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
  worlds!: IsolatedWorldChart;
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

    this.updateClient(client);
  }

  /**
   * @internal
   */
  updateClient(client: CDPSession): void {
    this.#client = client;
    this.worlds = {
      [MAIN_WORLD]: new IsolatedWorld(
        client,
        this._frameManager,
        this,
        this._frameManager.timeoutSettings
      ),
      [PUPPETEER_WORLD]: new IsolatedWorld(
        client,
        this._frameManager,
        this,
        this._frameManager.timeoutSettings
      ),
    };
  }

  /**
   * @returns The page associated with the frame.
   */
  page(): Page {
    return this._frameManager.page();
  }

  /**
   * @returns `true` if the frame is an out-of-process (OOP) frame. Otherwise,
   * `false`.
   */
  isOOPFrame(): boolean {
    return this.#client !== this._frameManager.client;
  }

  /**
   * Navigates a frame to the given url.
   *
   * @remarks
   * Navigation to `about:blank` or navigation to the same URL with a different
   * hash will succeed and return `null`.
   *
   * :::warning
   *
   * Headless mode doesn't support navigation to a PDF document. See the {@link
   * https://bugs.chromium.org/p/chromium/issues/detail?id=761295 | upstream
   * issue}.
   *
   * :::
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
   * @throws This method will throw an error if:
   *
   * - there's an SSL error (e.g. in case of self-signed certificates).
   * - target URL is invalid.
   * - the `timeout` is exceeded during navigation.
   * - the remote server does not respond or is unreachable.
   * - the main resource failed to load.
   *
   * This method will not throw an error when any valid HTTP status code is
   * returned by the remote server, including 404 "Not Found" and 500 "Internal
   * Server Error". The status code for such responses can be retrieved by
   * calling {@link HTTPResponse.status}.
   */
  async goto(
    url: string,
    options: {
      referer?: string;
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<HTTPResponse | null> {
    assertNoLegacyNavigationOptions(options);
    const {
      referer = this._frameManager.networkManager.extraHTTPHeaders()['referer'],
      waitUntil = ['load'],
      timeout = this._frameManager.timeoutSettings.navigationTimeout(),
    } = options;

    let ensureNewDocumentNavigation = false;
    const watcher = new LifecycleWatcher(
      this._frameManager,
      this,
      waitUntil,
      timeout
    );
    let error = await Promise.race([
      navigate(this.#client, url, referer, this._id),
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

    try {
      if (error) {
        throw error;
      }
      return await watcher.navigationResponse();
    } finally {
      watcher.dispose();
    }

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
        ensureNewDocumentNavigation = !!response.loaderId;
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

  /**
   * Waits for the frame to navigate. It is useful for when you run code which
   * will indirectly cause the frame to navigate.
   *
   * Usage of the
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/History_API | History API}
   * to change the URL is considered a navigation.
   *
   * @example
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
   * @param options - options to configure when the navigation is consided
   * finished.
   * @returns a promise that resolves when the frame navigates to a new URL.
   */
  async waitForNavigation(
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<HTTPResponse | null> {
    assertNoLegacyNavigationOptions(options);
    const {
      waitUntil = ['load'],
      timeout = this._frameManager.timeoutSettings.navigationTimeout(),
    } = options;
    const watcher = new LifecycleWatcher(
      this._frameManager,
      this,
      waitUntil,
      timeout
    );
    const error = await Promise.race([
      watcher.timeoutOrTerminationPromise(),
      watcher.sameDocumentNavigationPromise(),
      watcher.newDocumentNavigationPromise(),
    ]);
    try {
      if (error) {
        throw error;
      }
      return await watcher.navigationResponse();
    } finally {
      watcher.dispose();
    }
  }

  /**
   * @internal
   */
  _client(): CDPSession {
    return this.#client;
  }

  /**
   * @deprecated Do not use the execution context directly.
   *
   * @returns a promise that resolves to the frame's default execution context.
   */
  executionContext(): Promise<ExecutionContext> {
    return this.worlds[MAIN_WORLD].executionContext();
  }

  /**
   * Behaves identically to {@link Page.evaluateHandle} except it's run within
   * the context of this frame.
   *
   * @see {@link Page.evaluateHandle} for details.
   */
  async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return this.worlds[MAIN_WORLD].evaluateHandle(pageFunction, ...args);
  }

  /**
   * Behaves identically to {@link Page.evaluate} except it's run within the
   * the context of this frame.
   *
   * @see {@link Page.evaluate} for details.
   */
  async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.worlds[MAIN_WORLD].evaluate(pageFunction, ...args);
  }

  /**
   * Queries the frame for an element matching the given selector.
   *
   * @param selector - The selector to query for.
   * @returns A {@link ElementHandle | element handle} to the first element
   * matching the given selector. Otherwise, `null`.
   */
  async $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    return this.worlds[MAIN_WORLD].$(selector);
  }

  /**
   * Queries the frame for all elements matching the given selector.
   *
   * @param selector - The selector to query for.
   * @returns An array of {@link ElementHandle | element handles} that point to
   * elements matching the given selector.
   */
  async $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>> {
    return this.worlds[MAIN_WORLD].$$(selector);
  }

  /**
   * Runs the given function on the first element matching the given selector in
   * the frame.
   *
   * If the given function returns a promise, then this method will wait till
   * the promise resolves.
   *
   * @example
   *
   * ```ts
   * const searchValue = await frame.$eval('#search', el => el.value);
   * ```
   *
   * @param selector - The selector to query for.
   * @param pageFunction - The function to be evaluated in the frame's context.
   * The first element matching the selector will be passed to the function as
   * its first argument.
   * @param args - Additional arguments to pass to `pageFunction`.
   * @returns A promise to the result of the function.
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
    return this.worlds[MAIN_WORLD].$eval(selector, pageFunction, ...args);
  }

  /**
   * Runs the given function on an array of elements matching the given selector
   * in the frame.
   *
   * If the given function returns a promise, then this method will wait till
   * the promise resolves.
   *
   * @example
   *
   * ```js
   * const divsCounts = await frame.$$eval('div', divs => divs.length);
   * ```
   *
   * @param selector - The selector to query for.
   * @param pageFunction - The function to be evaluated in the frame's context.
   * An array of elements matching the given selector will be passed to the
   * function as its first argument.
   * @param args - Additional arguments to pass to `pageFunction`.
   * @returns A promise to the result of the function.
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
    return this.worlds[MAIN_WORLD].$$eval(selector, pageFunction, ...args);
  }

  /**
   * @deprecated Use {@link Frame.$$} with the `xpath` prefix.
   *
   * This method evaluates the given XPath expression and returns the results.
   * @param expression - the XPath expression to evaluate.
   */
  async $x(expression: string): Promise<Array<ElementHandle<Node>>> {
    return this.worlds[MAIN_WORLD].$x(expression);
  }

  /**
   * Waits for an element matching the given selector to appear in the frame.
   *
   * This method works across navigations.
   *
   * @example
   *
   * ```ts
   * const puppeteer = require('puppeteer');
   *
   * (async () => {
   *   const browser = await puppeteer.launch();
   *   const page = await browser.newPage();
   *   let currentURL;
   *   page
   *     .mainFrame()
   *     .waitForSelector('img')
   *     .then(() => console.log('First URL with image: ' + currentURL));
   *
   *   for (currentURL of [
   *     'https://example.com',
   *     'https://google.com',
   *     'https://bbc.com',
   *   ]) {
   *     await page.goto(currentURL);
   *   }
   *   await browser.close();
   * })();
   * ```
   *
   * @param selector - The selector to query and wait for.
   * @param options - Options for customizing waiting behavior.
   * @returns An element matching the given selector.
   * @throws Throws if an element matching the given selector doesn't appear.
   */
  async waitForSelector<Selector extends string>(
    selector: Selector,
    options: WaitForSelectorOptions = {}
  ): Promise<ElementHandle<NodeFor<Selector>> | null> {
    const handle = await this.worlds[PUPPETEER_WORLD].waitForSelector(
      selector,
      options
    );
    if (!handle) {
      return null;
    }
    const mainHandle = (await this.worlds[MAIN_WORLD].adoptHandle(
      handle
    )) as ElementHandle<NodeFor<Selector>>;
    await handle.dispose();
    return mainHandle;
  }

  /**
   * @deprecated Use {@link Frame.waitForSelector} with the `xpath` prefix.
   *
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
   * @param options - options to configure the visiblity of the element and how
   * long to wait before timing out.
   */
  async waitForXPath(
    xpath: string,
    options: WaitForSelectorOptions = {}
  ): Promise<ElementHandle<Node> | null> {
    if (xpath.startsWith('//')) {
      xpath = `.${xpath}`;
    }
    return this.waitForSelector(`xpath/${xpath}`, options);
  }

  /**
   * @example
   * The `waitForFunction` can be used to observe viewport size change:
   *
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
   * );
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
    return this.worlds[MAIN_WORLD].waitForFunction(
      pageFunction,
      options,
      ...args
    ) as Promise<HandleFor<Awaited<ReturnType<Func>>>>;
  }

  /**
   * @returns The full HTML contents of the frame, including the DOCTYPE.
   */
  async content(): Promise<string> {
    return this.worlds[PUPPETEER_WORLD].content();
  }

  /**
   * Set the content of the frame.
   *
   * @param html - HTML markup to assign to the page.
   * @param options - Options to configure how long before timing out and at
   * what point to consider the content setting successful.
   */
  async setContent(
    html: string,
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    } = {}
  ): Promise<void> {
    return this.worlds[PUPPETEER_WORLD].setContent(html, options);
  }

  /**
   * @returns The frame's `name` attribute as specified in the tag.
   *
   * @remarks
   * If the name is empty, it returns the `id` attribute instead.
   *
   * @remarks
   * This value is calculated once when the frame is created, and will not
   * update if the attribute is changed later.
   */
  name(): string {
    return this._name || '';
  }

  /**
   * @returns The frame's URL.
   */
  url(): string {
    return this.#url;
  }

  /**
   * @returns The parent frame, if any. Detached and main frames return `null`.
   */
  parentFrame(): Frame | null {
    return this.#parentFrame;
  }

  /**
   * @returns An array of child frames.
   */
  childFrames(): Frame[] {
    return Array.from(this._childFrames);
  }

  /**
   * @returns `true` if the frame has been detached. Otherwise, `false`.
   */
  isDetached(): boolean {
    return this.#detached;
  }

  /**
   * Adds a `<script>` tag into the page with the desired url or content.
   *
   * @param options - Options for the script.
   * @returns a promise that resolves to the added tag when the script's
   * `onload` event fires or when the script content was injected into the
   * frame.
   */
  async addScriptTag(
    options: FrameAddScriptTagOptions
  ): Promise<ElementHandle<HTMLScriptElement>> {
    return this.worlds[MAIN_WORLD].addScriptTag(options);
  }

  /**
   * Adds a `<link rel="stylesheet">` tag into the page with the desired url or
   * a `<style type="text/css">` tag with the content.
   *
   * @param options - Options for the style link.
   * @returns a promise that resolves to the added tag when the stylesheets's
   * `onload` event fires or when the CSS content was injected into the
   * frame.
   */
  async addStyleTag(
    options: FrameAddStyleTagOptions
  ): Promise<ElementHandle<HTMLStyleElement | HTMLLinkElement>> {
    return this.worlds[MAIN_WORLD].addStyleTag(options);
  }

  /**
   * Clicks the first element found that matches `selector`.
   *
   * @remarks
   * If `click()` triggers a navigation event and there's a separate
   * `page.waitForNavigation()` promise to be resolved, you may end up with a
   * race condition that yields unexpected results. The correct pattern for
   * click and wait for navigation is the following:
   *
   * ```ts
   * const [response] = await Promise.all([
   *   page.waitForNavigation(waitOptions),
   *   frame.click(selector, clickOptions),
   * ]);
   * ```
   *
   * @param selector - The selector to query for.
   */
  async click(
    selector: string,
    options: {
      delay?: number;
      button?: MouseButton;
      clickCount?: number;
    } = {}
  ): Promise<void> {
    return this.worlds[PUPPETEER_WORLD].click(selector, options);
  }

  /**
   * Focuses the first element that matches the `selector`.
   *
   * @param selector - The selector to query for.
   * @throws Throws if there's no element matching `selector`.
   */
  async focus(selector: string): Promise<void> {
    return this.worlds[PUPPETEER_WORLD].focus(selector);
  }

  /**
   * Hovers the pointer over the center of the first element that matches the
   * `selector`.
   *
   * @param selector - The selector to query for.
   * @throws Throws if there's no element matching `selector`.
   */
  async hover(selector: string): Promise<void> {
    return this.worlds[PUPPETEER_WORLD].hover(selector);
  }

  /**
   * Selects a set of value on the first `<select>` element that matches the
   * `selector`.
   *
   * @example
   *
   * ```ts
   * frame.select('select#colors', 'blue'); // single selection
   * frame.select('select#colors', 'red', 'green', 'blue'); // multiple selections
   * ```
   *
   * @param selector - The selector to query for.
   * @param values - The array of values to select. If the `<select>` has the
   * `multiple` attribute, all values are considered, otherwise only the first
   * one is taken into account.
   * @returns the list of values that were successfully selected.
   * @throws Throws if there's no `<select>` matching `selector`.
   */
  select(selector: string, ...values: string[]): Promise<string[]> {
    return this.worlds[PUPPETEER_WORLD].select(selector, ...values);
  }

  /**
   * Taps the first element that matches the `selector`.
   *
   * @param selector - The selector to query for.
   * @throws Throws if there's no element matching `selector`.
   */
  async tap(selector: string): Promise<void> {
    return this.worlds[PUPPETEER_WORLD].tap(selector);
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
   *
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
   */
  async type(
    selector: string,
    text: string,
    options?: {delay: number}
  ): Promise<void> {
    return this.worlds[PUPPETEER_WORLD].type(selector, text, options);
  }

  /**
   * @deprecated Use `new Promise(r => setTimeout(r, milliseconds));`.
   *
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
   * ```ts
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
   * @returns the frame's title.
   */
  async title(): Promise<string> {
    return this.worlds[PUPPETEER_WORLD].title();
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
    this.worlds[MAIN_WORLD]._detach();
    this.worlds[PUPPETEER_WORLD]._detach();
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
