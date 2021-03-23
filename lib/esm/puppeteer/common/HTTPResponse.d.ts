/// <reference types="node" />
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
export declare class HTTPResponse {
    private _client;
    private _request;
    private _contentPromise;
    private _bodyLoadedPromise;
    private _bodyLoadedPromiseFulfill;
    private _remoteAddress;
    private _status;
    private _statusText;
    private _url;
    private _fromDiskCache;
    private _fromServiceWorker;
    private _headers;
    private _securityDetails;
    /**
     * @internal
     */
    constructor(client: CDPSession, request: HTTPRequest, responsePayload: Protocol.Network.Response);
    /**
     * @internal
     */
    _resolveBody(err: Error | null): void;
    /**
     * @returns The IP address and port number used to connect to the remote
     * server.
     */
    remoteAddress(): RemoteAddress;
    /**
     * @returns The URL of the response.
     */
    url(): string;
    /**
     * @returns True if the response was successful (status in the range 200-299).
     */
    ok(): boolean;
    /**
     * @returns The status code of the response (e.g., 200 for a success).
     */
    status(): number;
    /**
     * @returns  The status text of the response (e.g. usually an "OK" for a
     * success).
     */
    statusText(): string;
    /**
     * @returns An object with HTTP headers associated with the response. All
     * header names are lower-case.
     */
    headers(): Record<string, string>;
    /**
     * @returns {@link SecurityDetails} if the response was received over the
     * secure connection, or `null` otherwise.
     */
    securityDetails(): SecurityDetails | null;
    /**
     * @returns Promise which resolves to a buffer with response body.
     */
    buffer(): Promise<Buffer>;
    /**
     * @returns Promise which resolves to a text representation of response body.
     */
    text(): Promise<string>;
    /**
     *
     * @returns Promise which resolves to a JSON representation of response body.
     *
     * @remarks
     *
     * This method will throw if the response body is not parsable via
     * `JSON.parse`.
     */
    json(): Promise<any>;
    /**
     * @returns A matching {@link HTTPRequest} object.
     */
    request(): HTTPRequest;
    /**
     * @returns True if the response was served from either the browser's disk
     * cache or memory cache.
     */
    fromCache(): boolean;
    /**
     * @returns True if the response was served by a service worker.
     */
    fromServiceWorker(): boolean;
    /**
     * @returns A {@link Frame} that initiated this response, or `null` if
     * navigating to error pages.
     */
    frame(): Frame | null;
}
//# sourceMappingURL=HTTPResponse.d.ts.map