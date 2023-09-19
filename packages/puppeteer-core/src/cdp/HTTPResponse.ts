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
import {type Protocol} from 'devtools-protocol';

import {type CDPSession} from '../api/CDPSession.js';
import {type Frame} from '../api/Frame.js';
import {HTTPResponse, type RemoteAddress} from '../api/HTTPResponse.js';
import {ProtocolError} from '../common/Errors.js';
import {SecurityDetails} from '../common/SecurityDetails.js';
import {Deferred} from '../util/Deferred.js';

import {type CdpHTTPRequest} from './HTTPRequest.js';

/**
 * @internal
 */
export class CdpHTTPResponse extends HTTPResponse {
  #client: CDPSession;
  #request: CdpHTTPRequest;
  #contentPromise: Promise<Buffer> | null = null;
  #bodyLoadedDeferred = Deferred.create<Error | void>();
  #remoteAddress: RemoteAddress;
  #status: number;
  #statusText: string;
  #url: string;
  #fromDiskCache: boolean;
  #fromServiceWorker: boolean;
  #headers: Record<string, string> = {};
  #securityDetails: SecurityDetails | null;
  #timing: Protocol.Network.ResourceTiming | null;

  constructor(
    client: CDPSession,
    request: CdpHTTPRequest,
    responsePayload: Protocol.Network.Response,
    extraInfo: Protocol.Network.ResponseReceivedExtraInfoEvent | null
  ) {
    super();
    this.#client = client;
    this.#request = request;

    this.#remoteAddress = {
      ip: responsePayload.remoteIPAddress,
      port: responsePayload.remotePort,
    };
    this.#statusText =
      this.#parseStatusTextFromExtraInfo(extraInfo) ||
      responsePayload.statusText;
    this.#url = request.url();
    this.#fromDiskCache = !!responsePayload.fromDiskCache;
    this.#fromServiceWorker = !!responsePayload.fromServiceWorker;

    this.#status = extraInfo ? extraInfo.statusCode : responsePayload.status;
    const headers = extraInfo ? extraInfo.headers : responsePayload.headers;
    for (const [key, value] of Object.entries(headers)) {
      this.#headers[key.toLowerCase()] = value;
    }

    this.#securityDetails = responsePayload.securityDetails
      ? new SecurityDetails(responsePayload.securityDetails)
      : null;
    this.#timing = responsePayload.timing || null;
  }

  #parseStatusTextFromExtraInfo(
    extraInfo: Protocol.Network.ResponseReceivedExtraInfoEvent | null
  ): string | undefined {
    if (!extraInfo || !extraInfo.headersText) {
      return;
    }
    const firstLine = extraInfo.headersText.split('\r', 1)[0];
    if (!firstLine) {
      return;
    }
    const match = firstLine.match(/[^ ]* [^ ]* (.*)/);
    if (!match) {
      return;
    }
    const statusText = match[1];
    if (!statusText) {
      return;
    }
    return statusText;
  }

  override _resolveBody(err: Error | null): void {
    if (err) {
      return this.#bodyLoadedDeferred.resolve(err);
    }
    return this.#bodyLoadedDeferred.resolve();
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

  override securityDetails(): SecurityDetails | null {
    return this.#securityDetails;
  }

  override timing(): Protocol.Network.ResourceTiming | null {
    return this.#timing;
  }

  override buffer(): Promise<Buffer> {
    if (!this.#contentPromise) {
      this.#contentPromise = this.#bodyLoadedDeferred
        .valueOrThrow()
        .then(async error => {
          if (error) {
            throw error;
          }
          try {
            const response = await this.#client.send(
              'Network.getResponseBody',
              {
                requestId: this.#request._requestId,
              }
            );
            return Buffer.from(
              response.body,
              response.base64Encoded ? 'base64' : 'utf8'
            );
          } catch (error) {
            if (
              error instanceof ProtocolError &&
              error.originalMessage ===
                'No resource with given identifier found'
            ) {
              throw new ProtocolError(
                'Could not load body for this request. This might happen if the request is a preflight request.'
              );
            }

            throw error;
          }
        });
    }
    return this.#contentPromise;
  }

  override request(): CdpHTTPRequest {
    return this.#request;
  }

  override fromCache(): boolean {
    return this.#fromDiskCache || this.#request._fromMemoryCache;
  }

  override fromServiceWorker(): boolean {
    return this.#fromServiceWorker;
  }

  override frame(): Frame | null {
    return this.#request.frame();
  }
}
