/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {Product} from './Product.js';

/**
 * Defines experiment options for Puppeteer.
 *
 * See individual properties for more information.
 *
 * @public
 */
export type ExperimentsConfiguration = Record<string, never>;

/**
 * Defines options to configure Puppeteer's behavior during installation and
 * runtime.
 *
 * See individual properties for more information.
 *
 * @public
 */
export interface Configuration {
  /**
   * Specifies a certain version of the browser you'd like Puppeteer to use.
   *
   * Can be overridden by `PUPPETEER_BROWSER_REVISION`.
   *
   * See {@link PuppeteerNode.launch | puppeteer.launch} on how executable path
   * is inferred.
   *
   * @defaultValue A compatible-revision of the browser.
   */
  browserRevision?: string;
  /**
   * Defines the directory to be used by Puppeteer for caching.
   *
   * Can be overridden by `PUPPETEER_CACHE_DIR`.
   *
   * @defaultValue `path.join(os.homedir(), '.cache', 'puppeteer')`
   */
  cacheDirectory?: string;
  /**
   * Specifies the URL prefix that is used to download the browser.
   *
   * Can be overridden by `PUPPETEER_DOWNLOAD_BASE_URL`.
   *
   * @remarks
   * This must include the protocol and may even need a path prefix.
   *
   * @defaultValue Either https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing or
   * https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central,
   * depending on the product.
   */
  downloadBaseUrl?: string;
  /**
   * Specifies the path for the downloads folder.
   *
   * Can be overridden by `PUPPETEER_DOWNLOAD_PATH`.
   *
   * @defaultValue `<cacheDirectory>`
   */
  downloadPath?: string;
  /**
   * Specifies an executable path to be used in
   * {@link PuppeteerNode.launch | puppeteer.launch}.
   *
   * Can be overridden by `PUPPETEER_EXECUTABLE_PATH`.
   *
   * @defaultValue **Auto-computed.**
   */
  executablePath?: string;
  /**
   * Specifies which browser you'd like Puppeteer to use.
   *
   * Can be overridden by `PUPPETEER_PRODUCT`.
   *
   * @defaultValue `chrome`
   */
  defaultProduct?: Product;
  /**
   * Defines the directory to be used by Puppeteer for creating temporary files.
   *
   * Can be overridden by `PUPPETEER_TMP_DIR`.
   *
   * @defaultValue `os.tmpdir()`
   */
  temporaryDirectory?: string;
  /**
   * Tells Puppeteer to not download during installation.
   *
   * Can be overridden by `PUPPETEER_SKIP_DOWNLOAD`.
   */
  skipDownload?: boolean;
  /**
   * Tells Puppeteer to log at the given level.
   *
   * @defaultValue `warn`
   */
  logLevel?: 'silent' | 'error' | 'warn';
  /**
   * Defines experimental options for Puppeteer.
   */
  experiments?: ExperimentsConfiguration;
}
