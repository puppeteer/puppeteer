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

import {CDPSessionEmittedEvents} from './Connection.js';
import {
  Frame,
  FrameManager,
  FrameManagerEmittedEvents,
} from './FrameManager.js';
import {
  addEventListener,
  createTimeoutPromise,
  noop,
  PuppeteerEventListener,
  removeEventListeners,
  TimeoutPromise,
} from './util.js';

const puppeteerToProtocolLifecycle = {
  load: 'load',
  domcontentloaded: 'DOMContentLoaded',
  networkidle0: 'networkIdle',
  networkidle2: 'networkAlmostIdle',
};

/**
 * @public
 */
export type PuppeteerLifeCycleEvent = keyof typeof puppeteerToProtocolLifecycle;

/**
 * @public
 */
export type ProtocolLifeCycleEvent =
  typeof puppeteerToProtocolLifecycle[PuppeteerLifeCycleEvent];

/**
 * @internal
 */
export class LifecycleWatcher {
  #expectedLifecycle: ProtocolLifeCycleEvent[];
  #frame: Frame;
  #timeout: TimeoutPromise;
  #eventListeners: PuppeteerEventListener[];

  #complete: () => void = noop;
  #completed = new Promise<void>(fulfill => {
    this.#complete = fulfill;
  });

  terminate: (x: Error | void) => void = noop;
  #terminated = new Promise<Error | void>(fulfill => {
    this.terminate = fulfill;
  });

  constructor(
    frameManager: FrameManager,
    frame: Frame,
    timeout: number,
    waitUntil: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[]
  ) {
    if (Array.isArray(waitUntil)) {
      waitUntil = waitUntil.slice();
    } else {
      waitUntil = [waitUntil];
    }
    this.#expectedLifecycle = waitUntil.map(value => {
      return puppeteerToProtocolLifecycle[value];
    });

    this.#frame = frame;
    this.#timeout = createTimeoutPromise(timeout);
    this.#eventListeners = [
      addEventListener(
        frameManager._client,
        CDPSessionEmittedEvents.Disconnected,
        this.#onDisconnect.bind(this)
      ),
      addEventListener(
        frameManager,
        FrameManagerEmittedEvents.FrameDetached,
        this.#onFrameDetached.bind(this)
      ),
      addEventListener(
        frameManager,
        FrameManagerEmittedEvents.LifecycleEvent,
        this.#onLifecycleEvent.bind(this)
      ),
    ];
    this.#onLifecycleEvent();
  }

  #onDisconnect(): void {
    this.terminate(
      new Error('Lifecycle watching failed because browser has disconnected!')
    );
  }

  #onFrameDetached(frame: Frame): void {
    if (this.#frame === frame) {
      this.terminate(new Error('The watched frame detached!'));
      return;
    }
    this.#onLifecycleEvent();
  }

  #onLifecycleEvent(): void {
    if (!this.#hasExpectedLifecycleStages(this.#frame)) {
      return;
    }
    this.#complete();
  }

  #hasExpectedLifecycleStages(frame: Frame): boolean {
    for (const event of this.#expectedLifecycle) {
      if (!frame._lifecycleEvents.has(event)) {
        return false;
      }
    }
    for (const child of frame.childFrames()) {
      if (
        child._hasStartedLoading &&
        !this.#hasExpectedLifecycleStages(child)
      ) {
        return false;
      }
    }
    return true;
  }

  async waitForCompletion(): Promise<void> {
    const result = await Promise.race([
      this.#completed,
      this.#timeout,
      this.#terminated,
    ]);
    removeEventListeners(this.#eventListeners);
    this.#timeout.clear();
    if (result instanceof Error) {
      throw result;
    }
  }
}
