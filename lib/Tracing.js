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
const fs = require('fs');

const openAsync = helper.promisify(fs.open);
const writeAsync = helper.promisify(fs.write);
const closeAsync = helper.promisify(fs.close);

class Tracing {
  /**
   * @param {!Puppeteer.Session} client
   */
  constructor(client) {
    this._client = client;
    this._recording = false;
    this._result = '';
    this._path = '';
  }

  /**
   * @return {string} The trace result.
   */
  getResult() {
    if (this._recording)
      throw new Error('Tracing is still in progress!');
    return this._result;
  }

  /**
   * @param {!Object} options
   */
  async start(options = {}) {
    console.assert(!this._recording, 'Cannot start recording trace while already recording trace.');

    const defaultCategories = [
      '-*', 'devtools.timeline', 'v8.execute', 'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame', 'toplevel',
      'blink.console', 'blink.user_timing', 'latencyInfo', 'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-v8.cpu_profiler'
    ];
    const categoriesArray = options.categories || defaultCategories;

    if (options.screenshots)
      categoriesArray.push('disabled-by-default-devtools.screenshot');

    this._path = options.path;
    this._recording = true;
    this._result = '';
    await this._client.send('Tracing.start', {
      transferMode: 'ReturnAsStream',
      categories: categoriesArray.join(',')
    });
  }

  async stop() {
    let fulfill;
    const contentPromise = new Promise(x => fulfill = x);
    this._client.once('Tracing.tracingComplete', async event => {
      await this._readResultFromStream(event.stream);
      if (this._path)
        await this._writeResultToFile(this._path);
      fulfill();
    });
    await this._client.send('Tracing.end');
    this._recording = false;
    return contentPromise;
  }

  /**
   * @param {string} handle
   */
  async _readResultFromStream(handle) {
    let eof = false;
    this._result = '';
    while (!eof) {
      const response = await this._client.send('IO.read', {handle});
      eof = response.eof;
      this._result += response.data;
    }
    await this._client.send('IO.close', {handle});
  }

  /**
   * @param {string} path
   */
  async _writeResultToFile(path) {
    const file = await openAsync(path, 'w');
    await writeAsync(file, this._result);
    await closeAsync(file);
  }
}
helper.tracePublicAPI(Tracing);

module.exports = Tracing;
