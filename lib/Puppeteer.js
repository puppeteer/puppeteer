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
   * @param {!Object=} options
   * @return {!Promise<!Puppeteer.Browser>}
   */
  static launch(options) {
    return Launcher.launch(options);
  }

  /**
   * @param {{browserWSEndpoint: string, ignoreHTTPSErrors: boolean}} options
   * @return {!Promise<!Puppeteer.Browser>}
   */
  static connect(options) {
    return Launcher.connect(options);
  }

  /**
   * @return {string}
   */
  static executablePath() {
    return Launcher.executablePath();
  }

  /**
   * @return {!Array<string>}
   */
  static defaultArgs() {
    return Launcher.defaultArgs();
  }

  /**
   * @param {!Object=} options
   * @return {!BrowserFetcher}
   */
  static createBrowserFetcher(options) {
    return new BrowserFetcher(options);
  }
};

helper.tracePublicAPI(module.exports, 'Puppeteer');
