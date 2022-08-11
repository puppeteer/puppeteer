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
import {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping.js';

import {EventEmitter} from './EventEmitter.js';
import {Frame} from './FrameManager.js';
import {HTTPRequest} from './HTTPRequest.js';
import {SecurityDetails} from './SecurityDetails.js';
import {Protocol} from 'devtools-protocol';
import {ProtocolError} from './Errors.js';

/**
 * @public
 */
export interface RemoteAddress {
  ip?: string;
  port?: number;
}

interface CDPSession extends EventEmitter {
  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;
}

/**
 * The HTTPResponse class represents responses which are received by the
 * {@link Page} class.
 *
 * @public
 */
export class HTTPResponse {
  #client: CDPSession;
  #request: HTTPRequest;
  #contentPromise: Promise<Buffer> | null = null;
  #bodyLoadedPromise: Promise<Error | void>;
  #bodyLoadedPromiseFulfill: (err: Error | void) => void = () => {};
  #remoteAddress: RemoteAddress;
  #status: number;
  #statusText: string;
  #url: string;
  #fromDiskCache: boolean;
  #fromServiceWorker: boolean;
  #headers: Record<string, string> = {};
  #securityDetails: SecurityDetails | null;
  #timing: Protocol.Network.ResourceTiming | null;

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    request: HTTPRequest,
    responsePayload: Protocol.Network.Response,
    extraInfo: Protocol.Network.ResponseReceivedExtraInfoEvent | null
  ) {
    this.#client = client;
    this.#request = request;

    this.#bodyLoadedPromise = new Promise(fulfill => {
      this.#bodyLoadedPromiseFulfill = fulfill;
    });

    this.#remoteAddress = {
      ip: responsePayload.remoteIPAddress,
      port: responsePayload.remotePort,
    };
    this.#statusText =
      this.#parseStatusTextFromExtrInfo(extraInfo) ||
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

  #parseStatusTextFromExtrInfo(
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

  /**
   * @internal
   */
  _resolveBody(err: Error | null): void {
    if (err) {
      return this.#bodyLoadedPromiseFulfill(err);
    }
    return this.#bodyLoadedPromiseFulfill();
  }

  /**
   * @returns The IP address and port number used to connect to the remote
   * server.
   */
  remoteAddress(): RemoteAddress {
    return this.#remoteAddress;
  }

  /**
   * @returns The URL of the response.
   */
  url(): string {
    return this.#url;
  }

  /**
   * @returns True if the response was successful (status in the range 200-299).
   */
  ok(): boolean {
    // TODO: document === 0 case?
    return this.#status === 0 || (this.#status >= 200 && this.#status <= 299);
  }

  /**
   * @returns The status code of the response (e.g., 200 for a success).
   */
  status(): number {
    return this.#status;
  }

  /**
   * @returns The status text of the response (e.g. usually an "OK" for a
   * success).
   */
  statusText(): string {
    return this.#statusText;
  }

  /**
   * @returns An object with HTTP headers associated with the response. All
   * header names are lower-case.
   */
  headers(): Record<string, string> {
    return this.#headers;
  }

  /**
   * @returns {@link SecurityDetails} if the response was received over the
   * secure connection, or `null` otherwise.
   */
  securityDetails(): SecurityDetails | null {
    return this.#securityDetails;
  }

  /**
   * @returns Timing information related to the response.
   */
  timing(): Protocol.Network.ResourceTiming | null {
    return this.#timing;
  }

  /**
   * @returns Promise which resolves to a buffer with response body.
   */
  buffer(): Promise<Buffer> {
    if (!this.#contentPromise) {
      this.#contentPromise = this.#bodyLoadedPromise.then(async error => {
        if (error) {
          throw error;
        }
        try {
          const response = await this.#client.send('Network.getResponseBody', {
            requestId: this.#request._requestId,
          });
          return Buffer.from(
            response.body,
            response.base64Encoded ? 'base64' : 'utf8'
          );
        } catch (error) {
          if (
            error instanceof ProtocolError &&
            error.originalMessage === 'No resource with given identifier found'
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

  /**
   * @returns Promise which resolves to a text representation of response body.
   */
  async text(): Promise<string> {
    const content = await this.buffer();
    return content.toString('utf8');
  }

  /**
   *
   * @returns Promise which resolves to a JSON representation of response body.
   *
   * @remarks
   *
   * This method will throw if the response body is not parsable via
   * `JSON.parse`.
   */
  async json(): Promise<any> {
    const content = await this.text();
    return JSON.parse(content);
  }

  /**
   * @returns A matching {@link HTTPRequest} object.
   */
  request(): HTTPRequest {
    return this.#request;
  }

  /**
   * @returns True if the response was served from either the browser's disk
   * cache or memory cache.
   */
  fromCache(): boolean {
    return this.#fromDiskCache || this.#request._fromMemoryCache;
  }

  /**
   * @returns True if the response was served by a service worker.
   */
  fromServiceWorker(): boolean {
    return this.#fromServiceWorker;
  }

  /**
   * @returns A {@link Frame} that initiated this response, or `null` if
   * navigating to error pages.
   */
  frame(): Frame | null {
    return this.#request.frame();
  }
}
