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
import {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';
import {assert} from './assert.js';
import {EventEmitter} from './EventEmitter.js';
import {Frame} from './FrameManager.js';
import {HTTPRequest} from './HTTPRequest.js';
import {HTTPResponse} from './HTTPResponse.js';
import {FetchRequestId, NetworkEventManager} from './NetworkEventManager.js';
import {
  debugError,
  isString,
  createDeferredPromiseWithTimer,
  DeferredPromise,
} from './util.js';

/**
 * @public
 */
export interface Credentials {
  username: string;
  password: string;
}

/**
 * @public
 */
export interface NetworkConditions {
  // Download speed (bytes/s)
  download: number;
  // Upload speed (bytes/s)
  upload: number;
  // Latency (ms)
  latency: number;
}
/**
 * @public
 */
export interface InternalNetworkConditions extends NetworkConditions {
  offline: boolean;
}

/**
 * We use symbols to prevent any external parties listening to these events.
 * They are internal to Puppeteer.
 *
 * @internal
 */
export const NetworkManagerEmittedEvents = {
  Request: Symbol('NetworkManager.Request'),
  RequestServedFromCache: Symbol('NetworkManager.RequestServedFromCache'),
  Response: Symbol('NetworkManager.Response'),
  RequestFailed: Symbol('NetworkManager.RequestFailed'),
  RequestFinished: Symbol('NetworkManager.RequestFinished'),
} as const;

interface CDPSession extends EventEmitter {
  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;
}

interface FrameManager {
  frame(frameId: string): Frame | null;
}

/**
 * @internal
 */
export class NetworkManager extends EventEmitter {
  #client: CDPSession;
  #ignoreHTTPSErrors: boolean;
  #frameManager: FrameManager;
  #networkEventManager = new NetworkEventManager();
  #extraHTTPHeaders: Record<string, string> = {};
  #credentials?: Credentials;
  #attemptedAuthentications = new Set<string>();
  #userRequestInterceptionEnabled = false;
  #protocolRequestInterceptionEnabled = false;
  #userCacheDisabled = false;
  #emulatedNetworkConditions: InternalNetworkConditions = {
    offline: false,
    upload: -1,
    download: -1,
    latency: 0,
  };
  #deferredInitPromise?: DeferredPromise<void>;

  constructor(
    client: CDPSession,
    ignoreHTTPSErrors: boolean,
    frameManager: FrameManager
  ) {
    super();
    this.#client = client;
    this.#ignoreHTTPSErrors = ignoreHTTPSErrors;
    this.#frameManager = frameManager;

    this.#client.on('Fetch.requestPaused', this.#onRequestPaused.bind(this));
    this.#client.on('Fetch.authRequired', this.#onAuthRequired.bind(this));
    this.#client.on(
      'Network.requestWillBeSent',
      this.#onRequestWillBeSent.bind(this)
    );
    this.#client.on(
      'Network.requestServedFromCache',
      this.#onRequestServedFromCache.bind(this)
    );
    this.#client.on(
      'Network.responseReceived',
      this.#onResponseReceived.bind(this)
    );
    this.#client.on(
      'Network.loadingFinished',
      this.#onLoadingFinished.bind(this)
    );
    this.#client.on('Network.loadingFailed', this.#onLoadingFailed.bind(this));
    this.#client.on(
      'Network.responseReceivedExtraInfo',
      this.#onResponseReceivedExtraInfo.bind(this)
    );
  }

  /**
   * Initialize calls should avoid async dependencies between CDP calls as those
   * might not resolve until after the target is resumed causing a deadlock.
   */
  initialize(): Promise<void> {
    if (this.#deferredInitPromise) {
      return this.#deferredInitPromise;
    }
    this.#deferredInitPromise = createDeferredPromiseWithTimer<void>(
      'NetworkManager initialization timed out',
      30000
    );
    const init = Promise.all([
      this.#ignoreHTTPSErrors
        ? this.#client.send('Security.setIgnoreCertificateErrors', {
            ignore: true,
          })
        : null,
      this.#client.send('Network.enable'),
    ]);
    const deferredInitPromise = this.#deferredInitPromise;
    init
      .then(() => {
        deferredInitPromise.resolve();
      })
      .catch(err => {
        deferredInitPromise.reject(err);
      });
    return this.#deferredInitPromise;
  }

  async authenticate(credentials?: Credentials): Promise<void> {
    this.#credentials = credentials;
    await this.#updateProtocolRequestInterception();
  }

  async setExtraHTTPHeaders(
    extraHTTPHeaders: Record<string, string>
  ): Promise<void> {
    this.#extraHTTPHeaders = {};
    for (const key of Object.keys(extraHTTPHeaders)) {
      const value = extraHTTPHeaders[key];
      assert(
        isString(value),
        `Expected value of header "${key}" to be String, but "${typeof value}" is found.`
      );
      this.#extraHTTPHeaders[key.toLowerCase()] = value;
    }
    await this.#client.send('Network.setExtraHTTPHeaders', {
      headers: this.#extraHTTPHeaders,
    });
  }

  extraHTTPHeaders(): Record<string, string> {
    return Object.assign({}, this.#extraHTTPHeaders);
  }

  numRequestsInProgress(): number {
    return this.#networkEventManager.numRequestsInProgress();
  }

  async setOfflineMode(value: boolean): Promise<void> {
    this.#emulatedNetworkConditions.offline = value;
    await this.#updateNetworkConditions();
  }

  async emulateNetworkConditions(
    networkConditions: NetworkConditions | null
  ): Promise<void> {
    this.#emulatedNetworkConditions.upload = networkConditions
      ? networkConditions.upload
      : -1;
    this.#emulatedNetworkConditions.download = networkConditions
      ? networkConditions.download
      : -1;
    this.#emulatedNetworkConditions.latency = networkConditions
      ? networkConditions.latency
      : 0;

    await this.#updateNetworkConditions();
  }

  async #updateNetworkConditions(): Promise<void> {
    await this.#client.send('Network.emulateNetworkConditions', {
      offline: this.#emulatedNetworkConditions.offline,
      latency: this.#emulatedNetworkConditions.latency,
      uploadThroughput: this.#emulatedNetworkConditions.upload,
      downloadThroughput: this.#emulatedNetworkConditions.download,
    });
  }

  async setUserAgent(
    userAgent: string,
    userAgentMetadata?: Protocol.Emulation.UserAgentMetadata
  ): Promise<void> {
    await this.#client.send('Network.setUserAgentOverride', {
      userAgent: userAgent,
      userAgentMetadata: userAgentMetadata,
    });
  }

  async setCacheEnabled(enabled: boolean): Promise<void> {
    this.#userCacheDisabled = !enabled;
    await this.#updateProtocolCacheDisabled();
  }

  async setRequestInterception(value: boolean): Promise<void> {
    this.#userRequestInterceptionEnabled = value;
    await this.#updateProtocolRequestInterception();
  }

  async #updateProtocolRequestInterception(): Promise<void> {
    const enabled = this.#userRequestInterceptionEnabled || !!this.#credentials;
    if (enabled === this.#protocolRequestInterceptionEnabled) {
      return;
    }
    this.#protocolRequestInterceptionEnabled = enabled;
    if (enabled) {
      await Promise.all([
        this.#updateProtocolCacheDisabled(),
        this.#client.send('Fetch.enable', {
          handleAuthRequests: true,
          patterns: [{urlPattern: '*'}],
        }),
      ]);
    } else {
      await Promise.all([
        this.#updateProtocolCacheDisabled(),
        this.#client.send('Fetch.disable'),
      ]);
    }
  }

  #cacheDisabled(): boolean {
    return this.#userCacheDisabled;
  }

  async #updateProtocolCacheDisabled(): Promise<void> {
    await this.#client.send('Network.setCacheDisabled', {
      cacheDisabled: this.#cacheDisabled(),
    });
  }

  #onRequestWillBeSent(event: Protocol.Network.RequestWillBeSentEvent): void {
    // Request interception doesn't happen for data URLs with Network Service.
    if (
      this.#userRequestInterceptionEnabled &&
      !event.request.url.startsWith('data:')
    ) {
      const {requestId: networkRequestId} = event;

      this.#networkEventManager.storeRequestWillBeSent(networkRequestId, event);

      /**
       * CDP may have sent a Fetch.requestPaused event already. Check for it.
       */
      const requestPausedEvent =
        this.#networkEventManager.getRequestPaused(networkRequestId);
      if (requestPausedEvent) {
        const {requestId: fetchRequestId} = requestPausedEvent;
        this.#patchRequestEventHeaders(event, requestPausedEvent);
        this.#onRequest(event, fetchRequestId);
        this.#networkEventManager.forgetRequestPaused(networkRequestId);
      }

      return;
    }
    this.#onRequest(event, undefined);
  }

  #onAuthRequired(event: Protocol.Fetch.AuthRequiredEvent): void {
    /* TODO(jacktfranklin): This is defined in protocol.d.ts but not
     * in an easily referrable way - we should look at exposing it.
     */
    type AuthResponse = 'Default' | 'CancelAuth' | 'ProvideCredentials';
    let response: AuthResponse = 'Default';
    if (this.#attemptedAuthentications.has(event.requestId)) {
      response = 'CancelAuth';
    } else if (this.#credentials) {
      response = 'ProvideCredentials';
      this.#attemptedAuthentications.add(event.requestId);
    }
    const {username, password} = this.#credentials || {
      username: undefined,
      password: undefined,
    };
    this.#client
      .send('Fetch.continueWithAuth', {
        requestId: event.requestId,
        authChallengeResponse: {response, username, password},
      })
      .catch(debugError);
  }

  /**
   * CDP may send a Fetch.requestPaused without or before a
   * Network.requestWillBeSent
   *
   * CDP may send multiple Fetch.requestPaused
   * for the same Network.requestWillBeSent.
   */
  #onRequestPaused(event: Protocol.Fetch.RequestPausedEvent): void {
    if (
      !this.#userRequestInterceptionEnabled &&
      this.#protocolRequestInterceptionEnabled
    ) {
      this.#client
        .send('Fetch.continueRequest', {
          requestId: event.requestId,
        })
        .catch(debugError);
    }

    const {networkId: networkRequestId, requestId: fetchRequestId} = event;

    if (!networkRequestId) {
      return;
    }

    const requestWillBeSentEvent = (() => {
      const requestWillBeSentEvent =
        this.#networkEventManager.getRequestWillBeSent(networkRequestId);

      // redirect requests have the same `requestId`,
      if (
        requestWillBeSentEvent &&
        (requestWillBeSentEvent.request.url !== event.request.url ||
          requestWillBeSentEvent.request.method !== event.request.method)
      ) {
        this.#networkEventManager.forgetRequestWillBeSent(networkRequestId);
        return;
      }
      return requestWillBeSentEvent;
    })();

    if (requestWillBeSentEvent) {
      this.#patchRequestEventHeaders(requestWillBeSentEvent, event);
      this.#onRequest(requestWillBeSentEvent, fetchRequestId);
    } else {
      this.#networkEventManager.storeRequestPaused(networkRequestId, event);
    }
  }

  #patchRequestEventHeaders(
    requestWillBeSentEvent: Protocol.Network.RequestWillBeSentEvent,
    requestPausedEvent: Protocol.Fetch.RequestPausedEvent
  ): void {
    requestWillBeSentEvent.request.headers = {
      ...requestWillBeSentEvent.request.headers,
      // includes extra headers, like: Accept, Origin
      ...requestPausedEvent.request.headers,
    };
  }

  #onRequest(
    event: Protocol.Network.RequestWillBeSentEvent,
    fetchRequestId?: FetchRequestId
  ): void {
    let redirectChain: HTTPRequest[] = [];
    if (event.redirectResponse) {
      // We want to emit a response and requestfinished for the
      // redirectResponse, but we can't do so unless we have a
      // responseExtraInfo ready to pair it up with. If we don't have any
      // responseExtraInfos saved in our queue, they we have to wait until
      // the next one to emit response and requestfinished, *and* we should
      // also wait to emit this Request too because it should come after the
      // response/requestfinished.
      let redirectResponseExtraInfo = null;
      if (event.redirectHasExtraInfo) {
        redirectResponseExtraInfo = this.#networkEventManager
          .responseExtraInfo(event.requestId)
          .shift();
        if (!redirectResponseExtraInfo) {
          this.#networkEventManager.queueRedirectInfo(event.requestId, {
            event,
            fetchRequestId,
          });
          return;
        }
      }

      const request = this.#networkEventManager.getRequest(event.requestId);
      // If we connect late to the target, we could have missed the
      // requestWillBeSent event.
      if (request) {
        this.#handleRequestRedirect(
          request,
          event.redirectResponse,
          redirectResponseExtraInfo
        );
        redirectChain = request._redirectChain;
      }
    }
    const frame = event.frameId
      ? this.#frameManager.frame(event.frameId)
      : null;

    const request = new HTTPRequest(
      this.#client,
      frame,
      fetchRequestId,
      this.#userRequestInterceptionEnabled,
      event,
      redirectChain
    );
    this.#networkEventManager.storeRequest(event.requestId, request);
    this.emit(NetworkManagerEmittedEvents.Request, request);
    request.finalizeInterceptions();
  }

  #onRequestServedFromCache(
    event: Protocol.Network.RequestServedFromCacheEvent
  ): void {
    const request = this.#networkEventManager.getRequest(event.requestId);
    if (request) {
      request._fromMemoryCache = true;
    }
    this.emit(NetworkManagerEmittedEvents.RequestServedFromCache, request);
  }

  #handleRequestRedirect(
    request: HTTPRequest,
    responsePayload: Protocol.Network.Response,
    extraInfo: Protocol.Network.ResponseReceivedExtraInfoEvent | null
  ): void {
    const response = new HTTPResponse(
      this.#client,
      request,
      responsePayload,
      extraInfo
    );
    request._response = response;
    request._redirectChain.push(request);
    response._resolveBody(
      new Error('Response body is unavailable for redirect responses')
    );
    this.#forgetRequest(request, false);
    this.emit(NetworkManagerEmittedEvents.Response, response);
    this.emit(NetworkManagerEmittedEvents.RequestFinished, request);
  }

  #emitResponseEvent(
    responseReceived: Protocol.Network.ResponseReceivedEvent,
    extraInfo: Protocol.Network.ResponseReceivedExtraInfoEvent | null
  ): void {
    const request = this.#networkEventManager.getRequest(
      responseReceived.requestId
    );
    // FileUpload sends a response without a matching request.
    if (!request) {
      return;
    }

    const extraInfos = this.#networkEventManager.responseExtraInfo(
      responseReceived.requestId
    );
    if (extraInfos.length) {
      debugError(
        new Error(
          'Unexpected extraInfo events for request ' +
            responseReceived.requestId
        )
      );
    }

    const response = new HTTPResponse(
      this.#client,
      request,
      responseReceived.response,
      extraInfo
    );
    request._response = response;
    this.emit(NetworkManagerEmittedEvents.Response, response);
  }

  #onResponseReceived(event: Protocol.Network.ResponseReceivedEvent): void {
    const request = this.#networkEventManager.getRequest(event.requestId);
    let extraInfo = null;
    if (request && !request._fromMemoryCache && event.hasExtraInfo) {
      extraInfo = this.#networkEventManager
        .responseExtraInfo(event.requestId)
        .shift();
      if (!extraInfo) {
        // Wait until we get the corresponding ExtraInfo event.
        this.#networkEventManager.queueEventGroup(event.requestId, {
          responseReceivedEvent: event,
        });
        return;
      }
    }
    this.#emitResponseEvent(event, extraInfo);
  }

  #onResponseReceivedExtraInfo(
    event: Protocol.Network.ResponseReceivedExtraInfoEvent
  ): void {
    // We may have skipped a redirect response/request pair due to waiting for
    // this ExtraInfo event. If so, continue that work now that we have the
    // request.
    const redirectInfo = this.#networkEventManager.takeQueuedRedirectInfo(
      event.requestId
    );
    if (redirectInfo) {
      this.#networkEventManager.responseExtraInfo(event.requestId).push(event);
      this.#onRequest(redirectInfo.event, redirectInfo.fetchRequestId);
      return;
    }

    // We may have skipped response and loading events because we didn't have
    // this ExtraInfo event yet. If so, emit those events now.
    const queuedEvents = this.#networkEventManager.getQueuedEventGroup(
      event.requestId
    );
    if (queuedEvents) {
      this.#networkEventManager.forgetQueuedEventGroup(event.requestId);
      this.#emitResponseEvent(queuedEvents.responseReceivedEvent, event);
      if (queuedEvents.loadingFinishedEvent) {
        this.#emitLoadingFinished(queuedEvents.loadingFinishedEvent);
      }
      if (queuedEvents.loadingFailedEvent) {
        this.#emitLoadingFailed(queuedEvents.loadingFailedEvent);
      }
      return;
    }

    // Wait until we get another event that can use this ExtraInfo event.
    this.#networkEventManager.responseExtraInfo(event.requestId).push(event);
  }

  #forgetRequest(request: HTTPRequest, events: boolean): void {
    const requestId = request._requestId;
    const interceptionId = request._interceptionId;

    this.#networkEventManager.forgetRequest(requestId);
    interceptionId !== undefined &&
      this.#attemptedAuthentications.delete(interceptionId);

    if (events) {
      this.#networkEventManager.forget(requestId);
    }
  }

  #onLoadingFinished(event: Protocol.Network.LoadingFinishedEvent): void {
    // If the response event for this request is still waiting on a
    // corresponding ExtraInfo event, then wait to emit this event too.
    const queuedEvents = this.#networkEventManager.getQueuedEventGroup(
      event.requestId
    );
    if (queuedEvents) {
      queuedEvents.loadingFinishedEvent = event;
    } else {
      this.#emitLoadingFinished(event);
    }
  }

  #emitLoadingFinished(event: Protocol.Network.LoadingFinishedEvent): void {
    const request = this.#networkEventManager.getRequest(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request) {
      return;
    }

    // Under certain conditions we never get the Network.responseReceived
    // event from protocol. @see https://crbug.com/883475
    if (request.response()) {
      request.response()?._resolveBody(null);
    }
    this.#forgetRequest(request, true);
    this.emit(NetworkManagerEmittedEvents.RequestFinished, request);
  }

  #onLoadingFailed(event: Protocol.Network.LoadingFailedEvent): void {
    // If the response event for this request is still waiting on a
    // corresponding ExtraInfo event, then wait to emit this event too.
    const queuedEvents = this.#networkEventManager.getQueuedEventGroup(
      event.requestId
    );
    if (queuedEvents) {
      queuedEvents.loadingFailedEvent = event;
    } else {
      this.#emitLoadingFailed(event);
    }
  }

  #emitLoadingFailed(event: Protocol.Network.LoadingFailedEvent): void {
    const request = this.#networkEventManager.getRequest(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request) {
      return;
    }
    request._failureText = event.errorText;
    const response = request.response();
    if (response) {
      response._resolveBody(null);
    }
    this.#forgetRequest(request, true);
    this.emit(NetworkManagerEmittedEvents.RequestFailed, request);
  }
}
