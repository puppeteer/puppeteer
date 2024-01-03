/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {Frame} from '../api/Frame.js';
import type {
  ContinueRequestOverrides,
  ResponseForRequest,
} from '../api/HTTPRequest.js';
import {HTTPRequest, type ResourceType} from '../api/HTTPRequest.js';
import {UnsupportedOperation} from '../common/Errors.js';

import type {BidiHTTPResponse} from './HTTPResponse.js';

/**
 * @internal
 */
export class BidiHTTPRequest extends HTTPRequest {
  override _response: BidiHTTPResponse | null = null;
  override _redirectChain: BidiHTTPRequest[];
  _navigationId: string | null;

  #url: string;
  #resourceType: ResourceType;

  #method: string;
  #postData?: string;
  #headers: Record<string, string> = {};
  #initiator: Bidi.Network.Initiator;
  #frame: Frame | null;

  constructor(
    event: Bidi.Network.BeforeRequestSentParameters,
    frame: Frame | null,
    redirectChain: BidiHTTPRequest[] = []
  ) {
    super();

    this.#url = event.request.url;
    this.#resourceType = event.initiator.type.toLowerCase() as ResourceType;
    this.#method = event.request.method;
    this.#postData = undefined;
    this.#initiator = event.initiator;
    this.#frame = frame;

    this._requestId = event.request.request;
    this._redirectChain = redirectChain;
    this._navigationId = event.navigation;

    for (const header of event.request.headers) {
      // TODO: How to handle Binary Headers
      // https://w3c.github.io/webdriver-bidi/#type-network-Header
      if (header.value.type === 'string') {
        this.#headers[header.name.toLowerCase()] = header.value.value;
      }
    }
  }

  override get client(): never {
    throw new UnsupportedOperation();
  }

  override url(): string {
    return this.#url;
  }

  override resourceType(): ResourceType {
    return this.#resourceType;
  }

  override method(): string {
    return this.#method;
  }

  override postData(): string | undefined {
    return this.#postData;
  }

  override hasPostData(): boolean {
    return this.#postData !== undefined;
  }

  override async fetchPostData(): Promise<string | undefined> {
    return this.#postData;
  }

  override headers(): Record<string, string> {
    return this.#headers;
  }

  override response(): BidiHTTPResponse | null {
    return this._response;
  }

  override isNavigationRequest(): boolean {
    return Boolean(this._navigationId);
  }

  override initiator(): Bidi.Network.Initiator {
    return this.#initiator;
  }

  override redirectChain(): BidiHTTPRequest[] {
    return this._redirectChain.slice();
  }

  override enqueueInterceptAction(
    pendingHandler: () => void | PromiseLike<unknown>
  ): void {
    // Execute the handler when interception is not supported
    void pendingHandler();
  }

  override frame(): Frame | null {
    return this.#frame;
  }

  override continueRequestOverrides(): never {
    throw new UnsupportedOperation();
  }

  override continue(_overrides: ContinueRequestOverrides = {}): never {
    throw new UnsupportedOperation();
  }

  override responseForRequest(): never {
    throw new UnsupportedOperation();
  }

  override abortErrorReason(): never {
    throw new UnsupportedOperation();
  }

  override interceptResolutionState(): never {
    throw new UnsupportedOperation();
  }

  override isInterceptResolutionHandled(): never {
    throw new UnsupportedOperation();
  }

  override finalizeInterceptions(): never {
    throw new UnsupportedOperation();
  }

  override abort(): never {
    throw new UnsupportedOperation();
  }

  override respond(
    _response: Partial<ResponseForRequest>,
    _priority?: number
  ): never {
    throw new UnsupportedOperation();
  }

  override failure(): never {
    throw new UnsupportedOperation();
  }
}
