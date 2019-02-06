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
const readline = require('readline');
const fs = require('fs');
const util = require('util');
const {helper} = require('./helper');
const {TimeoutError} = require('./Errors')
const FirefoxTransport = require('./FirefoxTransport');

const mkdtempAsync = util.promisify(fs.mkdtemp);
const removeFolderAsync = util.promisify(removeFolder);

const FIREFOX_PROFILE_PATH = path.join(os.tmpdir(), 'puppeteer_firefox_profile-');

/**
 * @internal
 */
class Launcher {
  /**
   * @param {Object} options
   * @return {!Promise<!Browser>}
   */
  async launch(options = {}) {
    const {
      args = [],
      dumpio = false,
      executablePath = null,
      handleSIGHUP = true,
      handleSIGINT = true,
      handleSIGTERM = true,
      ignoreHTTPSErrors = false,
      headless = true,
      defaultViewport = {width: 800, height: 600},
      slowMo = 0,
    } = options;

    if (!executablePath)
      throw new Error('Firefox launching is only supported with local version of firefox!');

    const firefoxArguments = args.slice();
    firefoxArguments.push('-no-remote');
    firefoxArguments.push('-juggler', '0');
    firefoxArguments.push('-foreground');
    if (headless)
      firefoxArguments.push('-headless');
    let temporaryProfileDir = null;
    if (!firefoxArguments.some(arg => arg.startsWith('-profile') || arg.startsWith('--profile'))) {
      temporaryProfileDir = await mkdtempAsync(FIREFOX_PROFILE_PATH);
      firefoxArguments.push(`-profile`, temporaryProfileDir);
    }
    if (firefoxArguments.every(arg => arg.startsWith('--') || arg.startsWith('-')))
      firefoxArguments.push('about:blank');

    const stdio = ['pipe', 'pipe', 'pipe'];
    const firefoxProcess = childProcess.spawn(
        // On linux Juggler ships the libstdc++ it was linked against.
        env: os.platform() === 'linux' ? {
          ...process.env,
          LD_LIBRARY_PATH: `${executablePath}:${process.env.LD_LIBRARY_PATH}`,
        } : process.env,
        executablePath,
        firefoxArguments,
        {
          // On non-windows platforms, `detached: false` makes child process a leader of a new
          // process group, making it possible to kill child process tree with `.kill(-pid)` command.
          // @see https://nodejs.org/api/child_process.html#child_process_options_detached
          detached: process.platform !== 'win32',
          stdio
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
      listeners.push(helper.addEventListener(process, 'SIGTERM', killFirefox));
    if (handleSIGHUP)
      listeners.push(helper.addEventListener(process, 'SIGHUP', killFirefox));
    /** @type {?Connection} */
    let connection = null;
    try {
      const port = await waitForWSEndpoint(firefoxProcess, 30000);
      const transport = await FirefoxTransport.create(parseInt(port, 10));
      connection = new Connection(transport, slowMo);
      const browser = await Browser.create(connection, defaultViewport, firefoxProcess, killFirefox);
      if (ignoreHTTPSErrors)
        await connection.send('Browser.setIgnoreHTTPSErrors', {enabled: true});
      if (!browser.targets().length)
        await new Promise(x => browser.once('targetcreated', x));
      return browser;
    } catch (e) {
      killFirefox();
      throw e;
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
      const match = line.match(/^Juggler listening on (\d+)$/);
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
