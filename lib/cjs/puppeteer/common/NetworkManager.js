"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkManager = exports.NetworkManagerEmittedEvents = void 0;
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
const EventEmitter_js_1 = require("./EventEmitter.js");
const assert_js_1 = require("./assert.js");
const helper_js_1 = require("./helper.js");
const HTTPRequest_js_1 = require("./HTTPRequest.js");
const HTTPResponse_js_1 = require("./HTTPResponse.js");
/**
 * We use symbols to prevent any external parties listening to these events.
 * They are internal to Puppeteer.
 *
 * @internal
 */
exports.NetworkManagerEmittedEvents = {
    Request: Symbol('NetworkManager.Request'),
    RequestServedFromCache: Symbol('NetworkManager.RequestServedFromCache'),
    Response: Symbol('NetworkManager.Response'),
    RequestFailed: Symbol('NetworkManager.RequestFailed'),
    RequestFinished: Symbol('NetworkManager.RequestFinished'),
};
/**
 * @internal
 */
class NetworkManager extends EventEmitter_js_1.EventEmitter {
    constructor(client, ignoreHTTPSErrors, frameManager) {
        super();
        this._requestIdToRequest = new Map();
        this._requestIdToRequestWillBeSentEvent = new Map();
        this._extraHTTPHeaders = {};
        this._credentials = null;
        this._attemptedAuthentications = new Set();
        this._userRequestInterceptionEnabled = false;
        this._userRequestInterceptionCacheSafe = false;
        this._protocolRequestInterceptionEnabled = false;
        this._userCacheDisabled = false;
        this._requestIdToInterceptionId = new Map();
        this._emulatedNetworkConditions = {
            offline: false,
            upload: -1,
            download: -1,
            latency: 0,
        };
        this._client = client;
        this._ignoreHTTPSErrors = ignoreHTTPSErrors;
        this._frameManager = frameManager;
        this._client.on('Fetch.requestPaused', this._onRequestPaused.bind(this));
        this._client.on('Fetch.authRequired', this._onAuthRequired.bind(this));
        this._client.on('Network.requestWillBeSent', this._onRequestWillBeSent.bind(this));
        this._client.on('Network.requestServedFromCache', this._onRequestServedFromCache.bind(this));
        this._client.on('Network.responseReceived', this._onResponseReceived.bind(this));
        this._client.on('Network.loadingFinished', this._onLoadingFinished.bind(this));
        this._client.on('Network.loadingFailed', this._onLoadingFailed.bind(this));
    }
    async initialize() {
        await this._client.send('Network.enable');
        if (this._ignoreHTTPSErrors)
            await this._client.send('Security.setIgnoreCertificateErrors', {
                ignore: true,
            });
    }
    async authenticate(credentials) {
        this._credentials = credentials;
        await this._updateProtocolRequestInterception();
    }
    async setExtraHTTPHeaders(extraHTTPHeaders) {
        this._extraHTTPHeaders = {};
        for (const key of Object.keys(extraHTTPHeaders)) {
            const value = extraHTTPHeaders[key];
            assert_js_1.assert(helper_js_1.helper.isString(value), `Expected value of header "${key}" to be String, but "${typeof value}" is found.`);
            this._extraHTTPHeaders[key.toLowerCase()] = value;
        }
        await this._client.send('Network.setExtraHTTPHeaders', {
            headers: this._extraHTTPHeaders,
        });
    }
    extraHTTPHeaders() {
        return Object.assign({}, this._extraHTTPHeaders);
    }
    async setOfflineMode(value) {
        this._emulatedNetworkConditions.offline = value;
        await this._updateNetworkConditions();
    }
    async emulateNetworkConditions(networkConditions) {
        this._emulatedNetworkConditions.upload = networkConditions
            ? networkConditions.upload
            : -1;
        this._emulatedNetworkConditions.download = networkConditions
            ? networkConditions.download
            : -1;
        this._emulatedNetworkConditions.latency = networkConditions
            ? networkConditions.latency
            : 0;
        await this._updateNetworkConditions();
    }
    async _updateNetworkConditions() {
        await this._client.send('Network.emulateNetworkConditions', {
            offline: this._emulatedNetworkConditions.offline,
            latency: this._emulatedNetworkConditions.latency,
            uploadThroughput: this._emulatedNetworkConditions.upload,
            downloadThroughput: this._emulatedNetworkConditions.download,
        });
    }
    async setUserAgent(userAgent) {
        await this._client.send('Network.setUserAgentOverride', { userAgent });
    }
    async setCacheEnabled(enabled) {
        this._userCacheDisabled = !enabled;
        await this._updateProtocolCacheDisabled();
    }
    async setRequestInterception(value, cacheSafe = false) {
        this._userRequestInterceptionEnabled = value;
        this._userRequestInterceptionCacheSafe = cacheSafe;
        await this._updateProtocolRequestInterception();
    }
    async _updateProtocolRequestInterception() {
        const enabled = this._userRequestInterceptionEnabled || !!this._credentials;
        if (enabled === this._protocolRequestInterceptionEnabled)
            return;
        this._protocolRequestInterceptionEnabled = enabled;
        if (enabled) {
            await Promise.all([
                this._updateProtocolCacheDisabled(),
                this._client.send('Fetch.enable', {
                    handleAuthRequests: true,
                    patterns: [{ urlPattern: '*' }],
                }),
            ]);
        }
        else {
            await Promise.all([
                this._updateProtocolCacheDisabled(),
                this._client.send('Fetch.disable'),
            ]);
        }
    }
    async _updateProtocolCacheDisabled() {
        await this._client.send('Network.setCacheDisabled', {
            cacheDisabled: this._userCacheDisabled ||
                (this._userRequestInterceptionEnabled &&
                    !this._userRequestInterceptionCacheSafe),
        });
    }
    _onRequestWillBeSent(event) {
        // Request interception doesn't happen for data URLs with Network Service.
        if (this._userRequestInterceptionEnabled &&
            !event.request.url.startsWith('data:')) {
            const requestId = event.requestId;
            const interceptionId = this._requestIdToInterceptionId.get(requestId);
            if (interceptionId) {
                this._onRequest(event, interceptionId);
                this._requestIdToInterceptionId.delete(requestId);
            }
            else {
                this._requestIdToRequestWillBeSentEvent.set(event.requestId, event);
            }
            return;
        }
        this._onRequest(event, null);
    }
    _onAuthRequired(event) {
        let response = 'Default';
        if (this._attemptedAuthentications.has(event.requestId)) {
            response = 'CancelAuth';
        }
        else if (this._credentials) {
            response = 'ProvideCredentials';
            this._attemptedAuthentications.add(event.requestId);
        }
        const { username, password } = this._credentials || {
            username: undefined,
            password: undefined,
        };
        this._client
            .send('Fetch.continueWithAuth', {
            requestId: event.requestId,
            authChallengeResponse: { response, username, password },
        })
            .catch(helper_js_1.debugError);
    }
    _onRequestPaused(event) {
        if (!this._userRequestInterceptionEnabled &&
            this._protocolRequestInterceptionEnabled) {
            this._client
                .send('Fetch.continueRequest', {
                requestId: event.requestId,
            })
                .catch(helper_js_1.debugError);
        }
        const requestId = event.networkId;
        const interceptionId = event.requestId;
        if (requestId && this._requestIdToRequestWillBeSentEvent.has(requestId)) {
            const requestWillBeSentEvent = this._requestIdToRequestWillBeSentEvent.get(requestId);
            this._onRequest(requestWillBeSentEvent, interceptionId);
            this._requestIdToRequestWillBeSentEvent.delete(requestId);
        }
        else {
            this._requestIdToInterceptionId.set(requestId, interceptionId);
        }
    }
    _onRequest(event, interceptionId) {
        let redirectChain = [];
        if (event.redirectResponse) {
            const request = this._requestIdToRequest.get(event.requestId);
            // If we connect late to the target, we could have missed the
            // requestWillBeSent event.
            if (request) {
                this._handleRequestRedirect(request, event.redirectResponse);
                redirectChain = request._redirectChain;
            }
        }
        const frame = event.frameId
            ? this._frameManager.frame(event.frameId)
            : null;
        const request = new HTTPRequest_js_1.HTTPRequest(this._client, frame, interceptionId, this._userRequestInterceptionEnabled, event, redirectChain);
        this._requestIdToRequest.set(event.requestId, request);
        this.emit(exports.NetworkManagerEmittedEvents.Request, request);
    }
    _onRequestServedFromCache(event) {
        const request = this._requestIdToRequest.get(event.requestId);
        if (request)
            request._fromMemoryCache = true;
        this.emit(exports.NetworkManagerEmittedEvents.RequestServedFromCache, request);
    }
    _handleRequestRedirect(request, responsePayload) {
        const response = new HTTPResponse_js_1.HTTPResponse(this._client, request, responsePayload);
        request._response = response;
        request._redirectChain.push(request);
        response._resolveBody(new Error('Response body is unavailable for redirect responses'));
        this._requestIdToRequest.delete(request._requestId);
        this._attemptedAuthentications.delete(request._interceptionId);
        this.emit(exports.NetworkManagerEmittedEvents.Response, response);
        this.emit(exports.NetworkManagerEmittedEvents.RequestFinished, request);
    }
    _onResponseReceived(event) {
        const request = this._requestIdToRequest.get(event.requestId);
        // FileUpload sends a response without a matching request.
        if (!request)
            return;
        const response = new HTTPResponse_js_1.HTTPResponse(this._client, request, event.response);
        request._response = response;
        this.emit(exports.NetworkManagerEmittedEvents.Response, response);
    }
    _onLoadingFinished(event) {
        const request = this._requestIdToRequest.get(event.requestId);
        // For certain requestIds we never receive requestWillBeSent event.
        // @see https://crbug.com/750469
        if (!request)
            return;
        // Under certain conditions we never get the Network.responseReceived
        // event from protocol. @see https://crbug.com/883475
        if (request.response())
            request.response()._resolveBody(null);
        this._requestIdToRequest.delete(request._requestId);
        this._attemptedAuthentications.delete(request._interceptionId);
        this.emit(exports.NetworkManagerEmittedEvents.RequestFinished, request);
    }
    _onLoadingFailed(event) {
        const request = this._requestIdToRequest.get(event.requestId);
        // For certain requestIds we never receive requestWillBeSent event.
        // @see https://crbug.com/750469
        if (!request)
            return;
        request._failureText = event.errorText;
        const response = request.response();
        if (response)
            response._resolveBody(null);
        this._requestIdToRequest.delete(request._requestId);
        this._attemptedAuthentications.delete(request._interceptionId);
        this.emit(exports.NetworkManagerEmittedEvents.RequestFailed, request);
    }
}
exports.NetworkManager = NetworkManager;
//# sourceMappingURL=NetworkManager.js.map