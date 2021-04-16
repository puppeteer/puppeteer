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
import { EventEmitter } from './EventEmitter.js';
import { assert } from './assert.js';
import { helper, debugError } from './helper.js';
import { Protocol } from 'devtools-protocol';
import { CDPSession } from './Connection.js';
import { FrameManager } from './FrameManager.js';
import { HTTPRequest } from './HTTPRequest.js';
import { HTTPResponse } from './HTTPResponse.js';

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

/**
 * @internal
 */
export class NetworkManager extends EventEmitter {
  _client: CDPSession;
  _ignoreHTTPSErrors: boolean;
  _frameManager: FrameManager;
  _requestIdToRequest = new Map<string, HTTPRequest>();
  _requestIdToRequestWillBeSentEvent = new Map<
    string,
    Protocol.Network.RequestWillBeSentEvent
  >();
  _extraHTTPHeaders: Record<string, string> = {};
  _credentials?: Credentials = null;
  _attemptedAuthentications = new Set<string>();
  _userRequestInterceptionEnabled = false;
  _userRequestInterceptionCacheSafe = false;
  _protocolRequestInterceptionEnabled = false;
  _userCacheDisabled = false;
  _requestIdToInterceptionId = new Map<string, string>();
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

  async setUserAgent(userAgent: string): Promise<void> {
    await this._client.send('Network.setUserAgentOverride', { userAgent });
  }

  async setCacheEnabled(enabled: boolean): Promise<void> {
    this._userCacheDisabled = !enabled;
    await this._updateProtocolCacheDisabled();
  }

  async setRequestInterception(
    value: boolean,
    cacheSafe = false
  ): Promise<void> {
    this._userRequestInterceptionEnabled = value;
    this._userRequestInterceptionCacheSafe = cacheSafe;
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

  async _updateProtocolCacheDisabled(): Promise<void> {
    await this._client.send('Network.setCacheDisabled', {
      cacheDisabled:
        this._userCacheDisabled ||
        (this._userRequestInterceptionEnabled &&
          !this._userRequestInterceptionCacheSafe),
    });
  }

  _onRequestWillBeSent(event: Protocol.Network.RequestWillBeSentEvent): void {
    // Request interception doesn't happen for data URLs with Network Service.
    if (
      this._userRequestInterceptionEnabled &&
      !event.request.url.startsWith('data:')
    ) {
      const requestId = event.requestId;
      const interceptionId = this._requestIdToInterceptionId.get(requestId);
      if (interceptionId) {
        this._onRequest(event, interceptionId);
        this._requestIdToInterceptionId.delete(requestId);
      } else {
        this._requestIdToRequestWillBeSentEvent.set(event.requestId, event);
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

    const requestId = event.networkId;
    const interceptionId = event.requestId;
    if (requestId && this._requestIdToRequestWillBeSentEvent.has(requestId)) {
      const requestWillBeSentEvent = this._requestIdToRequestWillBeSentEvent.get(
        requestId
      );
      this._onRequest(requestWillBeSentEvent, interceptionId);
      this._requestIdToRequestWillBeSentEvent.delete(requestId);
    } else {
      this._requestIdToInterceptionId.set(requestId, interceptionId);
    }
  }

  _onRequest(
    event: Protocol.Network.RequestWillBeSentEvent,
    interceptionId?: string
  ): void {
    let redirectChain = [];
    if (event.redirectResponse) {
      const request = this._requestIdToRequest.get(event.requestId);
      // If we connect late to the target, we could have missed the
      // requestWillBeSent event.
      if (request) {
        this._handleRequestRedirect(request, event.redirectResponse);
        redirectChain = request._redirectChain;
      }
    }
    const frame = event.frameId
      ? this._frameManager.frame(event.frameId)
      : null;
    const request = new HTTPRequest(
      this._client,
      frame,
      interceptionId,
      this._userRequestInterceptionEnabled,
      event,
      redirectChain
    );
    this._requestIdToRequest.set(event.requestId, request);
    this.emit(NetworkManagerEmittedEvents.Request, request);
  }

  _onRequestServedFromCache(
    event: Protocol.Network.RequestServedFromCacheEvent
  ): void {
    const request = this._requestIdToRequest.get(event.requestId);
    if (request) request._fromMemoryCache = true;
    this.emit(NetworkManagerEmittedEvents.RequestServedFromCache, request);
  }

  _handleRequestRedirect(
    request: HTTPRequest,
    responsePayload: Protocol.Network.Response
  ): void {
    const response = new HTTPResponse(this._client, request, responsePayload);
    request._response = response;
    request._redirectChain.push(request);
    response._resolveBody(
      new Error('Response body is unavailable for redirect responses')
    );
    this._requestIdToRequest.delete(request._requestId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(NetworkManagerEmittedEvents.Response, response);
    this.emit(NetworkManagerEmittedEvents.RequestFinished, request);
  }

  _onResponseReceived(event: Protocol.Network.ResponseReceivedEvent): void {
    const request = this._requestIdToRequest.get(event.requestId);
    // FileUpload sends a response without a matching request.
    if (!request) return;
    const response = new HTTPResponse(this._client, request, event.response);
    request._response = response;
    this.emit(NetworkManagerEmittedEvents.Response, response);
  }

  _onLoadingFinished(event: Protocol.Network.LoadingFinishedEvent): void {
    const request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request) return;

    // Under certain conditions we never get the Network.responseReceived
    // event from protocol. @see https://crbug.com/883475
    if (request.response()) request.response()._resolveBody(null);
    this._requestIdToRequest.delete(request._requestId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(NetworkManagerEmittedEvents.RequestFinished, request);
  }

  _onLoadingFailed(event: Protocol.Network.LoadingFailedEvent): void {
    const request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request) return;
    request._failureText = event.errorText;
    const response = request.response();
    if (response) response._resolveBody(null);
    this._requestIdToRequest.delete(request._requestId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(NetworkManagerEmittedEvents.RequestFailed, request);
  }
}
