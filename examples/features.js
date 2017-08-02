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

const path = require('path');
const Browser = require('../lib/Browser');
let browser = new Browser();

browser.newPage().then(async page => {
  let modernizrPath = path.join(__dirname, '../third_party/phantomjs/examples/modernizr.js');
  await page.injectFile(modernizrPath);
  page.on('console', console.log);
  await page.evaluate(detectFeatures);
  browser.close();
});

function detectFeatures() {
  let supported = [], unsupported = [];
  console.log('Detected features (using Modernizr ' + Modernizr._version + '):');
  for (let feature in Modernizr) {
    if (Modernizr.hasOwnProperty(feature)) {
      if (feature[0] !== '_' && typeof Modernizr[feature] !== 'function' &&
                feature !== 'input' && feature !== 'inputtypes') {
        if (Modernizr[feature])
          supported.push(feature);
        else
          unsupported.push(feature);

      }
    }
  }

  console.log('');
  console.log('Supported:');
  supported.forEach(function(e) {
    console.log('  ' + e);
  });

  console.log('');
  console.log('Not supported:');
  unsupported.forEach(function(e) {
    console.log('  ' + e);
  });
}
