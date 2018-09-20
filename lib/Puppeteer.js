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
const Launcher = require('./Launcher');
const BrowserFetcher = require('./BrowserFetcher');

module.exports = class {
  /**
   * @param {string} projectRoot
   * @param {string} preferredRevision
   * @param {boolean} isPuppeteerCore
   */
  constructor(projectRoot, preferredRevision, isPuppeteerCore) {
    this._projectRoot = projectRoot;
    this._launcher = new Launcher(projectRoot, preferredRevision, isPuppeteerCore);
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<!Puppeteer.Browser>}
   */
  launch(options) {
    return this._launcher.launch(options);
  }

  /**
   * @param {{browserWSEndpoint: string, ignoreHTTPSErrors: boolean, transport?: !Puppeteer.ConnectionTransport}} options
   * @return {!Promise<!Puppeteer.Browser>}
   */
  connect(options) {
    return this._launcher.connect(options);
  }

  /**
   * @return {string}
   */
  executablePath() {
    return this._launcher.executablePath();
  }

  /**
   * @return {!Array<string>}
   */
  defaultArgs(options) {
    return this._launcher.defaultArgs(options);
  }

  /**
   * @param {!Object=} options
   * @return {!BrowserFetcher}
   */
  createBrowserFetcher(options) {
    return new BrowserFetcher(this._projectRoot, options);
  }
};

helper.tracePublicAPI(module.exports, 'Puppeteer');
