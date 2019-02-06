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
const path = require('path');
const {TestServer} = require('../utils/testserver/');
const {TestRunner, Reporter} = require('../utils/testrunner/');
const utils = require('./utils');

let parallel = 1;
if (process.env.PPTR_PARALLEL_TESTS)
  parallel = parseInt(process.env.PPTR_PARALLEL_TESTS.trim(), 10);
const parallelArgIndex = process.argv.indexOf('-j');
if (parallelArgIndex !== -1)
  parallel = parseInt(process.argv[parallelArgIndex + 1], 10);
require('events').defaultMaxListeners *= parallel;

// Timeout to 20 seconds on Appveyor instances.
let timeout = process.env.APPVEYOR ? 20 * 1000 : 10 * 1000;
if (!isNaN(process.env.TIMEOUT))
  timeout = parseInt(process.env.TIMEOUT, 10);
const testRunner = new TestRunner({timeout, parallel});
const {describe, fdescribe, beforeAll, afterAll, beforeEach, afterEach} = testRunner;

console.log('Testing on Node', process.version);

beforeAll(async state => {
  const assetsPath = path.join(__dirname, 'assets');
  const cachedPath = path.join(__dirname, 'assets', 'cached');

  const port = 8907 + state.parallelIndex * 2;
  state.server = await TestServer.create(assetsPath, port);
  state.server.enableHTTPCache(cachedPath);
  state.server.PORT = port;
  state.server.PREFIX = `http://localhost:${port}`;
  state.server.CROSS_PROCESS_PREFIX = `http://127.0.0.1:${port}`;
  state.server.EMPTY_PAGE = `http://localhost:${port}/empty.html`;
  state.server.EMPTY_PAGE2 = `http://localhost:${port}/empty2.html`;

  const httpsPort = port + 1;
  state.httpsServer = await TestServer.createHTTPS(assetsPath, httpsPort);
  state.httpsServer.enableHTTPCache(cachedPath);
  state.httpsServer.PORT = httpsPort;
  state.httpsServer.PREFIX = `https://localhost:${httpsPort}`;
  state.httpsServer.CROSS_PROCESS_PREFIX = `https://127.0.0.1:${httpsPort}`;
  state.httpsServer.EMPTY_PAGE = `https://localhost:${httpsPort}/empty.html`;
  state.httpsServer.EMPTY_PAGE2 = `https://localhost:${httpsPort}/empty2.html`;
});

afterAll(async({server, httpsServer}) => {
  await Promise.all([
    server.stop(),
    httpsServer.stop(),
  ]);
});

beforeEach(async({server, httpsServer}) => {
  server.reset();
  httpsServer.reset();
});

const CHROMIUM_NO_COVERAGE = new Set([
  'page.bringToFront',
  'securityDetails.subjectName',
  'securityDetails.issuer',
  'securityDetails.validFrom',
  'securityDetails.validTo',
]);

if (process.env.BROWSER !== 'firefox') {
  testRunner.addTestDSL('it_fails_ffox', 'run');
  testRunner.addSuiteDSL('describe_fails_ffox', 'run');
  describe('Chromium', () => {
    require('./puppeteer.spec.js').addTests({
      product: 'Chromium',
      puppeteer: utils.requireRoot('index'),
      Errors: utils.requireRoot('Errors'),
      DeviceDescriptors: utils.requireRoot('DeviceDescriptors'),
      testRunner,
    });
    if (process.env.COVERAGE)
      utils.recordAPICoverage(testRunner, require('../lib/api'), CHROMIUM_NO_COVERAGE);
  });
} else {
  const FFOX_SKIPPED_TESTS = Symbol('FFOX_SKIPPED_TESTS');
  testRunner.addTestDSL('it_fails_ffox', 'skip', FFOX_SKIPPED_TESTS);
  testRunner.addSuiteDSL('describe_fails_ffox', 'skip', FFOX_SKIPPED_TESTS);
  describe('Firefox', () => {
    require('./puppeteer.spec.js').addTests({
      product: 'Firefox',
      puppeteer: require('../experimental/puppeteer-firefox'),
      Errors: require('../experimental/puppeteer-firefox/Errors'),
      DeviceDescriptors: utils.requireRoot('DeviceDescriptors'),
      testRunner,
    });
  });

  if (process.argv.indexOf('--firefox-status') !== -1) {
    const allTests = testRunner.tests();
    const ffoxTests = allTests.filter(test => {
      if (test.comment === FFOX_SKIPPED_TESTS)
        return false;
      for (let suite = test.suite; suite; suite = suite.parentSuite) {
        if (suite.comment === FFOX_SKIPPED_TESTS)
          return false;
      }
      return true;
    });
    console.log(JSON.stringify({
      allTests: allTests.length,
      firefoxTests: ffoxTests.length
    }));
    process.exit(0);
  }
}

if (process.env.CI && testRunner.hasFocusedTestsOrSuites()) {
  console.error('ERROR: "focused" tests/suites are prohibitted on bots. Remove any "fit"/"fdescribe" declarations.');
  process.exit(1);
}

new Reporter(testRunner, {
  projectFolder: utils.projectRoot(),
  showSlowTests: process.env.CI ? 5 : 0,
});
testRunner.run();
