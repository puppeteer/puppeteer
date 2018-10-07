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
const Multimap = require('./Multimap');

class NetworkManager extends EventEmitter {
  /**
   * @param {!Puppeteer.CDPSession} client
   */
  constructor(client) {
    super();
    this._client = client;
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
    /** @type {!Multimap<string, string>} */
    this._requestHashToRequestIds = new Multimap();
    /** @type {!Multimap<string, string>} */
    this._requestHashToInterceptionIds = new Multimap();

    this._client.on('Network.requestWillBeSent', this._onRequestWillBeSent.bind(this));
    this._client.on('Network.requestIntercepted', this._onRequestIntercepted.bind(this));
    this._client.on('Network.requestServedFromCache', this._onRequestServedFromCache.bind(this));
    this._client.on('Network.responseReceived', this._onResponseReceived.bind(this));
    this._client.on('Network.loadingFinished', this._onLoadingFinished.bind(this));
    this._client.on('Network.loadingFailed', this._onLoadingFailed.bind(this));
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
    const patterns = enabled ? [{urlPattern: '*'}] : [];
    await Promise.all([
      this._client.send('Network.setCacheDisabled', {cacheDisabled: enabled}),
      this._client.send('Network.setRequestInterception', {patterns})
    ]);
  }

  /**
   * @param {!Protocol.Network.requestWillBeSentPayload} event
   */
  _onRequestWillBeSent(event) {
    if (this._protocolRequestInterceptionEnabled) {
      const requestHash = generateRequestHash(event.request);
      const interceptionId = this._requestHashToInterceptionIds.firstValue(requestHash);
      if (interceptionId) {
        this._onRequest(event, interceptionId);
        this._requestHashToInterceptionIds.delete(requestHash, interceptionId);
      } else {
        this._requestHashToRequestIds.set(requestHash, event.requestId);
        this._requestIdToRequestWillBeSentEvent.set(event.requestId, event);
      }
      return;
    }
    this._onRequest(event, null);
  }

  /**
   * @param {!Protocol.Network.requestInterceptedPayload} event
   */
  _onRequestIntercepted(event) {
    if (event.authChallenge) {
      /** @type {"Default"|"CancelAuth"|"ProvideCredentials"} */
      let response = 'Default';
      if (this._attemptedAuthentications.has(event.interceptionId)) {
        response = 'CancelAuth';
      } else if (this._credentials) {
        response = 'ProvideCredentials';
        this._attemptedAuthentications.add(event.interceptionId);
      }
      const {username, password} = this._credentials || {username: undefined, password: undefined};
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

    const requestHash = generateRequestHash(event.request);
    const requestId = this._requestHashToRequestIds.firstValue(requestHash);
    if (requestId) {
      const requestWillBeSentEvent = this._requestIdToRequestWillBeSentEvent.get(requestId);
      this._onRequest(requestWillBeSentEvent, event.interceptionId);
      this._requestHashToRequestIds.delete(requestHash, requestId);
      this._requestIdToRequestWillBeSentEvent.delete(requestId);
    } else {
      this._requestHashToInterceptionIds.set(requestHash, event.interceptionId);
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
    this.emit(NetworkManager.Events.Request, request);
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
    this.emit(NetworkManager.Events.Response, response);
    this.emit(NetworkManager.Events.RequestFinished, request);
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
    this.emit(NetworkManager.Events.Response, response);
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
    this.emit(NetworkManager.Events.RequestFinished, request);
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
    this.emit(NetworkManager.Events.RequestFailed, request);
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
   * @param {!Object=} overrides
   */
  async continue(overrides = {}) {
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
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

    const responseHeaders = {};
    if (response.headers) {
      for (const header of Object.keys(response.headers))
        responseHeaders[header.toLowerCase()] = response.headers[header];
    }
    if (response.contentType)
      responseHeaders['content-type'] = response.contentType;
    if (responseBody && !('content-length' in responseHeaders))
      responseHeaders['content-length'] = Buffer.byteLength(responseBody);

    const statusCode = response.status || 200;
    const statusText = statusTexts[statusCode] || '';
    const statusLine = `HTTP/1.1 ${statusCode} ${statusText}`;

    const CRLF = '\r\n';
    let text = statusLine + CRLF;
    for (const header of Object.keys(responseHeaders))
      text += header + ': ' + responseHeaders[header] + CRLF;
    text += CRLF;
    let responseBuffer = Buffer.from(text, 'utf8');
    if (responseBody)
      responseBuffer = Buffer.concat([responseBuffer, responseBody]);

    await this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      rawResponse: responseBuffer.toString('base64')
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
    const errorReason = errorReasons[errorCode];
    assert(errorReason, 'Unknown error code: ' + errorCode);
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;
    await this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
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

helper.tracePublicAPI(Request);

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
helper.tracePublicAPI(Response);

/**
 * @param {!Protocol.Network.Request} request
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

  if (!normalizedURL.startsWith('data:')) {
    const headers = Object.keys(request.headers);
    headers.sort();
    for (let header of headers) {
      const headerValue = request.headers[header];
      header = header.toLowerCase();
      if (header === 'accept' || header === 'referer' || header === 'x-devtools-emulate-network-conditions-client-id' || header === 'cookie')
        continue;
      hash.headers[header] = headerValue;
    }
  }
  return JSON.stringify(hash);
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

NetworkManager.Events = {
  Request: 'request',
  Response: 'response',
  RequestFailed: 'requestfailed',
  RequestFinished: 'requestfinished',
};

const statusTexts = {
  '100': 'Continue',
  '101': 'Switching Protocols',
  '102': 'Processing',
  '200': 'OK',
  '201': 'Created',
  '202': 'Accepted',
  '203': 'Non-Authoritative Information',
  '204': 'No Content',
  '206': 'Partial Content',
  '207': 'Multi-Status',
  '208': 'Already Reported',
  '209': 'IM Used',
  '300': 'Multiple Choices',
  '301': 'Moved Permanently',
  '302': 'Found',
  '303': 'See Other',
  '304': 'Not Modified',
  '305': 'Use Proxy',
  '306': 'Switch Proxy',
  '307': 'Temporary Redirect',
  '308': 'Permanent Redirect',
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '402': 'Payment Required',
  '403': 'Forbidden',
  '404': 'Not Found',
  '405': 'Method Not Allowed',
  '406': 'Not Acceptable',
  '407': 'Proxy Authentication Required',
  '408': 'Request Timeout',
  '409': 'Conflict',
  '410': 'Gone',
  '411': 'Length Required',
  '412': 'Precondition Failed',
  '413': 'Payload Too Large',
  '414': 'URI Too Long',
  '415': 'Unsupported Media Type',
  '416': 'Range Not Satisfiable',
  '417': 'Expectation Failed',
  '418': 'I\'m a teapot',
  '421': 'Misdirected Request',
  '422': 'Unprocessable Entity',
  '423': 'Locked',
  '424': 'Failed Dependency',
  '426': 'Upgrade Required',
  '428': 'Precondition Required',
  '429': 'Too Many Requests',
  '431': 'Request Header Fields Too Large',
  '451': 'Unavailable For Legal Reasons',
  '500': 'Internal Server Error',
  '501': 'Not Implemented',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
  '504': 'Gateway Timeout',
  '505': 'HTTP Version Not Supported',
  '506': 'Variant Also Negotiates',
  '507': 'Insufficient Storage',
  '508': 'Loop Detected',
  '510': 'Not Extended',
  '511': 'Network Authentication Required',
};

module.exports = {Request, Response, NetworkManager};
