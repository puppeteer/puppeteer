/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import * as chrome from './chrome.js';
import * as firefox from './firefox.js';

/**
 * Supported browsers.
 */
export enum Browser {
  CHROME = 'chrome',
  CHROMIUM = 'chromium',
  FIREFOX = 'firefox',
}

/**
 * Platform names used to identify a OS platfrom x architecture combination in the way
 * that is relevant for the browser download.
 */
export enum BrowserPlatform {
  LINUX = 'linux',
  MAC = 'mac',
  MAC_ARM = 'mac_arm',
  WIN32 = 'win32',
  WIN64 = 'win64',
}

export const downloadUrls = {
  [Browser.CHROME]: chrome.resolveDownloadUrl,
  [Browser.CHROMIUM]: chrome.resolveDownloadUrl,
  [Browser.FIREFOX]: firefox.resolveDownloadUrl,
};

export enum BrowserTag {
  LATEST = 'latest',
}
