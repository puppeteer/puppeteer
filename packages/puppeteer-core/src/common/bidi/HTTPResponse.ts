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
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import Protocol from 'devtools-protocol';

import {Frame} from '../../api/Frame.js';
import {
  HTTPResponse as BaseHTTPResponse,
  RemoteAddress,
} from '../../api/HTTPResponse.js';

import {HTTPRequest} from './HTTPRequest.js';

/**
 * @internal
 */
export class HTTPResponse extends BaseHTTPResponse {
  #request: HTTPRequest;
  #remoteAddress: RemoteAddress;
  #status: number;
  #statusText: string;
  #url: string;
  #fromCache: boolean;
  #headers: Record<string, string> = {};
  #timings: Record<string, string> | null;

  constructor(
    request: HTTPRequest,
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

  override request(): HTTPRequest {
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
}
