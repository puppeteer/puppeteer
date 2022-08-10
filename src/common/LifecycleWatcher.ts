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

import {assert} from './assert.js';
import {
  addEventListener,
  PuppeteerEventListener,
  removeEventListeners,
  DeferredPromise,
  createDeferredPromise,
} from './util.js';
import {TimeoutError} from './Errors.js';
import {
  FrameManager,
  Frame,
  FrameManagerEmittedEvents,
} from './FrameManager.js';
import {HTTPRequest} from './HTTPRequest.js';
import {HTTPResponse} from './HTTPResponse.js';
import {NetworkManagerEmittedEvents} from './NetworkManager.js';
import {CDPSessionEmittedEvents} from './Connection.js';
/**
 * @public
 */
export type PuppeteerLifeCycleEvent =
  | 'load'
  | 'domcontentloaded'
  | 'networkidle0'
  | 'networkidle2';

/**
 * @public
 */
export type ProtocolLifeCycleEvent =
  | 'load'
  | 'DOMContentLoaded'
  | 'networkIdle'
  | 'networkAlmostIdle';

const puppeteerToProtocolLifecycle = new Map<
  PuppeteerLifeCycleEvent,
  ProtocolLifeCycleEvent
>([
  ['load', 'load'],
  ['domcontentloaded', 'DOMContentLoaded'],
  ['networkidle0', 'networkIdle'],
  ['networkidle2', 'networkAlmostIdle'],
]);

const noop = (): void => {};

/**
 * @internal
 */
export class LifecycleWatcher {
  #expectedLifecycle: ProtocolLifeCycleEvent[];
  #frameManager: FrameManager;
  #frame: Frame;
  #timeout: number;
  #navigationRequest: HTTPRequest | null = null;
  #eventListeners: PuppeteerEventListener[];
  #initialLoaderId: string;

  #sameDocumentNavigationCompleteCallback: (x?: Error) => void = noop;
  #sameDocumentNavigationPromise = new Promise<Error | undefined>(fulfill => {
    this.#sameDocumentNavigationCompleteCallback = fulfill;
  });

  #lifecycleCallback: () => void = noop;
  #lifecyclePromise: Promise<void> = new Promise(fulfill => {
    this.#lifecycleCallback = fulfill;
  });

  #newDocumentNavigationCompleteCallback: (x?: Error) => void = noop;
  #newDocumentNavigationPromise: Promise<Error | undefined> = new Promise(
    fulfill => {
      this.#newDocumentNavigationCompleteCallback = fulfill;
    }
  );

  #terminationCallback: (x?: Error) => void = noop;
  #terminationPromise: Promise<Error | undefined> = new Promise(fulfill => {
    this.#terminationCallback = fulfill;
  });

  #timeoutPromise: Promise<TimeoutError | undefined>;

  #maximumTimer?: NodeJS.Timeout;
  #hasSameDocumentNavigation?: boolean;
  #swapped?: boolean;

  #navigationResponseReceived?: DeferredPromise<void>;

  constructor(
    frameManager: FrameManager,
    frame: Frame,
    waitUntil: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[],
    timeout: number
  ) {
    if (Array.isArray(waitUntil)) {
      waitUntil = waitUntil.slice();
    } else if (typeof waitUntil === 'string') {
      waitUntil = [waitUntil];
    }
    this.#initialLoaderId = frame._loaderId;
    this.#expectedLifecycle = waitUntil.map(value => {
      const protocolEvent = puppeteerToProtocolLifecycle.get(value);
      assert(protocolEvent, 'Unknown value for options.waitUntil: ' + value);
      return protocolEvent as ProtocolLifeCycleEvent;
    });

    this.#frameManager = frameManager;
    this.#frame = frame;
    this.#timeout = timeout;
    this.#eventListeners = [
      addEventListener(
        frameManager.client,
        CDPSessionEmittedEvents.Disconnected,
        this.#terminate.bind(
          this,
          new Error('Navigation failed because browser has disconnected!')
        )
      ),
      addEventListener(
        this.#frameManager,
        FrameManagerEmittedEvents.LifecycleEvent,
        this.#checkLifecycleComplete.bind(this)
      ),
      addEventListener(
        this.#frameManager,
        FrameManagerEmittedEvents.FrameNavigatedWithinDocument,
        this.#navigatedWithinDocument.bind(this)
      ),
      addEventListener(
        this.#frameManager,
        FrameManagerEmittedEvents.FrameNavigated,
        this.#navigated.bind(this)
      ),
      addEventListener(
        this.#frameManager,
        FrameManagerEmittedEvents.FrameSwapped,
        this.#frameSwapped.bind(this)
      ),
      addEventListener(
        this.#frameManager,
        FrameManagerEmittedEvents.FrameDetached,
        this.#onFrameDetached.bind(this)
      ),
      addEventListener(
        this.#frameManager.networkManager,
        NetworkManagerEmittedEvents.Request,
        this.#onRequest.bind(this)
      ),
      addEventListener(
        this.#frameManager.networkManager,
        NetworkManagerEmittedEvents.Response,
        this.#onResponse.bind(this)
      ),
    ];

    this.#timeoutPromise = this.#createTimeoutPromise();
    this.#checkLifecycleComplete();
  }

  #onRequest(request: HTTPRequest): void {
    if (request.frame() !== this.#frame || !request.isNavigationRequest()) {
      return;
    }
    this.#navigationRequest = request;
    this.#navigationResponseReceived?.reject(
      new Error('New navigation request was received')
    );
    this.#navigationResponseReceived = createDeferredPromise();
    if (request.response() !== null) {
      this.#navigationResponseReceived?.resolve();
    }
  }

  #onResponse(response: HTTPResponse): void {
    if (this.#navigationRequest?._requestId !== response.request()._requestId) {
      return;
    }
    this.#navigationResponseReceived?.resolve();
  }

  #onFrameDetached(frame: Frame): void {
    if (this.#frame === frame) {
      this.#terminationCallback.call(
        null,
        new Error('Navigating frame was detached')
      );
      return;
    }
    this.#checkLifecycleComplete();
  }

  async navigationResponse(): Promise<HTTPResponse | null> {
    // Continue with a possibly null response.
    await this.#navigationResponseReceived?.catch(() => {});
    return this.#navigationRequest ? this.#navigationRequest.response() : null;
  }

  #terminate(error: Error): void {
    this.#terminationCallback.call(null, error);
  }

  sameDocumentNavigationPromise(): Promise<Error | undefined> {
    return this.#sameDocumentNavigationPromise;
  }

  newDocumentNavigationPromise(): Promise<Error | undefined> {
    return this.#newDocumentNavigationPromise;
  }

  lifecyclePromise(): Promise<void> {
    return this.#lifecyclePromise;
  }

  timeoutOrTerminationPromise(): Promise<Error | TimeoutError | undefined> {
    return Promise.race([this.#timeoutPromise, this.#terminationPromise]);
  }

  async #createTimeoutPromise(): Promise<TimeoutError | undefined> {
    if (!this.#timeout) {
      return new Promise(noop);
    }
    const errorMessage =
      'Navigation timeout of ' + this.#timeout + ' ms exceeded';
    await new Promise(fulfill => {
      return (this.#maximumTimer = setTimeout(fulfill, this.#timeout));
    });
    return new TimeoutError(errorMessage);
  }

  #navigatedWithinDocument(frame: Frame): void {
    if (frame !== this.#frame) {
      return;
    }
    this.#hasSameDocumentNavigation = true;
    this.#checkLifecycleComplete();
  }

  #navigated(frame: Frame): void {
    if (frame !== this.#frame) {
      return;
    }
    this.#checkLifecycleComplete();
  }

  #frameSwapped(frame: Frame): void {
    if (frame !== this.#frame) {
      return;
    }
    this.#swapped = true;
    this.#checkLifecycleComplete();
  }

  #checkLifecycleComplete(): void {
    // We expect navigation to commit.
    if (!checkLifecycle(this.#frame, this.#expectedLifecycle)) {
      return;
    }
    this.#lifecycleCallback();
    if (this.#hasSameDocumentNavigation) {
      this.#sameDocumentNavigationCompleteCallback();
    }
    if (this.#swapped || this.#frame._loaderId !== this.#initialLoaderId) {
      this.#newDocumentNavigationCompleteCallback();
    }

    function checkLifecycle(
      frame: Frame,
      expectedLifecycle: ProtocolLifeCycleEvent[]
    ): boolean {
      for (const event of expectedLifecycle) {
        if (!frame._lifecycleEvents.has(event)) {
          return false;
        }
      }
      for (const child of frame.childFrames()) {
        if (
          child._hasStartedLoading &&
          !checkLifecycle(child, expectedLifecycle)
        ) {
          return false;
        }
      }
      return true;
    }
  }

  dispose(): void {
    removeEventListeners(this.#eventListeners);
    this.#maximumTimer !== undefined && clearTimeout(this.#maximumTimer);
  }
}
