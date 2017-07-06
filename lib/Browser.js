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

const chromeLauncher = require('chrome-launcher');

const Page = require('./Page');
const Downloader = require('../utils/ChromiumDownloader');
const Connection = require('./Connection');

let DEFAULT_ARGS = [
  '--disable-background-timer-throttling',
  '--no-first-run',
];

class Browser {
  /**
  * @param {(!Object|undefined)} options
  */
  constructor(options) {
    options = options || {};
    if (typeof options.remoteDebuggingPort === 'number')
      this._remoteDebuggingPort = options.remoteDebuggingPort;
    this._chromeArguments = DEFAULT_ARGS;
    if (typeof options.headless !== 'boolean' || options.headless) {
      this._chromeArguments.push(...[
        `--headless`,
        `--disable-gpu`,
      ]);
    }
    if (typeof options.executablePath === 'string') {
      this._chromeExecutable = options.executablePath;
    } else {
      const chromiumRevision = require('../package.json').puppeteer.chromium_revision;
      const revisionInfo = Downloader.revisionInfo(Downloader.currentPlatform(), chromiumRevision);
      console.assert(revisionInfo, 'Chromium revision is not downloaded. Run npm install');
      this._chromeExecutable = revisionInfo.executablePath;
    }
    if (Array.isArray(options.args))
      this._chromeArguments.push(...options.args);
    this._terminated = false;
    this._chromeProcess = null;
  }

  /**
  * @return {!Promise<!Page>}
  */
  async newPage() {
    await this._ensureChromeIsRunning();
    if (!this._chromeProcess || this._terminated)
      throw new Error('ERROR: this chrome instance is not alive any more!');
    let client = await Connection.create(this._remoteDebuggingPort);
    let page = await Page.create(client);
    return page;
  }

  /**
  * @param {!Page} page
  */
  async closePage(page) {
    if (!this._chromeProcess || this._terminated)
      throw new Error('ERROR: this chrome instance is not running');
    await page.close();
  }

  /**
  * @return {string}
  */
  async version() {
    await this._ensureChromeIsRunning();
    let version = await Connection.version(this._remoteDebuggingPort);
    return version.Browser;
  }

  async _ensureChromeIsRunning() {
    if (this._chromeProcess)
      return;
    this._chromeProcess = await chromeLauncher.launch({
      chromeFlags: this._chromeArguments,
      chromePath: this._chromeExecutable,
      port: this._remoteDebuggingPort
    });
    this._remoteDebuggingPort = this._chromeProcess.port;
    // Cleanup as processes exit.
    process.on('exit', () => this._chromeProcess.kill());
    // this._chromeProcess.on('exit', () => {
    //     this._terminated = true;
    // });
  }

  close() {
    if (!this._chromeProcess)
      return;
    this._chromeProcess.kill();
  }
}

module.exports = Browser;
