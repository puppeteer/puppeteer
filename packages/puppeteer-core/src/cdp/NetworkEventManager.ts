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

import type {Protocol} from 'devtools-protocol';

import type {CdpHTTPRequest} from './HTTPRequest.js';

/**
 * @internal
 */
export interface QueuedEventGroup {
  responseReceivedEvent: Protocol.Network.ResponseReceivedEvent;
  loadingFinishedEvent?: Protocol.Network.LoadingFinishedEvent;
  loadingFailedEvent?: Protocol.Network.LoadingFailedEvent;
}

/**
 * @internal
 */
export type FetchRequestId = string;

/**
 * @internal
 */
export interface RedirectInfo {
  event: Protocol.Network.RequestWillBeSentEvent;
  fetchRequestId?: FetchRequestId;
}
type RedirectInfoList = RedirectInfo[];

/**
 * @internal
 */
export type NetworkRequestId = string;

/**
 * Helper class to track network events by request ID
 *
 * @internal
 */
export class NetworkEventManager {
  /**
   * There are four possible orders of events:
   * A. `_onRequestWillBeSent`
   * B. `_onRequestWillBeSent`, `_onRequestPaused`
   * C. `_onRequestPaused`, `_onRequestWillBeSent`
   * D. `_onRequestPaused`, `_onRequestWillBeSent`, `_onRequestPaused`,
   * `_onRequestWillBeSent`, `_onRequestPaused`, `_onRequestPaused`
   * (see crbug.com/1196004)
   *
   * For `_onRequest` we need the event from `_onRequestWillBeSent` and
   * optionally the `interceptionId` from `_onRequestPaused`.
   *
   * If request interception is disabled, call `_onRequest` once per call to
   * `_onRequestWillBeSent`.
   * If request interception is enabled, call `_onRequest` once per call to
   * `_onRequestPaused` (once per `interceptionId`).
   *
   * Events are stored to allow for subsequent events to call `_onRequest`.
   *
   * Note that (chains of) redirect requests have the same `requestId` (!) as
   * the original request. We have to anticipate series of events like these:
   * A. `_onRequestWillBeSent`,
   * `_onRequestWillBeSent`, ...
   * B. `_onRequestWillBeSent`, `_onRequestPaused`,
   * `_onRequestWillBeSent`, `_onRequestPaused`, ...
   * C. `_onRequestWillBeSent`, `_onRequestPaused`,
   * `_onRequestPaused`, `_onRequestWillBeSent`, ...
   * D. `_onRequestPaused`, `_onRequestWillBeSent`,
   * `_onRequestPaused`, `_onRequestWillBeSent`, `_onRequestPaused`,
   * `_onRequestWillBeSent`, `_onRequestPaused`, `_onRequestPaused`, ...
   * (see crbug.com/1196004)
   */
  #requestWillBeSentMap = new Map<
    NetworkRequestId,
    Protocol.Network.RequestWillBeSentEvent
  >();
  #requestPausedMap = new Map<
    NetworkRequestId,
    Protocol.Fetch.RequestPausedEvent
  >();
  #httpRequestsMap = new Map<NetworkRequestId, CdpHTTPRequest>();

  /*
   * The below maps are used to reconcile Network.responseReceivedExtraInfo
   * events with their corresponding request. Each response and redirect
   * response gets an ExtraInfo event, and we don't know which will come first.
   * This means that we have to store a Response or an ExtraInfo for each
   * response, and emit the event when we get both of them. In addition, to
   * handle redirects, we have to make them Arrays to represent the chain of
   * events.
   */
  #responseReceivedExtraInfoMap = new Map<
    NetworkRequestId,
    Protocol.Network.ResponseReceivedExtraInfoEvent[]
  >();
  #queuedRedirectInfoMap = new Map<NetworkRequestId, RedirectInfoList>();
  #queuedEventGroupMap = new Map<NetworkRequestId, QueuedEventGroup>();

  forget(networkRequestId: NetworkRequestId): void {
    this.#requestWillBeSentMap.delete(networkRequestId);
    this.#requestPausedMap.delete(networkRequestId);
    this.#queuedEventGroupMap.delete(networkRequestId);
    this.#queuedRedirectInfoMap.delete(networkRequestId);
    this.#responseReceivedExtraInfoMap.delete(networkRequestId);
  }

  responseExtraInfo(
    networkRequestId: NetworkRequestId
  ): Protocol.Network.ResponseReceivedExtraInfoEvent[] {
    if (!this.#responseReceivedExtraInfoMap.has(networkRequestId)) {
      this.#responseReceivedExtraInfoMap.set(networkRequestId, []);
    }
    return this.#responseReceivedExtraInfoMap.get(
      networkRequestId
    ) as Protocol.Network.ResponseReceivedExtraInfoEvent[];
  }

  private queuedRedirectInfo(fetchRequestId: FetchRequestId): RedirectInfoList {
    if (!this.#queuedRedirectInfoMap.has(fetchRequestId)) {
      this.#queuedRedirectInfoMap.set(fetchRequestId, []);
    }
    return this.#queuedRedirectInfoMap.get(fetchRequestId) as RedirectInfoList;
  }

  queueRedirectInfo(
    fetchRequestId: FetchRequestId,
    redirectInfo: RedirectInfo
  ): void {
    this.queuedRedirectInfo(fetchRequestId).push(redirectInfo);
  }

  takeQueuedRedirectInfo(
    fetchRequestId: FetchRequestId
  ): RedirectInfo | undefined {
    return this.queuedRedirectInfo(fetchRequestId).shift();
  }

  inFlightRequestsCount(): number {
    let inFlightRequestCounter = 0;
    for (const request of this.#httpRequestsMap.values()) {
      if (!request.response()) {
        inFlightRequestCounter++;
      }
    }
    return inFlightRequestCounter;
  }

  storeRequestWillBeSent(
    networkRequestId: NetworkRequestId,
    event: Protocol.Network.RequestWillBeSentEvent
  ): void {
    this.#requestWillBeSentMap.set(networkRequestId, event);
  }

  getRequestWillBeSent(
    networkRequestId: NetworkRequestId
  ): Protocol.Network.RequestWillBeSentEvent | undefined {
    return this.#requestWillBeSentMap.get(networkRequestId);
  }

  forgetRequestWillBeSent(networkRequestId: NetworkRequestId): void {
    this.#requestWillBeSentMap.delete(networkRequestId);
  }

  getRequestPaused(
    networkRequestId: NetworkRequestId
  ): Protocol.Fetch.RequestPausedEvent | undefined {
    return this.#requestPausedMap.get(networkRequestId);
  }

  forgetRequestPaused(networkRequestId: NetworkRequestId): void {
    this.#requestPausedMap.delete(networkRequestId);
  }

  storeRequestPaused(
    networkRequestId: NetworkRequestId,
    event: Protocol.Fetch.RequestPausedEvent
  ): void {
    this.#requestPausedMap.set(networkRequestId, event);
  }

  getRequest(networkRequestId: NetworkRequestId): CdpHTTPRequest | undefined {
    return this.#httpRequestsMap.get(networkRequestId);
  }

  storeRequest(
    networkRequestId: NetworkRequestId,
    request: CdpHTTPRequest
  ): void {
    this.#httpRequestsMap.set(networkRequestId, request);
  }

  forgetRequest(networkRequestId: NetworkRequestId): void {
    this.#httpRequestsMap.delete(networkRequestId);
  }

  getQueuedEventGroup(
    networkRequestId: NetworkRequestId
  ): QueuedEventGroup | undefined {
    return this.#queuedEventGroupMap.get(networkRequestId);
  }

  queueEventGroup(
    networkRequestId: NetworkRequestId,
    event: QueuedEventGroup
  ): void {
    this.#queuedEventGroupMap.set(networkRequestId, event);
  }

  forgetQueuedEventGroup(networkRequestId: NetworkRequestId): void {
    this.#queuedEventGroupMap.delete(networkRequestId);
  }
}
