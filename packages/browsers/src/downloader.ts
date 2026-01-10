/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Browser, BrowserPlatform} from './browser-data/browser-data.js';

/**
 * Result of a download operation.
 * @public
 */
export interface DownloadResult {
  /**
   * The URL that was successfully used to download the archive.
   */
  url: URL;
  /**
   * Path to the downloaded archive file.
   */
  archivePath: string;
}

/**
 * Options passed to a downloader's download method.
 * @public
 */
export interface DownloadOptions {
  browser: Browser;
  platform: BrowserPlatform;
  buildId: string;
  /**
   * Progress callback for download progress.
   */
  progressCallback?: (downloadedBytes: number, totalBytes: number) => void;
}

/**
 * Interface for custom browser downloader implementations.
 * Allows users to implement alternative download sources for browsers.
 *
 * ⚠️ **IMPORTANT**: Custom downloaders are NOT officially supported by
 * Puppeteer.
 *
 * By implementing this interface, you accept full responsibility for:
 *
 * - Ensuring downloaded binaries are compatible with Puppeteer's expectations
 * - Testing that browser launch and other features work with your binaries
 * - Maintaining compatibility when Puppeteer or your download source changes
 * - Version consistency across platforms if mixing sources
 *
 * Puppeteer only tests and guarantees Chrome for Testing binaries.
 *
 * @example
 *
 * ```typescript
 * class ElectronDownloader implements BrowserDownloader {
 *   async canDownload(options: DownloadOptions): Promise<boolean> {
 *     // Check if Electron releases have this version
 *     return (
 *       options.browser === Browser.CHROMEDRIVER &&
 *       options.platform === BrowserPlatform.LINUX_ARM
 *     );
 *   }
 *
 *   async download(
 *     options: DownloadOptions,
 *     destinationPath: string,
 *   ): Promise<DownloadResult> {
 *     const url = new URL(`https://github.com/electron/electron/releases/...`);
 *     await downloadFile(url, destinationPath, options.progressCallback);
 *     return {url, archivePath: destinationPath};
 *   }
 * }
 * ```
 *
 * @public
 */
export interface BrowserDownloader {
  /**
   * Check if this downloader can handle the given browser/platform/buildId combination.
   * This is called before attempting download.
   *
   * @param options - Download options to check
   * @returns Promise that resolves to true if this downloader can handle the request
   */
  canDownload(options: DownloadOptions): Promise<boolean>;

  /**
   * Download the browser archive.
   *
   * @param options - Download options
   * @param destinationPath - Where to save the downloaded archive
   * @returns Promise with download result containing URL and archive path
   * @throws Error if download fails
   */
  download(
    options: DownloadOptions,
    destinationPath: string,
  ): Promise<DownloadResult>;

  /**
   * Resolve the executable path after extraction.
   *
   * Use this when your archive has a different internal structure than
   * Chrome for Testing. For example, Electron's chromedriver archives use
   * 'chromedriver/' instead of 'chromedriver-linux64/'.
   *
   * @param options - Browser, buildId, platform, and installation directory.
   * @returns Absolute path to the executable binary.
   * @example
   *
   * ```ts
   * // Electron chromedriver uses 'chromedriver/' directory
   * resolveExecutablePath(options) {
   *   return path.join(options.installationDir, 'chromedriver', 'chromedriver');
   * }
   * ```
   */
  resolveExecutablePath?(options: {
    browser: Browser;
    buildId: string;
    platform: BrowserPlatform;
    installationDir: string;
  }): Promise<string> | string;
}

/**
 * Utility function to build a standard archive filename.
 * @public
 */
export function buildArchiveFilename(
  browser: Browser,
  platform: BrowserPlatform,
  buildId: string,
  extension = 'zip',
): string {
  return `${browser}-${platform}-${buildId}.${extension}`;
}
