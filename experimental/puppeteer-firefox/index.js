/**
 * Copyright 2018 Google Inc. All rights reserved.
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
const FirefoxLauncher = require('./lib/firefox/Launcher.js').Launcher;
const BrowserFetcher = require('./lib/firefox/BrowserFetcher.js');

class Puppeteer {
  constructor() {
    this._firefoxLauncher = new FirefoxLauncher();
  }

  async launch(options = {}) {
    const {
      args = [],
      dumpio = !!process.env.DUMPIO,
      handleSIGHUP = true,
      handleSIGINT = true,
      handleSIGTERM = true,
      headless = (process.env.HEADLESS || 'true').trim().toLowerCase() === 'true',
      defaultViewport = {width: 800, height: 600},
      ignoreHTTPSErrors = false,
      slowMo = 0,
      executablePath = this.executablePath(),
    } = options;
    options = {
      args, slowMo, dumpio, executablePath, handleSIGHUP, handleSIGINT, handleSIGTERM, headless, defaultViewport,
      ignoreHTTPSErrors
    };
    return await this._firefoxLauncher.launch(options);
  }

  createBrowserFetcher(options) {
    return new BrowserFetcher(__dirname, options);
  }

  executablePath() {
    const browserFetcher = new BrowserFetcher(__dirname, { product: 'firefox' });
    const revision = require('./package.json').puppeteer.firefox_revision;
    const revisionInfo = browserFetcher.revisionInfo(revision);
    return revisionInfo.executablePath;
  }
}

module.exports = new Puppeteer();
