/**
 * Copyright 2017 Google Inc., PhantomJS Authors All rights reserved.
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

// TODO: screencast API doesn't not support deviceScaleFactor atm.
await page.setViewport({width: 1000, height: 800, deviceScaleFactor: 2});

page.screencast.on('frame', frame => {
  console.log('Frame captured @', frame.metadata.timestamp);
});

await page.screencast.start({path: 'video.webm'});

console.log('Capturing screencast for actions...');

const tic = Date.now();
await page.goto('https://www.chromestatus.com/', {waitUntil: 'networkidle'});

// Wait for features list to show up.
await page.waitForFunction("document.querySelector('chromedash-featurelist').features.length > 1");

await page.focus('.search input[type="search"]');
await page.type('Headless Chrome', {delay: 100}); // slow down, as if user was typing.
await page.waitFor(100); // wait for results to be filtered.

// Search for the "Headless Chrome" feature and open the card.
const nextURL = await page.$eval('chromedash-featurelist', features => {
  const item = features.shadowRoot.querySelector('#ironlist .item:not([hidden])');
  const card = item.querySelector('chromedash-feature');
  card.toggle();
  return card.feature.resources.docs[0]; // extract doc link from data model.
});

await page.waitFor(2000); // pause

await page.goto(nextURL);

const seconds = (Date.now() - tic) / 1000;
const frames = await page.screencast.stop();
const fps = frames.length / seconds;

console.log(`Captured ${frames.length} frames`);
console.log(`Duration: ${seconds}s`);
console.log(`FPS: ~${fps}`);

await browser.close();

})();

