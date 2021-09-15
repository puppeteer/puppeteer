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
const {Connection} = require('./Connection');
const {Browser} = require('./Browser');
const {BrowserFetcher} = require('./BrowserFetcher');
const readline = require('readline');
const fs = require('fs');
const util = require('util');
const {helper, debugError} = require('./helper');
const {TimeoutError} = require('./Errors')
const WebSocketTransport = require('./WebSocketTransport');

const mkdtempAsync = util.promisify(fs.mkdtemp);
const removeFolderAsync = util.promisify(removeFolder);

const FIREFOX_PROFILE_PATH = path.join(os.tmpdir(), 'puppeteer_firefox_profile-');

const DEFAULT_ARGS = [
  '-no-remote',
  '-foreground',
];

/**
 * @internal
 */
class Launcher {
  constructor(projectRoot, preferredRevision) {
    this._projectRoot = projectRoot;
    this._preferredRevision = preferredRevision;
  }

  defaultArgs(options = {}) {
    const {
      headless = true,
      args = [],
      userDataDir = null,
    } = options;
    const firefoxArguments = [...DEFAULT_ARGS];
    if (userDataDir)
      firefoxArguments.push('-profile', userDataDir);
    if (headless)
      firefoxArguments.push('-headless');
    firefoxArguments.push(...args);
    if (args.every(arg => arg.startsWith('-')))
      firefoxArguments.push('about:blank');
    return firefoxArguments;
  }

  /**
   * @param {Object} options
   * @return {!Promise<!Browser>}
   */
  async launch(options = {}) {
    const {
      ignoreDefaultArgs = false,
      args = [],
      dumpio = false,
      executablePath = null,
      env = process.env,
      handleSIGHUP = true,
      handleSIGINT = true,
      handleSIGTERM = true,
      ignoreHTTPSErrors = false,
      headless = true,
      defaultViewport = {width: 800, height: 600},
      slowMo = 0,
      timeout = 30000,
    } = options;

    const firefoxArguments = [];
    if (!ignoreDefaultArgs)
      firefoxArguments.push(...this.defaultArgs(options));
    else if (Array.isArray(ignoreDefaultArgs))
      firefoxArguments.push(...this.defaultArgs(options).filter(arg => !ignoreDefaultArgs.includes(arg)));
    else
      firefoxArguments.push(...args);

    if (!firefoxArguments.includes('-juggler'))
      firefoxArguments.push('-juggler', '0');

    let temporaryProfileDir = null;
    if (!firefoxArguments.includes('-profile') && !firefoxArguments.includes('--profile')) {
      temporaryProfileDir = await mkdtempAsync(FIREFOX_PROFILE_PATH);
      firefoxArguments.push(`-profile`, temporaryProfileDir);
    }

    let firefoxExecutable = executablePath;
    if (!firefoxExecutable) {
      const {missingText, executablePath} = this._resolveExecutablePath();
      if (missingText)
        throw new Error(missingText);
      firefoxExecutable = executablePath;
    }
    const stdio = ['pipe', 'pipe', 'pipe'];
    const firefoxProcess = childProcess.spawn(
        firefoxExecutable,
        firefoxArguments,
        {
          // On non-windows platforms, `detached: false` makes child process a leader of a new
          // process group, making it possible to kill child process tree with `.kill(-pid)` command.
          // @see https://nodejs.org/api/child_process.html#child_process_options_detached
          detached: process.platform !== 'win32',
          stdio,
          // On linux Juggler ships the libstdc++ it was linked against.
          env: os.platform() === 'linux' ? {
            ...env,
            LD_LIBRARY_PATH: `${path.dirname(firefoxExecutable)}:${process.env.LD_LIBRARY_PATH}`,
          } : env,
        }
    );

    if (dumpio) {
      firefoxProcess.stderr.pipe(process.stderr);
      firefoxProcess.stdout.pipe(process.stdout);
    }

    let firefoxClosed = false;
    const waitForFirefoxToClose = new Promise((fulfill, reject) => {
      firefoxProcess.once('exit', () => {
        firefoxClosed = true;
        // Cleanup as processes exit.
        if (temporaryProfileDir) {
          removeFolderAsync(temporaryProfileDir)
              .then(() => fulfill())
              .catch(err => console.error(err));
        } else {
          fulfill();
        }
      });
    });

    const listeners = [ helper.addEventListener(process, 'exit', killFirefox) ];
    if (handleSIGINT)
      listeners.push(helper.addEventListener(process, 'SIGINT', () => { killFirefox(); process.exit(130); }));
    if (handleSIGTERM)
      listeners.push(helper.addEventListener(process, 'SIGTERM', gracefullyCloseFirefox));
    if (handleSIGHUP)
      listeners.push(helper.addEventListener(process, 'SIGHUP', gracefullyCloseFirefox));
    /** @type {?Connection} */
    let connection = null;
    try {
      const url = await waitForWSEndpoint(firefoxProcess, timeout);
      const transport = await WebSocketTransport.create(url);
      connection = new Connection(url, transport, slowMo);
      const browser = await Browser.create(connection, defaultViewport, firefoxProcess, gracefullyCloseFirefox);
      if (ignoreHTTPSErrors)
        await connection.send('Browser.setIgnoreHTTPSErrors', {enabled: true});
      await browser.waitForTarget(t => t.type() === 'page');
      return browser;
    } catch (e) {
      killFirefox();
      throw e;
    }

    function gracefullyCloseFirefox() {
      helper.removeEventListeners(listeners);
      if (temporaryProfileDir) {
        killFirefox();
      } else if (connection) {
        connection.send('Browser.close').catch(error => {
          debugError(error);
          killFirefox();
        });
      }
      return waitForFirefoxToClose;
    }

    // This method has to be sync to be used as 'exit' event handler.
    function killFirefox() {
      helper.removeEventListeners(listeners);
      if (firefoxProcess.pid && !firefoxProcess.killed && !firefoxClosed) {
        // Force kill chrome.
        try {
          if (process.platform === 'win32')
            childProcess.execSync(`taskkill /pid ${firefoxProcess.pid} /T /F`);
          else
            process.kill(-firefoxProcess.pid, 'SIGKILL');
        } catch (e) {
          // the process might have already stopped
        }
      }
      // Attempt to remove temporary profile directory to avoid littering.
      try {
        removeFolder.sync(temporaryProfileDir);
      } catch (e) { }
    }
  }

  /**
   * @param {Object} options
   * @return {!Promise<!Browser>}
   */
  async connect(options = {}) {
    const {
      browserWSEndpoint,
      slowMo = 0,
      defaultViewport = {width: 800, height: 600},
      ignoreHTTPSErrors = false,
    } = options;
    let connection = null;
    const transport = await WebSocketTransport.create(browserWSEndpoint);
    connection = new Connection(browserWSEndpoint, transport, slowMo);
    const browser = await Browser.create(connection, defaultViewport, null, () => connection.send('Browser.close').catch(debugError));
    if (ignoreHTTPSErrors)
      await connection.send('Browser.setIgnoreHTTPSErrors', {enabled: true});
    return browser;
  }

  /**
   * @return {string}
   */
  executablePath() {
    return this._resolveExecutablePath().executablePath;
  }

  _resolveExecutablePath() {
    const downloadPath = process.env.PUPPETEER_DOWNLOAD_PATH ||
      process.env.npm_config_puppeteer_download_path ||
      process.env.npm_package_config_puppeteer_download_path;
    const browserFetcher = new BrowserFetcher(this._projectRoot, { product: 'firefox', path: downloadPath });
    const revisionInfo = browserFetcher.revisionInfo(this._preferredRevision);
    const missingText = !revisionInfo.local ? `Firefox revision is not downloaded. Run "npm install" or "yarn install"` : null;
    return {executablePath: revisionInfo.executablePath, missingText};
  }
}

/**
 * @param {!Puppeteer.ChildProcess} firefoxProcess
 * @param {number} timeout
 * @return {!Promise<string>}
 */
function waitForWSEndpoint(firefoxProcess, timeout) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: firefoxProcess.stdout });
    let stderr = '';
    const listeners = [
      helper.addEventListener(rl, 'line', onLine),
      helper.addEventListener(rl, 'close', () => onClose()),
      helper.addEventListener(firefoxProcess, 'exit', () => onClose()),
      helper.addEventListener(firefoxProcess, 'error', error => onClose(error))
    ];
    const timeoutId = timeout ? setTimeout(onTimeout, timeout) : 0;

    /**
     * @param {!Error=} error
     */
    function onClose(error) {
      cleanup();
      reject(new Error([
        'Failed to launch Firefox!' + (error ? ' ' + error.message : ''),
        stderr,
        '',
      ].join('\n')));
    }

    function onTimeout() {
      cleanup();
      reject(new TimeoutError(`Timed out after ${timeout} ms while trying to connect to Firefox!`));
    }

    /**
     * @param {string} line
     */
    function onLine(line) {
      stderr += line + '\n';
      const match = line.match(/^Juggler listening on (ws:\/\/.*)$/);
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

module.exports = {Launcher};
