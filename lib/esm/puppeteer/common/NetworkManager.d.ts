/**
 * Copyright 2017 Google Inc. All rights reserved.
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
import { EventEmitter } from './EventEmitter.js';
import { Protocol } from 'devtools-protocol';
import { CDPSession } from './Connection.js';
import { FrameManager } from './FrameManager.js';
import { HTTPRequest } from './HTTPRequest.js';
/**
 * @public
 */
export interface Credentials {
    username: string;
    password: string;
}
/**
 * @public
 */
export interface NetworkConditions {
    download: number;
    upload: number;
    latency: number;
}
export interface InternalNetworkConditions extends NetworkConditions {
    offline: boolean;
}
/**
 * We use symbols to prevent any external parties listening to these events.
 * They are internal to Puppeteer.
 *
 * @internal
 */
export declare const NetworkManagerEmittedEvents: {
    readonly Request: symbol;
    readonly RequestServedFromCache: symbol;
    readonly Response: symbol;
    readonly RequestFailed: symbol;
    readonly RequestFinished: symbol;
};
/**
 * @internal
 */
export declare class NetworkManager extends EventEmitter {
    _client: CDPSession;
    _ignoreHTTPSErrors: boolean;
    _frameManager: FrameManager;
    _requestIdToRequest: Map<string, HTTPRequest>;
    _requestIdToRequestWillBeSentEvent: Map<string, Protocol.Network.RequestWillBeSentEvent>;
    _extraHTTPHeaders: Record<string, string>;
    _credentials?: Credentials;
    _attemptedAuthentications: Set<string>;
    _userRequestInterceptionEnabled: boolean;
    _userRequestInterceptionCacheSafe: boolean;
    _protocolRequestInterceptionEnabled: boolean;
    _userCacheDisabled: boolean;
    _requestIdToInterceptionId: Map<string, string>;
    _emulatedNetworkConditions: InternalNetworkConditions;
    constructor(client: CDPSession, ignoreHTTPSErrors: boolean, frameManager: FrameManager);
    initialize(): Promise<void>;
    authenticate(credentials?: Credentials): Promise<void>;
    setExtraHTTPHeaders(extraHTTPHeaders: Record<string, string>): Promise<void>;
    extraHTTPHeaders(): Record<string, string>;
    setOfflineMode(value: boolean): Promise<void>;
    emulateNetworkConditions(networkConditions: NetworkConditions | null): Promise<void>;
    _updateNetworkConditions(): Promise<void>;
    setUserAgent(userAgent: string): Promise<void>;
    setCacheEnabled(enabled: boolean): Promise<void>;
    setRequestInterception(value: boolean, cacheSafe?: boolean): Promise<void>;
    _updateProtocolRequestInterception(): Promise<void>;
    _updateProtocolCacheDisabled(): Promise<void>;
    _onRequestWillBeSent(event: Protocol.Network.RequestWillBeSentEvent): void;
    _onAuthRequired(event: Protocol.Fetch.AuthRequiredEvent): void;
    _onRequestPaused(event: Protocol.Fetch.RequestPausedEvent): void;
    _onRequest(event: Protocol.Network.RequestWillBeSentEvent, interceptionId?: string): void;
    _onRequestServedFromCache(event: Protocol.Network.RequestServedFromCacheEvent): void;
    _handleRequestRedirect(request: HTTPRequest, responsePayload: Protocol.Network.Response): void;
    _onResponseReceived(event: Protocol.Network.ResponseReceivedEvent): void;
    _onLoadingFinished(event: Protocol.Network.LoadingFinishedEvent): void;
    _onLoadingFailed(event: Protocol.Network.LoadingFailedEvent): void;
}
//# sourceMappingURL=NetworkManager.d.ts.map