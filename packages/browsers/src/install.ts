/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {mkdir, unlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type * as ProgressBar from 'progress';
import ProgressBarClass from 'progress';

import {
  Browser,
  BrowserPlatform,
  downloadUrls,
} from './browser-data/browser-data.js';
import {Cache, InstalledBrowser} from './Cache.js';
import {debug} from './debug.js';
import {detectBrowserPlatform} from './detectPlatform.js';
import {unpackArchive} from './fileUtil.js';
import {downloadFile, getJSON, headHttpRequest} from './httpUtil.js';

const debugInstall = debug('puppeteer:browsers:install');

/**
 * Maps BrowserPlatform to Electron release platform names
 */
function mapPlatformForElectron(platform: BrowserPlatform): string {
  switch (platform) {
    case BrowserPlatform.LINUX:
      return 'linux-x64';
    case BrowserPlatform.LINUX_ARM:
      return 'linux-arm64';
    case BrowserPlatform.MAC:
      return 'darwin-x64';
    case BrowserPlatform.MAC_ARM:
      return 'darwin-arm64';
    case BrowserPlatform.WIN32:
      return 'win32-ia32';
    case BrowserPlatform.WIN64:
      return 'win32-x64';
  }
}

/**
 * Maps BrowserPlatform to Playwright platform names
 */
function mapPlatformForPlaywright(platform: BrowserPlatform): string {
  switch (platform) {
    case BrowserPlatform.LINUX:
      return 'linux';
    case BrowserPlatform.LINUX_ARM:
      return 'linux-arm64';
    case BrowserPlatform.MAC:
      return 'mac';
    case BrowserPlatform.MAC_ARM:
      return 'mac-arm64';
    case BrowserPlatform.WIN32:
      return 'win32';
    case BrowserPlatform.WIN64:
      return 'win64';
  }
}

const times = new Map<string, [number, number]>();
function debugTime(label: string) {
  times.set(label, process.hrtime());
}

function debugTimeEnd(label: string) {
  const end = process.hrtime();
  const start = times.get(label);
  if (!start) {
    return;
  }
  const duration =
    end[0] * 1000 + end[1] / 1e6 - (start[0] * 1000 + start[1] / 1e6); // calculate duration in milliseconds
  debugInstall(`Duration for ${label}: ${duration}ms`);
}

/**
 * Predefined fallback sources for common alternative download locations
 */
export const FallbackSources = {
  /**
   * Electron releases - useful for Chromedriver on platforms where Chrome releases aren't available
   */
  ELECTRON: {
    baseUrl: 'https://github.com/electron/electron/releases/download/',
    urlBuilder: (browser: Browser, platform: BrowserPlatform, buildId: string, baseUrl: string) => {
      if (browser !== Browser.CHROMEDRIVER) {
        throw new Error('Electron fallback is only supported for Chromedriver');
      }
      return `${baseUrl}v${buildId}/chromedriver-v${buildId}-${mapPlatformForElectron(platform)}.zip`;
    }
  },

  /**
   * Playwright builds - useful for Chromium on ARM64 platforms
   */
  PLAYWRIGHT_CHROMIUM: {
    baseUrl: 'https://playwright.azureedge.net/builds/chromium/',
    urlBuilder: (browser: Browser, platform: BrowserPlatform, buildId: string, baseUrl: string) => {
      if (browser !== Browser.CHROMIUM) {
        throw new Error('Playwright Chromium fallback is only supported for Chromium browser');
      }
      return `${baseUrl}${buildId}/chromium-${mapPlatformForPlaywright(platform)}.zip`;
    }
  }
} as const;

/**
 * @public
 */
export interface InstallOptions {
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
   * Determines which browser to install.
   */
  browser: Browser;
  /**
   * Determines which buildId to download. BuildId should uniquely identify
   * binaries and they are used for caching.
   */
  buildId: string;
  /**
   * An alias for the provided `buildId`. It will be used to maintain local
   * metadata to support aliases in the `launch` command.
   *
   * @example 'canary'
   */
  buildIdAlias?: string;
  /**
   * Provides information about the progress of the download. If set to
   * 'default', the default callback implementing a progress bar will be
   * used.
   */
  downloadProgressCallback?:
    | 'default'
    | ((downloadedBytes: number, totalBytes: number) => void);
  /**
   * Determines the host that will be used for downloading.
   *
   * @defaultValue Either
   *
   * - https://storage.googleapis.com/chrome-for-testing-public or
   * - https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central
   *
   */
  baseUrl?: string;
  /**
   * Alternative download sources to try if the primary download fails.
   * Useful for platforms where official builds aren't available.
   *
   * @example
   * ```typescript
   * // Use Electron releases as fallback for Chromedriver
   * fallbackSources: [{
   *   baseUrl: 'https://github.com/electron/electron/releases/download/',
   *   urlBuilder: (browser, platform, buildId, baseUrl) =>
   *     `${baseUrl}v${buildId}/chromedriver-v${buildId}-${mapPlatformForElectron(platform)}.zip`
   * }]
   *
   * // Use Playwright builds as fallback for Chromium
   * fallbackSources: [{
   *   baseUrl: 'https://playwright.azureedge.net/builds/chromium/',
   *   urlBuilder: (browser, platform, buildId, baseUrl) =>
   *     `${baseUrl}${buildId}/chromium-${mapPlatformForPlaywright(platform)}.zip`
   * }]
   * ```
   */
  fallbackSources?: Array<{
    baseUrl: string;
    urlBuilder?: (browser: Browser, platform: BrowserPlatform, buildId: string, baseUrl: string) => string;
  }>;
  /**
   * Whether to unpack and install browser archives.
   *
   * @defaultValue `true`
   */
  unpack?: boolean;
  /**
   * @internal
   * @defaultValue `false`
   */
  forceFallbackForTesting?: boolean;

  /**
   * Whether to attempt to install system-level dependencies required
   * for the browser.
   *
   * Only supported for Chrome on Debian or Ubuntu.
   * Requires system-level privileges to run `apt-get`.
   *
   * @defaultValue `false`
   */
  installDeps?: boolean;
}

/**
 * Downloads and unpacks the browser archive according to the
 * {@link InstallOptions}.
 *
 * @returns a {@link InstalledBrowser} instance.
 *
 * @public
 */
export function install(
  options: InstallOptions & {unpack?: true},
): Promise<InstalledBrowser>;
/**
 * Downloads the browser archive according to the {@link InstallOptions} without
 * unpacking.
 *
 * @returns the absolute path to the archive.
 *
 * @public
 */
export function install(
  options: InstallOptions & {unpack: false},
): Promise<string>;
export async function install(
  options: InstallOptions,
): Promise<InstalledBrowser | string> {
  options.platform ??= detectBrowserPlatform();
  options.unpack ??= true;
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`,
    );
  }
  const url = getDownloadUrl(
    options.browser,
    options.platform,
    options.buildId,
    options.baseUrl,
  );
  try {
    return await installUrl(url, options);
  } catch (err) {
    // If custom baseUrl is provided, do not fall back to CfT dashboard.
    if (options.baseUrl && !options.forceFallbackForTesting) {
      throw err;
    }
    debugInstall(`Error downloading from ${url}.`);

    // Try user-provided fallback sources first
    if (options.fallbackSources) {
      for (const fallbackSource of options.fallbackSources) {
        try {
          debugInstall(`Trying fallback source: ${fallbackSource.baseUrl}`);
          let fallbackDownloadUrl: URL;

          if (fallbackSource.urlBuilder) {
            // Use custom URL builder for sources with different URL structures
            // At this point, options.platform is guaranteed to be defined due to earlier validation
            if (!options.platform) {
              throw new Error('Platform should be defined at this point');
            }
            const urlString = fallbackSource.urlBuilder(
              options.browser,
              options.platform,
              options.buildId,
              fallbackSource.baseUrl
            );
            fallbackDownloadUrl = new URL(urlString);
          } else {
            // Use standard URL builder with custom baseUrl
            fallbackDownloadUrl = getDownloadUrl(
              options.browser,
              options.platform,
              options.buildId,
              fallbackSource.baseUrl,
            );
          }

          debugInstall(`Attempting download from ${fallbackDownloadUrl}`);
          return await installUrl(fallbackDownloadUrl, options);
        } catch (fallbackErr) {
          debugInstall(`Fallback source ${fallbackSource.baseUrl} failed: ${(fallbackErr as Error).message}`);
          // Continue to next fallback source
        }
      }
    }

    // Fall back to browser-specific logic
    switch (options.browser) {
      case Browser.CHROME:
      case Browser.CHROMEDRIVER:
      case Browser.CHROMEHEADLESSSHELL: {
        debugInstall(
          `Trying to find download URL via https://googlechromelabs.github.io/chrome-for-testing.`,
        );
        interface Version {
          downloads: Record<string, Array<{platform: string; url: string}>>;
        }
        const version = (await getJSON(
          new URL(
            `https://googlechromelabs.github.io/chrome-for-testing/${options.buildId}.json`,
          ),
        )) as Version;
        let platform = '';
        switch (options.platform) {
          case BrowserPlatform.LINUX:
            platform = 'linux64';
            break;
          case BrowserPlatform.MAC_ARM:
            platform = 'mac-arm64';
            break;
          case BrowserPlatform.MAC:
            platform = 'mac-x64';
            break;
          case BrowserPlatform.WIN32:
            platform = 'win32';
            break;
          case BrowserPlatform.WIN64:
            platform = 'win64';
            break;
        }
        const backupUrl = version.downloads[options.browser]?.find(link => {
          return link['platform'] === platform;
        })?.url;
        if (backupUrl) {
          // If the URL is the same, skip the retry.
          if (backupUrl === url.toString()) {
            throw err;
          }
          debugInstall(`Falling back to downloading from ${backupUrl}.`);
          return await installUrl(new URL(backupUrl), options);
        }
        throw err;
      }
      default:
        throw err;
    }
  }
}

async function installDeps(installedBrowser: InstalledBrowser) {
  if (
    process.platform !== 'linux' ||
    installedBrowser.platform !== BrowserPlatform.LINUX
  ) {
    return;
  }
  // Currently, only Debian-like deps are supported.
  const depsPath = path.join(
    path.dirname(installedBrowser.executablePath),
    'deb.deps',
  );
  if (!existsSync(depsPath)) {
    debugInstall(`deb.deps file was not found at ${depsPath}`);
    return;
  }
  const data = readFileSync(depsPath, 'utf-8').split('\n').join(',');
  if (process.getuid?.() !== 0) {
    throw new Error('Installing system dependencies requires root privileges');
  }
  let result = spawnSync('apt-get', ['-v']);
  if (result.status !== 0) {
    throw new Error(
      'Failed to install system dependencies: apt-get does not seem to be available',
    );
  }
  debugInstall(`Trying to install dependencies: ${data}`);
  result = spawnSync('apt-get', [
    'satisfy',
    '-y',
    data,
    '--no-install-recommends',
  ]);
  if (result.status !== 0) {
    throw new Error(
      `Failed to install system dependencies: status=${result.status},error=${result.error},stdout=${result.stdout.toString('utf8')},stderr=${result.stderr.toString('utf8')}`,
    );
  }
  debugInstall(`Installed system dependencies ${data}`);
}

async function installUrl(
  url: URL,
  options: InstallOptions,
): Promise<InstalledBrowser | string> {
  options.platform ??= detectBrowserPlatform();
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`,
    );
  }
  let downloadProgressCallback = options.downloadProgressCallback;
  if (downloadProgressCallback === 'default') {
    downloadProgressCallback = await makeProgressCallback(
      options.browser,
      options.buildIdAlias ?? options.buildId,
    );
  }
  const fileName = decodeURIComponent(url.toString()).split('/').pop();
  assert(fileName, `A malformed download URL was found: ${url}.`);
  const cache = new Cache(options.cacheDir);
  const browserRoot = cache.browserRoot(options.browser);
  const archivePath = path.join(browserRoot, `${options.buildId}-${fileName}`);
  if (!existsSync(browserRoot)) {
    await mkdir(browserRoot, {recursive: true});
  }

  if (!options.unpack) {
    if (existsSync(archivePath)) {
      return archivePath;
    }
    debugInstall(`Downloading binary from ${url}`);
    debugTime('download');
    await downloadFile(url, archivePath, downloadProgressCallback);
    debugTimeEnd('download');
    return archivePath;
  }

  const outputPath = cache.installationDir(
    options.browser,
    options.platform,
    options.buildId,
  );

  try {
    if (existsSync(outputPath)) {
      const installedBrowser = new InstalledBrowser(
        cache,
        options.browser,
        options.buildId,
        options.platform,
      );
      if (!existsSync(installedBrowser.executablePath)) {
        throw new Error(
          `The browser folder (${outputPath}) exists but the executable (${installedBrowser.executablePath}) is missing`,
        );
      }
      await runSetup(installedBrowser);
      if (options.installDeps) {
        await installDeps(installedBrowser);
      }
      return installedBrowser;
    }
    debugInstall(`Downloading binary from ${url}`);
    try {
      debugTime('download');
      await downloadFile(url, archivePath, downloadProgressCallback);
    } finally {
      debugTimeEnd('download');
    }

    debugInstall(`Installing ${archivePath} to ${outputPath}`);
    try {
      debugTime('extract');
      await unpackArchive(archivePath, outputPath);
    } finally {
      debugTimeEnd('extract');
    }

    const installedBrowser = new InstalledBrowser(
      cache,
      options.browser,
      options.buildId,
      options.platform,
    );
    if (options.buildIdAlias) {
      const metadata = installedBrowser.readMetadata();
      metadata.aliases[options.buildIdAlias] = options.buildId;
      installedBrowser.writeMetadata(metadata);
    }

    await runSetup(installedBrowser);
    if (options.installDeps) {
      await installDeps(installedBrowser);
    }
    return installedBrowser;
  } finally {
    if (existsSync(archivePath)) {
      await unlink(archivePath);
    }
  }
}

async function runSetup(installedBrowser: InstalledBrowser): Promise<void> {
  // On Windows for Chrome invoke setup.exe to configure sandboxes.
  if (
    (installedBrowser.platform === BrowserPlatform.WIN32 ||
      installedBrowser.platform === BrowserPlatform.WIN64) &&
    installedBrowser.browser === Browser.CHROME &&
    installedBrowser.platform === detectBrowserPlatform()
  ) {
    try {
      debugTime('permissions');
      const browserDir = path.dirname(installedBrowser.executablePath);
      const setupExePath = path.join(browserDir, 'setup.exe');
      if (!existsSync(setupExePath)) {
        return;
      }
      spawnSync(
        path.join(browserDir, 'setup.exe'),
        [`--configure-browser-in-directory=` + browserDir],
        {
          shell: true,
        },
      );
      // TODO: Handle error here. Currently the setup.exe sometimes
      // errors although it sets the permissions correctly.
    } finally {
      debugTimeEnd('permissions');
    }
  }
}

/**
 * @public
 */
export interface UninstallOptions {
  /**
   * Determines the platform for the browser binary.
   *
   * @defaultValue **Auto-detected.**
   */
  platform?: BrowserPlatform;
  /**
   * The path to the root of the cache directory.
   */
  cacheDir: string;
  /**
   * Determines which browser to uninstall.
   */
  browser: Browser;
  /**
   * The browser build to uninstall
   */
  buildId: string;
}

/**
 *
 * @public
 */
export async function uninstall(options: UninstallOptions): Promise<void> {
  options.platform ??= detectBrowserPlatform();
  if (!options.platform) {
    throw new Error(
      `Cannot detect the browser platform for: ${os.platform()} (${os.arch()})`,
    );
  }

  new Cache(options.cacheDir).uninstall(
    options.browser,
    options.platform,
    options.buildId,
  );
}

/**
 * @public
 */
export interface GetInstalledBrowsersOptions {
  /**
   * The path to the root of the cache directory.
   */
  cacheDir: string;
}

/**
 * Returns metadata about browsers installed in the cache directory.
 *
 * @public
 */
export async function getInstalledBrowsers(
  options: GetInstalledBrowsersOptions,
): Promise<InstalledBrowser[]> {
  return new Cache(options.cacheDir).getInstalledBrowsers();
}

/**
 * @public
 */
export async function canDownload(options: InstallOptions): Promise<boolean> {
  options.platform ??= detectBrowserPlatform();
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`,
    );
  }
  return await headHttpRequest(
    getDownloadUrl(
      options.browser,
      options.platform,
      options.buildId,
      options.baseUrl,
    ),
  );
}

/**
 * Retrieves a URL for downloading the binary archive of a given browser.
 *
 * The archive is bound to the specific platform and build ID specified.
 *
 * @public
 */
export function getDownloadUrl(
  browser: Browser,
  platform: BrowserPlatform,
  buildId: string,
  baseUrl?: string,
): URL {
  return new URL(downloadUrls[browser](platform, buildId, baseUrl));
}

/**
 * @public
 */
export function makeProgressCallback(
  browser: Browser,
  buildId: string,
): (downloadedBytes: number, totalBytes: number) => void {
  let progressBar: ProgressBar;

  let lastDownloadedBytes = 0;
  return (downloadedBytes: number, totalBytes: number) => {
    if (!progressBar) {
      progressBar = new ProgressBarClass(
        `Downloading ${browser} ${buildId} - ${toMegabytes(
          totalBytes,
        )} [:bar] :percent :etas `,
        {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: totalBytes,
        },
      );
    }
    const delta = downloadedBytes - lastDownloadedBytes;
    lastDownloadedBytes = downloadedBytes;
    progressBar.tick(delta);
  };
}

function toMegabytes(bytes: number) {
  const mb = bytes / 1000 / 1000;
  return `${Math.round(mb * 10) / 10} MB`;
}
