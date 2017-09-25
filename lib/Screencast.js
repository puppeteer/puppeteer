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
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const {helper, debugError} = require('./helper');


class Screencast extends EventEmitter {
  /**
   * @param {!Session} client
   */
  constructor(client) {
    super();
    this._client = client;
    /** @type {!Array<!Object>} */
    this._frames = [];
    /** @type {string} */
    this._format = 'png';
    /** @type {boolean} */
    this._recording = false;

    this._client.on('Page.screencastFrame', event => this._onScreencastFrame(event));
  }

  /**
   * @return {!Array<!Screencast.Frame>}
   */
  frames() {
    return this._frames;
  }

  /**
   * Format of each frame.
   * @return {!string}
   */
  format() {
    return this._format;
  }

  /**
   * @param {!Object} event
   */
  async _onScreencastFrame(event) {
    console.assert(typeof event.sessionId === 'number',
        'Expected screencast frame to have sessionId');
    await this._client.send(
        'Page.screencastFrameAck', {sessionId: event.sessionId}).catch(debugError);
    const buffer = new Buffer(event.data, 'base64');
    this.frames().push(buffer);
    this.emit(Screencast.Events.Frame, {buffer, metadata: event.metadata});
  }

  /**
   * @param {!Object=} options
   */
  async start(options = {}) {
    if (this._recording)
      throw new Error('Cannot start another screencast. One is already in progress.');

    this._frames = [];

    if (options.format) {
      console.assert(options.format === 'png' || options.format === 'jpeg',
          `Unknown options.format value: ${options.format}`);
    } else {
      options.format = 'png'; // default to png.
    }

    this._format = options.format;

    if (options.quality) {
      console.assert(options.format === 'jpeg',
          `options.quality is unsupported for the jpeg screenshots`);
      console.assert(typeof options.quality === 'number',
          `Expected options.quality to be a number but found ${typeof options.quality}`);
      console.assert(
          Number.isInteger(options.quality), 'Expected options.quality to be an integer');
      console.assert(options.quality >= 0 && options.quality <= 100,
          `Expected options.quality to be between 0 and 100 (inclusive), got ${options.quality}`);
    }
    if (options.maxWidth) {
      console.assert(typeof options.maxWidth === 'number',
          `Expected options.maxWidth to be a number but found ${typeof options.maxWidth}`);
      console.assert(
          Number.isInteger(options.maxWidth), 'Expected options.maxWidth to be an integer');
      console.assert(options.maxWidth >= 0,
          `Expected options.maxWidth to be greater than 0, got ${options.maxWidth}`);
    }
    if (options.maxHeight) {
      console.assert(typeof options.maxHeight === 'number',
          `Expected options.maxHeight to be a number but found ${typeof options.maxHeight}`);
      console.assert(
          Number.isInteger(options.maxHeight), 'Expected options.maxHeight to be an integer');
      console.assert(options.maxHeight >= 0,
          `Expected options.maxHeight to be greater than 0, got ${options.maxHeight}`);
    }
    if (options.everyNthFrame) {
      console.assert(typeof options.everyNthFrame === 'number',
          `Expected options.everyNthFrame to be a number but found ${typeof options.everyNthFrame}`);
      console.assert(Number.isInteger(options.everyNthFrame),
          'Expected options.everyNthFrame to be an integer');
      console.assert(options.everyNthFrame >= 0,
          `Expected options.everyNthFrame to be greater than 0, got ${options.everyNthFrame}`);
    } else {
      options.everyNthFrame = 1; // default to every frame.
    }
    this._recording = true;
    await this._client.send('Page.startScreencast', options).catch(debugError);
  }

  /**
   * Stop capturing a screencast, optionally writing the frame images to a
   * directory. Throws if options.path does not exist.
   * @param {!Object=} options
   * @return {!Array<!Screencast.Frame>}
   */
  async stop(options = {}) {
    await this._client.send('Page.stopScreencast').catch(debugError);
    this._recording = false;
    if (options.path)
      this._save(options.path);
    return this.frames();
  }

  /**
   * @param {string} dirname Directory to save image frames into.
   */
  _save(dirname) {
    this.frames().forEach((frame, i) => {
      const buffer = new Buffer(frame, 'base64');
      fs.writeFileSync(path.join(dirname, `frame_${i}.${this.format()}`), buffer);
    });
  }
}

/** @typedef {{buffer: !Buffer, metadata: !Object}} */
Screencast.Frame;

Screencast.Events = {
  Frame: 'frame',
};

helper.tracePublicAPI(Screencast);
module.exports = Screencast;
