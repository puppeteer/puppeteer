/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {mkdir, rename, rm, stat, unlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

import {
  Browser,
  BrowserPlatform,
  downloadUrls,
} from './browser-data/browser-data.js';
import {Cache, InstalledBrowser} from './Cache.js';
import {debug} from './debug.js';
import {DefaultProvider} from './DefaultProvider.js';
import {detectBrowserPlatform} from './detectPlatform.js';
import {unpackArchive} from './fileUtil.js';
import {downloadFile, headHttpRequest} from './httpUtil.js';
import {ProgressBar} from './ProgressBar.js';
import type {BrowserProvider} from './provider.js';

const debugInstall = debug('puppeteer:browsers:install');
const INSTALL_LOCK_RETRY_DELAY = 100;
const INSTALL_LOCK_STALE_THRESHOLD = 5 * 60 * 1000;
const INSTALL_LOCK_HEARTBEAT_INTERVAL = 10 * 1000;
let staleInstallLockCounter = 0;

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
  debugInstall?.(`Duration for ${label}: ${duration}ms`);
}

function isErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

function installLockPath(
  cache: Cache,
  browser: Browser,
  platform: BrowserPlatform,
  buildId: string,
): string {
  const encodedBuildId = encodeURIComponent(buildId);
  return path.join(
    cache.browserRoot(browser),
    '.installLocks',
    `${platform}-${encodedBuildId}`,
  );
}

async function installLockStats(
  lockPath: string,
): Promise<{mtimeMs: number; hasHeartbeat: boolean}> {
  const heartbeatPath = path.join(lockPath, 'heartbeat');
  try {
    const stats = await stat(heartbeatPath);
    return {mtimeMs: stats.mtimeMs, hasHeartbeat: true};
  } catch (error) {
    if (!isErrorWithCode(error, 'ENOENT')) {
      throw error;
    }
    const stats = await stat(lockPath);
    return {mtimeMs: stats.mtimeMs, hasHeartbeat: false};
  }
}

async function removeStaleInstallLock(lockPath: string): Promise<boolean> {
  const reaperPath = path.join(lockPath, 'reaper');
  try {
    const lockStats = await installLockStats(lockPath);
    if (Date.now() - lockStats.mtimeMs <= INSTALL_LOCK_STALE_THRESHOLD) {
      return false;
    }
    debugInstall?.(`Removing stale browser install lock at ${lockPath}`);
    try {
      await mkdir(reaperPath);
    } catch (error) {
      if (isErrorWithCode(error, 'EEXIST')) {
        const reaperStats = await stat(reaperPath);
        if (Date.now() - reaperStats.mtimeMs > INSTALL_LOCK_STALE_THRESHOLD) {
          await rm(reaperPath, {recursive: true, force: true});
        }
        return false;
      }
      if (isErrorWithCode(error, 'ENOENT')) {
        return false;
      }
      throw error;
    }
    const claimedLockStats = lockStats.hasHeartbeat
      ? await installLockStats(lockPath)
      : lockStats;
    if (Date.now() - claimedLockStats.mtimeMs <= INSTALL_LOCK_STALE_THRESHOLD) {
      await rm(reaperPath, {recursive: true, force: true});
      return false;
    }
    const stalePath = path.join(
      path.dirname(lockPath),
      `${path.basename(lockPath)}.stale-${process.pid}-${Date.now()}-${staleInstallLockCounter++}`,
    );
    try {
      await rename(lockPath, stalePath);
    } catch (error) {
      if (isErrorWithCode(error, 'ENOENT')) {
        return false;
      }
      throw error;
    }
    await rm(stalePath, {recursive: true, force: true});
    return true;
  } catch (error) {
    if (isErrorWithCode(error, 'ENOENT')) {
      return false;
    }
    throw error;
  }
}

async function refreshInstallLock(lockPath: string): Promise<void> {
  await writeFile(path.join(lockPath, 'heartbeat'), `${process.pid}\n`);
}

async function withInstallLock<T>(
  lockPath: string,
  task: (options: {recoveredStaleLock: boolean}) => Promise<T>,
): Promise<T> {
  let recoveredStaleLock = false;
  await mkdir(path.dirname(lockPath), {recursive: true});
  while (true) {
    try {
      await mkdir(lockPath);
      await refreshInstallLock(lockPath);
      break;
    } catch (error) {
      if (!isErrorWithCode(error, 'EEXIST')) {
        throw error;
      }
      recoveredStaleLock ||= await removeStaleInstallLock(lockPath);
      await sleep(INSTALL_LOCK_RETRY_DELAY);
    }
  }

  const heartbeat = setInterval(() => {
    void refreshInstallLock(lockPath).catch(error => {
      debugInstall?.(`Failed to refresh browser install lock: ${error}`);
    });
  }, INSTALL_LOCK_HEARTBEAT_INTERVAL);
  heartbeat.unref();

  try {
    return await task({recoveredStaleLock});
  } finally {
    clearInterval(heartbeat);
    await rm(lockPath, {recursive: true, force: true});
  }
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
    'default' | ((downloadedBytes: number, totalBytes: number) => void);
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
   * Expected SHA-256 checksum (lowercase hex) of the downloaded browser archive.
   * If provided, installation will fail when the downloaded file does not match.
   * If omitted, the download proceeds without integrity verification.
   */
  expectedHash?: string;

  /**
   * Custom provider implementation for alternative download sources.
   *
   * If not provided, uses the default provider.
   * Multiple providers can be chained - they will be tried in order.
   * The default provider is automatically added as the final fallback.
   *
   * ⚠️ **IMPORTANT**: Custom providers are NOT officially supported by
   * Puppeteer.
   *
   * By using custom providers, you accept full responsibility for:
   *
   * - **Version compatibility**: Different platforms may receive different
   *   binary versions
   * - **Archive compatibility**: Binary structure must match Puppeteer's expectations
   * - **Feature integration**: Browser launch and other Puppeteer features may not work
   * - **Testing**: You must validate that downloaded binaries work with Puppeteer
   *
   * **Puppeteer only tests and guarantees compatibility with default binaries.**
   *
   * @example
   *
   * ```typescript
   * import {ElectronProvider} from './puppeteer-browser-provider-electron.js';
   *
   * await install({
   *   browser: Browser.CHROMEDRIVER,
   *   buildId: '142.0.7444.175',
   *   cacheDir: './cache',
   *   providers: [
   *     new ElectronProvider(), // Try Electron releases first
   *     // Falls back to Chrome for Testing automatically
   *   ],
   * });
   * ```
   */
  providers?: BrowserProvider[];
}

/**
 * Install using custom provider plugins.
 * Tries each provider in order until one succeeds.
 * Falls back to default provider if all custom providers fail.
 *
 * @internal
 */
async function installWithProviders(
  options: InstallOptions,
): Promise<InstalledBrowser | string> {
  if (!options.platform) {
    throw new Error('Platform must be defined');
  }

  const cache = new Cache(options.cacheDir);
  const browserRoot = cache.browserRoot(options.browser);

  // Build provider list with proper fallback behavior
  const providers = [...(options.providers || [])];

  // If custom baseUrl is provided, add it as a provider
  if (options.baseUrl) {
    providers.push(new DefaultProvider(options.baseUrl));
  }

  // Always add default provider as final fallback
  // (unless custom baseUrl is provided and forceFallbackForTesting is false)
  if (!options.baseUrl || options.forceFallbackForTesting) {
    providers.push(new DefaultProvider());
  }

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

  interface ProviderError {
    providerName: string;
    error: Error;
  }

  const errors: ProviderError[] = [];

  for (const provider of providers) {
    try {
      // Check: does this provider support this browser/platform?
      if (!(await provider.supports(downloadOptions))) {
        debugInstall?.(
          `Provider ${provider.getName()} does not support ${options.browser} on ${options.platform}`,
        );
        continue;
      }

      // Warn if using non-default provider
      if (!(provider instanceof DefaultProvider)) {
        debugInstall?.(`⚠️  Using custom downloader: ${provider.getName()}`);
        debugInstall?.(
          `⚠️  Puppeteer does not guarantee compatibility with non-default providers`,
        );
      }

      debugInstall?.(
        `Trying provider: ${provider.getName()} for ${options.browser} ${options.buildId}`,
      );

      // Get download URL from provider
      const url = await provider.getDownloadUrl(downloadOptions);
      if (!url) {
        debugInstall?.(
          `Provider ${provider.getName()} returned no URL for ${options.browser} ${options.buildId}`,
        );
        continue;
      }

      debugInstall?.(`Successfully got URL from ${provider.getName()}: ${url}`);

      if (!existsSync(browserRoot)) {
        await mkdir(browserRoot, {recursive: true});
      }

      // Download and install using the URL from the provider
      return await installUrl(url, options, provider);
    } catch (err) {
      debugInstall?.(
        `Provider ${provider.getName()} failed: ${(err as Error).message}`,
      );
      errors.push({
        providerName: provider.getName(),
        error: err as Error,
      });
      // Continue to next provider
    }
  }

  // All providers failed
  const errorDetails = errors
    .map(e => {
      return `  - ${e.providerName}: ${e.error.message}`;
    })
    .join('\n');
  throw new Error(
    `All providers failed for ${options.browser} ${options.buildId}:\n${errorDetails}`,
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

  // Always use plugin architecture (uses default provider if none specified)
  options.providers ??= [];
  return await installWithProviders(options);
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
    debugInstall?.(`deb.deps file was not found at ${depsPath}`);
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
  debugInstall?.(`Trying to install dependencies: ${data}`);
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
  debugInstall?.(`Installed system dependencies ${data}`);
}

async function installUrl(
  url: URL,
  options: InstallOptions,
  provider: BrowserProvider,
): Promise<InstalledBrowser | string> {
  if (!provider) {
    throw new Error('Provider is required for installation');
  }
  options.platform ??= detectBrowserPlatform();
  if (!options.platform) {
    throw new Error(
      `Cannot download a binary for the provided platform: ${os.platform()} (${os.arch()})`,
    );
  }
  const platform = options.platform;
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
  const lockPath = installLockPath(
    cache,
    options.browser,
    platform,
    options.buildId,
  );
  if (!existsSync(browserRoot)) {
    await mkdir(browserRoot, {recursive: true});
  }

  if (options.expectedHash) {
    debugInstall?.(
      `Using provided checksum for ${fileName}: ${options.expectedHash}`,
    );
  }

  if (!options.unpack) {
    return await withInstallLock(lockPath, async ({recoveredStaleLock}) => {
      if (recoveredStaleLock) {
        await rm(archivePath, {force: true});
      }
      if (existsSync(archivePath)) {
        return archivePath;
      }
      debugInstall?.(`Downloading binary from ${url}`);
      try {
        debugTime('download');
        await downloadFile(
          url,
          archivePath,
          downloadProgressCallback,
          options.expectedHash,
        );
      } catch (error) {
        await rm(archivePath, {force: true});
        throw error;
      } finally {
        debugTimeEnd('download');
      }
      return archivePath;
    });
  }

  const outputPath = cache.installationDir(
    options.browser,
    platform,
    options.buildId,
  );

  // Get executable path from provider once (used for both cached and new installations)
  const relativeExecutablePath = await provider.getExecutablePath({
    browser: options.browser,
    buildId: options.buildId,
    platform,
  });
  debugInstall?.(
    `Using executable path from provider: ${relativeExecutablePath}`,
  );

  return await withInstallLock(lockPath, async ({recoveredStaleLock}) => {
    // Write metadata for the installation (only for non-default providers)
    if (!(provider instanceof DefaultProvider)) {
      cache.writeExecutablePath(
        options.browser,
        platform,
        options.buildId,
        relativeExecutablePath,
      );
    }
    const installedBrowser = new InstalledBrowser(
      cache,
      options.browser,
      options.buildId,
      platform,
    );

    try {
      if (existsSync(outputPath)) {
        if (existsSync(installedBrowser.executablePath)) {
          await runSetup(installedBrowser);
          if (options.installDeps) {
            await installDeps(installedBrowser);
          }
          return installedBrowser;
        }
        debugInstall?.(
          `Removing incomplete browser installation at ${outputPath}; executable ${installedBrowser.executablePath} is missing`,
        );
        await rm(outputPath, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 500,
        });
      }

      if (recoveredStaleLock) {
        await rm(archivePath, {force: true});
      }

      // Check if archive already exists (e.g., from a custom provider)
      if (!existsSync(archivePath)) {
        debugInstall?.(`Downloading binary from ${url}`);
        try {
          debugTime('download');
          await downloadFile(
            url,
            archivePath,
            downloadProgressCallback,
            options.expectedHash,
          );
        } catch (error) {
          await rm(archivePath, {force: true});
          await rm(outputPath, {recursive: true, force: true});
          throw error;
        } finally {
          debugTimeEnd('download');
        }
      } else {
        debugInstall?.(`Using existing archive at ${archivePath}`);
      }

      debugInstall?.(`Installing ${archivePath} to ${outputPath}`);
      try {
        debugTime('extract');
        await unpackArchive(archivePath, outputPath);
      } catch (error) {
        await rm(archivePath, {force: true});
        await rm(outputPath, {recursive: true, force: true});
        throw error;
      } finally {
        debugTimeEnd('extract');
      }

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
  });
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
          shell: false,
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

  // Always use plugin architecture (uses default provider if none specified)
  const providers = [
    ...(options.providers || []),
    new DefaultProvider(options.baseUrl),
  ];

  const downloadOptions = {
    browser: options.browser,
    platform: options.platform,
    buildId: options.buildId,
  };

  // Check if any provider can provide a valid, downloadable URL
  for (const provider of providers) {
    if (!(await provider.supports(downloadOptions))) {
      continue;
    }
    const url = await provider.getDownloadUrl(downloadOptions);
    if (url && (await headHttpRequest(url))) {
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
 * @internal
 */
export async function makeProgressCallback(
  browser: Browser,
  buildId: string,
): Promise<(downloadedBytes: number, totalBytes: number) => void> {
  let ticker: ((delta: number) => void) | undefined;
  let lastDownloadedBytes = 0;

  return (downloadedBytes: number, totalBytes: number) => {
    if (!ticker) {
      ticker = ProgressBar.createBarTicker(
        `Downloading ${browser} ${buildId} - ${toMegabytes(totalBytes)}`,
        totalBytes,
      );
    }
    const delta = downloadedBytes - lastDownloadedBytes;
    lastDownloadedBytes = downloadedBytes;
    ticker(delta);
  };
}

function toMegabytes(bytes: number) {
  const mb = bytes / 1000 / 1000;
  return `${Math.round(mb * 10) / 10} MB`;
}
