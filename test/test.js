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
const fs = require('fs');
const rm = require('rimraf').sync;
const path = require('path');
const {TestServer} = require('../utils/testserver/');
const GoldenUtils = require('./golden-utils');
const GOLDEN_DIR = path.join(__dirname, 'golden');
const OUTPUT_DIR = path.join(__dirname, 'output');
const {TestRunner, Reporter, Matchers} = require('../utils/testrunner/');
const utils = require('./utils');

const {helper, assert} = require('../lib/helper');
if (process.env.COVERAGE)
  helper.recordPublicAPICoverage();

const puppeteer = utils.requireRoot('index');

const YELLOW_COLOR = '\x1b[33m';
const RESET_COLOR = '\x1b[0m';

const headless = (process.env.HEADLESS || 'true').trim().toLowerCase() === 'true';
const executablePath = process.env.CHROME;

if (executablePath)
  console.warn(`${YELLOW_COLOR}WARN: running tests with ${executablePath}${RESET_COLOR}`);
// Make sure the `npm install` was run after the chromium roll.
assert(fs.existsSync(puppeteer.executablePath()), `Chromium is not Downloaded. Run 'npm install' and try to re-run tests`);

const slowMo = parseInt((process.env.SLOW_MO || '0').trim(), 10);
const defaultBrowserOptions = {
  handleSIGINT: false,
  executablePath,
  slowMo,
  headless,
  dumpio: (process.env.DUMPIO || 'false').trim().toLowerCase() === 'true',
  args: ['--no-sandbox']
};

let parallel = 1;
if (process.env.PPTR_PARALLEL_TESTS)
  parallel = parseInt(process.env.PPTR_PARALLEL_TESTS.trim(), 10);
const parallelArgIndex = process.argv.indexOf('-j');
if (parallelArgIndex !== -1)
  parallel = parseInt(process.argv[parallelArgIndex + 1], 10);
require('events').defaultMaxListeners *= parallel;

const timeout = slowMo ? 0 : 10 * 1000;
const testRunner = new TestRunner({timeout, parallel});
const {expect} = new Matchers({
  toBeGolden: GoldenUtils.compare.bind(null, GOLDEN_DIR, OUTPUT_DIR)
});
const {describe, it, xit, beforeAll, afterAll, beforeEach, afterEach} = testRunner;

if (fs.existsSync(OUTPUT_DIR))
  rm(OUTPUT_DIR);

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

  const httpsPort = port + 1;
  state.httpsServer = await TestServer.createHTTPS(assetsPath, httpsPort);
  state.httpsServer.enableHTTPCache(cachedPath);
  state.httpsServer.PORT = httpsPort;
  state.httpsServer.PREFIX = `https://localhost:${httpsPort}`;
  state.httpsServer.CROSS_PROCESS_PREFIX = `https://127.0.0.1:${httpsPort}`;
  state.httpsServer.EMPTY_PAGE = `https://localhost:${httpsPort}/empty.html`;
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

describe('Browser', function() {
  beforeAll(async state => {
    state.browser = await puppeteer.launch(defaultBrowserOptions);
  });

  afterAll(async state => {
    await state.browser.close();
    state.browser = null;
  });

  beforeEach(async(state, test) => {
    const rl = require('readline').createInterface({input: state.browser.process().stderr});
    test.output = '';
    rl.on('line', onLine);
    state.tearDown = () => {
      rl.removeListener('line', onLine);
      rl.close();
    };
    function onLine(line) {
      test.output += line + '\n';
    }
  });

  afterEach(async state => {
    state.tearDown();
  });

  describe('Page', function() {
    beforeEach(async state => {
      state.context = await state.browser.createIncognitoBrowserContext();
      state.page = await state.context.newPage();
    });

    afterEach(async state => {
      // This closes all pages.
      await state.context.close();
      state.context = null;
      state.page = null;
    });

    // Page-level tests that are given a browser, a context and a page.
    // Each test is launched in a new browser context.
    require('./CDPSession.spec.js').addTests({testRunner, expect});
    require('./browser.spec.js').addTests({testRunner, expect, headless});
    require('./cookies.spec.js').addTests({testRunner, expect});
    require('./coverage.spec.js').addTests({testRunner, expect});
    require('./elementhandle.spec.js').addTests({testRunner, expect});
    require('./frame.spec.js').addTests({testRunner, expect});
    require('./input.spec.js').addTests({testRunner, expect});
    require('./jshandle.spec.js').addTests({testRunner, expect});
    require('./network.spec.js').addTests({testRunner, expect});
    require('./page.spec.js').addTests({testRunner, expect, headless});
    require('./target.spec.js').addTests({testRunner, expect});
    require('./tracing.spec.js').addTests({testRunner, expect});
    require('./worker.spec.js').addTests({testRunner, expect});
  });

  // Browser-level tests that are given a browser.
  require('./browsercontext.spec.js').addTests({testRunner, expect});
});

// Top-level tests that launch Browser themselves.
require('./ignorehttpserrors.spec.js').addTests({testRunner, expect, defaultBrowserOptions});
require('./puppeteer.spec.js').addTests({testRunner, expect, defaultBrowserOptions});
require('./headful.spec.js').addTests({testRunner, expect, defaultBrowserOptions});

if (process.env.COVERAGE) {
  describe('COVERAGE', function() {
    const coverage = helper.publicAPICoverage();
    const disabled = new Set(['page.bringToFront']);
    if (!headless)
      disabled.add('page.pdf');

    for (const method of coverage.keys()) {
      (disabled.has(method) ? xit : it)(`public api '${method}' should be called`, async({page, server}) => {
        expect(coverage.get(method)).toBe(true);
      });
    }
  });
}

if (process.env.CI && testRunner.hasFocusedTestsOrSuites()) {
  console.error('ERROR: "focused" tests/suites are prohibitted on bots. Remove any "fit"/"fdescribe" declarations.');
  process.exit(1);
}

new Reporter(testRunner, utils.projectRoot());
testRunner.run();
