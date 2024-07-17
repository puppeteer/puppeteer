/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import type {Protocol} from 'devtools-protocol';

import type {Frame} from '../api/Frame.js';
import {HTTPResponse, type RemoteAddress} from '../api/HTTPResponse.js';
import {PageEvent} from '../api/Page.js';
import {UnsupportedOperation} from '../common/Errors.js';
import {SecurityDetails} from '../common/SecurityDetails.js';
import {invokeAtMostOnceForArguments} from '../util/decorators.js';

import type {BidiHTTPRequest} from './HTTPRequest.js';

/**
 * @internal
 */
export class BidiHTTPResponse extends HTTPResponse {
  static from(
    data: Bidi.Network.ResponseData,
    request: BidiHTTPRequest,
    cdpSupported: boolean
  ): BidiHTTPResponse {
    const response = new BidiHTTPResponse(data, request, cdpSupported);
    response.#initialize();
    return response;
  }

  #data: Bidi.Network.ResponseData;
  #request: BidiHTTPRequest;
  #securityDetails?: SecurityDetails;
  #cdpSupported = false;

  private constructor(
    data: Bidi.Network.ResponseData,
    request: BidiHTTPRequest,
    cdpSupported: boolean
  ) {
    super();
    this.#data = data;
    this.#request = request;
    this.#cdpSupported = cdpSupported;

    // @ts-expect-error non-standard property.
    const securityDetails = data['goog:securityDetails'];
    if (cdpSupported && securityDetails) {
      this.#securityDetails = new SecurityDetails(
        securityDetails as Protocol.Network.SecurityDetails
      );
    }
  }

  #initialize() {
    if (this.#data.fromCache) {
      this.#request
        .frame()
        ?.page()
        .trustedEmitter.emit(PageEvent.RequestServedFromCache, this.#request);
    }
    this.#request.frame()?.page().trustedEmitter.emit(PageEvent.Response, this);
  }

  @invokeAtMostOnceForArguments
  override remoteAddress(): RemoteAddress {
    return {
      ip: '',
      port: -1,
    };
  }

  override url(): string {
    return this.#data.url;
  }

  override status(): number {
    return this.#data.status;
  }

  override statusText(): string {
    return this.#data.statusText;
  }

  override headers(): Record<string, string> {
    const headers: Record<string, string> = {};
    // TODO: Remove once the Firefox implementation is compliant with https://w3c.github.io/webdriver-bidi/#get-the-response-data.
    for (const header of this.#data.headers || []) {
      // TODO: How to handle Binary Headers
      // https://w3c.github.io/webdriver-bidi/#type-network-Header
      if (header.value.type === 'string') {
        headers[header.name.toLowerCase()] = header.value.value;
      }
    }
    return headers;
  }

  override request(): BidiHTTPRequest {
    return this.#request;
  }

  override fromCache(): boolean {
    return this.#data.fromCache;
  }

  override timing(): Protocol.Network.ResourceTiming | null {
    throw new UnsupportedOperation();
  }

  override frame(): Frame | null {
    return this.#request.frame();
  }

  override fromServiceWorker(): boolean {
    return false;
  }

  override securityDetails(): SecurityDetails | null {
    if (!this.#cdpSupported) {
      throw new UnsupportedOperation();
    }
    return this.#securityDetails ?? null;
  }

  override buffer(): never {
    throw new UnsupportedOperation();
  }
}
