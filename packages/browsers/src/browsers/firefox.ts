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

import path from 'path';

import {BrowserPlatform} from './types.js';

function archive(platform: BrowserPlatform, revision: string): string {
  switch (platform) {
    case BrowserPlatform.LINUX:
      return `firefox-${revision}.en-US.${platform}-x86_64.tar.bz2`;
    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.MAC:
      return `firefox-${revision}.en-US.mac.dmg`;
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      return `firefox-${revision}.en-US.${platform}.zip`;
  }
}

export function resolveDownloadUrl(
  platform: BrowserPlatform,
  revision: string,
  baseUrl = 'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central'
): string {
  return `${baseUrl}/${archive(platform, revision)}`;
}

export function relativeExecutablePath(
  platform: BrowserPlatform,
  _revision: string
): string {
  switch (platform) {
    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.MAC:
      return path.join('Firefox Nightly.app', 'Contents', 'MacOS', 'firefox');
    case BrowserPlatform.LINUX:
      return path.join('firefox', 'firefox');
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      return path.join('firefox', 'firefox.exe');
  }
}
