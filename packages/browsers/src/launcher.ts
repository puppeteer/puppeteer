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

import {
  Browser,
  BrowserPlatform,
  executablePathByBrowser,
} from './browsers/browsers.js';
import {detectPlatform} from './detectPlatform.js';
import os from 'os';

/**
 * @public
 */
export interface Options {
  /**
   * Root path to the storage directory.
   */
  path: string;
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
  options.platform ??= detectPlatform();
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`
    );
  }
  return executablePathByBrowser[options.browser](
    options.platform,
    options.revision,
    options.path
  );
}
