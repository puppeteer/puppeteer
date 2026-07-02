/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.emulate(puppeteer.devices['iPhone 6']);
await page.goto('https://www.nytimes.com/');
await page.screenshot({path: 'full.png', fullPage: true});
await browser.close();
