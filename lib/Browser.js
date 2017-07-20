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

let {Duplex} = require('stream');
let path = require('path');
let helper = require('./helper');
let removeRecursive = require('rimraf').sync;
let Page = require('./Page');
let childProcess = require('child_process');
let Downloader = require('../utils/ChromiumDownloader');
let Connection = require('./Connection');
let readline = require('readline');

let CHROME_PROFILE_PATH = path.resolve(__dirname, '..', '.dev_profile');
let browserId = 0;

let DEFAULT_ARGS = [
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-client-side-phishing-detection',
  '--disable-default-apps',
  '--disable-hang-monitor',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-sync',
  '--enable-automation',
  '--metrics-recording-only',
  '--no-first-run',
  '--password-store=basic',
  '--remote-debugging-port=0',
  '--safebrowsing-disable-auto-update',
  '--use-mock-keychain',
];

class Browser {
  /**
   * @param {(!Object|undefined)} options
   */
  constructor(options) {
    options = options || {};
    ++browserId;
    this._userDataDir = CHROME_PROFILE_PATH + browserId;
    this._remoteDebuggingPort = 0;
    this._chromeArguments = DEFAULT_ARGS.concat([
      `--user-data-dir=${this._userDataDir}`,
    ]);
    if (typeof options.headless !== 'boolean' || options.headless) {
      this._chromeArguments.push(...[
        `--headless`,
        `--disable-gpu`,
        `--hide-scrollbars`,
      ]);
    }
    if (typeof options.executablePath === 'string') {
      this._chromeExecutable = options.executablePath;
    } else {
      let chromiumRevision = require('../package.json').puppeteer.chromium_revision;
      let revisionInfo = Downloader.revisionInfo(Downloader.currentPlatform(), chromiumRevision);
      console.assert(revisionInfo, 'Chromium revision is not downloaded. Run npm install');
      this._chromeExecutable = revisionInfo.executablePath;
    }
    if (Array.isArray(options.args))
      this._chromeArguments.push(...options.args);
    this._terminated = false;
    this._chromeProcess = null;
    this._launchPromise = null;
    this._screenshotTaskQueue = new TaskQueue();

    this.stderr = new ProxyStream();
    this.stdout = new ProxyStream();
  }

  /**
     * @return {!Promise<!Page>}
     */
  async newPage() {
    await this._ensureChromeIsRunning();
    if (!this._chromeProcess || this._terminated)
      throw new Error('ERROR: this chrome instance is not alive any more!');
    let client = await Connection.create(this._remoteDebuggingPort);
    let page = await Page.create(client, this._screenshotTaskQueue);
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
    if (!this._launchPromise)
      this._launchPromise = this._launchChrome();
    return this._launchPromise;
  }

  async _launchChrome() {
    this._chromeProcess = childProcess.spawn(this._chromeExecutable, this._chromeArguments, {});
    let stderr = '';
    this._chromeProcess.stderr.on('data', data => stderr += data.toString('utf8'));
    // Cleanup as processes exit.
    const onProcessExit = () => this._chromeProcess.kill();
    process.on('exit', onProcessExit);
    this._chromeProcess.on('exit', () => {
      this._terminated = true;
      process.removeListener('exit', onProcessExit);
      removeRecursive(this._userDataDir);
    });
    this._chromeProcess.stderr.pipe(this.stderr);
    this._chromeProcess.stdout.pipe(this.stdout);

    this._remoteDebuggingPort = await waitForRemoteDebuggingPort(this._chromeProcess);
    // Failed to connect to browser.
    if (this._remoteDebuggingPort === -1) {
      this._chromeProcess.kill();
      throw new Error('Failed to connect to chrome!');
    }

    if (this._terminated)
      throw new Error('Failed to launch chrome! ' + stderr);
  }

  close() {
    if (!this._chromeProcess)
      return;
    this._chromeProcess.kill();
  }
}

module.exports = Browser;
helper.tracePublicAPI(Browser);

function waitForRemoteDebuggingPort(chromeProcess) {
  const rl = readline.createInterface({ input: chromeProcess.stderr });
  let fulfill;
  let promise = new Promise(x => fulfill = x);
  rl.on('line', onLine);
  rl.once('close', () => fulfill(-1));
  return promise;

  /**
   * @param {string} line
   */
  function onLine(line) {
    const match = line.match(/^DevTools listening on .*:([\d]+)$/);
    if (!match)
      return;
    rl.removeListener('line', onLine);
    fulfill(Number.parseInt(match[1], 10));
  }
}

class TaskQueue {
  constructor() {
    this._chain = Promise.resolve();
  }

  /**
   * @param {function():!Promise} task
   * @return {!Promise}
   */
  postTask(task) {
    let result = this._chain.then(task);
    this._chain = result.catch(() => {});
    return result;
  }
}

class ProxyStream extends Duplex {
  _read() { }

  /**
   * @param {?} chunk
   * @param {string} encoding
   * @param {function()} callback
   */
  _write(chunk, encoding, callback) {
    this.push(chunk, encoding);
    callback();
  }
}
