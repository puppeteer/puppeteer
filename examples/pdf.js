/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://news.ycombinator.com', {
  waitUntil: 'networkidle2',
});
await page.pdf({
  path: 'hn.pdf',
  format: 'letter',
});

await browser.close();
