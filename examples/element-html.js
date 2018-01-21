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

/**
 * @fileoverview Gets HTML of the top search element from developers.google.com/web
 * using page.evaluate() and page.evaluateHandle() to show the difference between these two methods
 **/

'use strict';

const puppeteer = require('puppeteer');

(async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://developers.google.com/web/');

  const elementHandle = await page.$('#top-search');
  const pageFunction = element => element.innerHTML;

  // page.evaluate() evaluates pageFunction in page context and returns javascript-object
  const jsObject = await page.evaluate(pageFunction, elementHandle);

  // page.evaluateHandler() evaluates pageFunction in page context and returns in-page object (JSHandle)
  const jsHandle = await page.evaluateHandle(pageFunction, elementHandle);

  // to show the difference between two methods
  console.log(`jsObject is NOT equal to jsHandle: ${jsObject !== jsHandle}`); // prints true
  console.log(`jsObject is equal to jsHandle.jsonValue(): ${jsObject === (await jsHandle.jsonValue())}`); // prints true

  await browser.close();
})();
