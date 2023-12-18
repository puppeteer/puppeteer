/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const puppeteer = require('puppeteer');

async function attachFrame(frameId, url) {
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.id = frameId;
  document.body.appendChild(frame);
  await new Promise(x => {
    return (frame.onload = x);
  });
  return frame;
}

(async () => {
  // Launch browser in non-headless mode.
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  // Load a page from one origin:
  await page.goto('http://example.org/');

  // Inject iframe with the another origin.
  await page.evaluateHandle(attachFrame, 'frame1', 'https://example.com/');

  // At this point there should be a message in the output:
  // puppeteer:frame The frame '...' moved to another session. Out-of-process
  // iframes (OOPIF) are not supported by Puppeteer yet.
  // https://github.com/puppeteer/puppeteer/issues/2548

  await browser.close();
})();
