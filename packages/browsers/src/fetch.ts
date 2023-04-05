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

import assert from 'assert';
import {existsSync} from 'fs';
import {mkdir, unlink} from 'fs/promises';
import os from 'os';
import path from 'path';

import {
  Browser,
  BrowserPlatform,
  downloadUrls,
} from './browser-data/browser-data.js';
import {Cache} from './Cache.js';
import {debug} from './debug.js';
import {detectBrowserPlatform} from './detectPlatform.js';
import {unpackArchive} from './fileUtil.js';
import {downloadFile, headHttpRequest} from './httpUtil.js';

const debugFetch = debug('puppeteer:browsers:fetcher');

/**
 * @public
 */
export interface Options {
  /**
   * Determines the path to download browsers to.
   */
  cacheDir: string;
  /**
   * Determines which platform the browser will be suited for.
   *
   * @defaultValue **Auto-detected.**
   */
  platform?: BrowserPlatform;
  /**
   * Determines which browser to fetch.
   */
  browser: Browser;
  /**
   * Determines which buildId to dowloand. BuildId should uniquely identify
   * binaries and they are used for caching.
   */
  buildId: string;
  /**
   * Provides information about the progress of the download.
   */
  downloadProgressCallback?: (
    downloadedBytes: number,
    totalBytes: number
  ) => void;
  /**
   * Determines the host that will be used for downloading.
   *
   * @defaultValue Either
   *
   * - https://storage.googleapis.com/chromium-browser-snapshots or
   * - https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central
   *
   */
  baseUrl?: string;
  /**
   * Whether to unpack and install browser archives.
   *
   * @defaultValue `true`
   */
  install?: boolean;
}

export type InstalledBrowser = {
  path: string;
  browser: Browser;
  buildId: string;
  platform: BrowserPlatform;
};

export async function fetch(options: Options): Promise<InstalledBrowser> {
  options.platform ??= detectBrowserPlatform();
  options.install ??= true;
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`
    );
  }
  const url = getDownloadUrl(
    options.browser,
    options.platform,
    options.buildId,
    options.baseUrl
  );
  const fileName = url.toString().split('/').pop();
  assert(fileName, `A malformed download URL was found: ${url}.`);
  const structure = new Cache(options.cacheDir);
  const browserRoot = structure.browserRoot(options.browser);
  const archivePath = path.join(browserRoot, fileName);
  if (!existsSync(browserRoot)) {
    await mkdir(browserRoot, {recursive: true});
  }

  if (!options.install) {
    if (existsSync(archivePath)) {
      return {
        path: archivePath,
        browser: options.browser,
        platform: options.platform,
        buildId: options.buildId,
      };
    }
    debugFetch(`Downloading binary from ${url}`);
    await downloadFile(url, archivePath, options.downloadProgressCallback);
    return {
      path: archivePath,
      browser: options.browser,
      platform: options.platform,
      buildId: options.buildId,
    };
  }

  const outputPath = structure.installationDir(
    options.browser,
    options.platform,
    options.buildId
  );
  if (existsSync(outputPath)) {
    return {
      path: outputPath,
      browser: options.browser,
      platform: options.platform,
      buildId: options.buildId,
    };
  }
  try {
    debugFetch(`Downloading binary from ${url}`);
    await downloadFile(url, archivePath, options.downloadProgressCallback);
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
    buildId: options.buildId,
  };
}

export async function canFetch(options: Options): Promise<boolean> {
  options.platform ??= detectBrowserPlatform();
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`
    );
  }
  return await headHttpRequest(
    getDownloadUrl(
      options.browser,
      options.platform,
      options.buildId,
      options.baseUrl
    )
  );
}

function getDownloadUrl(
  browser: Browser,
  platform: BrowserPlatform,
  buildId: string,
  baseUrl?: string
): URL {
  return new URL(downloadUrls[browser](platform, buildId, baseUrl));
}
