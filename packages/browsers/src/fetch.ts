/**
 * Copyright 2017 Google Inc. All rights reserved.
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

import {existsSync} from 'fs';
import {mkdir, unlink} from 'fs/promises';
import os from 'os';
import path from 'path';

import {debug} from './debug.js';
import {Browser, BrowserPlatform, downloadUrls} from './browsers/browsers.js';
import {downloadFile, headHttpRequest} from './httpUtil.js';
import assert from 'assert';
import {unpackArchive} from './fileUtil.js';

const debugFetch = debug('puppeteer:browsers:fetcher');

/**
 * @public
 */
export interface Options {
  /**
   * Determines the path to download browsers to.
   */
  outputDir: string;
  /**
   * Determines which platform the browser will be suited for.
   *
   * @defaultValue Auto-detected.
   */
  platform?: BrowserPlatform;
  /**
   * Determines which browser to fetch.
   */
  browser: Browser;
  /**
   * Determines which revision to dowloand. Revision should uniquely identify
   * binaries and they are used for caching.
   */
  revision: string;
  /**
   * Provides information about the progress of the download.
   */
  progressCallback?: (downloadedBytes: number, totalBytes: number) => void;
}

export type InstalledBrowser = {
  path: string;
  browser: Browser;
  revision: string;
  platform: BrowserPlatform;
};

export async function fetch(options: Options): Promise<InstalledBrowser> {
  options.platform ??= detectPlatform();
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`
    );
  }
  const url = getDownloadUrl(
    options.browser,
    options.platform,
    options.revision
  );
  const fileName = url.toString().split('/').pop();
  assert(fileName, `A malformed download URL was found: ${url}.`);
  const archivePath = path.join(options.outputDir, fileName);
  const outputPath = path.resolve(
    options.outputDir,
    `${options.platform}-${options.revision}`
  );
  if (existsSync(outputPath)) {
    return {
      path: outputPath,
      browser: options.browser,
      platform: options.platform,
      revision: options.revision,
    };
  }
  if (!existsSync(options.outputDir)) {
    await mkdir(options.outputDir, {recursive: true});
  }
  try {
    debugFetch(`Downloading binary from ${url}`);
    await downloadFile(url, archivePath, options.progressCallback);
    debugFetch(`Installing ${archivePath} to ${outputPath}`);
    await unpackArchive(archivePath, outputPath);
  } finally {
    if (existsSync(archivePath)) {
      await unlink(archivePath);
    }
  }
  return {
    path: outputPath,
    browser: options.browser,
    platform: options.platform,
    revision: options.revision,
  };
}

export async function canFetch(options: Options): Promise<boolean> {
  options.platform ??= detectPlatform();
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`
    );
  }
  return await headHttpRequest(
    getDownloadUrl(options.browser, options.platform, options.revision)
  );
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

function detectPlatform(): BrowserPlatform | undefined {
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

function getDownloadUrl(
  browser: Browser,
  platform: BrowserPlatform,
  revision: string
): URL {
  return new URL(downloadUrls[browser](platform, revision));
}
