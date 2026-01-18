/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export type {ProfileOptions} from './browser-data/browser-data.js';
export {
  Browser,
  BrowserPlatform,
  ChromeReleaseChannel,
  createProfile,
  getVersionComparator,
  resolveBuildId,
  resolveDefaultUserDataDir,
} from './browser-data/browser-data.js';
export {BrowserTag} from './browser-data/types.js';
export {
  Cache,
  type ComputeExecutablePathOptions,
  InstalledBrowser,
  type Metadata,
} from './Cache.js';
export {CLI} from './CLI.js';
export {DefaultProvider} from './default-provider.js';
export {detectBrowserPlatform} from './detectPlatform.js';
export type {
  GetInstalledBrowsersOptions,
  InstallOptions,
  UninstallOptions,
} from './install.js';
export {
  canDownload,
  getDownloadUrl,
  getInstalledBrowsers,
  install,
  makeProgressCallback,
  uninstall,
} from './install.js';
export type {
  ComputeExecutablePathOptions as Options,
  LaunchOptions,
  SystemOptions,
} from './launch.js';
export {
  CDP_WEBSOCKET_ENDPOINT_REGEX,
  computeExecutablePath,
  computeSystemExecutablePath,
  launch,
  Process,
  TimeoutError,
  WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX,
} from './launch.js';
export {
  type BrowserProvider,
  buildArchiveFilename,
  type DownloadOptions,
} from './provider.js';
