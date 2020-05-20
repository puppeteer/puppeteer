/**
 * Copyright 2020 Google Inc. All rights reserved.
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
import { CDPSession } from './Connection';
import { Frame } from './FrameManager';
import { Response } from './Response';
import { helper, assert, debugError } from './helper';
import Protocol from './protocol';

export class Request {
  _requestId: string;
  _interceptionId: string;
  _failureText = null;
  _response: Response | null = null;

  _fromMemoryCache = false;
  _redirectChain: Request[];

  private _client: CDPSession;
  private _isNavigationRequest: boolean;
  private _allowInterception: boolean;
  private _interceptionHandled = false;
  private _url: string;
  private _resourceType: string;

  private _method: string;
  private _postData?: string;
  private _headers: Record<string, string> = {};
  private _frame: Frame;

  constructor(
    client: CDPSession,
    frame: Frame,
    interceptionId: string,
    allowInterception: boolean,
    event: Protocol.Network.requestWillBeSentPayload,
    redirectChain: Request[]
  ) {
    this._client = client;
    this._requestId = event.requestId;
    this._isNavigationRequest =
      event.requestId === event.loaderId && event.type === 'Document';
    this._interceptionId = interceptionId;
    this._allowInterception = allowInterception;
    this._url = event.request.url;
    this._resourceType = event.type.toLowerCase();
    this._method = event.request.method;
    this._postData = event.request.postData;
    this._frame = frame;
    this._redirectChain = redirectChain;

    for (const key of Object.keys(event.request.headers))
      this._headers[key.toLowerCase()] = event.request.headers[key];
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

  postData(): string | undefined {
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

  redirectChain(): Request[] {
    return this._redirectChain.slice();
  }

  /**
   * @return {?{errorText: string}}
   */
  failure(): { errorText: string } | null {
    if (!this._failureText) return null;
    return {
      errorText: this._failureText,
    };
  }

  async continue(
    overrides: {
      url?: string;
      method?: string;
      postData?: string;
      headers?: Record<string, string>;
    } = {}
  ): Promise<void> {
    // Request interception is not supported for data: urls.
    if (this._url.startsWith('data:')) return;
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    const { url, method, postData, headers } = overrides;
    this._interceptionHandled = true;
    await this._client
      .send('Fetch.continueRequest', {
        requestId: this._interceptionId,
        url,
        method,
        postData,
        headers: headers ? headersArray(headers) : undefined,
      })
      .catch((error) => {
        // In certain cases, protocol will return error if the request was already canceled
        // or the page was closed. We should tolerate these errors.
        debugError(error);
      });
  }

  async respond(response: {
    status: number;
    headers: Record<string, string>;
    contentType: string;
    body: string | Buffer;
  }): Promise<void> {
    // Mocking responses for dataURL requests is not currently supported.
    if (this._url.startsWith('data:')) return;
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;

    const responseBody: Buffer | null =
      response.body && helper.isString(response.body)
        ? Buffer.from(response.body)
        : (response.body as Buffer) || null;

    const responseHeaders: Record<string, string> = {};
    if (response.headers) {
      for (const header of Object.keys(response.headers))
        responseHeaders[header.toLowerCase()] = response.headers[header];
    }
    if (response.contentType)
      responseHeaders['content-type'] = response.contentType;
    if (responseBody && !('content-length' in responseHeaders))
      responseHeaders['content-length'] = String(
        Buffer.byteLength(responseBody)
      );

    await this._client
      .send('Fetch.fulfillRequest', {
        requestId: this._interceptionId,
        responseCode: response.status || 200,
        responsePhrase: STATUS_TEXTS[response.status || 200],
        responseHeaders: headersArray(responseHeaders),
        body: responseBody ? responseBody.toString('base64') : undefined,
      })
      .catch((error) => {
        // In certain cases, protocol will return error if the request was already canceled
        // or the page was closed. We should tolerate these errors.
        debugError(error);
      });
  }

  async abort(errorCode: ErrorCode = 'failed'): Promise<void> {
    // Request interception is not supported for data: urls.
    if (this._url.startsWith('data:')) return;
    const errorReason = errorReasons[errorCode];
    assert(errorReason, 'Unknown error code: ' + errorCode);
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    this._interceptionHandled = true;
    await this._client
      .send('Fetch.failRequest', {
        requestId: this._interceptionId,
        errorReason,
      })
      .catch((error) => {
        // In certain cases, protocol will return error if the request was already canceled
        // or the page was closed. We should tolerate these errors.
        debugError(error);
      });
  }
}

type ErrorCode =
  | 'aborted'
  | 'accessdenied'
  | 'addressunreachable'
  | 'blockedbyclient'
  | 'blockedbyresponse'
  | 'connectionaborted'
  | 'connectionclosed'
  | 'connectionfailed'
  | 'connectionrefused'
  | 'connectionreset'
  | 'internetdisconnected'
  | 'namenotresolved'
  | 'timedout'
  | 'failed';

const errorReasons: Record<ErrorCode, Protocol.Network.ErrorReason> = {
  aborted: 'Aborted',
  accessdenied: 'AccessDenied',
  addressunreachable: 'AddressUnreachable',
  blockedbyclient: 'BlockedByClient',
  blockedbyresponse: 'BlockedByResponse',
  connectionaborted: 'ConnectionAborted',
  connectionclosed: 'ConnectionClosed',
  connectionfailed: 'ConnectionFailed',
  connectionrefused: 'ConnectionRefused',
  connectionreset: 'ConnectionReset',
  internetdisconnected: 'InternetDisconnected',
  namenotresolved: 'NameNotResolved',
  timedout: 'TimedOut',
  failed: 'Failed',
} as const;

function headersArray(
  headers: Record<string, string>
): Array<{ name: string; value: string }> {
  const result = [];
  for (const name in headers) {
    if (!Object.is(headers[name], undefined))
      result.push({ name, value: headers[name] + '' });
  }
  return result;
}

// List taken from https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml with extra 306 and 418 codes.
const STATUS_TEXTS = {
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
  '418': "I'm a teapot",
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
} as const;
