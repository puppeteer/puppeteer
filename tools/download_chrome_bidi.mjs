/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

/**
 * @fileoverview Installs a browser defined in `.browser` for Chromium-BiDi using
 * `@puppeteer/browsers` to the directory provided as the first argument
 * (default: cwd). The executable path is written to the `executablePath` output
 * param for GitHub actions.
 *
 * Examples:
 *
 * - `node install-browser.mjs`
 * - `node install-browser.mjs /tmp/cache`
 */
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

import actions from '@actions/core';

import {computeExecutablePath, install} from '@puppeteer/browsers';

const require = createRequire(import.meta.url);

try {
  const browserSpec = await readFile(
    require.resolve('chromium-bidi/.browser', {
      paths: [require.resolve('puppeteer-core')],
    }),
    'utf-8'
  );
  const cacheDir = process.argv[2] || process.cwd();
  // See .browser for the format.
  const browser = browserSpec.split('@')[0];
  const buildId = browserSpec.split('@')[1];
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
