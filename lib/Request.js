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

class Request {
  /**
     * @param {!Connection} client
     * @param {string} interceptionId
     * @param {!Object} payload
     */
  constructor(client, interceptionId, payload) {
    this._client = client;
    this._interceptionId = interceptionId;
    this._url = payload.url;
    this._method = payload.method;
    this._headers = payload.headers;
    this._postData = payload.postData;

    this._urlOverride = undefined;
    this._methodOverride = undefined;
    this._postDataOverride = undefined;

    this._handled = false;
  }

  /**
     * @return {string}
     */
  url() {
    return this._urlOverride || this._url;
  }

  /**
     * @param {string} url
     */
  setUrl(url) {
    this._urlOverride = url;
  }

  /**
     * @return {string}
     */
  method() {
    return this._methodOverride || this._method;
  }

  /**
     * @param {string} method
     */
  setMethod(method) {
    this._methodOverride = method;
  }

  /**
     * @return {!Object}
     */
  headers() {
    return Object.assign({}, this._headersOverride || this._headers);
  }

  /**
     * @param {string} key
     * @param {string} value
     */
  setHeader(key, value) {
    if (!this._headersOverride)
      this._headersOverride = Object.assign({}, this._headers);
    this._headersOverride[key] = value;
  }

  /**
     * @return {(string|undefined)}
     */
  postData() {
    return this._postDataOverride || this._postData;
  }

  /**
     * @return {(string|undefined)}
     */
  setPostData(data) {
    this._postDataOverride = data;
  }

  abort() {
    console.assert(!this._handled, 'This request is already handled!');
    this._handled = true;
    this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      errorReason: 'Aborted'
    });
  }

  continue() {
    console.assert(!this._handled, 'This request is already handled!');
    this._handled = true;
    this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      url: this._urlOverride,
      method: this._methodOverride,
      postData: this._postDataOverride,
      headers: this._headersOverride
    });
  }

  /**
     * @return {boolean}
     */
  handled() {
    return this._handled;
  }
}

module.exports = Request;
