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

const puppeteer = require('puppeteer');

(async() => {

const browser = await puppeteer.launch();
const page = await browser.newPage();
// Adjustments particular to this page to ensure we hit desktop breakpoint.
page.setViewport({width: 1000, height: 600, deviceScaleFactor: 1});

await page.goto('https://www.chromestatus.com/samples', {waitUntil: 'networkidle'});

/**
 * Takes a screenshot of a DOM element on the page, with optional padding.
 *
 * @param {!{path:string, selector:string, padding:(number|undefined)}=} opts
 * @return {!Promise<!Buffer>}
 */
async function screenshotDOMElement(opts = {}) {
  const padding = 'padding' in opts ? opts.padding : 0;
  const path = 'path' in opts ? opts.path : null;
  const selector = opts.selector;

  if (!selector)
    throw Error('Please provide a selector.');

  const rect = await page.evaluate(selector => {
    const element = document.querySelector(selector);
    if (!element)
      return null;
    const {x, y, width, height} = element.getBoundingClientRect();
    return {left: x, top: y, width, height, id: element.id};
  }, selector);

  if (!rect)
    throw Error(`Could not find element that matches selector: ${selector}.`);

  return await page.screenshot({
    path,
    clip: {
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    }
  });
}

await screenshotDOMElement({
  path: 'element.png',
  selector: 'header aside',
  padding: 16
});

browser.close();

})();
