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
import {Browser, BrowserPlatform, BrowserTag} from './types.js';

export const downloadUrls = {
  [Browser.CHROME]: chrome.resolveDownloadUrl,
  [Browser.FIREFOX]: firefox.resolveDownloadUrl,
};

export const executablePathByBrowser = {
  [Browser.CHROME]: chrome.relativeExecutablePath,
  [Browser.FIREFOX]: firefox.relativeExecutablePath,
};

export {Browser, BrowserPlatform};

export async function resolveRevision(
  browser: Browser,
  tag: string
): Promise<string> {
  switch (browser) {
    case Browser.FIREFOX:
      switch (tag as BrowserTag) {
        case BrowserTag.LATEST:
          return await firefox.resolveRevision('FIREFOX_NIGHTLY');
      }
  }
  // We assume the tag is the revision if it didn't match any keywords.
  return tag;
}
