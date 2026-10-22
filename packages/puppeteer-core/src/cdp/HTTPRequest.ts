/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Protocol} from 'devtools-protocol';

import type {CDPSession} from '../api/CDPSession.js';
import type {Frame} from '../api/Frame.js';
import {
  type ContinueRequestOverridesInternal,
  headersArray,
  HTTPRequest,
  InterceptResolutionAction,
  type ResourceType,
  type ResponseForRequestInternal,
  STATUS_TEXTS,
  handleError,
} from '../api/HTTPRequest.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {
  mergeUint8Arrays,
  stringToBase64,
  stringToTypedArray,
} from '../util/encoding.js';

import type {CdpHTTPResponse} from './HTTPResponse.js';

type InterceptResolution =
  | {
      action: InterceptResolutionAction.Continue;
      overrides: ContinueRequestOverridesInternal;
    }
  | {
      action: InterceptResolutionAction.Respond;
      response: Partial<ResponseForRequestInternal>;
    }
  | {
      action: InterceptResolutionAction.Abort;
      errorReason: Protocol.Network.ErrorReason | null;
    };

/**
 * @internal
 */
export class CdpHTTPRequest extends HTTPRequest {
  override id: string;
  declare _redirectChain: CdpHTTPRequest[];
  declare _response: CdpHTTPResponse | null;

  #client: CDPSession;
  #fetchClient: CDPSession;
  #isNavigationRequest: boolean;

  #url: string;
  #resourceType: ResourceType;

  #method: string;
  #hasPostData = false;
  #postData?: string;
  #postDataBytes?: Uint8Array;
  #hasCompletePostData = false;
  #headers: Record<string, string> = {};
  #frame: Frame | null;
  #initiator?: Protocol.Network.Initiator;
  #logger: Logger;
  #resolution: InterceptResolution | null = null;

  override get client(): CDPSession {
    return this.#client;
  }

  override set client(newClient: CDPSession) {
    this.#client = newClient;
  }

  /**
   * @internal
   */
  get _fetchClient(): CDPSession {
    return this.#fetchClient;
  }

  set _fetchClient(fetchClient: CDPSession) {
    this.#fetchClient = fetchClient;
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
    redirectChain: CdpHTTPRequest[],
    logger: Logger,
    fetchClient: CDPSession = client,
  ) {
    super();
    this.#logger = logger;
    this.#client = client;
    this.#fetchClient = fetchClient;
    this.id = data.requestId;
    this.#isNavigationRequest =
      data.requestId === data.loaderId && data.type === 'Document';
    this._interceptionId = interceptionId;
    this.#url = data.request.url + (data.request.urlFragment ?? '');
    this.#resourceType = (data.type || 'other').toLowerCase() as ResourceType;
    this.#method = data.request.method;
    if (
      data.request.postDataEntries &&
      data.request.postDataEntries.length > 0
    ) {
      this.#hasCompletePostData = data.request.postDataEntries.every(entry => {
        return !!entry.bytes;
      });
      this.#postDataBytes = mergeUint8Arrays(
        data.request.postDataEntries
          .map(entry => {
            return entry.bytes ? stringToTypedArray(entry.bytes, true) : null;
          })
          .filter(entry => {
            return entry !== null;
          }),
      );
      this.#postData = new TextDecoder().decode(this.#postDataBytes);
    } else {
      this.#postData = data.request.postData;
    }
    this.#hasPostData = data.request.hasPostData ?? false;
    this.#frame = frame;
    this._redirectChain = redirectChain;
    this.#initiator = data.initiator;

    this.interception.enabled = allowInterception;

    this.updateHeaders(data.request.headers);
  }

  updateHeaders(headers: Protocol.Network.Headers): void {
    for (const [key, value] of Object.entries(headers)) {
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
    const content = await this.content();
    if (content === undefined) {
      return undefined;
    }
    return new TextDecoder().decode(content);
  }

  override async content(): Promise<Uint8Array | undefined> {
    if (
      this._interceptionId !== undefined &&
      this.interception.enabled &&
      !this.isInterceptResolutionHandled() &&
      this.#hasCompletePostData
    ) {
      // Chrome may wait for the paused request to continue before returning data.
      return this.#postDataBytes;
    }
    try {
      const result = await this.#client.send('Network.getRequestPostData', {
        requestId: this.id,
      });
      return stringToTypedArray(result.postData, result.base64Encoded);
    } catch (err) {
      this.#logger?.(DEBUG_PREFIXES.error)?.(err);
      return;
    }
  }

  override headers(): Record<string, string> {
    // Callers should not be allowed to mutate internal structure.
    return structuredClone(this.#headers);
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

  protected canBeIntercepted(): boolean {
    return !this.url().startsWith('data:') && !this._fromMemoryCache;
  }

  /**
   * @internal
   */
  async _continue(
    overrides: ContinueRequestOverridesInternal = {},
  ): Promise<void> {
    const {url, method, postData, headers} = overrides;
    this.interception.handled = true;
    this.#resolution = {action: InterceptResolutionAction.Continue, overrides};

    const postDataBinaryBase64 = postData
      ? stringToBase64(postData)
      : undefined;

    if (this._interceptionId === undefined) {
      throw new Error(
        'HTTPRequest is missing _interceptionId needed for Fetch.continueRequest',
      );
    }
    await this.#fetchClient
      .send('Fetch.continueRequest', {
        requestId: this._interceptionId,
        url,
        method,
        postData: postDataBinaryBase64,
        headers: headers ? headersArray(headers) : undefined,
      })
      .catch(error => {
        this.interception.handled = false;
        return handleError(error, this.#logger);
      });
  }

  async _respond(response: Partial<ResponseForRequestInternal>): Promise<void> {
    this.interception.handled = true;
    this.#resolution = {action: InterceptResolutionAction.Respond, response};

    let parsedBody:
      | {
          contentLength: number;
          base64: string;
        }
      | undefined;
    if (response.body) {
      parsedBody = HTTPRequest.getResponse(response.body);
    }

    const responseHeaders: Record<string, string | string[]> = {};
    if (response.headers) {
      for (const [header, value] of Object.entries(response.headers)) {
        if (value === undefined) {
          continue;
        }
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
    if (parsedBody?.contentLength && !('content-length' in responseHeaders)) {
      responseHeaders['content-length'] = String(parsedBody.contentLength);
    }

    const status = response.status || 200;
    if (this._interceptionId === undefined) {
      throw new Error(
        'HTTPRequest is missing _interceptionId needed for Fetch.fulfillRequest',
      );
    }
    await this.#fetchClient
      .send('Fetch.fulfillRequest', {
        requestId: this._interceptionId,
        responseCode: status,
        responsePhrase: STATUS_TEXTS[status],
        responseHeaders: headersArray(responseHeaders),
        body: parsedBody?.base64,
      })
      .catch(error => {
        this.interception.handled = false;
        return handleError(error, this.#logger);
      });
  }

  async _abort(
    errorReason: Protocol.Network.ErrorReason | null,
  ): Promise<void> {
    this.interception.handled = true;
    this.#resolution = {action: InterceptResolutionAction.Abort, errorReason};
    if (this._interceptionId === undefined) {
      throw new Error(
        'HTTPRequest is missing _interceptionId needed for Fetch.failRequest',
      );
    }
    await this.#fetchClient
      .send('Fetch.failRequest', {
        requestId: this._interceptionId,
        errorReason: errorReason || 'Failed',
      })
      .catch(error => {
        return handleError(error, this.#logger);
      });
  }

  /**
   * The overrides sent with `Fetch.continueRequest`, or an empty object if
   * the request was not continued.
   *
   * @internal
   */
  get _continueOverrides(): ContinueRequestOverridesInternal {
    return this.#resolution?.action === InterceptResolutionAction.Continue
      ? this.#resolution.overrides
      : {};
  }

  /**
   * Re-sends the resolution the user already chose to the current
   * `_interceptionId`. Used when Chrome restarts a request under a new
   * interception id.
   *
   * @internal
   */
  async _replayInterception(): Promise<void> {
    switch (this.#resolution?.action) {
      case InterceptResolutionAction.Continue:
        return await this._continue(this.#resolution.overrides);
      case InterceptResolutionAction.Respond:
        return await this._respond(this.#resolution.response);
      case InterceptResolutionAction.Abort:
        return await this._abort(this.#resolution.errorReason);
    }
  }
}
