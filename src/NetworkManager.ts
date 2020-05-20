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
import * as EventEmitter from 'events';
import { helper, assert, debugError } from './helper';
import Protocol from './protocol';
import { Events } from './Events';
import { CDPSession } from './Connection';
import { FrameManager } from './FrameManager';
import { Request } from './Request';
import { Response } from './Response';

export interface Credentials {
  username: string;
  password: string;
}

export class NetworkManager extends EventEmitter {
  _client: CDPSession;
  _ignoreHTTPSErrors: boolean;
  _frameManager: FrameManager;
  _requestIdToRequest = new Map<string, Request>();
  _requestIdToRequestWillBeSentEvent = new Map<
    string,
    Protocol.Network.requestWillBeSentPayload
  >();
  _extraHTTPHeaders: Record<string, string> = {};
  _offline = false;
  _credentials?: Credentials = null;
  _attemptedAuthentications = new Set<string>();
  _userRequestInterceptionEnabled = false;
  _protocolRequestInterceptionEnabled = false;
  _userCacheDisabled = false;
  _requestIdToInterceptionId = new Map<string, string>();

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
    if (this._offline === value) return;
    this._offline = value;
    await this._client.send('Network.emulateNetworkConditions', {
      offline: this._offline,
      // values of 0 remove any active throttling. crbug.com/456324#c9
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
  }

  async setUserAgent(userAgent: string): Promise<void> {
    await this._client.send('Network.setUserAgentOverride', { userAgent });
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

  async _updateProtocolCacheDisabled(): Promise<void> {
    await this._client.send('Network.setCacheDisabled', {
      cacheDisabled:
        this._userCacheDisabled || this._protocolRequestInterceptionEnabled,
    });
  }

  _onRequestWillBeSent(event: Protocol.Network.requestWillBeSentPayload): void {
    // Request interception doesn't happen for data URLs with Network Service.
    if (
      this._protocolRequestInterceptionEnabled &&
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

  /**
   * @param {!Protocol.Fetch.authRequiredPayload} event
   */
  _onAuthRequired(event: Protocol.Fetch.authRequiredPayload): void {
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

  _onRequestPaused(event: Protocol.Fetch.requestPausedPayload): void {
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
    event: Protocol.Network.requestWillBeSentPayload,
    interceptionId?: string
  ): void {
    let redirectChain = [];
    if (event.redirectResponse) {
      const request = this._requestIdToRequest.get(event.requestId);
      // If we connect late to the target, we could have missed the requestWillBeSent event.
      if (request) {
        this._handleRequestRedirect(request, event.redirectResponse);
        redirectChain = request._redirectChain;
      }
    }
    const frame = event.frameId
      ? this._frameManager.frame(event.frameId)
      : null;
    const request = new Request(
      this._client,
      frame,
      interceptionId,
      this._userRequestInterceptionEnabled,
      event,
      redirectChain
    );
    this._requestIdToRequest.set(event.requestId, request);
    this.emit(Events.NetworkManager.Request, request);
  }

  _onRequestServedFromCache(
    event: Protocol.Network.requestServedFromCachePayload
  ): void {
    const request = this._requestIdToRequest.get(event.requestId);
    if (request) request._fromMemoryCache = true;
  }

  _handleRequestRedirect(
    request: Request,
    responsePayload: Protocol.Network.Response
  ): void {
    const response = new Response(this._client, request, responsePayload);
    request._response = response;
    request._redirectChain.push(request);
    response._resolveBody(
      new Error('Response body is unavailable for redirect responses')
    );
    this._requestIdToRequest.delete(request._requestId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(Events.NetworkManager.Response, response);
    this.emit(Events.NetworkManager.RequestFinished, request);
  }

  _onResponseReceived(event: Protocol.Network.responseReceivedPayload): void {
    const request = this._requestIdToRequest.get(event.requestId);
    // FileUpload sends a response without a matching request.
    if (!request) return;
    const response = new Response(this._client, request, event.response);
    request._response = response;
    this.emit(Events.NetworkManager.Response, response);
  }

  _onLoadingFinished(event: Protocol.Network.loadingFinishedPayload): void {
    const request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request) return;

    // Under certain conditions we never get the Network.responseReceived
    // event from protocol. @see https://crbug.com/883475
    if (request.response()) request.response()._resolveBody(null);
    this._requestIdToRequest.delete(request._requestId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(Events.NetworkManager.RequestFinished, request);
  }

  _onLoadingFailed(event: Protocol.Network.loadingFailedPayload): void {
    const request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request) return;
    request._failureText = event.errorText;
    const response = request.response();
    if (response) response._resolveBody(null);
    this._requestIdToRequest.delete(request._requestId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(Events.NetworkManager.RequestFailed, request);
  }
}
