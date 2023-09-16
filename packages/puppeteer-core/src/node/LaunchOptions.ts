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

import {type BrowserConnectOptions} from '../cdp/BrowserConnector.js';
import {type Product} from '../common/Product.js';

/**
 * Launcher options that only apply to Chrome.
 *
 * @public
 */
export interface BrowserLaunchArgumentOptions {
  /**
   * Whether to run the browser in headless mode.
   *
   * @remarks
   * In the future `headless: true` will be equivalent to `headless: 'new'`.
   * You can read more about the change {@link https://developer.chrome.com/articles/new-headless/ | here}.
   * Consider opting in early by setting the value to `"new"`.
   *
   * @defaultValue `true`
   */
  headless?: boolean | 'new';
  /**
   * Path to a user data directory.
   * {@link https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/user_data_dir.md | see the Chromium docs}
   * for more info.
   */
  userDataDir?: string;
  /**
   * Whether to auto-open a DevTools panel for each tab. If this is set to
   * `true`, then `headless` will be forced to `false`.
   * @defaultValue `false`
   */
  devtools?: boolean;
  /**
   * Specify the debugging port number to use
   */
  debuggingPort?: number;
  /**
   * Additional command line arguments to pass to the browser instance.
   */
  args?: string[];
}
/**
 * @public
 */
export type ChromeReleaseChannel =
  | 'chrome'
  | 'chrome-beta'
  | 'chrome-canary'
  | 'chrome-dev';

/**
 * Generic launch options that can be passed when launching any browser.
 * @public
 */
export interface LaunchOptions {
  /**
   * Chrome Release Channel
   */
  channel?: ChromeReleaseChannel;
  /**
   * Path to a browser executable to use instead of the bundled Chromium. Note
   * that Puppeteer is only guaranteed to work with the bundled Chromium, so use
   * this setting at your own risk.
   */
  executablePath?: string;
  /**
   * If `true`, do not use `puppeteer.defaultArgs()` when creating a browser. If
   * an array is provided, these args will be filtered out. Use this with care -
   * you probably want the default arguments Puppeteer uses.
   * @defaultValue `false`
   */
  ignoreDefaultArgs?: boolean | string[];
  /**
   * Close the browser process on `Ctrl+C`.
   * @defaultValue `true`
   */
  handleSIGINT?: boolean;
  /**
   * Close the browser process on `SIGTERM`.
   * @defaultValue `true`
   */
  handleSIGTERM?: boolean;
  /**
   * Close the browser process on `SIGHUP`.
   * @defaultValue `true`
   */
  handleSIGHUP?: boolean;
  /**
   * Maximum time in milliseconds to wait for the browser to start.
   * Pass `0` to disable the timeout.
   * @defaultValue `30_000` (30 seconds).
   */
  timeout?: number;
  /**
   * If true, pipes the browser process stdout and stderr to `process.stdout`
   * and `process.stderr`.
   * @defaultValue `false`
   */
  dumpio?: boolean;
  /**
   * Specify environment variables that will be visible to the browser.
   * @defaultValue The contents of `process.env`.
   */
  env?: Record<string, string | undefined>;
  /**
   * Connect to a browser over a pipe instead of a WebSocket.
   * @defaultValue `false`
   */
  pipe?: boolean;
  /**
   * Which browser to launch.
   * @defaultValue `chrome`
   */
  product?: Product;
  /**
   * {@link https://searchfox.org/mozilla-release/source/modules/libpref/init/all.js | Additional preferences } that can be passed when launching with Firefox.
   */
  extraPrefsFirefox?: Record<string, unknown>;
  /**
   * Whether to wait for the initial page to be ready.
   * Useful when a user explicitly disables that (e.g. `--no-startup-window` for Chrome).
   * @defaultValue `true`
   */
  waitForInitialPage?: boolean;
}

/**
 * Utility type exposed to enable users to define options that can be passed to
 * `puppeteer.launch` without having to list the set of all types.
 * @public
 */
export type PuppeteerNodeLaunchOptions = BrowserLaunchArgumentOptions &
  LaunchOptions &
  BrowserConnectOptions;
