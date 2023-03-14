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
import {
  Browser,
  BrowserPlatform,
  BrowserTag,
  ChromeReleaseChannel,
  ProfileOptions,
} from './types.js';

export const downloadUrls = {
  [Browser.CHROME]: chrome.resolveDownloadUrl,
  [Browser.CHROMIUM]: chrome.resolveDownloadUrl,
  [Browser.FIREFOX]: firefox.resolveDownloadUrl,
};

export const executablePathByBrowser = {
  [Browser.CHROME]: chrome.relativeExecutablePath,
  [Browser.CHROMIUM]: chrome.relativeExecutablePath,
  [Browser.FIREFOX]: firefox.relativeExecutablePath,
};

export {Browser, BrowserPlatform, ChromeReleaseChannel};

export async function resolveBuildId(
  browser: Browser,
  platform: BrowserPlatform,
  tag: string
): Promise<string> {
  switch (browser) {
    case Browser.FIREFOX:
      switch (tag as BrowserTag) {
        case BrowserTag.LATEST:
          return await firefox.resolveBuildId('FIREFOX_NIGHTLY');
      }
    case Browser.CHROME:
    case Browser.CHROMIUM:
      switch (tag as BrowserTag) {
        case BrowserTag.LATEST:
          return await chrome.resolveBuildId(platform, 'latest');
      }
  }
  // We assume the tag is the buildId if it didn't match any keywords.
  return tag;
}

export async function createProfile(
  browser: Browser,
  opts: ProfileOptions
): Promise<void> {
  switch (browser) {
    case Browser.FIREFOX:
      return await firefox.createProfile(opts);
    case Browser.CHROME:
    case Browser.CHROMIUM:
      throw new Error(`Profile creation is not support for ${browser} yet`);
  }
}

export function resolveSystemExecutablePath(
  browser: Browser,
  platform: BrowserPlatform,
  channel: ChromeReleaseChannel
): string {
  switch (browser) {
    case Browser.FIREFOX:
      throw new Error(
        'System browser detection is not supported for Firefox yet.'
      );
    case Browser.CHROME:
    case Browser.CHROMIUM:
      return chrome.resolveSystemExecutablePath(platform, channel);
  }
}
