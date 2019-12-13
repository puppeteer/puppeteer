/**
 * Copyright 2019 Google Inc. All rights reserved.
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

import { join } from 'path';
import { Puppeteer } from './Puppeteer';
import * as api from './api';
import * as errors from './Errors';
import { helper } from './helper';

for (const className in api) {
  // Puppeteer-web excludes certain classes from bundle, e.g. BrowserFetcher.
  if (typeof (api as Record<string, any>)[className] === 'function')
    helper.installAsyncStackHooks((api as Record<string, any>)[className]);
}

export * from './api';
export * from './protocol';
export * from './types';
export { errors };
export { devices } from './DeviceDescriptors';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');
const preferredRevision = packageJson.puppeteer.chromium_revision;
const isPuppeteerCore = packageJson.name === 'puppeteer-core';

const puppeteer = new Puppeteer(join(__dirname, '..'), preferredRevision, isPuppeteerCore);

// The introspection in `Helper.installAsyncStackHooks` references `Puppeteer._launcher`
// before the Puppeteer ctor is called, such that an invalid Launcher is selected at import,
// so we reset it.
puppeteer._lazyLauncher = undefined;

export default puppeteer;
export const launch = puppeteer.launch;
export const connect = puppeteer.connect;
export const executablePath = puppeteer.executablePath;
export const product = puppeteer.product;
export const defaultArgs = puppeteer.defaultArgs;
export const createBrowserFetcher = puppeteer.createBrowserFetcher;
