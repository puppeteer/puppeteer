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
   * @param {string} userAgent
   */
  constructor(client, userAgent) {
    super();
    this._client = client;
    this._requestInterceptor = null;
    /* @type {!Map<string, !Request>} */
    this._idToRequest = new Map();
    this._httpHeaders = {};
    this._userAgent = userAgent;

    this._client.on('Network.requestWillBeSent', this._onRequestWillBeSent.bind(this));
    this._client.on('Network.requestIntercepted', this._onRequestIntercepted.bind(this));
    this._client.on('Network.responseReceived', this._onResponseReceived.bind(this));
    this._client.on('Network.loadingFinished', this._onLoadingFinished.bind(this));
    this._client.on('Network.loadingFailed', this._onLoadingFailed.bind(this));
  }

  /**
   * @param {!Object} headers
   * @return {!Promise}
   */
  async setHTTPHeaders(headers) {
    this._httpHeaders = {};
    // Note: header names are case-insensitive.
    for (let key of Object.keys(headers))
      this._httpHeaders[key.toLowerCase()] = headers[key];
    return this._client.send('Network.setExtraHTTPHeaders', { headers });
  }

  /**
   * @return {!Object}
   */
  httpHeaders() {
    return Object.assign({}, this._httpHeaders);
  }

  /**
   * @param {string} userAgent
   * @return {!Promise}
   */
  async setUserAgent(userAgent) {
    this._userAgent = userAgent;
    return this._client.send('Network.setUserAgentOverride', { userAgent });
  }

  /**
   * @return {string}
   */
  userAgent() {
    return this._userAgent;
  }

  /**
   * @param {?function(!InterceptedRequest)} interceptor
   * @return {!Promise}
   */
  async setRequestInterceptor(interceptor) {
    this._requestInterceptor = interceptor;
    await this._client.send('Network.setRequestInterceptionEnabled', {enabled: !!interceptor});
  }

  /**
   * @param {!Object} event
   */
  _onRequestIntercepted(event) {
    let request = new InterceptedRequest(this._client, event.interceptionId, event.request);
    this._requestInterceptor(request);
  }

  /**
   * @param {!Object} event
   */
  _onRequestWillBeSent(event) {
    if (event.redirectResponse) {
      let request = this._idToRequest.get(event.requestId);
      let response = new Response(request, event.redirectResponse, this._getResponseBody.bind(this, event.requestId));
      request._response = response;
      this.emit(NetworkManager.Events.Response, response);
      this.emit(NetworkManager.Events.RequestFinished, request);
    }
    let request = new Request(event.request);
    this._idToRequest.set(event.requestId, request);
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
    let response = new Response(request, event.response, this._getResponseBody.bind(this, event.requestId));
    request._response = response;
    this.emit(NetworkManager.Events.Response, response);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFinished(event) {
    let request = this._idToRequest.get(event.requestId);
    this._idToRequest.delete(event.requestId);
    this.emit(NetworkManager.Events.RequestFinished, request);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFailed(event) {
    let request = this._idToRequest.get(event.requestId);
    this._idToRequest.delete(event.requestId);
    this.emit(NetworkManager.Events.RequestFailed, request);
  }

  /**
   * @param {string} requestId
   * @return {!Promise<!Buffer>}
   */
  async _getResponseBody(requestId) {
    let response = await this._client.send('Network.getResponseBody', {requestId});
    return Buffer.from(response.body, response.base64Encoded ? 'base64' : 'utf8');
  }
}

class Headers {
  /**
   * @param {?Object} payload
   * @return {!Headers}
   */
  static fromPayload(payload) {
    let headers = new Headers();
    if (!payload)
      return headers;
    for (let key in payload)
      headers.set(key, payload[key]);
    return headers;
  }

  constructor() {
    /** @type {!Map<string, string>} */
    this._headers = new Map();
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  append(name, value) {
    name = name.toLowerCase();
    this._headers.set(name, value);
  }

  /**
   * @param {string} name
   */
  delete(name) {
    name = name.toLowerCase();
    this._headers.delete(name);
  }

  /**
   * @return {!Iterator}
   */
  entries() {
    return this._headers.entries();
  }

  /**
   * @param {string} name
   * @return {?string}
   */
  get(name) {
    name = name.toLowerCase();
    return this._headers.get(name);
  }

  /**
   * @param {string} name
   * @return {boolean}
   */
  has(name) {
    name = name.toLowerCase();
    return this._headers.has(name);
  }

  /**
   * @return {!Iterator}
   */
  keys() {
    return this._headers.keys();
  }

  /**
   * @return {!Iterator}
   */
  values() {
    return this._headers.values();
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  set(name, value) {
    name = name.toLowerCase();
    this._headers.set(name, value);
  }
}

class Body {
  /**
   * @param {function():!Promise<!Buffer>} contentCallback
   */
  constructor(contentCallback) {
    this._contentCallback = contentCallback;
    /** @type {?Promise<!Buffer>} */
    this._contentPromise = null;
  }

  /**
   * @return {!Promise<!Buffer>}
   */
  buffer() {
    if (!this._contentPromise)
      this._contentPromise = this._contentCallback();
    return this._contentPromise;
  }

  /**
   * @return {boolean}
   */
  get bodyUsed() {
    return !!this._contentPromise;
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
   * @return {!Promise<!ArrayBuffer>}
   */
  async arrayBuffer() {
    let content = await this.buffer();
    return content.buffer;
  }
}
helper.tracePublicAPI(Body);

class Request extends Body {
  /**
   * @param {!Object} payload
   */
  constructor(payload) {
    super(() => Promise.resolve(payload.postData || ''));
    this._response = null;
    this.url = payload.url;
    this.method = payload.method;
    this.headers = Headers.fromPayload(payload.headers);
  }

  /**
   * @return {?Response}
   */
  response() {
    return this._response;
  }
}
helper.tracePublicAPI(Request);

class Response extends Body {
  /**
   * @param {?Request} request
   * @param {!Object} payload
   * @param {function():!Promise<!Buffer>} contentCallback
   */
  constructor(request, payload, contentCallback) {
    super(contentCallback);
    this._request = request;
    this.headers = Headers.fromPayload(payload.headers);
    this.ok = payload.status >= 200 && payload.status <= 299;
    this.status = payload.status;
    this.statusText = payload.statusText;
    this.url = payload.url;
  }

  /**
   * @return {?Response}
   */
  request() {
    return this._request;
  }
}
helper.tracePublicAPI(Response);

class InterceptedRequest {
  /**
   * @param {!Connection} client
   * @param {string} interceptionId
   * @param {!Object} payload
   */
  constructor(client, interceptionId, payload) {
    this._client = client;
    this._interceptionId = interceptionId;
    this._handled = false;

    this.url = payload.url;
    this.method = payload.method;
    this.headers = Headers.fromPayload(payload.headers);
    this.postData = payload.postData;
  }

  abort() {
    console.assert(!this._handled, 'This request is already handled!');
    this._handled = true;
    this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      errorReason: 'Aborted'
    });
  }

  continue() {
    console.assert(!this._handled, 'This request is already handled!');
    this._handled = true;
    let headers = {};
    for (let entry of this.headers.entries())
      headers[entry[0]] = entry[1];
    this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      url: this.url,
      method: this.method,
      postData: this.postData,
      headers: headers
    });
  }

  /**
   * @return {boolean}
   */
  isHandled() {
    return this._handled;
  }
}

NetworkManager.Events = {
  Request: 'request',
  Response: 'response',
  RequestFailed: 'requestfailed',
  RequestFinished: 'requestfinished',
};

module.exports = NetworkManager;
