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

import {Page} from '../api/Page.js';
import {assert} from '../util/assert.js';
import {isErrorLike} from '../util/ErrorLike.js';

import {CDPSession, isTargetClosedError} from './Connection.js';
import {DeviceRequestPromptManager} from './DeviceRequestPrompt.js';
import {EventEmitter} from './EventEmitter.js';
import {ExecutionContext} from './ExecutionContext.js';
import {Frame} from './Frame.js';
import {Frame as CDPFrame} from './Frame.js';
import {FrameTree} from './FrameTree.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {MAIN_WORLD, PUPPETEER_WORLD} from './IsolatedWorlds.js';
import {NetworkManager} from './NetworkManager.js';
import {Target} from './Target.js';
import {TimeoutSettings} from './TimeoutSettings.js';
import {debugError, PuppeteerURL} from './util.js';

/**
 * @internal
 */
export const UTILITY_WORLD_NAME = '__puppeteer_utility_world__';

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
  #contextIdToContext = new Map<string, ExecutionContext>();
  #isolatedWorlds = new Set<string>();
  #client: CDPSession;
  /**
   * @internal
   */
  _frameTree = new FrameTree<Frame>();

  /**
   * Set of frame IDs stored to indicate if a frame has received a
   * frameNavigated event so that frame tree responses could be ignored as the
   * frameNavigated event usually contains the latest information.
   */
  #frameNavigatedReceived = new Set<string>();

  #deviceRequestPromptManagerMap = new WeakMap<
    CDPSession,
    DeviceRequestPromptManager
  >();

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
      this.#frameNavigatedReceived.add(event.frame.id);
      void this.#onFrameNavigated(event.frame);
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
          return this.#createIsolatedWorld(client, UTILITY_WORLD_NAME);
        }),
        // TODO: Network manager is not aware of OOP iframes yet.
        client === this.#client
          ? this.#networkManager.initialize()
          : Promise.resolve(),
      ]);
    } catch (error) {
      // The target might have been closed before the initialization finished.
      if (isErrorLike(error) && isTargetClosedError(error)) {
        return;
      }

      throw error;
    }
  }

  executionContextById(
    contextId: number,
    session: CDPSession = this.#client
  ): ExecutionContext {
    const context = this.getExecutionContextById(contextId, session);
    assert(context, 'INTERNAL ERROR: missing context with id = ' + contextId);
    return context;
  }

  getExecutionContextById(
    contextId: number,
    session: CDPSession = this.#client
  ): ExecutionContext | undefined {
    return this.#contextIdToContext.get(`${session.id()}:${contextId}`);
  }

  page(): Page {
    return this.#page;
  }

  mainFrame(): Frame {
    const mainFrame = this._frameTree.getMainFrame();
    assert(mainFrame, 'Requesting main frame too early!');
    return mainFrame;
  }

  frames(): Frame[] {
    return Array.from(this._frameTree.frames());
  }

  frame(frameId: string): Frame | null {
    return this._frameTree.getById(frameId) || null;
  }

  onAttachedToTarget(target: Target): void {
    if (target._getTargetInfo().type !== 'iframe') {
      return;
    }

    const frame = this.frame(target._getTargetInfo().targetId);
    if (frame) {
      frame.updateClient(target._session()!);
    }
    this.setupEventListeners(target._session()!);
    void this.initialize(target._session());
  }

  /**
   * @internal
   */
  _deviceRequestPromptManager(client: CDPSession): DeviceRequestPromptManager {
    let manager = this.#deviceRequestPromptManagerMap.get(client);
    if (manager === undefined) {
      manager = new DeviceRequestPromptManager(client, this.#timeoutSettings);
      this.#deviceRequestPromptManagerMap.set(client, manager);
    }
    return manager;
  }

  #onLifecycleEvent(event: Protocol.Page.LifecycleEventEvent): void {
    const frame = this.frame(event.frameId);
    if (!frame) {
      return;
    }
    frame._onLifecycleEvent(event.loaderId, event.name);
    this.emit(FrameManagerEmittedEvents.LifecycleEvent, frame);
  }

  #onFrameStartedLoading(frameId: string): void {
    const frame = this.frame(frameId);
    if (!frame) {
      return;
    }
    frame._onLoadingStarted();
  }

  #onFrameStoppedLoading(frameId: string): void {
    const frame = this.frame(frameId);
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
    if (!this.#frameNavigatedReceived.has(frameTree.frame.id)) {
      void this.#onFrameNavigated(frameTree.frame);
    } else {
      this.#frameNavigatedReceived.delete(frameTree.frame.id);
    }

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
    let frame = this.frame(frameId);
    if (frame) {
      if (session && frame.isOOPFrame()) {
        // If an OOP iframes becomes a normal iframe again
        // it is first attached to the parent page before
        // the target is removed.
        frame.updateClient(session);
      }
      return;
    }

    frame = new CDPFrame(this, frameId, parentFrameId, session);
    this._frameTree.addFrame(frame);
    this.emit(FrameManagerEmittedEvents.FrameAttached, frame);
  }

  async #onFrameNavigated(framePayload: Protocol.Page.Frame): Promise<void> {
    const frameId = framePayload.id;
    const isMainFrame = !framePayload.parentId;

    let frame = this._frameTree.getById(frameId);

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
        frame = new CDPFrame(this, frameId, undefined, this.#client);
      }
      this._frameTree.addFrame(frame);
    }

    frame = await this._frameTree.waitForFrame(frameId);
    frame._navigated(framePayload);
    this.emit(FrameManagerEmittedEvents.FrameNavigated, frame);
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
    const frame = this.frame(frameId);
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
    const frame = this.frame(frameId);
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
    const frame = typeof frameId === 'string' ? this.frame(frameId) : undefined;
    let world: IsolatedWorld | undefined;
    if (frame) {
      // Only care about execution contexts created for the current session.
      if (frame._client() !== session) {
        return;
      }
      if (contextPayload.auxData && contextPayload.auxData['isDefault']) {
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
    this._frameTree.removeFrame(frame);
    this.emit(FrameManagerEmittedEvents.FrameDetached, frame);
  }
}
