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
const path = require('path');
const removeRecursive = require('rimraf').sync;
const childProcess = require('child_process');
const Downloader = require('../utils/ChromiumDownloader');
const Connection = require('./Connection');
const Browser = require('./Browser');
const helper = require('./helper');
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

class Launcher {
  /**
   * @param {!Object} options
   * @return {!Promise<!Browser>}
   */
  static async _launch(options) {
    options = options || {};
    ++browserId;
    let userDataDir = CHROME_PROFILE_PATH + browserId;
    let chromeArguments = DEFAULT_ARGS.concat([
      `--user-data-dir=${userDataDir}`,
    ]);
    if (typeof options.headless !== 'boolean' || options.headless) {
      chromeArguments.push(
          `--headless`,
          `--disable-gpu`,
          `--hide-scrollbars`
      );
    }
    let chromeExecutable = options.executablePath;
    if (typeof chromeExecutable !== 'string') {
      let chromiumRevision = require('../package.json').puppeteer.chromium_revision;
      let revisionInfo = Downloader.revisionInfo(Downloader.currentPlatform(), chromiumRevision);
      console.assert(revisionInfo, 'Chromium revision is not downloaded. Run npm install');
      chromeExecutable = revisionInfo.executablePath;
    }
    if (Array.isArray(options.args))
      chromeArguments.push(...options.args);
    let chromeProcess = childProcess.spawn(chromeExecutable, chromeArguments, {});
    if (options.dumpio) {
      chromeProcess.stdout.pipe(process.stdout);
      chromeProcess.stderr.pipe(process.stderr);
    }
    let stderr = '';
    chromeProcess.stderr.on('data', data => stderr += data.toString('utf8'));
    // Cleanup as processes exit.
    const onProcessExit = () => chromeProcess.kill();
    process.on('exit', onProcessExit);
    let terminated = false;
    chromeProcess.on('exit', () => {
      terminated = true;
      process.removeListener('exit', onProcessExit);
      removeRecursive(userDataDir);
    });

    let {port, browserTargetId} = await waitForRemoteDebuggingPort(chromeProcess);
    if (terminated)
      throw new Error('Failed to launch chrome! ' + stderr);
    // Failed to connect to browser.
    if (port === -1) {
      chromeProcess.kill();
      throw new Error('Failed to connect to chrome!');
    }

    let connectionDelay = options.slowMo || 0;
    let connection = await Connection.create(port, browserTargetId, connectionDelay);
    return new Browser(connection, !!options.ignoreHTTPSErrors, () => chromeProcess.kill());
  }

  static launch(options) {
    let browser = this._launch(options);
    return helper.Chain(browser, browser, 'browser');
  }
}


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

module.exports = Launcher;
