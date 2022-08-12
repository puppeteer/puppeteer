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
import {Protocol} from 'devtools-protocol';
import {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';
import {assert} from './assert.js';
import {ProtocolError} from './Errors.js';
import {EventEmitter} from './EventEmitter.js';
import {Frame} from './FrameManager.js';
import {debugError, isString} from './util.js';
import {HTTPResponse} from './HTTPResponse.js';

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
 * Represents an HTTP request sent by a page.
 * @remarks
 *
 * Whenever the page sends a request, such as for a network resource, the
 * following events are emitted by Puppeteer's `page`:
 *
 * - `request`: emitted when the request is issued by the page.
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
  _interceptionId: string | undefined;
  /**
   * @internal
   */
  _failureText: string | null = null;
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

  #client: CDPSession;
  #isNavigationRequest: boolean;
  #allowInterception: boolean;
  #interceptionHandled = false;
  #url: string;
  #resourceType: ResourceType;

  #method: string;
  #postData?: string;
  #headers: Record<string, string> = {};
  #frame: Frame | null;
  #continueRequestOverrides: ContinueRequestOverrides;
  #responseForRequest: Partial<ResponseForRequest> | null = null;
  #abortErrorReason: Protocol.Network.ErrorReason | null = null;
  #interceptResolutionState: InterceptResolutionState = {
    action: InterceptResolutionAction.None,
  };
  #interceptHandlers: Array<() => void | PromiseLike<any>>;
  #initiator: Protocol.Network.Initiator;

  /**
   * Warning! Using this client can break Puppeteer. Use with caution.
   *
   * @experimental
   */
  get client(): CDPSession {
    return this.#client;
  }

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    frame: Frame | null,
    interceptionId: string | undefined,
    allowInterception: boolean,
    event: Protocol.Network.RequestWillBeSentEvent,
    redirectChain: HTTPRequest[]
  ) {
    this.#client = client;
    this._requestId = event.requestId;
    this.#isNavigationRequest =
      event.requestId === event.loaderId && event.type === 'Document';
    this._interceptionId = interceptionId;
    this.#allowInterception = allowInterception;
    this.#url = event.request.url;
    this.#resourceType = (event.type || 'other').toLowerCase() as ResourceType;
    this.#method = event.request.method;
    this.#postData = event.request.postData;
    this.#frame = frame;
    this._redirectChain = redirectChain;
    this.#continueRequestOverrides = {};
    this.#interceptHandlers = [];
    this.#initiator = event.initiator;

    for (const [key, value] of Object.entries(event.request.headers)) {
      this.#headers[key.toLowerCase()] = value;
    }
  }

  /**
   * @returns the URL of the request
   */
  url(): string {
    return this.#url;
  }

  /**
   * @returns the `ContinueRequestOverrides` that will be used
   * if the interception is allowed to continue (ie, `abort()` and
   * `respond()` aren't called).
   */
  continueRequestOverrides(): ContinueRequestOverrides {
    assert(this.#allowInterception, 'Request Interception is not enabled!');
    return this.#continueRequestOverrides;
  }

  /**
   * @returns The `ResponseForRequest` that gets used if the
   * interception is allowed to respond (ie, `abort()` is not called).
   */
  responseForRequest(): Partial<ResponseForRequest> | null {
    assert(this.#allowInterception, 'Request Interception is not enabled!');
    return this.#responseForRequest;
  }

  /**
   * @returns the most recent reason for aborting the request
   */
  abortErrorReason(): Protocol.Network.ErrorReason | null {
    assert(this.#allowInterception, 'Request Interception is not enabled!');
    return this.#abortErrorReason;
  }

  /**
   * @returns An InterceptResolutionState object describing the current resolution
   * action and priority.
   *
   * InterceptResolutionState contains:
   * action: InterceptResolutionAction
   * priority?: number
   *
   * InterceptResolutionAction is one of: `abort`, `respond`, `continue`,
   * `disabled`, `none`, or `already-handled`.
   */
  interceptResolutionState(): InterceptResolutionState {
    if (!this.#allowInterception) {
      return {action: InterceptResolutionAction.Disabled};
    }
    if (this.#interceptionHandled) {
      return {action: InterceptResolutionAction.AlreadyHandled};
    }
    return {...this.#interceptResolutionState};
  }

  /**
   * @returns `true` if the intercept resolution has already been handled,
   * `false` otherwise.
   */
  isInterceptResolutionHandled(): boolean {
    return this.#interceptionHandled;
  }

  /**
   * Adds an async request handler to the processing queue.
   * Deferred handlers are not guaranteed to execute in any particular order,
   * but they are guaranteed to resolve before the request interception
   * is finalized.
   */
  enqueueInterceptAction(
    pendingHandler: () => void | PromiseLike<unknown>
  ): void {
    this.#interceptHandlers.push(pendingHandler);
  }

  /**
   * Awaits pending interception handlers and then decides how to fulfill
   * the request interception.
   */
  async finalizeInterceptions(): Promise<void> {
    await this.#interceptHandlers.reduce((promiseChain, interceptAction) => {
      return promiseChain.then(interceptAction);
    }, Promise.resolve());
    const {action} = this.interceptResolutionState();
    switch (action) {
      case 'abort':
        return this.#abort(this.#abortErrorReason);
      case 'respond':
        if (this.#responseForRequest === null) {
          throw new Error('Response is missing for the interception');
        }
        return this.#respond(this.#responseForRequest);
      case 'continue':
        return this.#continue(this.#continueRequestOverrides);
    }
  }

  /**
   * Contains the request's resource type as it was perceived by the rendering
   * engine.
   */
  resourceType(): ResourceType {
    return this.#resourceType;
  }

  /**
   * @returns the method used (`GET`, `POST`, etc.)
   */
  method(): string {
    return this.#method;
  }

  /**
   * @returns the request's post body, if any.
   */
  postData(): string | undefined {
    return this.#postData;
  }

  /**
   * @returns an object with HTTP headers associated with the request. All
   * header names are lower-case.
   */
  headers(): Record<string, string> {
    return this.#headers;
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
    return this.#frame;
  }

  /**
   * @returns true if the request is the driver of the current frame's navigation.
   */
  isNavigationRequest(): boolean {
    return this.#isNavigationRequest;
  }

  /**
   * @returns the initiator of the request.
   */
  initiator(): Protocol.Network.Initiator {
    return this.#initiator;
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
   * ```ts
   * const response = await page.goto('http://example.com');
   * const chain = response.request().redirectChain();
   * console.log(chain.length); // 1
   * console.log(chain[0].url()); // 'http://example.com'
   * ```
   *
   * If the website `https://google.com` has no redirects, then the chain will be empty:
   *
   * ```ts
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
   * ```ts
   * page.on('requestfailed', request => {
   *   console.log(request.url() + ' ' + request.failure().errorText);
   * });
   * ```
   *
   * @returns `null` unless the request failed. If the request fails this can
   * return an object with `errorText` containing a human-readable error
   * message, e.g. `net::ERR_FAILED`. It is not guaranteed that there will be
   * failure text if the request fails.
   */
  failure(): {errorText: string} | null {
    if (!this._failureText) {
      return null;
    }
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
   *
   * ```ts
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
    if (this.#url.startsWith('data:')) {
      return;
    }
    assert(this.#allowInterception, 'Request Interception is not enabled!');
    assert(!this.#interceptionHandled, 'Request is already handled!');
    if (priority === undefined) {
      return this.#continue(overrides);
    }
    this.#continueRequestOverrides = overrides;
    if (
      this.#interceptResolutionState.priority === undefined ||
      priority > this.#interceptResolutionState.priority
    ) {
      this.#interceptResolutionState = {
        action: InterceptResolutionAction.Continue,
        priority,
      };
      return;
    }
    if (priority === this.#interceptResolutionState.priority) {
      if (
        this.#interceptResolutionState.action === 'abort' ||
        this.#interceptResolutionState.action === 'respond'
      ) {
        return;
      }
      this.#interceptResolutionState.action =
        InterceptResolutionAction.Continue;
    }
    return;
  }

  async #continue(overrides: ContinueRequestOverrides = {}): Promise<void> {
    const {url, method, postData, headers} = overrides;
    this.#interceptionHandled = true;

    const postDataBinaryBase64 = postData
      ? Buffer.from(postData).toString('base64')
      : undefined;

    if (this._interceptionId === undefined) {
      throw new Error(
        'HTTPRequest is missing _interceptionId needed for Fetch.continueRequest'
      );
    }
    await this.#client
      .send('Fetch.continueRequest', {
        requestId: this._interceptionId,
        url,
        method,
        postData: postDataBinaryBase64,
        headers: headers ? headersArray(headers) : undefined,
      })
      .catch(error => {
        this.#interceptionHandled = false;
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
   *
   * ```ts
   * await page.setRequestInterception(true);
   * page.on('request', request => {
   *   request.respond({
   *     status: 404,
   *     contentType: 'text/plain',
   *     body: 'Not Found!',
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
    if (this.#url.startsWith('data:')) {
      return;
    }
    assert(this.#allowInterception, 'Request Interception is not enabled!');
    assert(!this.#interceptionHandled, 'Request is already handled!');
    if (priority === undefined) {
      return this.#respond(response);
    }
    this.#responseForRequest = response;
    if (
      this.#interceptResolutionState.priority === undefined ||
      priority > this.#interceptResolutionState.priority
    ) {
      this.#interceptResolutionState = {
        action: InterceptResolutionAction.Respond,
        priority,
      };
      return;
    }
    if (priority === this.#interceptResolutionState.priority) {
      if (this.#interceptResolutionState.action === 'abort') {
        return;
      }
      this.#interceptResolutionState.action = InterceptResolutionAction.Respond;
    }
  }

  async #respond(response: Partial<ResponseForRequest>): Promise<void> {
    this.#interceptionHandled = true;

    const responseBody: Buffer | null =
      response.body && isString(response.body)
        ? Buffer.from(response.body)
        : (response.body as Buffer) || null;

    const responseHeaders: Record<string, string | string[]> = {};
    if (response.headers) {
      for (const header of Object.keys(response.headers)) {
        const value = response.headers[header];

        responseHeaders[header.toLowerCase()] = Array.isArray(value)
          ? value.map(item => {
              return String(item);
            })
          : String(value);
      }
    }
    if (response.contentType) {
      responseHeaders['content-type'] = response.contentType;
    }
    if (responseBody && !('content-length' in responseHeaders)) {
      responseHeaders['content-length'] = String(
        Buffer.byteLength(responseBody)
      );
    }

    const status = response.status || 200;
    if (this._interceptionId === undefined) {
      throw new Error(
        'HTTPRequest is missing _interceptionId needed for Fetch.fulfillRequest'
      );
    }
    await this.#client
      .send('Fetch.fulfillRequest', {
        requestId: this._interceptionId,
        responseCode: status,
        responsePhrase: STATUS_TEXTS[status],
        responseHeaders: headersArray(responseHeaders),
        body: responseBody ? responseBody.toString('base64') : undefined,
      })
      .catch(error => {
        this.#interceptionHandled = false;
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
    if (this.#url.startsWith('data:')) {
      return;
    }
    const errorReason = errorReasons[errorCode];
    assert(errorReason, 'Unknown error code: ' + errorCode);
    assert(this.#allowInterception, 'Request Interception is not enabled!');
    assert(!this.#interceptionHandled, 'Request is already handled!');
    if (priority === undefined) {
      return this.#abort(errorReason);
    }
    this.#abortErrorReason = errorReason;
    if (
      this.#interceptResolutionState.priority === undefined ||
      priority >= this.#interceptResolutionState.priority
    ) {
      this.#interceptResolutionState = {
        action: InterceptResolutionAction.Abort,
        priority,
      };
      return;
    }
  }

  async #abort(
    errorReason: Protocol.Network.ErrorReason | null
  ): Promise<void> {
    this.#interceptionHandled = true;
    if (this._interceptionId === undefined) {
      throw new Error(
        'HTTPRequest is missing _interceptionId needed for Fetch.failRequest'
      );
    }
    await this.#client
      .send('Fetch.failRequest', {
        requestId: this._interceptionId,
        errorReason: errorReason || 'Failed',
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
  headers: Record<string, string | string[]>
): Array<{name: string; value: string}> {
  const result = [];
  for (const name in headers) {
    const value = headers[name];

    if (!Object.is(value, undefined)) {
      const values = Array.isArray(value) ? value : [value];

      result.push(
        ...values.map(value => {
          return {name, value: value + ''};
        })
      );
    }
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
const STATUS_TEXTS: {[key: string]: string | undefined} = {
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
