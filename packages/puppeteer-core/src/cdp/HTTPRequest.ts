/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import type {Frame} from '../api/Frame.js';
import {
  type ContinueRequestOverrides,
  headersArray,
  HTTPRequest,
  type ResourceType,
  type ResponseForRequest,
  STATUS_TEXTS,
  handleError,
} from '../api/HTTPRequest.js';
import {debugError, isString} from '../common/util.js';

import type {CdpHTTPResponse} from './HTTPResponse.js';

/**
 * @internal
 */
export class CdpHTTPRequest extends HTTPRequest {
  override id: string;
  declare _redirectChain: CdpHTTPRequest[];
  declare _response: CdpHTTPResponse | null;

  #client: CDPSession;
  #isNavigationRequest: boolean;

  #url: string;
  #resourceType: ResourceType;

  #method: string;
  #hasPostData = false;
  #postData?: string;
  #headers: Record<string, string> = {};
  #frame: Frame | null;
  #initiator?: Protocol.Network.Initiator;

  override get client(): CDPSession {
    return this.#client;
  }

  constructor(
    client: CDPSession,
    frame: Frame | null,
    interceptionId: string | undefined,
    allowInterception: boolean,
    data: {
      /**
       * Request identifier.
       */
      requestId: Protocol.Network.RequestId;
      /**
       * Loader identifier. Empty string if the request is fetched from worker.
       */
      loaderId?: Protocol.Network.LoaderId;
      /**
       * URL of the document this request is loaded for.
       */
      documentURL?: string;
      /**
       * Request data.
       */
      request: Protocol.Network.Request;
      /**
       * Request initiator.
       */
      initiator?: Protocol.Network.Initiator;
      /**
       * Type of this resource.
       */
      type?: Protocol.Network.ResourceType;
    },
    redirectChain: CdpHTTPRequest[]
  ) {
    super();
    this.#client = client;
    this.id = data.requestId;
    this.#isNavigationRequest =
      data.requestId === data.loaderId && data.type === 'Document';
    this._interceptionId = interceptionId;
    this.#url = data.request.url;
    this.#resourceType = (data.type || 'other').toLowerCase() as ResourceType;
    this.#method = data.request.method;
    this.#postData = data.request.postData;
    this.#hasPostData = data.request.hasPostData ?? false;
    this.#frame = frame;
    this._redirectChain = redirectChain;
    this.#initiator = data.initiator;

    this.interception.enabled = allowInterception;

    for (const [key, value] of Object.entries(data.request.headers)) {
      this.#headers[key.toLowerCase()] = value;
    }
  }

  override url(): string {
    return this.#url;
  }

  override resourceType(): ResourceType {
    return this.#resourceType;
  }

  override method(): string {
    return this.#method;
  }

  override postData(): string | undefined {
    return this.#postData;
  }

  override hasPostData(): boolean {
    return this.#hasPostData;
  }

  override async fetchPostData(): Promise<string | undefined> {
    try {
      const result = await this.#client.send('Network.getRequestPostData', {
        requestId: this.id,
      });
      return result.postData;
    } catch (err) {
      debugError(err);
      return;
    }
  }

  override headers(): Record<string, string> {
    return this.#headers;
  }

  override response(): CdpHTTPResponse | null {
    return this._response;
  }

  override frame(): Frame | null {
    return this.#frame;
  }

  override isNavigationRequest(): boolean {
    return this.#isNavigationRequest;
  }

  override initiator(): Protocol.Network.Initiator | undefined {
    return this.#initiator;
  }

  override redirectChain(): CdpHTTPRequest[] {
    return this._redirectChain.slice();
  }

  override failure(): {errorText: string} | null {
    if (!this._failureText) {
      return null;
    }
    return {
      errorText: this._failureText,
    };
  }

  /**
   * @internal
   */
  async _continue(overrides: ContinueRequestOverrides = {}): Promise<void> {
    const {url, method, postData, headers} = overrides;
    this.interception.handled = true;

    const postDataBinaryBase64 = postData
      ? Buffer.from(postData).toString('base64')
      : undefined;

    if (this._interceptionId === undefined) {
      throw new Error(
        'HTTPRequest is missing _interceptionId needed for Fetch.continueRequest'
      );
    }
    await this.#client
      .send('Fetch.continueRequest', {
        requestId: this._interceptionId,
        url,
        method,
        postData: postDataBinaryBase64,
        headers: headers ? headersArray(headers) : undefined,
      })
      .catch(error => {
        this.interception.handled = false;
        return handleError(error);
      });
  }

  async _respond(response: Partial<ResponseForRequest>): Promise<void> {
    this.interception.handled = true;

    const responseBody: Buffer | null =
      response.body && isString(response.body)
        ? Buffer.from(response.body)
        : (response.body as Buffer) || null;

    const responseHeaders: Record<string, string | string[]> = {};
    if (response.headers) {
      for (const header of Object.keys(response.headers)) {
        const value = response.headers[header];

        responseHeaders[header.toLowerCase()] = Array.isArray(value)
          ? value.map(item => {
              return String(item);
            })
          : String(value);
      }
    }
    if (response.contentType) {
      responseHeaders['content-type'] = response.contentType;
    }
    if (responseBody && !('content-length' in responseHeaders)) {
      responseHeaders['content-length'] = String(
        Buffer.byteLength(responseBody)
      );
    }

    const status = response.status || 200;
    if (this._interceptionId === undefined) {
      throw new Error(
        'HTTPRequest is missing _interceptionId needed for Fetch.fulfillRequest'
      );
    }
    await this.#client
      .send('Fetch.fulfillRequest', {
        requestId: this._interceptionId,
        responseCode: status,
        responsePhrase: STATUS_TEXTS[status],
        responseHeaders: headersArray(responseHeaders),
        body: responseBody ? responseBody.toString('base64') : undefined,
      })
      .catch(error => {
        this.interception.handled = false;
        return handleError(error);
      });
  }

  async _abort(
    errorReason: Protocol.Network.ErrorReason | null
  ): Promise<void> {
    this.interception.handled = true;
    if (this._interceptionId === undefined) {
      throw new Error(
        'HTTPRequest is missing _interceptionId needed for Fetch.failRequest'
      );
    }
    await this.#client
      .send('Fetch.failRequest', {
        requestId: this._interceptionId,
        errorReason: errorReason || 'Failed',
      })
      .catch(handleError);
  }
}
