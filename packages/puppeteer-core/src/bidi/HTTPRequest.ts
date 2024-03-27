/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import type {CDPSession} from '../api/CDPSession.js';
import type {
  ContinueRequestOverrides,
  ResponseForRequest,
} from '../api/HTTPRequest.js';
import {
  HTTPRequest,
  STATUS_TEXTS,
  type ResourceType,
  handleError,
} from '../api/HTTPRequest.js';
import {PageEvent} from '../api/Page.js';
import {UnsupportedOperation} from '../common/Errors.js';

import type {Request} from './core/Request.js';
import type {BidiFrame} from './Frame.js';
import {BidiHTTPResponse} from './HTTPResponse.js';

export const requests = new WeakMap<Request, BidiHTTPRequest>();

/**
 * @internal
 */
export class BidiHTTPRequest extends HTTPRequest {
  static from(
    bidiRequest: Request,
    frame: BidiFrame | undefined
  ): BidiHTTPRequest {
    const request = new BidiHTTPRequest(bidiRequest, frame);
    request.#initialize();
    return request;
  }

  #redirect: BidiHTTPRequest | undefined;
  #response: BidiHTTPResponse | null = null;
  override readonly id: string;
  readonly #frame: BidiFrame | undefined;
  readonly #request: Request;

  private constructor(request: Request, frame: BidiFrame | undefined) {
    super();
    requests.set(request, this);

    this.#request = request;
    this.#frame = frame;
    this.id = request.id;
  }

  override get client(): CDPSession {
    throw new UnsupportedOperation();
  }

  #initialize() {
    this.#request.on('redirect', request => {
      this.#redirect = BidiHTTPRequest.from(request, this.#frame);
    });
    this.#request.once('success', data => {
      this.#response = BidiHTTPResponse.from(data, this);
    });

    this.#frame?.page().trustedEmitter.emit(PageEvent.Request, this);
  }

  override url(): string {
    return this.#request.url;
  }

  override resourceType(): ResourceType {
    throw new UnsupportedOperation();
  }

  override method(): string {
    return this.#request.method;
  }

  override postData(): string | undefined {
    throw new UnsupportedOperation();
  }

  override hasPostData(): boolean {
    throw new UnsupportedOperation();
  }

  override async fetchPostData(): Promise<string | undefined> {
    throw new UnsupportedOperation();
  }

  override headers(): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const header of this.#request.headers) {
      headers[header.name.toLowerCase()] = header.value.value;
    }
    return headers;
  }

  override response(): BidiHTTPResponse | null {
    return this.#response;
  }

  override failure(): {errorText: string} | null {
    if (this.#request.error === undefined) {
      return null;
    }
    return {errorText: this.#request.error};
  }

  override isNavigationRequest(): boolean {
    return this.#request.navigation !== undefined;
  }

  override initiator(): Bidi.Network.Initiator {
    return this.#request.initiator;
  }

  override redirectChain(): BidiHTTPRequest[] {
    if (this.#redirect === undefined) {
      return [];
    }
    const redirects = [this.#redirect];
    for (const redirect of redirects) {
      if (redirect.#redirect !== undefined) {
        redirects.push(redirect.#redirect);
      }
    }
    return redirects;
  }

  override enqueueInterceptAction(
    pendingHandler: () => void | PromiseLike<unknown>
  ): void {
    // Execute the handler when interception is not supported
    void pendingHandler();
  }

  override frame(): BidiFrame | null {
    return this.#frame ?? null;
  }

  override continueRequestOverrides(): never {
    throw new UnsupportedOperation();
  }

  override async continue(
    overrides: ContinueRequestOverrides = {}
  ): Promise<void> {
    if (!this.#request.isBlocked) {
      throw new Error('Request Interception is not enabled!');
    }
    // Request interception is not supported for data: urls.
    if (this.url().startsWith('data:')) {
      return;
    }

    const headers: Bidi.Network.Header[] = getBidiHeaders(overrides.headers);

    return await this.#request
      .continueRequest({
        url: overrides.url,
        method: overrides.method,
        body: overrides.postData
          ? {
              type: 'base64',
              value: btoa(overrides.postData),
            }
          : undefined,
        headers: headers.length > 0 ? headers : undefined,
      })
      .catch(error => {
        return handleError(error);
      });
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

  override async abort(): Promise<void> {
    if (!this.#request.isBlocked) {
      throw new Error('Request Interception is not enabled!');
    }
    // Request interception is not supported for data: urls.
    if (this.url().startsWith('data:')) {
      return;
    }
    return await this.#request.failRequest();
  }

  override async respond(
    response: Partial<ResponseForRequest>,
    _priority?: number
  ): Promise<void> {
    if (!this.#request.isBlocked) {
      throw new Error('Request Interception is not enabled!');
    }
    // Request interception is not supported for data: urls.
    if (this.url().startsWith('data:')) {
      return;
    }

    const responseBody: string | undefined =
      response.body && response.body instanceof Uint8Array
        ? response.body.toString('base64')
        : response.body
          ? btoa(response.body)
          : undefined;

    const headers: Bidi.Network.Header[] = getBidiHeaders(response.headers);
    const hasContentLength = headers.some(header => {
      return header.name === 'content-length';
    });

    if (response.contentType) {
      headers.push({
        name: 'content-type',
        value: {
          type: 'string',
          value: response.contentType,
        },
      });
    }

    if (responseBody && !hasContentLength) {
      const encoder = new TextEncoder();
      headers.push({
        name: 'content-length',
        value: {
          type: 'string',
          value: String(encoder.encode(responseBody).byteLength),
        },
      });
    }
    const status = response.status || 200;

    return await this.#request.provideResponse({
      statusCode: status,
      headers: headers.length > 0 ? headers : undefined,
      reasonPhrase: STATUS_TEXTS[status],
      body: responseBody
        ? {
            type: 'base64',
            value: responseBody,
          }
        : undefined,
    });
  }
}

function getBidiHeaders(rawHeaders?: Record<string, unknown>) {
  const headers: Bidi.Network.Header[] = [];
  for (const [name, value] of Object.entries(rawHeaders ?? [])) {
    if (!Object.is(value, undefined)) {
      const values = Array.isArray(value) ? value : [value];

      for (const value of values) {
        headers.push({
          name: name.toLowerCase(),
          value: {
            type: 'string',
            value: String(value),
          },
        });
      }
    }
  }

  return headers;
}
