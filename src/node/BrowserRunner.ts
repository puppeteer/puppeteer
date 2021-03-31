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

import { debug } from '../common/Debug.js';

import removeFolder from 'rimraf';
import * as childProcess from 'child_process';
import { assert } from '../common/assert.js';
import { helper, debugError } from '../common/helper.js';
import { LaunchOptions } from './LaunchOptions.js';
import { Connection } from '../common/Connection.js';
import { NodeWebSocketTransport as WebSocketTransport } from '../node/NodeWebSocketTransport.js';
import { PipeTransport } from './PipeTransport.js';
import { Product } from '../common/Product.js';
import * as readline from 'readline';
import { TimeoutError } from '../common/Errors.js';
import { promisify } from 'util';

const removeFolderAsync = promisify(removeFolder);
const debugLauncher = debug('puppeteer:launcher');
const PROCESS_ERROR_EXPLANATION = `Puppeteer was unable to kill the process which ran the browser binary.
This means that, on future Puppeteer launches, Puppeteer might not be able to launch the browser.
Please check your open processes and ensure that the browser processes that Puppeteer launched have been killed.
If you think this is a bug, please report it on the Puppeteer issue tracker.`;

export class BrowserRunner {
  private _product: Product;
  private _executablePath: string;
  private _processArguments: string[];
  private _tempDirectory?: string;

  proc = null;
  connection = null;

  private _closed = true;
  private _listeners = [];
  private _processClosing: Promise<void>;

  constructor(
    product: Product,
    executablePath: string,
    processArguments: string[],
    tempDirectory?: string
  ) {
    this._product = product;
    this._executablePath = executablePath;
    this._processArguments = processArguments;
    this._tempDirectory = tempDirectory;
  }

  start(options: LaunchOptions): void {
    const {
      handleSIGINT,
      handleSIGTERM,
      handleSIGHUP,
      dumpio,
      env,
      pipe,
    } = options;
    let stdio: Array<'ignore' | 'pipe'> = ['pipe', 'pipe', 'pipe'];
    if (pipe) {
      if (dumpio) stdio = ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'];
      else stdio = ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'];
    }
    assert(!this.proc, 'This process has previously been started.');
    debugLauncher(
      `Calling ${this._executablePath} ${this._processArguments.join(' ')}`
    );
    this.proc = childProcess.spawn(
      this._executablePath,
      this._processArguments,
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
      this.proc.stderr.pipe(process.stderr);
      this.proc.stdout.pipe(process.stdout);
    }
    this._closed = false;
    this._processClosing = new Promise((fulfill) => {
      this.proc.once('exit', () => {
        this._closed = true;
        // Cleanup as processes exit.
        if (this._tempDirectory) {
          removeFolderAsync(this._tempDirectory)
            .then(() => fulfill())
            .catch((error) => console.error(error));
        } else {
          fulfill();
        }
      });
    });
    this._listeners = [
      helper.addEventListener(process, 'exit', this.kill.bind(this)),
    ];
    if (handleSIGINT)
      this._listeners.push(
        helper.addEventListener(process, 'SIGINT', () => {
          this.kill();
          process.exit(130);
        })
      );
    if (handleSIGTERM)
      this._listeners.push(
        helper.addEventListener(process, 'SIGTERM', this.close.bind(this))
      );
    if (handleSIGHUP)
      this._listeners.push(
        helper.addEventListener(process, 'SIGHUP', this.close.bind(this))
      );
  }

  close(): Promise<void> {
    if (this._closed) return Promise.resolve();
    if (this._tempDirectory && this._product !== 'firefox') {
      this.kill();
    } else if (this.connection) {
      // Attempt to close the browser gracefully
      this.connection.send('Browser.close').catch((error) => {
        debugError(error);
        this.kill();
      });
    }
    // Cleanup this listener last, as that makes sure the full callback runs. If we
    // perform this earlier, then the previous function calls would not happen.
    helper.removeEventListeners(this._listeners);
    return this._processClosing;
  }

  kill(): void {
    // Attempt to remove temporary profile directory to avoid littering.
    try {
      removeFolder.sync(this._tempDirectory);
    } catch (error) {}

    // If the process failed to launch (for example if the browser executable path
    // is invalid), then the process does not get a pid assigned. A call to
    // `proc.kill` would error, as the `pid` to-be-killed can not be found.
    if (this.proc && this.proc.pid && !this.proc.killed) {
      try {
        this.proc.kill('SIGKILL');
      } catch (error) {
        throw new Error(
          `${PROCESS_ERROR_EXPLANATION}\nError cause: ${error.stack}`
        );
      }
    }
    // Cleanup this listener last, as that makes sure the full callback runs. If we
    // perform this earlier, then the previous function calls would not happen.
    helper.removeEventListeners(this._listeners);
  }

  async setupConnection(options: {
    usePipe?: boolean;
    timeout: number;
    slowMo: number;
    preferredRevision: string;
  }): Promise<Connection> {
    const { usePipe, timeout, slowMo, preferredRevision } = options;
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
      const { 3: pipeWrite, 4: pipeRead } = this.proc.stdio;
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
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: browserProcess.stderr });
    let stderr = '';
    const listeners = [
      helper.addEventListener(rl, 'line', onLine),
      helper.addEventListener(rl, 'close', () => onClose()),
      helper.addEventListener(browserProcess, 'exit', () => onClose()),
      helper.addEventListener(browserProcess, 'error', (error) =>
        onClose(error)
      ),
    ];
    const timeoutId = timeout ? setTimeout(onTimeout, timeout) : 0;

    /**
     * @param {!Error=} error
     */
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
      if (!match) return;
      cleanup();
      resolve(match[1]);
    }

    function cleanup(): void {
      if (timeoutId) clearTimeout(timeoutId);
      helper.removeEventListeners(listeners);
    }
  });
}
