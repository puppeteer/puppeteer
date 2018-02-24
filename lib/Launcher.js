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
const os = require('os');
const path = require('path');
const removeFolder = require('rimraf');
const childProcess = require('child_process');
const BrowserFetcher = require('./BrowserFetcher');
const {Connection} = require('./Connection');
const Browser = require('./Browser');
const readline = require('readline');
const fs = require('fs');
const {helper} = require('./helper');
const ChromiumRevision = require(path.join(helper.projectRoot(), 'package.json')).puppeteer.chromium_revision;

const mkdtempAsync = helper.promisify(fs.mkdtemp);
const removeFolderAsync = helper.promisify(removeFolder);

const CHROME_PROFILE_PATH = path.join(os.tmpdir(), 'puppeteer_dev_profile-');

const DEFAULT_ARGS = [
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-client-side-phishing-detection',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-hang-monitor',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-sync',
  '--disable-translate',
  '--metrics-recording-only',
  '--no-first-run',
  '--safebrowsing-disable-auto-update',
];

const AUTOMATION_ARGS = [
  '--enable-automation',
  '--password-store=basic',
  '--use-mock-keychain',
  '--remote-debugging-port=0',
];

class Launcher {
  /**
   * @param {!Object=} options
   * @return {!Promise<!Browser>}
   */
  static async launch(options) {
    options = Object.assign({}, options || {});
    console.assert(!options.ignoreDefaultArgs || !options.appMode, '`appMode` flag cannot be used together with `ignoreDefaultArgs`');
    let temporaryUserDataDir = null;
    const chromeArguments = [];
    if (!options.ignoreDefaultArgs)
      chromeArguments.push(...DEFAULT_ARGS);
    if (options.appMode) {
      options.headless = false;
      chromeArguments.push('--remote-debugging-pipe');
    } else if (!options.ignoreDefaultArgs) {
      chromeArguments.push(...AUTOMATION_ARGS);
    }

    if (!options.args || !options.args.some(arg => arg.startsWith('--user-data-dir'))) {
      if (!options.userDataDir)
        temporaryUserDataDir = await mkdtempAsync(CHROME_PROFILE_PATH);

      chromeArguments.push(`--user-data-dir=${options.userDataDir || temporaryUserDataDir}`);
    }
    if (options.devtools === true) {
      chromeArguments.push('--auto-open-devtools-for-tabs');
      options.headless = false;
    }
    if (typeof options.headless !== 'boolean' || options.headless) {
      chromeArguments.push(
          '--headless',
          '--disable-gpu',
          '--hide-scrollbars',
          '--mute-audio'
      );
    }
    let chromeExecutable = options.executablePath;
    if (typeof chromeExecutable !== 'string') {
      const browserFetcher = new BrowserFetcher();
      const revisionInfo = browserFetcher.revisionInfo(ChromiumRevision);
      console.assert(revisionInfo.local, `Chromium revision is not downloaded. Run "npm install" or "yarn install"`);
      chromeExecutable = revisionInfo.executablePath;
    }
    if (Array.isArray(options.args))
      chromeArguments.push(...options.args);

    const stdio = ['pipe', 'pipe', 'pipe'];
    if (options.appMode)
      stdio.push('pipe', 'pipe');
    const chromeProcess = childProcess.spawn(
        chromeExecutable,
        chromeArguments,
        {
          detached: true,
          env: options.env || process.env,
          stdio
        }
    );

    if (options.dumpio) {
      chromeProcess.stderr.pipe(process.stderr);
      chromeProcess.stdout.pipe(process.stdout);
    }

    let chromeClosed = false;
    const waitForChromeToClose = new Promise((fulfill, reject) => {
      chromeProcess.once('close', () => {
        chromeClosed = true;
        // Cleanup as processes exit.
        if (temporaryUserDataDir) {
          removeFolderAsync(temporaryUserDataDir)
              .then(() => fulfill())
              .catch(err => console.error(err));
        } else {
          fulfill();
        }
      });
    });

    const listeners = [ helper.addEventListener(process, 'exit', forceKillChrome) ];
    if (options.handleSIGINT !== false)
      listeners.push(helper.addEventListener(process, 'SIGINT', forceKillChrome));
    if (options.handleSIGTERM !== false)
      listeners.push(helper.addEventListener(process, 'SIGTERM', killChrome));
    if (options.handleSIGHUP !== false)
      listeners.push(helper.addEventListener(process, 'SIGHUP', killChrome));
    /** @type {?Connection} */
    let connection = null;
    try {
      const connectionDelay = options.slowMo || 0;
      if (!options.appMode) {
        const timeout = helper.isNumber(options.timeout) ? options.timeout : 30000;
        const browserWSEndpoint = await waitForWSEndpoint(chromeProcess, timeout);
        connection = await Connection.createForWebSocket(browserWSEndpoint, connectionDelay);
      } else {
        connection = Connection.createForPipe(/** @type {!NodeJS.WritableStream} */(chromeProcess.stdio[3]), /** @type {!NodeJS.ReadableStream} */ (chromeProcess.stdio[4]), connectionDelay);
      }
      return Browser.create(connection, options, chromeProcess, killChrome);
    } catch (e) {
      forceKillChrome();
      throw e;
    }

    /**
     * @return {Promise}
     */
    function killChrome() {
      helper.removeEventListeners(listeners);
      if (temporaryUserDataDir) {
        forceKillChrome();
      } else if (connection) {
        // Attempt to close chrome gracefully
        connection.send('Browser.close');
      }
      return waitForChromeToClose;
    }

    function forceKillChrome() {
      helper.removeEventListeners(listeners);
      if (chromeProcess.pid && !chromeProcess.killed && !chromeClosed) {
        // Force kill chrome.
        if (process.platform === 'win32')
          childProcess.execSync(`taskkill /pid ${chromeProcess.pid} /T /F`);
        else
          process.kill(-chromeProcess.pid, 'SIGKILL');
      }
      // Attempt to remove temporary profile directory to avoid littering.
      try {
        removeFolder.sync(temporaryUserDataDir);
      } catch (e) { }
    }
  }

  /**
   * @return {!Array<string>}
   */
  static defaultArgs() {
    return DEFAULT_ARGS.concat(AUTOMATION_ARGS);
  }

  /**
   * @return {string}
   */
  static executablePath() {
    const browserFetcher = new BrowserFetcher();
    const revisionInfo = browserFetcher.revisionInfo(ChromiumRevision);
    return revisionInfo.executablePath;
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<!Browser>}
   */
  static async connect(options = {}) {
    const connectionDelay = options.slowMo || 0;
    const connection = await Connection.createForWebSocket(options.browserWSEndpoint, connectionDelay);
    return Browser.create(connection, options, null, () => connection.send('Browser.close'));
  }
}

/**
 * @param {!Puppeteer.ChildProcess} chromeProcess
 * @param {number} timeout
 * @return {!Promise<string>}
 */
function waitForWSEndpoint(chromeProcess, timeout) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: chromeProcess.stderr });
    let stderr = '';
    const listeners = [
      helper.addEventListener(rl, 'line', onLine),
      helper.addEventListener(rl, 'close', () => onClose()),
      helper.addEventListener(chromeProcess, 'exit', () => onClose()),
      helper.addEventListener(chromeProcess, 'error', error => onClose(error))
    ];
    const timeoutId = timeout ? setTimeout(onTimeout, timeout) : 0;

    /**
     * @param {!Error=} error
     */
    function onClose(error) {
      cleanup();
      reject(new Error([
        'Failed to launch chrome!' + (error ? ' ' + error.message : ''),
        stderr,
        '',
        'TROUBLESHOOTING: https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md',
        '',
      ].join('\n')));
    }

    function onTimeout() {
      cleanup();
      reject(new Error(`Timed out after ${timeout} ms while trying to connect to Chrome! The only Chrome revision guaranteed to work is r${ChromiumRevision}`));
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
