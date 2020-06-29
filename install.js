/**
 * Copyright 2017 Google Inc. All rights reserved.
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
 * This file is part of public API.
 *
 * By default, the `puppeteer` package runs this script during the installation
 * process unless one of the env flags is provided.
 * `puppeteer-core` package doesn't include this step at all. However, it's
 * still possible to install a supported browser using this script when
 * necessary.
 */

const compileTypeScriptIfRequired = require('./typescript-if-required');

async function download() {
  await compileTypeScriptIfRequired();
  // need to ensure TS is compiled before loading the installer
  const { downloadBrowser, logPolitely } = require('./lib/cjs/install');

  if (process.env.PUPPETEER_SKIP_DOWNLOAD) {
    logPolitely(
      '**INFO** Skipping browser download. "PUPPETEER_SKIP_DOWNLOAD" environment variable was found.'
    );
    return;
  }
  if (
    process.env.NPM_CONFIG_PUPPETEER_SKIP_DOWNLOAD ||
    process.env.npm_config_puppeteer_skip_download
  ) {
    logPolitely(
      '**INFO** Skipping browser download. "PUPPETEER_SKIP_DOWNLOAD" was set in npm config.'
    );
    return;
  }
  if (
    process.env.NPM_PACKAGE_CONFIG_PUPPETEER_SKIP_DOWNLOAD ||
    process.env.npm_package_config_puppeteer_skip_download
  ) {
    logPolitely(
      '**INFO** Skipping browser download. "PUPPETEER_SKIP_DOWNLOAD" was set in project config.'
    );
    return;
  }
  if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD) {
    logPolitely(
      '**INFO** Skipping browser download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" environment variable was found.'
    );
    return;
  }
  if (
    process.env.NPM_CONFIG_PUPPETEER_SKIP_CHROMIUM_DOWNLOAD ||
    process.env.npm_config_puppeteer_skip_chromium_download
  ) {
    logPolitely(
      '**INFO** Skipping browser download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" was set in npm config.'
    );
    return;
  }
  if (
    process.env.NPM_PACKAGE_CONFIG_PUPPETEER_SKIP_CHROMIUM_DOWNLOAD ||
    process.env.npm_package_config_puppeteer_skip_chromium_download
  ) {
    logPolitely(
      '**INFO** Skipping browser download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" was set in project config.'
    );
    return;
  }

  downloadBrowser();
}

download();
