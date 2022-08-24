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
import {assert} from '../util/assert.js';
import {
  createDeferredPromiseWithTimer,
  DeferredPromise,
} from '../util/DeferredPromise.js';
import {isErrorLike} from '../util/ErrorLike.js';
import {CDPSession} from './Connection.js';
import {EventEmitter} from './EventEmitter.js';
import {Frame} from './Frame.js';
import {NetworkManager} from './NetworkManager.js';
import {Page} from './Page.js';
import {Target} from './Target.js';
import {TimeoutSettings} from './TimeoutSettings.js';

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
          frame = new Frame(this, undefined, frameId, this.#client);
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

  #removeFramesRecursively(frame: Frame): void {
    for (const child of frame.childFrames()) {
      this.#removeFramesRecursively(child);
    }
    frame._detach();
    this.#frames.delete(frame._id);
    this.emit(FrameManagerEmittedEvents.FrameDetached, frame);
  }
}
