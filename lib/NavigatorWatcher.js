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
   * @param {!Puppeteer.Frame} frame
   * @param {number} timeout
   * @param {!Object=} options
   */
  constructor(frameManager, frame, timeout, options = {}) {
    console.assert(options.networkIdleTimeout === undefined, 'ERROR: networkIdleTimeout option is no longer supported.');
    console.assert(options.networkIdleInflight === undefined, 'ERROR: networkIdleInflight option is no longer supported.');
    console.assert(options.waitUntil !== 'networkidle', 'ERROR: "networkidle" option is no longer supported. Use "networkidle2" instead');
    let waitUntil = ['load'];
    if (Array.isArray(options.waitUntil))
      waitUntil = options.waitUntil.slice();
    else if (typeof options.waitUntil === 'string')
      waitUntil = [options.waitUntil];
    this._expectedLifecycle = waitUntil.map(value => {
      const protocolEvent = puppeteerToProtocolLifecycle[value];
      console.assert(protocolEvent, 'Unknown value for options.waitUntil: ' + value);
      return protocolEvent;
    });

    this._frameManager = frameManager;
    this._frame = frame;
    this._initialLoaderId = frame._loaderId;
    this._timeout = timeout;
    this._hasSameDocumentNavigation = false;
    this._eventListeners = [
      helper.addEventListener(this._frameManager, FrameManager.Events.LifecycleEvent, this._checkLifecycleComplete.bind(this)),
      helper.addEventListener(this._frameManager, FrameManager.Events.FrameNavigatedWithinDocument, this._navigatedWithinDocument.bind(this)),
      helper.addEventListener(this._frameManager, FrameManager.Events.FrameDetached, this._checkLifecycleComplete.bind(this))
    ];

    const lifecycleCompletePromise = new Promise(fulfill => {
      this._lifecycleCompleteCallback = fulfill;
    });
    this._navigationPromise = Promise.race([
      this._createTimeoutPromise(),
      lifecycleCompletePromise
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
    const errorMessage = 'Navigation Timeout Exceeded: ' + this._timeout + 'ms exceeded';
    return new Promise(fulfill => this._maximumTimer = setTimeout(fulfill, this._timeout))
        .then(() => new Error(errorMessage));
  }

  /**
   * @return {!Promise<?Error>}
   */
  async navigationPromise() {
    return this._navigationPromise;
  }

  /**
   * @param {!Puppeteer.Frame} frame
   */
  _navigatedWithinDocument(frame) {
    if (frame !== this._frame)
      return;
    this._hasSameDocumentNavigation = true;
    this._checkLifecycleComplete();
  }

  _checkLifecycleComplete() {
    // We expect navigation to commit.
    if (this._frame._loaderId === this._initialLoaderId && !this._hasSameDocumentNavigation)
      return;
    if (!checkLifecycle(this._frame, this._expectedLifecycle))
      return;
    this._lifecycleCompleteCallback();

    /**
     * @param {!Puppeteer.Frame} frame
     * @param {!Array<string>} expectedLifecycle
     * @return {boolean}
     */
    function checkLifecycle(frame, expectedLifecycle) {
      for (const event of expectedLifecycle) {
        if (!frame._lifecycleEvents.has(event))
          return false;
      }
      for (const child of frame.childFrames()) {
        if (!checkLifecycle(child, expectedLifecycle))
          return false;
      }
      return true;
    }
  }

  cancel() {
    this._cleanup();
  }

  _cleanup() {
    helper.removeEventListeners(this._eventListeners);
    this._lifecycleCompleteCallback(new Error('Navigation failed'));
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
