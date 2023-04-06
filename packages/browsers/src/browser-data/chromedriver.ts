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

import {httpRequest} from '../httpUtil.js';

import {BrowserPlatform} from './types.js';

function archive(platform: BrowserPlatform): string {
  switch (platform) {
    case BrowserPlatform.LINUX:
      return 'chromedriver_linux64';
    case BrowserPlatform.MAC_ARM:
      return 'chromedriver_mac_arm64';
    case BrowserPlatform.MAC:
      return 'chromedriver_mac64';
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      return 'chromedriver_win32';
  }
}

export function resolveDownloadUrl(
  platform: BrowserPlatform,
  buildId: string,
  baseUrl = 'https://chromedriver.storage.googleapis.com'
): string {
  return `${baseUrl}/${resolveDownloadPath(platform, buildId).join('/')}`;
}

export function resolveDownloadPath(
  platform: BrowserPlatform,
  buildId: string
): string[] {
  return [buildId, `${archive(platform)}.zip`];
}

export function relativeExecutablePath(
  platform: BrowserPlatform,
  _buildId: string
): string {
  switch (platform) {
    case BrowserPlatform.MAC:
    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.LINUX:
      return 'chromedriver';
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      return 'chromedriver.exe';
  }
}
export async function resolveBuildId(
  _channel: 'latest' = 'latest'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      new URL(`https://chromedriver.storage.googleapis.com/LATEST_RELEASE`),
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
