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
import {detectBrowserPlatform} from './detectPlatform.js';
import {CacheStructure} from './CacheStructure.js';

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
  downloadProgressCallback?: (
    downloadedBytes: number,
    totalBytes: number
  ) => void;
}

export type InstalledBrowser = {
  path: string;
  browser: Browser;
  revision: string;
  platform: BrowserPlatform;
};

export async function fetch(options: Options): Promise<InstalledBrowser> {
  options.platform ??= detectBrowserPlatform();
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
  const structure = new CacheStructure(options.cacheDir);
  const browserRoot = structure.browserRoot(options.browser);
  const archivePath = path.join(browserRoot, fileName);
  if (!existsSync(browserRoot)) {
    await mkdir(browserRoot, {recursive: true});
  }
  const outputPath = structure.installationDir(
    options.browser,
    options.platform,
    options.revision
  );
  if (existsSync(outputPath)) {
    return {
      path: outputPath,
      browser: options.browser,
      platform: options.platform,
      revision: options.revision,
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
    revision: options.revision,
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
    getDownloadUrl(options.browser, options.platform, options.revision)
  );
}

function getDownloadUrl(
  browser: Browser,
  platform: BrowserPlatform,
  revision: string
): URL {
  return new URL(downloadUrls[browser](platform, revision));
}
