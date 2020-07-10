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
import { CDPSession } from './Connection.js';
import { Frame } from './FrameManager.js';
import { HTTPRequest } from './HTTPRequest.js';
import { SecurityDetails } from './SecurityDetails.js';
import { Protocol } from 'devtools-protocol';

/**
 * @public
 */
export interface RemoteAddress {
  ip: string;
  port: number;
}

/**
 * The HTTPResponse class represents responses which are received by the
 * {@link Page} class.
 *
 * @public
 */
export class HTTPResponse {
  private _client: CDPSession;
  private _request: HTTPRequest;
  private _contentPromise: Promise<Buffer> | null = null;
  private _bodyLoadedPromise: Promise<Error | void>;
  private _bodyLoadedPromiseFulfill: (err: Error | void) => void;
  private _remoteAddress: RemoteAddress;
  private _status: number;
  private _statusText: string;
  private _url: string;
  private _fromDiskCache: boolean;
  private _fromServiceWorker: boolean;
  private _headers: Record<string, string> = {};
  private _securityDetails: SecurityDetails | null;

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    request: HTTPRequest,
    responsePayload: Protocol.Network.Response
  ) {
    this._client = client;
    this._request = request;

    this._bodyLoadedPromise = new Promise((fulfill) => {
      this._bodyLoadedPromiseFulfill = fulfill;
    });

    this._remoteAddress = {
      ip: responsePayload.remoteIPAddress,
      port: responsePayload.remotePort,
    };
    this._status = responsePayload.status;
    this._statusText = responsePayload.statusText;
    this._url = request.url();
    this._fromDiskCache = !!responsePayload.fromDiskCache;
    this._fromServiceWorker = !!responsePayload.fromServiceWorker;
    for (const key of Object.keys(responsePayload.headers))
      this._headers[key.toLowerCase()] = responsePayload.headers[key];
    this._securityDetails = responsePayload.securityDetails
      ? new SecurityDetails(responsePayload.securityDetails)
      : null;
  }

  /**
   * @internal
   */
  _resolveBody(err: Error | null): void {
    return this._bodyLoadedPromiseFulfill(err);
  }

  /**
   * @returns The IP address and port number used to connect to the remote
   * server.
   */
  remoteAddress(): RemoteAddress {
    return this._remoteAddress;
  }

  /**
   * @returns The URL of the response.
   */
  url(): string {
    return this._url;
  }

  /**
   * @returns True if the response was successful (status in the range 200-299).
   */
  ok(): boolean {
    // TODO: document === 0 case?
    return this._status === 0 || (this._status >= 200 && this._status <= 299);
  }

  /**
   * @returns The status code of the response (e.g., 200 for a success).
   */
  status(): number {
    return this._status;
  }

  /**
   * @returns  The status text of the response (e.g. usually an "OK" for a
   * success).
   */
  statusText(): string {
    return this._statusText;
  }

  /**
   * @returns An object with HTTP headers associated with the response. All
   * header names are lower-case.
   */
  headers(): Record<string, string> {
    return this._headers;
  }

  /**
   * @returns {@link SecurityDetails} if the response was received over the
   * secure connection, or `null` otherwise.
   */
  securityDetails(): SecurityDetails | null {
    return this._securityDetails;
  }

  /**
   * @returns Promise which resolves to a buffer with response body.
   */
  buffer(): Promise<Buffer> {
    if (!this._contentPromise) {
      this._contentPromise = this._bodyLoadedPromise.then(async (error) => {
        if (error) throw error;
        const response = await this._client.send('Network.getResponseBody', {
          requestId: this._request._requestId,
        });
        return Buffer.from(
          response.body,
          response.base64Encoded ? 'base64' : 'utf8'
        );
      });
    }
    return this._contentPromise;
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
    return this._request;
  }

  /**
   * @returns True if the response was served from either the browser's disk
   * cache or memory cache.
   */
  fromCache(): boolean {
    return this._fromDiskCache || this._request._fromMemoryCache;
  }

  /**
   * @returns True if the response was served by a service worker.
   */
  fromServiceWorker(): boolean {
    return this._fromServiceWorker;
  }

  /**
   * @returns A {@link Frame} that initiated this response, or `null` if
   * navigating to error pages.
   */
  frame(): Frame | null {
    return this._request.frame();
  }
}
