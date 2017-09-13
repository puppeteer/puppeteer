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
const {helper} = require('./helper');

class Tracing {
  /**
   * @param {!Session} client
   */
  constructor(client) {
    this._client = client;
    this._recording = false;
    this._path = '';
  }

  /**
   * @param {!Object} options
   */
  async start(options) {
    console.assert(!this._recording, 'Cannot start recording trace while already recording trace.');
    console.assert(options.path, 'Must specify a path to write trace file to.');

    const categoriesArray = [
      '-*', 'devtools.timeline', 'v8.execute', 'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame', 'toplevel',
      'blink.console', 'blink.user_timing', 'latencyInfo', 'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-v8.cpu_profiler'
    ];

    if (options.screenshots)
      categoriesArray.push('disabled-by-default-devtools.screenshot');

    this._path = options.path;
    this._recording = true;
    await this._client.send('Tracing.start', {
      transferMode: 'ReturnAsStream',
      categories: categoriesArray.join(',')
    });
  }

  async stop() {
    let fulfill;
    const contentPromise = new Promise(x => fulfill = x);
    this._client.once('Tracing.tracingComplete', event => {
      this._readStream(event.stream, this._path).then(fulfill);
    });
    await this._client.send('Tracing.end');
    this._recording = false;
    return contentPromise;
  }

  /**
   * @param {string} handle
   * @param {string} path
   */
  async _readStream(handle, path) {
    let eof = false;
    const file = fs.openSync(path, 'w');
    while (!eof) {
      const response = await this._client.send('IO.read', {handle});
      eof = response.eof;
      if (path)
        fs.writeSync(file, response.data);
    }
    fs.closeSync(file);
    await this._client.send('IO.close', {handle});
  }
}
helper.tracePublicAPI(Tracing);

module.exports = Tracing;
