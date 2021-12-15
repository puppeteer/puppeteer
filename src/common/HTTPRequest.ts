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
import { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping.js';

import { EventEmitter } from './EventEmitter.js';
import { Frame } from './FrameManager.js';
import { HTTPResponse } from './HTTPResponse.js';
import { assert } from './assert.js';
import { helper, debugError } from './helper.js';
import { Protocol } from 'devtools-protocol';
import { ProtocolError } from './Errors.js';

/**
 * @public
 */
export interface ContinueRequestOverrides {
  /**
   * If set, the request URL will change. This is not a redirect.
   */
  url?: string;
  method?: string;
  postData?: string;
  headers?: Record<string, string>;
}

/**
 * @public
 */
export interface InterceptResolutionState {
  action: InterceptResolutionAction;
  priority?: number;
}

/**
 * Required response data to fulfill a request with.
 *
 * @public
 */
export interface ResponseForRequest {
  status: number;
  /**
   * Optional response headers. All values are converted to strings.
   */
  headers: Record<string, unknown>;
  contentType: string;
  body: string | Buffer;
}

/**
 * Resource types for HTTPRequests as perceived by the rendering engine.
 *
 * @public
 */
export type ResourceType = Lowercase<Protocol.Network.ResourceType>;

/**
 * The default cooperative request interception resolution priority
 *
 * @public
 */
export const DEFAULT_INTERCEPT_RESOLUTION_PRIORITY = 0;

interface CDPSession extends EventEmitter {
  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;
}

/**
 *
 * Represents an HTTP request sent by a page.
 * @remarks
 *
 * Whenever the page sends a request, such as for a network resource, the
 * following events are emitted by Puppeteer's `page`:
 *
 * - `request`:  emitted when the request is issued by the page.
 * - `requestfinished` - emitted when the response body is downloaded and the
 *   request is complete.
 *
 * If request fails at some point, then instead of `requestfinished` event the
 * `requestfailed` event is emitted.
 *
 * All of these events provide an instance of `HTTPRequest` representing the
 * request that occurred:
 *
 * ```
 * page.on('request', request => ...)
 * ```
 *
 * NOTE: HTTP Error responses, such as 404 or 503, are still successful
 * responses from HTTP standpoint, so request will complete with
 * `requestfinished` event.
 *
 * If request gets a 'redirect' response, the request is successfully finished
 * with the `requestfinished` event, and a new request is issued to a
 * redirected url.
 *
 * @public
 */
export class HTTPRequest {
  /**
   * @internal
   */
  _requestId: string;
  /**
   * @internal
   */
  _interceptionId: string;
  /**
   * @internal
   */
  _failureText = null;
  /**
   * @internal
   */
  _response: HTTPResponse | null = null;
  /**
   * @internal
   */
  _fromMemoryCache = false;
  /**
   * @internal
   */
  _redirectChain: HTTPRequest[];

  private _client: CDPSession;
  private _isNavigationRequest: boolean;
  private _allowInterception: boolean;
  private _interceptionHandled = false;
  private _url: string;
  private _resourceType: ResourceType;

  private _method: string;
  private _postData?: string;
  private _headers: Record<string, string> = {};
  private _frame: Frame;
  private _continueRequestOverrides: ContinueRequestOverrides;
  private _responseForRequest: Partial<ResponseForRequest>;
  private _abortErrorReason: Protocol.Network.ErrorReason;
  private _interceptResolutionState: InterceptResolutionState;
  private _interceptHandlers: Array<() => void | PromiseLike<any>>;
  private _initiator: Protocol.Network.Initiator;

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    frame: Frame,
    interceptionId: string,
    allowInterception: boolean,
    event: Protocol.Network.RequestWillBeSentEvent,
    redirectChain: HTTPRequest[]
  ) {
    this._client = client;
    this._requestId = event.requestId;
    this._isNavigationRequest =
      event.requestId === event.loaderId && event.type === 'Document';
    this._interceptionId = interceptionId;
    this._allowInterception = allowInterception;
    this._url = event.request.url;
    this._resourceType = event.type.toLowerCase() as ResourceType;
    this._method = event.request.method;
    this._postData = event.request.postData;
    this._frame = frame;
    this._redirectChain = redirectChain;
    this._continueRequestOverrides = {};
    this._interceptResolutionState = { action: InterceptResolutionAction.None };
    this._interceptHandlers = [];
    this._initiator = event.initiator;

    for (const key of Object.keys(event.request.headers))
      this._headers[key.toLowerCase()] = event.request.headers[key];
  }

  /**
   * @returns the URL of the request
   */
  url(): string {
    return this._url;
  }

  /**
   * @returns the `ContinueRequestOverrides` that will be used
   * if the interception is allowed to continue (ie, `abort()` and
   * `respond()` aren't called).
   */
  continueRequestOverrides(): ContinueRequestOverrides {
    assert(this._allowInterception, 'Request Interception is not enabled!');
    return this._continueRequestOverrides;
  }

  /**
   * @returns The `ResponseForRequest` that gets used if the
   * interception is allowed to respond (ie, `abort()` is not called).
   */
  responseForRequest(): Partial<ResponseForRequest> {
    assert(this._allowInterception, 'Request Interception is not enabled!');
    return this._responseForRequest;
  }

  /**
   * @returns the most recent reason for aborting the request
   */
  abortErrorReason(): Protocol.Network.ErrorReason {
    assert(this._allowInterception, 'Request Interception is not enabled!');
    return this._abortErrorReason;
  }

  /**
   * @returns An InterceptResolutionState object describing the current resolution
   *  action and priority.
   *
   *  InterceptResolutionState contains:
   *    action: InterceptResolutionAction
   *    priority?: number
   *
   *  InterceptResolutionAction is one of: `abort`, `respond`, `continue`,
   *  `disabled`, `none`, or `already-handled`.
   */
  interceptResolutionState(): InterceptResolutionState {
    if (!this._allowInterception)
      return { action: InterceptResolutionAction.Disabled };
    if (this._interceptionHandled)
      return { action: InterceptResolutionAction.AlreadyHandled };
    return { ...this._interceptResolutionState };
  }

  /**
   * @returns `true` if the intercept resolution has already been handled,
   * `false` otherwise.
   */
  isInterceptResolutionHandled(): boolean {
    return this._interceptionHandled;
  }

  /**
   * Adds an async request handler to the processing queue.
   * Deferred handlers are not guaranteed to execute in any particular order,
   * but they are guarnateed to resolve before the request interception
   * is finalized.
   */
  enqueueInterceptAction(
    pendingHandler: () => void | PromiseLike<unknown>
  ): void {
    this._interceptHandlers.push(pendingHandler);
  }

  /**
   * Awaits pending interception handlers and then decides how to fulfill
   * the request interception.
   */
  async finalizeInterceptions(): Promise<void> {
    await this._interceptHandlers.reduce(
      (promiseChain, interceptAction) => promiseChain.then(interceptAction),
      Promise.resolve()
    );
    const { action } = this.interceptResolutionState();
    switch (action) {
      case 'abort':
        return this._abort(this._abortErrorReason);
      case 'respond':
        return this._respond(this._responseForRequest);
      case 'continue':
        return this._continue(this._continueRequestOverrides);
    }
  }

  /**
   * Contains the request's resource type as it was perceived by the rendering
   * engine.
   */
  resourceType(): ResourceType {
    return this._resourceType;
  }

  /**
   * @returns the method used (`GET`, `POST`, etc.)
   */
  method(): string {
    return this._method;
  }

  /**
   * @returns the request's post body, if any.
   */
  postData(): string | undefined {
    return this._postData;
  }

  /**
   * @returns an object with HTTP headers associated with the request. All
   * header names are lower-case.
   */
  headers(): Record<string, string> {
    return this._headers;
  }

  /**
   * @returns A matching `HTTPResponse` object, or null if the response has not
   * been received yet.
   */
  response(): HTTPResponse | null {
    return this._response;
  }

  /**
   * @returns the frame that initiated the request, or null if navigating to
   * error pages.
   */
  frame(): Frame | null {
    return this._frame;
  }

  /**
   * @returns true if the request is the driver of the current frame's navigation.
   */
  isNavigationRequest(): boolean {
    return this._isNavigationRequest;
  }

  /**
   * @returns the initiator of the request.
   */
  initiator(): Protocol.Network.Initiator {
    return this._initiator;
  }

  /**
   * A `redirectChain` is a chain of requests initiated to fetch a resource.
   * @remarks
   *
   * `redirectChain` is shared between all the requests of the same chain.
   *
   * For example, if the website `http://example.com` has a single redirect to
   * `https://example.com`, then the chain will contain one request:
   *
   * ```js
   * const response = await page.goto('http://example.com');
   * const chain = response.request().redirectChain();
   * console.log(chain.length); // 1
   * console.log(chain[0].url()); // 'http://example.com'
   * ```
   *
   * If the website `https://google.com` has no redirects, then the chain will be empty:
   *
   * ```js
   * const response = await page.goto('https://google.com');
   * const chain = response.request().redirectChain();
   * console.log(chain.length); // 0
   * ```
   *
   * @returns the chain of requests - if a server responds with at least a
   * single redirect, this chain will contain all requests that were redirected.
   */
  redirectChain(): HTTPRequest[] {
    return this._redirectChain.slice();
  }

  /**
   * Access information about the request's failure.
   *
   * @remarks
   *
   * @example
   *
   * Example of logging all failed requests:
   *
   * ```js
   * page.on('requestfailed', request => {
   *   console.log(request.url() + ' ' + request.failure().errorText);
   * });
   * ```
   *
   * @returns `null` unless the request failed. If the request fails this can
   * return an object with `errorText` containing a human-readable error
   * message, e.g. `net::ERR_FAILED`. It is not guaranteeded that there will be
   * failure text if the request fails.
   */
  failure(): { errorText: string } | null {
    if (!this._failureText) return null;
    return {
      errorText: this._failureText,
    };
  }

  /**
   * Continues request with optional request overrides.
   *
   * @remarks
   *
   * To use this, request
   * interception should be enabled with {@link Page.setRequestInterception}.
   *
   * Exception is immediately thrown if the request interception is not enabled.
   *
   * @example
   * ```js
   * await page.setRequestInterception(true);
   * page.on('request', request => {
   *   // Override headers
   *   const headers = Object.assign({}, request.headers(), {
   *     foo: 'bar', // set "foo" header
   *     origin: undefined, // remove "origin" header
   *   });
   *   request.continue({headers});
   * });
   * ```
   *
   * @param overrides - optional overrides to apply to the request.
   * @param priority - If provided, intercept is resolved using
   * cooperative handling rules. Otherwise, intercept is resolved
   * immediately.
   */
  async continue(
    overrides: ContinueRequestOverrides = {},
    priority?: number
  ): Promise<void> {
    // Request interception is not supported for data: urls.
    if (this._url.startsWith('data:')) return;
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    if (priority === undefined) {
      return this._continue(overrides);
    }
    this._continueRequestOverrides = overrides;
    if (
      priority > this._interceptResolutionState.priority ||
      this._interceptResolutionState.priority === undefined
    ) {
      this._interceptResolutionState = {
        action: InterceptResolutionAction.Continue,
        priority,
      };
      return;
    }
    if (priority === this._interceptResolutionState.priority) {
      if (
        this._interceptResolutionState.action === 'abort' ||
        this._interceptResolutionState.action === 'respond'
      ) {
        return;
      }
      this._interceptResolutionState.action =
        InterceptResolutionAction.Continue;
    }
    return;
  }

  private async _continue(
    overrides: ContinueRequestOverrides = {}
  ): Promise<void> {
    const { url, method, postData, headers } = overrides;
    this._interceptionHandled = true;

    const postDataBinaryBase64 = postData
      ? Buffer.from(postData).toString('base64')
      : undefined;

    await this._client
      .send('Fetch.continueRequest', {
        requestId: this._interceptionId,
        url,
        method,
        postData: postDataBinaryBase64,
        headers: headers ? headersArray(headers) : undefined,
      })
      .catch((error) => {
        this._interceptionHandled = false;
        return handleError(error);
      });
  }

  /**
   * Fulfills a request with the given response.
   *
   * @remarks
   *
   * To use this, request
   * interception should be enabled with {@link Page.setRequestInterception}.
   *
   * Exception is immediately thrown if the request interception is not enabled.
   *
   * @example
   * An example of fulfilling all requests with 404 responses:
   * ```js
   * await page.setRequestInterception(true);
   * page.on('request', request => {
   *   request.respond({
   *     status: 404,
   *     contentType: 'text/plain',
   *     body: 'Not Found!'
   *   });
   * });
   * ```
   *
   * NOTE: Mocking responses for dataURL requests is not supported.
   * Calling `request.respond` for a dataURL request is a noop.
   *
   * @param response - the response to fulfill the request with.
   * @param priority - If provided, intercept is resolved using
   * cooperative handling rules. Otherwise, intercept is resolved
   * immediately.
   */
  async respond(
    response: Partial<ResponseForRequest>,
    priority?: number
  ): Promise<void> {
    // Mocking responses for dataURL requests is not currently supported.
    if (this._url.startsWith('data:')) return;
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    if (priority === undefined) {
      return this._respond(response);
    }
    this._responseForRequest = response;
    if (
      priority > this._interceptResolutionState.priority ||
      this._interceptResolutionState.priority === undefined
    ) {
      this._interceptResolutionState = {
        action: InterceptResolutionAction.Respond,
        priority,
      };
      return;
    }
    if (priority === this._interceptResolutionState.priority) {
      if (this._interceptResolutionState.action === 'abort') {
        return;
      }
      this._interceptResolutionState.action = InterceptResolutionAction.Respond;
    }
  }

  private async _respond(response: Partial<ResponseForRequest>): Promise<void> {
    this._interceptionHandled = true;

    const responseBody: Buffer | null =
      response.body && helper.isString(response.body)
        ? Buffer.from(response.body)
        : (response.body as Buffer) || null;

    const responseHeaders: Record<string, string> = {};
    if (response.headers) {
      for (const header of Object.keys(response.headers))
        responseHeaders[header.toLowerCase()] = String(
          response.headers[header]
        );
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
        this._interceptionHandled = false;
        return handleError(error);
      });
  }

  /**
   * Aborts a request.
   *
   * @remarks
   * To use this, request interception should be enabled with
   * {@link Page.setRequestInterception}. If it is not enabled, this method will
   * throw an exception immediately.
   *
   * @param errorCode - optional error code to provide.
   * @param priority - If provided, intercept is resolved using
   * cooperative handling rules. Otherwise, intercept is resolved
   * immediately.
   */
  async abort(
    errorCode: ErrorCode = 'failed',
    priority?: number
  ): Promise<void> {
    // Request interception is not supported for data: urls.
    if (this._url.startsWith('data:')) return;
    const errorReason = errorReasons[errorCode];
    assert(errorReason, 'Unknown error code: ' + errorCode);
    assert(this._allowInterception, 'Request Interception is not enabled!');
    assert(!this._interceptionHandled, 'Request is already handled!');
    if (priority === undefined) {
      return this._abort(errorReason);
    }
    this._abortErrorReason = errorReason;
    if (
      priority >= this._interceptResolutionState.priority ||
      this._interceptResolutionState.priority === undefined
    ) {
      this._interceptResolutionState = {
        action: InterceptResolutionAction.Abort,
        priority,
      };
      return;
    }
  }

  private async _abort(
    errorReason: Protocol.Network.ErrorReason
  ): Promise<void> {
    this._interceptionHandled = true;
    await this._client
      .send('Fetch.failRequest', {
        requestId: this._interceptionId,
        errorReason,
      })
      .catch(handleError);
  }
}

/**
 * @public
 */
export enum InterceptResolutionAction {
  Abort = 'abort',
  Respond = 'respond',
  Continue = 'continue',
  Disabled = 'disabled',
  None = 'none',
  AlreadyHandled = 'already-handled',
}

/**
 * @public
 *
 * @deprecated please use {@link InterceptResolutionAction} instead.
 */
export type InterceptResolutionStrategy = InterceptResolutionAction;

/**
 * @public
 */
export type ErrorCode =
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

/**
 * @public
 */
export type ActionResult = 'continue' | 'abort' | 'respond';

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

async function handleError(error: ProtocolError) {
  if (['Invalid header'].includes(error.originalMessage)) {
    throw error;
  }
  // In certain cases, protocol will return error if the request was
  // already canceled or the page was closed. We should tolerate these
  // errors.
  debugError(error);
}

// List taken from
// https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
// with extra 306 and 418 codes.
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
