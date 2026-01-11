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
import {ChromeForTestingDownloader} from './default-downloader.js';
import {detectBrowserPlatform} from './detectPlatform.js';
import type {BrowserDownloader} from './downloader.js';
import {unpackArchive} from './fileUtil.js';
import {downloadFile} from './httpUtil.js';

const debugInstall = debug('puppeteer:browsers:install');

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
  /**
   * Custom downloader implementation for alternative download sources.
   *
   * If not provided, uses the default Chrome for Testing downloader.
   * Multiple downloaders can be chained - they will be tried in order.
   * Chrome for Testing is automatically added as the final fallback.
   *
   * ⚠️ **IMPORTANT**: Custom downloaders are NOT officially supported by
   * Puppeteer.
   *
   * By using custom downloaders, you accept full responsibility for:
   *
   * - **Version compatibility**: Different platforms may receive different
   *   binary versions
   * - **Archive compatibility**: Binary structure must match Puppeteer's expectations
   * - **Feature integration**: Browser launch and other Puppeteer features may not work
   * - **Testing**: You must validate that downloaded binaries work with Puppeteer
   *
   * **Puppeteer only tests and guarantees compatibility with Chrome for
   * Testing binaries.**
   *
   * @example
   *
   * ```typescript
   * import {ElectronDownloader} from '@wdio/browser-downloader-electron';
   *
   * await install({
   *   browser: Browser.CHROMEDRIVER,
   *   buildId: '142.0.7444.175',
   *   cacheDir: './cache',
   *   downloaders: [
   *     new ElectronDownloader(), // Try Electron releases first
   *     // Falls back to Chrome for Testing automatically
   *   ],
   * });
   * ```
   */
  downloaders?: BrowserDownloader[];
}

/**
 * Install using custom downloader plugins.
 * Tries each downloader in order until one succeeds.
 * Falls back to default CfT downloader if all custom downloaders fail.
 *
 * @internal
 */
async function installWithDownloaders(
  options: InstallOptions,
): Promise<InstalledBrowser | string> {
  if (!options.platform) {
    throw new Error('Platform must be defined');
  }

  const cache = new Cache(options.cacheDir);
  const browserRoot = cache.browserRoot(options.browser);

  // Always add default CfT downloader as final fallback
  const downloaders = [
    ...(options.downloaders || []),
    new ChromeForTestingDownloader(options.baseUrl),
  ];

  const downloadOptions = {
    browser: options.browser,
    platform: options.platform,
    buildId: options.buildId,
    progressCallback:
      options.downloadProgressCallback === 'default'
        ? await makeProgressCallback(
            options.browser,
            options.buildIdAlias ?? options.buildId,
          )
        : options.downloadProgressCallback,
  };

  const errors: Error[] = [];

  for (const downloader of downloaders) {
    try {
      // Check: does this downloader support this browser/platform?
      if (!(await downloader.supports(downloadOptions))) {
        debugInstall(
          `Downloader ${downloader.constructor.name} does not support ${options.browser} on ${options.platform}`,
        );
        continue;
      }

      // Warn if using non-CfT downloader
      if (!(downloader instanceof ChromeForTestingDownloader)) {
        debugInstall(
          `⚠️  Using custom downloader: ${downloader.constructor.name}`,
        );
        debugInstall(
          `⚠️  Puppeteer does not guarantee compatibility with non-Chrome-for-Testing binaries`,
        );
      }

      debugInstall(
        `Trying downloader: ${downloader.constructor.name} for ${options.browser} ${options.buildId}`,
      );

      // Get download URL from plugin
      const url = await downloader.getDownloadUrl(downloadOptions);
      if (!url) {
        debugInstall(
          `Downloader ${downloader.constructor.name} returned no URL for ${options.browser} ${options.buildId}`,
        );
        continue;
      }

      debugInstall(
        `Successfully got URL from ${downloader.constructor.name}: ${url}`,
      );

      if (!existsSync(browserRoot)) {
        await mkdir(browserRoot, {recursive: true});
      }

      // Download and install using the URL from the plugin
      return await installUrl(url, options, downloader);
    } catch (err) {
      debugInstall(
        `Downloader ${downloader.constructor.name} failed: ${(err as Error).message}`,
      );
      errors.push(err as Error);
      // Continue to next downloader
    }
  }

  // All downloaders failed
  const errorMessages = errors
    .map(e => {
      return e.message;
    })
    .join('\n  - ');
  throw new Error(
    `All downloaders failed for ${options.browser} ${options.buildId}:\n  - ${errorMessages}`,
  );
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

  // Always use plugin architecture (defaults to CfT if no downloaders provided)
  options.downloaders ??= [];
  return await installWithDownloaders(options);
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
  downloader?: BrowserDownloader,
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
      // Get executable path template from downloader if provided
      let pathTemplate: string | undefined;
      if (downloader?.getExecutablePath) {
        pathTemplate = await downloader.getExecutablePath({
          browser: options.browser,
          buildId: options.buildId,
          platform: options.platform,
        });
        debugInstall(
          `Using executable path template from downloader: ${pathTemplate}`,
        );
      }

      const installedBrowser = new InstalledBrowser(
        cache,
        options.browser,
        options.buildId,
        options.platform,
        pathTemplate,
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

    // Check if archive already exists (e.g., from a custom downloader)
    if (!existsSync(archivePath)) {
      debugInstall(`Downloading binary from ${url}`);
      try {
        debugTime('download');
        await downloadFile(url, archivePath, downloadProgressCallback);
      } finally {
        debugTimeEnd('download');
      }
    } else {
      debugInstall(`Using existing archive at ${archivePath}`);
    }

    debugInstall(`Installing ${archivePath} to ${outputPath}`);
    try {
      debugTime('extract');
      await unpackArchive(archivePath, outputPath);
    } finally {
      debugTimeEnd('extract');
    }

    // Get executable path template from downloader if provided
    let pathTemplate: string | undefined;
    if (downloader?.getExecutablePath) {
      pathTemplate = await downloader.getExecutablePath({
        browser: options.browser,
        buildId: options.buildId,
        platform: options.platform,
      });
      debugInstall(
        `Using executable path template from downloader: ${pathTemplate}`,
      );
    }

    const installedBrowser = new InstalledBrowser(
      cache,
      options.browser,
      options.buildId,
      options.platform,
      pathTemplate,
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

  // Always use plugin architecture (defaults to CfT if no downloaders provided)
  const downloaders = [
    ...(options.downloaders || []),
    new ChromeForTestingDownloader(options.baseUrl),
  ];

  const downloadOptions = {
    browser: options.browser,
    platform: options.platform,
    buildId: options.buildId,
  };

  // Check if any downloader can provide a URL for this request
  for (const downloader of downloaders) {
    if (!downloader.supports(downloadOptions)) {
      continue;
    }
    const url = downloader.getDownloadUrl(downloadOptions);
    if (url) {
      return true;
    }
  }

  return false;
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
