/* eslint-disable no-console */

/**
 * Copyright 2023 Google LLC.
 * Copyright (c) Microsoft Corporation.
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

/**
 * @fileoverview Installs a browser defined in `.browser` for Chromium-BiDi using
 * `@puppeteer/browsers` to the directory provided as the first argument
 * (default: cwd). The executable path is written to the `executablePath` output
 * param for GitHub actions.
 *
 * Examples:
 *  - `node install-browser.mjs`
 *  - `node install-browser.mjs /tmp/cache`
 */

import fs from 'fs/promises';

import actions from '@actions/core';
import {install, computeExecutablePath} from '@puppeteer/browsers';

try {
  const browserSpec = (
    await fs.readFile('node_modules/chromium-bidi/.browser', 'utf-8')
  ).trim();
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
