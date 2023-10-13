/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter, EventSubscription} from '../common/EventEmitter.js';
import {
  NetworkManagerEvent,
  type NetworkManagerEvents,
} from '../common/NetworkManagerEvents.js';
import {DisposableStack} from '../util/disposable.js';

import type {BidiConnection} from './Connection.js';
import type {BidiFrame} from './Frame.js';
import {BidiHTTPRequest} from './HTTPRequest.js';
import {BidiHTTPResponse} from './HTTPResponse.js';
import type {BidiPage} from './Page.js';

/**
 * @internal
 */
export class BidiNetworkManager extends EventEmitter<NetworkManagerEvents> {
  #connection: BidiConnection;
  #page: BidiPage;
  #subscriptions = new DisposableStack();

  #requestMap = new Map<string, BidiHTTPRequest>();
  #navigationMap = new Map<string, BidiHTTPResponse>();

  constructor(connection: BidiConnection, page: BidiPage) {
    super();
    this.#connection = connection;
    this.#page = page;

    // TODO: Subscribe to the Frame individually
    this.#subscriptions.use(
      new EventSubscription(
        this.#connection,
        'network.beforeRequestSent',
        this.#onBeforeRequestSent.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        this.#connection,
        'network.responseStarted',
        this.#onResponseStarted.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        this.#connection,
        'network.responseCompleted',
        this.#onResponseCompleted.bind(this)
      )
    );
    this.#subscriptions.use(
      new EventSubscription(
        this.#connection,
        'network.fetchError',
        this.#onFetchError.bind(this)
      )
    );
  }

  #onBeforeRequestSent(event: Bidi.Network.BeforeRequestSentParameters): void {
    const frame = this.#page.frame(event.context ?? '');
    if (!frame) {
      return;
    }
    const request = this.#requestMap.get(event.request.request);
    let upsertRequest: BidiHTTPRequest;
    if (request) {
      request._redirectChain.push(request);
      upsertRequest = new BidiHTTPRequest(event, frame, request._redirectChain);
    } else {
      upsertRequest = new BidiHTTPRequest(event, frame, []);
    }
    this.#requestMap.set(event.request.request, upsertRequest);
    this.emit(NetworkManagerEvent.Request, upsertRequest);
  }

  #onResponseStarted(_event: Bidi.Network.ResponseStartedParameters) {}

  #onResponseCompleted(event: Bidi.Network.ResponseCompletedParameters): void {
    const request = this.#requestMap.get(event.request.request);
    if (!request) {
      return;
    }
    const response = new BidiHTTPResponse(request, event);
    request._response = response;
    if (event.navigation) {
      this.#navigationMap.set(event.navigation, response);
    }
    if (response.fromCache()) {
      this.emit(NetworkManagerEvent.RequestServedFromCache, request);
    }
    this.emit(NetworkManagerEvent.Response, response);
    this.emit(NetworkManagerEvent.RequestFinished, request);
  }

  #onFetchError(event: Bidi.Network.FetchErrorParameters) {
    const request = this.#requestMap.get(event.request.request);
    if (!request) {
      return;
    }
    request._failureText = event.errorText;
    this.emit(NetworkManagerEvent.RequestFailed, request);
    this.#requestMap.delete(event.request.request);
  }

  getNavigationResponse(navigationId: string | null): BidiHTTPResponse | null {
    if (!navigationId) {
      return null;
    }
    const response = this.#navigationMap.get(navigationId);

    return response ?? null;
  }

  inFlightRequestsCount(): number {
    let inFlightRequestCounter = 0;
    for (const request of this.#requestMap.values()) {
      if (!request.response() || request._failureText) {
        inFlightRequestCounter++;
      }
    }

    return inFlightRequestCounter;
  }

  clearMapAfterFrameDispose(frame: BidiFrame): void {
    for (const [id, request] of this.#requestMap.entries()) {
      if (request.frame() === frame) {
        this.#requestMap.delete(id);
      }
    }

    for (const [id, response] of this.#navigationMap.entries()) {
      if (response.frame() === frame) {
        this.#navigationMap.delete(id);
      }
    }
  }

  dispose(): void {
    this.removeAllListeners();
    this.#requestMap.clear();
    this.#navigationMap.clear();
    this.#subscriptions.dispose();
  }
}
