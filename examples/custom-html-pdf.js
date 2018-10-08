/**
 * Copyright 2018 Google Inc. All rights reserved.
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
 * Render your custom HTML and save it to PDF file
 */

'use strict';

const puppeteer = require('puppeteer');

const YOUR_HTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Example HTML</title>
  <!-- you can link any local/external file -->
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <!-- also you can run any script here -->
  <script src="js/scripts.js"></script>
  <article>
    <h1>Google Chrome</h1>
    <p>Google Chrome is a free, open-source web browser developed by Google, released in 2008.</p>
  </article>
</body>
</html>
`;

(async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // set your content and wait until render is finished
  await page.goto(`data:text/html,${YOUR_HTML}`, { waitUntil: 'networkidle0' });

  // page.pdf() is currently supported only in headless mode.
  // @see https://bugs.chromium.org/p/chromium/issues/detail?id=753118
  await page.pdf({ path: 'my_file.pdf', format: 'A4' });

  await browser.close();
})();
