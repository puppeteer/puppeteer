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

import os from 'os';

import {BrowserPlatform} from './browser-data/browser-data.js';

/**
 * @public
 */
export function detectBrowserPlatform(): BrowserPlatform | undefined {
  const platform = os.platform();
  switch (platform) {
    case 'darwin':
      return os.arch() === 'arm64'
        ? BrowserPlatform.MAC_ARM
        : BrowserPlatform.MAC;
    case 'linux':
      return BrowserPlatform.LINUX;
    case 'win32':
      return os.arch() === 'x64' ||
        // Windows 11 for ARM supports x64 emulation
        (os.arch() === 'arm64' && isWindows11(os.release()))
        ? BrowserPlatform.WIN64
        : BrowserPlatform.WIN32;
    default:
      return undefined;
  }
}

/**
 * Windows 11 is identified by the version 10.0.22000 or greater
 * @internal
 */
function isWindows11(version: string): boolean {
  const parts = version.split('.');
  if (parts.length > 2) {
    const major = parseInt(parts[0] as string, 10);
    const minor = parseInt(parts[1] as string, 10);
    const patch = parseInt(parts[2] as string, 10);
    return (
      major > 10 ||
      (major === 10 && minor > 0) ||
      (major === 10 && minor === 0 && patch >= 22000)
    );
  }
  return false;
}
