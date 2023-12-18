/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  Browser,
  type BrowserPlatform,
  executablePathByBrowser,
} from './browser-data/browser-data.js';
import {detectBrowserPlatform} from './detectPlatform.js';

/**
 * @public
 */
export class InstalledBrowser {
  browser: Browser;
  buildId: string;
  platform: BrowserPlatform;
  readonly executablePath: string;

  #cache: Cache;

  /**
   * @internal
   */
  constructor(
    cache: Cache,
    browser: Browser,
    buildId: string,
    platform: BrowserPlatform
  ) {
    this.#cache = cache;
    this.browser = browser;
    this.buildId = buildId;
    this.platform = platform;
    this.executablePath = cache.computeExecutablePath({
      browser,
      buildId,
      platform,
    });
  }

  /**
   * Path to the root of the installation folder. Use
   * {@link computeExecutablePath} to get the path to the executable binary.
   */
  get path(): string {
    return this.#cache.installationDir(
      this.browser,
      this.platform,
      this.buildId
    );
  }
}

/**
 * @internal
 */
export interface ComputeExecutablePathOptions {
  /**
   * Determines which platform the browser will be suited for.
   *
   * @defaultValue **Auto-detected.**
   */
  platform?: BrowserPlatform;
  /**
   * Determines which browser to launch.
   */
  browser: Browser;
  /**
   * Determines which buildId to download. BuildId should uniquely identify
   * binaries and they are used for caching.
   */
  buildId: string;
}

/**
 * The cache used by Puppeteer relies on the following structure:
 *
 * - rootDir
 *   -- <browser1> | browserRoot(browser1)
 *   ---- <platform>-<buildId> | installationDir()
 *   ------ the browser-platform-buildId
 *   ------ specific structure.
 *   -- <browser2> | browserRoot(browser2)
 *   ---- <platform>-<buildId> | installationDir()
 *   ------ the browser-platform-buildId
 *   ------ specific structure.
 *   @internal
 */
export class Cache {
  #rootDir: string;

  constructor(rootDir: string) {
    this.#rootDir = rootDir;
  }

  /**
   * @internal
   */
  get rootDir(): string {
    return this.#rootDir;
  }

  browserRoot(browser: Browser): string {
    return path.join(this.#rootDir, browser);
  }

  installationDir(
    browser: Browser,
    platform: BrowserPlatform,
    buildId: string
  ): string {
    return path.join(this.browserRoot(browser), `${platform}-${buildId}`);
  }

  clear(): void {
    fs.rmSync(this.#rootDir, {
      force: true,
      recursive: true,
      maxRetries: 10,
      retryDelay: 500,
    });
  }

  uninstall(
    browser: Browser,
    platform: BrowserPlatform,
    buildId: string
  ): void {
    fs.rmSync(this.installationDir(browser, platform, buildId), {
      force: true,
      recursive: true,
      maxRetries: 10,
      retryDelay: 500,
    });
  }

  getInstalledBrowsers(): InstalledBrowser[] {
    if (!fs.existsSync(this.#rootDir)) {
      return [];
    }
    const types = fs.readdirSync(this.#rootDir);
    const browsers = types.filter((t): t is Browser => {
      return (Object.values(Browser) as string[]).includes(t);
    });
    return browsers.flatMap(browser => {
      const files = fs.readdirSync(this.browserRoot(browser));
      return files
        .map(file => {
          const result = parseFolderPath(
            path.join(this.browserRoot(browser), file)
          );
          if (!result) {
            return null;
          }
          return new InstalledBrowser(
            this,
            browser,
            result.buildId,
            result.platform as BrowserPlatform
          );
        })
        .filter((item: InstalledBrowser | null): item is InstalledBrowser => {
          return item !== null;
        });
    });
  }

  computeExecutablePath(options: ComputeExecutablePathOptions): string {
    options.platform ??= detectBrowserPlatform();
    if (!options.platform) {
      throw new Error(
        `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`
      );
    }
    const installationDir = this.installationDir(
      options.browser,
      options.platform,
      options.buildId
    );
    return path.join(
      installationDir,
      executablePathByBrowser[options.browser](
        options.platform,
        options.buildId
      )
    );
  }
}

function parseFolderPath(
  folderPath: string
): {platform: string; buildId: string} | undefined {
  const name = path.basename(folderPath);
  const splits = name.split('-');
  if (splits.length !== 2) {
    return;
  }
  const [platform, buildId] = splits;
  if (!buildId || !platform) {
    return;
  }
  return {platform, buildId};
}
