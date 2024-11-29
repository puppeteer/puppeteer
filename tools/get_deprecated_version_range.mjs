/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import data from '../versions.json' with {type: 'json'};

const version = data.versions.find(([puppeteerVersion, browserVersions]) => {
  return browserVersions.chrome === data.lastMaintainedChromeVersion;
});
const puppeteerVersion = version[0];
if (puppeteerVersion === 'NEXT') {
  console.error('Unexpected NEXT Puppeteer version in versions.js');
  process.exit(1);
}
console.log(`< ${puppeteerVersion.substring(1)}`);
process.exit(0);
