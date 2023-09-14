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

import {homedir} from 'os';
import {join} from 'path';

import {cosmiconfigSync} from 'cosmiconfig';
import {type Configuration, type Product} from 'puppeteer-core';

/**
 * @internal
 */
function isSupportedProduct(product: unknown): product is Product {
  switch (product) {
    case 'chrome':
    case 'firefox':
      return true;
    default:
      return false;
  }
}

/**
 * @internal
 */
export const getConfiguration = (): Configuration => {
  const result = cosmiconfigSync('puppeteer').search();
  const configuration: Configuration = result ? result.config : {};

  configuration.logLevel = (process.env['PUPPETEER_LOGLEVEL'] ??
    process.env['npm_config_LOGLEVEL'] ??
    process.env['npm_package_config_LOGLEVEL'] ??
    configuration.logLevel ??
    'warn') as 'silent' | 'error' | 'warn';

  // Merging environment variables.
  configuration.defaultProduct = (process.env['PUPPETEER_PRODUCT'] ??
    process.env['npm_config_puppeteer_product'] ??
    process.env['npm_package_config_puppeteer_product'] ??
    configuration.defaultProduct ??
    'chrome') as Product;

  configuration.executablePath =
    process.env['PUPPETEER_EXECUTABLE_PATH'] ??
    process.env['npm_config_puppeteer_executable_path'] ??
    process.env['npm_package_config_puppeteer_executable_path'] ??
    configuration.executablePath;

  // Default to skipDownload if executablePath is set
  if (configuration.executablePath) {
    configuration.skipDownload = true;
  }

  // Set skipDownload explicitly or from default
  configuration.skipDownload = Boolean(
    process.env['PUPPETEER_SKIP_DOWNLOAD'] ??
      process.env['npm_config_puppeteer_skip_download'] ??
      process.env['npm_package_config_puppeteer_skip_download'] ??
      configuration.skipDownload
  );

  // Prepare variables used in browser downloading
  if (!configuration.skipDownload) {
    configuration.browserRevision =
      process.env['PUPPETEER_BROWSER_REVISION'] ??
      process.env['npm_config_puppeteer_browser_revision'] ??
      process.env['npm_package_config_puppeteer_browser_revision'] ??
      configuration.browserRevision;

    const downloadHost =
      process.env['PUPPETEER_DOWNLOAD_HOST'] ??
      process.env['npm_config_puppeteer_download_host'] ??
      process.env['npm_package_config_puppeteer_download_host'];

    if (downloadHost && configuration.logLevel === 'warn') {
      console.warn(
        `PUPPETEER_DOWNLOAD_HOST is deprecated. Use PUPPETEER_DOWNLOAD_BASE_URL instead.`
      );
    }

    configuration.downloadBaseUrl =
      process.env['PUPPETEER_DOWNLOAD_BASE_URL'] ??
      process.env['npm_config_puppeteer_download_base_url'] ??
      process.env['npm_package_config_puppeteer_download_base_url'] ??
      configuration.downloadBaseUrl ??
      downloadHost;

    configuration.downloadPath =
      process.env['PUPPETEER_DOWNLOAD_PATH'] ??
      process.env['npm_config_puppeteer_download_path'] ??
      process.env['npm_package_config_puppeteer_download_path'] ??
      configuration.downloadPath;
  }

  configuration.cacheDirectory =
    process.env['PUPPETEER_CACHE_DIR'] ??
    process.env['npm_config_puppeteer_cache_dir'] ??
    process.env['npm_package_config_puppeteer_cache_dir'] ??
    configuration.cacheDirectory ??
    join(homedir(), '.cache', 'puppeteer');
  configuration.temporaryDirectory =
    process.env['PUPPETEER_TMP_DIR'] ??
    process.env['npm_config_puppeteer_tmp_dir'] ??
    process.env['npm_package_config_puppeteer_tmp_dir'] ??
    configuration.temporaryDirectory;

  configuration.experiments ??= {};

  // Validate configuration.
  if (!isSupportedProduct(configuration.defaultProduct)) {
    throw new Error(`Unsupported product ${configuration.defaultProduct}`);
  }

  return configuration;
};
