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
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {assert} from '../../util/assert.js';
import {EventEmitter, Handler} from '../EventEmitter.js';
import {FrameManagerEmittedEvents} from '../FrameManager.js';
import {FrameTree} from '../FrameTree.js';
import {TimeoutSettings} from '../TimeoutSettings.js';

import {Connection} from './Connection.js';
import {Context} from './Context.js';
import {Frame} from './Frame.js';
import {Page} from './Page.js';

/**
 * A frame manager manages the frames for a given {@link Page | page}.
 *
 * @internal
 */
export class FrameManager extends EventEmitter {
  #page: Page;
  #connection: Connection;
  _contextId: string;
  _frameTree = new FrameTree<Frame>();
  _timeoutSettings: TimeoutSettings;

  get client(): Connection {
    return this.#connection;
  }

  // TODO: switch string to (typeof Browser.events)[number]
  #subscribedEvents = new Map<string, Handler<any>>([
    ['browsingContext.contextCreated', this.#onFrameAttached.bind(this)],
    ['browsingContext.contextDestroyed', this.#onFrameDetached.bind(this)],
    ['browsingContext.fragmentNavigated', this.#onFrameNavigated.bind(this)],
  ]);

  constructor(
    connection: Connection,
    page: Page,
    info: Bidi.BrowsingContext.Info,
    timeoutSettings: TimeoutSettings
  ) {
    super();
    this.#connection = connection;
    this.#page = page;
    this._contextId = info.context;
    this._timeoutSettings = timeoutSettings;
    this.#handleFrameTree(info);
    for (const [event, subscriber] of this.#subscribedEvents) {
      this.#connection.on(event, subscriber);
    }
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

  #handleFrameTree(info: Bidi.BrowsingContext.Info): void {
    if (info) {
      this.#onFrameAttached(info);
    }

    if (!info.children) {
      return;
    }

    for (const child of info.children) {
      this.#handleFrameTree(child);
    }
  }

  #onFrameAttached(info: Bidi.BrowsingContext.Info): void {
    if (
      !this.frame(info.context) &&
      (this.frame(info.parent ?? '') || !this._frameTree.getMainFrame())
    ) {
      const context = new Context(this.#connection, this, info);
      this.#connection.registerContext(context);

      const frame = new Frame(this, context);
      this._frameTree.addFrame(frame);
      this.emit(FrameManagerEmittedEvents.FrameAttached, frame);
    }
  }

  async #onFrameNavigated(
    info: Bidi.BrowsingContext.NavigationInfo
  ): Promise<void> {
    const frameId = info.context;

    let frame = this._frameTree.getById(frameId);
    // Detach all child frames first.
    if (frame) {
      for (const child of frame.childFrames()) {
        this.#removeFramesRecursively(child);
      }
    }

    frame = await this._frameTree.waitForFrame(frameId);
    // frame._navigated(info);
    this.emit(FrameManagerEmittedEvents.FrameNavigated, frame);
  }

  #onFrameDetached(info: Bidi.BrowsingContext.Info): void {
    const frame = this.frame(info.context);

    if (frame) {
      this.#removeFramesRecursively(frame);
    }
  }

  #removeFramesRecursively(frame: Frame): void {
    for (const child of frame.childFrames()) {
      this.#removeFramesRecursively(child);
    }
    this.#connection.unregisterContext(frame._context);
    this._frameTree.removeFrame(frame);
    this.emit(FrameManagerEmittedEvents.FrameDetached, frame);
  }

  dispose(): void {
    this.removeAllListeners();
    for (const [event, subscriber] of this.#subscribedEvents) {
      this.#connection.off(event, subscriber);
    }
  }
}
