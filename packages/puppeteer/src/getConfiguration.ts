/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {homedir} from 'os';
import {join} from 'path';

import {cosmiconfigSync} from 'cosmiconfig';
import type {Configuration, SupportedBrowser} from 'puppeteer-core';

function getBooleanEnvVar(name: string): boolean | undefined {
  const env = process.env[name];
  if (env === undefined) {
    return;
  }
  switch (env.toLowerCase()) {
    case '':
    case '0':
    case 'false':
    case 'off':
      return false;
    default:
      return true;
  }
}

/**
 * @internal
 */
function isSupportedBrowser(product: unknown): product is SupportedBrowser {
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
function getDefaultBrowser(browser: unknown): SupportedBrowser {
  // Validate configuration.
  if (browser && !isSupportedBrowser(browser)) {
    throw new Error(`Unsupported browser ${browser}`);
  }
  switch (browser) {
    case 'firefox':
      return 'firefox';
    default:
      return 'chrome';
  }
}

/**
 * @internal
 */
function getLogLevel(logLevel: unknown): 'silent' | 'error' | 'warn' {
  switch (logLevel) {
    case 'silent':
      return 'silent';
    case 'error':
      return 'error';
    default:
      return 'warn';
  }
}

/**
 * @internal
 */
export const getConfiguration = (): Configuration => {
  const result = cosmiconfigSync('puppeteer', {
    searchStrategy: 'global',
  }).search();
  const configuration: Configuration = result ? result.config : {};

  if (!configuration.chrome) {
    configuration.chrome = {};
  }
  if (!configuration.firefox) {
    configuration.firefox = {
      skipDownload: true,
    };
  }

  configuration.logLevel = getLogLevel(
    process.env['PUPPETEER_LOGLEVEL'] ?? configuration.logLevel
  );

  // Merging environment variables.
  configuration.defaultBrowser = getDefaultBrowser(
    process.env['PUPPETEER_BROWSER'] ?? configuration.defaultBrowser
  );

  configuration.executablePath =
    process.env['PUPPETEER_EXECUTABLE_PATH'] ?? configuration.executablePath;

  // Default to skipDownload if executablePath is set
  if (configuration.executablePath) {
    configuration.skipDownload = true;
  }

  // Set skipDownload explicitly or from default
  configuration.skipDownload =
    getBooleanEnvVar('PUPPETEER_SKIP_DOWNLOAD') ?? configuration.skipDownload;

  // Prepare variables used in browser downloading
  if (!configuration.skipDownload) {
    configuration.chrome.version =
      process.env['PUPPETEER_CHROME_VERSION'] ?? configuration.chrome.version;
    configuration.chrome.downloadBaseUrl =
      process.env['PUPPETEER_CHROME_BASE_URL'] ??
      configuration.chrome.downloadBaseUrl;
    configuration.chrome.skipDownload =
      getBooleanEnvVar('PUPPETEER_CHROME_SKIP_DOWNLOAD') ??
      configuration.chrome.skipDownload;
    configuration.chrome.skipHeadlessShellDownload =
      getBooleanEnvVar('PUPPETEER_CHROME_SKIP_HEADLESS_SHELL_DOWNLOAD') ??
      configuration.chrome.skipHeadlessShellDownload;

    configuration.firefox.version =
      process.env['PUPPETEER_FIREFOX_VERSION'] ?? configuration.firefox.version;
    configuration.firefox.downloadBaseUrl =
      process.env['PUPPETEER_FIREFOX_BASE_URL'] ??
      configuration.firefox.downloadBaseUrl;
    configuration.firefox.skipDownload =
      getBooleanEnvVar('PUPPETEER_FIREFOX_SKIP_DOWNLOAD') ??
      configuration.firefox.skipDownload;
  }

  configuration.cacheDirectory =
    process.env['PUPPETEER_CACHE_DIR'] ??
    configuration.cacheDirectory ??
    join(homedir(), '.cache', 'puppeteer');

  configuration.temporaryDirectory =
    process.env['PUPPETEER_TMP_DIR'] ?? configuration.temporaryDirectory;

  configuration.experiments ??= {};

  return configuration;
};
