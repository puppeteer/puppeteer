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
const readline = require('readline');
const crypto = require('crypto');

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
    const userDataDir = [
      CHROME_PROFILE_PATH,
      process.pid,
      ++browserId,
      crypto.randomBytes(8 / 2).toString('hex') // add random salt 8 characters long.
    ].join('-');

    const chromeArguments = DEFAULT_ARGS.concat([
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
      const chromiumRevision = require('../package.json').puppeteer.chromium_revision;
      const revisionInfo = Downloader.revisionInfo(Downloader.currentPlatform(), chromiumRevision);
      console.assert(revisionInfo, 'Chromium revision is not downloaded. Run npm install');
      chromeExecutable = revisionInfo.executablePath;
    }
    if (Array.isArray(options.args))
      chromeArguments.push(...options.args);
    const chromeProcess = childProcess.spawn(chromeExecutable, chromeArguments, {});
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

    const browserWSEndpoint = await waitForWSEndpoint(chromeProcess);
    if (terminated) {
      throw new Error([
        'Failed to launch chrome!',
        stderr,
        '',
        'TROUBLESHOOTING: https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md',
        '',
      ].join('\n'));
    }
    // Failed to connect to browser.
    if (!browserWSEndpoint) {
      chromeProcess.kill();
      throw new Error('Failed to connect to chrome!');
    }

    const connectionDelay = options.slowMo || 0;
    const connection = await Connection.create(browserWSEndpoint, connectionDelay);
    return new Browser(connection, !!options.ignoreHTTPSErrors, () => chromeProcess.kill());
  }

  /**
   * @param {string} options
   * @return {!Promise<!Browser>}
   */
  static async connect({browserWSEndpoint, ignoreHTTPSErrors = false}) {
    const connection = await Connection.create(browserWSEndpoint);
    return new Browser(connection, !!ignoreHTTPSErrors);
  }
}

/**
 * @param {!ChildProcess} chromeProcess
 * @return {!Promise<string>}
 */
function waitForWSEndpoint(chromeProcess) {
  return new Promise(fulfill => {
    const rl = readline.createInterface({ input: chromeProcess.stderr });
    rl.on('line', onLine);
    rl.once('close', () => fulfill(''));

    /**
     * @param {string} line
     */
    function onLine(line) {
      const match = line.match(/^DevTools listening on (ws:\/\/.*)$/);
      if (!match)
        return;
      rl.removeListener('line', onLine);
      fulfill(match[1]);
    }
  });
}

module.exports = Launcher;
