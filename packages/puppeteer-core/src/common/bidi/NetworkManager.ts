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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter, Handler} from '../EventEmitter.js';
import {NetworkManagerEmittedEvents} from '../NetworkManager.js';

import {Connection} from './Connection.js';
import {BidiFrame} from './Frame.js';
import {HTTPRequest} from './HTTPRequest.js';
import {HTTPResponse} from './HTTPResponse.js';
import {BidiPage} from './Page.js';

/**
 * @internal
 */
export class NetworkManager extends EventEmitter {
  #connection: Connection;
  #page: BidiPage;
  #subscribedEvents = new Map<string, Handler<any>>([
    ['network.beforeRequestSent', this.#onBeforeRequestSent.bind(this)],
    ['network.responseStarted', this.#onResponseStarted.bind(this)],
    ['network.responseCompleted', this.#onResponseCompleted.bind(this)],
    ['network.fetchError', this.#onFetchError.bind(this)],
  ]) as Map<Bidi.Event['method'], Handler>;

  #requestMap = new Map<string, HTTPRequest>();
  #navigationMap = new Map<string, HTTPResponse>();

  constructor(connection: Connection, page: BidiPage) {
    super();
    this.#connection = connection;
    this.#page = page;

    // TODO: Subscribe to the Frame individually
    for (const [event, subscriber] of this.#subscribedEvents) {
      this.#connection.on(event, subscriber);
    }
  }

  #onBeforeRequestSent(event: Bidi.Network.BeforeRequestSentParameters): void {
    const frame = this.#page.frame(event.context ?? '');
    if (!frame) {
      return;
    }
    const request = this.#requestMap.get(event.request.request);

    let upsertRequest: HTTPRequest;
    if (request) {
      const requestChain = request._redirectChain;

      upsertRequest = new HTTPRequest(event, frame, requestChain);
    } else {
      upsertRequest = new HTTPRequest(event, frame, []);
    }
    this.#requestMap.set(event.request.request, upsertRequest);
    this.emit(NetworkManagerEmittedEvents.Request, upsertRequest);
  }

  #onResponseStarted(_event: any) {}

  #onResponseCompleted(event: Bidi.Network.ResponseCompletedParameters): void {
    const request = this.#requestMap.get(event.request.request);
    if (!request) {
      return;
    }
    const response = new HTTPResponse(request, event);
    request._response = response;
    if (event.navigation) {
      this.#navigationMap.set(event.navigation, response);
    }
    if (response.fromCache()) {
      this.emit(NetworkManagerEmittedEvents.RequestServedFromCache, request);
    }
    this.emit(NetworkManagerEmittedEvents.Response, response);
    this.emit(NetworkManagerEmittedEvents.RequestFinished, request);
    this.#requestMap.delete(event.request.request);
  }

  #onFetchError(event: Bidi.Network.FetchErrorParameters) {
    const request = this.#requestMap.get(event.request.request);
    if (!request) {
      return;
    }
    request._failureText = event.errorText;
    this.emit(NetworkManagerEmittedEvents.RequestFailed, request);
    this.#requestMap.delete(event.request.request);
  }

  getNavigationResponse(navigationId: string | null): HTTPResponse | null {
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

    for (const [event, subscriber] of this.#subscribedEvents) {
      this.#connection.off(event, subscriber);
    }
  }
}
