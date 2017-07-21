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
   * @param {!Connection} client
   * @param {!Page.Viewport} viewport
   * @return {Promise<boolean>}
   */
  static async emulateViewport(client, viewport) {
    const mobile = viewport.isMobile || false;
    const landscape = viewport.isLandscape || false;
    const width = viewport.width;
    const height = viewport.height;
    const deviceScaleFactor = viewport.deviceScaleFactor || 1;
    const screenOrientation = landscape ? { angle: 90, type: 'landscapePrimary' } : { angle: 0, type: 'portraitPrimary' };

    await Promise.all([
      client.send('Emulation.setDeviceMetricsOverride', { mobile, width, height, deviceScaleFactor, screenOrientation }),
      client.send('Emulation.setTouchEmulationEnabled', {
        enabled: viewport.hasTouch || false,
        configuration: viewport.isMobile ? 'mobile' : 'desktop'
      })
    ]);

    let reloadNeeded = false;
    if (viewport.hasTouch && !client[EmulationManager._touchScriptId]) {
      const source = `(${injectedTouchEventsFunction})()`;
      client[EmulationManager._touchScriptId] = (await client.send('Page.addScriptToEvaluateOnNewDocument', { source })).identifier;
      reloadNeeded = true;
    }

    if (!viewport.hasTouch && client[EmulationManager._touchScriptId]) {
      await client.send('Page.removeScriptToEvaluateOnNewDocument', {identifier: client[EmulationManager._touchScriptId]});
      client[EmulationManager._touchScriptId] = null;
      reloadNeeded = true;
    }

    if (client[EmulationManager._emulatingMobile] !== mobile)
      reloadNeeded = true;
    client[EmulationManager._emulatingMobile] = mobile;

    function injectedTouchEventsFunction() {
      const touchEvents = ['ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel'];
      const recepients = [window.__proto__, document.__proto__];
      for (let i = 0; i < touchEvents.length; ++i) {
        for (let j = 0; j < recepients.length; ++j) {
          if (!(touchEvents[i] in recepients[j])) {
            Object.defineProperty(recepients[j], touchEvents[i], {
              value: null, writable: true, configurable: true, enumerable: true
            });
          }
        }
      }
    }
    return reloadNeeded;
  }
}

EmulationManager._touchScriptId = Symbol('emulatingTouchScriptId');
EmulationManager._emulatingMobile = Symbol('emulatingMobile');

module.exports = EmulationManager;
