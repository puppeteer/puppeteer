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

const timeout = new Promise((r, reject) => setTimeout(() => reject(`Timeout hit of 30s. No callPhantom was never called.`), 30 * 1000));
let resolveCallbackFromPage;
const callbackFromPage = new Promise(res => resolveCallbackFromPage = res);

// Expose the callBack function on the page, this is what the page will call when it wants to trigger the render
await page.exposeFunction('callPhantom', () => {
  console.log('callPhantom called on page');
  resolveCallbackFromPage();
});

await page.goto('https://google.com');

// Wait for the callback on the page to be called, or the timeout - whichever comes first
try {
  await Promise.race([callbackFromPage, timeout]);
} catch (err){
  console.error(err);
}

await browser.close();

})();
