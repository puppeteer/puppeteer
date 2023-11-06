/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({
    protocol: 'webDriverBiDi',
  });
  const page = await browser.newPage();
  await page.goto('http://example.com');
  await page.$('h1');
  await page.screenshot({path: 'example.png'});
  await browser.close();
})();
