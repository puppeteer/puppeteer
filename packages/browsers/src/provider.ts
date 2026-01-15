/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Browser, BrowserPlatform} from './browser-data/browser-data.js';

/**
 * Options passed to a downloader.
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
 * class ElectronDownloader implements BrowserProvider {
 *   supports(options: DownloadOptions): boolean {
 *     return options.browser === Browser.CHROMEDRIVER;
 *   }
 *
 *   getDownloadUrl(options: DownloadOptions): URL {
 *     const platform = mapToPlatform(options.platform);
 *     return new URL(
 *       `v${options.buildId}/chromedriver-v${options.buildId}-${platform}.zip`,
 *       'https://github.com/electron/electron/releases/download/',
 *     );
 *   }
 *
 *   getExecutablePath(options): string {
 *     const ext = options.platform.includes('win') ? '.exe' : '';
 *     return `chromedriver/chromedriver${ext}`;
 *   }
 * }
 * ```
 *
 * @public
 */
export interface BrowserProvider {
  /**
   * Check if this downloader supports the given browser/platform.
   * Used for filtering before attempting downloads.
   *
   * Can be synchronous for quick checks or asynchronous if version
   * resolution/network requests are needed.
   *
   * @param options - Download options to check
   * @returns True if this downloader supports the browser/platform combination
   */
  supports(options: DownloadOptions): Promise<boolean> | boolean;

  /**
   * Get the download URL for the requested browser.
   *
   * The buildId can be either an exact version (e.g., "131.0.6778.109")
   * or an alias (e.g., "latest", "stable"). Custom downloaders should handle
   * version resolution internally if they support aliases.
   *
   * Returns null if the buildId cannot be resolved to a valid version.
   * The URL is not validated - download will fail later if URL doesn't exist.
   *
   * Can be synchronous for simple URL construction or asynchronous if version
   * resolution/network requests are needed.
   *
   * @param options - Download options (buildId may be alias or exact version)
   * @returns Download URL, or null if version cannot be resolved
   * @example
   *
   * ```ts
   * // Synchronous example
   * getDownloadUrl(options) {
   *   const platform = mapPlatform(options.platform);
   *   return new URL(`https://releases.example.com/v${options.buildId}/${platform}.zip`);
   * }
   *
   * // Asynchronous example with version mapping
   * async getDownloadUrl(options) {
   *   const electronVersion = await resolveElectronVersion(options.buildId);
   *   if (!electronVersion) return null;
   *
   *   const platform = mapPlatform(options.platform);
   *   return new URL(`https://github.com/electron/electron/releases/download/v${electronVersion}/${platform}.zip`);
   * }
   * ```
   */
  getDownloadUrl(options: DownloadOptions): Promise<URL | null> | URL | null;

  /**
   * Get the relative path to the executable within the extracted archive.
   *
   * Can return a simple path or use `\{platform\}` and `\{buildId\}` placeholders.
   * If not provided, uses the default Chrome for Testing structure.
   *
   * @param options - Browser, buildId, and platform
   * @returns Relative path to the executable (may include placeholders)
   * @example
   *
   * ```ts
   * // Electron uses simple structure
   * getExecutablePath() {
   *   return 'chromedriver/chromedriver';
   * }
   *
   * // Chrome for Testing uses platform-specific folders
   * getExecutablePath(options) {
   *   return `chromedriver-\{platform\}/chromedriver`;
   * }
   * ```
   */
  getExecutablePath?(options: {
    browser: Browser;
    buildId: string;
    platform: BrowserPlatform;
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
