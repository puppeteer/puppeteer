// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const DeviceDescriptors = require('./DeviceDescriptors');

/**
 * @unrestricted
 */
EmulatedDevice = class {
  constructor() {
    /** @type {string} */
    this.title = '';
    /** @type {string} */
    this.type = EmulatedDevice.Type.Unknown;
    /** @type {!EmulatedDevice.Orientation} */
    this.vertical = {width: 0, height: 0, outlineInsets: null, outlineImage: null};
    /** @type {!EmulatedDevice.Orientation} */
    this.horizontal = {width: 0, height: 0, outlineInsets: null, outlineImage: null};
    /** @type {number} */
    this.deviceScaleFactor = 1;
    /** @type {!Array.<string>} */
    this.capabilities = [EmulatedDevice.Capability.Touch, EmulatedDevice.Capability.Mobile];
    /** @type {string} */
    this.userAgent = '';
    /** @type {!Array.<!EmulatedDevice.Mode>} */
    this.modes = [];
  }

  /**
   * @param {string} name
   * @return {?EmulatedDevice}
   */
  static forName(name) {
    let descriptor = DeviceDescriptors.find(entry => entry['device'].title === name)['device'];
    if (!descriptor)
      throw new Error(`Unable to emulate ${name}, no such device metrics in the library.`);
    return EmulatedDevice.fromJSONV1(descriptor);
  }

  /**
   * @param {*} json
   * @return {?EmulatedDevice}
   */
  static fromJSONV1(json) {
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
      var value = object[key];
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
      var value = /** @type {number} */ (parseValue(object, key, 'number'));
      if (value !== Math.abs(value))
        throw new Error('Emulated device value \'' + key + '\' must be integer');
      return value;
    }

    /**
     * @param {*} json
     * @return {!EmulatedDevice.Insets}
     */
    function parseInsets(json) {
      return {left:
          parseIntValue(json, 'left'), top: parseIntValue(json, 'top'), right: parseIntValue(json, 'right'),
      bottom: parseIntValue(json, 'bottom')};
    }

    /**
     * @param {*} json
     * @return {!EmulatedDevice.Orientation}
     */
    function parseOrientation(json) {
      var result = {};

      result.width = parseIntValue(json, 'width');
      if (result.width < 0 || result.width > EmulatedDevice.MaxDeviceSize ||
          result.width < EmulatedDevice.MinDeviceSize)
        throw new Error('Emulated device has wrong width: ' + result.width);

      result.height = parseIntValue(json, 'height');
      if (result.height < 0 || result.height > EmulatedDevice.MaxDeviceSize ||
          result.height < EmulatedDevice.MinDeviceSize)
        throw new Error('Emulated device has wrong height: ' + result.height);

      var outlineInsets = parseValue(json['outline'], 'insets', 'object', null);
      if (outlineInsets) {
        result.outlineInsets = parseInsets(outlineInsets);
        if (result.outlineInsets.left < 0 || result.outlineInsets.top < 0)
          throw new Error('Emulated device has wrong outline insets');
        result.outlineImage = /** @type {string} */ (parseValue(json['outline'], 'image', 'string'));
      }
      return /** @type {!EmulatedDevice.Orientation} */ (result);
    }

    var result = new EmulatedDevice();
    result.title = /** @type {string} */ (parseValue(json, 'title', 'string'));
    result.type = /** @type {string} */ (parseValue(json, 'type', 'string'));
    result.userAgent = /** @type {string} */ (parseValue(json, 'user-agent', 'string'));

    var capabilities = parseValue(json, 'capabilities', 'object', []);
    if (!Array.isArray(capabilities))
      throw new Error('Emulated device capabilities must be an array');
    result.capabilities = [];
    for (var i = 0; i < capabilities.length; ++i) {
      if (typeof capabilities[i] !== 'string')
        throw new Error('Emulated device capability must be a string');
      result.capabilities.push(capabilities[i]);
    }

    result.deviceScaleFactor = /** @type {number} */ (parseValue(json['screen'], 'device-pixel-ratio', 'number'));
    if (result.deviceScaleFactor < 0 || result.deviceScaleFactor > 100)
      throw new Error('Emulated device has wrong deviceScaleFactor: ' + result.deviceScaleFactor);

    result.vertical = parseOrientation(parseValue(json['screen'], 'vertical', 'object'));
    result.horizontal = parseOrientation(parseValue(json['screen'], 'horizontal', 'object'));

    var modes = parseValue(json, 'modes', 'object', []);
    if (!Array.isArray(modes))
      throw new Error('Emulated device modes must be an array');
    result.modes = [];
    for (var i = 0; i < modes.length; ++i) {
      var mode = {};
      mode.title = /** @type {string} */ (parseValue(modes[i], 'title', 'string'));
      mode.orientation = /** @type {string} */ (parseValue(modes[i], 'orientation', 'string'));
      if (mode.orientation !== EmulatedDevice.Vertical &&
          mode.orientation !== EmulatedDevice.Horizontal)
        throw new Error('Emulated device mode has wrong orientation \'' + mode.orientation + '\'');
      var orientation = result.orientationByName(mode.orientation);
      mode.insets = parseInsets(parseValue(modes[i], 'insets', 'object'));
      if (mode.insets.top < 0 || mode.insets.left < 0 || mode.insets.right < 0 || mode.insets.bottom < 0 ||
          mode.insets.top + mode.insets.bottom > orientation.height ||
          mode.insets.left + mode.insets.right > orientation.width)
        throw new Error('Emulated device mode \'' + mode.title + '\'has wrong mode insets');

      mode.image = /** @type {string} */ (parseValue(modes[i], 'image', 'string', null));
      result.modes.push(mode);
    }

    return result;
  }

  /**
   * @param {string} name
   * @return {!Emulation.EmulatedDevice.Orientation}
   */
  orientationByName(name) {
    return name === EmulatedDevice.Vertical ? this.vertical : this.horizontal;
  }
};


/** @typedef {!{top: number, right: number, bottom: number, left: number}} */
EmulatedDevice.Insets;

/** @typedef {!{title: string, orientation: string, insets: !UI.Insets, image: ?string}} */
EmulatedDevice.Mode;

/** @typedef {!{width: number, height: number, outlineInsets: ?UI.Insets, outlineImage: ?string}} */
EmulatedDevice.Orientation;

EmulatedDevice.Horizontal = 'horizontal';
EmulatedDevice.Vertical = 'vertical';

EmulatedDevice.Type = {
  Phone: 'phone',
  Tablet: 'tablet',
  Notebook: 'notebook',
  Desktop: 'desktop',
  Unknown: 'unknown'
};

EmulatedDevice.Capability = {
  Touch: 'touch',
  Mobile: 'mobile'
};

EmulatedDevice.MinDeviceSize = 50;
EmulatedDevice.MaxDeviceSize = 9999;

module.exports = EmulatedDevice;
