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

import {BrowserPlatform} from './types.js';

function archive(platform: BrowserPlatform, revision: string): string {
  switch (platform) {
    case BrowserPlatform.LINUX:
      return 'chrome-linux';
    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.MAC:
      return 'chrome-mac';
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      // Windows archive name changed at r591479.
      return parseInt(revision, 10) > 591479 ? 'chrome-win' : 'chrome-win32';
  }
}

function folder(platform: BrowserPlatform): string {
  switch (platform) {
    case BrowserPlatform.LINUX:
      return 'Linux_x64';
    case BrowserPlatform.MAC_ARM:
      return 'Mac_Arm';
    case BrowserPlatform.MAC:
      return 'Mac';
    case BrowserPlatform.WIN32:
      return 'Win';
    case BrowserPlatform.WIN64:
      return 'Win_x64';
  }
}

export function resolveDownloadUrl(
  platform: BrowserPlatform,
  revision: string,
  baseUrl = 'https://storage.googleapis.com/chromium-browser-snapshots'
): string {
  return `${baseUrl}/${folder(platform)}/${revision}/${archive(
    platform,
    revision
  )}.zip`;
}
