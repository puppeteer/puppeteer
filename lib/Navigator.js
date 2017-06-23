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

class Navigator {
  /**
   * @param {!Connection} client
   * @param {!Object=} options
   */
  constructor(client, options = {}) {
    this._client = client;
    client.on('Network.requestWillBeSent', event => this._onRequestWillBeSent(event));
    client.on('Network.loadingFinished', event => this._onLoadingFinished(event));
    client.on('Network.loadingFailed', event => this._onLoadingFailed(event));
    client.on('Network.webSocketClosed', event => this._onWebSocketClosed(event));
    this._minTime = typeof options['minTime'] === 'number' ? options['minTime'] : 0;
    this._maxTime = typeof options['maxTime'] === 'number' ? options['maxTime'] : 30000;
    this._idleTime = typeof options['idleTime'] === 'number' ? options['idleTime'] : 5000;
    this._inflightRequests = 0;
  }

  /**
   * @param {string} url
   * @param {string=} referrer
   */
  async navigate(url, referrer) {
    this._requestIds = new Set();
    this._navigationStartTime = Date.now();
    this._idleReached = false;

    let onload = new Promise(fulfill => this._client.once('Page.loadEventFired', fulfill));
    let networkIdle = new Promise(fulfill => this._navigationLoadCallback = fulfill);
    let interstitialPromise = new Promise(fulfill => this._client.once('Security.certificateError', fulfill)).then(() => false);

    this._inflightRequests = 0;

    this._idleTimer = setTimeout(this._onIdleReached.bind(this), this._idleTime);
    this._watchdogTimer = setTimeout(this._completeNavigation.bind(this, true), this._maxTime);
    this._minimumTimer = setTimeout(this._completeNavigation.bind(this, false), this._minTime);

    // Await for the command to throw exception in case of illegal arguments.
    try {
      await this._client.send('Page.navigate', {url, referrer});
    } catch (e) {
      return false;
    }

    const navigationComplete = Promise.all([onload, networkIdle]).then(() => true);
    return await Promise.race([navigationComplete, interstitialPromise]).then(retVal => {
      clearTimeout(this._idleTimer);
      clearTimeout(this._minimumTimer);
      clearTimeout(this._watchdogTimer);
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
    if (this._inflightRequests > 2) {
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
    if (this._inflightRequests <= 2 && !this._idleTimer)
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
