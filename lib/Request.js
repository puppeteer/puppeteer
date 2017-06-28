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

class Headers {
  /**
   * @param {?Object} payload
   * @return {!Headers}
   */
  static fromPayload(payload) {
    let headers = new Headers();
    if (!payload)
      return headers;
    for (let key in payload)
      headers.set(key, payload[key]);
    return headers;
  }

  constructor() {
    /** @type {!Map<string, string>} */
    this._headers = new Map();
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  append(name, value) {
    name = name.toLowerCase();
    this._headers.set(name, value);
  }

  /**
   * @param {string} name
   */
  delete(name) {
    name = name.toLowerCase();
    this._headers.delete(name);
  }

  /**
   * @return {!Iterator}
   */
  entries() {
    return this._headers.entries();
  }

  /**
   * @param {string} name
   * @return {?string}
   */
  get(name) {
    name = name.toLowerCase();
    return this._headers.get(name);
  }

  /**
   * @param {string} name
   * @return {boolean}
   */
  has(name) {
    name = name.toLowerCase();
    return this._headers.has(name);
  }

  /**
   * @return {!Iterator}
   */
  keys() {
    return this._headers.keys();
  }

  /**
   * @return {!Iterator}
   */
  values() {
    return this._headers.values();
  }

  /**
   * @param {string} name
   * @param {string} value
   */
  set(name, value) {
    name = name.toLowerCase();
    this._headers.set(name, value);
  }
}

class Request {
  /**
   * @param {!Object} payload
   */
  constructor(payload) {
    this.url = payload.url;
    this.method = payload.method;
    this.headers = Headers.fromPayload(payload.headers);
    this.postData = payload.postData;
  }
}

class InterceptedRequest extends Request {
  /**
   * @param {!Connection} client
   * @param {string} interceptionId
   * @param {!Object} payload
   */
  constructor(client, interceptionId, payload) {
    super(payload);
    this._client = client;
    this._interceptionId = interceptionId;
    this._handled = false;
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
    let headers = {};
    for (let entry of this.headers.entries())
      headers[entry[0]] = entry[1];
    this._client.send('Network.continueInterceptedRequest', {
      interceptionId: this._interceptionId,
      url: this.url,
      method: this.method,
      postData: this.postData,
      headers: headers
    });
  }

  /**
   * @return {boolean}
   */
  isHandled() {
    return this._handled;
  }
}

module.exports = {Request, InterceptedRequest};
