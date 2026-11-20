/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Protocol} from 'devtools-protocol';

import type {Browser} from '../api/Browser.js';
import {type CDPSession, CDPSessionEvent} from '../api/CDPSession.js';
import {FrameEvent} from '../api/Frame.js';
import {PageEvent, type NewDocumentScriptEvaluation} from '../api/Page.js';
import type {WebWorker} from '../api/WebWorker.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {EventEmitter} from '../common/EventEmitter.js';
import type {TimeoutSettings} from '../common/TimeoutSettings.js';
import {PuppeteerURL, UTILITY_WORLD_NAME} from '../common/util.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';
import {DisposableStack, disposeSymbol} from '../util/disposable.js';
import {isErrorLike} from '../util/ErrorLike.js';

import type {Binding} from './Binding.js';
import {CdpIssue} from './CdpIssue.js';
import {CdpPreloadScript} from './CdpPreloadScript.js';
import type {CdpCDPSession} from './CdpSession.js';
import {isTargetClosedError} from './Connection.js';
import {CdpDeviceRequestPromptManager} from './DeviceRequestPrompt.js';
import {ExecutionContext} from './ExecutionContext.js';
import {CdpFrame} from './Frame.js';
import type {FrameManagerEvents} from './FrameManagerEvents.js';
import {FrameManagerEvent} from './FrameManagerEvents.js';
import {FrameTree} from './FrameTree.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';
import {NetworkManager} from './NetworkManager.js';
import type {CdpPage} from './Page.js';
import type {CdpTarget} from './Target.js';

const CHROME_EXTENSION_PREFIX = 'chrome-extension://';
/**
 * A frame manager manages the frames for a given {@link Page | page}.
 *
 * @internal
 */
export class FrameManager extends EventEmitter<FrameManagerEvents> {
  #page: CdpPage;
  #networkManager: NetworkManager;
  #timeoutSettings: TimeoutSettings;
  #isolatedWorlds = new Set<string>();
  #client: CdpCDPSession;
  #scriptsToEvaluateOnNewDocument = new Map<string, CdpPreloadScript>();
  #bindings = new Set<Binding>();

  _frameTree = new FrameTree<CdpFrame>();

  /**
   * For each session, the IDs of the frames that have received a
   * frameNavigated event on that session. The frame tree response of the
   * session is ignored for these frames because the frameNavigated event
   * usually contains the latest information.
   */
  #frameNavigatedReceived = new WeakMap<CDPSession, Set<string>>();

  #deviceRequestPromptManagerMap = new WeakMap<
    CDPSession,
    CdpDeviceRequestPromptManager
  >();

  #frameTreeHandled?: Deferred<void>;
  #logger: Logger;

  get timeoutSettings(): TimeoutSettings {
    return this.#timeoutSettings;
  }

  get networkManager(): NetworkManager {
    return this.#networkManager;
  }

  get client(): CdpCDPSession {
    return this.#client;
  }

  constructor(
    client: CdpCDPSession,
    page: CdpPage,
    timeoutSettings: TimeoutSettings,
    logger: Logger,
  ) {
    super(undefined, logger);
    this.#client = client;
    this.#page = page;
    this.#networkManager = new NetworkManager(
      this,
      page.browser().isNetworkEnabled(),
      logger,
    );
    this.#timeoutSettings = timeoutSettings;
    this.#logger = logger;
    this.setupEventListeners(this.#client);
    client.once(CDPSessionEvent.Disconnected, () => {
      void this.#onClientDisconnect(client).catch(error => {
        this.#logger?.(DEBUG_PREFIXES.error)?.(error);
      });
    });
  }

  /**
   * Called when the frame's client is disconnected. We don't know if the
   * disconnect means that the frame is removed or if it will be replaced by a
   * new frame. Therefore, we wait for a swap event.
   */
  async #onClientDisconnect(client: CdpCDPSession) {
    const mainFrame = this._frameTree.getMainFrame();
    if (!mainFrame) {
      return;
    }

    // If the disconnected client is not the current one, it means a swap
    // has already happened.
    if (this.#client !== client) {
      return;
    }

    if (!this.#page.browser().connected || this.#page.isClosed()) {
      // If the browser is not connected or the page is closed, we know
      // that activation will not happen.
      this.#removeFramesRecursively(mainFrame);
      return;
    }

    for (const child of mainFrame.childFrames()) {
      this.#removeFramesRecursively(child);
    }
    const swapped = Deferred.create<void>();
    using subscriptions = new DisposableStack();
    const frameEmitter = subscriptions.use(new EventEmitter(mainFrame));
    const pageEmitter = subscriptions.use(new EventEmitter(this.#page));

    frameEmitter.once(FrameEvent.FrameSwappedByActivation, () => {
      swapped.resolve();
    });
    pageEmitter.once(PageEvent.Close, () => {
      swapped.reject(new Error('Page closed'));
    });

    try {
      await swapped.valueOrThrow();
    } catch {
      this.#removeFramesRecursively(mainFrame);
    }
  }

  /**
   * When the main frame is replaced by another main frame,
   * we maintain the main frame object identity while updating
   * its frame tree and ID.
   */
  async swapFrameTree(client: CdpCDPSession): Promise<void> {
    this.#client = client;
    const frame = this._frameTree.getMainFrame();
    if (frame) {
      this.#navigatedFrames(client).add(this.#client.target()._targetId);
      this._frameTree.removeFrame(frame);
      frame.updateId(this.#client.target()._targetId);
      this._frameTree.addFrame(frame);
      frame.updateClient(client);
    }
    this.setupEventListeners(client);
    client.once(CDPSessionEvent.Disconnected, () => {
      void this.#onClientDisconnect(client).catch(error => {
        this.#logger?.(DEBUG_PREFIXES.error)?.(error);
      });
    });
    await this.initialize(client, frame);
    await this.#networkManager.addClient(client);
    if (frame) {
      frame.emit(FrameEvent.FrameSwappedByActivation, undefined);
    }
  }

  async registerSpeculativeSession(client: CdpCDPSession): Promise<void> {
    await this.#networkManager.addClient(client);
  }

  private setupEventListeners(session: CDPSession) {
    session.on('Page.frameAttached', async event => {
      await this.#frameTreeHandled?.valueOrThrow();
      this.#onFrameAttached(session, event.frameId, event.parentFrameId);
    });
    session.on('Page.frameNavigated', async event => {
      this.#navigatedFrames(session).add(event.frame.id);
      await this.#frameTreeHandled?.valueOrThrow();
      void this.#onFrameNavigated(session, event.frame, event.type);
    });
    session.on('Page.navigatedWithinDocument', async event => {
      await this.#frameTreeHandled?.valueOrThrow();
      this.#onFrameNavigatedWithinDocument(session, event.frameId, event.url);
    });
    session.on(
      'Page.frameDetached',
      async (event: Protocol.Page.FrameDetachedEvent) => {
        await this.#frameTreeHandled?.valueOrThrow();
        this.#onFrameDetached(
          session,
          event.frameId,
          event.reason as Protocol.Page.FrameDetachedEventReason,
        );
      },
    );
    session.on('Page.frameStartedLoading', async event => {
      await this.#frameTreeHandled?.valueOrThrow();
      this.#onFrameStartedLoading(session, event.frameId);
    });
    session.on('Page.frameStoppedLoading', async event => {
      await this.#frameTreeHandled?.valueOrThrow();
      this.#onFrameStoppedLoading(session, event.frameId);
    });
    session.on('Runtime.executionContextCreated', async event => {
      await this.#frameTreeHandled?.valueOrThrow();
      this.#onExecutionContextCreated(event.context, session);
    });
    session.on('Page.lifecycleEvent', async event => {
      await this.#frameTreeHandled?.valueOrThrow();
      this.#onLifecycleEvent(session, event);
    });
    session.on('Audits.issueAdded', event => {
      this.#page.emit(PageEvent.Issue, new CdpIssue(event.issue));
    });
  }

  #navigatedFrames(session: CDPSession): Set<string> {
    let frameIds = this.#frameNavigatedReceived.get(session);
    if (!frameIds) {
      frameIds = new Set();
      this.#frameNavigatedReceived.set(session, frameIds);
    }
    return frameIds;
  }

  /**
   * Returns the session of the iframe target that has the frame as its root
   * frame, if the target manager reported such a target.
   */
  #targetSession(frameId: string): CDPSession | undefined {
    return this.#client
      .target()
      ._targetManager()
      .getFrameTarget(frameId)
      ?._session();
  }

  /**
   * Returns the session that the frame belongs to: the session of the
   * nearest iframe target in the ancestor chain, or the session of the page.
   * Only the target manager defines the targets, the events of a session do
   * not change the result.
   */
  #sessionOf(frame: CdpFrame): CDPSession {
    let current: CdpFrame | null = frame;
    while (current) {
      if (!current._parentId) {
        return this.#client;
      }
      const session = this.#targetSession(current._id);
      if (session) {
        return session;
      }
      current = this.frame(current._parentId);
    }
    // A part of the ancestor chain is not known yet.
    return frame.client;
  }

  #belongsTo(frame: CdpFrame, session: CDPSession): boolean {
    return this.#sessionOf(frame) === session;
  }

  /**
   * Returns the frame if its events are expected on the given session.
   */
  #frameOf(session: CDPSession, frameId: string): CdpFrame | null {
    const frame = this.frame(frameId);
    if (!frame || !this.#belongsTo(frame, session)) {
      return null;
    }
    return frame;
  }

  /**
   * Sets the client of the frame and of the descendants that do not have a
   * target of their own.
   */
  #updateClients(frame: CdpFrame): void {
    frame.updateClient(this.#sessionOf(frame));
    for (const child of frame.childFrames()) {
      if (!this.#targetSession(child._id)) {
        this.#updateClients(child);
      }
    }
  }

  async initialize(client: CDPSession, frame?: CdpFrame | null): Promise<void> {
    try {
      this.#frameTreeHandled?.resolve();
      this.#frameTreeHandled = Deferred.create();
      // We need to schedule all these commands while the target is paused,
      // therefore, it needs to happen synchronously. At the same time we
      // should not start processing execution context and frame events before
      // we received the initial information about the frame tree.
      await Promise.all([
        this.#networkManager.addClient(client),
        client.send('Page.enable'),
        client.send('Page.getFrameTree').then(({frameTree}) => {
          this.#handleFrameTree(client, frameTree);
          this.#frameTreeHandled?.resolve();
        }),
        client.send('Page.setLifecycleEventsEnabled', {enabled: true}),
        client.send('Runtime.enable').then(() => {
          return this.#createIsolatedWorld(client, UTILITY_WORLD_NAME);
        }),
        ...(frame
          ? Array.from(this.#scriptsToEvaluateOnNewDocument.values())
          : []
        ).map(script => {
          return frame?.addPreloadScript(script);
        }),
        ...(frame ? Array.from(this.#bindings.values()) : []).map(binding => {
          return frame?.addExposedFunctionBinding(binding);
        }),
        this.#page.browser().isIssuesEnabled() && client.send('Audits.enable'),
      ]);
    } catch (error) {
      this.#frameTreeHandled?.resolve();
      // The target might have been closed before the initialization finished.
      if (isErrorLike(error) && isTargetClosedError(error)) {
        return;
      }

      throw error;
    }
  }

  page(): CdpPage {
    return this.#page;
  }

  browser(): Browser {
    return this.#page.browser();
  }

  worker(client: CDPSession): WebWorker | null {
    return this.#page.worker(client);
  }

  mainFrame(): CdpFrame {
    const mainFrame = this._frameTree.getMainFrame();
    assert(mainFrame, 'Requesting main frame too early!');
    return mainFrame;
  }

  frames(): CdpFrame[] {
    return Array.from(this._frameTree.frames());
  }

  frame(frameId: string): CdpFrame | null {
    return this._frameTree.getById(frameId) || null;
  }

  async #forEachFrame(
    action: (frame: CdpFrame) => Promise<unknown>,
  ): Promise<void> {
    await Promise.all(
      this.frames().map(async frame => {
        // The client can change while the action is in progress.
        const client = frame._client();
        try {
          await action(frame);
        } catch (error) {
          // Only an out-of-process frame has a session of its own to lose.
          if (
            client === this.#client ||
            !isErrorLike(error) ||
            !isTargetClosedError(error)
          ) {
            throw error;
          }
        }
      }),
    );
  }

  async addExposedFunctionBinding(binding: Binding): Promise<void> {
    this.#bindings.add(binding);
    await this.#forEachFrame(frame => {
      return frame.addExposedFunctionBinding(binding);
    });
  }

  async removeExposedFunctionBinding(binding: Binding): Promise<void> {
    this.#bindings.delete(binding);
    await this.#forEachFrame(frame => {
      return frame.removeExposedFunctionBinding(binding);
    });
  }

  async evaluateOnNewDocument(
    source: string,
  ): Promise<NewDocumentScriptEvaluation> {
    const {identifier} = await this.mainFrame()
      ._client()
      .send('Page.addScriptToEvaluateOnNewDocument', {
        source,
      });

    const preloadScript = new CdpPreloadScript(
      this.mainFrame(),
      identifier,
      source,
    );

    this.#scriptsToEvaluateOnNewDocument.set(identifier, preloadScript);

    await this.#forEachFrame(frame => {
      return frame.addPreloadScript(preloadScript);
    });

    return {identifier};
  }

  async removeScriptToEvaluateOnNewDocument(identifier: string): Promise<void> {
    const preloadScript = this.#scriptsToEvaluateOnNewDocument.get(identifier);
    if (!preloadScript) {
      throw new Error(
        `Script to evaluate on new document with id ${identifier} not found`,
      );
    }

    this.#scriptsToEvaluateOnNewDocument.delete(identifier);

    await Promise.all(
      this.frames().map(frame => {
        const identifier = preloadScript.getIdForFrame(frame);
        if (!identifier) {
          return;
        }
        return frame
          ._client()
          .send('Page.removeScriptToEvaluateOnNewDocument', {
            identifier,
          })
          .catch(error => {
            this.#logger?.(DEBUG_PREFIXES.error)?.(error);
          });
      }),
    );
  }

  onAttachedToTarget(target: CdpTarget): void {
    if (target._getTargetInfo().type !== 'iframe') {
      return;
    }

    const frame = this.frame(target._getTargetInfo().targetId);
    if (frame) {
      frame.updateClient(target._session()!);
    }
    this.setupEventListeners(target._session()!);
    void this.initialize(target._session()!, frame).catch(error => {
      this.#logger?.(DEBUG_PREFIXES.error)?.(error);
    });
  }

  onDetachedFromTarget(target: CdpTarget): void {
    if (target._getTargetInfo().type !== 'iframe') {
      return;
    }
    const frame = this.frame(target._targetId);
    if (frame) {
      // The frame is in the same process as its parent frame again or it is
      // about to be removed.
      //
      // If an OOP iframe becomes a normal iframe again, Chrome removes the
      // target when the navigation is ready to commit. The session of the
      // parent frame reports Page.frameAttached, Page.frameNavigated and
      // Runtime.executionContextCreated for the frame after the commit.
      // Thus, the frame must belong to the session of the parent frame
      // before these events arrive. The events that the session of the
      // parent frame reports for the frame while the target is attached are
      // not handled.
      //
      // If an OOP iframe is removed, Page.frameDetached arrives before the
      // target is gone, and the frame is not known here.
      this.#updateClients(frame);
    }
  }

  _deviceRequestPromptManager(
    client: CDPSession,
  ): CdpDeviceRequestPromptManager {
    let manager = this.#deviceRequestPromptManagerMap.get(client);
    if (manager === undefined) {
      manager = new CdpDeviceRequestPromptManager(
        client,
        this.#timeoutSettings,
      );
      this.#deviceRequestPromptManagerMap.set(client, manager);
    }
    return manager;
  }

  #onLifecycleEvent(
    session: CDPSession,
    event: Protocol.Page.LifecycleEventEvent,
  ): void {
    const frame = this.#frameOf(session, event.frameId);
    if (!frame) {
      return;
    }
    frame._onLifecycleEvent(event.loaderId, event.name);
    this.emit(FrameManagerEvent.LifecycleEvent, frame);
    frame.emit(FrameEvent.LifecycleEvent, undefined);
  }

  #onFrameStartedLoading(session: CDPSession, frameId: string): void {
    const frame = this.#frameOf(session, frameId);
    if (!frame) {
      return;
    }
    frame._onLoadingStarted();
  }

  #onFrameStoppedLoading(session: CDPSession, frameId: string): void {
    const frame = this.#frameOf(session, frameId);
    if (!frame) {
      return;
    }
    frame._onLoadingStopped();
    this.emit(FrameManagerEvent.LifecycleEvent, frame);
    frame.emit(FrameEvent.LifecycleEvent, undefined);
  }

  #handleFrameTree(
    session: CDPSession,
    frameTree: Protocol.Page.FrameTree,
  ): void {
    const parentId = this.#parentFrameId(
      session,
      frameTree.frame.id,
      frameTree.frame.parentId,
    );
    if (parentId) {
      this.#onFrameAttached(session, frameTree.frame.id, parentId);
    }
    const navigatedFrames = this.#navigatedFrames(session);
    if (!navigatedFrames.has(frameTree.frame.id)) {
      void this.#onFrameNavigated(session, frameTree.frame, 'Navigation');
    } else {
      navigatedFrames.delete(frameTree.frame.id);
    }

    if (!frameTree.childFrames) {
      return;
    }

    for (const child of frameTree.childFrames) {
      this.#handleFrameTree(session, child);
    }
  }

  /**
   * For the root frame of an iframe target, the target info provides the
   * parent frame.
   */
  #parentFrameId(
    session: CDPSession,
    frameId: string,
    parentFrameId: string | undefined,
  ): string | undefined {
    const target = this.#client
      .target()
      ._targetManager()
      .getFrameTarget(frameId);
    if (target?._session() === session) {
      return target._getTargetInfo().parentFrameId ?? parentFrameId;
    }
    return parentFrameId;
  }

  #onFrameAttached(
    session: CDPSession,
    frameId: string,
    parentFrameId: string,
  ): void {
    let frame = this.frame(frameId);
    if (frame) {
      // The session of a known frame only changes when the target manager
      // reports that the target of the frame is attached or gone. If an OOP
      // iframe becomes a normal iframe again, its target is gone before this
      // event arrives (see onDetachedFromTarget).
      return;
    }

    const parentFrame = this.frame(parentFrameId);
    const targetSession = this.#targetSession(frameId);
    if (
      targetSession !== session &&
      parentFrame &&
      !this.#belongsTo(parentFrame, session)
    ) {
      // A frame is reported on the session of its target or on the session
      // of its parent frame.
      return;
    }

    frame = new CdpFrame(
      this,
      frameId,
      parentFrameId,
      targetSession ?? session,
      this.#logger,
    );
    this._frameTree.addFrame(frame);
    this.emit(FrameManagerEvent.FrameAttached, frame);
  }

  async #onFrameNavigated(
    session: CDPSession,
    framePayload: Protocol.Page.Frame,
    navigationType: Protocol.Page.NavigationType,
  ): Promise<void> {
    const frameId = framePayload.id;

    let frame = this._frameTree.getById(frameId);
    const isMainFrame = !framePayload.parentId;

    // A frame navigation is reported on the session of the frame. A new main
    // frame is reported on the session of the page.
    if (
      frame
        ? !this.#belongsTo(frame, session)
        : isMainFrame && session !== this.#client
    ) {
      return;
    }

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
        this._frameTree.removeFrame(frame);
        frame._id = frameId;
      } else {
        // Initial main frame navigation.
        frame = new CdpFrame(
          this,
          frameId,
          undefined,
          this.#client,
          this.#logger,
        );
      }
      this._frameTree.addFrame(frame);
    }

    frame = await this._frameTree.waitForFrame(frameId);
    if (!this.#belongsTo(frame, session)) {
      return;
    }
    frame._navigated(framePayload);
    this.emit(FrameManagerEvent.FrameNavigated, frame);
    this.emit(FrameManagerEvent.FrameNavigatedNewDocument, frame);
    frame.emit(FrameEvent.FrameNavigated, navigationType);
  }

  async #createIsolatedWorld(session: CDPSession, name: string): Promise<void> {
    const key = `${session.id()}:${name}`;

    if (this.#isolatedWorlds.has(key)) {
      return;
    }

    await session.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `//# sourceURL=${PuppeteerURL.INTERNAL_URL}`,
      worldName: name,
    });

    await Promise.all(
      this.frames()
        .filter(frame => {
          return frame.client === session;
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
            .catch(error => {
              this.#logger?.(DEBUG_PREFIXES.error)?.(error);
            });
        }),
    );

    this.#isolatedWorlds.add(key);
  }

  #onFrameNavigatedWithinDocument(
    session: CDPSession,
    frameId: string,
    url: string,
  ): void {
    const frame = this.#frameOf(session, frameId);
    if (!frame) {
      return;
    }
    frame._navigatedWithinDocument(url);
    frame.emit(FrameEvent.FrameNavigatedWithinDocument, undefined);
    this.emit(FrameManagerEvent.FrameNavigated, frame);
    this.emit(FrameManagerEvent.FrameNavigatedWithinDocument, frame);
    frame.emit(FrameEvent.FrameNavigated, 'Navigation');
  }

  #onFrameDetached(
    session: CDPSession,
    frameId: string,
    reason: Protocol.Page.FrameDetachedEventReason,
  ): void {
    const frame = this.frame(frameId);
    if (!frame) {
      return;
    }
    // The detachment is reported on the session of the frame or on the
    // session of one of its ancestors.
    let ancestor: CdpFrame | null = frame;
    while (ancestor && !this.#belongsTo(ancestor, session)) {
      ancestor = ancestor.parentFrame();
    }
    if (!ancestor) {
      return;
    }
    switch (reason) {
      case 'remove':
        // Only remove the frame if the reason for the detached event is
        // an actual removement of the frame.
        // For frames that become OOP iframes, the reason would be 'swap'.
        this.#removeFramesRecursively(frame);
        break;
      case 'swap':
        this.emit(FrameManagerEvent.FrameSwapped, frame);
        frame.emit(FrameEvent.FrameSwapped, undefined);
        break;
    }
  }

  #isExtensionOrigin(origin: string) {
    return origin.startsWith(CHROME_EXTENSION_PREFIX);
  }

  #extractExtensionId(origin: string): string | null {
    if (!origin || !this.#isExtensionOrigin(origin)) {
      return null;
    }

    const pathPart = origin.substring(CHROME_EXTENSION_PREFIX.length);
    const slashIndex = pathPart.indexOf('/');

    // if there's no / it means that pathPart is now the extensionId, otherwise
    // we take everything until the first /
    return slashIndex === -1 ? pathPart : pathPart.substring(0, slashIndex);
  }

  #onExecutionContextCreated(
    contextPayload: Protocol.Runtime.ExecutionContextDescription,
    session: CDPSession,
  ): void {
    const auxData = contextPayload.auxData as {frameId?: string} | undefined;
    const origin = contextPayload.origin;
    const frameId = auxData && auxData.frameId;
    const frame = typeof frameId === 'string' ? this.frame(frameId) : undefined;
    let world: IsolatedWorld | undefined;
    if (frame) {
      // Only care about execution contexts created for the current session.
      if (frame.client !== session || !this.#belongsTo(frame, session)) {
        return;
      }
      if (contextPayload.auxData && contextPayload.auxData['isDefault']) {
        world = frame.worlds[MAIN_WORLD];
      } else if (contextPayload.name === UTILITY_WORLD_NAME) {
        // In case of multiple sessions to the same target, there's a race between
        // connections so we might end up creating multiple isolated worlds.
        // We can use either.
        world = frame.worlds[PUPPETEER_WORLD];
      } else if (this.#isExtensionOrigin(origin)) {
        const extId = this.#extractExtensionId(origin);

        if (!extId) {
          this.#logger?.(DEBUG_PREFIXES.error)?.(
            'Error while parsing extension id',
          );
          return;
        }

        if (frame.extensionWorlds[extId]) {
          world = frame.extensionWorlds[extId];
        } else {
          world = new IsolatedWorld(
            frame,
            this.timeoutSettings,
            extId,
            this.#logger,
          );
          frame.extensionWorlds[extId] = world;
          frame.registerWorldListeners(world);
          world.origin = origin;
          world.setWorldId(extId);
        }
      }
    }

    // If there is no world, the context is not meant to be handled by us.
    if (!world) {
      return;
    }
    const context = new ExecutionContext(
      frame?.client || this.#client,
      contextPayload,
      world,
      this.#logger,
    );
    world.setContext(context);
  }

  #removeFramesRecursively(frame: CdpFrame): void {
    for (const child of frame.childFrames()) {
      this.#removeFramesRecursively(child);
    }
    this._frameTree.removeFrame(frame);
    this.emit(FrameManagerEvent.FrameDetached, frame);
    frame.emit(FrameEvent.FrameDetached, frame);
    // Needs to be last to ensure events
    // sent before handlers are cleared.
    frame[disposeSymbol]();
  }
}
