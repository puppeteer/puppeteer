/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('data:text/html,<!DOCTYPE html><h1>example</h1>');
  await page.$('aria/example');
  await page.screenshot({path: 'example.png'});
  await browser.close();
})();
