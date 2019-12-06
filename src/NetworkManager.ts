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
import EventEmitter from 'events';
import {helper, assert, debugError} from './helper';
import {Events} from './Events';
import { CDPSession } from './Connection';
import { FrameManager, Frame } from './FrameManager';

export class NetworkManager extends EventEmitter {
  _client: CDPSession
  _frameManager: FrameManager
  _offline = false
  _userRequestInterceptionEnabled = false
  _protocolRequestInterceptionEnabled = false
  _userCacheDisabled = false;
  _ignoreHTTPSErrors: boolean
  _requestIdToRequest = new Map<string, Request>();
  _requestIdToRequestWillBeSentEvent = new Map<string, Protocol.Network.requestWillBeSentPayload>();
  _extraHTTPHeaders: Record<string, string> = {};
  _credentials?: {username: string, password: string};
  _attemptedAuthentications = new Set<string>();
  _requestIdToInterceptionId = new Map<string, string>();
  
  constructor(client: CDPSession, ignoreHTTPSErrors: boolean, frameManager: FrameManager) {
    super();
    this._client = client;
    this._ignoreHTTPSErrors = ignoreHTTPSErrors;
    this._frameManager = frameManager;
    
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

  async authenticate(credentials?: {username: string, password: string}) {
    this._credentials = credentials;
    await this._updateProtocolRequestInterception();
  }

  async setExtraHTTPHeaders(extraHTTPHeaders: Record<string, string>) {
    this._extraHTTPHeaders = {};
    for (const key of Object.keys(extraHTTPHeaders)) {
      const value = extraHTTPHeaders[key];
      assert(helper.isString(value), `Expected value of header "${key}" to be String, but "${typeof value}" is found.`);
      this._extraHTTPHeaders[key.toLowerCase()] = value;
    }
    await this._client.send('Network.setExtraHTTPHeaders', { headers: this._extraHTTPHeaders });
  }

  extraHTTPHeaders(): Record<string, string> {
    return Object.assign({}, this._extraHTTPHeaders);
  }

  async setOfflineMode(value: boolean) {
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

  async setUserAgent(userAgent: string) {
    await this._client.send('Network.setUserAgentOverride', { userAgent });
  }

  async setCacheEnabled(enabled: boolean) {
    this._userCacheDisabled = !enabled;
    await this._updateProtocolCacheDisabled();
  }

  async setRequestInterception(value: boolean) {
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

  _onRequestWillBeSent(event: Protocol.Network.requestWillBeSentPayload) {
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

  _onAuthRequired(event: Protocol.Fetch.authRequiredPayload) {
    let response: Protocol.Network.AuthChallengeResponse['response'] = 'Default';
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

  _onRequestPaused(event: Protocol.Fetch.requestPausedPayload) {
    if (!this._userRequestInterceptionEnabled && this._protocolRequestInterceptionEnabled) {
      this._client.send('Fetch.continueRequest', {
        requestId: event.requestId
      }).catch(debugError);
    }

    const requestId = event.networkId;
    const interceptionId = event.requestId;
    if (requestId && this._requestIdToRequestWillBeSentEvent.has(requestId)) {
      const requestWillBeSentEvent = this._requestIdToRequestWillBeSentEvent.get(requestId)!;
      this._onRequest(requestWillBeSentEvent, interceptionId);
      this._requestIdToRequestWillBeSentEvent.delete(requestId);
    } else if (requestId) {
      this._requestIdToInterceptionId.set(requestId, interceptionId);
    }
  }

  _onRequest(event: Protocol.Network.requestWillBeSentPayload, interceptionId: string | null) {
    let redirectChain: Request[] = [];
    if (event.redirectResponse) {
      const request = this._requestIdToRequest.get(event.requestId);
      // If we connect late to the target, we could have missed the requestWillBeSent event.
      if (request) {
        this._handleRequestRedirect(request, event.redirectResponse);
        redirectChain = request._redirectChain;
      }
    }
    const frame = event.frameId ? this._frameManager.frame(event.frameId) : null;
    const request = new Request(this._client, frame, interceptionId!, this._userRequestInterceptionEnabled, event, redirectChain);
    this._requestIdToRequest.set(event.requestId, request);
    this.emit(Events.NetworkManager.Request, request);
  }

  _onRequestServedFromCache(event: Protocol.Network.requestServedFromCachePayload) {
    const request = this._requestIdToRequest.get(event.requestId);
    if (request)
      request._fromMemoryCache = true;
  }

  _handleRequestRedirect(request: Request, responsePayload: Protocol.Network.Response) {
    const response = new Response(this._client, request, responsePayload);
    request._response = response;
    request._redirectChain.push(request);
    response._bodyLoadedPromiseFulfill.call(null, new Error('Response body is unavailable for redirect responses'));
    this._requestIdToRequest.delete(request._requestId);
    if (request._interceptionId !== null) {
      this._attemptedAuthentications.delete(request._interceptionId);
    }
    this.emit(Events.NetworkManager.Response, response);
    this.emit(Events.NetworkManager.RequestFinished, request);
  }

  _onResponseReceived(event: Protocol.Network.responseReceivedPayload) {
    const request = this._requestIdToRequest.get(event.requestId);
    // FileUpload sends a response without a matching request.
    if (!request)
      return;
    const response = new Response(this._client, request, event.response);
    request._response = response;
    this.emit(Events.NetworkManager.Response, response);
  }

  _onLoadingFinished(event: Protocol.Network.loadingFinishedPayload) {
    const request = this._requestIdToRequest.get(event.requestId);
    // For certain requestIds we never receive requestWillBeSent event.
    // @see https://crbug.com/750469
    if (!request)
      return;

    // Under certain conditions we never get the Network.responseReceived
    // event from protocol. @see https://crbug.com/883475
    if (request.response())
      request.response()!._bodyLoadedPromiseFulfill.call(null);
    this._requestIdToRequest.delete(request._requestId);
    if (request._interceptionId !== null) {
      this._attemptedAuthentications.delete(request._interceptionId);
    }
    this.emit(Events.NetworkManager.RequestFinished, request);
  }

  _onLoadingFailed(event: Protocol.Network.loadingFailedPayload) {
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
    if (request._interceptionId !== null) {
      this._attemptedAuthentications.delete(request._interceptionId);
    }
    this.emit(Events.NetworkManager.RequestFailed, request);
  }
}

export class Request {
  _client: CDPSession
  _requestId: string
  _interceptionId: string
  _allowInterception: boolean
  _interceptionHandled = false
  _isNavigationRequest: boolean
  _frame: Frame | null
  _redirectChain: Array<Request>
  _fromMemoryCache: boolean
  _headers: Record<string, string>
  _response: Response | null = null
  _failureText: string | null = null
  _url: string
  _resourceType: string
  _method: string
  _postData?: string
  
  constructor(client: CDPSession, frame: Frame | null, interceptionId: string, allowInterception: boolean, event: Protocol.Network.requestWillBeSentPayload, redirectChain: Array<Request>) {
    this._client = client;
    this._requestId = event.requestId;
    this._isNavigationRequest = event.requestId === event.loaderId && event.type === 'Document';
    this._interceptionId = interceptionId;
    this._allowInterception = allowInterception;

    this._url = event.request.url;
    this._resourceType = event.type !== undefined ? event.type.toLowerCase() : '';
    this._method = event.request.method;
    this._postData = event.request.postData;
    this._headers = {};
    this._frame = frame;
    this._redirectChain = redirectChain;
    for (const key of Object.keys(event.request.headers))
      this._headers[key.toLowerCase()] = (event.request.headers as Record<string, string>)[key];

    this._fromMemoryCache = false;
  }

  url(): string {
    return this._url;
  }

  resourceType(): string {
    return this._resourceType;
  }

  method(): string {
    return this._method;
  }

  postData(): string|undefined {
    return this._postData;
  }

  headers(): Record<string, string> {
    return this._headers;
  }

  response(): Response | null {
    return this._response;
  }

  frame(): Frame | null {
    return this._frame;
  }

  isNavigationRequest(): boolean {
    return this._isNavigationRequest;
  }

  redirectChain(): Array<Request> {
    return this._redirectChain.slice();
  }

  failure(): {errorText: string} | null {
    if (!this._failureText)
      return null;
    return {
      errorText: this._failureText
    };
  }

  async continue(overrides: {url?: string, method?:string, postData?: string, headers?: Record<string, string>} = {}) {
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

  async respond(response: {status: number, headers: object, contentType: string, body: (string|Buffer)}) {
    // Mocking responses for dataURL requests is not currently supported.
    if (this._url.startsWith('data:'))
      return;
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;

    const responseBody = response.body && helper.isString(response.body) ? Buffer.from(response.body) : (response.body || null);

    const responseHeaders:Record<string, string> = {};
    if (response.headers) {
      for (const header of Object.keys(response.headers))
        responseHeaders[header.toLowerCase()] = (response.headers as Record<string, string>)[header];
    }
    if (response.contentType)
      responseHeaders['content-type'] = response.contentType;
    if (responseBody && !('content-length' in responseHeaders))
      responseHeaders['content-length'] = String(Buffer.byteLength(responseBody));

    await this._client.send('Fetch.fulfillRequest', {
      requestId: this._interceptionId,
      responseCode: response.status || 200,
      responsePhrase: STATUS_TEXTS[response.status || 200],
      responseHeaders: headersArray(responseHeaders),
      body: responseBody ? responseBody.toString('base64') : undefined,
    }).catch(error => {
      // In certain cases, protocol will return error if the request was already canceled
      // or the page was closed. We should tolerate these errors.
      debugError(error);
    });
  }

  
  async abort(errorCode: keyof typeof errorReasons = 'failed') {
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
    }).catch((error: Error) => {
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
} as const;

export class Response {
  _client: CDPSession
  _request: Request
  _status: number
  _statusText: string;
  _url: string;
  _contentPromise: Promise<Buffer> | null = null;
  _remoteAddress: {ip?: string; port?: number;}
  _fromDiskCache: boolean;
  _fromServiceWorker: boolean;
  _headers: Record<string, string> = {};
  _securityDetails: SecurityDetails | null
  _bodyLoadedPromise: Promise<Error | undefined>
  _bodyLoadedPromiseFulfill!: (e?: Error) => void;

  constructor(client: CDPSession, request: Request, responsePayload: Protocol.Network.Response) {
    this._client = client;
    this._request = request;

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
    for (const key of Object.keys(responsePayload.headers))
      this._headers[key.toLowerCase()] = (responsePayload.headers as Record<string, string>)[key];
    this._securityDetails = responsePayload.securityDetails ? new SecurityDetails(responsePayload.securityDetails) : null;
  }

  remoteAddress() {
    return this._remoteAddress;
  }

  url(): string {
    return this._url;
  }

  
  ok(): boolean {
    return this._status === 0 || (this._status >= 200 && this._status <= 299);
  }

  
  status(): number {
    return this._status;
  }

  
  statusText(): string {
    return this._statusText;
  }

  
  headers(): object {
    return this._headers;
  }

  securityDetails(): SecurityDetails | null {
    return this._securityDetails;
  }

  
  buffer(): Promise<Buffer> {
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

  
  async text(): Promise<string> {
    const content = await this.buffer();
    return content.toString('utf8');
  }

  async json(): Promise<any> {
    const content = await this.text();
    return JSON.parse(content);
  }

  request(): Request {
    return this._request;
  }

  fromCache(): boolean {
    return this._fromDiskCache || this._request._fromMemoryCache;
  }

  fromServiceWorker(): boolean {
    return this._fromServiceWorker;
  }

  frame(): Frame | null {
    return this._request.frame();
  }
}

export class SecurityDetails {
  _subjectName: string
  _issuer: string
  _validFrom: number
  _validTo: number
  _protocol: string
  
  constructor(securityPayload: Protocol.Network.SecurityDetails) {
    this._subjectName = securityPayload['subjectName'];
    this._issuer = securityPayload['issuer'];
    this._validFrom = securityPayload['validFrom'];
    this._validTo = securityPayload['validTo'];
    this._protocol = securityPayload['protocol'];
  }

  subjectName(): string {
    return this._subjectName;
  }

  issuer(): string {
    return this._issuer;
  }

  validFrom(): number {
    return this._validFrom;
  }

  validTo(): number {
    return this._validTo;
  }

  protocol(): string {
    return this._protocol;
  }
}

function headersArray(headers: Record<string, string>): Array<{name: string, value: string}> {
  const result = [];
  for (const name in headers) {
    if (!Object.is(headers[name], undefined))
      result.push({name, value: headers[name] + ''});
  }
  return result;
}

// List taken from https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml with extra 306 and 418 codes.
const STATUS_TEXTS: Record<number, string> = {
  '100': 'Continue',
  '101': 'Switching Protocols',
  '102': 'Processing',
  '103': 'Early Hints',
  '200': 'OK',
  '201': 'Created',
  '202': 'Accepted',
  '203': 'Non-Authoritative Information',
  '204': 'No Content',
  '205': 'Reset Content',
  '206': 'Partial Content',
  '207': 'Multi-Status',
  '208': 'Already Reported',
  '226': 'IM Used',
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
  '425': 'Too Early',
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
