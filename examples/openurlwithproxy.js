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

let Browser = require('../lib/Browser');

if (process.argv.length < 5) {
  console.log('Usage: openurlwithproxy.js <proxyHost> <proxyPort> <URL>');
  return;
}

let host = process.argv[2];
let port = process.argv[3];
let address = process.argv[4];

let browser = new Browser({
  args: [`--proxy-server=${host}:${port}`]
});
browser.newPage().then(async page => {
  let success = await page.navigate(address);
  if (success) {
    console.log('Page title is ' + (await page.title()));
  } else {
    console.log('FAIL to load the address "' +
            address + '" using proxy "' + host + ':' + port + '"');
  }
  browser.close();
});
