/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import Config from './common/Config.js';
import { BrowserWebSocketTransport } from './web/BrowserWebSocketTransport.js';
import debug from './web/Debug.js';
import { Puppeteer } from './common/Puppeteer.js';

// config
Config.WebSocketTransportClass = BrowserWebSocketTransport;
Config.fetch = globalThis.fetch;
Config.debug = debug;

export const initializePuppeteerWeb = (packageName: string): any => {
  const isPuppeteerCore = packageName === 'puppeteer-core';
  return new Puppeteer({
    isPuppeteerCore,
  });
};
