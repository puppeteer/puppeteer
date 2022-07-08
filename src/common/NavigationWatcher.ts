/**
 * Copyright 2022 Google Inc. All rights reserved.
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
import {HTTPRequest} from './HTTPRequest.js';
import {HTTPResponse} from './HTTPResponse.js';
import {NetworkManagerEmittedEvents} from './NetworkManager.js';
import {
  addEventListener,
  createTimeoutPromise,
  noop,
  PuppeteerEventListener,
  removeEventListeners,
  TimeoutPromise,
} from './util.js';

/**
 * @internal
 */
export class NavigationWatcher {
  #frame: Frame;
  #timeout: TimeoutPromise;
  #eventListeners: PuppeteerEventListener[];

  #storeResponse: (response: HTTPResponse | null) => void = noop;
  #response = new Promise<HTTPResponse | null>(fulfill => {
    this.#storeResponse = fulfill;
  });
  #request?: HTTPRequest;

  #completeNavigation: () => void = noop;
  #navigatedCompleted = new Promise<void>(fulfill => {
    this.#completeNavigation = fulfill;
  });

  terminate: (x: Error | void) => void = noop;
  #terminated = new Promise<Error | void>(fulfill => {
    this.terminate = fulfill;
  });

  constructor(frameManager: FrameManager, frame: Frame, timeout: number) {
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
        FrameManagerEmittedEvents.FrameSwapped,
        this.#onFrameNavigated.bind(this)
      ),
    ];
    // If there is a loaderId, then we are navigating to a new page.
    if (frame._loaderId) {
      this.#eventListeners.push(
        addEventListener(
          frameManager,
          FrameManagerEmittedEvents.FrameNavigated,
          this.#onFrameNavigated.bind(this)
        ),
        addEventListener(
          frameManager.networkManager(),
          NetworkManagerEmittedEvents.Request,
          this.#onRequest.bind(this)
        ),
        addEventListener(
          frameManager.networkManager(),
          NetworkManagerEmittedEvents.RequestFinished,
          this.#onRequestFinished.bind(this)
        )
      );
    } else {
      this.#eventListeners.push(
        addEventListener(
          frameManager,
          FrameManagerEmittedEvents.FrameNavigatedWithinDocument,
          this.#onFrameNavigatedWithinDocument.bind(this)
        )
      );
    }
  }

  #onRequest(request: HTTPRequest): void {
    if (this.#frame !== request.frame()) {
      return;
    }
    // We only care about navigation requests.
    if (!request.isNavigationRequest()) {
      return;
    }
    this.#request = request;
  }

  #onRequestFinished(request: HTTPRequest): void {
    if (request !== this.#request) {
      return;
    }

    const response = request.response();
    if (!response) {
      this.#storeResponse(null);
      return;
    }
    const status = response.status();
    // Ignore redirects except 304 which is used for caching.
    if (status < 300 || status >= 400 || status === 304) {
      this.#storeResponse(response);
    }
  }

  #onDisconnect(): void {
    this.terminate(
      new Error('Navigation failed because browser has disconnected!')
    );
  }

  #onFrameDetached(frame: Frame): void {
    if (this.#frame !== frame) {
      return;
    }
    this.terminate(new Error('Lifecycle watching frame detached!'));
  }

  #onFrameNavigated(frame: Frame): void {
    if (this.#frame !== frame) {
      return;
    }
    this.#completeNavigation();
    // If the a request was not initialized before navigation finishes, then
    // there is nothing to wait for.
    if (!this.#request) {
      this.#storeResponse(null);
    }
  }

  #onFrameNavigatedWithinDocument(frame: Frame): void {
    if (this.#frame !== frame) {
      return;
    }
    this.#completeNavigation();
    this.#storeResponse(null);
  }

  async response(): Promise<HTTPResponse | null> {
    const result = await Promise.race([
      Promise.all([this.#navigatedCompleted, this.#response]),
      this.#timeout,
      this.#terminated,
    ]);
    removeEventListeners(this.#eventListeners);
    this.#timeout.clear();
    if (result instanceof Error) {
      throw result;
    }
    if (Array.isArray(result)) {
      return result[1];
    }
    return null;
  }
}
