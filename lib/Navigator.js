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

const VALID_WAIT_CONDITIONS = ['load', 'networkidle'];

class Navigator {
  /**
   * @param {!Connection} client
   * @param {!Object=} options
   */
  constructor(client, options = {}) {
    this._client = client;
    this._minTime = typeof options.minTime === 'number' ? options.minTime : 0;
    this._maxTime = typeof options.maxTime === 'number' ? options.maxTime : 30000;
    this._idleTime = typeof options.networkIdleTimeout === 'number' ? options.networkIdleTimeout : 1000;
    this._idleInflight = typeof options.networkIdleInflight === 'number' ? options.networkIdleInflight : 2;
    this._waitFor = typeof options.waitFor === 'string' ? options.waitFor : 'load';
    this._inflightRequests = 0;

    console.assert(VALID_WAIT_CONDITIONS.includes(this._waitFor));

    if (this._waitFor === 'networkidle') {
      client.on('Network.requestWillBeSent', event => this._onRequestWillBeSent(event));
      client.on('Network.loadingFinished', event => this._onLoadingFinished(event));
      client.on('Network.loadingFailed', event => this._onLoadingFailed(event));
      client.on('Network.webSocketClosed', event => this._onWebSocketClosed(event));
    }
  }

  /**
   * @param {string} url
   * @param {string=} referrer
   */
  async navigate(url, referrer) {
    this._requestIds = new Set();
    this._navigationStartTime = Date.now();
    this._idleReached = false;

    let navigationComplete;
    let navigationFailure = new Promise(fulfill => this._client.once('Security.certificateError', fulfill)).then(() => false);

    switch (this._waitFor) {
      case 'load':
        navigationComplete = new Promise(fulfill => this._client.once('Page.loadEventFired', fulfill));
        break;
      case 'networkidle':
        navigationComplete = new Promise(fulfill => this._navigationLoadCallback = fulfill);
        break;
      default:
        throw new Error(`Unrecognized wait condition: ${this._waitFor}`);
    }

    this._inflightRequests = 0;

    this._minimumTimer = setTimeout(this._completeNavigation.bind(this, false), this._minTime);
    this._maximumTimer = setTimeout(this._completeNavigation.bind(this, true), this._maxTime);
    this._idleTimer = setTimeout(this._onIdleReached.bind(this), this._idleTime);

    // Await for the command to throw exception in case of illegal arguments.
    try {
      await this._client.send('Page.navigate', {url, referrer});
    } catch (e) {
      return false;
    }

    return await Promise.race([navigationComplete.then(() => true), navigationFailure]).then(retVal => {
      clearTimeout(this._idleTimer);
      clearTimeout(this._minimumTimer);
      clearTimeout(this._maximumTimer);
      return retVal;
    });
  }

  /**
   * @param {!Object} event
   */
  _onRequestWillBeSent(event) {
    this._requestIds.add(event.requestId);
    if (!event.redirectResponse)
      ++this._inflightRequests;
    if (this._inflightRequests > this._idleInflight) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  /**
   * @param {!Object} event
   */
  _onWebSocketClosed(event) {
    this._onLoadingCompleted(event);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFinished(event) {
    this._onLoadingCompleted(event);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingFailed(event) {
    this._onLoadingCompleted(event);
  }

  /**
   * @param {!Object} event
   */
  _onLoadingCompleted(event) {
    if (!this._requestIds.has(event.requestId))
      return;

    --this._inflightRequests;
    if (this._inflightRequests <= this._idleInflight && !this._idleTimer)
      this._idleTimer = setTimeout(this._onIdleReached.bind(this), this._idleTime);
  }

  _onIdleReached() {
    this._idleReached = true;
    this._completeNavigation(false);
  }

  /**
   * @param {boolean} force
   */
  _completeNavigation(force) {
    if (!this._navigationLoadCallback)
      return;

    const elapsedTime = Date.now() - this._navigationStartTime;
    if ((elapsedTime >= this._minTime && this._idleReached) || force) {
      this._navigationLoadCallback();
      this._navigationLoadCallback = null;
    }
  }
}

module.exports = Navigator;
