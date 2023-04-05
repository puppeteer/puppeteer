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

import {httpRequest} from '../httpUtil.js';

import {BrowserPlatform} from './types.js';

export {resolveSystemExecutablePath} from './chrome.js';

function archive(platform: BrowserPlatform, buildId: string): string {
  switch (platform) {
    case BrowserPlatform.LINUX:
      return 'chrome-linux';
    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.MAC:
      return 'chrome-mac';
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      // Windows archive name changed at r591479.
      return parseInt(buildId, 10) > 591479 ? 'chrome-win' : 'chrome-win32';
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
  buildId: string,
  baseUrl = 'https://storage.googleapis.com/chromium-browser-snapshots'
): string {
  return `${baseUrl}/${resolveDownloadPath(platform, buildId).join('/')}`;
}

export function resolveDownloadPath(
  platform: BrowserPlatform,
  buildId: string
): string[] {
  return [folder(platform), buildId, `${archive(platform, buildId)}.zip`];
}

export function relativeExecutablePath(
  platform: BrowserPlatform,
  _buildId: string
): string {
  switch (platform) {
    case BrowserPlatform.MAC:
    case BrowserPlatform.MAC_ARM:
      return path.join(
        'chrome-mac',
        'Chromium.app',
        'Contents',
        'MacOS',
        'Chromium'
      );
    case BrowserPlatform.LINUX:
      return path.join('chrome-linux', 'chrome');
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      return path.join('chrome-win', 'chrome.exe');
  }
}
export async function resolveBuildId(
  platform: BrowserPlatform,
  // We will need it for other channels/keywords.
  _channel: 'latest' = 'latest'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      new URL(
        `https://storage.googleapis.com/chromium-browser-snapshots/${folder(
          platform
        )}/LAST_CHANGE`
      ),
      'GET',
      response => {
        let data = '';
        if (response.statusCode && response.statusCode >= 400) {
          return reject(new Error(`Got status code ${response.statusCode}`));
        }
        response.on('data', chunk => {
          data += chunk;
        });
        response.on('end', () => {
          try {
            return resolve(String(data));
          } catch {
            return reject(new Error('Chrome version not found'));
          }
        });
      },
      false
    );
    request.on('error', err => {
      reject(err);
    });
  });
}
