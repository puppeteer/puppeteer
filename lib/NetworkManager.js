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
const {helper, debugError} = require('./helper');
const Multimap = require('./Multimap');
const url = require('url');

class NetworkManager extends EventEmitter {
  /**
   * @param {!Session} client
   */
  constructor(client) {
    super();
    this._client = client;
    /** @type {!Map<string, !Request>} */
    this._requestIdToRequest = new Map();
    /** @type {!Map<string, !Request>} */
    this._interceptionIdToRequest = new Map();
    /** @type {!Object<string, string>} */
    this._extraHTTPHeaders = {};

    /** @type {?{username: string, password: string}} */
    this._credentials = null;
    /** @type {!Set<string>} */
    this._attemptedAuthentications = new Set();
    this._userRequestInterceptionEnabled = false;
    this._protocolRequestInterceptionEnabled = false;
    /** @type {!Multimap<string, string>} */
    this._requestHashToRequestIds = new Multimap();
    /** @type {!Multimap<string, !Object>} */
    this._requestHashToInterceptions = new Multimap();

    this._client.on('Network.requestWillBeSent', this._onRequestWillBeSent.bind(this));
    this._client.on('Network.requestIntercepted', this._onRequestIntercepted.bind(this));
    this._client.on('Network.responseReceived', this._onResponseReceived.bind(this));
    this._client.on('Network.loadingFinished', this._onLoadingFinished.bind(this));
    this._client.on('Network.loadingFailed', this._onLoadingFailed.bind(this));
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
      console.assert(helper.isString(value), `Expected value of header "${key}" to be String, but "${typeof value}" is found.`);
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
   * @param {string} userAgent
   */
  async setUserAgent(userAgent) {
    await this._client.send('Network.setUserAgentOverride', { userAgent });
  }

  /**
   * @param {boolean} value
   */
  async setRequestInterceptionEnabled(value) {
    this._userRequestInterceptionEnabled = value;
    await this._updateProtocolRequestInterception();
  }

  async _updateProtocolRequestInterception() {
    const enabled = this._userRequestInterceptionEnabled || !!this._credentials;
    if (enabled === this._protocolRequestInterceptionEnabled)
      return;
    this._protocolRequestInterceptionEnabled = enabled;
    await this._client.send('Network.setRequestInterceptionEnabled', {enabled});
  }

  /**
   * @param {!Object} event
   */
  _onRequestIntercepted(event) {
    // Strip out url hash to be consistent with requestWillBeSent. @see crbug.com/755456
    event.request.url = removeURLHash(event.request.url);

    if (event.authChallenge) {
      let response = 'Default';
      if (this._attemptedAuthentications.has(event.interceptionId)) {
        response = 'CancelAuth';
      } else if (this._credentials) {
        response = 'ProvideCredentials';
        this._attemptedAuthentications.add(event.interceptionId);
      }
      const {username, password} = this._credentials || {};
      this._client.send('Network.continueInterceptedRequest', {
        interceptionId: event.interceptionId,
        authChallengeResponse: { response, username, password }
      }).catch(debugError);
      return;
    }
    if (!this._userRequestInterceptionEnabled && this._protocolRequestInterceptionEnabled) {
      this._client.send('Network.continueInterceptedRequest', {
        interceptionId: event.interceptionId
      }).catch(debugError);
    }

    if (event.redirectStatusCode) {
      const request = this._interceptionIdToRequest.get(event.interceptionId);
      console.assert(request, 'INTERNAL ERROR: failed to find request for interception redirect.');
      this._handleRequestRedirect(request, event.redirectStatusCode, event.redirectHeaders);
      this._handleRequestStart(request._requestId, event.interceptionId, event.redirectUrl, event.resourceType, event.request);
      return;
    }
    const requestHash = generateRequestHash(event.request);
    this._requestHashToInterceptions.set(requestHash, event);
    this._maybeResolveInterception(requestHash);
  }

  /**
   * @param {!Request} request
   * @param {number} redirectStatus
   * @param {!Object} redirectHeaders
   */
  _handleRequestRedirect(request, redirectStatus, redirectHeaders) {
    const response = new Response(this._client, request, redirectStatus, redirectHeaders);
    request._response = response;
    this._requestIdToRequest.delete(request._requestId);
    this._interceptionIdToRequest.delete(request._interceptionId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(NetworkManager.Events.Response, response);
    this.emit(NetworkManager.Events.RequestFinished, request);
  }

  /**
   * @param {string} requestId
   * @param {string} interceptionId
   * @param {string} url
   * @param {string} resourceType
   * @param {!Object} requestPayload
   */
  _handleRequestStart(requestId, interceptionId, url, resourceType, requestPayload) {
    const request = new Request(this._client, requestId, interceptionId, this._userRequestInterceptionEnabled, url, resourceType, requestPayload);
    this._requestIdToRequest.set(requestId, request);
    this._interceptionIdToRequest.set(interceptionId, request);
    this.emit(NetworkManager.Events.Request, request);
  }

  /**
   * @param {!Object} event
   */
  _onRequestWillBeSent(event) {
    if (this._protocolRequestInterceptionEnabled && !event.request.url.startsWith('data:')) {
      // All redirects are handled in requestIntercepted.
      if (event.redirectResponse)
        return;
      const requestHash = generateRequestHash(event.request);
      this._requestHashToRequestIds.set(requestHash, event.requestId);
      this._maybeResolveInterception(requestHash);
      return;
    }
    if (event.redirectResponse) {
      const request = this._requestIdToRequest.get(event.requestId);
      this._handleRequestRedirect(request, event.redirectResponse.status, event.redirectResponse.headers);
    }
    this._handleRequestStart(event.requestId, null, event.request.url, event.type, event.request);
  }

  /**
   * @param {string} requestHash
   * @param {!{requestEvent: ?Object, interceptionEvent: ?Object}} interception
   */
  _maybeResolveInterception(requestHash) {
    const requestId = this._requestHashToRequestIds.firstValue(requestHash);
    const interception = this._requestHashToInterceptions.firstValue(requestHash);
    if (!requestId || !interception)
      return;
    this._requestHashToRequestIds.delete(requestHash, requestId);
    this._requestHashToInterceptions.delete(requestHash, interception);
    this._handleRequestStart(requestId, interception.interceptionId, interception.request.url, interception.resourceType, interception.request);
  }

  /**
   * @param {!Object} event
   */
  _onResponseReceived(event) {
    const request = this._requestIdToRequest.get(event.requestId);
    // FileUpload sends a response without a matching request.
    if (!request)
      return;
    const response = new Response(this._client, request, event.response.status, event.response.headers);
    request._response = response;
    this.emit(NetworkManager.Events.Response, response);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFinished(event) {
    const request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request)
      return;
    request._completePromiseFulfill.call(null);
    this._requestIdToRequest.delete(request._requestId);
    this._interceptionIdToRequest.delete(request._interceptionId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(NetworkManager.Events.RequestFinished, request);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFailed(event) {
    const request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request)
      return;
    request._completePromiseFulfill.call(null);
    this._requestIdToRequest.delete(request._requestId);
    this._interceptionIdToRequest.delete(request._interceptionId);
    this._attemptedAuthentications.delete(request._interceptionId);
    this.emit(NetworkManager.Events.RequestFailed, request);
  }
}

class Request {
  /**
   * @param {!Connection} client
   * @param {string} requestId
   * @param {string} interceptionId
   * @param {string} allowInterception
   * @param {string} url
   * @param {string} resourceType
   * @param {!Object} payload
   */
  constructor(client, requestId, interceptionId, allowInterception, url, resourceType, payload) {
    this._client = client;
    this._requestId = requestId;
    this._interceptionId = interceptionId;
    this._allowInterception = allowInterception;
    this._interceptionHandled = false;
    this._response = null;
    this._completePromise = new Promise(fulfill => {
      this._completePromiseFulfill = fulfill;
    });

    this.url = url;
    this.resourceType = resourceType;
    this.method = payload.method;
    this.postData = payload.postData;
    this.headers = {};
    for (const key of Object.keys(payload.headers))
      this.headers[key.toLowerCase()] = payload.headers[key];
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
  async continue(overrides = {}) {
    // DataURL's are not interceptable. In this case, do nothing.
    if (this.url.startsWith('data:'))
      return;
    console.assert(this._allowInterception, 'Request Interception is not enabled!');
    console.assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;
    await this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      url: overrides.url,
      method: overrides.method,
      postData: overrides.postData,
      headers: overrides.headers,
    }).catch(error => {
      // In certain cases, protocol will return error if the request was already canceled
      // or the page was closed. We should tolerate these errors.
      debugError(error);
    });
  }

  async abort() {
    // DataURL's are not interceptable. In this case, do nothing.
    if (this.url.startsWith('data:'))
      return;
    console.assert(this._allowInterception, 'Request Interception is not enabled!');
    console.assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;
    await this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      errorReason: 'Failed'
    }).catch(error => {
      // In certain cases, protocol will return error if the request was already canceled
      // or the page was closed. We should tolerate these errors.
      debugError(error);
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

    this.status = status;
    this.ok = status >= 200 && status <= 299;
    this.url = request.url;
    this.headers = {};
    for (const key of Object.keys(headers))
      this.headers[key.toLowerCase()] = headers[key];
  }

  /**
   * @return {!Promise<!Buffer>}
   */
  buffer() {
    if (!this._contentPromise) {
      this._contentPromise = this._request._completePromise.then(async() => {
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
  let normalizedURL = request.url;
  try {
    // Decoding is necessary to normalize URLs. @see crbug.com/759388
    // The method will throw if the URL is malformed. In this case,
    // consider URL to be normalized as-is.
    normalizedURL = decodeURI(request.url);
  } catch (e) {
  }
  const hash = {
    url: normalizedURL,
    method: request.method,
    postData: request.postData,
    headers: {},
  };
  const headers = Object.keys(request.headers);
  headers.sort();
  for (const header of headers) {
    if (header === 'Accept' || header === 'Referer' || header === 'X-DevTools-Emulate-Network-Conditions-Client-Id')
      continue;
    hash.headers[header] = request.headers[header];
  }
  return JSON.stringify(hash);
}

/**
 * @param {string} urlString
 * @return {string}
 */
function removeURLHash(urlString) {
  const urlObject = url.parse(urlString);
  urlObject.hash = '';
  return url.format(urlObject);
}

NetworkManager.Events = {
  Request: 'request',
  Response: 'response',
  RequestFailed: 'requestfailed',
  RequestFinished: 'requestfinished',
};

module.exports = NetworkManager;
