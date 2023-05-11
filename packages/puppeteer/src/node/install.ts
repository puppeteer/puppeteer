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

import {
  install,
  Browser,
  resolveBuildId,
  makeProgressCallback,
  detectBrowserPlatform,
} from '@puppeteer/browsers';
import {Product} from 'puppeteer-core';
import {PUPPETEER_REVISIONS} from 'puppeteer-core/internal/revisions.js';

import {getConfiguration} from '../getConfiguration.js';

/**
 * @internal
 */
const supportedProducts = {
  chrome: 'Chrome',
  firefox: 'Firefox Nightly',
} as const;

/**
 * @internal
 */
export async function downloadBrowser(): Promise<void> {
  overrideProxy();

  const configuration = getConfiguration();
  if (configuration.skipDownload) {
    logPolitely('**INFO** Skipping browser download as instructed.');
    return;
  }

  const downloadBaseUrl = configuration.downloadBaseUrl;

  const platform = detectBrowserPlatform();
  if (!platform) {
    throw new Error('The current platform is not supported.');
  }

  const product = configuration.defaultProduct!;
  const browser = productToBrowser(product);

  const unresolvedBuildId =
    configuration.browserRevision || PUPPETEER_REVISIONS[product] || 'latest';

  const buildId = await resolveBuildId(browser, platform, unresolvedBuildId);
  // TODO: deprecate downloadPath in favour of cacheDirectory.
  const cacheDir = configuration.downloadPath ?? configuration.cacheDirectory!;

  try {
    const result = await install({
      browser,
      cacheDir,
      platform,
      buildId,
      downloadProgressCallback: makeProgressCallback(browser, buildId),
      baseUrl: downloadBaseUrl,
    });

    logPolitely(
      `${supportedProducts[product]} (${result.buildId}) downloaded to ${result.path}`
    );
  } catch (error) {
    console.error(
      `ERROR: Failed to set up ${supportedProducts[product]} r${buildId}! Set "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.`
    );
    console.error(error);
    process.exit(1);
  }
}

function productToBrowser(product?: Product) {
  switch (product) {
    case 'chrome':
      return Browser.CHROME;
    case 'firefox':
      return Browser.FIREFOX;
  }
  return Browser.CHROME;
}

/**
 * @internal
 */
function logPolitely(toBeLogged: unknown): void {
  const logLevel = process.env['npm_config_loglevel'] || '';
  const logLevelDisplay = ['silent', 'error', 'warn'].indexOf(logLevel) > -1;

  // eslint-disable-next-line no-console
  if (!logLevelDisplay) {
    console.log(toBeLogged);
  }
}

/**
 * @internal
 */
function overrideProxy() {
  // Override current environment proxy settings with npm configuration, if any.
  const NPM_HTTPS_PROXY =
    process.env['npm_config_https_proxy'] || process.env['npm_config_proxy'];
  const NPM_HTTP_PROXY =
    process.env['npm_config_http_proxy'] || process.env['npm_config_proxy'];
  const NPM_NO_PROXY = process.env['npm_config_no_proxy'];

  if (NPM_HTTPS_PROXY) {
    process.env['HTTPS_PROXY'] = NPM_HTTPS_PROXY;
  }
  if (NPM_HTTP_PROXY) {
    process.env['HTTP_PROXY'] = NPM_HTTP_PROXY;
  }
  if (NPM_NO_PROXY) {
    process.env['NO_PROXY'] = NPM_NO_PROXY;
  }
}
