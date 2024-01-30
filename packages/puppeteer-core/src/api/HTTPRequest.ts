/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from './CDPSession.js';
import type {Frame} from './Frame.js';
import type {HTTPResponse} from './HTTPResponse.js';

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
export abstract class HTTPRequest {
  /**
   * @internal
   */
  _requestId = '';
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
  _redirectChain: HTTPRequest[] = [];

  /**
   * Warning! Using this client can break Puppeteer. Use with caution.
   *
   * @experimental
   */
  abstract get client(): CDPSession;

  /**
   * @internal
   */
  constructor() {}

  /**
   * The URL of the request
   */
  abstract url(): string;

  /**
   * The `ContinueRequestOverrides` that will be used
   * if the interception is allowed to continue (ie, `abort()` and
   * `respond()` aren't called).
   */
  abstract continueRequestOverrides(): ContinueRequestOverrides;

  /**
   * The `ResponseForRequest` that gets used if the
   * interception is allowed to respond (ie, `abort()` is not called).
   */
  abstract responseForRequest(): Partial<ResponseForRequest> | null;

  /**
   * The most recent reason for aborting the request
   */
  abstract abortErrorReason(): Protocol.Network.ErrorReason | null;

  /**
   * An InterceptResolutionState object describing the current resolution
   * action and priority.
   *
   * InterceptResolutionState contains:
   * action: InterceptResolutionAction
   * priority?: number
   *
   * InterceptResolutionAction is one of: `abort`, `respond`, `continue`,
   * `disabled`, `none`, or `already-handled`.
   */
  abstract interceptResolutionState(): InterceptResolutionState;

  /**
   * Is `true` if the intercept resolution has already been handled,
   * `false` otherwise.
   */
  abstract isInterceptResolutionHandled(): boolean;

  /**
   * Adds an async request handler to the processing queue.
   * Deferred handlers are not guaranteed to execute in any particular order,
   * but they are guaranteed to resolve before the request interception
   * is finalized.
   */
  abstract enqueueInterceptAction(
    pendingHandler: () => void | PromiseLike<unknown>
  ): void;

  /**
   * Awaits pending interception handlers and then decides how to fulfill
   * the request interception.
   */
  abstract finalizeInterceptions(): Promise<void>;

  /**
   * Contains the request's resource type as it was perceived by the rendering
   * engine.
   */
  abstract resourceType(): ResourceType;

  /**
   * The method used (`GET`, `POST`, etc.)
   */
  abstract method(): string;

  /**
   * The request's post body, if any.
   */
  abstract postData(): string | undefined;

  /**
   * True when the request has POST data. Note that {@link HTTPRequest.postData}
   * might still be undefined when this flag is true when the data is too long
   * or not readily available in the decoded form. In that case, use
   * {@link HTTPRequest.fetchPostData}.
   */
  abstract hasPostData(): boolean;

  /**
   * Fetches the POST data for the request from the browser.
   */
  abstract fetchPostData(): Promise<string | undefined>;

  /**
   * An object with HTTP headers associated with the request. All
   * header names are lower-case.
   */
  abstract headers(): Record<string, string>;

  /**
   * A matching `HTTPResponse` object, or null if the response has not
   * been received yet.
   */
  abstract response(): HTTPResponse | null;

  /**
   * The frame that initiated the request, or null if navigating to
   * error pages.
   */
  abstract frame(): Frame | null;

  /**
   * True if the request is the driver of the current frame's navigation.
   */
  abstract isNavigationRequest(): boolean;

  /**
   * The initiator of the request.
   */
  abstract initiator(): Protocol.Network.Initiator | undefined;

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
  abstract redirectChain(): HTTPRequest[];

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
  abstract failure(): {errorText: string} | null;

  /**
   * Continues request with optional request overrides.
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
   * @param priority - If provided, intercept is resolved using cooperative
   * handling rules. Otherwise, intercept is resolved immediately.
   *
   * @remarks
   *
   * To use this, request interception should be enabled with
   * {@link Page.setRequestInterception}.
   *
   * Exception is immediately thrown if the request interception is not enabled.
   */
  abstract continue(
    overrides?: ContinueRequestOverrides,
    priority?: number
  ): Promise<void>;

  /**
   * Fulfills a request with the given response.
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
   *
   * @remarks
   *
   * To use this, request
   * interception should be enabled with {@link Page.setRequestInterception}.
   *
   * Exception is immediately thrown if the request interception is not enabled.
   */
  abstract respond(
    response: Partial<ResponseForRequest>,
    priority?: number
  ): Promise<void>;

  /**
   * Aborts a request.
   *
   * @param errorCode - optional error code to provide.
   * @param priority - If provided, intercept is resolved using
   * cooperative handling rules. Otherwise, intercept is resolved
   * immediately.
   *
   * @remarks
   *
   * To use this, request interception should be enabled with
   * {@link Page.setRequestInterception}. If it is not enabled, this method will
   * throw an exception immediately.
   */
  abstract abort(errorCode?: ErrorCode, priority?: number): Promise<void>;
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

/**
 * @public
 */
export type ActionResult = 'continue' | 'abort' | 'respond';

/**
 * @internal
 */
export function headersArray(
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

/**
 * @internal
 *
 * @remarks
 * List taken from {@link https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml}
 * with extra 306 and 418 codes.
 */
export const STATUS_TEXTS: Record<string, string> = {
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
