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
  constructor(client, options) {
    this._client = client;
    client.on('Network.requestWillBeSent', event => this._onRequestWillBeSent(event));
    client.on('Network.loadingFinished', event => this._onLoadingFinished(event));
    client.on('Network.loadingFailed', event => this._onLoadingFailed(event));
    this._minTime = options && options['minTime'] ? options['minTime'] : 0;
    this._maxTime = options && options['maxTime'] ? options['maxTime'] : 30000;
    this._inflightRequests = 0;
  }

  /**
   * @param {string} url
   * @param {string=} referrer
   */
  async navigate(url, referrer) {
    this._navigationStartTime = Date.now();
    this._watchdogTimer = setTimeout(this._completeNavigation.bind(this, true), this._maxTime);
    this._minimumTimer = setTimeout(this._completeNavigation.bind(this, false), this._minTime);
    let onload = new Promise(fulfill => this._client.once('Page.loadEventFired', fulfill));
    let networkIdle = new Promise(fulfill => this._navigationLoadCallback = fulfill);
    var interstitialPromise = new Promise(fulfill => this._client.once('Security.certificateError', fulfill)).then(() => false);

    this._inflightRequests = 0;
    // Await for the command to throw exception in case of illegal arguments.
    try {
      await this._client.send('Page.navigate', {url, referrer});
    } catch (e) {
      return false;
    }
    return await Promise.race([Promise.all([onload, networkIdle]).then(() => true), interstitialPromise]);
  }

  /**
   * @param {!Object} event
   */
  _onRequestWillBeSent(event) {
    if (!event.redirectResponse)
      ++this._inflightRequests;
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

  _onLoadingCompleted(event) {
    --this._inflightRequests;
    if (Date.now() - this._navigationStartTime < this._minTime)
      return;
    this._completeNavigation(false);
  }

  /**
   * @param {boolean} force
   */
  _completeNavigation(force) {
    if (!this._navigationLoadCallback)
      return;
    if (this._inflightRequests < 2 || force) {
      clearTimeout(this._minimumTimer);
      clearTimeout(this._watchdogTimer);
      this._navigationLoadCallback();
      this._navigationLoadCallback = null;
    }
  }
}

module.exports = Navigator;
