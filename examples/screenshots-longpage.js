/**
 * Copyright 2017 Google Inc. All rights reserved.
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
const devices = require('puppeteer/DeviceDescriptors');

(async() => {
const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.emulate(devices['iPhone 6']);
await page.goto('http://www.spiegel.de');

const {contentSize} = await page._client.send('Page.getLayoutMetrics');
const dpr = page._viewport.deviceScaleFactor || 1;
const maxScreenshotHeight = 16000 / dpr; // Hardcoded max texture size of 16,384 (crbug.com/770769)

for (let ypos = 0; ypos < contentSize.height; ypos += maxScreenshotHeight) {
  const height = Math.min(contentSize.height - ypos, maxScreenshotHeight);
  await page.screenshot({
    path: `screenshot-@${ypos}px.png`,
    clip: {
      x: 0,
      y: ypos,
      width: contentSize.width,
      height: height
    }
  });
}

await browser.close();
})();
