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

const {Duplex} = require('stream');
const path = require('path');
const helper = require('./helper');
const removeRecursive = require('rimraf').sync;
const Page = require('./Page');
const childProcess = require('child_process');
const Downloader = require('../utils/ChromiumDownloader');
const Connection = require('./Connection');
const readline = require('readline');

const CHROME_PROFILE_PATH = path.resolve(__dirname, '..', '.dev_profile');
let browserId = 0;

const DEFAULT_ARGS = [
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
   * @param {!Object=} options
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
      this._chromeArguments.push(
          `--headless`,
          `--disable-gpu`,
          `--hide-scrollbars`
      );
    }
    if (typeof options.chromePath === 'string') {
      this._chromeExecutable = options.chromePath;
    } else if (process.env.CHROME_PATH) {
      this._chromeExecutable = process.env.CHROME_PATH;
    } else {
      let chromiumRevision = require('../package.json').puppeteer.chromium_revision;
      let revisionInfo = Downloader.revisionInfo(Downloader.currentPlatform(), chromiumRevision);
      console.assert(revisionInfo, 'Chromium revision is not downloaded. Run npm install');
      this._chromeExecutable = revisionInfo.chromePath;
    }
    this._ignoreHTTPSErrors = !!options.ignoreHTTPSErrors;
    if (Array.isArray(options.args))
      this._chromeArguments.push(...options.args);
    this._connectionDelay = options.slowMo || 0;
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

    const {targetId} = await this._connection.send('Target.createTarget', {url: 'about:blank'});
    const client = await this._connection.createSession(targetId);
    return await Page.create(client, this._ignoreHTTPSErrors, this._screenshotTaskQueue);
  }

  /**
   * @return {!Promise<string>}
   */
  async version() {
    await this._ensureChromeIsRunning();
    let version = await Connection.version(this._remoteDebuggingPort);
    return version.Browser;
  }

  /**
   * @return {!Promise}
   */
  async _ensureChromeIsRunning() {
    if (!this._launchPromise)
      this._launchPromise = this._launchChrome();
    return this._launchPromise;
  }

  /**
   * @return {!Promise}
   */
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

    let {port, browserTargetId} = await waitForRemoteDebuggingPort(this._chromeProcess);
    // Failed to connect to browser.
    if (port === -1) {
      this._chromeProcess.kill();
      throw new Error('Failed to connect to chrome!');
    }

    if (this._terminated)
      throw new Error('Failed to launch chrome! ' + stderr);
    this._remoteDebuggingPort = port;
    this._connection = await Connection.create(port, browserTargetId, this._connectionDelay);
  }

  close() {
    if (!this._chromeProcess)
      return;
    this._chromeProcess.kill();
  }
}

module.exports = Browser;
helper.tracePublicAPI(Browser);

/**
 * @param {!ChildProcess} chromeProcess
 * @return {!Promise<number>}
 */
function waitForRemoteDebuggingPort(chromeProcess) {
  return new Promise(fulfill => {
    const rl = readline.createInterface({ input: chromeProcess.stderr });
    rl.on('line', onLine);
    rl.once('close', () => fulfill(-1));

    /**
     * @param {string} line
     */
    function onLine(line) {
      const match = line.match(/^DevTools listening on .*:(\d+)(\/.*)$/);
      if (!match)
        return;
      rl.removeListener('line', onLine);
      fulfill({port: Number.parseInt(match[1], 10), browserTargetId: match[2]});
    }
  });
}

class TaskQueue {
  constructor() {
    this._chain = Promise.resolve();
  }

  /**
   * @param {function()} task
   * @return {!Promise}
   */
  postTask(task) {
    const result = this._chain.then(task);
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
