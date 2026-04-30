/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({
    protocol: 'webDriverBiDi',
  });
  const page = await browser.newPage();
  await page.goto('data:text/html,<!DOCTYPE html><h1>example</h1>');
  await page.$('h1');
  await page.screenshot({path: 'example.png'});
  await browser.close();
})();
