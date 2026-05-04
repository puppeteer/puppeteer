/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Bidi from 'webdriver-bidi-protocol';

import {ProtocolError, UnsupportedOperation} from '../../common/Errors.js';
import {EventEmitter} from '../../common/EventEmitter.js';
import {inertIfDisposed} from '../../util/decorators.js';
import {DisposableStack, disposeSymbol} from '../../util/disposable.js';
import {stringToTypedArray} from '../../util/encoding.js';

import type {BrowsingContext} from './BrowsingContext.js';

/**
 * @internal
 */
export class Request extends EventEmitter<{
  /** Emitted when the request is redirected. */
  redirect: Request;
  /** Emitted when the request succeeds. */
  authenticate: void;
  /** Emitted when the request succeeds. */
  success: Bidi.Network.ResponseData;
  /** Analog of WebDriver BiDi event `network.responseStarted`. Emitted when a
   * response is received. */
  response: Bidi.Network.ResponseData;
  /** Emitted when the request fails. */
  error: string;
  /** Emitted when the request is disposed. */
  disposed: void;
}> {
  static from(
    browsingContext: BrowsingContext,
    event: Bidi.Network.BeforeRequestSentParameters,
  ): Request {
    const request = new Request(browsingContext, event);
    request.#initialize();
    return request;
  }

  #responseContentPromise: Promise<Uint8Array<ArrayBufferLike>> | null = null;
  #requestBodyPromise: Promise<string> | null = null;
  #error?: string;
  #redirect?: Request;
  #response?: Bidi.Network.ResponseData;
  readonly #browsingContext: BrowsingContext;
  readonly #disposables = new DisposableStack();
  #event: Bidi.Network.BeforeRequestSentParameters | undefined;

  // Cached values from #event so getters remain safe after disposal.
  // #event holds the full URL string (potentially megabytes for data: URLs),
  // so we null it on dispose to release memory while preserving getter access.
  readonly #id: string;
  readonly #url: string;
  readonly #method: string;
  readonly #headers: Bidi.Network.Header[];
  readonly #initiator: Bidi.Network.Initiator;
  readonly #navigation: string | undefined;
  readonly #isBlocked: boolean;
  readonly #redirectCount: number;
  readonly #resourceType: string | undefined;
  readonly #postData: string | undefined;
  readonly #hasPostData: boolean;
  #timings: Bidi.Network.FetchTimingInfo;

  private constructor(
    browsingContext: BrowsingContext,
    event: Bidi.Network.BeforeRequestSentParameters,
  ) {
    super();

    this.#browsingContext = browsingContext;
    this.#event = event;

    // Cache values accessed by getters so they survive #event being nulled.
    this.#id = event.request.request;
    this.#url = event.request.url;
    this.#method = event.request.method;
    this.#headers = event.request.headers;
    this.#initiator = {
      ...event.initiator,
      // Initiator URL is not specified in BiDi.
      // @ts-expect-error non-standard property.
      url: event.request['goog:resourceInitiator']?.url,
      // @ts-expect-error non-standard property.
      stack: event.request['goog:resourceInitiator']?.stack,
    };
    this.#navigation = event.navigation ?? undefined;
    this.#isBlocked = event.isBlocked;
    this.#redirectCount = event.redirectCount;
    // @ts-expect-error non-standard attribute.
    this.#resourceType = event.request['goog:resourceType'] ?? undefined;
    // @ts-expect-error non-standard attribute.
    this.#postData = event.request['goog:postData'] ?? undefined;
    this.#hasPostData = (event.request.bodySize ?? 0) > 0;
    this.#timings = event.request.timings;
  }

  #initialize() {
    const browsingContextEmitter = this.#disposables.use(
      new EventEmitter(this.#browsingContext),
    );
    browsingContextEmitter.once('closed', ({reason}) => {
      this.#error = reason;
      this.emit('error', this.#error);
      this.dispose();
    });

    const sessionEmitter = this.#disposables.use(
      new EventEmitter(this.#session),
    );
    sessionEmitter.on('network.beforeRequestSent', event => {
      if (
        event.context !== this.#browsingContext.id ||
        event.request.request !== this.id
      ) {
        return;
      }
      // This is a workaround to detect if a beforeRequestSent is for a request
      // sent after continueWithAuth. Currently, only emitted in Firefox.
      const previousRequestHasAuth = this.#headers.find(
        header => {
          return header.name.toLowerCase() === 'authorization';
        },
      );
      const newRequestHasAuth = event.request.headers.find(header => {
        return header.name.toLowerCase() === 'authorization';
      });
      const isAfterAuth = newRequestHasAuth && !previousRequestHasAuth;
      if (
        event.redirectCount !== this.#redirectCount + 1 &&
        !isAfterAuth
      ) {
        return;
      }
      this.#redirect = Request.from(this.#browsingContext, event);
      this.emit('redirect', this.#redirect);
      this.dispose();
    });
    sessionEmitter.on('network.authRequired', event => {
      if (
        event.context !== this.#browsingContext.id ||
        event.request.request !== this.id ||
        // Don't try to authenticate for events that are not blocked
        !event.isBlocked
      ) {
        return;
      }
      this.emit('authenticate', undefined);
    });
    sessionEmitter.on('network.fetchError', event => {
      if (
        event.context !== this.#browsingContext.id ||
        event.request.request !== this.id ||
        this.#redirectCount !== event.redirectCount
      ) {
        return;
      }
      this.#error = event.errorText;
      this.emit('error', this.#error);
      this.dispose();
    });
    sessionEmitter.on('network.responseStarted', event => {
      if (
        event.context !== this.#browsingContext.id ||
        event.request.request !== this.id ||
        this.#redirectCount !== event.redirectCount
      ) {
        return;
      }
      this.#response = event.response;
      this.#timings = event.request.timings;
      this.emit('response', this.#response);
    });
    sessionEmitter.on('network.responseCompleted', event => {
      if (
        event.context !== this.#browsingContext.id ||
        event.request.request !== this.id ||
        this.#redirectCount !== event.redirectCount
      ) {
        return;
      }
      this.#response = event.response;
      this.#timings = event.request.timings;
      this.emit('success', this.#response);
      // In case this is a redirect.
      if (this.#response.status >= 300 && this.#response.status < 400) {
        return;
      }
      this.dispose();
    });
  }

  get #session() {
    return this.#browsingContext.userContext.browser.session;
  }
  get disposed(): boolean {
    return this.#disposables.disposed;
  }
  get error(): string | undefined {
    return this.#error;
  }
  get headers(): Bidi.Network.Header[] {
    return this.#headers;
  }
  get id(): string {
    return this.#id;
  }
  get initiator(): Bidi.Network.Initiator | undefined {
    return this.#initiator;
  }
  get method(): string {
    return this.#method;
  }
  get navigation(): string | undefined {
    return this.#navigation;
  }
  get redirect(): Request | undefined {
    return this.#redirect;
  }
  get lastRedirect(): Request | undefined {
    let redirect = this.#redirect;
    while (redirect) {
      if (redirect && !redirect.#redirect) {
        return redirect;
      }
      redirect = redirect.#redirect;
    }
    return redirect;
  }
  get response(): Bidi.Network.ResponseData | undefined {
    return this.#response;
  }
  get url(): string {
    return this.#url;
  }
  get isBlocked(): boolean {
    return this.#isBlocked;
  }

  get resourceType(): string | undefined {
    return this.#resourceType;
  }

  get postData(): string | undefined {
    return this.#postData;
  }

  get hasPostData(): boolean {
    return this.#hasPostData;
  }

  async continueRequest({
    url,
    method,
    headers,
    cookies,
    body,
  }: Omit<Bidi.Network.ContinueRequestParameters, 'request'>): Promise<void> {
    await this.#session.send('network.continueRequest', {
      request: this.id,
      url,
      method,
      headers,
      body,
      cookies,
    });
  }

  async failRequest(): Promise<void> {
    await this.#session.send('network.failRequest', {
      request: this.id,
    });
  }

  async provideResponse({
    statusCode,
    reasonPhrase,
    headers,
    body,
  }: Omit<Bidi.Network.ProvideResponseParameters, 'request'>): Promise<void> {
    await this.#session.send('network.provideResponse', {
      request: this.id,
      statusCode,
      reasonPhrase,
      headers,
      body,
    });
  }

  async fetchPostData(): Promise<string | undefined> {
    if (!this.hasPostData) {
      return undefined;
    }
    if (!this.#requestBodyPromise) {
      this.#requestBodyPromise = (async () => {
        const data = await this.#session.send('network.getData', {
          dataType: Bidi.Network.DataType.Request,
          request: this.id,
        });
        if (data.result.bytes.type === 'string') {
          return data.result.bytes.value;
        }

        // TODO: support base64 response.
        throw new UnsupportedOperation(
          `Collected request body data of type ${data.result.bytes.type} is not supported`,
        );
      })();
    }
    return await this.#requestBodyPromise;
  }

  async getResponseContent(): Promise<Uint8Array> {
    if (!this.#responseContentPromise) {
      this.#responseContentPromise = (async () => {
        try {
          const data = await this.#session.send('network.getData', {
            dataType: Bidi.Network.DataType.Response,
            request: this.id,
          });

          return stringToTypedArray(
            data.result.bytes.value,
            data.result.bytes.type === 'base64',
          );
        } catch (error) {
          if (
            error instanceof ProtocolError &&
            error.originalMessage.includes(
              'No resource with given identifier found',
            )
          ) {
            throw new ProtocolError(
              'Could not load response body for this request. This might happen if the request is a preflight request.',
            );
          }

          throw error;
        }
      })();
    }
    return await this.#responseContentPromise;
  }

  async continueWithAuth(
    parameters:
      | Bidi.Network.ContinueWithAuthCredentials
      | Bidi.Network.ContinueWithAuthNoCredentials,
  ): Promise<void> {
    if (parameters.action === 'provideCredentials') {
      await this.#session.send('network.continueWithAuth', {
        request: this.id,
        action: parameters.action,
        credentials: parameters.credentials,
      });
    } else {
      await this.#session.send('network.continueWithAuth', {
        request: this.id,
        action: parameters.action,
      });
    }
  }

  @inertIfDisposed
  private dispose(): void {
    this[disposeSymbol]();
  }

  override [disposeSymbol](): void {
    this.emit('disposed', undefined);
    this.#disposables.dispose();
    // Null #event to release the large URL string (the main memory leak source
    // for data: URLs). Cached fields preserve getter access after disposal.
    this.#event = undefined;
    // Keep #response intact — callers rely on request.response as a
    // "request finished" signal even after disposal.
    super[disposeSymbol]();
  }

  timing(): Bidi.Network.FetchTimingInfo {
    return this.#timings;
  }
}
