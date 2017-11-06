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

// const puppeteer = require('puppeteer');
const puppeteer = require('..');

(async() => {

const browser = await puppeteer.launch({headless: false});
const page = await browser.newPage();
await page.goto('https://github.com/');

await page.waitFor('input[name=q]');
// Type our query into the search bar
await page.type('input[name=q]', 'puppeteer', {delay: 20}, function(char, text){
  console.log(text)
});


let t = await page.$('input[name=q]')
await t.type('aaaaaa', {delay: 20}, function(char, text){
  console.log(text)
});

await browser.close();

})();
