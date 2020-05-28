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

import { helper } from './helper';
import { Page } from './Page';
import { Puppeteer } from './Puppeteer';

const packageJson = require('../package.json');
const api = require('./api');

for (const className in api) {
  if (typeof api[className] === 'function')
    helper.installAsyncStackHooks(api[className]);
}

// Expose alias for deprecated method.
// @ts-expect-error
Page.prototype.emulateMedia = Page.prototype.emulateMediaType;

let preferredRevision = packageJson.puppeteer.chromium_revision;
const isPuppeteerCore = packageJson.name === 'puppeteer-core';
// puppeteer-core ignores environment variables
const product = isPuppeteerCore
  ? undefined
  : process.env.PUPPETEER_PRODUCT ||
    process.env.npm_config_puppeteer_product ||
    process.env.npm_package_config_puppeteer_product;
if (!isPuppeteerCore && product === 'firefox')
  preferredRevision = packageJson.puppeteer.firefox_revision;

/**
 * The main export for Puppeteer
 * @public
 */
const puppeteer = new Puppeteer(
  __dirname,
  preferredRevision,
  isPuppeteerCore,
  product
);

// The introspection in `Helper.installAsyncStackHooks` references `Puppeteer._launcher`
// before the Puppeteer ctor is called, such that an invalid Launcher is selected at import,
// so we reset it.
puppeteer._lazyLauncher = undefined;

export { Puppeteer };

export default puppeteer;
