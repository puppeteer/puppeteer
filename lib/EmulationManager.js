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

const DeviceDescriptors = require('./DeviceDescriptors');

class EmulationManager {
  /**
   * @return {!Promise<!Array<string>>}
   */
  static deviceNames() {
    return Promise.resolve(DeviceDescriptors.map(entry => entry['device'].title));
  }

  /**
   * @param {string} name
   * @param {!Object=} options
   * @return {!Page.Viewport}
   */
  static deviceViewport(name, options) {
    options = options || {};
    const descriptor = DeviceDescriptors.find(entry => entry['device'].title === name)['device'];
    if (!descriptor)
      throw new Error(`Unable to emulate ${name}, no such device metrics in the library.`);
    const device = EmulationManager.loadFromJSONV1(descriptor);
    const viewport = options.landscape ? device.horizontal : device.vertical;
    return {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.capabilities.includes('mobile'),
      hasTouch: device.capabilities.includes('touch'),
      isLandscape: options.landscape || false
    };
  }

  /**
   * @param {string} name
   */
  static deviceUserAgent(name, options) {
    const descriptor = DeviceDescriptors.find(entry => entry['device'].title === name)['device'];
    if (!descriptor)
      throw new Error(`Unable to emulate ${name}, no such device metrics in the library.`);
    const device = EmulationManager.loadFromJSONV1(descriptor);
    return device.userAgent;
  }

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

  /**
   * @param {*} json
   * @return {?Object}
   */
  static loadFromJSONV1(json) {
    /**
     * @param {*} object
     * @param {string} key
     * @param {string} type
     * @param {*=} defaultValue
     * @return {*}
     */
    function parseValue(object, key, type, defaultValue) {
      if (typeof object !== 'object' || object === null || !object.hasOwnProperty(key)) {
        if (typeof defaultValue !== 'undefined')
          return defaultValue;
        throw new Error('Emulated device is missing required property \'' + key + '\'');
      }
      const value = object[key];
      if (typeof value !== type || value === null)
        throw new Error('Emulated device property \'' + key + '\' has wrong type \'' + typeof value + '\'');
      return value;
    }

    /**
     * @param {*} object
     * @param {string} key
     * @return {number}
     */
    function parseIntValue(object, key) {
      const value = /** @type {number} */ (parseValue(object, key, 'number'));
      if (value !== Math.abs(value))
        throw new Error('Emulated device value \'' + key + '\' must be integer');
      return value;
    }

    /**
     * @param {*} json
     * @return {!{width: number, height: number}}
     */
    function parseOrientation(json) {
      const result = {};
      const minDeviceSize = 50;
      const maxDeviceSize = 9999;
      result.width = parseIntValue(json, 'width');
      if (result.width < 0 || result.width > maxDeviceSize ||
          result.width < minDeviceSize)
        throw new Error('Emulated device has wrong width: ' + result.width);

      result.height = parseIntValue(json, 'height');
      if (result.height < 0 || result.height > maxDeviceSize ||
          result.height < minDeviceSize)
        throw new Error('Emulated device has wrong height: ' + result.height);

      return /** @type {!{width: number, height: number}} */ (result);
    }

    const result = {};
    result.type = /** @type {string} */ (parseValue(json, 'type', 'string'));
    result.userAgent = /** @type {string} */ (parseValue(json, 'user-agent', 'string'));

    const capabilities = parseValue(json, 'capabilities', 'object', []);
    if (!Array.isArray(capabilities))
      throw new Error('Emulated device capabilities must be an array');
    result.capabilities = [];
    for (let i = 0; i < capabilities.length; ++i) {
      if (typeof capabilities[i] !== 'string')
        throw new Error('Emulated device capability must be a string');
      result.capabilities.push(capabilities[i]);
    }

    result.deviceScaleFactor = /** @type {number} */ (parseValue(json['screen'], 'device-pixel-ratio', 'number'));
    if (result.deviceScaleFactor < 0 || result.deviceScaleFactor > 100)
      throw new Error('Emulated device has wrong deviceScaleFactor: ' + result.deviceScaleFactor);

    result.vertical = parseOrientation(parseValue(json['screen'], 'vertical', 'object'));
    result.horizontal = parseOrientation(parseValue(json['screen'], 'horizontal', 'object'));
    return result;
  }
}

EmulationManager._touchScriptId = Symbol('emulatingTouchScriptId');
EmulationManager._emulatingMobile = Symbol('emulatingMobile');

module.exports = EmulationManager;
