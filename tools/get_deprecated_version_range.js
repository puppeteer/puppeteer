/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

const {
  versionsPerRelease,
  lastMaintainedChromeVersion,
} = require('../versions.js');

const version = versionsPerRelease.get(lastMaintainedChromeVersion);
if (version.toLowerCase() === 'next') {
  console.error('Unexpected NEXT Puppeteer version in versions.js');
  process.exit(1);
}
console.log(`< ${version.substring(1)}`);
process.exit(0);
