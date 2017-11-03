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
const EventEmitter = require('events');
const {helper, debugError} = require('./helper');

/**
 * @param {!Array<!Object>} frames
 * @return {!Promise<!Array<number>>}
 */
async function createVideo(frames) {
  const imageBitmaps = await Promise.all(frames.map(frame => {
    const blob = new Blob([Uint8Array.from(frame.buffer)], {type: 'image/png'});
    return window.createImageBitmap(blob);
  }));

  // Use last image as width so we know the set viewport is correct.
  const WIDTH = imageBitmaps[imageBitmaps.length - 1].width;
  const HEIGHT = imageBitmaps[imageBitmaps.length - 1].height;

  const canvas = document.createElement('canvas');
  canvas.style.display = 'none';
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // Create video stream from canvas. Since we're not passing an fps, it will
  // match how fast the canvas is being drawn to.
  const stream = canvas.captureStream();
  const recorder = new MediaRecorder(stream, {mimeType: 'video/webm'});

  let fulfill;
  const videoPromise = new Promise(r => fulfill = r);

  const setupAndStartRecording = function() {
    return new Promise((resolve, reject) => {
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = e => resolve(chunks);
      recorder.onerror = reject;
      recorder.start();
    });
  };

  const blobToArrayBuffer = function(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = e => {
        resolve(e.target.result);
      };
      reader.readAsArrayBuffer(blob);
    });
  };

  const drawImagesToCanvas = async function() {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const ctx = canvas.getContext('2d');

    ctx.drawImage(imageBitmaps[0], 0, 0);
    for (let i = 1; i < frames.length; ++i) {
      const msDiff = (frames[i].metadata.timestamp - frames[i - 1].metadata.timestamp) * 1000;
      await sleep(msDiff);
      ctx.drawImage(imageBitmaps[i], 0, 0);
    }
  };

  setupAndStartRecording().then(async chunks => {
    const arrayBuffer = await blobToArrayBuffer(new Blob(chunks, {type: 'video/webm'}));
    // Convert to array for serialization back to pptr.
    fulfill(Array.from(new Uint8Array(arrayBuffer)));
  });

  await drawImagesToCanvas(); // Draw images to canvas in real-time.

  recorder.stop();

  return videoPromise;
}

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
    /** @type {string} */
    this._path = '';
    /** @type {boolean} */
    this._recording = false;

    this._client.on('Page.screencastFrame', event => this._onScreencastFrame(event));
  }

  /**
   * @return {!Array<!Screencast.Frame>}
   */
  frames() {
    return this._frames.map(frame => frame.buffer);
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

    const obj = {buffer: new Buffer(event.data, 'base64'), metadata: event.metadata};
    this._frames.push(obj);

    this.emit(Screencast.Events.Frame, obj);
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
    this._path = options.path;

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
   * @return {!Array<!Screencast.Frame>}
   */
  async stop() {
    await this._client.send('Page.stopScreencast').catch(debugError);
    this._recording = false;

    if (this._path) {
      // Convert Buffers to Arrays for serialization.
      const frames = this._frames.map(frame => ({buffer: Array.from(frame.buffer), metadata: frame.metadata}));

      const expression = helper.evaluationString(createVideo, frames);
      const result = await this._client.send('Runtime.evaluate',
          {expression, returnByValue: true, awaitPromise: true});

      const webmVideo = new Buffer.from(result.result.value);
      fs.writeFileSync(this._path, webmVideo);
    }
    return this.frames();
  }
}

/** @typedef {{buffer: !Buffer, metadata: !Object}} */
Screencast.Frame;

Screencast.Events = {
  Frame: 'frame',
};

helper.tracePublicAPI(Screencast);
module.exports = Screencast;
