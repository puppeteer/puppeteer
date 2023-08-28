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

import {HTTPResponse} from '../api/HTTPResponse.js';
import {assert} from '../util/assert.js';
import {Deferred} from '../util/Deferred.js';

import {TimeoutError} from './Errors.js';
import {Frame, FrameEmittedEvents} from './Frame.js';
import {HTTPRequest} from './HTTPRequest.js';
import {NetworkManager, NetworkManagerEmittedEvents} from './NetworkManager.js';
import {
  addEventListener,
  PuppeteerEventListener,
  removeEventListeners,
} from './util.js';
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

/**
 * @internal
 */
export class LifecycleWatcher {
  #expectedLifecycle: ProtocolLifeCycleEvent[];
  #frame: Frame;
  #timeout: number;
  #navigationRequest: HTTPRequest | null = null;
  #eventListeners: PuppeteerEventListener[];
  #initialLoaderId: string;

  #terminationDeferred: Deferred<Error>;
  #sameDocumentNavigationDeferred = Deferred.create<undefined>();
  #lifecycleDeferred = Deferred.create<void>();
  #newDocumentNavigationDeferred = Deferred.create<undefined>();

  #hasSameDocumentNavigation?: boolean;
  #swapped?: boolean;

  #navigationResponseReceived?: Deferred<void>;

  constructor(
    networkManager: NetworkManager,
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

    this.#frame = frame;
    this.#timeout = timeout;
    this.#eventListeners = [
      addEventListener(
        frame,
        FrameEmittedEvents.LifecycleEvent,
        this.#checkLifecycleComplete.bind(this)
      ),
      addEventListener(
        frame,
        FrameEmittedEvents.FrameNavigatedWithinDocument,
        this.#navigatedWithinDocument.bind(this)
      ),
      addEventListener(
        frame,
        FrameEmittedEvents.FrameNavigated,
        this.#navigated.bind(this)
      ),
      addEventListener(
        frame,
        FrameEmittedEvents.FrameSwapped,
        this.#frameSwapped.bind(this)
      ),
      addEventListener(
        frame,
        FrameEmittedEvents.FrameSwappedByActivation,
        this.#frameSwapped.bind(this)
      ),
      addEventListener(
        frame,
        FrameEmittedEvents.FrameDetached,
        this.#onFrameDetached.bind(this)
      ),
      addEventListener(
        networkManager,
        NetworkManagerEmittedEvents.Request,
        this.#onRequest.bind(this)
      ),
      addEventListener(
        networkManager,
        NetworkManagerEmittedEvents.Response,
        this.#onResponse.bind(this)
      ),
      addEventListener(
        networkManager,
        NetworkManagerEmittedEvents.RequestFailed,
        this.#onRequestFailed.bind(this)
      ),
    ];

    this.#terminationDeferred = Deferred.create<Error>({
      timeout: this.#timeout,
      message: `Navigation timeout of ${this.#timeout} ms exceeded`,
    });

    this.#checkLifecycleComplete();
  }

  #onRequest(request: HTTPRequest): void {
    if (request.frame() !== this.#frame || !request.isNavigationRequest()) {
      return;
    }
    this.#navigationRequest = request;
    // Resolve previous navigation response in case there are multiple
    // navigation requests reported by the backend. This generally should not
    // happen by it looks like it's possible.
    this.#navigationResponseReceived?.resolve();
    this.#navigationResponseReceived = Deferred.create();
    if (request.response() !== null) {
      this.#navigationResponseReceived?.resolve();
    }
  }

  #onRequestFailed(request: HTTPRequest): void {
    if (this.#navigationRequest?._requestId !== request._requestId) {
      return;
    }
    this.#navigationResponseReceived?.resolve();
  }

  #onResponse(response: HTTPResponse): void {
    if (this.#navigationRequest?._requestId !== response.request()._requestId) {
      return;
    }
    this.#navigationResponseReceived?.resolve();
  }

  #onFrameDetached(frame: Frame): void {
    if (this.#frame === frame) {
      this.#terminationDeferred.resolve(
        new Error('Navigating frame was detached')
      );
      return;
    }
    this.#checkLifecycleComplete();
  }

  async navigationResponse(): Promise<HTTPResponse | null> {
    // Continue with a possibly null response.
    await this.#navigationResponseReceived?.valueOrThrow();
    return this.#navigationRequest ? this.#navigationRequest.response() : null;
  }

  sameDocumentNavigationPromise(): Promise<Error | undefined> {
    return this.#sameDocumentNavigationDeferred.valueOrThrow();
  }

  newDocumentNavigationPromise(): Promise<Error | undefined> {
    return this.#newDocumentNavigationDeferred.valueOrThrow();
  }

  lifecyclePromise(): Promise<void> {
    return this.#lifecycleDeferred.valueOrThrow();
  }

  terminationPromise(): Promise<Error | TimeoutError | undefined> {
    return this.#terminationDeferred.valueOrThrow();
  }

  #navigatedWithinDocument(): void {
    this.#hasSameDocumentNavigation = true;
    this.#checkLifecycleComplete();
  }

  #navigated(): void {
    this.#checkLifecycleComplete();
  }

  #frameSwapped(): void {
    this.#swapped = true;
    this.#checkLifecycleComplete();
  }

  #checkLifecycleComplete(): void {
    // We expect navigation to commit.
    if (!checkLifecycle(this.#frame, this.#expectedLifecycle)) {
      return;
    }
    this.#lifecycleDeferred.resolve();
    if (this.#hasSameDocumentNavigation) {
      this.#sameDocumentNavigationDeferred.resolve(undefined);
    }
    if (this.#swapped || this.#frame._loaderId !== this.#initialLoaderId) {
      this.#newDocumentNavigationDeferred.resolve(undefined);
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
    this.#terminationDeferred.resolve(new Error('LifecycleWatcher disposed'));
  }
}
