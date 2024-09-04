/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    dumpio: true,
  });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({
    path: 'test.png',
  });
  await browser.close();
  console.log('done');
})();
