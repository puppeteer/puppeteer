/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getLastMaintainedVersion,
  getSupportedBrowserData,
} from './generate-supported-browsers.ts';

const versionData = await getSupportedBrowserData();
const version = getLastMaintainedVersion(versionData);
if (!version) {
  console.error('Could not find last maintained version');
  process.exit(1);
}
const puppeteerVersion = version[0];
console.log(`< ${puppeteerVersion.replace(/^v/, '')}`);
process.exit(0);
