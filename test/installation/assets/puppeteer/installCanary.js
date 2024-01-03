/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Browser,
  detectBrowserPlatform,
  install,
  resolveBuildId,
} from '@puppeteer/browsers';

(async () => {
  await install({
    cacheDir: process.env['PUPPETEER_CACHE_DIR'],
    browser: Browser.CHROME,
    buildId: await resolveBuildId(
      Browser.CHROME,
      detectBrowserPlatform(),
      'canary'
    ),
  });
})();
