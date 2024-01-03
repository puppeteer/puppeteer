/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported browsers.
 *
 * @public
 */
export enum Browser {
  CHROME = 'chrome',
  CHROMEHEADLESSSHELL = 'chrome-headless-shell',
  CHROMIUM = 'chromium',
  FIREFOX = 'firefox',
  CHROMEDRIVER = 'chromedriver',
}

/**
 * Platform names used to identify a OS platform x architecture combination in the way
 * that is relevant for the browser download.
 *
 * @public
 */
export enum BrowserPlatform {
  LINUX = 'linux',
  MAC = 'mac',
  MAC_ARM = 'mac_arm',
  WIN32 = 'win32',
  WIN64 = 'win64',
}

/**
 * @public
 */
export enum BrowserTag {
  CANARY = 'canary',
  BETA = 'beta',
  DEV = 'dev',
  STABLE = 'stable',
  LATEST = 'latest',
}

/**
 * @public
 */
export interface ProfileOptions {
  preferences: Record<string, unknown>;
  path: string;
}

/**
 * @public
 */
export enum ChromeReleaseChannel {
  STABLE = 'stable',
  DEV = 'dev',
  CANARY = 'canary',
  BETA = 'beta',
}
