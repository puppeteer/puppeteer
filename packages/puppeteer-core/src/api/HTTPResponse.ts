/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type Protocol from 'devtools-protocol';

import type {SecurityDetails} from '../common/SecurityDetails.js';

import type {Frame} from './Frame.js';
import type {HTTPRequest} from './HTTPRequest.js';

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
export abstract class HTTPResponse {
  /**
   * @internal
   */
  constructor() {}

  /**
   * The IP address and port number used to connect to the remote
   * server.
   */
  abstract remoteAddress(): RemoteAddress;

  /**
   * The URL of the response.
   */
  abstract url(): string;

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
  abstract status(): number;

  /**
   * The status text of the response (e.g. usually an "OK" for a
   * success).
   */
  abstract statusText(): string;

  /**
   * An object with HTTP headers associated with the response. All
   * header names are lower-case.
   */
  abstract headers(): Record<string, string>;

  /**
   * {@link SecurityDetails} if the response was received over the
   * secure connection, or `null` otherwise.
   */
  abstract securityDetails(): SecurityDetails | null;

  /**
   * Timing information related to the response.
   */
  abstract timing(): Protocol.Network.ResourceTiming | null;

  /**
   * Promise which resolves to a buffer with response body.
   */
  abstract buffer(): Promise<Buffer>;

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
  abstract request(): HTTPRequest;

  /**
   * True if the response was served from either the browser's disk
   * cache or memory cache.
   */
  abstract fromCache(): boolean;

  /**
   * True if the response was served by a service worker.
   */
  abstract fromServiceWorker(): boolean;

  /**
   * A {@link Frame} that initiated this response, or `null` if
   * navigating to error pages.
   */
  abstract frame(): Frame | null;
}
