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

import {BrowserPlatform, ChromeReleaseChannel} from './types.js';

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
  return `${baseUrl}/${folder(platform)}/${buildId}/${archive(
    platform,
    buildId
  )}.zip`;
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

export function resolveSystemExecutablePath(
  platform: BrowserPlatform,
  channel: ChromeReleaseChannel
): string {
  switch (platform) {
    case BrowserPlatform.WIN64:
    case BrowserPlatform.WIN32:
      switch (channel) {
        case ChromeReleaseChannel.STABLE:
          return `${process.env['PROGRAMFILES']}\\Google\\Chrome\\Application\\chrome.exe`;
        case ChromeReleaseChannel.BETA:
          return `${process.env['PROGRAMFILES']}\\Google\\Chrome Beta\\Application\\chrome.exe`;
        case ChromeReleaseChannel.CANARY:
          return `${process.env['PROGRAMFILES']}\\Google\\Chrome SxS\\Application\\chrome.exe`;
        case ChromeReleaseChannel.DEV:
          return `${process.env['PROGRAMFILES']}\\Google\\Chrome Dev\\Application\\chrome.exe`;
      }
    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.MAC:
      switch (channel) {
        case ChromeReleaseChannel.STABLE:
          return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        case ChromeReleaseChannel.BETA:
          return '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
        case ChromeReleaseChannel.CANARY:
          return '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
        case ChromeReleaseChannel.DEV:
          return '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev';
      }
    case BrowserPlatform.LINUX:
      switch (channel) {
        case ChromeReleaseChannel.STABLE:
          return '/opt/google/chrome/chrome';
        case ChromeReleaseChannel.BETA:
          return '/opt/google/chrome-beta/chrome';
        case ChromeReleaseChannel.DEV:
          return '/opt/google/chrome-unstable/chrome';
      }
  }

  throw new Error(
    `Unable to detect browser executable path for '${channel}' on ${platform}.`
  );
}
