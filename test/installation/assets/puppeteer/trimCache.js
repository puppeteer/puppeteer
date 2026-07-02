/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer';

(async () => {
  await puppeteer.trimCache();
})();
