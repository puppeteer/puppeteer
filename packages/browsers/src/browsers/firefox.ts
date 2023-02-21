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

function archive(platform: BrowserPlatform, buildId: string): string {
  switch (platform) {
    case BrowserPlatform.LINUX:
      return `firefox-${buildId}.en-US.${platform}-x86_64.tar.bz2`;
    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.MAC:
      return `firefox-${buildId}.en-US.mac.dmg`;
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      return `firefox-${buildId}.en-US.${platform}.zip`;
  }
}

export function resolveDownloadUrl(
  platform: BrowserPlatform,
  buildId: string,
  baseUrl = 'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central'
): string {
  return `${baseUrl}/${archive(platform, buildId)}`;
}

export function relativeExecutablePath(
  platform: BrowserPlatform,
  _buildId: string
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

export async function resolveBuildId(
  channel: 'FIREFOX_NIGHTLY' = 'FIREFOX_NIGHTLY'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      new URL('https://product-details.mozilla.org/1.0/firefox_versions.json'),
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
            const versions = JSON.parse(data);
            return resolve(versions[channel]);
          } catch {
            return reject(new Error('Firefox version not found'));
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
