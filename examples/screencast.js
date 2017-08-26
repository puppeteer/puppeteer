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

const puppeteer = require('../index.js');
const fs = require('fs');

(async() => {

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

let frameCount = 0;
page.on('screencastframe', async frame => {
  await page.screencastFrameAck(frame.sessionId);

  fs.writeFileSync('frame' + frameCount + '.jpg', frame.data, 'base64');
  frameCount++;

  if (frameCount > 25)
    await browser.close();
});

await page.startScreencast({format: 'jpeg', everyNthFrame: 1});

})();
