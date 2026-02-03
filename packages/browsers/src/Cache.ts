/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs, {promises as fsPromises} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import debug from 'debug';

import {
  Browser,
  type BrowserPlatform,
  executablePathByBrowser,
  getVersionComparator,
} from './browser-data/browser-data.js';
import {detectBrowserPlatform} from './detectPlatform.js';

const debugCache = debug('puppeteer:browsers:cache');

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
    platform: BrowserPlatform,
    executablePath?: string,
  ) {
    this.#cache = cache;
    this.browser = browser;
    this.buildId = buildId;
    this.platform = platform;
    this.executablePath =
      executablePath ??
      cache.computeExecutablePath({
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
      this.buildId,
    );
  }

  readMetadata(): Metadata {
    return this.#cache.readMetadata(this.browser);
  }

  writeMetadata(metadata: Metadata): void {
    this.#cache.writeMetadata(this.browser, metadata);
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
 * @public
 */
export interface Metadata {
  // Maps an alias (canary/latest/dev/etc.) to a buildId.
  aliases: Record<string, string>;
  // Maps installation key (platform-buildId) to executable path.
  executablePaths?: Record<string, string>;
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

  metadataFile(browser: Browser): string {
    return path.join(this.browserRoot(browser), '.metadata');
  }

  readMetadata(browser: Browser): Metadata {
    const metatadaPath = this.metadataFile(browser);
    if (!fs.existsSync(metatadaPath)) {
      return {aliases: {}};
    }
    // TODO: add type-safe parsing.
    const data = JSON.parse(fs.readFileSync(metatadaPath, 'utf8'));
    if (typeof data !== 'object') {
      throw new Error('.metadata is not an object');
    }
    return data;
  }

  async readMetadataAsync(browser: Browser): Promise<Metadata> {
    const metatadaPath = this.metadataFile(browser);
    try {
      const data = JSON.parse(await fsPromises.readFile(metatadaPath, 'utf8'));
      if (typeof data !== 'object') {
        throw new Error('.metadata is not an object');
      }
      return data;
    } catch {
      return {aliases: {}};
    }
  }

  writeMetadata(browser: Browser, metadata: Metadata): void {
    const metatadaPath = this.metadataFile(browser);
    fs.mkdirSync(path.dirname(metatadaPath), {recursive: true});
    fs.writeFileSync(metatadaPath, JSON.stringify(metadata, null, 2));
  }

  readExecutablePath(
    browser: Browser,
    platform: BrowserPlatform,
    buildId: string,
  ): string | null {
    const metadata = this.readMetadata(browser);
    const key = `${platform}-${buildId}`;
    return metadata.executablePaths?.[key] ?? null;
  }

  writeExecutablePath(
    browser: Browser,
    platform: BrowserPlatform,
    buildId: string,
    executablePath: string,
  ): void {
    const metadata = this.readMetadata(browser);
    if (!metadata.executablePaths) {
      metadata.executablePaths = {};
    }
    const key = `${platform}-${buildId}`;
    metadata.executablePaths[key] = executablePath;
    this.writeMetadata(browser, metadata);
  }

  resolveAlias(browser: Browser, alias: string): string | undefined {
    const metadata = this.readMetadata(browser);
    if (alias === 'latest') {
      return Object.values(metadata.aliases || {})
        .sort(getVersionComparator(browser))
        .at(-1);
    }
    return metadata.aliases[alias];
  }

  installationDir(
    browser: Browser,
    platform: BrowserPlatform,
    buildId: string,
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
    buildId: string,
  ): void {
    const metadata = this.readMetadata(browser);
    for (const alias of Object.keys(metadata.aliases)) {
      if (metadata.aliases[alias] === buildId) {
        delete metadata.aliases[alias];
      }
    }
    // Clean up executable path entry
    const key = `${platform}-${buildId}`;
    if (metadata.executablePaths?.[key]) {
      delete metadata.executablePaths[key];
    }
    this.writeMetadata(browser, metadata);
    fs.rmSync(this.installationDir(browser, platform, buildId), {
      force: true,
      recursive: true,
      maxRetries: 10,
      retryDelay: 500,
    });
  }

  async getInstalledBrowsers(): Promise<InstalledBrowser[]> {
    try {
      await fsPromises.access(this.#rootDir);
    } catch {
      return [];
    }
    const types = await fsPromises.readdir(this.#rootDir);
    const browsers = types.filter((t): t is Browser => {
      return (Object.values(Browser) as string[]).includes(t);
    });
    const browsersList = await Promise.all(
      browsers.map(async browser => {
        const metadata = await this.readMetadataAsync(browser);
        const files = await fsPromises.readdir(this.browserRoot(browser));
        return await Promise.all(
          files.map(async file => {
            const result = parseFolderPath(
              path.join(this.browserRoot(browser), file),
            );
            if (!result) {
              return null;
            }
            const platform = result.platform as BrowserPlatform;
            const buildId = result.buildId;
            const installationDir = this.installationDir(
              browser,
              platform,
              buildId,
            );
            const key = `${platform}-${buildId}`;
            const storedExecutablePath = metadata.executablePaths?.[key];
            let executablePath: string;
            if (storedExecutablePath) {
              executablePath = path.join(installationDir, storedExecutablePath);
            } else {
              executablePath = path.join(
                installationDir,
                executablePathByBrowser[browser](platform, buildId),
              );
            }
            return new InstalledBrowser(
              this,
              browser,
              buildId,
              platform,
              executablePath,
            );
          }),
        );
      }),
    );
    return browsersList
      .flat()
      .filter((item: InstalledBrowser | null): item is InstalledBrowser => {
        return item !== null;
      });
  }

  computeExecutablePath(options: ComputeExecutablePathOptions): string {
    options.platform ??= detectBrowserPlatform();
    if (!options.platform) {
      throw new Error(
        `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`,
      );
    }
    try {
      options.buildId =
        this.resolveAlias(options.browser, options.buildId) ?? options.buildId;
    } catch {
      debugCache('could not read .metadata file for the browser');
    }
    const installationDir = this.installationDir(
      options.browser,
      options.platform,
      options.buildId,
    );

    const storedExecutablePath = this.readExecutablePath(
      options.browser,
      options.platform,
      options.buildId,
    );
    if (storedExecutablePath) {
      // The metadata contains a resolved relative path from the installation dir
      return path.join(installationDir, storedExecutablePath);
    }

    return path.join(
      installationDir,
      executablePathByBrowser[options.browser](
        options.platform,
        options.buildId,
      ),
    );
  }
}

function parseFolderPath(
  folderPath: string,
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
