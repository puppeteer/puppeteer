/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export type {
  LaunchOptions,
  ComputeExecutablePathOptions as Options,
  SystemOptions,
} from './launch.js';
export {
  launch,
  computeExecutablePath,
  computeSystemExecutablePath,
  TimeoutError,
  CDP_WEBSOCKET_ENDPOINT_REGEX,
  WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX,
  Process,
} from './launch.js';
export type {
  InstallOptions,
  GetInstalledBrowsersOptions,
  UninstallOptions,
} from './install.js';
export {
  install,
  getInstalledBrowsers,
  canDownload,
  uninstall,
} from './install.js';
export {detectBrowserPlatform} from './detectPlatform.js';
export type {ProfileOptions} from './browser-data/browser-data.js';
export {
  resolveBuildId,
  Browser,
  BrowserPlatform,
  ChromeReleaseChannel,
  createProfile,
} from './browser-data/browser-data.js';
export {CLI, makeProgressCallback} from './CLI.js';
export {Cache, InstalledBrowser} from './Cache.js';
