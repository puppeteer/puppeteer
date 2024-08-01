/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BrowserPlatform} from '@puppeteer/browsers';
import {
  install,
  Browser,
  resolveBuildId,
  makeProgressCallback,
  detectBrowserPlatform,
} from '@puppeteer/browsers';
import {PUPPETEER_REVISIONS} from 'puppeteer-core/internal/revisions.js';

import {getConfiguration} from '../getConfiguration.js';

async function downloadBrowser({
  browser,
  cacheDir,
  platform,
  buildId,
  baseUrl,
  buildIdAlias,
}: {
  browser: Browser;
  baseUrl?: string;
  buildId: string;
  platform: BrowserPlatform;
  cacheDir: string;
  buildIdAlias: string | undefined;
}) {
  try {
    const result = await install({
      browser,
      cacheDir,
      platform,
      buildId,
      downloadProgressCallback: makeProgressCallback(browser, buildId),
      baseUrl,
      buildIdAlias,
    });
    logPolitely(`${browser} (${result.buildId}) downloaded to ${result.path}`);
  } catch (error) {
    throw new Error(
      `ERROR: Failed to set up ${browser} v${buildId}! Set "PUPPETEER_SKIP_DOWNLOAD" env variable to skip download.`,
      {
        cause: error,
      }
    );
  }
}

/**
 * @internal
 */
export async function downloadBrowsers(): Promise<void> {
  overrideProxy();

  const configuration = getConfiguration();
  if (configuration.skipDownload) {
    logPolitely('**INFO** Skipping downloading browsers as instructed.');
    return;
  }

  const platform = detectBrowserPlatform();
  if (!platform) {
    throw new Error('The current platform is not supported.');
  }
  const cacheDir = configuration.cacheDirectory!;

  const installationJobs = [];
  if (configuration.chrome?.skipDownload) {
    logPolitely('**INFO** Skipping Chrome download as instructed.');
  } else {
    const unresolvedBuildId =
      configuration.chrome?.version || PUPPETEER_REVISIONS.chrome || 'latest';
    const baseUrl = configuration.chrome?.downloadBaseUrl;

    const browser = Browser.CHROME;
    const buildId = await resolveBuildId(browser, platform, unresolvedBuildId);

    installationJobs.push(
      downloadBrowser({
        browser,
        cacheDir,
        platform,
        buildId,
        baseUrl,
        buildIdAlias:
          buildId !== unresolvedBuildId ? unresolvedBuildId : undefined,
      })
    );
  }

  if (configuration.chrome?.skipHeadlessShellDownload) {
    logPolitely('**INFO** Skipping Chrome download as instructed.');
  } else {
    const unresolvedBuildId =
      configuration.chrome?.version ||
      PUPPETEER_REVISIONS['chrome-headless-shell'] ||
      'latest';
    const browser = Browser.CHROMEHEADLESSSHELL;
    const baseUrl = configuration.chrome?.downloadBaseUrl;
    const buildId = await resolveBuildId(browser, platform, unresolvedBuildId);

    installationJobs.push(
      downloadBrowser({
        browser,
        cacheDir,
        platform,
        buildId,
        baseUrl,
        buildIdAlias:
          buildId !== unresolvedBuildId ? unresolvedBuildId : undefined,
      })
    );
  }

  if (configuration.firefox?.skipDownload) {
    logPolitely('**INFO** Skipping Firefox download as instructed.');
  } else {
    const unresolvedBuildId =
      configuration.firefox?.version || PUPPETEER_REVISIONS.firefox || 'latest';
    const browser = Browser.FIREFOX;
    const baseUrl = configuration.firefox?.downloadBaseUrl;
    const buildId = await resolveBuildId(browser, platform, unresolvedBuildId);

    installationJobs.push(
      downloadBrowser({
        browser,
        cacheDir,
        platform,
        buildId,
        baseUrl,
        buildIdAlias:
          buildId !== unresolvedBuildId ? unresolvedBuildId : undefined,
      })
    );
  }

  try {
    await Promise.all(installationJobs);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
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
