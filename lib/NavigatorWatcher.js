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
const {FrameManager} = require('./FrameManager');

class NavigatorWatcher {
  /**
   * @param {!FrameManager} frameManager
   * @param {!Frame} frame
   * @param {!Object=} options
   */
  constructor(frameManager, frame, options = {}) {
    console.assert(options.networkIdleTimeout === undefined, 'ERROR: networkIdleTimeout option is no longer supported.');
    console.assert(options.networkIdleInflight === undefined, 'ERROR: networkIdleInflight option is no longer supported.');
    console.assert(options.waitUntil !== 'networkidle', 'ERROR: "networkidle" option is no longer supported. Use "networkidle2" instead');
    let waitUntil = ['load'];
    if (Array.isArray(options.waitUntil))
      waitUntil = options.waitUntil.slice();
    else if (typeof options.waitUntil === 'string')
      waitUntil = [options.waitUntil];
    waitUntil = waitUntil.map(value => {
      const protocolEvent = puppeteerToProtocolLifecycle[value];
      console.assert(protocolEvent, 'Unknown value for options.waitUntil: ' + value);
      return protocolEvent;
    });

    this._eventListeners = [];
    this._frameManager = frameManager;
    this._frame = frame;
    this._initialLoaderId = frame._loaderId;
    this._timeout = typeof options.timeout === 'number' ? options.timeout : 30000;
    this._waitUntil = waitUntil;
  }

  /**
   * @return {!Promise<?Error>}
   */
  _timeoutPromise() {
    if (!this._timeout)
      return new Promise(() => {});
    const errorMessage = 'Navigation Timeout Exceeded: ' + this._timeout + 'ms exceeded';
    return new Promise(fulfill => this._maximumTimer = setTimeout(fulfill, this._timeout))
      .then(() => new Error(errorMessage))
  }

  /**
   * @return {!Promise<?Error>}
   */
  async waitForNavigation() {
    this._eventListeners = [
      helper.addEventListener(this._frameManager, FrameManager.Events.LifecycleEvent, this._checkLifecycleComplete.bind(this))
    ];

    const lifecycleCompletePromise = new Promise(fulfill => this._lifecycleCompleteCallback = fulfill);

    this._checkLifecycleComplete();
    const error = await Promise.race([
      this._timeoutPromise(),
      lifecycleCompletePromise
    ]);
    this._cleanup();
    return error;
  }

  _checkLifecycleComplete() {
    // We expect navigation to commit.
    if (this._frame._loaderId === this._initialLoaderId)
      return;
    if (!checkLifecycle(this._frame, this._waitUntil))
      return;
    this._lifecycleCompleteCallback();

    /**
     * @param {!Frame} frame
     * @param {!Array<string>} waitUntil
     */
    function checkLifecycle(frame, waitUntil) {
      let result = true;
      for (let i = 0; result && i < waitUntil.length; ++i)
        result = result && frame._lifecycleEvents.has(waitUntil[i]);
      const childFrames = frame.childFrames();
      for (let i = 0; result && i < childFrames.length; ++i)
        result = result && checkLifecycle(childFrames[i], waitUntil);
      return result;
    }
  }

  cancel() {
    this._cleanup();
  }

  _cleanup() {
    helper.removeEventListeners(this._eventListeners);
    clearTimeout(this._maximumTimer);
  }
}

const puppeteerToProtocolLifecycle = {
  'load': 'load',
  'domcontentloaded': 'DOMContentLoaded',
  'networkidle0': 'networkIdle',
  'networkidle2': 'networkAlmostIdle',
};

module.exports = NavigatorWatcher;
