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
const removeSync = require('rimraf').sync;
const childProcess = require('child_process');
const Downloader = require('../utils/ChromiumDownloader');
const Connection = require('./Connection');
const Browser = require('./Browser');
const readline = require('readline');
const crypto = require('crypto');
const helper = require('./helper');
const ChromiumRevision = require('../package.json').puppeteer.chromium_revision;

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
  static async launch(options) {
    options = options || {};
    let userDataDir = [
      CHROME_PROFILE_PATH,
      process.pid,
      ++browserId,
      crypto.randomBytes(8 / 2).toString('hex') // add random salt 8 characters long.
    ].join('-');

    let chromeArguments = DEFAULT_ARGS.concat([
      `--user-data-dir=${userDataDir}`,
    ]);
    if (typeof options.headless !== 'boolean' || options.headless) {
      chromeArguments.push(
          `--headless`,
          `--disable-gpu`,
          `--hide-scrollbars`,
          '--mute-audio'
      );
    }
    let chromeExecutable = options.executablePath;
    if (typeof chromeExecutable !== 'string') {
      let revisionInfo = Downloader.revisionInfo(Downloader.currentPlatform(), ChromiumRevision);
      console.assert(revisionInfo.downloaded, `Chromium revision is not downloaded. Run "npm install"`);
      chromeExecutable = revisionInfo.executablePath;
    }
    if (Array.isArray(options.args))
      chromeArguments.push(...options.args);

    let chromeProcess = childProcess.spawn(chromeExecutable, chromeArguments, {});
    if (options.dumpio) {
      chromeProcess.stdout.pipe(process.stdout);
      chromeProcess.stderr.pipe(process.stderr);
    }

    // Cleanup as processes exit.
    let listeners = [
      helper.addEventListener(process, 'exit', killChromeAndCleanup),
      helper.addEventListener(chromeProcess, 'exit', killChromeAndCleanup),
    ];
    if (options.handleSIGINT !== false)
      listeners.push(helper.addEventListener(process, 'SIGINT', killChromeAndCleanup));
    try {
      let connectionDelay = options.slowMo || 0;
      let browserWSEndpoint = await waitForWSEndpoint(chromeProcess, options.timeout || 30 * 1000);
      let connection = await Connection.create(browserWSEndpoint, connectionDelay);
      return new Browser(connection, !!options.ignoreHTTPSErrors, killChromeAndCleanup);
    } catch (e) {
      killChromeAndCleanup();
      throw e;
    }

    function killChromeAndCleanup() {
      helper.removeEventListeners(listeners);
      chromeProcess.kill('SIGKILL');
      removeSync(userDataDir);
    }
  }

  /**
   * @param {string} options
   * @return {!Promise<!Browser>}
   */
  static async connect({browserWSEndpoint, ignoreHTTPSErrors = false}) {
    let connection = await Connection.create(browserWSEndpoint);
    return new Browser(connection, !!ignoreHTTPSErrors);
  }
}

/**
 * @param {!ChildProcess} chromeProcess
 * @param {number} timeout
 * @return {!Promise<string>}
 */
function waitForWSEndpoint(chromeProcess, timeout) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: chromeProcess.stderr });
    let stderr = '';
    let listeners = [
      helper.addEventListener(rl, 'line', onLine),
      helper.addEventListener(rl, 'close', onClose),
      helper.addEventListener(chromeProcess, 'exit', onClose)
    ];
    let timeoutId = timeout ? setTimeout(onTimeout, timeout) : 0;

    function onClose() {
      cleanup();
      reject(new Error([
        'Failed to launch chrome!',
        stderr,
        '',
        'TROUBLESHOOTING: https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md',
        '',
      ].join('\n')));
    }

    function onTimeout() {
      cleanup();
      reject(new Error(`Timed out after ${timeout} ms while trying to connect to chrome! The only chrome revision guaranteed to work is r${ChromiumRevision}`));
    }

    /**
     * @param {string} line
     */
    function onLine(line) {
      stderr += line + '\n';
      const match = line.match(/^DevTools listening on (ws:\/\/.*)$/);
      if (!match)
        return;
      cleanup();
      resolve(match[1]);
    }

    function cleanup() {
      if (timeoutId)
        clearTimeout(timeoutId);
      helper.removeEventListeners(listeners);
    }
  });
}

module.exports = Launcher;
