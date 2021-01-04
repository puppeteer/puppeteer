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

import { debug } from './Debug.ts';

import { assert } from './assert.ts';
import { helper, debugError } from './helper.ts';
import { LaunchOptions } from './LaunchOptions.ts';
import { Connection } from './Connection.ts';
import { WebSocketTransport } from './BrowserWebSocketTransport.ts';
import { TimeoutError } from './Errors.ts';
import { readLines } from 'https://deno.land/std@0.83.0/io/mod.ts';
const debugLauncher = debug('puppeteer:launcher');
const PROCESS_ERROR_EXPLANATION = `Puppeteer was unable to kill the process which ran the browser binary.
This means that, on future Puppeteer launches, Puppeteer might not be able to launch the browser.
Please check your open processes and ensure that the browser processes that Puppeteer launched have been killed.
If you think this is a bug, please report it on the Puppeteer issue tracker.`;

export class BrowserRunner {
  private _executablePath: string;
  private _processArguments: string[];
  private _tempDirectory?: string;

  proc: Deno.Process = null!;
  connection: Connection = null!;

  private _closed = true;
  private _listeners = [];
  private _processClosing: Promise<void> = null!;

  constructor(
    executablePath: string,
    processArguments: string[],
    tempDirectory?: string
  ) {
    this._executablePath = executablePath;
    this._processArguments = processArguments;
    this._tempDirectory = tempDirectory;
  }

  start(options: LaunchOptions): void {
    const { env } = options;
    // if (pipe) {
    //   if (dumpio) stdio = ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'];
    //   else stdio = ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'];
    // }
    assert(!this.proc, 'This process has previously been started.');
    debugLauncher(
      `Calling ${this._executablePath} ${this._processArguments.join(' ')}`
    );
    this.proc = Deno.run({
      cmd: [this._executablePath, ...this._processArguments],
      env,
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped',
    });

    // this._executablePath,
    //   this._processArguments,
    //   {
    //     // On non-windows platforms, `detached: true` makes child process a
    //     // leader of a new process group, making it possible to kill child
    //     // process tree with `.kill(-pid)` command. @see
    //     // https://nodejs.org/api/child_process.html#child_process_options_detached
    //     detached: isPosix,
    //     env,
    //     stdio,
    //   };
    // if (dumpio) {
    //   this.proc.stderr!.pipe(process.stderr);
    //   this.proc.stdout!.pipe(process.stdout);
    // }
    // Deno.Process;

    this._closed = false;
    // this._processClosing = new Promise((fulfill) => {
    //   this.proc.status();
    //   this.proc.once('exit', () => {
    //     this._closed = true;
    //     // Cleanup as processes exit.
    //     if (this._tempDirectory) {
    //       removeFolderAsync(this._tempDirectory)
    //         .then(() => fulfill())
    //         .catch((error) => console.error(error));
    //     } else {
    //       fulfill();
    //     }
    //   });
    // });
  }
  //   this._listeners = [
  //     addEventListener("")
  //     helper.addEventListener(process, 'exit', this.kill.bind(this)),
  //   ];
  //   if (handleSIGINT)
  //     this._listeners.push(
  //       helper.addEventListener(process, 'SIGINT', () => {
  //         this.kill();
  //         process.exit(130);
  //       })
  //     );
  //   if (handleSIGTERM)
  //     this._listeners.push(
  //       helper.addEventListener(process, 'SIGTERM', this.close.bind(this))
  //     );
  //   if (handleSIGHUP)
  //     this._listeners.push(
  //       helper.addEventListener(process, 'SIGHUP', this.close.bind(this))
  //     );
  // }

  async close(): Promise<void> {
    if (this._closed) return Promise.resolve();
    if (this._tempDirectory) {
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
      if (this._tempDirectory) {
        Deno.removeSync(this._tempDirectory);
      }
    } catch (error) {}

    // If the process failed to launch (for example if the browser executable path
    // is invalid), then the process does not get a pid assigned. A call to
    // `proc.kill` would error, as the `pid` to-be-killed can not be found.
    if (this.proc && this.proc.pid) {
      //TODO FIX IMMEDIATELY
      try {
        this.proc.close();
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
    const { timeout, slowMo, preferredRevision } = options;
    const browserWSEndpoint = await waitForWSEndpoint(
      this.proc,
      timeout,
      preferredRevision
    );
    const transport = await WebSocketTransport.create(browserWSEndpoint);
    this.connection = new Connection(browserWSEndpoint, transport, slowMo);
    return this.connection;
  }
}

async function waitForWSEndpoint(
  browserProcess: Deno.Process,
  timeout: number,
  preferredRevision: string
): Promise<string> {
  let timer = 0;

  const maybeEndpoint = await Promise.race([
    (async () => {
      let stderr = '';
      for await (const line of readLines(browserProcess.stderr!)) {
        stderr += line;
        const match = line.match(/^DevTools listening on (ws:\/\/.*)$/);
        if (match) {
          return match[1];
        }
      }
      throw new Error(
        [
          'Failed to launch the browser process!' + stderr,
          '',
          'TROUBLESHOOTING: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md',
          '',
        ].join('\n')
      );
    })(),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, timeout);
    }),
  ]);
  if (timer) clearTimeout(timer);
  if (maybeEndpoint) return maybeEndpoint;

  throw new Error(
    `Timed out after ${timeout} ms while trying to connect to the browser! Only Chrome at revision r${preferredRevision} is guaranteed to work.`
  );
}
