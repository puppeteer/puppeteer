/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Installs the latest Chrome Canary using
 * `@puppeteer/browsers` to the directory provided as the first argument
 * (default: cwd). The executable path is written to the `executablePath` output
 * param for GitHub actions.
 *
 * Examples:
 *
 * - `node tools/download_chrome_canary.mjs`
 * - `node tools/download_chrome_canary.mjs /tmp/cache`
 */
import actions from '@actions/core';
import {
  Browser,
  computeExecutablePath,
  install,
  resolveBuildId,
  detectBrowserPlatform,
} from '@puppeteer/browsers';

try {
  const cacheDir = process.argv[2] || process.cwd();
  const browser = Browser.CHROME;
  const platform = detectBrowserPlatform();
  const buildId = await resolveBuildId(browser, platform, 'canary');
  await install({
    browser,
    buildId,
    cacheDir,
  });
  const executablePath = computeExecutablePath({
    cacheDir,
    browser,
    buildId,
  });
  if (process.argv.indexOf('--shell') === -1) {
    actions.setOutput('executablePath', executablePath);
  }
  console.log(executablePath);
} catch (err) {
  actions.setFailed(`Failed to download the browser: ${err.message}`);
}
