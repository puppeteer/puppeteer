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

(async() => {

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://google.com', {waitUntil: 'networkidle'});
// Type our query into the search bar
await page.type('puppeteer');

await page.click('input[type="submit"]');

// Wait for the results to show up
await page.waitForSelector('h3 a');

// Extract the results from the page
const links = await page.evaluate(() => {
  const anchors = Array.from(document.querySelectorAll('h3 a'));
  return anchors.map(anchor => anchor.textContent);
});
console.log(links.join('\n'));
await browser.close();

})();
