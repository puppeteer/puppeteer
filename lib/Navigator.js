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
   * @param {string} url
   * @param {string=} referrer
   * @param {!Object=} options
   */
  constructor(client, url, referrer, options = {}) {
    this._client = client;
    this._url = url;
    this._referrer = referrer;
    this._maxTime = typeof options['maxTime'] === 'number' ? options['maxTime'] : 30000;
    this._idleTime = typeof options['networkIdleTimeout'] === 'number' ? options['networkIdleTimeout'] : 1000;
    this._idleInflight = typeof options['networkIdleInflight'] === 'number' ? options['networkIdleInflight'] : 2;
    this._waitUntil = typeof options['waitUntil'] === 'string' ? options['waitUntil'] : 'load';

    console.assert(this._waitUntil === 'load' || this._waitUntil === 'networkidle', 'Unknown value for options.waitUntil: ' + this._waitUntil);
  }

  /**
   * @return {!Promise}
   */
  async navigate() {
    this._init();
    let certificateError = new Promise(fulfill => this._client.once('Security.certificateError', fulfill))
        .then(error => new Error('SSL Certiciate error: ' + error.errorType));
    let networkIdle = new Promise(fulfill => this._networkIdleCallback = fulfill).then(() => null);
    let loadEventFired = new Promise(fulfill => this._client.once('Page.loadEventFired', fulfill)).then(() => null);
    let watchdog = new Promise(fulfill => this._maximumTimer = setTimeout(fulfill, this._maxTime)).then(() => new Error('Navigation Timeout Exceeded: ' + this._maxTime + 'ms exceeded'));

    // Await for the command to throw exception in case of illegal arguments.
    try {
      await this._client.send('Page.navigate', {url: this._url, referrer: this._referrer});
    } catch (e) {
      this._cleanup();
      throw e;
    }

    const error = await Promise.race([certificateError, watchdog, this._waitUntil === 'load' ? loadEventFired : networkIdle]);
    this._cleanup();
    if (error)
      throw error;
  }

  /**
   * @param {!Object} event
   */
  _onLoadingStarted(event) {
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
  _onLoadingCompleted(event) {
    if (!this._requestIds.has(event.requestId))
      return;

    --this._inflightRequests;
    if (this._inflightRequests <= this._idleInflight && !this._idleTimer)
      this._idleTimer = setTimeout(this._networkIdleCallback, this._idleTime);
  }

  _init() {
    this._loadingStartedHandler = this._onLoadingStarted.bind(this);
    this._loadingCompletedHandler = this._onLoadingCompleted.bind(this);
    this._client.on('Network.requestWillBeSent', this._loadingStartedHandler);
    this._client.on('Network.loadingFinished', this._loadingCompletedHandler);
    this._client.on('Network.loadingFailed', this._loadingCompletedHandler);
    this._client.on('Network.webSocketCreated', this._loadingStartedHandler);
    this._client.on('Network.webSocketClosed', this._loadingCompletedHandler);

    this._inflightRequests = 0;
    this._requestIds = new Set();
  }

  _cleanup() {
    this._client.removeListener('Network.requestWillBeSent', this._loadingStartedHandler);
    this._client.removeListener('Network.loadingFinished', this._loadingCompletedHandler);
    this._client.removeListener('Network.loadingFailed', this._loadingCompletedHandler);
    this._client.removeListener('Network.webSocketCreated', this._loadingStartedHandler);
    this._client.removeListener('Network.webSocketClosed', this._loadingCompletedHandler);

    clearTimeout(this._idleTimer);
    clearTimeout(this._maximumTimer);
  }
}

module.exports = Navigator;
