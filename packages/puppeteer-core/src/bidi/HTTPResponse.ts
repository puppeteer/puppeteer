/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import type Protocol from 'devtools-protocol';

import type {Frame} from '../api/Frame.js';
import {
  HTTPResponse as HTTPResponse,
  type RemoteAddress,
} from '../api/HTTPResponse.js';
import {UnsupportedOperation} from '../common/Errors.js';

import type {BidiHTTPRequest} from './HTTPRequest.js';

/**
 * @internal
 */
export class BidiHTTPResponse extends HTTPResponse {
  #request: BidiHTTPRequest;
  #remoteAddress: RemoteAddress;
  #status: number;
  #statusText: string;
  #url: string;
  #fromCache: boolean;
  #headers: Record<string, string> = {};
  #timings: Record<string, string> | null;

  constructor(
    request: BidiHTTPRequest,
    {response}: Bidi.Network.ResponseCompletedParameters
  ) {
    super();
    this.#request = request;

    this.#remoteAddress = {
      ip: '',
      port: -1,
    };

    this.#url = response.url;
    this.#fromCache = response.fromCache;
    this.#status = response.status;
    this.#statusText = response.statusText;
    // TODO: File and issue with BiDi spec
    this.#timings = null;

    // TODO: Removed once the Firefox implementation is compliant with https://w3c.github.io/webdriver-bidi/#get-the-response-data.
    for (const header of response.headers || []) {
      // TODO: How to handle Binary Headers
      // https://w3c.github.io/webdriver-bidi/#type-network-Header
      if (header.value.type === 'string') {
        this.#headers[header.name.toLowerCase()] = header.value.value;
      }
    }
  }

  override remoteAddress(): RemoteAddress {
    return this.#remoteAddress;
  }

  override url(): string {
    return this.#url;
  }

  override status(): number {
    return this.#status;
  }

  override statusText(): string {
    return this.#statusText;
  }

  override headers(): Record<string, string> {
    return this.#headers;
  }

  override request(): BidiHTTPRequest {
    return this.#request;
  }

  override fromCache(): boolean {
    return this.#fromCache;
  }

  override timing(): Protocol.Network.ResourceTiming | null {
    return this.#timings as any;
  }

  override frame(): Frame | null {
    return this.#request.frame();
  }

  override fromServiceWorker(): boolean {
    return false;
  }

  override securityDetails(): never {
    throw new UnsupportedOperation();
  }

  override buffer(): never {
    throw new UnsupportedOperation();
  }
}
