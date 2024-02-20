/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  install,
  Browser,
  resolveBuildId,
  makeProgressCallback,
  detectBrowserPlatform,
} from '@puppeteer/browsers';
import type {Product} from 'puppeteer-core';
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
  const unresolvedShellBuildId =
    configuration.browserRevision ||
    PUPPETEER_REVISIONS['chrome-headless-shell'] ||
    'latest';

  const cacheDir = configuration.cacheDirectory!;

  try {
    const installationJobs = [];

    if (configuration.skipChromeDownload) {
      logPolitely('**INFO** Skipping Chrome download as instructed.');
    } else {
      const buildId = await resolveBuildId(
        browser,
        platform,
        unresolvedBuildId
      );
      installationJobs.push(
        install({
          browser,
          cacheDir,
          platform,
          buildId,
          downloadProgressCallback: makeProgressCallback(browser, buildId),
          baseUrl: downloadBaseUrl,
          buildIdAlias:
            buildId !== unresolvedBuildId ? unresolvedBuildId : undefined,
        })
          .then(result => {
            logPolitely(
              `${supportedProducts[product]} (${result.buildId}) downloaded to ${result.path}`
            );
          })
          .catch(error => {
            throw new Error(
              `ERROR: Failed to set up ${supportedProducts[product]} v${buildId}! Set "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.`,
              {
                cause: error,
              }
            );
          })
      );
    }

    if (browser === Browser.CHROME) {
      if (configuration.skipChromeHeadlessShellDownload) {
        logPolitely('**INFO** Skipping Chrome download as instructed.');
      } else {
        const shellBuildId = await resolveBuildId(
          browser,
          platform,
          unresolvedShellBuildId
        );

        installationJobs.push(
          install({
            browser: Browser.CHROMEHEADLESSSHELL,
            cacheDir,
            platform,
            buildId: shellBuildId,
            downloadProgressCallback: makeProgressCallback(
              browser,
              shellBuildId
            ),
            baseUrl: downloadBaseUrl,
            buildIdAlias:
              shellBuildId !== unresolvedShellBuildId
                ? unresolvedShellBuildId
                : undefined,
          })
            .then(result => {
              logPolitely(
                `${Browser.CHROMEHEADLESSSHELL} (${result.buildId}) downloaded to ${result.path}`
              );
            })
            .catch(error => {
              throw new Error(
                `ERROR: Failed to set up ${Browser.CHROMEHEADLESSSHELL} v${shellBuildId}! Set "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.`,
                {
                  cause: error,
                }
              );
            })
        );
      }
    }

    await Promise.all(installationJobs);
  } catch (error) {
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
