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
const EventEmitter = require('events');
const {helper, assert, debugError} = require('./helper');
const {Events} = require('./Events');

class NetworkManager extends EventEmitter {
  /**
   * @param {!Puppeteer.CDPSession} client
   */
  constructor(client, ignoreHTTPSErrors) {
    super();
    this._client = client;
    this._ignoreHTTPSErrors = ignoreHTTPSErrors;
    this._frameManager = null;
    /** @type {!Map<string, !Request>} */
    this._requestIdToRequest = new Map();
    /** @type {!Map<string, !Protocol.Network.requestWillBeSentPayload>} */
    this._requestIdToRequestWillBeSentEvent = new Map();
    /** @type {!Object<string, string>} */
    this._extraHTTPHeaders = {};

    this._offline = false;

    /** @type {?{username: string, password: string}} */
    this._credentials = null;
    /** @type {!Set<string>} */
    this._attemptedAuthentications = new Set();
    this._userRequestInterceptionEnabled = false;
    this._protocolRequestInterceptionEnabled = false;
    this._userCacheDisabled = false;
    /** @type {!Map<string, string>} */
    this._requestIdToInterceptionId = new Map();

    this._client.on('Fetch.requestPaused', this._onRequestPaused.bind(this));
    this._client.on('Fetch.authRequired', this._onAuthRequired.bind(this));
    this._client.on('Network.requestWillBeSent', this._onRequestWillBeSent.bind(this));
    this._client.on('Network.requestServedFromCache', this._onRequestServedFromCache.bind(this));
    this._client.on('Network.responseReceived', this._onResponseReceived.bind(this));
    this._client.on('Network.loadingFinished', this._onLoadingFinished.bind(this));
    this._client.on('Network.loadingFailed', this._onLoadingFailed.bind(this));
  }

  async initialize() {
    await this._client.send('Network.enable');
    if (this._ignoreHTTPSErrors)
      await this._client.send('Security.setIgnoreCertificateErrors', {ignore: true});
  }

  /**
   * @param {!Puppeteer.FrameManager} frameManager
   */
  setFrameManager(frameManager) {
    this._frameManager = frameManager;
  }

  /**
   * @param {?{username: string, password: string}} credentials
   */
  async authenticate(credentials) {
    this._credentials = credentials;
    await this._updateProtocolRequestInterception();
  }

  /**
   * @param {!Object<string, string>} extraHTTPHeaders
   */
  async setExtraHTTPHeaders(extraHTTPHeaders) {
    this._extraHTTPHeaders = {};
    for (const key of Object.keys(extraHTTPHeaders)) {
      const value = extraHTTPHeaders[key];
      assert(helper.isString(value), `Expected value of header "${key}" to be String, but "${typeof value}" is found.`);
      this._extraHTTPHeaders[key.toLowerCase()] = value;
    }
    await this._client.send('Network.setExtraHTTPHeaders', { headers: this._extraHTTPHeaders });
  }

  /**
   * @return {!Object<string, string>}
   */
  extraHTTPHeaders() {
    return Object.assign({}, this._extraHTTPHeaders);
  }

  /**
   * @param {boolean} value
   */
  async setOfflineMode(value) {
    if (this._offline === value)
      return;
    this._offline = value;
    await this._client.send('Network.emulateNetworkConditions', {
      offline: this._offline,
      // values of 0 remove any active throttling. crbug.com/456324#c9
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1
    });
  }

  /**
   * @param {string} userAgent
   */
  async setUserAgent(userAgent) {
    await this._client.send('Network.setUserAgentOverride', { userAgent });
  }

  /**
   * @param {boolean} enabled
   */
  async setCacheEnabled(enabled) {
    this._userCacheDisabled = !enabled;
    await this._updateProtocolCacheDisabled();
  }

  /**
   * @param {boolean} value
   */
  async setRequestInterception(value) {
    this._userRequestInterceptionEnabled = value;
    await this._updateProtocolRequestInterception();
  }

  async _updateProtocolRequestInterception() {
    const enabled = this._userRequestInterceptionEnabled || !!this._credentials;
    if (enabled === this._protocolRequestInterceptionEnabled)
      return;
    this._protocolRequestInterceptionEnabled = enabled;
    if (enabled) {
      await Promise.all([
        this._updateProtocolCacheDisabled(),
        this._client.send('Fetch.enable', {
          handleAuthRequests: true,
          patterns: [{urlPattern: '*'}],
        }),
      ]);
    } else {
      await Promise.all([
        this._updateProtocolCacheDisabled(),
        this._client.send('Fetch.disable')
      ]);
    }
  }

  async _updateProtocolCacheDisabled() {
    await this._client.send('Network.setCacheDisabled', {
      cacheDisabled: this._userCacheDisabled || this._protocolRequestInterceptionEnabled
    });
  }

  /**
   * @param {!Protocol.Network.requestWillBeSentPayload} event
   */
  _onRequestWillBeSent(event) {
    // Request interception doesn't happen for data URLs with Network Service.
    if (this._protocolRequestInterceptionEnabled && !event.request.url.startsWith('data:')) {
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
  _onAuthRequired(event) {
    /** @type {"Default"|"CancelAuth"|"ProvideCredentials"} */
    let response = 'Default';
    if (this._attemptedAuthentications.has(event.requestId)) {
      response = 'CancelAuth';
    } else if (this._credentials) {
      response = 'ProvideCredentials';
      this._attemptedAuthentications.add(event.requestId);
    }
    const {username, password} = this._credentials || {username: undefined, password: undefined};
    this._client.send('Fetch.continueWithAuth', {
      requestId: event.requestId,
      authChallengeResponse: { response, username, password },
    }).catch(debugError);
  }

  /**
   * @param {!Protocol.Fetch.requestPausedPayload} event
   */
  _onRequestPaused(event) {
    if (!this._userRequestInterceptionEnabled && this._protocolRequestInterceptionEnabled) {
      this._client.send('Fetch.continueRequest', {
        requestId: event.requestId
      }).catch(debugError);
    }

    const requestId = event.networkId;
    const interceptionId = event.requestId;
    if (requestId && this._requestIdToRequestWillBeSentEvent.has(requestId)) {
      const requestWillBeSentEvent = this._requestIdToRequestWillBeSentEvent.get(requestId);
      this._onRequest(requestWillBeSentEvent, interceptionId);
      this._requestIdToRequestWillBeSentEvent.delete(requestId);
    } else {
      this._requestIdToInterceptionId.set(requestId, interceptionId);
    }
  }

  /**
   * @param {!Protocol.Network.requestWillBeSentPayload} event
   * @param {?string} interceptionId
   */
  _onRequest(event, interceptionId) {
    let redirectChain = [];
    if (event.redirectResponse) {
      const request = this._requestIdToRequest.get(event.requestId);
      // If we connect late to the target, we could have missed the requestWillBeSent event.
      if (request) {
        this._handleRequestRedirect(request, event.redirectResponse);
        redirectChain = request._redirectChain;
      }
    }
    const frame = event.frameId && this._frameManager ? this._frameManager.frame(event.frameId) : null;
    const request = new Request(this._client, frame, interceptionId, this._userRequestInterceptionEnabled, event, redirectChain);
    this._requestIdToRequest.set(event.requestId, request);
    this.emit(Events.NetworkManager.Request, request);
  }


  /**
   * @param {!Protocol.Network.requestServedFromCachePayload} event
   */
  _onRequestServedFromCache(event) {
    const request = this._requestIdToRequest.get(event.requestId);
    if (request)
      request._fromMemoryCache = true;
  }

  /**
   * @param {!Request} request
   * @param {!Protocol.Network.Response} responsePayload
   */
  _handleRequestRedirect(request, responsePayload) {
    const response = new Response(this._client, request, responsePayload);
    request._response = response;
    request._redirectChain.push(request);
    response._bodyLoadedPromiseFulfill.call(null, new Error('Response body is unavailable for redirect responses'));
    this._requestIdToRequest.delete(request._requestId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(Events.NetworkManager.Response, response);
    this.emit(Events.NetworkManager.RequestFinished, request);
  }

  /**
   * @param {!Protocol.Network.responseReceivedPayload} event
   */
  _onResponseReceived(event) {
    const request = this._requestIdToRequest.get(event.requestId);
    // FileUpload sends a response without a matching request.
    if (!request)
      return;
    const response = new Response(this._client, request, event.response);
    request._response = response;
    this.emit(Events.NetworkManager.Response, response);
  }

  /**
   * @param {!Protocol.Network.loadingFinishedPayload} event
   */
  _onLoadingFinished(event) {
    const request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request)
      return;

    // Under certain conditions we never get the Network.responseReceived
    // event from protocol. @see https://crbug.com/883475
    if (request.response())
      request.response()._bodyLoadedPromiseFulfill.call(null);
    this._requestIdToRequest.delete(request._requestId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(Events.NetworkManager.RequestFinished, request);
  }

  /**
   * @param {!Protocol.Network.loadingFailedPayload} event
   */
  _onLoadingFailed(event) {
    const request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request)
      return;
    request._failureText = event.errorText;
    const response = request.response();
    if (response)
      response._bodyLoadedPromiseFulfill.call(null);
    this._requestIdToRequest.delete(request._requestId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(Events.NetworkManager.RequestFailed, request);
  }
}

class Request {
  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {?Puppeteer.Frame} frame
   * @param {string} interceptionId
   * @param {boolean} allowInterception
   * @param {!Protocol.Network.requestWillBeSentPayload} event
   * @param {!Array<!Request>} redirectChain
   */
  constructor(client, frame, interceptionId, allowInterception, event, redirectChain) {
    this._client = client;
    this._requestId = event.requestId;
    this._isNavigationRequest = event.requestId === event.loaderId && event.type === 'Document';
    this._interceptionId = interceptionId;
    this._allowInterception = allowInterception;
    this._interceptionHandled = false;
    this._response = null;
    this._failureText = null;

    this._url = event.request.url;
    this._resourceType = event.type.toLowerCase();
    this._method = event.request.method;
    this._postData = event.request.postData;
    this._headers = {};
    this._frame = frame;
    this._redirectChain = redirectChain;
    for (const key of Object.keys(event.request.headers))
      this._headers[key.toLowerCase()] = event.request.headers[key];

    this._fromMemoryCache = false;
  }

  /**
   * @return {string}
   */
  url() {
    return this._url;
  }

  /**
   * @return {string}
   */
  resourceType() {
    return this._resourceType;
  }

  /**
   * @return {string}
   */
  method() {
    return this._method;
  }

  /**
   * @return {string|undefined}
   */
  postData() {
    return this._postData;
  }

  /**
   * @return {!Object}
   */
  headers() {
    return this._headers;
  }

  /**
   * @return {?Response}
   */
  response() {
    return this._response;
  }

  /**
   * @return {?Puppeteer.Frame}
   */
  frame() {
    return this._frame;
  }

  /**
   * @return {boolean}
   */
  isNavigationRequest() {
    return this._isNavigationRequest;
  }

  /**
   * @return {!Array<!Request>}
   */
  redirectChain() {
    return this._redirectChain.slice();
  }

  /**
   * @return {?{errorText: string}}
   */
  failure() {
    if (!this._failureText)
      return null;
    return {
      errorText: this._failureText
    };
  }

  /**
   * @param {!{url?: string, method?:string, postData?: string, headers?: !Object}} overrides
   */
  async continue(overrides = {}) {
    // Request interception is not supported for data: urls.
    if (this._url.startsWith('data:'))
      return;
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    const {
      url,
      method,
      postData,
      headers
    } = overrides;
    this._interceptionHandled = true;
    await this._client.send('Fetch.continueRequest', {
      requestId: this._interceptionId,
      url,
      method,
      postData,
      headers: headers ? headersArray(headers) : undefined,
    }).catch(error => {
      // In certain cases, protocol will return error if the request was already canceled
      // or the page was closed. We should tolerate these errors.
      debugError(error);
    });
  }

  /**
   * @param {!{status: number, headers: Object, contentType: string, body: (string|Buffer)}} response
   */
  async respond(response) {
    // Mocking responses for dataURL requests is not currently supported.
    if (this._url.startsWith('data:'))
      return;
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;

    const responseBody = response.body && helper.isString(response.body) ? Buffer.from(/** @type {string} */(response.body)) : /** @type {?Buffer} */(response.body || null);

    /** @type {!Object<string, string>} */
    const responseHeaders = {};
    if (response.headers) {
      for (const header of Object.keys(response.headers))
        responseHeaders[header.toLowerCase()] = response.headers[header];
    }
    if (response.contentType)
      responseHeaders['content-type'] = response.contentType;
    if (responseBody && !('content-length' in responseHeaders))
      responseHeaders['content-length'] = String(Buffer.byteLength(responseBody));

    await this._client.send('Fetch.fulfillRequest', {
      requestId: this._interceptionId,
      responseCode: response.status || 200,
      responseHeaders: headersArray(responseHeaders),
      body: responseBody ? responseBody.toString('base64') : undefined,
    }).catch(error => {
      // In certain cases, protocol will return error if the request was already canceled
      // or the page was closed. We should tolerate these errors.
      debugError(error);
    });
  }

  /**
   * @param {string=} errorCode
   */
  async abort(errorCode = 'failed') {
    // Request interception is not supported for data: urls.
    if (this._url.startsWith('data:'))
      return;
    const errorReason = errorReasons[errorCode];
    assert(errorReason, 'Unknown error code: ' + errorCode);
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;
    await this._client.send('Fetch.failRequest', {
      requestId: this._interceptionId,
      errorReason
    }).catch(error => {
      // In certain cases, protocol will return error if the request was already canceled
      // or the page was closed. We should tolerate these errors.
      debugError(error);
    });
  }
}

const errorReasons = {
  'aborted': 'Aborted',
  'accessdenied': 'AccessDenied',
  'addressunreachable': 'AddressUnreachable',
  'blockedbyclient': 'BlockedByClient',
  'blockedbyresponse': 'BlockedByResponse',
  'connectionaborted': 'ConnectionAborted',
  'connectionclosed': 'ConnectionClosed',
  'connectionfailed': 'ConnectionFailed',
  'connectionrefused': 'ConnectionRefused',
  'connectionreset': 'ConnectionReset',
  'internetdisconnected': 'InternetDisconnected',
  'namenotresolved': 'NameNotResolved',
  'timedout': 'TimedOut',
  'failed': 'Failed',
};

class Response {
  /**
   * @param {!Puppeteer.CDPSession} client
   * @param {!Request} request
   * @param {!Protocol.Network.Response} responsePayload
   */
  constructor(client, request, responsePayload) {
    this._client = client;
    this._request = request;
    this._contentPromise = null;

    this._bodyLoadedPromise = new Promise(fulfill => {
      this._bodyLoadedPromiseFulfill = fulfill;
    });

    this._remoteAddress = {
      ip: responsePayload.remoteIPAddress,
      port: responsePayload.remotePort,
    };
    this._status = responsePayload.status;
    this._statusText = responsePayload.statusText;
    this._url = request.url();
    this._fromDiskCache = !!responsePayload.fromDiskCache;
    this._fromServiceWorker = !!responsePayload.fromServiceWorker;
    this._headers = {};
    for (const key of Object.keys(responsePayload.headers))
      this._headers[key.toLowerCase()] = responsePayload.headers[key];
    this._securityDetails = responsePayload.securityDetails ? new SecurityDetails(responsePayload.securityDetails) : null;
  }

  /**
   * @return {{ip: string, port: number}}
   */
  remoteAddress() {
    return this._remoteAddress;
  }

  /**
   * @return {string}
   */
  url() {
    return this._url;
  }

  /**
   * @return {boolean}
   */
  ok() {
    return this._status === 0 || (this._status >= 200 && this._status <= 299);
  }

  /**
   * @return {number}
   */
  status() {
    return this._status;
  }

  /**
   * @return {string}
   */
  statusText() {
    return this._statusText;
  }

  /**
   * @return {!Object}
   */
  headers() {
    return this._headers;
  }

  /**
   * @return {?SecurityDetails}
   */
  securityDetails() {
    return this._securityDetails;
  }

  /**
   * @return {!Promise<!Buffer>}
   */
  buffer() {
    if (!this._contentPromise) {
      this._contentPromise = this._bodyLoadedPromise.then(async error => {
        if (error)
          throw error;
        const response = await this._client.send('Network.getResponseBody', {
          requestId: this._request._requestId
        });
        return Buffer.from(response.body, response.base64Encoded ? 'base64' : 'utf8');
      });
    }
    return this._contentPromise;
  }

  /**
   * @return {!Promise<string>}
   */
  async text() {
    const content = await this.buffer();
    return content.toString('utf8');
  }

  /**
   * @return {!Promise<!Object>}
   */
  async json() {
    const content = await this.text();
    return JSON.parse(content);
  }

  /**
   * @return {!Request}
   */
  request() {
    return this._request;
  }

  /**
   * @return {boolean}
   */
  fromCache() {
    return this._fromDiskCache || this._request._fromMemoryCache;
  }

  /**
   * @return {boolean}
   */
  fromServiceWorker() {
    return this._fromServiceWorker;
  }

  /**
   * @return {?Puppeteer.Frame}
   */
  frame() {
    return this._request.frame();
  }
}

class SecurityDetails {
  /**
   * @param {!Protocol.Network.SecurityDetails} securityPayload
   */
  constructor(securityPayload) {
    this._subjectName = securityPayload['subjectName'];
    this._issuer = securityPayload['issuer'];
    this._validFrom = securityPayload['validFrom'];
    this._validTo = securityPayload['validTo'];
    this._protocol = securityPayload['protocol'];
  }

  /**
   * @return {string}
   */
  subjectName() {
    return this._subjectName;
  }

  /**
   * @return {string}
   */
  issuer() {
    return this._issuer;
  }

  /**
   * @return {number}
   */
  validFrom() {
    return this._validFrom;
  }

  /**
   * @return {number}
   */
  validTo() {
    return this._validTo;
  }

  /**
   * @return {string}
   */
  protocol() {
    return this._protocol;
  }
}

/**
 * @param {Object<string, string>} headers
 * @return {!Array<{name: string, value: string}>}
 */
function headersArray(headers) {
  const result = [];
  for (const name in headers)
    result.push({name, value: headers[name] + ''});
  return result;
}

module.exports = {Request, Response, NetworkManager, SecurityDetails};
