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
const path = require('path');
const {TestServer} = require('@pptr/testserver');
const {TestRunner, Reporter} = require('@pptr/testrunner');

let parallel = 1;
const parallelArgIndex = process.argv.indexOf('-j');
if (parallelArgIndex !== -1)
  parallel = parseInt(process.argv[parallelArgIndex + 1], 10);
require('events').defaultMaxListeners *= parallel;

let timeout = 10000;
if (!isNaN(process.env.TIMEOUT))
  timeout = parseInt(process.env.TIMEOUT, 10);
const testRunner = new TestRunner({timeout, parallel});

console.log('Testing on Node', process.version);

testRunner.beforeAll(async state => {
  const assetsPath = path.join(__dirname, 'assets');

  const port = 8907 + state.parallelIndex * 2;
  state.server = await TestServer.create(assetsPath, port);
  state.server.PORT = port;
  state.server.PREFIX = `http://localhost:${port}`;
  state.server.EMPTY_PAGE = `http://localhost:${port}/empty.html`;
  state.server.EMPTY_PAGE2 = `http://localhost:${port}/empty2.html`;

  const httpsPort = port + 1;
  state.httpsServer = await TestServer.createHTTPS(assetsPath, httpsPort);
  state.httpsServer.PORT = httpsPort;
  state.httpsServer.PREFIX = `https://localhost:${httpsPort}`;
  state.httpsServer.EMPTY_PAGE = `https://localhost:${httpsPort}/empty.html`;
  state.httpsServer.EMPTY_PAGE2 = `https://localhost:${httpsPort}/empty2.html`;
});

testRunner.afterAll(async({server, httpsServer}) => {
  await Promise.all([
    server.stop(),
    httpsServer.stop(),
  ]);
});

testRunner.beforeEach(async({server, httpsServer}) => {
  server.reset();
  httpsServer.reset();
});

const product = process.env['PRODUCT'];
const pptrFirefox = require('..');
const pptrChromium = require('puppeteer');
if (product) {
  console.log(`WARNING: Running with ${product} only product because of PRODUCT env`);
  require('./puppeteer.spec.js').addTests({testRunner, product, puppeteer: product === 'chromium' ? pptrChromium : pptrFirefox});
} else {
  require('./puppeteer.spec.js').addTests({testRunner, product: 'chromium', puppeteer: pptrChromium});
  require('./puppeteer.spec.js').addTests({testRunner, product: 'firefox', puppeteer: pptrFirefox});
}

if (process.env.CI && testRunner.hasFocusedTestsOrSuites()) {
  console.error('ERROR: "focused" tests/suites are prohibitted on bots. Remove any "fit"/"fdescribe" declarations.');
  process.exit(1);
}

new Reporter(testRunner, path.join(__dirname, '..'));
testRunner.run();
