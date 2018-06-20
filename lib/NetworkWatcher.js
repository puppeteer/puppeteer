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

const {helper} = require('./helper');
const {NetworkManager} = require('./NetworkManager');

class NetworkWatcher {
  /**
   * @param {!NetworkManager} networkManager
   * @param {any} match
   * @param {number} timeout
   * @param {!Object=} options
   */
  constructor(networkManager, type, match, timeout, options = {}) {
    this._networkType = NetworkManager.Events[puppeteerToNetworkManager[type]];
    this._networkMethod = type === 'request' && options.method ? options.method : undefined;
    this._networkManager = networkManager;
    this._timeout = timeout;
    this._match = match;
    this._matchNetworkEvent.bind(this);

    this._eventListeners = [
      helper.addEventListener(this._networkManager, this._networkType, event => this._matchNetworkEvent(event)),
    ];

    const networkCompletePromise = new Promise(fulfill => {
      this._networkCompleteCallback = fulfill;
    });

    this._networkPromise = Promise.race([
      this._createTimeoutPromise(),
      networkCompletePromise
    ]).then(error => {
      this._cleanup();
      return error;
    });
  }

  /**
   * @return {!Promise<?Error>}
   */
  _createTimeoutPromise() {
    if (!this._timeout)
      return new Promise(() => {});
    const errorMessage = 'Network Timeout Exceeded: ' + this._timeout + 'ms exceeded';
    return new Promise(fulfill => this._maximumTimer = setTimeout(fulfill, this._timeout))
        .then(() => new Error(errorMessage));
  }

  /**
   * @return {!Promise<?Error>}
   */
  async networkPromise() {
    return this._networkPromise;
  }

  _matchNetworkEvent(event) {
    if (this._networkMethod && event._method !== this._networkMethod)
      return;

    const isMatch = this._match instanceof RegExp ? this._match.test(event.url()) : this._match === event.url();

    if (!isMatch)
      return;

    this._networkCompleteCallback();
  }

  cancel() {
    this._cleanup();
  }

  _cleanup() {
    helper.removeEventListeners(this._eventListeners);
    this._networkCompleteCallback(new Error('Network failed'));
    clearTimeout(this._maximumTimer);
  }
}

const puppeteerToNetworkManager = {
  'request': 'Request',
  'response': 'Response',
  'requestfailed': 'RequestFailed',
  'requestfinished': 'RequestFinished',
};

module.exports = NetworkWatcher;
