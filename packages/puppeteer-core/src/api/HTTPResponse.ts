/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import Protocol from 'devtools-protocol';

import {SecurityDetails} from '../common/SecurityDetails.js';

import {Frame} from './Frame.js';
import {HTTPRequest} from './HTTPRequest.js';

/**
 * @public
 */
export interface RemoteAddress {
  ip?: string;
  port?: number;
}

/**
 * The HTTPResponse class represents responses which are received by the
 * {@link Page} class.
 *
 * @public
 */
export class HTTPResponse {
  /**
   * @internal
   */
  constructor() {}

  /**
   * @internal
   */
  _resolveBody(_err: Error | null): void {
    throw new Error('Not implemented');
  }

  /**
   * The IP address and port number used to connect to the remote
   * server.
   */
  remoteAddress(): RemoteAddress {
    throw new Error('Not implemented');
  }

  /**
   * The URL of the response.
   */
  url(): string {
    throw new Error('Not implemented');
  }

  /**
   * True if the response was successful (status in the range 200-299).
   */
  ok(): boolean {
    // TODO: document === 0 case?
    const status = this.status();
    return status === 0 || (status >= 200 && status <= 299);
  }

  /**
   * The status code of the response (e.g., 200 for a success).
   */
  status(): number {
    throw new Error('Not implemented');
  }

  /**
   * The status text of the response (e.g. usually an "OK" for a
   * success).
   */
  statusText(): string {
    throw new Error('Not implemented');
  }

  /**
   * An object with HTTP headers associated with the response. All
   * header names are lower-case.
   */
  headers(): Record<string, string> {
    throw new Error('Not implemented');
  }

  /**
   * {@link SecurityDetails} if the response was received over the
   * secure connection, or `null` otherwise.
   */
  securityDetails(): SecurityDetails | null {
    throw new Error('Not implemented');
  }

  /**
   * Timing information related to the response.
   */
  timing(): Protocol.Network.ResourceTiming | null {
    throw new Error('Not implemented');
  }

  /**
   * Promise which resolves to a buffer with response body.
   */
  buffer(): Promise<Buffer> {
    throw new Error('Not implemented');
  }

  /**
   * Promise which resolves to a text representation of response body.
   */
  async text(): Promise<string> {
    const content = await this.buffer();
    return content.toString('utf8');
  }

  /**
   * Promise which resolves to a JSON representation of response body.
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
   * A matching {@link HTTPRequest} object.
   */
  request(): HTTPRequest {
    throw new Error('Not implemented');
  }

  /**
   * True if the response was served from either the browser's disk
   * cache or memory cache.
   */
  fromCache(): boolean {
    throw new Error('Not implemented');
  }

  /**
   * True if the response was served by a service worker.
   */
  fromServiceWorker(): boolean {
    throw new Error('Not implemented');
  }

  /**
   * A {@link Frame} that initiated this response, or `null` if
   * navigating to error pages.
   */
  frame(): Frame | null {
    throw new Error('Not implemented');
  }
}
