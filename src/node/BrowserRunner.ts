/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import removeFolder from 'rimraf';
import {promisify} from 'util';
import {assert} from '../common/assert.js';
import {Connection} from '../common/Connection.js';
import {debug} from '../common/Debug.js';
import {TimeoutError} from '../common/Errors.js';
import {
  debugError,
  addEventListener,
  isErrnoException,
  isErrorLike,
  PuppeteerEventListener,
  removeEventListeners,
} from '../common/util.js';
import {Product} from '../common/Product.js';
import {NodeWebSocketTransport as WebSocketTransport} from '../node/NodeWebSocketTransport.js';
import {LaunchOptions} from './LaunchOptions.js';
import {PipeTransport} from './PipeTransport.js';

const removeFolderAsync = promisify(removeFolder);
const renameAsync = promisify(fs.rename);
const unlinkAsync = promisify(fs.unlink);

const debugLauncher = debug('puppeteer:launcher');

const PROCESS_ERROR_EXPLANATION = `Puppeteer was unable to kill the process which ran the browser binary.
This means that, on future Puppeteer launches, Puppeteer might not be able to launch the browser.
Please check your open processes and ensure that the browser processes that Puppeteer launched have been killed.
If you think this is a bug, please report it on the Puppeteer issue tracker.`;

/**
 * @internal
 */
export class BrowserRunner {
  #product: Product;
  #executablePath: string;
  #processArguments: string[];
  #userDataDir: string;
  #isTempUserDataDir?: boolean;
  #closed = true;
  #listeners: PuppeteerEventListener[] = [];
  #processClosing!: Promise<void>;

  proc?: childProcess.ChildProcess;
  connection?: Connection;

  constructor(
    product: Product,
    executablePath: string,
    processArguments: string[],
    userDataDir: string,
    isTempUserDataDir?: boolean
  ) {
    this.#product = product;
    this.#executablePath = executablePath;
    this.#processArguments = processArguments;
    this.#userDataDir = userDataDir;
    this.#isTempUserDataDir = isTempUserDataDir;
  }

  start(options: LaunchOptions): void {
    const {handleSIGINT, handleSIGTERM, handleSIGHUP, dumpio, env, pipe} =
      options;
    let stdio: Array<'ignore' | 'pipe'>;
    if (pipe) {
      if (dumpio) {
        stdio = ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'];
      } else {
        stdio = ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'];
      }
    } else {
      if (dumpio) {
        stdio = ['pipe', 'pipe', 'pipe'];
      } else {
        stdio = ['pipe', 'ignore', 'pipe'];
      }
    }
    assert(!this.proc, 'This process has previously been started.');
    debugLauncher(
      `Calling ${this.#executablePath} ${this.#processArguments.join(' ')}`
    );
    this.proc = childProcess.spawn(
      this.#executablePath,
      this.#processArguments,
      {
        // On non-windows platforms, `detached: true` makes child process a
        // leader of a new process group, making it possible to kill child
        // process tree with `.kill(-pid)` command. @see
        // https://nodejs.org/api/child_process.html#child_process_options_detached
        detached: process.platform !== 'win32',
        env,
        stdio,
      }
    );
    if (dumpio) {
      this.proc.stderr?.pipe(process.stderr);
      this.proc.stdout?.pipe(process.stdout);
    }
    this.#closed = false;
    this.#processClosing = new Promise((fulfill, reject) => {
      this.proc!.once('exit', async () => {
        this.#closed = true;
        // Cleanup as processes exit.
        if (this.#isTempUserDataDir) {
          try {
            await removeFolderAsync(this.#userDataDir);
            fulfill();
          } catch (error) {
            debugError(error);
            reject(error);
          }
        } else {
          if (this.#product === 'firefox') {
            try {
              // When an existing user profile has been used remove the user
              // preferences file and restore possibly backuped preferences.
              await unlinkAsync(path.join(this.#userDataDir, 'user.js'));

              const prefsBackupPath = path.join(
                this.#userDataDir,
                'prefs.js.puppeteer'
              );
              if (fs.existsSync(prefsBackupPath)) {
                const prefsPath = path.join(this.#userDataDir, 'prefs.js');
                await unlinkAsync(prefsPath);
                await renameAsync(prefsBackupPath, prefsPath);
              }
            } catch (error) {
              debugError(error);
              reject(error);
            }
          }

          fulfill();
        }
      });
    });
    this.#listeners = [addEventListener(process, 'exit', this.kill.bind(this))];
    if (handleSIGINT) {
      this.#listeners.push(
        addEventListener(process, 'SIGINT', () => {
          this.kill();
          process.exit(130);
        })
      );
    }
    if (handleSIGTERM) {
      this.#listeners.push(
        addEventListener(process, 'SIGTERM', this.close.bind(this))
      );
    }
    if (handleSIGHUP) {
      this.#listeners.push(
        addEventListener(process, 'SIGHUP', this.close.bind(this))
      );
    }
  }

  close(): Promise<void> {
    if (this.#closed) {
      return Promise.resolve();
    }
    if (this.#isTempUserDataDir) {
      this.kill();
    } else if (this.connection) {
      // Attempt to close the browser gracefully
      this.connection.send('Browser.close').catch(error => {
        debugError(error);
        this.kill();
      });
    }
    // Cleanup this listener last, as that makes sure the full callback runs. If we
    // perform this earlier, then the previous function calls would not happen.
    removeEventListeners(this.#listeners);
    return this.#processClosing;
  }

  kill(): void {
    // If the process failed to launch (for example if the browser executable path
    // is invalid), then the process does not get a pid assigned. A call to
    // `proc.kill` would error, as the `pid` to-be-killed can not be found.
    if (this.proc && this.proc.pid && pidExists(this.proc.pid)) {
      const proc = this.proc;
      try {
        if (process.platform === 'win32') {
          childProcess.exec(`taskkill /pid ${this.proc.pid} /T /F`, error => {
            if (error) {
              // taskkill can fail to kill the process e.g. due to missing permissions.
              // Let's kill the process via Node API. This delays killing of all child
              // processes of `this.proc` until the main Node.js process dies.
              proc.kill();
            }
          });
        } else {
          // on linux the process group can be killed with the group id prefixed with
          // a minus sign. The process group id is the group leader's pid.
          const processGroupId = -this.proc.pid;

          try {
            process.kill(processGroupId, 'SIGKILL');
          } catch (error) {
            // Killing the process group can fail due e.g. to missing permissions.
            // Let's kill the process via Node API. This delays killing of all child
            // processes of `this.proc` until the main Node.js process dies.
            proc.kill('SIGKILL');
          }
        }
      } catch (error) {
        throw new Error(
          `${PROCESS_ERROR_EXPLANATION}\nError cause: ${
            isErrorLike(error) ? error.stack : error
          }`
        );
      }
    }

    // Attempt to remove temporary profile directory to avoid littering.
    try {
      if (this.#isTempUserDataDir) {
        removeFolder.sync(this.#userDataDir);
      }
    } catch (error) {}

    // Cleanup this listener last, as that makes sure the full callback runs. If we
    // perform this earlier, then the previous function calls would not happen.
    removeEventListeners(this.#listeners);
  }

  async setupConnection(options: {
    usePipe?: boolean;
    timeout: number;
    slowMo: number;
    preferredRevision: string;
  }): Promise<Connection> {
    assert(this.proc, 'BrowserRunner not started.');

    const {usePipe, timeout, slowMo, preferredRevision} = options;
    if (!usePipe) {
      const browserWSEndpoint = await waitForWSEndpoint(
        this.proc,
        timeout,
        preferredRevision
      );
      const transport = await WebSocketTransport.create(browserWSEndpoint);
      this.connection = new Connection(browserWSEndpoint, transport, slowMo);
    } else {
      // stdio was assigned during start(), and the 'pipe' option there adds the
      // 4th and 5th items to stdio array
      const {3: pipeWrite, 4: pipeRead} = this.proc.stdio;
      const transport = new PipeTransport(
        pipeWrite as NodeJS.WritableStream,
        pipeRead as NodeJS.ReadableStream
      );
      this.connection = new Connection('', transport, slowMo);
    }
    return this.connection;
  }
}

function waitForWSEndpoint(
  browserProcess: childProcess.ChildProcess,
  timeout: number,
  preferredRevision: string
): Promise<string> {
  assert(browserProcess.stderr, '`browserProcess` does not have stderr.');
  const rl = readline.createInterface(browserProcess.stderr);
  let stderr = '';

  return new Promise((resolve, reject) => {
    const listeners = [
      addEventListener(rl, 'line', onLine),
      addEventListener(rl, 'close', () => {
        return onClose();
      }),
      addEventListener(browserProcess, 'exit', () => {
        return onClose();
      }),
      addEventListener(browserProcess, 'error', error => {
        return onClose(error);
      }),
    ];
    const timeoutId = timeout ? setTimeout(onTimeout, timeout) : 0;

    function onClose(error?: Error): void {
      cleanup();
      reject(
        new Error(
          [
            'Failed to launch the browser process!' +
              (error ? ' ' + error.message : ''),
            stderr,
            '',
            'TROUBLESHOOTING: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md',
            '',
          ].join('\n')
        )
      );
    }

    function onTimeout(): void {
      cleanup();
      reject(
        new TimeoutError(
          `Timed out after ${timeout} ms while trying to connect to the browser! Only Chrome at revision r${preferredRevision} is guaranteed to work.`
        )
      );
    }

    function onLine(line: string): void {
      stderr += line + '\n';
      const match = line.match(/^DevTools listening on (ws:\/\/.*)$/);
      if (!match) {
        return;
      }
      cleanup();
      // The RegExp matches, so this will obviously exist.
      resolve(match[1]!);
    }

    function cleanup(): void {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      removeEventListeners(listeners);
    }
  });
}

function pidExists(pid: number): boolean {
  try {
    return process.kill(pid, 0);
  } catch (error) {
    if (isErrnoException(error)) {
      if (error.code && error.code === 'ESRCH') {
        return false;
      }
    }
    throw error;
  }
}
