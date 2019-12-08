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

export * from './Accessibility';
export * from './Browser';
export * from './BrowserFetcher';
export * from './Connection';
export * from './Coverage';
export * from './DeviceDescriptors';
export * from './Dialog';
export * from './Errors';
export * from './ExecutionContext';
export * from './FrameManager';
export * from './Input';
export * from './JSHandle';
export * from './NetworkManager';
export * from './Page';
export * from './Puppeteer';
export * from './Target';
export * from './Tracing';
export * from './types';
export * from './Worker';

import { join } from 'path';
import { Puppeteer } from './Puppeteer';
import * as errors from './Errors';
import { LaunchOptions, ConnectOptions, ChromeArgOptions } from './types';
import { BrowserFetcherOptions } from './BrowserFetcher';

export { errors };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json')
const preferredRevision = packageJson.puppeteer.chromium_revision;
const isPuppeteerCore = packageJson.name === 'puppeteer-core';

const puppeteer = new Puppeteer(join(__dirname, '..'), preferredRevision, isPuppeteerCore);

export function launch(options?: LaunchOptions) {
  return puppeteer.launch(options);
}

export function connect(options?: ConnectOptions) {
  return puppeteer.connect(options);
}

export function executablePath() {
  return puppeteer.executablePath();
}

export const product = puppeteer.product;

export function defaultArgs(options?: ChromeArgOptions): string[] {
  return puppeteer.defaultArgs(options);
}

export function createBrowserFetcher(options?: BrowserFetcherOptions) {
  return puppeteer.createBrowserFetcher(options);
}
