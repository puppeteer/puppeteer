/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Browser,
  type BrowserPlatform,
  downloadUrls,
} from './browser-data/browser-data.js';
import {debug} from './debug.js';
import type {
  BrowserDownloader,
  DownloadOptions,
  DownloadResult,
} from './downloader.js';
import {downloadFile, headHttpRequest, getJSON} from './httpUtil.js';

const debugInstall = debug('puppeteer:browsers:install');

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

  async canDownload(options: DownloadOptions): Promise<boolean> {
    const url = this.#getDownloadUrl(
      options.browser,
      options.platform,
      options.buildId,
    );

    try {
      return await headHttpRequest(url);
    } catch {
      // If HEAD request fails, try the CfT dashboard as fallback
      if (this.#shouldTryDashboard(options.browser)) {
        return await this.#canDownloadFromDashboard(options);
      }
      return false;
    }
  }

  async download(
    options: DownloadOptions,
    destinationPath: string,
  ): Promise<DownloadResult> {
    const url = this.#getDownloadUrl(
      options.browser,
      options.platform,
      options.buildId,
    );

    try {
      debugInstall(`Downloading from Chrome for Testing: ${url}`);
      await downloadFile(url, destinationPath, options.progressCallback);
      return {url, archivePath: destinationPath};
    } catch (err) {
      // Try dashboard fallback for Chrome-related browsers
      if (this.#shouldTryDashboard(options.browser)) {
        debugInstall(
          `Primary download failed, trying CfT dashboard for ${options.browser}`,
        );
        return await this.#downloadFromDashboard(options, destinationPath, url);
      }
      throw err;
    }
  }

  #getDownloadUrl(
    browser: Browser,
    platform: BrowserPlatform,
    buildId: string,
  ): URL {
    return new URL(downloadUrls[browser](platform, buildId, this.#baseUrl));
  }

  #shouldTryDashboard(browser: Browser): boolean {
    return (
      browser === Browser.CHROME ||
      browser === Browser.CHROMEDRIVER ||
      browser === Browser.CHROMEHEADLESSSHELL
    );
  }

  async #canDownloadFromDashboard(options: DownloadOptions): Promise<boolean> {
    try {
      const url = await this.#getDashboardUrl(options);
      return await headHttpRequest(url);
    } catch {
      return false;
    }
  }

  async #downloadFromDashboard(
    options: DownloadOptions,
    destinationPath: string,
    primaryUrl: URL,
  ): Promise<DownloadResult> {
    const dashboardUrl = await this.#getDashboardUrl(options);

    // If the URL is the same as primary, don't retry
    if (dashboardUrl.toString() === primaryUrl.toString()) {
      throw new Error(
        `No alternative download URL found for ${options.browser} ${options.buildId}`,
      );
    }

    debugInstall(`Downloading from CfT dashboard: ${dashboardUrl}`);
    await downloadFile(dashboardUrl, destinationPath, options.progressCallback);
    return {url: dashboardUrl, archivePath: destinationPath};
  }

  async #getDashboardUrl(options: DownloadOptions): Promise<URL> {
    interface Version {
      downloads: Record<string, Array<{platform: string; url: string}>>;
    }

    const version = (await getJSON(
      new URL(
        `https://googlechromelabs.github.io/chrome-for-testing/${options.buildId}.json`,
      ),
    )) as Version;

    // Map BrowserPlatform to CfT platform names
    // We include all known mappings, but check if they actually exist in the API response
    const platformMapping: Record<BrowserPlatform, string> = {
      linux: 'linux64',
      mac_arm: 'mac-arm64',
      mac: 'mac-x64',
      win32: 'win32',
      win64: 'win64',
      linux_arm: 'linux-arm64', // Future-proof: will work if CfT adds support
    };

    const platform = platformMapping[options.platform];
    if (!platform) {
      throw new Error(`Unknown platform mapping for ${options.platform}`);
    }

    // Try to find the download in the API response
    const downloadInfo = version.downloads[options.browser]?.find(link => {
      return link.platform === platform;
    });

    if (!downloadInfo) {
      // Platform exists in our mapping but not in CfT's API
      throw new Error(
        `Chrome for Testing does not provide ${options.browser} ${options.buildId} for platform ${platform}`,
      );
    }

    return new URL(downloadInfo.url);
  }
}
