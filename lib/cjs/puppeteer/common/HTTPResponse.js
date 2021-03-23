"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPResponse = void 0;
const SecurityDetails_js_1 = require("./SecurityDetails.js");
/**
 * The HTTPResponse class represents responses which are received by the
 * {@link Page} class.
 *
 * @public
 */
class HTTPResponse {
    /**
     * @internal
     */
    constructor(client, request, responsePayload) {
        this._contentPromise = null;
        this._headers = {};
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
            ? new SecurityDetails_js_1.SecurityDetails(responsePayload.securityDetails)
            : null;
    }
    /**
     * @internal
     */
    _resolveBody(err) {
        return this._bodyLoadedPromiseFulfill(err);
    }
    /**
     * @returns The IP address and port number used to connect to the remote
     * server.
     */
    remoteAddress() {
        return this._remoteAddress;
    }
    /**
     * @returns The URL of the response.
     */
    url() {
        return this._url;
    }
    /**
     * @returns True if the response was successful (status in the range 200-299).
     */
    ok() {
        // TODO: document === 0 case?
        return this._status === 0 || (this._status >= 200 && this._status <= 299);
    }
    /**
     * @returns The status code of the response (e.g., 200 for a success).
     */
    status() {
        return this._status;
    }
    /**
     * @returns  The status text of the response (e.g. usually an "OK" for a
     * success).
     */
    statusText() {
        return this._statusText;
    }
    /**
     * @returns An object with HTTP headers associated with the response. All
     * header names are lower-case.
     */
    headers() {
        return this._headers;
    }
    /**
     * @returns {@link SecurityDetails} if the response was received over the
     * secure connection, or `null` otherwise.
     */
    securityDetails() {
        return this._securityDetails;
    }
    /**
     * @returns Promise which resolves to a buffer with response body.
     */
    buffer() {
        if (!this._contentPromise) {
            this._contentPromise = this._bodyLoadedPromise.then(async (error) => {
                if (error)
                    throw error;
                const response = await this._client.send('Network.getResponseBody', {
                    requestId: this._request._requestId,
                });
                return Buffer.from(response.body, response.base64Encoded ? 'base64' : 'utf8');
            });
        }
        return this._contentPromise;
    }
    /**
     * @returns Promise which resolves to a text representation of response body.
     */
    async text() {
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
    async json() {
        const content = await this.text();
        return JSON.parse(content);
    }
    /**
     * @returns A matching {@link HTTPRequest} object.
     */
    request() {
        return this._request;
    }
    /**
     * @returns True if the response was served from either the browser's disk
     * cache or memory cache.
     */
    fromCache() {
        return this._fromDiskCache || this._request._fromMemoryCache;
    }
    /**
     * @returns True if the response was served by a service worker.
     */
    fromServiceWorker() {
        return this._fromServiceWorker;
    }
    /**
     * @returns A {@link Frame} that initiated this response, or `null` if
     * navigating to error pages.
     */
    frame() {
        return this._request.frame();
    }
}
exports.HTTPResponse = HTTPResponse;
//# sourceMappingURL=HTTPResponse.js.map