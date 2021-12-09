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

import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping.js';
import { EventEmitter } from './EventEmitter.js';
import { Frame } from './FrameManager.js';
import { assert } from './assert.js';
import { helper, debugError } from './helper.js';
import { Protocol } from 'devtools-protocol';
import { HTTPRequest } from './HTTPRequest.js';
import { HTTPResponse } from './HTTPResponse.js';
import { FetchRequestId, NetworkEventManager } from './NetworkEventManager.js';

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
  _client: CDPSession;
  _ignoreHTTPSErrors: boolean;
  _frameManager: FrameManager;

  _networkEventManager = new NetworkEventManager();

  _extraHTTPHeaders: Record<string, string> = {};
  _credentials?: Credentials = null;
  _attemptedAuthentications = new Set<string>();
  _userRequestInterceptionEnabled = false;
  _protocolRequestInterceptionEnabled = false;
  _userCacheDisabled = false;
  _emulatedNetworkConditions: InternalNetworkConditions = {
    offline: false,
    upload: -1,
    download: -1,
    latency: 0,
  };

  constructor(
    client: CDPSession,
    ignoreHTTPSErrors: boolean,
    frameManager: FrameManager
  ) {
    super();
    this._client = client;
    this._ignoreHTTPSErrors = ignoreHTTPSErrors;
    this._frameManager = frameManager;

    this._client.on('Fetch.requestPaused', this._onRequestPaused.bind(this));
    this._client.on('Fetch.authRequired', this._onAuthRequired.bind(this));
    this._client.on(
      'Network.requestWillBeSent',
      this._onRequestWillBeSent.bind(this)
    );
    this._client.on(
      'Network.requestServedFromCache',
      this._onRequestServedFromCache.bind(this)
    );
    this._client.on(
      'Network.responseReceived',
      this._onResponseReceived.bind(this)
    );
    this._client.on(
      'Network.loadingFinished',
      this._onLoadingFinished.bind(this)
    );
    this._client.on('Network.loadingFailed', this._onLoadingFailed.bind(this));
    this._client.on(
      'Network.responseReceivedExtraInfo',
      this._onResponseReceivedExtraInfo.bind(this)
    );
  }

  async initialize(): Promise<void> {
    await this._client.send('Network.enable');
    if (this._ignoreHTTPSErrors)
      await this._client.send('Security.setIgnoreCertificateErrors', {
        ignore: true,
      });
  }

  async authenticate(credentials?: Credentials): Promise<void> {
    this._credentials = credentials;
    await this._updateProtocolRequestInterception();
  }

  async setExtraHTTPHeaders(
    extraHTTPHeaders: Record<string, string>
  ): Promise<void> {
    this._extraHTTPHeaders = {};
    for (const key of Object.keys(extraHTTPHeaders)) {
      const value = extraHTTPHeaders[key];
      assert(
        helper.isString(value),
        `Expected value of header "${key}" to be String, but "${typeof value}" is found.`
      );
      this._extraHTTPHeaders[key.toLowerCase()] = value;
    }
    await this._client.send('Network.setExtraHTTPHeaders', {
      headers: this._extraHTTPHeaders,
    });
  }

  extraHTTPHeaders(): Record<string, string> {
    return Object.assign({}, this._extraHTTPHeaders);
  }

  numRequestsInProgress(): number {
    return this._networkEventManager.numRequestsInProgress();
  }

  async setOfflineMode(value: boolean): Promise<void> {
    this._emulatedNetworkConditions.offline = value;
    await this._updateNetworkConditions();
  }

  async emulateNetworkConditions(
    networkConditions: NetworkConditions | null
  ): Promise<void> {
    this._emulatedNetworkConditions.upload = networkConditions
      ? networkConditions.upload
      : -1;
    this._emulatedNetworkConditions.download = networkConditions
      ? networkConditions.download
      : -1;
    this._emulatedNetworkConditions.latency = networkConditions
      ? networkConditions.latency
      : 0;

    await this._updateNetworkConditions();
  }

  async _updateNetworkConditions(): Promise<void> {
    await this._client.send('Network.emulateNetworkConditions', {
      offline: this._emulatedNetworkConditions.offline,
      latency: this._emulatedNetworkConditions.latency,
      uploadThroughput: this._emulatedNetworkConditions.upload,
      downloadThroughput: this._emulatedNetworkConditions.download,
    });
  }

  async setUserAgent(
    userAgent: string,
    userAgentMetadata?: Protocol.Emulation.UserAgentMetadata
  ): Promise<void> {
    await this._client.send('Network.setUserAgentOverride', {
      userAgent: userAgent,
      userAgentMetadata: userAgentMetadata,
    });
  }

  async setCacheEnabled(enabled: boolean): Promise<void> {
    this._userCacheDisabled = !enabled;
    await this._updateProtocolCacheDisabled();
  }

  async setRequestInterception(value: boolean): Promise<void> {
    this._userRequestInterceptionEnabled = value;
    await this._updateProtocolRequestInterception();
  }

  async _updateProtocolRequestInterception(): Promise<void> {
    const enabled = this._userRequestInterceptionEnabled || !!this._credentials;
    if (enabled === this._protocolRequestInterceptionEnabled) return;
    this._protocolRequestInterceptionEnabled = enabled;
    if (enabled) {
      await Promise.all([
        this._updateProtocolCacheDisabled(),
        this._client.send('Fetch.enable', {
          handleAuthRequests: true,
          patterns: [{ urlPattern: '*' }],
        }),
      ]);
    } else {
      await Promise.all([
        this._updateProtocolCacheDisabled(),
        this._client.send('Fetch.disable'),
      ]);
    }
  }

  _cacheDisabled(): boolean {
    return this._userCacheDisabled;
  }

  async _updateProtocolCacheDisabled(): Promise<void> {
    await this._client.send('Network.setCacheDisabled', {
      cacheDisabled: this._cacheDisabled(),
    });
  }

  _onRequestWillBeSent(event: Protocol.Network.RequestWillBeSentEvent): void {
    // Request interception doesn't happen for data URLs with Network Service.
    if (
      this._userRequestInterceptionEnabled &&
      !event.request.url.startsWith('data:')
    ) {
      const { requestId: networkRequestId } = event;

      this._networkEventManager.storeRequestWillBeSent(networkRequestId, event);

      /**
       * CDP may have sent a Fetch.requestPaused event already. Check for it.
       */
      const requestPausedEvent =
        this._networkEventManager.getRequestPaused(networkRequestId);
      if (requestPausedEvent) {
        const { requestId: fetchRequestId } = requestPausedEvent;
        this._onRequest(event, fetchRequestId);
        this._networkEventManager.forgetRequestPaused(networkRequestId);
      }

      return;
    }
    this._onRequest(event, null);
  }

  _onAuthRequired(event: Protocol.Fetch.AuthRequiredEvent): void {
    /* TODO(jacktfranklin): This is defined in protocol.d.ts but not
     * in an easily referrable way - we should look at exposing it.
     */
    type AuthResponse = 'Default' | 'CancelAuth' | 'ProvideCredentials';
    let response: AuthResponse = 'Default';
    if (this._attemptedAuthentications.has(event.requestId)) {
      response = 'CancelAuth';
    } else if (this._credentials) {
      response = 'ProvideCredentials';
      this._attemptedAuthentications.add(event.requestId);
    }
    const { username, password } = this._credentials || {
      username: undefined,
      password: undefined,
    };
    this._client
      .send('Fetch.continueWithAuth', {
        requestId: event.requestId,
        authChallengeResponse: { response, username, password },
      })
      .catch(debugError);
  }

  /**
   * CDP may send a Fetch.requestPaused without or before a
   * Network.requestWillBeSent
   *
   * CDP may send multiple Fetch.requestPaused
   * for the same Network.requestWillBeSent.
   *
   *
   */
  _onRequestPaused(event: Protocol.Fetch.RequestPausedEvent): void {
    if (
      !this._userRequestInterceptionEnabled &&
      this._protocolRequestInterceptionEnabled
    ) {
      this._client
        .send('Fetch.continueRequest', {
          requestId: event.requestId,
        })
        .catch(debugError);
    }

    const { networkId: networkRequestId, requestId: fetchRequestId } = event;

    if (!networkRequestId) {
      return;
    }

    const requestWillBeSentEvent = (() => {
      const requestWillBeSentEvent =
        this._networkEventManager.getRequestWillBeSent(networkRequestId);

      // redirect requests have the same `requestId`,
      if (
        requestWillBeSentEvent &&
        (requestWillBeSentEvent.request.url !== event.request.url ||
          requestWillBeSentEvent.request.method !== event.request.method)
      ) {
        this._networkEventManager.forgetRequestWillBeSent(networkRequestId);
        return;
      }
      return requestWillBeSentEvent;
    })();

    if (requestWillBeSentEvent) {
      this._onRequest(requestWillBeSentEvent, fetchRequestId);
    } else {
      this._networkEventManager.storeRequestPaused(networkRequestId, event);
    }
  }

  _onRequest(
    event: Protocol.Network.RequestWillBeSentEvent,
    fetchRequestId?: FetchRequestId
  ): void {
    let redirectChain = [];
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
        redirectResponseExtraInfo = this._networkEventManager
          .responseExtraInfo(event.requestId)
          .shift();
        if (!redirectResponseExtraInfo) {
          this._networkEventManager.queueRedirectInfo(event.requestId, {
            event,
            fetchRequestId,
          });
          return;
        }
      }

      const request = this._networkEventManager.getRequest(event.requestId);
      // If we connect late to the target, we could have missed the
      // requestWillBeSent event.
      if (request) {
        this._handleRequestRedirect(
          request,
          event.redirectResponse,
          redirectResponseExtraInfo
        );
        redirectChain = request._redirectChain;
      }
    }
    const frame = event.frameId
      ? this._frameManager.frame(event.frameId)
      : null;
    const request = new HTTPRequest(
      this._client,
      frame,
      fetchRequestId,
      this._userRequestInterceptionEnabled,
      event,
      redirectChain
    );
    this._networkEventManager.storeRequest(event.requestId, request);
    this.emit(NetworkManagerEmittedEvents.Request, request);
    request.finalizeInterceptions();
  }

  _onRequestServedFromCache(
    event: Protocol.Network.RequestServedFromCacheEvent
  ): void {
    const request = this._networkEventManager.getRequest(event.requestId);
    if (request) request._fromMemoryCache = true;
    this.emit(NetworkManagerEmittedEvents.RequestServedFromCache, request);
  }

  _handleRequestRedirect(
    request: HTTPRequest,
    responsePayload: Protocol.Network.Response,
    extraInfo: Protocol.Network.ResponseReceivedExtraInfoEvent
  ): void {
    const response = new HTTPResponse(
      this._client,
      request,
      responsePayload,
      extraInfo
    );
    request._response = response;
    request._redirectChain.push(request);
    response._resolveBody(
      new Error('Response body is unavailable for redirect responses')
    );
    this._forgetRequest(request, false);
    this.emit(NetworkManagerEmittedEvents.Response, response);
    this.emit(NetworkManagerEmittedEvents.RequestFinished, request);
  }

  _emitResponseEvent(
    responseReceived: Protocol.Network.ResponseReceivedEvent,
    extraInfo: Protocol.Network.ResponseReceivedExtraInfoEvent | null
  ): void {
    const request = this._networkEventManager.getRequest(
      responseReceived.requestId
    );
    // FileUpload sends a response without a matching request.
    if (!request) return;

    const extraInfos = this._networkEventManager.responseExtraInfo(
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
      this._client,
      request,
      responseReceived.response,
      extraInfo
    );
    request._response = response;
    this.emit(NetworkManagerEmittedEvents.Response, response);
  }

  _onResponseReceived(event: Protocol.Network.ResponseReceivedEvent): void {
    const request = this._networkEventManager.getRequest(event.requestId);
    let extraInfo = null;
    if (request && !request._fromMemoryCache && event.hasExtraInfo) {
      extraInfo = this._networkEventManager
        .responseExtraInfo(event.requestId)
        .shift();
      if (!extraInfo) {
        // Wait until we get the corresponding ExtraInfo event.
        this._networkEventManager.queueEventGroup(event.requestId, {
          responseReceivedEvent: event,
        });
        return;
      }
    }
    this._emitResponseEvent(event, extraInfo);
  }

  _onResponseReceivedExtraInfo(
    event: Protocol.Network.ResponseReceivedExtraInfoEvent
  ): void {
    // We may have skipped a redirect response/request pair due to waiting for
    // this ExtraInfo event. If so, continue that work now that we have the
    // request.
    const redirectInfo = this._networkEventManager.takeQueuedRedirectInfo(
      event.requestId
    );
    if (redirectInfo) {
      this._networkEventManager.responseExtraInfo(event.requestId).push(event);
      this._onRequest(redirectInfo.event, redirectInfo.fetchRequestId);
      return;
    }

    // We may have skipped response and loading events because we didn't have
    // this ExtraInfo event yet. If so, emit those events now.
    const queuedEvents = this._networkEventManager.getQueuedEventGroup(
      event.requestId
    );
    if (queuedEvents) {
      this._emitResponseEvent(queuedEvents.responseReceivedEvent, event);
      if (queuedEvents.loadingFinishedEvent) {
        this._emitLoadingFinished(queuedEvents.loadingFinishedEvent);
      }
      if (queuedEvents.loadingFailedEvent) {
        this._emitLoadingFailed(queuedEvents.loadingFailedEvent);
      }
      return;
    }

    // Wait until we get another event that can use this ExtraInfo event.
    this._networkEventManager.responseExtraInfo(event.requestId).push(event);
  }

  _forgetRequest(request: HTTPRequest, events: boolean): void {
    const requestId = request._requestId;
    const interceptionId = request._interceptionId;

    this._networkEventManager.forgetRequest(requestId);
    this._attemptedAuthentications.delete(interceptionId);

    if (events) {
      this._networkEventManager.forget(requestId);
    }
  }

  _onLoadingFinished(event: Protocol.Network.LoadingFinishedEvent): void {
    // If the response event for this request is still waiting on a
    // corresponding ExtraInfo event, then wait to emit this event too.
    const queuedEvents = this._networkEventManager.getQueuedEventGroup(
      event.requestId
    );
    if (queuedEvents) {
      queuedEvents.loadingFinishedEvent = event;
    } else {
      this._emitLoadingFinished(event);
    }
  }

  _emitLoadingFinished(event: Protocol.Network.LoadingFinishedEvent): void {
    const request = this._networkEventManager.getRequest(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request) return;

    // Under certain conditions we never get the Network.responseReceived
    // event from protocol. @see https://crbug.com/883475
    if (request.response()) request.response()._resolveBody(null);
    this._forgetRequest(request, true);
    this.emit(NetworkManagerEmittedEvents.RequestFinished, request);
  }

  _onLoadingFailed(event: Protocol.Network.LoadingFailedEvent): void {
    // If the response event for this request is still waiting on a
    // corresponding ExtraInfo event, then wait to emit this event too.
    const queuedEvents = this._networkEventManager.getQueuedEventGroup(
      event.requestId
    );
    if (queuedEvents) {
      queuedEvents.loadingFailedEvent = event;
    } else {
      this._emitLoadingFailed(event);
    }
  }

  _emitLoadingFailed(event: Protocol.Network.LoadingFailedEvent): void {
    const request = this._networkEventManager.getRequest(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request) return;
    request._failureText = event.errorText;
    const response = request.response();
    if (response) response._resolveBody(null);
    this._forgetRequest(request, true);
    this.emit(NetworkManagerEmittedEvents.RequestFailed, request);
  }
}
