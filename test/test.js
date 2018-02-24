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
const os = require('os');
const rm = require('rimraf').sync;
const path = require('path');
const {helper} = require('../lib/helper');
if (process.env.COVERAGE)
  helper.recordPublicAPICoverage();
const mkdtempAsync = helper.promisify(fs.mkdtemp);
const readFileAsync = helper.promisify(fs.readFile);
const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');

const PROJECT_ROOT = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');

const puppeteer = require(PROJECT_ROOT);
const DeviceDescriptors = require(path.join(PROJECT_ROOT, 'DeviceDescriptors'));
const iPhone = DeviceDescriptors['iPhone 6'];
const iPhoneLandscape = DeviceDescriptors['iPhone 6 landscape'];

const SimpleServer = require('./server/SimpleServer');
const GoldenUtils = require('./golden-utils');
const FrameUtils = require('./frame-utils');

const YELLOW_COLOR = '\x1b[33m';
const RESET_COLOR = '\x1b[0m';

const GOLDEN_DIR = path.join(__dirname, 'golden');
const OUTPUT_DIR = path.join(__dirname, 'output');

const headless = (process.env.HEADLESS || 'true').trim().toLowerCase() === 'true';
const slowMo = parseInt((process.env.SLOW_MO || '0').trim(), 10);
const executablePath = process.env.CHROME;

console.log('Testing on Node', process.version);
if (executablePath)
  console.warn(`${YELLOW_COLOR}WARN: running tests with ${executablePath}${RESET_COLOR}`);
// Make sure the `npm install` was run after the chromium roll.
console.assert(fs.existsSync(puppeteer.executablePath()), `Chromium is not Downloaded. Run 'npm install' and try to re-run tests`);

const defaultBrowserOptions = {
  executablePath,
  slowMo,
  headless,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
};

const timeout = slowMo ? 0 : 10 * 1000;
let parallel = 1;
if (process.env.PPTR_PARALLEL_TESTS)
  parallel = parseInt(process.env.PPTR_PARALLEL_TESTS.trim(), 10);
const parallelArgIndex = process.argv.indexOf('-j');
if (parallelArgIndex !== -1)
  parallel = parseInt(process.argv[parallelArgIndex + 1], 10);
require('events').defaultMaxListeners *= parallel;

const {TestRunner, Reporter, Matchers} = require('../utils/testrunner/');
const runner = new TestRunner({timeout, parallel});
new Reporter(runner);

const {describe, xdescribe, fdescribe} = runner;
const {it, fit, xit} = runner;
const {beforeAll, beforeEach, afterAll, afterEach} = runner;

const {expect} = new Matchers({
  toBeGolden: GoldenUtils.compare.bind(null, GOLDEN_DIR, OUTPUT_DIR)
});

if (fs.existsSync(OUTPUT_DIR))
  rm(OUTPUT_DIR);

beforeAll(async state  => {
  const assetsPath = path.join(__dirname, 'assets');
  const cachedPath = path.join(__dirname, 'assets', 'cached');

  const port = 8907 + state.parallelIndex * 2;
  state.server = await SimpleServer.create(assetsPath, port);
  state.server.enableHTTPCache(cachedPath);
  state.server.PREFIX = `http://localhost:${port}`;
  state.server.CROSS_PROCESS_PREFIX = `http://127.0.0.1:${port}`;
  state.server.EMPTY_PAGE = `http://localhost:${port}/empty.html`;

  const httpsPort = port + 1;
  state.httpsServer = await SimpleServer.createHTTPS(assetsPath, httpsPort);
  state.httpsServer.enableHTTPCache(cachedPath);
  state.httpsServer.PREFIX = `https://localhost:${httpsPort}`;
  state.httpsServer.CROSS_PROCESS_PREFIX = `https://127.0.0.1:${httpsPort}`;
  state.httpsServer.EMPTY_PAGE = `https://localhost:${httpsPort}/empty.html`;
});

beforeEach(async({server, httpsServer}) => {
  server.reset();
  httpsServer.reset();
});

afterAll(async({server, httpsServer}) => {
  await Promise.all([
    server.stop(),
    httpsServer.stop(),
  ]);
});

describe('Puppeteer', function() {
  describe('BrowserFetcher', function() {
    it('should download and extract linux binary', async({server}) => {
      const downloadsFolder = await mkdtempAsync(TMP_FOLDER);
      const browserFetcher = puppeteer.createBrowserFetcher({
        platform: 'linux',
        path: downloadsFolder,
        host: server.PREFIX
      });
      let revisionInfo = browserFetcher.revisionInfo('123456');
      server.setRoute(revisionInfo.url.substring(server.PREFIX.length), (req, res) => {
        server.serveFile(req, res, '/chromium-linux.zip');
      });

      expect(revisionInfo.local).toBe(false);
      expect(browserFetcher.platform()).toBe('linux');
      expect(await browserFetcher.canDownload('100000')).toBe(false);
      expect(await browserFetcher.canDownload('123456')).toBe(true);

      revisionInfo = await browserFetcher.download('123456');
      expect(revisionInfo.local).toBe(true);
      expect(await readFileAsync(revisionInfo.executablePath, 'utf8')).toBe('LINUX BINARY\n');
      expect(await browserFetcher.localRevisions()).toEqual(['123456']);
      await browserFetcher.remove('123456');
      expect(await browserFetcher.localRevisions()).toEqual([]);
      rm(downloadsFolder);
    });
  });
  describe('AppMode', function() {
    it('should work', async() => {
      const options = Object.assign({appMode: true}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      expect(await page.evaluate('11 * 11')).toBe(121);
      await page.close();
      await browser.close();
    });
  });
  describe('Puppeteer.launch', function() {
    it('should support ignoreHTTPSErrors option', async({httpsServer}) => {
      const options = Object.assign({ignoreHTTPSErrors: true}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      let error = null;
      const response = await page.goto(httpsServer.EMPTY_PAGE).catch(e => error = e);
      expect(error).toBe(null);
      expect(response.ok()).toBe(true);
      expect(response.securityDetails()).toBeTruthy();
      expect(response.securityDetails().protocol()).toBe('TLS 1.2');
      await page.close();
      await browser.close();
    });
    it('Network redirects should report SecurityDetails', async({httpsServer}) => {
      const options = Object.assign({ignoreHTTPSErrors: true}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      httpsServer.setRedirect('/plzredirect', '/empty.html');
      const responses =  [];
      page.on('response', response => responses.push(response));
      await page.goto(httpsServer.PREFIX + '/plzredirect');
      expect(responses.length).toBe(2);
      expect(responses[0].status()).toBe(302);
      const securityDetails = responses[0].securityDetails();
      expect(securityDetails.protocol()).toBe('TLS 1.2');
      await page.close();
      await browser.close();
    });
    it('should reject all promises when browser is closed', async() => {
      const browser = await puppeteer.launch(defaultBrowserOptions);
      const page = await browser.newPage();
      let error = null;
      const neverResolves = page.evaluate(() => new Promise(r => {})).catch(e => error = e);
      await browser.close();
      await neverResolves;
      expect(error.message).toContain('Protocol error');
    });
    it('should reject if executable path is invalid', async({server}) => {
      let waitError = null;
      const options = Object.assign({}, defaultBrowserOptions, {executablePath: 'random-invalid-path'});
      await puppeteer.launch(options).catch(e => waitError = e);
      expect(waitError.message.startsWith('Failed to launch chrome! spawn random-invalid-path ENOENT')).toBe(true);
    });
    it('userDataDir option', async({server}) => {
      const userDataDir = await mkdtempAsync(TMP_FOLDER);
      const options = Object.assign({userDataDir}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
      await browser.close();
      expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
      rm(userDataDir);
    });
    it('userDataDir argument', async({server}) => {
      const userDataDir = await mkdtempAsync(TMP_FOLDER);
      const options = Object.assign({}, defaultBrowserOptions);
      options.args = [`--user-data-dir=${userDataDir}`].concat(options.args);
      const browser = await puppeteer.launch(options);
      expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
      await browser.close();
      expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
      rm(userDataDir);
    });
    it('userDataDir option should restore state', async({server}) => {
      const userDataDir = await mkdtempAsync(TMP_FOLDER);
      const options = Object.assign({userDataDir}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => localStorage.hey = 'hello');
      await browser.close();

      const browser2 = await puppeteer.launch(options);
      const page2 = await browser2.newPage();
      await page2.goto(server.EMPTY_PAGE);
      expect(await page2.evaluate(() => localStorage.hey)).toBe('hello');
      await browser2.close();
      rm(userDataDir);
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/1537
    xit('userDataDir option should restore cookies', async({server}) => {
      const userDataDir = await mkdtempAsync(TMP_FOLDER);
      const options = Object.assign({userDataDir}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => document.cookie = 'doSomethingOnlyOnce=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
      await browser.close();

      const browser2 = await puppeteer.launch(options);
      const page2 = await browser2.newPage();
      await page2.goto(server.EMPTY_PAGE);
      expect(await page2.evaluate(() => document.cookie)).toBe('doSomethingOnlyOnce=true');
      await browser2.close();
      rm(userDataDir);
    });
    xit('headless should be able to read cookies written by headful', async({server}) => {
      const userDataDir = await mkdtempAsync(TMP_FOLDER);
      const options = Object.assign({userDataDir}, defaultBrowserOptions);
      // Write a cookie in headful chrome
      options.headless = false;
      const headfulBrowser = await puppeteer.launch(options);
      const headfulPage = await headfulBrowser.newPage();
      await headfulPage.goto(server.EMPTY_PAGE);
      await headfulPage.evaluate(() => document.cookie = 'foo=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
      await headfulBrowser.close();
      // Read the cookie from headless chrome
      options.headless = true;
      const headlessBrowser = await puppeteer.launch(options);
      const headlessPage = await headlessBrowser.newPage();
      await headlessPage.goto(server.EMPTY_PAGE);
      const cookie = await headlessPage.evaluate(() => document.cookie);
      await headlessBrowser.close();
      rm(userDataDir);
      expect(cookie).toBe('foo=true');
    });
    it('should return the default chrome arguments', async() => {
      const args = puppeteer.defaultArgs();
      expect(args).toContain('--no-first-run');
    });
    it('should dump browser process stderr', async({server}) => {
      const dumpioTextToLog = 'MAGIC_DUMPIO_TEST';
      let dumpioData = '';
      const {spawn} = require('child_process');
      const options = Object.assign({dumpio: true}, defaultBrowserOptions);
      const res = spawn('node',
          [path.join(__dirname, 'fixtures', 'dumpio.js'), PROJECT_ROOT, JSON.stringify(options), server.EMPTY_PAGE, dumpioTextToLog]);
      res.stderr.on('data', data => dumpioData += data.toString('utf8'));
      await new Promise(resolve => res.on('close', resolve));

      expect(dumpioData).toContain(dumpioTextToLog);
    });
  });
  describe('Puppeteer.connect', function() {
    it('should be able to connect multiple times to the same browser', async({server}) => {
      const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
      const browser = await puppeteer.connect({
        browserWSEndpoint: originalBrowser.wsEndpoint()
      });
      const page = await browser.newPage();
      expect(await page.evaluate(() => 7 * 8)).toBe(56);
      browser.disconnect();

      const secondPage = await originalBrowser.newPage();
      expect(await secondPage.evaluate(() => 7 * 6)).toBe(42, 'original browser should still work');
      await originalBrowser.close();
    });
    it('should be able to reconnect to a disconnected browser', async({server}) => {
      const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
      const browserWSEndpoint = originalBrowser.wsEndpoint();
      const page = await originalBrowser.newPage();
      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      originalBrowser.disconnect();

      const browser = await puppeteer.connect({browserWSEndpoint});
      const pages = await browser.pages();
      const restoredPage = pages.find(page => page.url() === server.PREFIX + '/frames/nested-frames.html');
      expect(FrameUtils.dumpFrames(restoredPage.mainFrame())).toBeGolden('reconnect-nested-frames.txt');
      expect(await restoredPage.evaluate(() => 7 * 8)).toBe(56);
      await browser.close();
    });
  });
  describe('Puppeteer.executablePath', function() {
    it('should work', async({server}) => {
      const executablePath = puppeteer.executablePath();
      expect(fs.existsSync(executablePath)).toBe(true);
    });
  });
});

describe('Page', function() {
  beforeAll(async state => {
    state.browser = await puppeteer.launch(defaultBrowserOptions);
  });

  afterAll(async state => {
    await state.browser.close();
    state.browser = null;
  });

  beforeEach(async state => {
    state.page = await state.browser.newPage();
  });

  afterEach(async state => {
    await state.page.close();
    state.page = null;
  });

  describe('Browser.version', function() {
    it('should return whether we are in headless', async({browser}) => {
      const version = await browser.version();
      expect(version.length).toBeGreaterThan(0);
      expect(version.startsWith('Headless')).toBe(headless);
    });
  });

  describe('Browser.userAgent', function() {
    it('should include WebKit', async({browser}) => {
      const userAgent = await browser.userAgent();
      expect(userAgent.length).toBeGreaterThan(0);
      expect(userAgent).toContain('WebKit');
    });
  });

  describe('Browser.process', function() {
    it('should return child_process instance', async function({browser}) {
      const process = await browser.process();
      expect(process.pid).toBeGreaterThan(0);
      const browserWSEndpoint = browser.wsEndpoint();
      const remoteBrowser = await puppeteer.connect({browserWSEndpoint});
      expect(remoteBrowser.process()).toBe(null);
      await remoteBrowser.disconnect();
    });
  });

  describe('Browser.Events.disconnected', function() {
    it('should emitted when: browser gets closed, disconnected or underlying websocket gets closed', async() => {
      const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
      const browserWSEndpoint = originalBrowser.wsEndpoint();
      const remoteBrowser1 = await puppeteer.connect({browserWSEndpoint});
      const remoteBrowser2 = await puppeteer.connect({browserWSEndpoint});

      let disconnectedOriginal = 0;
      let disconnectedRemote1 = 0;
      let disconnectedRemote2 = 0;
      originalBrowser.on('disconnected', () => ++disconnectedOriginal);
      remoteBrowser1.on('disconnected', () => ++disconnectedRemote1);
      remoteBrowser2.on('disconnected', () => ++disconnectedRemote2);

      await remoteBrowser2.disconnect();
      expect(disconnectedOriginal).toBe(0);
      expect(disconnectedRemote1).toBe(0);
      expect(disconnectedRemote2).toBe(1);

      await originalBrowser.close();
      expect(disconnectedOriginal).toBe(1);
      expect(disconnectedRemote1).toBe(1);
      expect(disconnectedRemote2).toBe(1);
    });
  });

  describe('Page.close', function() {
    it('should reject all promises when page is closed', async({browser}) => {
      const newPage = await browser.newPage();
      const neverResolves = newPage.evaluate(() => new Promise(r => {}));
      newPage.close();
      let error = null;
      await neverResolves.catch(e => error = e);
      expect(error.message).toContain('Protocol error');
    });
    it('should not be visible in browser.pages', async({browser}) => {
      const newPage = await browser.newPage();
      expect(await browser.pages()).toContain(newPage);
      await newPage.close();
      expect(await browser.pages()).not.toContain(newPage);
    });
  });

  describe('Page.Events.error', function() {
    it('should throw when page crashes', async({page}) => {
      let error = null;
      page.on('error', err => error = err);
      page.goto('chrome://crash').catch(e => {});
      await waitForEvents(page, 'error');
      expect(error.message).toBe('Page crashed!');
    });
  });

  describe('Page.evaluate', function() {
    it('should work', async({page, server}) => {
      const result = await page.evaluate(() => 7 * 3);
      expect(result).toBe(21);
    });
    it('should throw when evaluation triggers reload', async({page, server}) => {
      let error = null;
      await page.evaluate(() => {
        location.reload();
        return new Promise(resolve => {
          setTimeout(() => resolve(1), 0);
        });
      }).catch(e => error = e);
      expect(error.message).toContain('Protocol error');
    });
    it('should await promise', async({page, server}) => {
      const result = await page.evaluate(() => Promise.resolve(8 * 7));
      expect(result).toBe(56);
    });
    it('should work right after framenavigated', async({page, server}) => {
      let frameEvaluation = null;
      page.on('framenavigated', async frame => {
        frameEvaluation = frame.evaluate(() => 6 * 7);
      });
      await page.goto(server.EMPTY_PAGE);
      expect(await frameEvaluation).toBe(42);
    });
    it('should work from-inside an exposed function', async({page, server}) => {
      // Setup inpage callback, which calls Page.evaluate
      await page.exposeFunction('callController', async function(a, b) {
        return await page.evaluate((a, b) => a * b, a, b);
      });
      const result = await page.evaluate(async function() {
        return await callController(9, 3);
      });
      expect(result).toBe(27);
    });
    it('should reject promise with exception', async({page, server}) => {
      let error = null;
      await page.evaluate(() => not.existing.object.property).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('not is not defined');
    });
    it('should return complex objects', async({page, server}) => {
      const object = {foo: 'bar!'};
      const result = await page.evaluate(a => a, object);
      expect(result).not.toBe(object);
      expect(result).toEqual(object);
    });
    it('should return NaN', async({page, server}) => {
      const result = await page.evaluate(() => NaN);
      expect(Object.is(result, NaN)).toBe(true);
    });
    it('should return -0', async({page, server}) => {
      const result = await page.evaluate(() => -0);
      expect(Object.is(result, -0)).toBe(true);
    });
    it('should return Infinity', async({page, server}) => {
      const result = await page.evaluate(() => Infinity);
      expect(Object.is(result, Infinity)).toBe(true);
    });
    it('should return -Infinity', async({page, server}) => {
      const result = await page.evaluate(() => -Infinity);
      expect(Object.is(result, -Infinity)).toBe(true);
    });
    it('should accept "undefined" as one of multiple parameters', async({page, server}) => {
      const result = await page.evaluate((a, b) => Object.is(a, undefined) && Object.is(b, 'foo'), undefined, 'foo');
      expect(result).toBe(true);
    });
    it('should properly serialize null fields', async({page}) => {
      expect(await page.evaluate(() => ({a: undefined}))).toEqual({});
    });
    it('should fail for window object', async({page, server}) => {
      const result = await page.evaluate(() => window);
      expect(result).toBe(undefined);
    });
    it('should fail for circular object', async({page, server}) => {
      const result = await page.evaluate(() => {
        const a = {};
        const b = {a};
        a.b = b;
        return a;
      });
      expect(result).toBe(undefined);
    });
    it('should accept a string', async({page, server}) => {
      const result = await page.evaluate('1 + 2');
      expect(result).toBe(3);
    });
    it('should accept a string with semi colons', async({page, server}) => {
      const result = await page.evaluate('1 + 5;');
      expect(result).toBe(6);
    });
    it('should accept a string with comments', async({page, server}) => {
      const result = await page.evaluate('2 + 5;\n// do some math!');
      expect(result).toBe(7);
    });
    it('should accept element handle as an argument', async({page, server}) => {
      await page.setContent('<section>42</section>');
      const element = await page.$('section');
      const text = await page.evaluate(e => e.textContent, element);
      expect(text).toBe('42');
    });
    it('should throw if underlying element was disposed', async({page, server}) => {
      await page.setContent('<section>39</section>');
      const element = await page.$('section');
      expect(element).toBeTruthy();
      await element.dispose();
      let error = null;
      await page.evaluate(e => e.textContent, element).catch(e => error = e);
      expect(error.message).toContain('JSHandle is disposed');
    });
    it('should throw if elementHandles are from other frames', async({page, server}) => {
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const bodyHandle = await page.frames()[1].$('body');
      let error = null;
      await page.evaluate(body => body.innerHTML, bodyHandle).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('JSHandles can be evaluated only in the context they were created');
    });
    it('should accept object handle as an argument', async({page, server}) => {
      const navigatorHandle = await page.evaluateHandle(() => navigator);
      const text = await page.evaluate(e => e.userAgent, navigatorHandle);
      expect(text).toContain('Mozilla');
    });
    it('should accept object handle to primitive types', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => 5);
      const isFive = await page.evaluate(e => Object.is(e, 5), aHandle);
      expect(isFive).toBeTruthy();
    });
  });

  describe('Page.setOfflineMode', function() {
    it('should work', async({page, server}) => {
      await page.setOfflineMode(true);
      let error = null;
      await page.goto(server.EMPTY_PAGE).catch(e => error = e);
      expect(error).toBeTruthy();
      await page.setOfflineMode(false);
      const response = await page.reload();
      expect(response.status()).toBe(200);
    });
    it('should emulate navigator.onLine', async({page, server}) => {
      expect(await page.evaluate(() => window.navigator.onLine)).toBe(true);
      await page.setOfflineMode(true);
      expect(await page.evaluate(() => window.navigator.onLine)).toBe(false);
      await page.setOfflineMode(false);
      expect(await page.evaluate(() => window.navigator.onLine)).toBe(true);
    });
  });

  describe('Page.evaluateHandle', function() {
    it('should work', async({page, server}) => {
      const windowHandle = await page.evaluateHandle(() => window);
      expect(windowHandle).toBeTruthy();
    });
  });

  describe('ExecutionContext.queryObjects', function() {
    it('should work', async({page, server}) => {
      // Instantiate an object
      await page.evaluate(() => window.set = new Set(['hello', 'world']));
      const prototypeHandle = await page.evaluateHandle(() => Set.prototype);
      const objectsHandle = await page.queryObjects(prototypeHandle);
      const count = await page.evaluate(objects => objects.length, objectsHandle);
      expect(count).toBe(1);
      const values = await page.evaluate(objects => Array.from(objects[0].values()), objectsHandle);
      expect(values).toEqual(['hello', 'world']);
    });
    it('should fail for disposed handles', async({page, server}) => {
      const prototypeHandle = await page.evaluateHandle(() => HTMLBodyElement.prototype);
      await prototypeHandle.dispose();
      let error = null;
      await page.queryObjects(prototypeHandle).catch(e => error = e);
      expect(error.message).toBe('Prototype JSHandle is disposed!');
    });
    it('should fail primitive values as prototypes', async({page, server}) => {
      const prototypeHandle = await page.evaluateHandle(() => 42);
      let error = null;
      await page.queryObjects(prototypeHandle).catch(e => error = e);
      expect(error.message).toBe('Prototype JSHandle must not be referencing primitive value');
    });
  });

  describe('JSHandle.getProperty', function() {
    it('should work', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => ({
        one: 1,
        two: 2,
        three: 3
      }));
      const twoHandle = await aHandle.getProperty('two');
      expect(await twoHandle.jsonValue()).toEqual(2);
    });
  });

  describe('JSHandle.jsonValue', function() {
    it('should work', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => ({foo: 'bar'}));
      const json = await aHandle.jsonValue();
      expect(json).toEqual({foo: 'bar'});
    });
    it('should not work with dates', async({page, server}) => {
      const dateHandle = await page.evaluateHandle(() => new Date('2017-09-26T00:00:00.000Z'));
      const json = await dateHandle.jsonValue();
      expect(json).toEqual({});
    });
    it('should throw for circular objects', async({page, server}) => {
      const windowHandle = await page.evaluateHandle('window');
      let error = null;
      await windowHandle.jsonValue().catch(e => error = e);
      expect(error.message).toContain('Object reference chain is too long');
    });
  });

  describe('JSHandle.getProperties', function() {
    it('should work', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => ({
        foo: 'bar'
      }));
      const properties = await aHandle.getProperties();
      const foo = properties.get('foo');
      expect(foo).toBeTruthy();
      expect(await foo.jsonValue()).toBe('bar');
    });
    it('should return even non-own properties', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => {
        class A {
          constructor() {
            this.a = '1';
          }
        }
        class B extends A {
          constructor() {
            super();
            this.b = '2';
          }
        }
        return new B();
      });
      const properties = await aHandle.getProperties();
      expect(await properties.get('a').jsonValue()).toBe('1');
      expect(await properties.get('b').jsonValue()).toBe('2');
    });
  });

  describe('JSHandle.asElement', function() {
    it('should work', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => document.body);
      const element = aHandle.asElement();
      expect(element).toBeTruthy();
    });
    it('should return null for non-elements', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => 2);
      const element = aHandle.asElement();
      expect(element).toBeFalsy();
    });
    it('should return ElementHandle for TextNodes', async({page, server}) => {
      await page.setContent('<div>ee!</div>');
      const aHandle = await page.evaluateHandle(() => document.querySelector('div').firstChild);
      const element = aHandle.asElement();
      expect(element).toBeTruthy();
      expect(await page.evaluate(e => e.nodeType === HTMLElement.TEXT_NODE, element));
    });
  });

  describe('JSHandle.toString', function() {
    it('should work for primitives', async({page, server}) => {
      const numberHandle = await page.evaluateHandle(() => 2);
      expect(numberHandle.toString()).toBe('JSHandle:2');
      const stringHandle = await page.evaluateHandle(() => 'a');
      expect(stringHandle.toString()).toBe('JSHandle:a');
    });
    it('should work for complicated objects', async({page, server}) => {
      const aHandle = await page.evaluateHandle(() => window);
      expect(aHandle.toString()).toBe('JSHandle@object');
    });
  });

  describe('Frame.context', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(page.frames().length).toBe(2);
      const [frame1, frame2] = page.frames();
      const context1 = await frame1.executionContext();
      const context2 = await frame2.executionContext();
      expect(context1).toBeTruthy();
      expect(context2).toBeTruthy();
      expect(context1 !== context2).toBeTruthy();
      expect(context1.frame()).toBe(frame1);
      expect(context2.frame()).toBe(frame2);

      await Promise.all([
        context1.evaluate(() => window.a = 1),
        context2.evaluate(() => window.a = 2)
      ]);
      const [a1, a2] = await Promise.all([
        context1.evaluate(() => window.a),
        context2.evaluate(() => window.a)
      ]);
      expect(a1).toBe(1);
      expect(a2).toBe(2);
    });
  });

  describe('Frame.evaluateHandle', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      const windowHandle = await mainFrame.evaluateHandle(() => window);
      expect(windowHandle).toBeTruthy();
    });
  });

  describe('Frame.evaluate', function() {
    it('should have different execution contexts', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(page.frames().length).toBe(2);
      const frame1 = page.frames()[0];
      const frame2 = page.frames()[1];
      await frame1.evaluate(() => window.FOO = 'foo');
      await frame2.evaluate(() => window.FOO = 'bar');
      expect(await frame1.evaluate(() => window.FOO)).toBe('foo');
      expect(await frame2.evaluate(() => window.FOO)).toBe('bar');
    });
    it('should execute after cross-site navigation', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      expect(await mainFrame.evaluate(() => window.location.href)).toContain('localhost');
      await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      expect(await mainFrame.evaluate(() => window.location.href)).toContain('127');
    });
  });

  describe('Frame.waitForFunction', function() {
    it('should accept a string', async({page, server}) => {
      const watchdog = page.waitForFunction('window.__FOO === 1');
      await page.evaluate(() => window.__FOO = 1);
      await watchdog;
    });
    it('should poll on interval', async({page, server}) => {
      let success = false;
      const startTime = Date.now();
      const polling = 100;
      const watchdog = page.waitForFunction(() => window.__FOO === 'hit', {polling})
          .then(() => success = true);
      await page.evaluate(() => window.__FOO = 'hit');
      expect(success).toBe(false);
      await page.evaluate(() => document.body.appendChild(document.createElement('div')));
      await watchdog;
      expect(Date.now() - startTime).not.toBeLessThan(polling / 2);
    });
    it('should poll on mutation', async({page, server}) => {
      let success = false;
      const watchdog = page.waitForFunction(() => window.__FOO === 'hit', {polling: 'mutation'})
          .then(() => success = true);
      await page.evaluate(() => window.__FOO = 'hit');
      expect(success).toBe(false);
      await page.evaluate(() => document.body.appendChild(document.createElement('div')));
      await watchdog;
    });
    it('should poll on raf', async({page, server}) => {
      const watchdog = page.waitForFunction(() => window.__FOO === 'hit', {polling: 'raf'});
      await page.evaluate(() => window.__FOO = 'hit');
      await watchdog;
    });
    it('should throw on bad polling value', async({page, server}) => {
      let error = null;
      try {
        await page.waitForFunction(() => !!document.body, {polling: 'unknown'});
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain('polling');
    });
    it('should throw negative polling interval', async({page, server}) => {
      let error = null;
      try {
        await page.waitForFunction(() => !!document.body, {polling: -10});
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain('Cannot poll with non-positive interval');
    });
    it('should return the success value as a JSHandle', async({page}) => {
      expect(await (await page.waitForFunction(() => 5)).jsonValue()).toBe(5);
    });
    it('should return the window as a success value', async({ page }) => {
      expect(await page.waitForFunction(() => window)).toBeTruthy();
    });
    it('should accept ElementHandle arguments', async({page}) => {
      await page.setContent('<div></div>');
      const div = await page.$('div');
      let resolved = false;
      const waitForFunction = page.waitForFunction(element => !element.parentElement, {}, div).then(() => resolved = true);
      expect(resolved).toBe(false);
      await page.evaluate(element => element.remove(), div);
      await waitForFunction;
    });
  });

  describe('Frame.waitForSelector', function() {
    const addElement = tag => document.body.appendChild(document.createElement(tag));

    it('should immediately resolve promise if node exists', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      let added = false;
      await frame.waitForSelector('*').then(() => added = true);
      expect(added).toBe(true);

      added = false;
      await frame.evaluate(addElement, 'div');
      await frame.waitForSelector('div').then(() => added = true);
      expect(added).toBe(true);
    });

    it('should resolve promise when node is added', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const frame = page.mainFrame();
      let added = false;
      const watchdog = frame.waitForSelector('div').then(() => added = true);
      // run nop function..
      await frame.evaluate(() => 42);
      // .. to be sure that waitForSelector promise is not resolved yet.
      expect(added).toBe(false);
      await frame.evaluate(addElement, 'br');
      expect(added).toBe(false);
      await frame.evaluate(addElement, 'div');
      await watchdog;
      expect(added).toBe(true);
    });

    it('should work when node is added through innerHTML', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const watchdog = page.waitForSelector('h3 div');
      await page.evaluate(addElement, 'span');
      await page.evaluate(() => document.querySelector('span').innerHTML = '<h3><div></div></h3>');
      await watchdog;
    });

    it('Page.waitForSelector is shortcut for main frame', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const otherFrame = page.frames()[1];
      let added = false;
      page.waitForSelector('div').then(() => added = true);
      await otherFrame.evaluate(addElement, 'div');
      expect(added).toBe(false);
      await page.evaluate(addElement, 'div');
      expect(added).toBe(true);
    });

    it('should run in specified frame', async({page, server}) => {
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame2', server.EMPTY_PAGE);
      const frame1 = page.frames()[1];
      const frame2 = page.frames()[2];
      let added = false;
      const waitForSelectorPromise = frame2.waitForSelector('div').then(() => added = true);
      expect(added).toBe(false);
      await frame1.evaluate(addElement, 'div');
      expect(added).toBe(false);
      await frame2.evaluate(addElement, 'div');
      await waitForSelectorPromise;
    });

    it('should throw if evaluation failed', async({page, server}) => {
      await page.evaluateOnNewDocument(function() {
        document.querySelector = null;
      });
      await page.goto(server.EMPTY_PAGE);
      let error = null;
      await page.waitForSelector('*').catch(e => error = e);
      expect(error.message).toContain('document.querySelector is not a function');
    });
    it('should throw when frame is detached', async({page, server}) => {
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame = page.frames()[1];
      let waitError = null;
      const waitPromise = frame.waitForSelector('.box').catch(e => waitError = e);
      await FrameUtils.detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError.message).toContain('waitForFunction failed: frame got detached.');
    });
    it('should survive cross-process navigation', async({page, server}) => {
      let boxFound = false;
      const waitForSelector = page.waitForSelector('.box').then(() => boxFound = true);
      await page.goto(server.EMPTY_PAGE);
      expect(boxFound).toBe(false);
      await page.reload();
      expect(boxFound).toBe(false);
      await page.goto(server.CROSS_PROCESS_PREFIX + '/grid.html');
      await waitForSelector;
      expect(boxFound).toBe(true);
    });
    it('should wait for visible', async({page, server}) => {
      let divFound = false;
      const waitForSelector = page.waitForSelector('div', {visible: true}).then(() => divFound = true);
      await page.setContent(`<div style='display: none; visibility: hidden;'>1</div>`);
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('display'));
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('visibility'));
      expect(await waitForSelector).toBe(true);
      expect(divFound).toBe(true);
    });
    it('should wait for visible recursively', async({page, server}) => {
      let divVisible = false;
      const waitForSelector = page.waitForSelector('div#inner', {visible: true}).then(() => divVisible = true);
      await page.setContent(`<div style='display: none; visibility: hidden;'><div id="inner">hi</div></div>`);
      expect(divVisible).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('display'));
      expect(divVisible).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('visibility'));
      expect(await waitForSelector).toBe(true);
      expect(divVisible).toBe(true);
    });
    it('hidden should wait for visibility: hidden', async({page, server}) => {
      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForSelector = page.waitForSelector('div', {hidden: true}).then(() => divHidden = true);
      await page.waitForSelector('div'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.setProperty('visibility', 'hidden'));
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    });
    it('hidden should wait for display: none', async({page, server}) => {
      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForSelector = page.waitForSelector('div', {hidden: true}).then(() => divHidden = true);
      await page.waitForSelector('div'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.setProperty('display', 'none'));
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    });
    it('hidden should wait for removal', async({page, server}) => {
      await page.setContent(`<div></div>`);
      let divRemoved = false;
      const waitForSelector = page.waitForSelector('div', {hidden: true}).then(() => divRemoved = true);
      await page.waitForSelector('div'); // do a round trip
      expect(divRemoved).toBe(false);
      await page.evaluate(() => document.querySelector('div').remove());
      expect(await waitForSelector).toBe(true);
      expect(divRemoved).toBe(true);
    });
    it('should respect timeout', async({page, server}) => {
      let error = null;
      await page.waitForSelector('div', {timeout: 10}).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('waiting failed: timeout');
    });

    it('should respond to node attribute mutation', async({page, server}) => {
      let divFound = false;
      const waitForSelector = page.waitForSelector('.zombo').then(() => divFound = true);
      await page.setContent(`<div class='notZombo'></div>`);
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').className = 'zombo');
      expect(await waitForSelector).toBe(true);
    });
    it('should return the element handle', async({page, server}) => {
      const waitForSelector = page.waitForSelector('.zombo');
      await page.setContent(`<div class='zombo'>anything</div>`);
      expect(await page.evaluate(x => x.textContent, await waitForSelector)).toBe('anything');
    });
  });

  describe('Frame.waitForXPath', function() {
    const addElement = tag => document.body.appendChild(document.createElement(tag));

    it('should support some fancy xpath', async({page, server}) => {
      await page.setContent(`<p>red herring</p><p>hello  world  </p>`);
      const waitForXPath = page.waitForXPath('//p[normalize-space(.)="hello world"]');
      expect(await page.evaluate(x => x.textContent, await waitForXPath)).toBe('hello  world  ');
    });
    it('should run in specified frame', async({page, server}) => {
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame2', server.EMPTY_PAGE);
      const frame1 = page.frames()[1];
      const frame2 = page.frames()[2];
      let added = false;
      const waitForXPathPromise = frame2.waitForXPath('//div').then(() => added = true);
      expect(added).toBe(false);
      await frame1.evaluate(addElement, 'div');
      expect(added).toBe(false);
      await frame2.evaluate(addElement, 'div');
      await waitForXPathPromise;
    });
    it('should throw if evaluation failed', async({page, server}) => {
      await page.evaluateOnNewDocument(function() {
        document.evaluate = null;
      });
      await page.goto(server.EMPTY_PAGE);
      let error = null;
      await page.waitForXPath('*').catch(e => error = e);
      expect(error.message).toContain('document.evaluate is not a function');
    });
    it('should throw when frame is detached', async({page, server}) => {
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const frame = page.frames()[1];
      let waitError = null;
      const waitPromise = frame.waitForXPath('//*[@class="box"]').catch(e => waitError = e);
      await FrameUtils.detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError.message).toContain('waitForFunction failed: frame got detached.');
    });
    it('hidden should wait for display: none', async({page, server}) => {
      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForXPath = page.waitForXPath('//div', {hidden: true}).then(() => divHidden = true);
      await page.waitForXPath('//div'); // do a round trip
      expect(divHidden).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.setProperty('display', 'none'));
      expect(await waitForXPath).toBe(true);
      expect(divHidden).toBe(true);
    });
    it('should return the element handle', async({page, server}) => {
      const waitForXPath = page.waitForXPath('//*[@class="zombo"]');
      await page.setContent(`<div class='zombo'>anything</div>`);
      expect(await page.evaluate(x => x.textContent, await waitForXPath)).toBe('anything');
    });
    it('should allow you to select a text node', async({page, server}) => {
      await page.setContent(`<div>some text</div>`);
      const text = await page.waitForXPath('//div/text()');
      expect(await (await text.getProperty('nodeType')).jsonValue()).toBe(3 /* Node.TEXT_NODE */);
    });
    it('should allow you to select an element with single slash', async({page, server}) => {
      await page.setContent(`<div>some text</div>`);
      const waitForXPath = page.waitForXPath('/html/body/div');
      expect(await page.evaluate(x => x.textContent, await waitForXPath)).toBe('some text');
    });
  });

  describe('Page.waitFor', function() {
    it('should wait for selector', async({page, server}) => {
      let found = false;
      const waitFor = page.waitFor('div').then(() => found = true);
      await page.goto(server.EMPTY_PAGE);
      expect(found).toBe(false);
      await page.goto(server.PREFIX + '/grid.html');
      await waitFor;
      expect(found).toBe(true);
    });
    it('should wait for an xpath', async({page, server}) => {
      let found = false;
      const waitFor = page.waitFor('//div').then(() => found = true);
      await page.goto(server.EMPTY_PAGE);
      expect(found).toBe(false);
      await page.goto(server.PREFIX + '/grid.html');
      await waitFor;
      expect(found).toBe(true);
    });
    it('should not allow you to select an element with single slash xpath', async({page, server}) => {
      await page.setContent(`<div>some text</div>`);
      let error = null;
      await page.waitFor('/html/body/div').catch(e => error = e);
      expect(error).toBeTruthy();
    });
    it('should timeout', async({page, server}) => {
      const startTime = Date.now();
      const timeout = 42;
      await page.waitFor(timeout);
      expect(Date.now() - startTime).not.toBeLessThan(timeout / 2);
    });
    it('should wait for predicate', async({page, server}) => {
      const watchdog = page.waitFor(() => window.innerWidth < 100);
      page.setViewport({width: 10, height: 10});
      await watchdog;
    });
    it('should throw when unknown type', async({page, server}) => {
      let error = null;
      await page.waitFor({foo: 'bar'}).catch(e => error = e);
      expect(error.message).toContain('Unsupported target type');
    });
    it('should wait for predicate with arguments', async({page, server}) => {
      await page.waitFor((arg1, arg2) => arg1 !== arg2, {}, 1, 2);
    });
  });

  describe('Page.Events.Console', function() {
    it('should work', async({page, server}) => {
      let message = null;
      page.once('console', m => message = m);
      await Promise.all([
        page.evaluate(() => console.log('hello', 5, {foo: 'bar'})),
        waitForEvents(page, 'console')
      ]);
      expect(message.text()).toEqual('hello 5 JSHandle@object');
      expect(message.type()).toEqual('log');
      expect(await message.args()[0].jsonValue()).toEqual('hello');
      expect(await message.args()[1].jsonValue()).toEqual(5);
      expect(await message.args()[2].jsonValue()).toEqual({foo: 'bar'});
    });
    it('should work for different console API calls', async({page, server}) => {
      const messages = [];
      page.on('console', msg => messages.push(msg));
      await Promise.all([
        page.evaluate(() => {
          // A pair of time/timeEnd generates only one Console API call.
          console.time('calling console.time');
          console.timeEnd('calling console.time');
          console.trace('calling console.trace');
          console.dir('calling console.dir');
          console.warn('calling console.warn');
          console.error('calling console.error');
          console.log(Promise.resolve('should not wait until resolved!'));
        }),
        // Wait for 5 events to hit - console.time is not reported
        waitForEvents(page, 'console', 5)
      ]);
      expect(messages.map(msg => msg.type())).toEqual([
        'timeEnd', 'trace', 'dir', 'warning', 'error', 'log'
      ]);
      expect(messages[0].text()).toContain('calling console.time');
      expect(messages.slice(1).map(msg => msg.text())).toEqual([
        'calling console.trace',
        'calling console.dir',
        'calling console.warn',
        'calling console.error',
        'JSHandle@promise',
      ]);
    });
    it('should not fail for window object', async({page, server}) => {
      let message = null;
      page.once('console', msg => message = msg);
      await Promise.all([
        page.evaluate(() => console.error(window)),
        waitForEvents(page, 'console')
      ]);
      expect(message.text()).toBe('JSHandle@object');
    });
  });

  describe('Page.Events.DOMContentLoaded', function() {
    it('should fire when expected', async({page, server}) => {
      page.goto('about:blank');
      await waitForEvents(page, 'domcontentloaded', 1);
    });
  });

  describe('Page.metrics', function() {
    it('should get metrics from a page', async({page, server}) => {
      await page.goto('about:blank');
      const metrics = await page.metrics();
      checkMetrics(metrics);
    });
    it('metrics event fired on console.timeStamp', async({page, server}) => {
      const metricsPromise = new Promise(fulfill => page.once('metrics', fulfill));
      await page.evaluate(() => console.timeStamp('test42'));
      const metrics = await metricsPromise;
      expect(metrics.title).toBe('test42');
      checkMetrics(metrics.metrics);
    });
    function checkMetrics(metrics) {
      const metricsToCheck = new Set([
        'Timestamp',
        'Documents',
        'Frames',
        'JSEventListeners',
        'Nodes',
        'LayoutCount',
        'RecalcStyleCount',
        'LayoutDuration',
        'RecalcStyleDuration',
        'ScriptDuration',
        'TaskDuration',
        'JSHeapUsedSize',
        'JSHeapTotalSize',
      ]);
      for (const name in metrics) {
        expect(metricsToCheck.has(name)).toBeTruthy();
        expect(metrics[name]).toBeGreaterThanOrEqual(0);
        metricsToCheck.delete(name);
      }
      expect(metricsToCheck.size).toBe(0);
    }
  });

  describe('Page.goto', function() {
    it('should navigate to about:blank', async({page, server}) => {
      const response = await page.goto('about:blank');
      expect(response).toBe(null);
    });
    it('should navigate to empty page with domcontentloaded', async({page, server}) => {
      const response = await page.goto(server.EMPTY_PAGE, {waitUntil: 'domcontentloaded'});
      expect(response.status()).toBe(200);
      expect(response.securityDetails()).toBe(null);
    });
    it('should navigate to empty page with networkidle0', async({page, server}) => {
      const response = await page.goto(server.EMPTY_PAGE, {waitUntil: 'networkidle0'});
      expect(response.status()).toBe(200);
    });
    it('should navigate to empty page with networkidle2', async({page, server}) => {
      const response = await page.goto(server.EMPTY_PAGE, {waitUntil: 'networkidle2'});
      expect(response.status()).toBe(200);
    });
    it('should fail when navigating to bad url', async({page, server}) => {
      let error = null;
      await page.goto('asdfasdf').catch(e => error = e);
      expect(error.message).toContain('Cannot navigate to invalid URL');
    });
    it('should fail when navigating to bad SSL', async({page, httpsServer}) => {
      // Make sure that network events do not emit 'undefined'.
      // @see https://crbug.com/750469
      page.on('request', request => expect(request).toBeTruthy());
      page.on('requestfinished', request => expect(request).toBeTruthy());
      page.on('requestfailed', request => expect(request).toBeTruthy());
      let error = null;
      await page.goto(httpsServer.EMPTY_PAGE).catch(e => error = e);
      expect(error.message).toContain('net::ERR_CERT_AUTHORITY_INVALID');
    });
    it('should fail when navigating to bad SSL after redirects', async({page, server, httpsServer}) => {
      server.setRedirect('/redirect/1.html', '/redirect/2.html');
      server.setRedirect('/redirect/2.html', '/empty.html');
      let error = null;
      await page.goto(httpsServer.PREFIX + '/redirect/1.html').catch(e => error = e);
      expect(error.message).toContain('net::ERR_CERT_AUTHORITY_INVALID');
    });
    it('should throw if networkidle is passed as an option', async({page, server}) => {
      let error = null;
      await page.goto(server.EMPTY_PAGE, {waitUntil: 'networkidle'}).catch(err => error = err);
      expect(error.message).toContain('"networkidle" option is no longer supported');
    });
    it('should fail when main resources failed to load', async({page, server}) => {
      let error = null;
      await page.goto('http://localhost:44123/non-existing-url').catch(e => error = e);
      expect(error.message).toContain('net::ERR_CONNECTION_REFUSED');
    });
    it('should fail when exceeding maximum navigation timeout', async({page, server}) => {
      // Hang for request to the empty.html
      server.setRoute('/empty.html', (req, res) => { });
      let error = null;
      await page.goto(server.PREFIX + '/empty.html', {timeout: 1}).catch(e => error = e);
      expect(error.message).toContain('Navigation Timeout Exceeded: 1ms');
    });
    it('should fail when exceeding default maximum navigation timeout', async({page, server}) => {
      // Hang for request to the empty.html
      server.setRoute('/empty.html', (req, res) => { });
      let error = null;
      page.setDefaultNavigationTimeout(1);
      await page.goto(server.PREFIX + '/empty.html').catch(e => error = e);
      expect(error.message).toContain('Navigation Timeout Exceeded: 1ms');
    });
    it('should disable timeout when its set to 0', async({page, server}) => {
      let error = null;
      let loaded = false;
      page.once('load', () => loaded = true);
      await page.goto(server.PREFIX + '/grid.html', {timeout: 0, waitUntil: ['load']}).catch(e => error = e);
      expect(error).toBe(null);
      expect(loaded).toBe(true);
    });
    it('should work when navigating to valid url', async({page, server}) => {
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
    });
    it('should work when navigating to data url', async({page, server}) => {
      const response = await page.goto('data:text/html,hello');
      expect(response.ok()).toBe(true);
    });
    it('should work when navigating to 404', async({page, server}) => {
      const response = await page.goto(server.PREFIX + '/not-found');
      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(404);
    });
    it('should return last response in redirect chain', async({page, server}) => {
      server.setRedirect('/redirect/1.html', '/redirect/2.html');
      server.setRedirect('/redirect/2.html', '/redirect/3.html');
      server.setRedirect('/redirect/3.html', server.EMPTY_PAGE);
      const response = await page.goto(server.PREFIX + '/redirect/1.html');
      expect(response.ok()).toBe(true);
      expect(response.url()).toBe(server.EMPTY_PAGE);
    });
    it('should wait for network idle to succeed navigation', async({page, server}) => {
      let responses = [];
      // Hold on to a bunch of requests without answering.
      server.setRoute('/fetch-request-a.js', (req, res) => responses.push(res));
      server.setRoute('/fetch-request-b.js', (req, res) => responses.push(res));
      server.setRoute('/fetch-request-c.js', (req, res) => responses.push(res));
      server.setRoute('/fetch-request-d.js', (req, res) => responses.push(res));
      const initialFetchResourcesRequested = Promise.all([
        server.waitForRequest('/fetch-request-a.js'),
        server.waitForRequest('/fetch-request-b.js'),
        server.waitForRequest('/fetch-request-c.js'),
      ]);
      const secondFetchResourceRequested = server.waitForRequest('/fetch-request-d.js');

      // Navigate to a page which loads immediately and then does a bunch of
      // requests via javascript's fetch method.
      const navigationPromise = page.goto(server.PREFIX + '/networkidle.html', {
        waitUntil: 'networkidle0',
      });
      // Track when the navigation gets completed.
      let navigationFinished = false;
      navigationPromise.then(() => navigationFinished = true);

      // Wait for the page's 'load' event.
      await new Promise(fulfill => page.once('load', fulfill));
      expect(navigationFinished).toBe(false);

      // Wait for the initial three resources to be requested.
      await initialFetchResourcesRequested;

      // Expect navigation still to be not finished.
      expect(navigationFinished).toBe(false);

      // Respond to initial requests.
      for (const response of responses) {
        response.statusCode = 404;
        response.end(`File not found`);
      }

      // Reset responses array
      responses = [];

      // Wait for the second round to be requested.
      await secondFetchResourceRequested;
      // Expect navigation still to be not finished.
      expect(navigationFinished).toBe(false);

      // Respond to requests.
      for (const response of responses) {
        response.statusCode = 404;
        response.end(`File not found`);
      }

      const response = await navigationPromise;
      // Expect navigation to succeed.
      expect(response.ok()).toBe(true);
    });
    it('should not leak listeners during navigation', async({page, server}) => {
      let warning = null;
      const warningHandler = w => warning = w;
      process.on('warning', warningHandler);
      for (let i = 0; i < 20; ++i)
        await page.goto(server.EMPTY_PAGE);
      process.removeListener('warning', warningHandler);
      expect(warning).toBe(null);
    });
    it('should not leak listeners during bad navigation', async({page, server}) => {
      let warning = null;
      const warningHandler = w => warning = w;
      process.on('warning', warningHandler);
      for (let i = 0; i < 20; ++i)
        await page.goto('asdf').catch(e => {/* swallow navigation error */});
      process.removeListener('warning', warningHandler);
      expect(warning).toBe(null);
    });
    it('should navigate to dataURL and fire dataURL requests', async({page, server}) => {
      const requests = [];
      page.on('request', request => requests.push(request));
      const dataURL = 'data:text/html,<div>yo</div>';
      const response = await page.goto(dataURL);
      expect(response.status()).toBe(200);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(dataURL);
    });
    it('should navigate to URL with hash and fire requests without hash', async({page, server}) => {
      const requests = [];
      page.on('request', request => requests.push(request));
      const response = await page.goto(server.EMPTY_PAGE + '#hash');
      expect(response.status()).toBe(200);
      expect(response.url()).toBe(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
    });
    it('should work with self requesting page', async({page, server}) => {
      const response = await page.goto(server.PREFIX + '/self-request.html');
      expect(response.status()).toBe(200);
      expect(response.url()).toContain('self-request.html');
    });
  });

  describe('Page.waitForNavigation', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const [result] = await Promise.all([
        page.waitForNavigation(),
        page.evaluate(url => window.location.href = url, server.PREFIX + '/grid.html')
      ]);
      const response = await result;
      expect(response.ok()).toBe(true);
      expect(response.url()).toContain('grid.html');
    });
    it('should work with both domcontentloaded and load', async({page, server}) => {
      let response = null;
      server.setRoute('/one-style.css', (req, res) => response = res);
      const navigationPromise = page.goto(server.PREFIX + '/one-style.html');
      const domContentLoadedPromise = page.waitForNavigation({
        waitUntil: 'domcontentloaded'
      });

      let bothFired = false;
      const bothFiredPromise = page.waitForNavigation({
        waitUntil: ['load', 'domcontentloaded']
      }).then(() => bothFired = true);

      await server.waitForRequest('/one-style.css');
      await domContentLoadedPromise;
      expect(bothFired).toBe(false);
      response.end();
      await bothFiredPromise;
      await navigationPromise;
    });
  });

  describe('Page.goBack', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.goto(server.PREFIX + '/grid.html');

      let response = await page.goBack();
      expect(response.ok()).toBe(true);
      expect(response.url()).toContain(server.EMPTY_PAGE);

      response = await page.goForward();
      expect(response.ok()).toBe(true);
      expect(response.url()).toContain('/grid.html');

      response = await page.goForward();
      expect(response).toBe(null);
    });
  });

  describe('Page.exposeFunction', function() {
    it('should work', async({page, server}) => {
      await page.exposeFunction('compute', function(a, b) {
        return a * b;
      });
      const result = await page.evaluate(async function() {
        return await compute(9, 4);
      });
      expect(result).toBe(36);
    });
    it('should survive navigation', async({page, server}) => {
      await page.exposeFunction('compute', function(a, b) {
        return a * b;
      });

      await page.goto(server.EMPTY_PAGE);
      const result = await page.evaluate(async function() {
        return await compute(9, 4);
      });
      expect(result).toBe(36);
    });
    it('should await returned promise', async({page, server}) => {
      await page.exposeFunction('compute', function(a, b) {
        return Promise.resolve(a * b);
      });

      const result = await page.evaluate(async function() {
        return await compute(3, 5);
      });
      expect(result).toBe(15);
    });
    it('should work on frames', async({page, server}) => {
      await page.exposeFunction('compute', function(a, b) {
        return Promise.resolve(a * b);
      });

      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      const frame = page.frames()[1];
      const result = await frame.evaluate(async function() {
        return await compute(3, 5);
      });
      expect(result).toBe(15);
    });
    it('should work on frames before navigation', async({page, server}) => {
      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      await page.exposeFunction('compute', function(a, b) {
        return Promise.resolve(a * b);
      });

      const frame = page.frames()[1];
      const result = await frame.evaluate(async function() {
        return await compute(3, 5);
      });
      expect(result).toBe(15);
    });
  });

  describe('Page.setRequestInterception', function() {
    it('should intercept', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        expect(request.url()).toContain('empty.html');
        expect(request.headers()['user-agent']).toBeTruthy();
        expect(request.method()).toBe('GET');
        expect(request.postData()).toBe(undefined);
        expect(request.resourceType()).toBe('document');
        expect(request.frame() === page.mainFrame()).toBe(true);
        expect(request.frame().url()).toBe('about:blank');
        request.continue();
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
    });
    it('should stop intercepting', async({page, server}) => {
      await page.setRequestInterception(true);
      page.once('request', request => request.continue());
      await page.goto(server.EMPTY_PAGE);
      await page.setRequestInterception(false);
      await page.goto(server.EMPTY_PAGE);
    });
    it('should show custom HTTP headers', async({page, server}) => {
      await page.setExtraHTTPHeaders({
        foo: 'bar'
      });
      await page.setRequestInterception(true);
      page.on('request', request => {
        expect(request.headers()['foo']).toBe('bar');
        request.continue();
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
    });
    it('should works with customizing referer headers', async({page, server}) => {
      await page.setExtraHTTPHeaders({ 'referer': server.EMPTY_PAGE });
      await page.setRequestInterception(true);
      page.on('request', request => {
        expect(request.headers()['referer']).toBe(server.EMPTY_PAGE);
        request.continue();
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.ok()).toBe(true);
    });
    it('should be abortable', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().endsWith('.css'))
          request.abort();
        else
          request.continue();
      });
      let failedRequests = 0;
      page.on('requestfailed', event => ++failedRequests);
      const response = await page.goto(server.PREFIX + '/one-style.html');
      expect(response.ok()).toBe(true);
      expect(response.request().failure()).toBe(null);
      expect(failedRequests).toBe(1);
    });
    it('should be abortable with custom error codes', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        request.abort('internetdisconnected');
      });
      let failedRequest = null;
      page.on('requestfailed', request => failedRequest = request);
      await page.goto(server.EMPTY_PAGE).catch(e => {});
      expect(failedRequest).toBeTruthy();
      expect(failedRequest.failure().errorText).toBe('net::ERR_INTERNET_DISCONNECTED');
    });
    it('should send referer', async({page, server}) => {
      await page.setExtraHTTPHeaders({
        referer: 'http://google.com/'
      });
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      const [request] = await Promise.all([
        server.waitForRequest('/grid.html'),
        page.goto(server.PREFIX + '/grid.html'),
      ]);
      expect(request.headers['referer']).toBe('http://google.com/');
    });
    it('should amend HTTP headers', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers());
        headers['FOO'] = 'bar';
        request.continue({ headers });
      });
      await page.goto(server.EMPTY_PAGE);
      const [request] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => fetch('/sleep.zzz'))
      ]);
      expect(request.headers['foo']).toBe('bar');
    });
    it('should fail navigation when aborting main resource', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => request.abort());
      let error = null;
      await page.goto(server.EMPTY_PAGE).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('net::ERR_FAILED');
    });
    it('should work with redirects', async({page, server}) => {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        request.continue();
        requests.push(request);
      });
      server.setRedirect('/non-existing-page.html', '/non-existing-page-2.html');
      server.setRedirect('/non-existing-page-2.html', '/non-existing-page-3.html');
      server.setRedirect('/non-existing-page-3.html', '/non-existing-page-4.html');
      server.setRedirect('/non-existing-page-4.html', '/empty.html');
      const response = await page.goto(server.PREFIX + '/non-existing-page.html');
      expect(response.status()).toBe(200);
      expect(response.url()).toContain('empty.html');
      expect(requests.length).toBe(5);
      expect(requests[2].resourceType()).toBe('document');
    });
    it('should be able to abort redirects', async({page, server}) => {
      await page.setRequestInterception(true);
      server.setRedirect('/non-existing.json', '/non-existing-2.json');
      server.setRedirect('/non-existing-2.json', '/simple.html');
      page.on('request', request => {
        if (request.url().includes('non-existing-2'))
          request.abort();
        else
          request.continue();
      });
      await page.goto(server.EMPTY_PAGE);
      const result = await page.evaluate(async() => {
        try {
          await fetch('/non-existing.json');
        } catch (e) {
          return e.message;
        }
      });
      expect(result).toContain('Failed to fetch');
    });
    it('should work with equal requests', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      let responseCount = 1;
      server.setRoute('/zzz', (req, res) => res.end((responseCount++) * 11 + ''));
      await page.setRequestInterception(true);

      let spinner = false;
      // Cancel 2nd request.
      page.on('request', request => {
        spinner ? request.abort() : request.continue();
        spinner = !spinner;
      });
      const results = await page.evaluate(() => Promise.all([
        fetch('/zzz').then(response => response.text()).catch(e => 'FAILED'),
        fetch('/zzz').then(response => response.text()).catch(e => 'FAILED'),
        fetch('/zzz').then(response => response.text()).catch(e => 'FAILED'),
      ]));
      expect(results).toEqual(['11', 'FAILED', '22']);
    });
    it('should navigate to dataURL and fire dataURL requests', async({page, server}) => {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        requests.push(request);
        request.continue();
      });
      const dataURL = 'data:text/html,<div>yo</div>';
      const response = await page.goto(dataURL);
      expect(response.status()).toBe(200);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(dataURL);
    });
    it('should abort data server', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        request.abort();
      });
      let error = null;
      await page.goto('data:text/html,No way!').catch(err => error = err);
      expect(error.message).toContain('net::ERR_FAILED');
    });
    it('should navigate to URL with hash and and fire requests without hash', async({page, server}) => {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        requests.push(request);
        request.continue();
      });
      const response = await page.goto(server.EMPTY_PAGE + '#hash');
      expect(response.status()).toBe(200);
      expect(response.url()).toBe(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
    });
    it('should work with encoded server', async({page, server}) => {
      // The requestWillBeSent will report encoded URL, whereas interception will
      // report URL as-is. @see crbug.com/759388
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      const response = await page.goto(server.PREFIX + '/some nonexisting page');
      expect(response.status()).toBe(404);
    });
    it('should work with badly encoded server', async({page, server}) => {
      await page.setRequestInterception(true);
      server.setRoute('/malformed?rnd=%911', (req, res) => res.end());
      page.on('request', request => request.continue());
      const response = await page.goto(server.PREFIX + '/malformed?rnd=%911');
      expect(response.status()).toBe(200);
    });
    it('should work with encoded server - 2', async({page, server}) => {
      // The requestWillBeSent will report URL as-is, whereas interception will
      // report encoded URL for stylesheet. @see crbug.com/759388
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        request.continue();
        requests.push(request);
      });
      const response = await page.goto(`data:text/html,<link rel="stylesheet" href="${server.PREFIX}/fonts?helvetica|arial"/>`);
      expect(response.status()).toBe(200);
      expect(requests.length).toBe(2);
      expect(requests[1].response().status()).toBe(404);
    });
    it('should not throw "Invalid Interception Id" if the request was cancelled', async({page, server}) => {
      await page.setContent('<iframe></iframe>');
      await page.setRequestInterception(true);
      let request = null;
      page.on('request', async r => request = r);
      page.$eval('iframe', (frame, url) => frame.src = url, server.EMPTY_PAGE),
      // Wait for request interception.
      await waitForEvents(page, 'request');
      // Delete frame to cause request to be canceled.
      await page.$eval('iframe', frame => frame.remove());
      let error = null;
      await request.continue().catch(e => error = e);
      expect(error).toBe(null);
    });
    it('should throw if interception is not enabled', async({page, server}) => {
      let error = null;
      page.on('request', async request => {
        try {
          await request.continue();
        } catch (e) {
          error = e;
        }
      });
      await page.goto(server.EMPTY_PAGE);
      expect(error.message).toContain('Request Interception is not enabled');
    });
  });

  describe('Request.respond', function() {
    it('should work', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        request.respond({
          status: 201,
          headers: {
            foo: 'bar'
          },
          body: 'Yo, page!'
        });
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(201);
      expect(response.headers().foo).toBe('bar');
      expect(await page.evaluate(() => document.body.textContent)).toBe('Yo, page!');
    });
    it('should allow mocking binary responses', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        const imageBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'pptr.png'));
        request.respond({
          contentType: 'image/png',
          body: imageBuffer
        });
      });
      await page.evaluate(PREFIX => {
        const img = document.createElement('img');
        img.src = PREFIX + '/does-not-exist.png';
        document.body.appendChild(img);
        return new Promise(fulfill => img.onload = fulfill);
      }, server.PREFIX);
      const img = await page.$('img');
      expect(await img.screenshot()).toBeGolden('mock-binary-response.png');
    });
  });

  describe('Page.Events.Dialog', function() {
    it('should fire', async({page, server}) => {
      page.on('dialog', dialog => {
        expect(dialog.type()).toBe('alert');
        expect(dialog.defaultValue()).toBe('');
        expect(dialog.message()).toBe('yo');
        dialog.accept();
      });
      await page.evaluate(() => alert('yo'));
    });
    it('should allow accepting prompts', async({page, server}) => {
      page.on('dialog', dialog => {
        expect(dialog.type()).toBe('prompt');
        expect(dialog.defaultValue()).toBe('yes.');
        expect(dialog.message()).toBe('question?');
        dialog.accept('answer!');
      });
      const result = await page.evaluate(() => prompt('question?', 'yes.'));
      expect(result).toBe('answer!');
    });
    it('should dismiss the prompt', async({page, server}) => {
      page.on('dialog', dialog => {
        dialog.dismiss();
      });
      const result = await page.evaluate(() => prompt('question?'));
      expect(result).toBe(null);
    });
  });

  describe('Page.Events.PageError', function() {
    it('should fire', async({page, server}) => {
      let error = null;
      page.once('pageerror', e => error = e);
      await Promise.all([
        page.goto(server.PREFIX + '/error.html'),
        waitForEvents(page, 'pageerror')
      ]);
      expect(error.message).toContain('Fancy');
    });
  });

  describe('Page.Events.Request', function() {
    it('should fire', async({page, server}) => {
      const requests = [];
      page.on('request', request => requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(requests.length).toBe(2);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
      expect(requests[0].frame() === page.mainFrame()).toBe(true);
      expect(requests[0].frame().url()).toBe(server.EMPTY_PAGE);
      expect(requests[1].url()).toBe(server.EMPTY_PAGE);
      expect(requests[1].frame() === page.frames()[1]).toBe(true);
      expect(requests[1].frame().url()).toBe(server.EMPTY_PAGE);
    });
  });

  describe('Frame Management', function() {
    it('should handle nested frames', async({page, server}) => {
      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      expect(FrameUtils.dumpFrames(page.mainFrame())).toBeGolden('nested-frames.txt');
    });
    it('should send events when frames are manipulated dynamically', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      // validate frameattached events
      const attachedFrames = [];
      page.on('frameattached', frame => attachedFrames.push(frame));
      await FrameUtils.attachFrame(page, 'frame1', './assets/frame.html');
      expect(attachedFrames.length).toBe(1);
      expect(attachedFrames[0].url()).toContain('/assets/frame.html');

      // validate framenavigated events
      const navigatedFrames = [];
      page.on('framenavigated', frame => navigatedFrames.push(frame));
      await FrameUtils.navigateFrame(page, 'frame1', './empty.html');
      expect(navigatedFrames.length).toBe(1);
      expect(navigatedFrames[0].url()).toBe(server.EMPTY_PAGE);

      // validate framedetached events
      const detachedFrames = [];
      page.on('framedetached', frame => detachedFrames.push(frame));
      await FrameUtils.detachFrame(page, 'frame1');
      expect(detachedFrames.length).toBe(1);
      expect(detachedFrames[0].isDetached()).toBe(true);
    });
    it('should persist mainFrame on cross-process navigation', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      expect(page.mainFrame() === mainFrame).toBeTruthy();
    });
    it('should not send attach/detach events for main frame', async({page, server}) => {
      let hasEvents = false;
      page.on('frameattached', frame => hasEvents = true);
      page.on('framedetached', frame => hasEvents = true);
      await page.goto(server.EMPTY_PAGE);
      expect(hasEvents).toBe(false);
    });
    it('should detach child frames on navigation', async({page, server}) => {
      let attachedFrames = [];
      let detachedFrames = [];
      let navigatedFrames = [];
      page.on('frameattached', frame => attachedFrames.push(frame));
      page.on('framedetached', frame => detachedFrames.push(frame));
      page.on('framenavigated', frame => navigatedFrames.push(frame));
      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      expect(attachedFrames.length).toBe(4);
      expect(detachedFrames.length).toBe(0);
      expect(navigatedFrames.length).toBe(5);

      attachedFrames = [];
      detachedFrames = [];
      navigatedFrames = [];
      await page.goto(server.EMPTY_PAGE);
      expect(attachedFrames.length).toBe(0);
      expect(detachedFrames.length).toBe(4);
      expect(navigatedFrames.length).toBe(1);
    });
    it('should report frame.name()', async({page, server}) => {
      await FrameUtils.attachFrame(page, 'theFrameId', server.EMPTY_PAGE);
      await page.evaluate(url => {
        const frame = document.createElement('iframe');
        frame.name = 'theFrameName';
        frame.src = url;
        document.body.appendChild(frame);
        return new Promise(x => frame.onload = x);
      }, server.EMPTY_PAGE);
      expect(page.frames()[0].name()).toBe('');
      expect(page.frames()[1].name()).toBe('theFrameId');
      expect(page.frames()[2].name()).toBe('theFrameName');
    });
    it('should report frame.parent()', async({page, server}) => {
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame2', server.EMPTY_PAGE);
      expect(page.frames()[0].parentFrame()).toBe(null);
      expect(page.frames()[1].parentFrame()).toBe(page.mainFrame());
      expect(page.frames()[2].parentFrame()).toBe(page.mainFrame());
    });
  });

  describe('Page.$eval', function() {
    it('should work', async({page, server}) => {
      await page.setContent('<section id="testAttribute">43543</section>');
      const idAttribute = await page.$eval('section', e => e.id);
      expect(idAttribute).toBe('testAttribute');
    });
    it('should accept arguments', async({page, server}) => {
      await page.setContent('<section>hello</section>');
      const text = await page.$eval('section', (e, suffix) => e.textContent + suffix, ' world!');
      expect(text).toBe('hello world!');
    });
    it('should accept ElementHandles as arguments', async({page, server}) => {
      await page.setContent('<section>hello</section><div> world</div>');
      const divHandle = await page.$('div');
      const text = await page.$eval('section', (e, div) => e.textContent + div.textContent, divHandle);
      expect(text).toBe('hello world');
    });
    it('should throw error if no element is found', async({page, server}) => {
      let error = null;
      await page.$eval('section', e => e.id).catch(e => error = e);
      expect(error.message).toContain('failed to find element matching selector "section"');
    });
  });

  describe('Page.$$eval', function() {
    it('should work', async({page, server}) => {
      await page.setContent('<div>hello</div><div>beautiful</div><div>world!</div>');
      const divsCount = await page.$$eval('div', divs => divs.length);
      expect(divsCount).toBe(3);
    });
  });

  describe('Page.$', function() {
    it('should query existing element', async({page, server}) => {
      await page.setContent('<section>test</section>');
      const element = await page.$('section');
      expect(element).toBeTruthy();
    });
    it('should return null for non-existing element', async({page, server}) => {
      const element = await page.$('non-existing-element');
      expect(element).toBe(null);
    });
  });

  describe('Page.$$', function() {
    it('should query existing elements', async({page, server}) => {
      await page.setContent('<div>A</div><br/><div>B</div>');
      const elements = await page.$$('div');
      expect(elements.length).toBe(2);
      const promises = elements.map(element => page.evaluate(e => e.textContent, element));
      expect(await Promise.all(promises)).toEqual(['A', 'B']);
    });
    it('should return empty array if nothing is found', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const elements = await page.$$('div');
      expect(elements.length).toBe(0);
    });
  });

  describe('Path.$x', function() {
    it('should query existing element', async({page, server}) => {
      await page.setContent('<section>test</section>');
      const elements = await page.$x('/html/body/section');
      expect(elements[0]).toBeTruthy();
      expect(elements.length).toBe(1);
    });
    it('should return empty array for non-existing element', async({page, server}) => {
      const element = await page.$x('/html/body/non-existing-element');
      expect(element).toEqual([]);
    });
    it('should return multiple elements', async({page, sever}) => {
      await page.setContent('<div></div><div></div>');
      const elements = await page.$x('/html/body/div');
      expect(elements.length).toBe(2);
    });
  });

  describe('ElementHandle.boundingBox', function() {
    it('should work', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const elementHandle = await page.$('.box:nth-of-type(13)');
      const box = await elementHandle.boundingBox();
      expect(box).toEqual({ x: 100, y: 50, width: 50, height: 50 });
    });
    it('should handle nested frames', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/frames/nested-frames.html');
      const nestedFrame = page.frames()[1].childFrames()[1];
      const elementHandle = await nestedFrame.$('div');
      const box = await elementHandle.boundingBox();
      expect(box).toEqual({ x: 28, y: 260, width: 264, height: 18 });
    });
    it('should return null for invisible elements', async({page, server}) => {
      await page.setContent('<div style="display:none">hi</div>');
      const element = await page.$('div');
      expect(await element.boundingBox()).toBe(null);
    });
  });

  describe('ElementHandle.contentFrame', function() {
    it('should work', async({page,server}) => {
      await page.goto(server.EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      const elementHandle = await page.$('#frame1');
      const frame = await elementHandle.contentFrame();
      expect(frame).toBe(page.frames()[1]);
    });
  });

  describe('ElementHandle.click', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      const button = await page.$('button');
      await button.click();
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
    it('should work for Shadow DOM v1', async({page, server}) => {
      await page.goto(server.PREFIX + '/shadow.html');
      const buttonHandle = await page.evaluateHandle(() => button);
      await buttonHandle.click();
      expect(await page.evaluate(() => clicked)).toBe(true);
    });
    it('should work for TextNodes', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      const buttonTextNode = await page.evaluateHandle(() => document.querySelector('button').firstChild);
      let error = null;
      await buttonTextNode.click().catch(err => error = err);
      expect(error.message).toBe('Node is not of type HTMLElement');
    });
    it('should throw for detached nodes', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      const button = await page.$('button');
      await page.evaluate(button => button.remove(), button);
      let error = null;
      await button.click().catch(err => error = err);
      expect(error.message).toBe('Node is detached from document');
    });
    it('should throw for hidden nodes', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      const button = await page.$('button');
      await page.evaluate(button => button.style.display = 'none', button);
      const error = await button.click().catch(err => err);
      expect(error.message).toBe('Node is either not visible or not an HTMLElement');
    });
    it('should throw for recursively hidden nodes', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      const button = await page.$('button');
      await page.evaluate(button => button.parentElement.style.display = 'none', button);
      const error = await button.click().catch(err => err);
      expect(error.message).toBe('Node is either not visible or not an HTMLElement');
    });
    it('should throw for <br> elements', async({page, server}) => {
      await page.setContent('hello<br>goodbye');
      const br = await page.$('br');
      const error = await br.click().catch(err => err);
      expect(error.message).toBe('Node is either not visible or not an HTMLElement');
    });
  });

  describe('ElementHandle.hover', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      const button = await page.$('#button-6');
      await button.hover();
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-6');
    });
  });

  describe('ElementHandle.screenshot', function() {
    it('should work', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      await page.evaluate(() => window.scrollBy(50, 100));
      const elementHandle = await page.$('.box:nth-of-type(3)');
      const screenshot = await elementHandle.screenshot();
      expect(screenshot).toBeGolden('screenshot-element-bounding-box.png');
    });
    it('should take into account padding and border', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        something above
        <style>div {
          border: 2px solid blue;
          background: green;
          width: 50px;
          height: 50px;
        }
        </style>
        <div></div>
      `);
      const elementHandle = await page.$('div');
      const screenshot = await elementHandle.screenshot();
      expect(screenshot).toBeGolden('screenshot-element-padding-border.png');
    });
    it('should capture full element when larger than viewport', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});

      await page.setContent(`
        something above
        <style>
        div.to-screenshot {
          border: 1px solid blue;
          width: 600px;
          height: 600px;
          margin-left: 50px;
        }
        </style>
        <div class="to-screenshot"></div>
      `);
      const elementHandle = await page.$('div.to-screenshot');
      const screenshot = await elementHandle.screenshot();
      expect(screenshot).toBeGolden('screenshot-element-larger-than-viewport.png');

      expect(await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }))).toEqual({ w: 500, h: 500 });
    });
    it('should scroll element into view', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.setContent(`
        something above
        <style>div.above {
          border: 2px solid blue;
          background: red;
          height: 1500px;
        }
        div.to-screenshot {
          border: 2px solid blue;
          background: green;
          width: 50px;
          height: 50px;
        }
        </style>
        <div class="above"></div>
        <div class="to-screenshot"></div>
      `);
      const elementHandle = await page.$('div.to-screenshot');
      const screenshot = await elementHandle.screenshot();
      expect(screenshot).toBeGolden('screenshot-element-scrolled-into-view.png');
    });
    it('should work with a rotated element', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.setContent(`<div style="position:absolute;
                                         top: 100px;
                                         left: 100px;
                                         width: 100px;
                                         height: 100px;
                                        background: green;
                                        transform: rotateZ(200deg);">&nbsp;</div>`);
      const elementHandle = await page.$('div');
      const screenshot = await elementHandle.screenshot();
      expect(screenshot).toBeGolden('screenshot-element-rotate.png');
    });
    it('should fail to screenshot a detached element', async({page, server}) => {
      await page.setContent('<h1>remove this</h1>');
      const elementHandle = await page.$('h1');
      await page.evaluate(element => element.remove(), elementHandle);
      const screenshotError = await elementHandle.screenshot().catch(error => error);
      expect(screenshotError.message).toBe('Node is either not visible or not an HTMLElement');
    });
  });

  describe('ElementHandle.$', function() {
    it('should query existing element', async({page, server}) => {
      await page.goto(server.PREFIX + '/playground.html');
      await page.setContent('<html><body><div class="second"><div class="inner">A</div></div></body></html>');
      const html = await page.$('html');
      const second = await html.$('.second');
      const inner = await second.$('.inner');
      const content = await page.evaluate(e => e.textContent, inner);
      expect(content).toBe('A');
    });

    it('should return null for non-existing element', async({page, server}) => {
      await page.setContent('<html><body><div class="second"><div class="inner">B</div></div></body></html>');
      const html = await page.$('html');
      const second = await html.$('.third');
      expect(second).toBe(null);
    });
  });

  describe('ElementHandle.$$', function() {
    it('should query existing elements', async({page, server}) => {
      await page.setContent('<html><body><div>A</div><br/><div>B</div></body></html>');
      const html = await page.$('html');
      const elements = await html.$$('div');
      expect(elements.length).toBe(2);
      const promises = elements.map(element => page.evaluate(e => e.textContent, element));
      expect(await Promise.all(promises)).toEqual(['A', 'B']);
    });

    it('should return empty array for non-existing elements', async({page, server}) => {
      await page.setContent('<html><body><span>A</span><br/><span>B</span></body></html>');
      const html = await page.$('html');
      const elements = await html.$$('div');
      expect(elements.length).toBe(0);
    });
  });


  describe('ElementHandle.$x', function() {
    it('should query existing element', async({page, server}) => {
      await page.goto(server.PREFIX + '/playground.html');
      await page.setContent('<html><body><div class="second"><div class="inner">A</div></div></body></html>');
      const html = await page.$('html');
      const second = await html.$x(`./body/div[contains(@class, 'second')]`);
      const inner = await second[0].$x(`./div[contains(@class, 'inner')]`);
      const content = await page.evaluate(e => e.textContent, inner[0]);
      expect(content).toBe('A');
    });

    it('should return null for non-existing element', async({page, server}) => {
      await page.setContent('<html><body><div class="second"><div class="inner">B</div></div></body></html>');
      const html = await page.$('html');
      const second = await html.$x(`/div[contains(@class, 'third')]`);
      expect(second).toEqual([]);
    });
  });

  describe('input', function() {
    it('should click the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });

    it('should click on checkbox input and toggle', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/checkbox.html');
      expect(await page.evaluate(() => result.check)).toBe(null);
      await page.click('input#agree');
      expect(await page.evaluate(() => result.check)).toBe(true);
      expect(await page.evaluate(() => result.events)).toEqual([
        'mouseover',
        'mouseenter',
        'mousemove',
        'mousedown',
        'mouseup',
        'click',
        'input',
        'change',
      ]);
      await page.click('input#agree');
      expect(await page.evaluate(() => result.check)).toBe(false);
    });

    it('should click on checkbox label and toggle', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/checkbox.html');
      expect(await page.evaluate(() => result.check)).toBe(null);
      await page.click('label[for="agree"]');
      expect(await page.evaluate(() => result.check)).toBe(true);
      expect(await page.evaluate(() => result.events)).toEqual([
        'click',
        'input',
        'change',
      ]);
      await page.click('label[for="agree"]');
      expect(await page.evaluate(() => result.check)).toBe(false);
    });

    it('should fail to click a missing button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      let error = null;
      await page.click('button.does-not-exist').catch(e => error = e);
      expect(error.message).toBe('No node found for selector: button.does-not-exist');
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/161
    it('should not hang with touch-enabled viewports', async({page, server}) => {
      await page.setViewport(iPhone.viewport);
      await page.mouse.down();
      await page.mouse.move(100, 10);
      await page.mouse.up();
    });
    it('should type into the textarea', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');

      const textarea = await page.$('textarea');
      await textarea.type('Type in this text!');
      expect(await page.evaluate(() => result)).toBe('Type in this text!');
    });
    it('should click the button after navigation ', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.click('button');
      await page.goto(server.PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
    it('should upload the file', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/fileupload.html');
      const filePath = path.relative(process.cwd(), __dirname + '/assets/file-to-upload.txt');
      const input = await page.$('input');
      await input.uploadFile(filePath);
      expect(await page.evaluate(e => e.files[0].name, input)).toBe('file-to-upload.txt');
      expect(await page.evaluate(e => {
        const reader = new FileReader();
        const promise = new Promise(fulfill => reader.onload = fulfill);
        reader.readAsText(e.files[0]);
        return promise.then(() => reader.result);
      }, input)).toBe('contents of the file');
    });
    it('should move with the arrow keys', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.type('textarea', 'Hello World!');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('Hello World!');
      for (let i = 0; i < 'World!'.length; i++)
        page.keyboard.press('ArrowLeft');
      await page.keyboard.type('inserted ');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('Hello inserted World!');
      page.keyboard.down('Shift');
      for (let i = 0; i < 'inserted '.length; i++)
        page.keyboard.press('ArrowLeft');
      page.keyboard.up('Shift');
      await page.keyboard.press('Backspace');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('Hello World!');
    });
    it('should send a character with ElementHandle.press', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      const textarea = await page.$('textarea');
      await textarea.press('a', {text: 'f'});
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('f');

      await page.evaluate(() => window.addEventListener('keydown', e => e.preventDefault(), true));

      await textarea.press('a', {text: 'y'});
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('f');
    });
    it('should send a character with sendCharacter', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.keyboard.sendCharacter('嗨');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('嗨');
      await page.evaluate(() => window.addEventListener('keydown', e => e.preventDefault(), true));
      await page.keyboard.sendCharacter('a');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('嗨a');
    });
    it('should report shiftKey', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/keyboard.html');
      const keyboard = page.keyboard;
      const codeForKey = {'Shift': 16, 'Alt': 18, 'Meta': 91, 'Control': 17};
      for (const modifierKey in codeForKey) {
        await keyboard.down(modifierKey);
        expect(await page.evaluate(() => getResult())).toBe('Keydown: ' + modifierKey + ' ' + modifierKey + 'Left ' + codeForKey[modifierKey] + ' [' + modifierKey + ']');
        await keyboard.down('!');
        // Shift+! will generate a keypress
        if (modifierKey === 'Shift')
          expect(await page.evaluate(() => getResult())).toBe('Keydown: ! Digit1 49 [' + modifierKey + ']\nKeypress: ! Digit1 33 33 33 [' + modifierKey + ']');
        else
          expect(await page.evaluate(() => getResult())).toBe('Keydown: ! Digit1 49 [' + modifierKey + ']');

        await keyboard.up('!');
        expect(await page.evaluate(() => getResult())).toBe('Keyup: ! Digit1 49 [' + modifierKey + ']');
        await keyboard.up(modifierKey);
        expect(await page.evaluate(() => getResult())).toBe('Keyup: ' + modifierKey + ' ' + modifierKey + 'Left ' + codeForKey[modifierKey] + ' []');
      }
    });
    it('should report multiple modifiers', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/keyboard.html');
      const keyboard = page.keyboard;
      await keyboard.down('Control');
      expect(await page.evaluate(() => getResult())).toBe('Keydown: Control ControlLeft 17 [Control]');
      await keyboard.down('Meta');
      expect(await page.evaluate(() => getResult())).toBe('Keydown: Meta MetaLeft 91 [Control Meta]');
      await keyboard.down(';');
      expect(await page.evaluate(() => getResult())).toBe('Keydown: ; Semicolon 186 [Control Meta]');
      await keyboard.up(';');
      expect(await page.evaluate(() => getResult())).toBe('Keyup: ; Semicolon 186 [Control Meta]');
      await keyboard.up('Control');
      expect(await page.evaluate(() => getResult())).toBe('Keyup: Control ControlLeft 17 [Meta]');
      await keyboard.up('Meta');
      expect(await page.evaluate(() => getResult())).toBe('Keyup: Meta MetaLeft 91 []');
    });
    it('should send proper codes while typing', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/keyboard.html');
      await page.keyboard.type('!');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: ! Digit1 49 []',
            'Keypress: ! Digit1 33 33 33 []',
            'Keyup: ! Digit1 49 []'].join('\n'));
      await page.keyboard.type('^');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: ^ Digit6 54 []',
            'Keypress: ^ Digit6 94 94 94 []',
            'Keyup: ^ Digit6 54 []'].join('\n'));
    });
    it('should send proper codes while typing with shift', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/keyboard.html');
      const keyboard = page.keyboard;
      await keyboard.down('Shift');
      await page.keyboard.type('~');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: Shift ShiftLeft 16 [Shift]',
            'Keydown: ~ Backquote 192 [Shift]', // 192 is ` keyCode
            'Keypress: ~ Backquote 126 126 126 [Shift]', // 126 is ~ charCode
            'Keyup: ~ Backquote 192 [Shift]'].join('\n'));
      await keyboard.up('Shift');
    });
    it('should not type canceled events', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.evaluate(() => {
        window.addEventListener('keydown', event => {
          event.stopPropagation();
          event.stopImmediatePropagation();
          if (event.key === 'l')
            event.preventDefault();
          if (event.key === 'o')
            Promise.resolve().then(() => event.preventDefault());
        }, false);
      });
      await page.keyboard.type('Hello World!');
      expect(await page.evaluate(() => textarea.value)).toBe('He Wrd!');
    });
    it('keyboard.modifiers()', async({page, server}) => {
      const keyboard = page.keyboard;
      expect(keyboard._modifiers).toBe(0);
      await keyboard.down('Shift');
      expect(keyboard._modifiers).toBe(8);
      await keyboard.down('Alt');
      expect(keyboard._modifiers).toBe(9);
      await keyboard.up('Shift');
      await keyboard.up('Alt');
      expect(keyboard._modifiers).toBe(0);
    });
    it('should resize the textarea', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      const {x, y, width, height} = await page.evaluate(dimensions);
      const mouse = page.mouse;
      await mouse.move(x + width - 4, y + height - 4);
      await mouse.down();
      await mouse.move(x + width + 100, y + height + 100);
      await mouse.up();
      const newDimensions = await page.evaluate(dimensions);
      expect(newDimensions.width).toBe(width + 104);
      expect(newDimensions.height).toBe(height + 104);
    });
    it('should scroll and click the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.click('#button-5');
      expect(await page.evaluate(() => document.querySelector('#button-5').textContent)).toBe('clicked');
      await page.click('#button-80');
      expect(await page.evaluate(() => document.querySelector('#button-80').textContent)).toBe('clicked');
    });
    it('should double click the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.evaluate(() => {
        window.double = false;
        const button = document.querySelector('button');
        button.addEventListener('dblclick', event => {
          window.double = true;
        });
      });
      const button = await page.$('button');
      await button.click({ clickCount: 2 });
      expect(await page.evaluate('double')).toBe(true);
      expect(await page.evaluate('result')).toBe('Clicked');
    });
    it('should click a partially obscured button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.evaluate(() => {
        const button = document.querySelector('button');
        button.textContent = 'Some really long text that will go offscreen';
        button.style.position = 'absolute';
        button.style.left = '368px';
      });
      await page.click('button');
      expect(await page.evaluate(() => window.result)).toBe('Clicked');
    });
    it('should select the text with mouse', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      const text = 'This is the text that we are going to try to select. Let\'s see how it goes.';
      await page.keyboard.type(text);
      await page.evaluate(() => document.querySelector('textarea').scrollTop = 0);
      const {x, y} = await page.evaluate(dimensions);
      await page.mouse.move(x + 2,y + 2);
      await page.mouse.down();
      await page.mouse.move(100,100);
      await page.mouse.up();
      expect(await page.evaluate(() => window.getSelection().toString())).toBe(text);
    });
    it('should select the text by triple clicking', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      const text = 'This is the text that we are going to try to select. Let\'s see how it goes.';
      await page.keyboard.type(text);
      await page.click('textarea');
      await page.click('textarea', {clickCount: 2});
      await page.click('textarea', {clickCount: 3});
      expect(await page.evaluate(() => window.getSelection().toString())).toBe(text);
    });
    it('should trigger hover state', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.hover('#button-6');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-6');
      await page.hover('#button-2');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-2');
      await page.hover('#button-91');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-91');
    });
    it('should fire contextmenu event on right click', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.click('#button-8', {button: 'right'});
      expect(await page.evaluate(() => document.querySelector('#button-8').textContent)).toBe('context menu');
    });
    it('should set modifier keys on click', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.evaluate(() => document.querySelector('#button-3').addEventListener('mousedown', e => window.lastEvent = e, true));
      const modifiers = {'Shift': 'shiftKey', 'Control': 'ctrlKey', 'Alt': 'altKey', 'Meta': 'metaKey'};
      for (const modifier in modifiers) {
        await page.keyboard.down(modifier);
        await page.click('#button-3');
        if (!(await page.evaluate(mod => window.lastEvent[mod], modifiers[modifier])))
          fail(modifiers[modifier] + ' should be true');
        await page.keyboard.up(modifier);
      }
      await page.click('#button-3');
      for (const modifier in modifiers) {
        if ((await page.evaluate(mod => window.lastEvent[mod], modifiers[modifier])))
          fail(modifiers[modifier] + ' should be false');
      }
    });
    it('should specify repeat property', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.evaluate(() => document.querySelector('textarea').addEventListener('keydown', e => window.lastEvent = e, true));
      await page.keyboard.down('a');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(false);
      await page.keyboard.press('a');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(true);

      await page.keyboard.down('b');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(false);
      await page.keyboard.down('b');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(true);

      await page.keyboard.up('a');
      await page.keyboard.down('a');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(false);
    });
    // @see https://github.com/GoogleChrome/puppeteer/issues/206
    it('should click links which cause navigation', async({page, server}) => {
      await page.setContent(`<a href="${server.EMPTY_PAGE}">empty.html</a>`);
      // This await should not hang.
      await page.click('a');
    });
    it('should tween mouse movement', async({page, server}) => {
      await page.mouse.move(100, 100);
      await page.evaluate(() => {
        window.result = [];
        document.addEventListener('mousemove', event => {
          window.result.push([event.clientX, event.clientY]);
        });
      });
      await page.mouse.move(200, 300, {steps: 5});
      expect(await page.evaluate('result')).toEqual([
        [120, 140],
        [140, 180],
        [160, 220],
        [180, 260],
        [200, 300]
      ]);
    });
    it('should tap the button', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      await page.tap('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
    xit('should report touches', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/touches.html');
      const button = await page.$('button');
      await button.tap();
      expect(await page.evaluate(() => getResult())).toEqual(['Touchstart: 0', 'Touchend: 0']);
    });
    it('should click the button inside an iframe', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent('<div style="width:100px;height:100px">spacer</div>');
      await FrameUtils.attachFrame(page, 'button-test', server.PREFIX + '/input/button.html');
      const frame = page.frames()[1];
      const button = await frame.$('button');
      await button.click();
      expect(await frame.evaluate(() => window.result)).toBe('Clicked');
    });
    it('should click the button with deviceScaleFactor set', async({page, server}) => {
      await page.setViewport({width: 400, height: 400, deviceScaleFactor: 5});
      expect(await page.evaluate(() => window.devicePixelRatio)).toBe(5);
      await page.setContent('<div style="width:100px;height:100px">spacer</div>');
      await FrameUtils.attachFrame(page, 'button-test', server.PREFIX + '/input/button.html');
      const frame = page.frames()[1];
      const button = await frame.$('button');
      await button.click();
      expect(await frame.evaluate(() => window.result)).toBe('Clicked');
    });
    it('should type all kinds of characters', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      const text = 'This text goes onto two lines.\nThis character is 嗨.';
      await page.keyboard.type(text);
      expect(await page.evaluate('result')).toBe(text);
    });
    it('should specify location', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/textarea.html');
      await page.evaluate(() => {
        window.addEventListener('keydown', event => window.keyLocation = event.location, true);
      });
      const textarea = await page.$('textarea');

      await textarea.press('Digit5');
      expect(await page.evaluate('keyLocation')).toBe(0);

      await textarea.press('ControlLeft');
      expect(await page.evaluate('keyLocation')).toBe(1);

      await textarea.press('ControlRight');
      expect(await page.evaluate('keyLocation')).toBe(2);

      await textarea.press('NumpadSubtract');
      expect(await page.evaluate('keyLocation')).toBe(3);
    });
    it('should throw on unknown keys', async({page, server}) => {
      let error = await page.keyboard.press('NotARealKey').catch(e => e);
      expect(error.message).toBe('Unknown key: "NotARealKey"');

      error = await page.keyboard.press('ё').catch(e => e);
      expect(error && error.message).toBe('Unknown key: "ё"');

      error = await page.keyboard.press('😊').catch(e => e);
      expect(error && error.message).toBe('Unknown key: "😊"');
    });
    function dimensions() {
      const rect = document.querySelector('textarea').getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
  });

  describe('Page.setUserAgent', function() {
    it('should work', async({page, server}) => {
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Mozilla');
      page.setUserAgent('foobar');
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      expect(request.headers['user-agent']).toBe('foobar');
    });
    it('should emulate device user-agent', async({page, server}) => {
      await page.goto(server.PREFIX + '/mobile.html');
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Chrome');
      await page.setUserAgent(iPhone.userAgent);
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Safari');
    });
  });

  describe('Page.setExtraHTTPHeaders', function() {
    it('should work', async({page, server}) => {
      await page.setExtraHTTPHeaders({
        foo: 'bar'
      });
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(server.EMPTY_PAGE),
      ]);
      expect(request.headers['foo']).toBe('bar');
    });
    it('should throw for non-string header values', async({page, server}) => {
      let error = null;
      try {
        await page.setExtraHTTPHeaders({ 'foo': 1 });
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Expected value of header "foo" to be String, but "number" is found.');
    });
  });

  describe('Page.authenticate', function() {
    it('should work', async({page, server}) => {
      server.setAuth('/empty.html', 'user', 'pass');
      let response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(401);
      await page.authenticate({
        username: 'user',
        password: 'pass'
      });
      response = await page.reload();
      expect(response.status()).toBe(200);
    });
    it('should fail if wrong credentials', async({page, server}) => {
      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user2', 'pass2');
      await page.authenticate({
        username: 'foo',
        password: 'bar'
      });
      const response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(401);
    });
    it('should allow disable authentication', async({page, server}) => {
      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user3', 'pass3');
      await page.authenticate({
        username: 'user3',
        password: 'pass3'
      });
      let response = await page.goto(server.EMPTY_PAGE);
      expect(response.status()).toBe(200);
      await page.authenticate(null);
      // Navigate to a different origin to bust Chrome's credential caching.
      response = await page.goto(server.CROSS_PROCESS_PREFIX + '/empty.html');
      expect(response.status()).toBe(401);
    });
  });

  describe('Page.setContent', function() {
    const expectedOutput = '<html><head></head><body><div>hello</div></body></html>';
    it('should work', async({page, server}) => {
      await page.setContent('<div>hello</div>');
      const result = await page.content();
      expect(result).toBe(expectedOutput);
    });
    it('should work with doctype', async({page, server}) => {
      const doctype = '<!DOCTYPE html>';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    });
    it('should work with HTML 4 doctype', async({page, server}) => {
      const doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
        '"http://www.w3.org/TR/html4/strict.dtd">';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    });
  });

  describe('Network Events', function() {
    it('Page.Events.Request', async({page, server}) => {
      const requests = [];
      page.on('request', request => requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
      expect(requests[0].resourceType()).toBe('document');
      expect(requests[0].method()).toBe('GET');
      expect(requests[0].response()).toBeTruthy();
      expect(requests[0].frame() === page.mainFrame()).toBe(true);
      expect(requests[0].frame().url()).toBe(server.EMPTY_PAGE);
    });
    it('Page.Events.Request should report post data', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      server.setRoute('/post', (req, res) => res.end());
      let request = null;
      page.on('request', r => request = r);
      await page.evaluate(() => fetch('./post', { method: 'POST', body: JSON.stringify({foo: 'bar'})}));
      expect(request).toBeTruthy();
      expect(request.postData()).toBe('{"foo":"bar"}');
    });
    it('Page.Events.Response', async({page, server}) => {
      const responses = [];
      page.on('response', response => responses.push(response));
      await page.goto(server.EMPTY_PAGE);
      expect(responses.length).toBe(1);
      expect(responses[0].url()).toBe(server.EMPTY_PAGE);
      expect(responses[0].status()).toBe(200);
      expect(responses[0].ok()).toBe(true);
      expect(responses[0].fromCache()).toBe(false);
      expect(responses[0].fromServiceWorker()).toBe(false);
      expect(responses[0].request()).toBeTruthy();
    });

    it('Response.fromCache()', async({page, server}) => {
      const responses = new Map();
      page.on('response', r => responses.set(r.url().split('/').pop(), r));

      // Load and re-load to make sure it's cached.
      await page.goto(server.PREFIX + '/cached/one-style.html');
      await page.reload();

      expect(responses.size).toBe(2);
      expect(responses.get('one-style.html').status()).toBe(304);
      expect(responses.get('one-style.html').fromCache()).toBe(false);
      expect(responses.get('one-style.css').status()).toBe(200);
      expect(responses.get('one-style.css').fromCache()).toBe(true);
    });
    it('Response.fromServiceWorker', async({page, server}) => {
      const responses = new Map();
      page.on('response', r => responses.set(r.url().split('/').pop(), r));

      // Load and re-load to make sure serviceworker is installed and running.
      await page.goto(server.PREFIX + '/serviceworkers/fetch/sw.html', {waitUntil: 'networkidle2'});
      await page.reload();

      expect(responses.size).toBe(2);
      expect(responses.get('sw.html').status()).toBe(200);
      expect(responses.get('sw.html').fromServiceWorker()).toBe(true);
      expect(responses.get('style.css').status()).toBe(200);
      expect(responses.get('style.css').fromServiceWorker()).toBe(true);
    });

    it('Page.Events.Response should provide body', async({page, server}) => {
      let response = null;
      page.on('response', r => response = r);
      await page.goto(server.PREFIX + '/simple.json');
      expect(response).toBeTruthy();
      expect(await response.text()).toBe('{"foo": "bar"}\n');
      expect(await response.json()).toEqual({foo: 'bar'});
    });
    it('Page.Events.Response should not report body unless request is finished', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      // Setup server to trap request.
      let serverResponse = null;
      server.setRoute('/get', (req, res) => {
        serverResponse = res;
        res.write('hello ');
      });
      // Setup page to trap response.
      let pageResponse = null;
      let requestFinished = false;
      page.on('response', r => pageResponse = r);
      page.on('requestfinished', () => requestFinished = true);
      // send request and wait for server response
      await Promise.all([
        page.evaluate(() => fetch('./get', { method: 'GET'})),
        waitForEvents(page, 'response')
      ]);

      expect(serverResponse).toBeTruthy();
      expect(pageResponse).toBeTruthy();
      expect(pageResponse.status()).toBe(200);
      expect(requestFinished).toBe(false);

      const responseText = pageResponse.text();
      // Write part of the response and wait for it to be flushed.
      await new Promise(x => serverResponse.write('wor', x));
      // Finish response.
      await new Promise(x => serverResponse.end('ld!', x));
      expect(await responseText).toBe('hello world!');
    });
    it('Page.Events.RequestFailed', async({page, server}) => {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().endsWith('css'))
          request.abort();
        else
          request.continue();
      });
      const failedRequests = [];
      page.on('requestfailed', request => failedRequests.push(request));
      await page.goto(server.PREFIX + '/one-style.html');
      expect(failedRequests.length).toBe(1);
      expect(failedRequests[0].url()).toContain('one-style.css');
      expect(failedRequests[0].response()).toBe(null);
      expect(failedRequests[0].resourceType()).toBe('stylesheet');
      expect(failedRequests[0].failure().errorText).toBe('net::ERR_FAILED');
      expect(failedRequests[0].frame()).toBeTruthy();
    });
    it('Page.Events.RequestFinished', async({page, server}) => {
      const requests = [];
      page.on('requestfinished', request => requests.push(request));
      await page.goto(server.EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url()).toBe(server.EMPTY_PAGE);
      expect(requests[0].response()).toBeTruthy();
      expect(requests[0].frame() === page.mainFrame()).toBe(true);
      expect(requests[0].frame().url()).toBe(server.EMPTY_PAGE);
    });
    it('should fire events in proper order', async({page, server}) => {
      const events = [];
      page.on('request', request => events.push('request'));
      page.on('response', response => events.push('response'));
      page.on('requestfinished', request => events.push('requestfinished'));
      await page.goto(server.EMPTY_PAGE);
      expect(events).toEqual(['request', 'response', 'requestfinished']);
    });
    it('should support redirects', async({page, server}) => {
      const events = [];
      page.on('request', request => events.push(`${request.method()} ${request.url()}`));
      page.on('response', response => events.push(`${response.status()} ${response.url()}`));
      page.on('requestfinished', request => events.push(`DONE ${request.url()}`));
      page.on('requestfailed', request => events.push(`FAIL ${request.url()}`));
      server.setRedirect('/foo.html', '/empty.html');
      const FOO_URL = server.PREFIX + '/foo.html';
      await page.goto(FOO_URL);
      expect(events).toEqual([
        `GET ${FOO_URL}`,
        `302 ${FOO_URL}`,
        `DONE ${FOO_URL}`,
        `GET ${server.EMPTY_PAGE}`,
        `200 ${server.EMPTY_PAGE}`,
        `DONE ${server.EMPTY_PAGE}`
      ]);
    });
  });

  describe('Page.addScriptTag', function() {
    it('should throw an error if no options are provided', async({page, server}) => {
      let error = null;
      try {
        await page.addScriptTag('/injectedfile.js');
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Provide an object with a `url`, `path` or `content` property');
    });

    it('should work with a url', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({ url: '/injectedfile.js' });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(() => __injected)).toBe(42);
    });

    it('should throw an error if loading from url fail', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      let error = null;
      try {
        await page.addScriptTag({ url: '/nonexistfile.js' });
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Loading script from /nonexistfile.js failed');
    });

    it('should work with a path', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({ path: path.join(__dirname, 'assets/injectedfile.js') });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(() => __injected)).toBe(42);
    });

    it('should include sourcemap when path is provided', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({ path: path.join(__dirname, 'assets/injectedfile.js') });
      const result = await page.evaluate(() => __injectedError.stack);
      expect(result).toContain(path.join('assets', 'injectedfile.js'));
    });

    it('should work with content', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const scriptHandle = await page.addScriptTag({ content: 'window.__injected = 35;' });
      expect(scriptHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(() => __injected)).toBe(35);
    });
  });

  describe('Page.addStyleTag', function() {
    it('should throw an error if no options are provided', async({page, server}) => {
      let error = null;
      try {
        await page.addStyleTag('/injectedstyle.css');
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Provide an object with a `url`, `path` or `content` property');
    });

    it('should work with a url', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({ url: '/injectedstyle.css' });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(255, 0, 0)');
    });

    it('should throw an error if loading from url fail', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      let error = null;
      try {
        await page.addStyleTag({ url: '/nonexistfile.js' });
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Loading style from /nonexistfile.js failed');
    });

    it('should work with a path', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({ path: path.join(__dirname, 'assets/injectedstyle.css') });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(255, 0, 0)');
    });

    it('should include sourcemap when path is provided', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addStyleTag({ path: path.join(__dirname, 'assets/injectedstyle.css') });
      const styleHandle = await page.$('style');
      const styleContent = await page.evaluate(style => style.innerHTML, styleHandle);
      expect(styleContent).toContain(path.join('assets', 'injectedstyle.css'));
    });

    it('should work with content', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      const styleHandle = await page.addStyleTag({ content: 'body { background-color: green; }' });
      expect(styleHandle.asElement()).not.toBeNull();
      expect(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(0, 128, 0)');
    });
  });

  describe('Page.url', function() {
    it('should work', async({page, server}) => {
      expect(page.url()).toBe('about:blank');
      await page.goto(server.EMPTY_PAGE);
      expect(page.url()).toBe(server.EMPTY_PAGE);
    });
  });

  describe('Page.viewport', function() {
    it('should get the proper viewport size', async({page, server}) => {
      expect(page.viewport()).toEqual({width: 800, height: 600});
      await page.setViewport({width: 123, height: 456});
      expect(page.viewport()).toEqual({width: 123, height: 456});
    });
    it('should support mobile emulation', async({page, server}) => {
      await page.goto(server.PREFIX + '/mobile.html');
      expect(await page.evaluate(() => window.innerWidth)).toBe(800);
      await page.setViewport(iPhone.viewport);
      expect(await page.evaluate(() => window.innerWidth)).toBe(375);
      await page.setViewport({width: 400, height: 300});
      expect(await page.evaluate(() => window.innerWidth)).toBe(400);
    });
    it('should support touch emulation', async({page, server}) => {
      await page.goto(server.PREFIX + '/mobile.html');
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(false);
      await page.setViewport(iPhone.viewport);
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(true);
      expect(await page.evaluate(dispatchTouch)).toBe('Received touch');
      await page.setViewport({width: 100, height: 100});
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(false);

      function dispatchTouch() {
        let fulfill;
        const promise = new Promise(x => fulfill = x);
        window.ontouchstart = function(e) {
          fulfill('Received touch');
        };
        window.dispatchEvent(new Event('touchstart'));

        fulfill('Did not receive touch');

        return promise;
      }
    });
    it('should be detectable by Modernizr', async({page, server}) => {
      await page.goto(server.PREFIX + '/detect-touch.html');
      expect(await page.evaluate(() => document.body.textContent.trim())).toBe('NO');
      await page.setViewport(iPhone.viewport);
      await page.goto(server.PREFIX + '/detect-touch.html');
      expect(await page.evaluate(() => document.body.textContent.trim())).toBe('YES');
    });
    it('should support landscape emulation', async({page, server}) => {
      await page.goto(server.PREFIX + '/mobile.html');
      expect(await page.evaluate(() => screen.orientation.type)).toBe('portrait-primary');
      await page.setViewport(iPhoneLandscape.viewport);
      expect(await page.evaluate(() => screen.orientation.type)).toBe('landscape-primary');
      await page.setViewport({width: 100, height: 100});
      expect(await page.evaluate(() => screen.orientation.type)).toBe('portrait-primary');
    });
  });

  describe('Page.emulate', function() {
    it('should work', async({page, server}) => {
      await page.goto(server.PREFIX + '/mobile.html');
      await page.emulate(iPhone);
      expect(await page.evaluate(() => window.innerWidth)).toBe(375);
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Safari');
    });
    it('should support clicking', async({page, server}) => {
      await page.emulate(iPhone);
      await page.goto(server.PREFIX + '/input/button.html');
      const button = await page.$('button');
      await page.evaluate(button => button.style.marginTop = '200px', button);
      await button.click();
      expect(await page.evaluate(() => result)).toBe('Clicked');
    });
  });

  describe('Page.emulateMedia', function() {
    it('should work', async({page, server}) => {
      expect(await page.evaluate(() => window.matchMedia('screen').matches)).toBe(true);
      expect(await page.evaluate(() => window.matchMedia('print').matches)).toBe(false);
      await page.emulateMedia('print');
      expect(await page.evaluate(() => window.matchMedia('screen').matches)).toBe(false);
      expect(await page.evaluate(() => window.matchMedia('print').matches)).toBe(true);
      await page.emulateMedia(null);
      expect(await page.evaluate(() => window.matchMedia('screen').matches)).toBe(true);
      expect(await page.evaluate(() => window.matchMedia('print').matches)).toBe(false);
    });
    it('should throw in case of bad argument', async({page, server}) => {
      let error = null;
      await page.emulateMedia('bad').catch(e => error = e);
      expect(error.message).toBe('Unsupported media type: bad');
    });
  });

  describe('Page.setJavaScriptEnabled', function() {
    it('should work', async({page, server}) => {
      await page.setJavaScriptEnabled(false);
      await page.goto('data:text/html, <script>var something = "forbidden"</script>');
      let error = null;
      await page.evaluate('something').catch(e => error = e);
      expect(error.message).toContain('something is not defined');

      await page.setJavaScriptEnabled(true);
      await page.goto('data:text/html, <script>var something = "forbidden"</script>');
      expect(await page.evaluate('something')).toBe('forbidden');
    });
  });

  describe('Page.evaluateOnNewDocument', function() {
    it('should evaluate before anything else on the page', async({page, server}) => {
      await page.evaluateOnNewDocument(function(){
        window.injected = 123;
      });
      await page.goto(server.PREFIX + '/tamperable.html');
      expect(await page.evaluate(() => window.result)).toBe(123);
    });
  });

  describe('Page.setCacheEnabled', function() {
    it('should enable or disable the cache based on the state passed', async({page, server}) => {
      const responses = new Map();
      page.on('response', r => responses.set(r.url().split('/').pop(), r));

      await page.goto(server.PREFIX + '/cached/one-style.html', {waitUntil: 'networkidle2'});
      await page.reload({waitUntil: 'networkidle2'});
      expect(responses.get('one-style.css').fromCache()).toBe(true);

      await page.setCacheEnabled(false);
      await page.reload({waitUntil: 'networkidle2'});
      expect(responses.get('one-style.css').fromCache()).toBe(false);
    });
  });

  // Printing to pdf is currently only supported in headless
  (headless ? describe : xdescribe)('Page.pdf', function() {
    it('should be able to save file', async({page, server}) => {
      const outputFile = __dirname + '/assets/output.pdf';
      await page.pdf({path: outputFile});
      expect(fs.readFileSync(outputFile).byteLength).toBeGreaterThan(0);
      fs.unlinkSync(outputFile);
    });
    it('should default to printing in Letter format', async({page, server}) => {
      const pages = await getPDFPages(await page.pdf());
      expect(pages.length).toBe(1);
      expect(pages[0].width).toBeCloseTo(8.5, 2);
      expect(pages[0].height).toBeCloseTo(11, 2);
    });
    it('should support setting custom format', async({page, server}) => {
      const pages = await getPDFPages(await page.pdf({
        format: 'a4'
      }));
      expect(pages.length).toBe(1);
      expect(pages[0].width).toBeCloseTo(8.27, 1);
      expect(pages[0].height).toBeCloseTo(11.7, 1);
    });
    it('should support setting paper width and height', async({page, server}) => {
      const pages = await getPDFPages(await page.pdf({
        width: '10in',
        height: '10in',
      }));
      expect(pages.length).toBe(1);
      expect(pages[0].width).toBeCloseTo(10, 2);
      expect(pages[0].height).toBeCloseTo(10, 2);
    });
    it('should print multiple pages', async({page, server}) => {
      await page.goto(server.PREFIX + '/grid.html');
      // Define width and height in CSS pixels.
      const width = 50 * 5 + 1;
      const height = 50 * 5 + 1;
      const pages = await getPDFPages(await page.pdf({width, height}));
      expect(pages.length).toBe(8);
      expect(pages[0].width).toBeCloseTo(cssPixelsToInches(width), 2);
      expect(pages[0].height).toBeCloseTo(cssPixelsToInches(height), 2);
    });
    it('should support page ranges', async({page, server}) => {
      await page.goto(server.PREFIX + '/grid.html');
      // Define width and height in CSS pixels.
      const width = 50 * 5 + 1;
      const height = 50 * 5 + 1;
      const pages = await getPDFPages(await page.pdf({width, height, pageRanges: '1,4-7'}));
      expect(pages.length).toBe(5);
    });
    it('should throw if format is unknown', async({page, server}) => {
      let error = null;
      try {
        await getPDFPages(await page.pdf({
          format: 'something'
        }));
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain('Unknown paper format');
    });
    it('should throw if units are unknown', async({page, server}) => {
      let error = null;
      try {
        await getPDFPages(await page.pdf({
          width: '10em',
          height: '10em',
        }));
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain('Failed to parse parameter value');
    });
  });

  describe('Page.title', function() {
    it('should return the page title', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/button.html');
      expect(await page.title()).toBe('Button test');
    });
  });

  describe('Page.screenshot', function() {
    it('should work', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot();
      expect(screenshot).toBeGolden('screenshot-sanity.png');
    });
    it('should clip rect', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        clip: {
          x: 50,
          y: 100,
          width: 150,
          height: 100
        }
      });
      expect(screenshot).toBeGolden('screenshot-clip-rect.png');
    });
    it('should work for offscreen clip', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        clip: {
          x: 50,
          y: 600,
          width: 100,
          height: 100
        }
      });
      expect(screenshot).toBeGolden('screenshot-offscreen-clip.png');
    });
    it('should run in parallel', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const promises = [];
      for (let i = 0; i < 3; ++i) {
        promises.push(page.screenshot({
          clip: {
            x: 50 * i,
            y: 0,
            width: 50,
            height: 50
          }
        }));
      }
      const screenshots = await Promise.all(promises);
      expect(screenshots[1]).toBeGolden('grid-cell-1.png');
    });
    it('should take fullPage screenshots', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        fullPage: true
      });
      expect(screenshot).toBeGolden('screenshot-grid-fullpage.png');
    });
    it('should run in parallel in multiple pages', async({page, server, browser}) => {
      const N = 2;
      const pages = await Promise.all(Array(N).fill(0).map(async() => {
        const page = await browser.newPage();
        await page.goto(server.PREFIX + '/grid.html');
        return page;
      }));
      const promises = [];
      for (let i = 0; i < N; ++i)
        promises.push(pages[i].screenshot({ clip: { x: 50 * i, y: 0, width: 50, height: 50 } }));
      const screenshots = await Promise.all(promises);
      for (let i = 0; i < N; ++i)
        expect(screenshots[i]).toBeGolden(`grid-cell-${i}.png`);
      await Promise.all(pages.map(page => page.close()));
    });
    it('should allow transparency', async({page, server}) => {
      await page.setViewport({ width: 100, height: 100 });
      await page.goto(server.EMPTY_PAGE);
      const screenshot = await page.screenshot({omitBackground: true});
      expect(screenshot).toBeGolden('transparent.png');
    });
    it('should work with odd clip size on Retina displays', async({page, server}) => {
      const screenshot = await page.screenshot({
        clip: {
          x: 0,
          y: 0,
          width: 11,
          height: 11,
        }
      });
      expect(screenshot).toBeGolden('screenshot-clip-odd-size.png');
    });
  });

  describe('Page.select', function() {
    it('should select single option', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(await page.evaluate(() => result.onInput)).toEqual(['blue']);
      expect(await page.evaluate(() => result.onChange)).toEqual(['blue']);
    });
    it('should select only first option', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue', 'green', 'red');
      expect(await page.evaluate(() => result.onInput)).toEqual(['blue']);
      expect(await page.evaluate(() => result.onChange)).toEqual(['blue']);
    });
    it('should select multiple options', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => makeMultiple());
      await page.select('select', 'blue', 'green', 'red');
      expect(await page.evaluate(() => result.onInput)).toEqual(['blue', 'green', 'red']);
      expect(await page.evaluate(() => result.onChange)).toEqual(['blue', 'green', 'red']);
    });
    it('should respect event bubbling', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(await page.evaluate(() => result.onBubblingInput)).toEqual(['blue']);
      expect(await page.evaluate(() => result.onBubblingChange)).toEqual(['blue']);
    });
    it('should throw when element is not a <select>', async({page, server}) => {
      let error = null;
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('body', '').catch(e => error = e);
      expect(error.message).toContain('Element is not a <select> element.');
    });
    it('should return [] on no matched values', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select','42','abc');
      expect(result).toEqual([]);
    });
    it('should return an array of matched values', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => makeMultiple());
      const result = await page.select('select','blue','black','magenta');
      expect(result.reduce((accumulator,current) => ['blue', 'black', 'magenta'].includes(current) && accumulator, true)).toEqual(true);
    });
    it('should return an array of one element when multiple is not set', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select','42','blue','black','magenta');
      expect(result.length).toEqual(1);
    });
    it('should return [] on no values',async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      const result = await page.select('select');
      expect(result).toEqual([]);
    });
    it('should deselect all options when passed no values for a multiple select',async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.evaluate(() => makeMultiple());
      await page.select('select','blue','black','magenta');
      await page.select('select');
      expect(await page.$eval('select', select => Array.from(select.options).every(option => !option.selected))).toEqual(true);
    });
    it('should deselect all options when passed no values for a select without multiple',async({page, server}) => {
      await page.goto(server.PREFIX + '/input/select.html');
      await page.select('select','blue','black','magenta');
      await page.select('select');
      expect(await page.$eval('select', select => Array.from(select.options).every(option => !option.selected))).toEqual(true);
    });
    it('should throw if passed in non-strings', async({page, server}) => {
      await page.setContent('<select><option value="12"/></select>');
      let error = null;
      try {
        await page.select('select', 12);
      } catch (e) {
        error = e;
      }
      expect(error.message).toContain('Values must be strings');
    });
  });

  describe('Tracing', function() {
    beforeEach(function(state) {
      state.outputFile = path.join(__dirname, 'assets', `trace-${state.parallelIndex}.json`);
    });
    afterEach(function(state) {
      fs.unlinkSync(state.outputFile);
      state.outputFile = null;
    });
    it('should output a trace', async({page, server, outputFile}) => {
      await page.tracing.start({screenshots: true, path: outputFile});
      await page.goto(server.PREFIX + '/grid.html');
      await page.tracing.stop();
      expect(fs.existsSync(outputFile)).toBe(true);
    });
    it('should run with custom categories if provided', async({page, outputFile}) => {
      await page.tracing.start({path: outputFile, categories: ['disabled-by-default-v8.cpu_profiler.hires']});
      await page.tracing.stop();

      const traceJson = JSON.parse(fs.readFileSync(outputFile));
      expect(traceJson.metadata['trace-config']).toContain('disabled-by-default-v8.cpu_profiler.hires');
    });
    it('should throw if tracing on two pages', async({page, server, browser, outputFile}) => {
      await page.tracing.start({path: outputFile});
      const newPage = await browser.newPage();
      let error = null;
      await newPage.tracing.start({path: outputFile}).catch(e => error = e);
      await newPage.close();
      expect(error).toBeTruthy();
      await page.tracing.stop();
    });
  });

  describe('Cookies', function() {
    afterEach(async({page, server}) => {
      const cookies = await page.cookies(server.PREFIX + '/grid.html', server.CROSS_PROCESS_PREFIX);
      for (const cookie of cookies)
        await page.deleteCookie(cookie);
    });
    it('should set and get cookies', async({page, server}) => {
      await page.goto(server.PREFIX + '/grid.html');
      expect(await page.cookies()).toEqual([]);
      await page.evaluate(() => {
        document.cookie = 'username=John Doe';
      });
      expect(await page.cookies()).toEqual([{
        name: 'username',
        value: 'John Doe',
        domain: 'localhost',
        path: '/',
        expires: -1,
        size: 16,
        httpOnly: false,
        secure: false,
        session: true }
      ]);
      await page.setCookie({
        name: 'password',
        value: '123456'
      });
      expect(await page.evaluate('document.cookie')).toBe('username=John Doe; password=123456');
      const cookies = await page.cookies();
      expect(cookies.sort((a, b) => a.name.localeCompare(b.name))).toEqual([{
        name: 'password',
        value: '123456',
        domain: 'localhost',
        path: '/',
        expires: -1,
        size: 14,
        httpOnly: false,
        secure: false,
        session: true
      }, {
        name: 'username',
        value: 'John Doe',
        domain: 'localhost',
        path: '/',
        expires: -1,
        size: 16,
        httpOnly: false,
        secure: false,
        session: true
      }]);
    });

    it('should set a cookie with a path', async({page, server}) => {
      await page.goto(server.PREFIX + '/grid.html');
      await page.setCookie({
        name: 'gridcookie',
        value: 'GRID',
        path: '/grid.html'
      });
      expect(await page.cookies()).toEqual([{
        name: 'gridcookie',
        value: 'GRID',
        domain: 'localhost',
        path: '/grid.html',
        expires: -1,
        size: 14,
        httpOnly: false,
        secure: false,
        session: true
      }]);
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
      await page.goto(server.PREFIX + '/empty.html');
      expect(await page.cookies()).toEqual([]);
      expect(await page.evaluate('document.cookie')).toBe('');
      await page.goto(server.PREFIX + '/grid.html');
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
    });


    it('should delete a cookie', async({page, server}) => {
      await page.goto(server.PREFIX + '/grid.html');
      await page.setCookie({
        name: 'cookie1',
        value: '1'
      }, {
        name: 'cookie2',
        value: '2'
      }, {
        name: 'cookie3',
        value: '3'
      });
      expect(await page.evaluate('document.cookie')).toBe('cookie1=1; cookie2=2; cookie3=3');
      await page.deleteCookie({name: 'cookie2'});
      expect(await page.evaluate('document.cookie')).toBe('cookie1=1; cookie3=3');
    });

    it('should not set a cookie on a blank page', async function({page}) {
      let error = null;
      await page.goto('about:blank');
      try {
        await page.setCookie({name: 'example-cookie', value: 'best'});
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toEqual('Protocol error (Network.deleteCookies): At least one of the url and domain needs to be specified undefined');
    });

    it('should not set a cookie with blank page URL', async function({page, server}) {
      let error = null;
      await page.goto(server.PREFIX + '/grid.html');
      try {
        await page.setCookie(
            {name: 'example-cookie', value: 'best'},
            {url: 'about:blank', name: 'example-cookie-blank', value: 'best'}
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toEqual(
          `Blank page can not have cookie "example-cookie-blank"`
      );
    });

    it('should not set a cookie on a data URL page', async function({page}) {
      let error = null;
      await page.goto('data:,Hello%2C%20World!');
      try {
        await page.setCookie({name: 'example-cookie', value: 'best'});
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toEqual(
          'Protocol error (Network.deleteCookies): At least one of the url and domain needs to be specified undefined'
      );
    });

    it('should not set a cookie with blank page URL', async function({page, server}) {
      let error = null;
      await page.goto(server.PREFIX + '/grid.html');
      try {
        await page.setCookie({name: 'example-cookie', value: 'best'}, {url: 'about:blank', name: 'example-cookie-blank', value: 'best'});
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toEqual(`Blank page can not have cookie "example-cookie-blank"`);
    });

    it('should set a cookie on a different domain', async({page, server}) => {
      await page.goto(server.PREFIX + '/grid.html');
      await page.setCookie({name: 'example-cookie', value: 'best',  url: 'https://www.example.com'});
      expect(await page.evaluate('document.cookie')).toBe('');
      expect(await page.cookies()).toEqual([]);
      expect(await page.cookies('https://www.example.com')).toEqual([{
        name: 'example-cookie',
        value: 'best',
        domain: 'www.example.com',
        path: '/',
        expires: -1,
        size: 18,
        httpOnly: false,
        secure: true,
        session: true
      }]);
    });

    it('should set cookies from a frame', async({page, server}) => {
      await page.goto(server.PREFIX + '/grid.html');
      await page.setCookie({name: 'localhost-cookie', value: 'best'});
      await page.evaluate(src => {
        let fulfill;
        const promise = new Promise(x => fulfill = x);
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        iframe.onload = fulfill;
        iframe.src = src;
        return promise;
      }, server.CROSS_PROCESS_PREFIX);
      await page.setCookie({name: '127-cookie', value: 'worst', url: server.CROSS_PROCESS_PREFIX});
      expect(await page.evaluate('document.cookie')).toBe('localhost-cookie=best');
      expect(await page.frames()[1].evaluate('document.cookie')).toBe('127-cookie=worst');

      expect(await page.cookies()).toEqual([{
        name: 'localhost-cookie',
        value: 'best',
        domain: 'localhost',
        path: '/',
        expires: -1,
        size: 20,
        httpOnly: false,
        secure: false,
        session: true
      }]);

      expect(await page.cookies(server.CROSS_PROCESS_PREFIX)).toEqual([{
        name: '127-cookie',
        value: 'worst',
        domain: '127.0.0.1',
        path: '/',
        expires: -1,
        size: 15,
        httpOnly: false,
        secure: false,
        session: true
      }]);

    });
  });

  describe('Target', function() {
    it('Browser.targets should return all of the targets', async({page, server, browser}) => {
      // The pages will be the testing page and the original newtab page
      const targets = browser.targets();
      expect(targets.some(target => target.type() === 'page' &&
        target.url() === 'about:blank')).toBeTruthy('Missing blank page');
      expect(targets.some(target => target.type() === 'browser')).toBeTruthy('Missing browser target');
    });
    it('Browser.pages should return all of the pages', async({page, server, browser}) => {
      // The pages will be the testing page and the original newtab page
      const allPages = await browser.pages();
      expect(allPages.length).toBe(2);
      expect(allPages).toContain(page);
      expect(allPages[0]).not.toBe(allPages[1]);
    });
    it('should contain browser target', async({browser}) => {
      const targets = browser.targets();
      const browserTarget = targets.find(target => target.type() === 'browser');
      expect(browserTarget).toBeTruthy();
    });
    it('should be able to use the default page in the browser', async({page, server, browser}) => {
      // The pages will be the testing page and the original newtab page
      const allPages = await browser.pages();
      const originalPage = allPages.find(p => p !== page);
      expect(await originalPage.evaluate(() => ['Hello', 'world'].join(' '))).toBe('Hello world');
      expect(await originalPage.$('body')).toBeTruthy();
    });
    it('should report when a new page is created and closed', async({page, server, browser}) => {
      const otherPagePromise = new Promise(fulfill => browser.once('targetcreated', target => fulfill(target.page())));
      await page.evaluate(url => window.open(url), server.CROSS_PROCESS_PREFIX);
      const otherPage = await otherPagePromise;
      expect(otherPage.url()).toContain(server.CROSS_PROCESS_PREFIX);

      expect(await otherPage.evaluate(() => ['Hello', 'world'].join(' '))).toBe('Hello world');
      expect(await otherPage.$('body')).toBeTruthy();

      let allPages = await browser.pages();
      expect(allPages).toContain(page);
      expect(allPages).toContain(otherPage);

      const closePagePromise = new Promise(fulfill => browser.once('targetdestroyed', target => fulfill(target.page())));
      await otherPage.close();
      expect(await closePagePromise).toBe(otherPage);

      allPages = await Promise.all(browser.targets().map(target => target.page()));
      expect(allPages).toContain(page);
      expect(allPages).not.toContain(otherPage);
    });
    it('should report when a service worker is created and destroyed', async({page, server, browser}) => {
      await page.goto(server.EMPTY_PAGE);
      const createdTarget = new Promise(fulfill => browser.once('targetcreated', target => fulfill(target)));
      await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

      expect((await createdTarget).type()).toBe('service_worker');
      expect((await createdTarget).url()).toBe(server.PREFIX + '/serviceworkers/empty/sw.js');

      const destroyedTarget = new Promise(fulfill => browser.once('targetdestroyed', target => fulfill(target)));
      await page.evaluate(() => window.registrationPromise.then(registration => registration.unregister()));
      expect(await destroyedTarget).toBe(await createdTarget);
    });
    it('should report when a target url changes', async({page, server, browser}) => {
      await page.goto(server.EMPTY_PAGE);
      let changedTarget = new Promise(fulfill => browser.once('targetchanged', target => fulfill(target)));
      await page.goto(server.CROSS_PROCESS_PREFIX + '/');
      expect((await changedTarget).url()).toBe(server.CROSS_PROCESS_PREFIX + '/');

      changedTarget = new Promise(fulfill => browser.once('targetchanged', target => fulfill(target)));
      await page.goto(server.EMPTY_PAGE);
      expect((await changedTarget).url()).toBe(server.EMPTY_PAGE);
    });
    it('should not report uninitialized pages', async({page, server, browser}) => {
      let targetChanged = false;
      const listener = () => targetChanged = true;
      browser.on('targetchanged', listener);
      const targetPromise = new Promise(fulfill => browser.once('targetcreated', target => fulfill(target)));
      const newPagePromise = browser.newPage();
      const target = await targetPromise;
      expect(target.url()).toBe('about:blank');

      const newPage = await newPagePromise;
      const targetPromise2 = new Promise(fulfill => browser.once('targetcreated', target => fulfill(target)));
      const evaluatePromise = newPage.evaluate(() => window.open('about:blank'));
      const target2 = await targetPromise2;
      expect(target2.url()).toBe('about:blank');
      await evaluatePromise;
      await newPage.close();
      expect(targetChanged).toBe(false, 'target should not be reported as changed');
      browser.removeListener('targetchanged', listener);
    });
    it('should not crash while redirecting if original request was missed', async({page, server, browser}) => {
      let serverResponse = null;
      server.setRoute('/one-style.css', (req, res) => serverResponse = res);
      // Open a new page. Use window.open to connect to the page later.
      await Promise.all([
        page.evaluate(url => window.open(url), server.PREFIX + '/one-style.html'),
        server.waitForRequest('/one-style.css')
      ]);
      // Connect to the opened page.
      const target = browser.targets().find(target => target.url().includes('one-style.html'));
      const newPage = await target.page();
      // Issue a redirect.
      serverResponse.writeHead(302, { location: '/injectedstyle.css' });
      serverResponse.end();
      // Wait for the new page to load.
      await waitForEvents(newPage, 'load');
      // Cleanup.
      await newPage.close();
    });
  });

  describe('Connection', function() {
    it('should throw nice errors', async function({page}) {
      const error = await theSourceOfTheProblems().catch(error => error);
      expect(error.stack).toContain('theSourceOfTheProblems');
      expect(error.message).toContain('ThisCommand.DoesNotExist');
      async function theSourceOfTheProblems() {
        await page._client.send('ThisCommand.DoesNotExist');
      }
    });
  });

  describe('Target.createCDPSession', function() {
    it('should work', async function({page, server}) {
      const client = await page.target().createCDPSession();

      await Promise.all([
        client.send('Runtime.enable'),
        client.send('Runtime.evaluate', { expression: 'window.foo = "bar"' })
      ]);
      const foo = await page.evaluate(() => window.foo);
      expect(foo).toBe('bar');
    });
    it('should send events', async function({page, server}) {
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      const events = [];
      client.on('Network.requestWillBeSent', event => events.push(event));
      await page.goto(server.EMPTY_PAGE);
      expect(events.length).toBe(1);
    });
    it('should enable and disable domains independently', async function({page, server}) {
      const client = await page.target().createCDPSession();
      await client.send('Runtime.enable');
      await client.send('Debugger.enable');
      // JS coverage enables and then disables Debugger domain.
      await page.coverage.startJSCoverage();
      await page.coverage.stopJSCoverage();
      // generate a script in page and wait for the event.
      const [event] = await Promise.all([
        waitForEvents(client, 'Debugger.scriptParsed'),
        page.evaluate('//# sourceURL=foo.js')
      ]);
      // expect events to be dispatched.
      expect(event.url).toBe('foo.js');
    });
    it('should be able to detach session', async function({page, server}) {
      const client = await page.target().createCDPSession();
      await client.send('Runtime.enable');
      const evalResponse = await client.send('Runtime.evaluate', {expression: '1 + 2', returnByValue: true});
      expect(evalResponse.result.value).toBe(3);
      await client.detach();
      let error = null;
      try {
        await client.send('Runtime.evaluate', {expression: '3 + 1', returnByValue: true});
      } catch (e) {
        error = e;
      }
      expect(error.message).toContain('Session closed.');
    });
  });

  describe('JSCoverage', function() {
    it('should work', async function({page, server}) {
      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/simple.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage.length).toBe(1);
      expect(coverage[0].url).toContain('/jscoverage/simple.html');
      expect(coverage[0].ranges).toEqual([
        { start: 0, end: 17 },
        { start: 35, end: 61 },
      ]);
    });
    it('should report sourceURLs', async function({page, server}) {
      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/sourceurl.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage.length).toBe(1);
      expect(coverage[0].url).toBe('nicename.js');
    });
    it('should ignore anonymous scripts', async function({page, server}) {
      await page.coverage.startJSCoverage();
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => console.log(1));
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage.length).toBe(0);
    });
    it('should report multiple scripts', async function({page, server}) {
      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/multiple.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage.length).toBe(2);
      coverage.sort((a, b) => a.url.localeCompare(b.url));
      expect(coverage[0].url).toContain('/jscoverage/script1.js');
      expect(coverage[1].url).toContain('/jscoverage/script2.js');
    });
    it('should report right ranges', async function({page, server}) {
      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/ranges.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage.length).toBe(1);
      const entry = coverage[0];
      expect(entry.ranges.length).toBe(1);
      const range = entry.ranges[0];
      expect(entry.text.substring(range.start, range.end)).toBe(`console.log('used!');`);
    });
    it('should report scripts that have no coverage', async function({page, server}) {
      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/unused.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(coverage.length).toBe(1);
      const entry = coverage[0];
      expect(entry.url).toContain('unused.html');
      expect(entry.ranges.length).toBe(0);
    });
    it('should work with conditionals', async function({page, server}) {
      await page.coverage.startJSCoverage();
      await page.goto(server.PREFIX + '/jscoverage/involved.html');
      const coverage = await page.coverage.stopJSCoverage();
      expect(JSON.stringify(coverage, null, 2).replace(/:\d{4}\//g, ':<PORT>/')).toBeGolden('jscoverage-involved.txt');
    });
    describe('resetOnNavigation', function() {
      it('should report scripts across navigations when disabled', async function({page, server}) {
        await page.coverage.startJSCoverage({resetOnNavigation: false});
        await page.goto(server.PREFIX + '/jscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopJSCoverage();
        expect(coverage.length).toBe(2);
      });
      it('should NOT report scripts across navigations when enabled', async function({page, server}) {
        await page.coverage.startJSCoverage(); // Enabled by default.
        await page.goto(server.PREFIX + '/jscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopJSCoverage();
        expect(coverage.length).toBe(0);
      });
    });
  });
  describe('CSSCoverage', function() {
    it('should work', async function({page, server}) {
      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/simple.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage.length).toBe(1);
      expect(coverage[0].url).toContain('/csscoverage/simple.html');
      expect(coverage[0].ranges).toEqual([
        {start: 1, end: 22}
      ]);
      const range = coverage[0].ranges[0];
      expect(coverage[0].text.substring(range.start, range.end)).toBe('div { color: green; }');
    });
    it('should report sourceURLs', async function({page, server}) {
      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/sourceurl.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage.length).toBe(1);
      expect(coverage[0].url).toBe('nicename.css');
    });
    it('should report multiple stylesheets', async function({page, server}) {
      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/multiple.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage.length).toBe(2);
      coverage.sort((a, b) => a.url.localeCompare(b.url));
      expect(coverage[0].url).toContain('/csscoverage/stylesheet1.css');
      expect(coverage[1].url).toContain('/csscoverage/stylesheet2.css');
    });
    it('should report stylesheets that have no coverage', async function({page, server}) {
      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/unused.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage.length).toBe(1);
      expect(coverage[0].url).toBe('unused.css');
      expect(coverage[0].ranges.length).toBe(0);
    });
    it('should work with media queries', async function({page, server}) {
      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/media.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage.length).toBe(1);
      expect(coverage[0].url).toContain('/csscoverage/media.html');
      expect(coverage[0].ranges).toEqual([
        {start: 17, end: 38}
      ]);
    });
    it('should work with complicated usecases', async function({page, server}) {
      await page.coverage.startCSSCoverage();
      await page.goto(server.PREFIX + '/csscoverage/involved.html');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(JSON.stringify(coverage, null, 2).replace(/:\d{4}\//g, ':<PORT>/')).toBeGolden('csscoverage-involved.txt');
    });
    it('should ignore injected stylesheets', async function({page, server}) {
      await page.coverage.startCSSCoverage();
      await page.addStyleTag({content: 'body { margin: 10px;}'});
      // trigger style recalc
      const margin = await page.evaluate(() => window.getComputedStyle(document.body).margin);
      expect(margin).toBe('10px');
      const coverage = await page.coverage.stopCSSCoverage();
      expect(coverage.length).toBe(0);
    });
    describe('resetOnNavigation', function() {
      it('should report stylesheets across navigations', async function({page, server}) {
        await page.coverage.startCSSCoverage({resetOnNavigation: false});
        await page.goto(server.PREFIX + '/csscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopCSSCoverage();
        expect(coverage.length).toBe(2);
      });
      it('should NOT report scripts across navigations', async function({page, server}) {
        await page.coverage.startCSSCoverage(); // Enabled by default.
        await page.goto(server.PREFIX + '/csscoverage/multiple.html');
        await page.goto(server.EMPTY_PAGE);
        const coverage = await page.coverage.stopCSSCoverage();
        expect(coverage.length).toBe(0);
      });
    });
  });
});

if (process.env.COVERAGE) {
  describe('COVERAGE', function(){
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

if (process.env.CI && runner.hasFocusedTestsOrSuites()) {
  console.error('ERROR: "focused" tests/suites are prohibitted on bots. Remove any "fit"/"fdescribe" declarations.');
  process.exit(1);
}
runner.run();
/**
 * @param {!EventEmitter} emitter
 * @param {string} eventName
 * @param {number=} eventCount
 * @return {!Promise<!Object>}
 */
function waitForEvents(emitter, eventName, eventCount = 1) {
  let fulfill;
  const promise = new Promise(x => fulfill = x);
  emitter.on(eventName, onEvent);
  return promise;

  function onEvent(event) {
    --eventCount;
    if (eventCount)
      return;
    emitter.removeListener(eventName, onEvent);
    fulfill(event);
  }
}

/**
 * @param {!Buffer} pdfBuffer
 * @return {!Promise<!Array<!Object>>}
 */
async function getPDFPages(pdfBuffer) {
  const PDFJS = require('pdfjs-dist');
  PDFJS.disableWorker = true;
  const data = new Uint8Array(pdfBuffer);
  const doc = await PDFJS.getDocument(data);
  const pages = [];
  for (let i = 0; i < doc.numPages; ++i) {
    const page = await doc.getPage(i + 1);
    const viewport = page.getViewport(1);
    // Viewport width and height is in PDF points, which is
    // 1/72 of an inch.
    pages.push({
      width: viewport.width / 72,
      height: viewport.height / 72,
    });
    page.cleanup();
  }
  doc.cleanup();
  return pages;
}

/**
 * @param {number} px
 * @return {number}
 */
function cssPixelsToInches(px) {
  return px / 96;
}
