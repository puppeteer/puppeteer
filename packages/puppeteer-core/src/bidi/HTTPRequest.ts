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
    frame: BidiFrame | undefined,
    redirect?: BidiHTTPRequest
  ): BidiHTTPRequest {
    const request = new BidiHTTPRequest(bidiRequest, frame, redirect);
    request.#initialize();
    return request;
  }
  #redirectBy: BidiHTTPRequest | undefined;
  #response: BidiHTTPResponse | null = null;
  override readonly id: string;
  readonly #frame: BidiFrame | undefined;
  readonly #request: Request;

  private constructor(
    request: Request,
    frame: BidiFrame | undefined,
    redirectBy?: BidiHTTPRequest
  ) {
    super();
    requests.set(request, this);

    this.interception.enabled = request.isBlocked;

    this.#request = request;
    this.#frame = frame;
    this.#redirectBy = redirectBy;
    this.id = request.id;
  }

  override get client(): CDPSession {
    throw new UnsupportedOperation();
  }

  #initialize() {
    this.#request.on('redirect', request => {
      const httpRequest = BidiHTTPRequest.from(request, this.#frame, this);
      void httpRequest.finalizeInterceptions();
    });
    this.#request.once('success', data => {
      this.#response = BidiHTTPResponse.from(data, this);
    });
    this.#request.on('authenticate', this.#handleAuthentication);

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
    if (this.#redirectBy === undefined) {
      return [];
    }
    const redirects = [this.#redirectBy];
    for (const redirect of redirects) {
      if (redirect.#redirectBy !== undefined) {
        redirects.push(redirect.#redirectBy);
      }
    }
    return redirects;
  }

  override frame(): BidiFrame | null {
    return this.#frame ?? null;
  }

  override async _continue(
    overrides: ContinueRequestOverrides = {}
  ): Promise<void> {
    const headers: Bidi.Network.Header[] = getBidiHeaders(overrides.headers);
    this.interception.handled = true;

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
        this.interception.handled = false;
        return handleError(error);
      });
  }

  override async _abort(): Promise<void> {
    this.interception.handled = true;
    return await this.#request.failRequest().catch(error => {
      this.interception.handled = false;
      throw error;
    });
  }

  override async _respond(
    response: Partial<ResponseForRequest>,
    _priority?: number
  ): Promise<void> {
    this.interception.handled = true;
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

    return await this.#request
      .provideResponse({
        statusCode: status,
        headers: headers.length > 0 ? headers : undefined,
        reasonPhrase: STATUS_TEXTS[status],
        body: responseBody
          ? {
              type: 'base64',
              value: responseBody,
            }
          : undefined,
      })
      .catch(error => {
        this.interception.handled = false;
        throw error;
      });
  }

  #authenticationHandled = false;
  #handleAuthentication = async () => {
    if (!this.#frame) {
      return;
    }
    const credentials = this.#frame.page()._credentials;
    if (credentials && !this.#authenticationHandled) {
      this.#authenticationHandled = true;
      void this.#request.continueWithAuth({
        action: 'provideCredentials',
        credentials: {
          type: 'password',
          username: credentials.username,
          password: credentials.password,
        },
      });
    } else {
      void this.#request.continueWithAuth({
        action: 'cancel',
      });
    }
  };
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
