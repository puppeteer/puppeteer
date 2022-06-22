/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
