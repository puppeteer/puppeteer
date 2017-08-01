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
const helper = require('./helper');

class NetworkManager extends EventEmitter {
  /**
   * @param {!Session} client
   */
  constructor(client) {
    super();
    this._client = client;
    /** @type {!Map<string, !Request>} */
    this._requestIdToRequest = new Map();
    /** @type {!Map<string, string>} */
    this._interceptionIdToRequestId = new Map();
    /** @type {!Map<string, string>} */
    this._extraHTTPHeaders = new Map();

    this._requestInterceptionEnabled = false;
    /** @type {!Map<string, string>} */
    this._requestHashToRequestId = new Map();
    /** @type {!Map<string, !Object>} */
    this._requestHashToInterception = new Map();

    this._client.on('Network.requestWillBeSent', this._onRequestWillBeSent.bind(this));
    this._client.on('Network.requestIntercepted', this._onRequestIntercepted.bind(this));
    this._client.on('Network.responseReceived', this._onResponseReceived.bind(this));
    this._client.on('Network.loadingFinished', this._onLoadingFinished.bind(this));
    this._client.on('Network.loadingFailed', this._onLoadingFailed.bind(this));
  }

  /**
   * @param {!Map<string, string>} extraHTTPHeaders
   * @return {!Promise}
   */
  async setExtraHTTPHeaders(extraHTTPHeaders) {
    this._extraHTTPHeaders = new Map(extraHTTPHeaders);
    let headers = {};
    for (let entry of extraHTTPHeaders.entries())
      headers[entry[0]] = entry[1];
    await this._client.send('Network.setExtraHTTPHeaders', { headers });
  }

  /**
   * @return {!Map<string, string>}
   */
  extraHTTPHeaders() {
    return new Map(this._extraHTTPHeaders);
  }

  /**
   * @param {string} userAgent
   * @return {!Promise}
   */
  async setUserAgent(userAgent) {
    return this._client.send('Network.setUserAgentOverride', { userAgent });
  }

  /**
   * @param {boolean} value
   * @return {!Promise}
   */
  async setRequestInterceptionEnabled(value) {
    await this._client.send('Network.setRequestInterceptionEnabled', {enabled: !!value});
    this._requestInterceptionEnabled = value;
  }

  /**
   * @param {!Object} event
   */
  _onRequestIntercepted(event) {
    if (event.redirectStatusCode) {
      let requestId = this._interceptionIdToRequestId.get(event.interceptionId);
      console.assert(requestId, 'INTERNAL ERROR: failed to find requestId for interception.');
      let request = this._requestIdToRequest.get(requestId);
      this._handleRequestRedirect(request, event.redirectStatusCode, event.redirectHeaders);
      this._emitRequestEvent(requestId, event.interceptionId, event.redirectUrl, event.request);
      return;
    }
    let requestHash = generateRequestHash(event.request);
    this._requestHashToInterception.set(requestHash, event);
    this._maybeResolveInterception(requestHash);
  }

  /**
   * @param {!Request} request
   * @param {number} redirectStatus
   * @param {!Object} redirectHeaders
   */
  _handleRequestRedirect(request, redirectStatus, redirectHeaders) {
    let response = new Response(this._client, request, redirectStatus, redirectHeaders);
    request._response = response;
    this.emit(NetworkManager.Events.Response, response);
    this.emit(NetworkManager.Events.RequestFinished, request);
  }

  /**
   * @param {string} requestId
   * @param {string} interceptionId
   * @param {string} url
   * @param {!Object} requestPayload
   */
  _emitRequestEvent(requestId, interceptionId, url, requestPayload) {
    let request = new Request(this._client, requestId, interceptionId, url, requestPayload);
    this._requestIdToRequest.set(requestId, request);
    this._interceptionIdToRequestId.set(interceptionId, requestId);
    this.emit(NetworkManager.Events.Request, request);
  }

  /**
   * @param {!Object} event
   */
  _onRequestWillBeSent(event) {
    if (this._requestInterceptionEnabled) {
      // All redirects are handled in requestIntercepted.
      if (event.redirectResponse)
        return;
      let requestHash = generateRequestHash(event.request);
      this._requestHashToRequestId.set(requestHash, event.requestId);
      this._maybeResolveInterception(requestHash);
      return;
    }
    if (event.redirectResponse) {
      let request = this._requestIdToRequest.get(event.requestId);
      this._handleRequestRedirect(request, event.redirectResponse.status, event.redirectResponse.headers);
    }
    this._emitRequestEvent(event.requestId, null, event.request.url, event.request);
  }

  /**
   * @param {string} requestHash
   * @param {!{requestEvent: ?Object, interceptionEvent: ?Object}} interception
   */
  _maybeResolveInterception(requestHash) {
    const requestId = this._requestHashToRequestId.get(requestHash);
    const interception = this._requestHashToInterception.get(requestHash);
    if (!requestId || !interception)
      return;
    this._requestHashToRequestId.delete(requestHash);
    this._requestHashToInterception.delete(requestHash);
    this._emitRequestEvent(requestId, interception.interceptionId, interception.request.url, interception.request);
  }

  /**
   * @param {!Object} event
   */
  _onResponseReceived(event) {
    let request = this._requestIdToRequest.get(event.requestId);
    // FileUpload sends a response without a matching request.
    if (!request)
      return;
    let response = new Response(this._client, request, event.response.status, event.response.headers);
    request._response = response;
    this.emit(NetworkManager.Events.Response, response);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFinished(event) {
    let request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request)
      return;
    request._completePromiseFulfill.call(null);
    this._requestIdToRequest.delete(event.requestId);
    this._interceptionIdToRequestId.delete(event.interceptionId);
    this.emit(NetworkManager.Events.RequestFinished, request);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFailed(event) {
    let request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request)
      return;
    request._completePromiseFulfill.call(null);
    this._requestIdToRequest.delete(event.requestId);
    this._interceptionIdToRequestId.delete(event.interceptionId);
    this.emit(NetworkManager.Events.RequestFailed, request);
  }
}

class Request {
  /**
   * @param {!Connection} client
   * @param {string} requestId
   * @param {string} interceptionId
   * @param {string} url
   * @param {!Object} payload
   */
  constructor(client, requestId, interceptionId, url, payload) {
    this._client = client;
    this._requestId = requestId;
    this._interceptionId = interceptionId;
    this._interceptionHandled = false;
    this._response = null;
    this._completePromise = new Promise(fulfill => {
      this._completePromiseFulfill = fulfill;
    });

    this.url = url;
    this.method = payload.method;
    this.postData = payload.postData;
    this.headers = new Map(Object.entries(payload.headers));
  }

  /**
   * @return {?Response}
   */
  response() {
    return this._response;
  }

  /**
   * @param {!Object=} overrides
   */
  continue(overrides = {}) {
    console.assert(this._interceptionId, 'Request Interception is not enabled!');
    console.assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;
    let headers = undefined;
    if (overrides.headers) {
      headers = {};
      for (let entry of overrides.headers)
        headers[entry[0]] = entry[1];
    }
    this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      url: overrides.url,
      method: overrides.method,
      postData: overrides.postData,
      headers: headers
    });
  }

  abort() {
    console.assert(this._interceptionId, 'Request Interception is not enabled!');
    console.assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;
    this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      errorReason: 'Failed'
    });
  }
}
helper.tracePublicAPI(Request);

class Response {
  /**
   * @param {!Session} client
   * @param {!Request} request
   * @param {integer} status
   * @param {!Object} headers
   */
  constructor(client, request, status, headers) {
    this._client = client;
    this._request = request;
    this._contentPromise = null;

    this.headers = new Map(Object.entries(headers));
    this.status = status;
    this.ok = status >= 200 && status <= 299;
    this.url = request.url;
  }

  /**
   * @return {!Promise<!Buffer>}
   */
  buffer() {
    if (!this._contentPromise) {
      this._contentPromise = this._request._completePromise.then(async() => {
        let response = await this._client.send('Network.getResponseBody', {
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
    let content = await this.buffer();
    return content.toString('utf8');
  }

  /**
   * @return {!Promise<!Object>}
   */
  async json() {
    let content = await this.text();
    return JSON.parse(content);
  }

  /**
   * @return {!Response}
   */
  request() {
    return this._request;
  }
}
helper.tracePublicAPI(Response);

/**
 * @param {!Object} request
 * @return {string}
 */
function generateRequestHash(request) {
  let hash = {
    url: request.url,
    method: request.method,
    postData: request.postData,
    headers: {},
  };
  let headers = Object.keys(request.headers);
  headers.sort();
  for (let header of headers) {
    if (header === 'Accept' || header === 'Referer')
      continue;
    hash.headers[header] = request.headers[header];
  }
  return JSON.stringify(hash);
}

NetworkManager.Events = {
  Request: 'request',
  Response: 'response',
  RequestFailed: 'requestfailed',
  RequestFinished: 'requestfinished',
};

module.exports = NetworkManager;
