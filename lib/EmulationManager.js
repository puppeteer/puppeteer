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

class EmulationManager {
  /**
   * @param {!Puppeteer.CDPSession} client
   */
  constructor(client) {
    this._client = client;
    this._emulatingMobile = false;
    this._injectedTouchScriptId = null;
  }

  /**
   * @param {!EmulationManager.Viewport} viewport
   * @return {Promise<boolean>}
   */
  async emulateViewport(viewport) {
    const mobile = viewport.isMobile || false;
    const width = viewport.width;
    const height = viewport.height;
    const deviceScaleFactor = viewport.deviceScaleFactor || 1;
    /** @type {Protocol.Emulation.ScreenOrientation} */
    const screenOrientation = viewport.isLandscape ? { angle: 90, type: 'landscapePrimary' } : { angle: 0, type: 'portraitPrimary' };

    await Promise.all([
      this._client.send('Emulation.setDeviceMetricsOverride', { mobile, width, height, deviceScaleFactor, screenOrientation }),
      this._client.send('Emulation.setTouchEmulationEnabled', {
        enabled: viewport.hasTouch || false
      })
    ]);

    let reloadNeeded = false;
    if (viewport.hasTouch && !this._injectedTouchScriptId) {
      const source = `(${injectedTouchEventsFunction})()`;
      this._injectedTouchScriptId = (await this._client.send('Page.addScriptToEvaluateOnNewDocument', { source })).identifier;
      reloadNeeded = true;
    } else if (!viewport.hasTouch && this._injectedTouchScriptId) {
      await this._client.send('Page.removeScriptToEvaluateOnNewDocument', {identifier: this._injectedTouchScriptId});
      this._injectedTouchScriptId = null;
      reloadNeeded = true;
    }

    if (this._emulatingMobile !== mobile)
      reloadNeeded = true;
    this._emulatingMobile = mobile;
    return reloadNeeded;

    function injectedTouchEventsFunction() {
      const touchEvents = ['ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel'];
      // @ts-ignore
      const recipients = [window.__proto__, document.__proto__];
      for (let i = 0; i < touchEvents.length; ++i) {
        for (let j = 0; j < recipients.length; ++j) {
          if (!(touchEvents[i] in recipients[j])) {
            Object.defineProperty(recipients[j], touchEvents[i], {
              value: null, writable: true, configurable: true, enumerable: true
            });
          }
        }
      }
    }
  }
}

/**
 * @typedef {Object} EmulationManager.Viewport
 * @property {number} width
 * @property {number} height
 * @property {number=} deviceScaleFactor
 * @property {boolean=} isMobile
 * @property {boolean=} isLandscape
 * @property {boolean=} hasTouch
 */

module.exports = EmulationManager;
