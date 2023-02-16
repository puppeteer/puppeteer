/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import childProcess from 'child_process';
import os from 'os';
import path from 'path';

import {
  Browser,
  BrowserPlatform,
  executablePathByBrowser,
} from './browsers/browsers.js';
import {CacheStructure} from './CacheStructure.js';
import {debug} from './debug.js';
import {detectBrowserPlatform} from './detectPlatform.js';

const debugLaunch = debug('puppeteer:browsers:launcher');

/**
 * @public
 */
export interface Options {
  /**
   * Root path to the storage directory.
   */
  cacheDir: string;
  /**
   * Determines which platform the browser will be suited for.
   *
   * @defaultValue Auto-detected.
   */
  platform?: BrowserPlatform;
  /**
   * Determines which browser to fetch.
   */
  browser: Browser;
  /**
   * Determines which revision to dowloand. Revision should uniquely identify
   * binaries and they are used for caching.
   */
  revision: string;
}

export function computeExecutablePath(options: Options): string {
  options.platform ??= detectBrowserPlatform();
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`
    );
  }
  const installationDir = new CacheStructure(options.cacheDir).installationDir(
    options.browser,
    options.platform,
    options.revision
  );
  return path.join(
    installationDir,
    executablePathByBrowser[options.browser](options.platform, options.revision)
  );
}

type LaunchOptions = {
  executablePath: string;
  pipe?: boolean;
  dumpio?: boolean;
  args?: string[];
  env?: Record<string, string>;
  handleSIGINT?: boolean;
  handleSIGTERM?: boolean;
  handleSIGHUP?: boolean;
  detached?: boolean;
};

export function launch(opts: LaunchOptions): Process {
  return new Process(opts);
}

class Process {
  #executablePath;
  #args: string[];
  #browserProcess: childProcess.ChildProcess;
  #exited = false;
  #browserProcessExiting: Promise<void>;

  constructor(opts: LaunchOptions) {
    this.#executablePath = opts.executablePath;
    this.#args = opts.args ?? [];

    opts.pipe ??= false;
    opts.dumpio ??= false;
    opts.handleSIGINT ??= true;
    opts.handleSIGTERM ??= true;
    opts.handleSIGHUP ??= true;
    opts.detached ??= true;

    const stdio = this.#configureStdio({
      pipe: opts.pipe,
      dumpio: opts.dumpio,
    });

    debugLaunch(`Launching ${this.#executablePath} ${this.#args.join(' ')}`);

    this.#browserProcess = childProcess.spawn(
      this.#executablePath,
      this.#args,
      {
        // On non-windows platforms, `detached: true` makes child process a
        // leader of a new process group, making it possible to kill child
        // process tree with `.kill(-pid)` command. @see
        // https://nodejs.org/api/child_process.html#child_process_options_detached
        detached: opts.detached,
        env: opts.env,
        stdio,
      }
    );
    if (opts.dumpio) {
      this.#browserProcess.stderr?.pipe(process.stderr);
      this.#browserProcess.stdout?.pipe(process.stdout);
    }
    process.on('exit', this.#onDriverProcessExit);
    if (opts.handleSIGINT) {
      process.on('SIGINT', this.#onDriverProcessSignal);
    }
    if (opts.handleSIGTERM) {
      process.on('SIGTERM', this.#onDriverProcessSignal);
    }
    if (opts.handleSIGHUP) {
      process.on('SIGHUP', this.#onDriverProcessSignal);
    }
    this.#browserProcessExiting = new Promise(resolve => {
      this.#browserProcess.once('exit', () => {
        this.#exited = true;
        this.#clearListeners();
        resolve();
      });
    });
  }

  #configureStdio(opts: {
    pipe: boolean;
    dumpio: boolean;
  }): Array<'ignore' | 'pipe'> {
    if (opts.pipe) {
      if (opts.dumpio) {
        return ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'];
      } else {
        return ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'];
      }
    } else {
      if (opts.dumpio) {
        return ['pipe', 'pipe', 'pipe'];
      } else {
        return ['pipe', 'ignore', 'pipe'];
      }
    }
  }

  #clearListeners(): void {
    process.off('exit', this.#onDriverProcessExit);
    process.off('SIGINT', this.#onDriverProcessSignal);
    process.off('SIGTERM', this.#onDriverProcessSignal);
    process.off('SIGHUP', this.#onDriverProcessSignal);
  }

  #onDriverProcessExit = (_code: number) => {
    this.kill();
  };

  #onDriverProcessSignal = (signal: string): void => {
    switch (signal) {
      case 'SIGINT':
        this.kill();
        process.exit(130);
      case 'SIGTERM':
      case 'SIGUP':
        this.kill();
        break;
    }
  };

  close(): Promise<void> {
    if (this.#exited) {
      return Promise.resolve();
    }
    this.kill();
    return this.#browserProcessExiting;
  }

  kill(): void {
    // If the process failed to launch (for example if the browser executable path
    // is invalid), then the process does not get a pid assigned. A call to
    // `proc.kill` would error, as the `pid` to-be-killed can not be found.
    if (
      this.#browserProcess &&
      this.#browserProcess.pid &&
      pidExists(this.#browserProcess.pid)
    ) {
      try {
        if (process.platform === 'win32') {
          childProcess.exec(
            `taskkill /pid ${this.#browserProcess.pid} /T /F`,
            error => {
              if (error) {
                // taskkill can fail to kill the process e.g. due to missing permissions.
                // Let's kill the process via Node API. This delays killing of all child
                // processes of `this.proc` until the main Node.js process dies.
                this.#browserProcess.kill();
              }
            }
          );
        } else {
          // on linux the process group can be killed with the group id prefixed with
          // a minus sign. The process group id is the group leader's pid.
          const processGroupId = -this.#browserProcess.pid;

          try {
            process.kill(processGroupId, 'SIGKILL');
          } catch (error) {
            // Killing the process group can fail due e.g. to missing permissions.
            // Let's kill the process via Node API. This delays killing of all child
            // processes of `this.proc` until the main Node.js process dies.
            this.#browserProcess.kill('SIGKILL');
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
    this.#clearListeners();
  }
}

const PROCESS_ERROR_EXPLANATION = `Puppeteer was unable to kill the process which ran the browser binary.
This means that, on future Puppeteer launches, Puppeteer might not be able to launch the browser.
Please check your open processes and ensure that the browser processes that Puppeteer launched have been killed.
If you think this is a bug, please report it on the Puppeteer issue tracker.`;

/**
 * @internal
 */
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

/**
 * @internal
 */
export interface ErrorLike extends Error {
  name: string;
  message: string;
}

/**
 * @internal
 */
export function isErrorLike(obj: unknown): obj is ErrorLike {
  return (
    typeof obj === 'object' && obj !== null && 'name' in obj && 'message' in obj
  );
}
/**
 * @internal
 */
export function isErrnoException(obj: unknown): obj is NodeJS.ErrnoException {
  return (
    isErrorLike(obj) &&
    ('errno' in obj || 'code' in obj || 'path' in obj || 'syscall' in obj)
  );
}
