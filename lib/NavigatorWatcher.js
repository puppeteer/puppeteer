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

class NavigatorWatcher {
  /**
   * @param {!Puppeteer.Session} client
   * @param {string} frameId
   * @param {boolean} ignoreHTTPSErrors
   * @param {!Object=} options
   */
  constructor(client, frameId, ignoreHTTPSErrors, options = {}) {
    console.assert(options.networkIdleTimeout === undefined, 'ERROR: networkIdleTimeout option is no longer supported.');
    console.assert(options.networkIdleInflight === undefined, 'ERROR: networkIdleInflight option is no longer supported.');
    console.assert(options.waitUntil !== 'networkidle', 'ERROR: "networkidle" option is no longer supported. Use "networkidle2" instead');
    this._client = client;
    this._frameId = frameId;
    this._ignoreHTTPSErrors = ignoreHTTPSErrors;
    this._timeout = typeof options.timeout === 'number' ? options.timeout : 30000;
    let waitUntil = ['load'];
    if (Array.isArray(options.waitUntil))
      waitUntil = options.waitUntil.slice();
    else if (typeof options.waitUntil === 'string')
      waitUntil = [options.waitUntil];
    for (const value of waitUntil) {
      const isAllowedValue = value === 'networkidle0' || value === 'networkidle2' || value === 'load' || value === 'domcontentloaded';
      console.assert(isAllowedValue, 'Unknown value for options.waitUntil: ' + value);
    }
    this._pendingEvents = new Set(waitUntil);
  }

  /**
   * @return {!Promise<?Error>}
   */
  async waitForNavigation() {
    this._eventListeners = [];

    const navigationPromises = [];
    if (this._timeout) {
      const watchdog = new Promise(fulfill => this._maximumTimer = setTimeout(fulfill, this._timeout))
          .then(() => 'Navigation Timeout Exceeded: ' + this._timeout + 'ms exceeded');
      navigationPromises.push(watchdog);
    }

    if (!this._ignoreHTTPSErrors) {
      const certificateError = new Promise(fulfill => {
        this._eventListeners.push(helper.addEventListener(this._client, 'Security.certificateError', fulfill));
      }).then(error => 'SSL Certificate error: ' + error.errorType);
      navigationPromises.push(certificateError);
    }

    this._eventListeners.push(helper.addEventListener(this._client, 'Page.lifecycleEvent', this._onLifecycleEvent.bind(this)));
    const pendingEventsFired = new Promise(fulfill => this._pendingEventsCallback = fulfill);
    navigationPromises.push(pendingEventsFired);

    const error = await Promise.race(navigationPromises);
    this._cleanup();
    return error ? new Error(error) : null;
  }

  /**
   * @param {!{frameId: string, name: string}} event
   */
  _onLifecycleEvent(event) {
    if (event.frameId !== this._frameId)
      return;
    const pptrName = protocolLifecycleToPuppeteer[event.name];
    if (!pptrName)
      return;
    this._pendingEvents.delete(pptrName);
    if (this._pendingEvents.size === 0)
      this._pendingEventsCallback();
  }

  cancel() {
    this._cleanup();
  }

  _cleanup() {
    helper.removeEventListeners(this._eventListeners);
    clearTimeout(this._maximumTimer);
  }
}

const protocolLifecycleToPuppeteer = {
  'load': 'load',
  'DOMContentLoaded': 'domcontentloaded',
  'networkIdle': 'networkidle0',
  'networkAlmostIdle': 'networkidle2',
};

module.exports = NavigatorWatcher;
