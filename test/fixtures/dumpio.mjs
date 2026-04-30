/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {pathToFileURL} from 'node:url';

const [, , puppeteerRoot, options] = process.argv;
const puppeteer = (await import(pathToFileURL(puppeteerRoot))).default;
const browser = await puppeteer.launch(JSON.parse(options));
const page = await browser.newPage();
await page.evaluate(() => {
  return console.error('message from dumpio');
});
await page.close();
await browser.close();
