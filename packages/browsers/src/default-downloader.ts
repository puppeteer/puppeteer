/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Browser, BrowserPlatform} from './browser-data/browser-data.js';
import {downloadUrls} from './browser-data/browser-data.js';
import type {BrowserDownloader, DownloadOptions} from './downloader.js';

/**
 * Default downloader implementation that uses Chrome for Testing (CfT) sources.
 * This is the standard downloader used by Puppeteer.
 *
 * @public
 */
export class ChromeForTestingDownloader implements BrowserDownloader {
  #baseUrl?: string;

  constructor(baseUrl?: string) {
    this.#baseUrl = baseUrl;
  }

  supports(_options: DownloadOptions): boolean {
    // Chrome for Testing supports all browsers
    return true;
  }

  getDownloadUrl(options: DownloadOptions): URL {
    return this.#getDownloadUrl(
      options.browser,
      options.platform,
      options.buildId,
    );
  }

  #getDownloadUrl(
    browser: Browser,
    platform: BrowserPlatform,
    buildId: string,
  ): URL {
    return new URL(downloadUrls[browser](platform, buildId, this.#baseUrl));
  }
}
