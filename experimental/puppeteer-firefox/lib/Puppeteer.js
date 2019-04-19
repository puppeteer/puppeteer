/**
 * Copyright 2019 Google Inc. All rights reserved.
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

const {Launcher} = require('./Launcher.js');
const {BrowserFetcher} = require('./BrowserFetcher.js');
const Errors = require('./Errors');
const DeviceDescriptors = require('./DeviceDescriptors');

class Puppeteer {
  /**
   * @param {string} projectRoot
   * @param {string} preferredRevision
   */
  constructor(projectRoot, preferredRevision) {
    this._projectRoot = projectRoot;
    this._launcher = new Launcher(projectRoot, preferredRevision);
  }

  async launch(options = {}) {
    return this._launcher.launch(options);
  }

  async connect(options) {
    return this._launcher.connect(options);
  }

  createBrowserFetcher(options) {
    return new BrowserFetcher(this._projectRoot, options);
  }

  executablePath() {
    return this._launcher.executablePath();
  }

  defaultArgs(options) {
    return this._launcher.defaultArgs(options);
  }

  /**
   * @return {Object}
   */
  get devices() {
    return DeviceDescriptors;
  }

  /**
   * @return {Object}
   */
  get errors() {
    return Errors;
  }
}

module.exports = {Puppeteer};
