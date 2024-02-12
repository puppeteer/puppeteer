/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';
import {inertIfDisposed} from '../../util/decorators.js';
import {DisposableStack, disposeSymbol} from '../../util/disposable.js';

import type {BrowsingContext} from './BrowsingContext.js';

/**
 * @internal
 */
export class Request extends EventEmitter<{
  /** Emitted when the request is redirected. */
  redirect: Request;
  /** Emitted when the request succeeds. */
  success: Bidi.Network.ResponseData;
  /** Emitted when the request fails. */
  error: string;
}> {
  static from(
    browsingContext: BrowsingContext,
    event: Bidi.Network.BeforeRequestSentParameters
  ): Request {
    const request = new Request(browsingContext, event);
    request.#initialize();
    return request;
  }

  // keep-sorted start
  #error?: string;
  #redirect?: Request;
  #response?: Bidi.Network.ResponseData;
  readonly #browsingContext: BrowsingContext;
  readonly #disposables = new DisposableStack();
  readonly #event: Bidi.Network.BeforeRequestSentParameters;
  // keep-sorted end

  private constructor(
    browsingContext: BrowsingContext,
    event: Bidi.Network.BeforeRequestSentParameters
  ) {
    super();
    // keep-sorted start
    this.#browsingContext = browsingContext;
    this.#event = event;
    // keep-sorted end
  }

  #initialize() {
    const browsingContextEmitter = this.#disposables.use(
      new EventEmitter(this.#browsingContext)
    );
    browsingContextEmitter.once('closed', ({reason}) => {
      this.#error = reason;
      this.emit('error', this.#error);
      this.dispose();
    });

    const sessionEmitter = this.#disposables.use(
      new EventEmitter(this.#session)
    );
    sessionEmitter.on('network.beforeRequestSent', event => {
      if (
        event.context !== this.#browsingContext.id ||
        event.request.request !== this.id ||
        event.redirectCount !== this.#event.redirectCount + 1
      ) {
        return;
      }
      this.#redirect = Request.from(this.#browsingContext, event);
      this.emit('redirect', this.#redirect);
      this.dispose();
    });
    sessionEmitter.on('network.fetchError', event => {
      if (
        event.context !== this.#browsingContext.id ||
        event.request.request !== this.id ||
        this.#event.redirectCount !== event.redirectCount
      ) {
        return;
      }
      this.#error = event.errorText;
      this.emit('error', this.#error);
      this.dispose();
    });
    sessionEmitter.on('network.responseCompleted', event => {
      if (
        event.context !== this.#browsingContext.id ||
        event.request.request !== this.id ||
        this.#event.redirectCount !== event.redirectCount
      ) {
        return;
      }
      this.#response = event.response;
      this.emit('success', this.#response);
      // In case this is a redirect.
      if (this.#response.status >= 300 && this.#response.status < 400) {
        return;
      }
      this.dispose();
    });
  }

  // keep-sorted start block=yes
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
    return this.#event.request.headers;
  }
  get id(): string {
    return this.#event.request.request;
  }
  get initiator(): Bidi.Network.Initiator {
    return this.#event.initiator;
  }
  get method(): string {
    return this.#event.request.method;
  }
  get navigation(): string | undefined {
    return this.#event.navigation ?? undefined;
  }
  get redirect(): Request | undefined {
    return this.#redirect;
  }
  get response(): Bidi.Network.ResponseData | undefined {
    return this.#response;
  }
  get url(): string {
    return this.#event.request.url;
  }
  // keep-sorted end

  @inertIfDisposed
  private dispose(): void {
    this[disposeSymbol]();
  }

  [disposeSymbol](): void {
    this.#disposables.dispose();
    super[disposeSymbol]();
  }
}
