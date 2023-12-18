/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulate(puppeteer.devices['iPhone 6']);
  await page.goto('https://www.nytimes.com/');
  await page.screenshot({path: 'full.png', fullPage: true});
  await browser.close();
})();
