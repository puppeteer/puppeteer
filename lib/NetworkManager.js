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
   * @param {!Connection} client
   */
  constructor(client) {
    super();
    this._client = client;
    /** @type {!Map<string, !Request>} */
    this._idToRequest = new Map();
    /** @type {!Map<string, string>} */
    this._extraHTTPHeaders = new Map();

    this._requestInterceptionEnabled = false;
    /** @type {!Map<string, !{requestEvent: ?Object, interceptionEvent: ?Object}>} */
    this._interceptions = new Map();

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
    let requestHash = generateRequestHash(event.request);
    let interception = this._ensureInterception(requestHash);
    interception.interceptionEvent = event;
    this._maybeResolveInterception(requestHash, interception);
  }

  /**
   * @param {!Object} event
   */
  _onRequestWillBeSent(event) {
    if (event.redirectResponse) {
      let request = this._idToRequest.get(event.requestId);
      let response = new Response(this._client, request, event.redirectResponse);
      request._response = response;
      this.emit(NetworkManager.Events.Response, response);
      this.emit(NetworkManager.Events.RequestFinished, request);
    }
    if (!this._requestInterceptionEnabled) {
      let request = new Request(this._client, event.requestId, null, event.request);
      this._idToRequest.set(event.requestId, request);
      this.emit(NetworkManager.Events.Request, request);
      return;
    }
    let requestHash = generateRequestHash(event.request);
    let interception = this._ensureInterception(requestHash);
    interception.requestEvent = event;
    this._maybeResolveInterception(requestHash, interception);
  }

  /**
   * @param {string} requestHash
   * @return {!{request: ?Object, interceptionId: ?string}}
   */
  _ensureInterception(requestHash) {
    let interception = this._interceptions.get(requestHash);
    if (!interception) {
      interception = { requestEvent: null, interceptionEvent: null };
      this._interceptions.set(requestHash, interception);
    }
    return interception;
  }

  /**
   * @param {string} requestHash
   * @param {!{requestEvent: ?Object, interceptionEvent: ?Object}} interception
   */
  _maybeResolveInterception(requestHash, interception) {
    const {requestEvent, interceptionEvent} = interception;
    if (!requestEvent || !interceptionEvent)
      return;
    this._interceptions.delete(requestHash);
    let request = new Request(this._client, requestEvent.requestId, interceptionEvent.interceptionId, requestEvent.request);
    this._idToRequest.set(requestEvent.requestId, request);
    this.emit(NetworkManager.Events.Request, request);
  }

  /**
   * @param {!Object} event
   */
  _onResponseReceived(event) {
    let request = this._idToRequest.get(event.requestId);
    // FileUpload sends a response without a matching request.
    if (!request)
      return;
    let response = new Response(this._client, request, event.response);
    request._response = response;
    this.emit(NetworkManager.Events.Response, response);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFinished(event) {
    let request = this._idToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://github.com/GoogleChrome/puppeteer/issues/168
    if (!request)
      return;
    request._completePromiseFulfill.call(null);
    this._idToRequest.delete(event.requestId);
    this.emit(NetworkManager.Events.RequestFinished, request);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFailed(event) {
    let request = this._idToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://github.com/GoogleChrome/puppeteer/issues/168
    if (!request)
      return;
    request._completePromiseFulfill.call(null);
    this._idToRequest.delete(event.requestId);
    this.emit(NetworkManager.Events.RequestFailed, request);
  }
}

class Request {
  /**
   * @param {!Connection} client
   * @param {string} requestId
   * @param {!Object} payload
   */
  constructor(client, requestId, interceptionId, payload) {
    this._client = client;
    this._requestId = requestId;
    this._interceptionId = interceptionId;
    this._interceptionHandled = false;
    this._response = null;
    this._completePromise = new Promise(fulfill => {
      this._completePromiseFulfill = fulfill;
    });

    this.url = payload.url;
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
    let headers = {};
    for (let entry of (overrides.headers || this.headers))
      headers[entry[0]] = entry[1];
    this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      url: overrides.url || this.url,
      method: overrides.method || this.method,
      postData: overrides.postData || this.postData,
      headers: headers
    });
  }

  abort() {
    console.assert(this._interceptionId, 'Request Interception is not enabled!');
    console.assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;
    this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      errorReason: 'Aborted'
    });
  }
}
helper.tracePublicAPI(Request);

class Response {
  /**
   * @param {!Connection} client
   * @param {?Request} request
   * @param {!Object} payload
   */
  constructor(client, request, payload) {
    this._client = client;
    this._request = request;
    this._contentPromise = null;

    this.headers = new Map(Object.entries(payload.headers));
    this.ok = payload.status >= 200 && payload.status <= 299;
    this.status = payload.status;
    this.statusText = payload.statusText;
    this.url = payload.url;
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
   * @return {?Response}
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
