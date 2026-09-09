/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  protocol: 'webDriverBiDi',
});
const page = await browser.newPage();
await page.goto('https://pptr.dev');

await page.pdf({
  path: 'pptr.pdf',
  format: 'letter',
});

await browser.close();
