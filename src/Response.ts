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
import { CDPSession } from './Connection';
import { Frame } from './FrameManager';
import { Request } from './Request';
import { SecurityDetails } from './SecurityDetails';
import Protocol from './protocol';

interface RemoteAddress {
  ip: string;
  port: number;
}

export class Response {
  private _client: CDPSession;
  private _request: Request;
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

  constructor(
    client: CDPSession,
    request: Request,
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

  _resolveBody(err: Error | null): void {
    return this._bodyLoadedPromiseFulfill(err);
  }

  remoteAddress(): RemoteAddress {
    return this._remoteAddress;
  }

  url(): string {
    return this._url;
  }

  ok(): boolean {
    return this._status === 0 || (this._status >= 200 && this._status <= 299);
  }

  status(): number {
    return this._status;
  }

  statusText(): string {
    return this._statusText;
  }

  headers(): Record<string, string> {
    return this._headers;
  }

  securityDetails(): SecurityDetails | null {
    return this._securityDetails;
  }

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

  async text(): Promise<string> {
    const content = await this.buffer();
    return content.toString('utf8');
  }

  async json(): Promise<any> {
    const content = await this.text();
    return JSON.parse(content);
  }

  request(): Request {
    return this._request;
  }

  fromCache(): boolean {
    return this._fromDiskCache || this._request._fromMemoryCache;
  }

  fromServiceWorker(): boolean {
    return this._fromServiceWorker;
  }

  frame(): Frame | null {
    return this._request.frame();
  }
}
