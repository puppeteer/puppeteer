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
const {helper} = require('../lib/helper');
if (process.env.COVERAGE)
  helper.recordPublicAPICoverage();
console.log('Testing on Node', process.version);
const puppeteer = require('..');
const SimpleServer = require('./server/SimpleServer');
const GoldenUtils = require('./golden-utils');

const YELLOW_COLOR = '\x1b[33m';
const RESET_COLOR = '\x1b[0m';

const GOLDEN_DIR = path.join(__dirname, 'golden');
const OUTPUT_DIR = path.join(__dirname, 'output');

const PORT = 8907;
const PREFIX = 'http://localhost:' + PORT;
const CROSS_PROCESS_PREFIX = 'http://127.0.0.1:' + PORT;
const EMPTY_PAGE = PREFIX + '/empty.html';
const HTTPS_PORT = 8908;
const HTTPS_PREFIX = 'https://localhost:' + HTTPS_PORT;

const headless = (process.env.HEADLESS || 'true').trim().toLowerCase() === 'true';
const slowMo = parseInt((process.env.SLOW_MO || '0').trim(), 10);
const executablePath = process.env.CHROME;
if (executablePath)
  console.warn(`${YELLOW_COLOR}WARN: running tests with ${executablePath}${RESET_COLOR}`);

const defaultBrowserOptions = {
  executablePath,
  slowMo,
  headless,
  args: ['--no-sandbox']
};

if (process.env.DEBUG_TEST || slowMo)
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 1000 * 1000;
else
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;

// Make sure the `npm install` was run after the chromium roll.
{
  const Downloader = require('../utils/ChromiumDownloader');
  const chromiumRevision = require('../package.json').puppeteer.chromium_revision;
  const revisionInfo = Downloader.revisionInfo(Downloader.currentPlatform(), chromiumRevision);
  console.assert(revisionInfo.downloaded, `Chromium r${chromiumRevision} is not downloaded. Run 'npm install' and try to re-run tests.`);
}

let server;
let httpsServer;
beforeAll(SX(async function() {
  const assetsPath = path.join(__dirname, 'assets');
  server = await SimpleServer.create(assetsPath, PORT);
  httpsServer = await SimpleServer.createHTTPS(assetsPath, HTTPS_PORT);
  if (fs.existsSync(OUTPUT_DIR))
    rm(OUTPUT_DIR);
}));

beforeEach(SX(async function() {
  server.reset();
  httpsServer.reset();
  GoldenUtils.addMatchers(jasmine, GOLDEN_DIR, OUTPUT_DIR);
}));

afterAll(SX(async function() {
  await Promise.all([
    server.stop(),
    httpsServer.stop(),
  ]);
}));

describe('Puppeteer', function() {
  describe('Puppeteer.launch', function() {
    it('should support ignoreHTTPSErrors option', SX(async function() {
      const options = Object.assign({ignoreHTTPSErrors: true}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      let error = null;
      const response = await page.goto(HTTPS_PREFIX + '/empty.html').catch(e => error = e);
      expect(error).toBe(null);
      expect(response.ok).toBe(true);
      browser.close();
    }));
    it('should reject all promises when browser is closed', SX(async function() {
      const browser = await puppeteer.launch(defaultBrowserOptions);
      const page = await browser.newPage();
      let error = null;
      const neverResolves = page.evaluate(() => new Promise(r => {})).catch(e => error = e);
      browser.close();
      await neverResolves;
      expect(error.message).toContain('Protocol error');
    }));
    it('should reject if executable path is invalid', SX(async function() {
      let waitError = null;
      const options = Object.assign({}, defaultBrowserOptions, {executablePath: 'random-invalid-path'});
      await puppeteer.launch(options).catch(e => waitError = e);
      expect(waitError.message.startsWith('Failed to launch chrome! spawn random-invalid-path ENOENT')).toBe(true);
    }));
    it('userDataDir option', SX(async function() {
      const userDataDir = fs.mkdtempSync(path.join(__dirname, 'test-user-data-dir'));
      const options = Object.assign({userDataDir}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
      await browser.close();
      expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
      rm(userDataDir);
    }));
    it('userDataDir argument', SX(async function() {
      const userDataDir = fs.mkdtempSync(path.join(__dirname, 'test-user-data-dir'));
      const options = Object.assign({}, defaultBrowserOptions);
      options.args = [`--user-data-dir=${userDataDir}`].concat(options.args);
      const browser = await puppeteer.launch(options);
      expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
      await browser.close();
      expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);
      rm(userDataDir);
    }));
    it('userDataDir option should restore state', SX(async function() {
      const userDataDir = fs.mkdtempSync(path.join(__dirname, 'test-user-data-dir'));
      const options = Object.assign({userDataDir}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      await page.goto(EMPTY_PAGE);
      await page.evaluate(() => localStorage.hey = 'hello');
      await browser.close();

      const browser2 = await puppeteer.launch(options);
      const page2 = await browser2.newPage();
      await page2.goto(EMPTY_PAGE);
      expect(await page2.evaluate(() => localStorage.hey)).toBe('hello');
      await browser2.close();
      rm(userDataDir);
    }));
    it('userDataDir option should restore cookies', SX(async function() {
      const userDataDir = fs.mkdtempSync(path.join(__dirname, 'test-user-data-dir'));
      const options = Object.assign({userDataDir}, defaultBrowserOptions);
      const browser = await puppeteer.launch(options);
      const page = await browser.newPage();
      await page.goto(EMPTY_PAGE);
      await page.evaluate(() => document.cookie = 'doSomethingOnlyOnce=true; expires=Fri, 31 Dec 9999 23:59:59 GMT');
      await browser.close();

      const browser2 = await puppeteer.launch(options);
      const page2 = await browser2.newPage();
      await page2.goto(EMPTY_PAGE);
      expect(await page2.evaluate(() => document.cookie)).toBe('doSomethingOnlyOnce=true');
      await browser2.close();
      rm(userDataDir);
    }));
  });
  describe('Puppeteer.connect', function() {
    it('should be able to connect multiple times to the same browser', SX(async function() {
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
    }));
    it('should be able to reconnect to a disconnected browser', SX(async function() {
      const originalBrowser = await puppeteer.launch(defaultBrowserOptions);
      const browserWSEndpoint = originalBrowser.wsEndpoint();
      const page = await originalBrowser.newPage();
      await page.goto(PREFIX + '/frames/nested-frames.html');
      originalBrowser.disconnect();

      const FrameUtils = require('./frame-utils');
      const browser = await puppeteer.connect({browserWSEndpoint});
      const pages = await browser.pages();
      const restoredPage = pages.find(page => page.url() === PREFIX + '/frames/nested-frames.html');
      expect(FrameUtils.dumpFrames(restoredPage.mainFrame())).toBeGolden('reconnect-nested-frames.txt');
      expect(await restoredPage.evaluate(() => 7 * 8)).toBe(56);
      await browser.close();
    }));
  });
  describe('Puppeteer.executablePath', function() {
    it('should work', SX(async function() {
      const executablePath = puppeteer.executablePath();
      expect(fs.existsSync(executablePath)).toBe(true);
    }));
  });
});

describe('Page', function() {
  const iPhone = require('../DeviceDescriptors')['iPhone 6'];
  const iPhoneLandscape = require('../DeviceDescriptors')['iPhone 6 landscape'];

  let browser;
  let page;

  beforeAll(SX(async function() {
    browser = await puppeteer.launch(defaultBrowserOptions);
  }));

  afterAll(SX(async function() {
    browser.close();
  }));

  beforeEach(SX(async function() {
    page = await browser.newPage();
  }));

  afterEach(SX(async function() {
    await page.close();
  }));

  describe('Browser.version', function() {
    it('should return whether we are in headless', SX(async function() {
      const version = await browser.version();
      expect(version.length).toBeGreaterThan(0);
      expect(version.startsWith('Headless')).toBe(headless);
    }));
  });

  describe('Page.close', function() {
    it('should reject all promises when page is closed', SX(async function() {
      const newPage = await browser.newPage();
      const neverResolves = newPage.evaluate(() => new Promise(r => {}));
      newPage.close();
      let error = null;
      await neverResolves.catch(e => error = e);
      expect(error.message).toContain('Protocol error');
    }));
  });

  describe('Page.Events.error', function() {
    it('should throw when page crashes', SX(async function() {
      let error = null;
      page.on('error', err => error = err);
      page.goto('chrome://crash').catch(e => {});
      await waitForEvents(page, 'error');
      expect(error.message).toBe('Page crashed!');
    }));
  });

  describe('Page.evaluate', function() {
    it('should work', SX(async function() {
      const result = await page.evaluate(() => 7 * 3);
      expect(result).toBe(21);
    }));
    it('should await promise', SX(async function() {
      const result = await page.evaluate(() => Promise.resolve(8 * 7));
      expect(result).toBe(56);
    }));
    it('should work from-inside an exposed function', SX(async function() {
      // Setup inpage callback, which calls Page.evaluate
      await page.exposeFunction('callController', async function(a, b) {
        return await page.evaluate((a, b) => a * b, a, b);
      });
      const result = await page.evaluate(async function() {
        return await callController(9, 3);
      });
      expect(result).toBe(27);
    }));
    it('should reject promise with exception', SX(async function() {
      let error = null;
      await page.evaluate(() => not.existing.object.property).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('not is not defined');
    }));
    it('should return complex objects', SX(async function() {
      const object = {foo: 'bar!'};
      const result = await page.evaluate(a => a, object);
      expect(result).not.toBe(object);
      expect(result).toEqual(object);
    }));
    it('should return NaN', SX(async function() {
      const result = await page.evaluate(() => NaN);
      expect(Object.is(result, NaN)).toBe(true);
    }));
    it('should return -0', SX(async function() {
      const result = await page.evaluate(() => -0);
      expect(Object.is(result, -0)).toBe(true);
    }));
    it('should return Infinity', SX(async function() {
      const result = await page.evaluate(() => Infinity);
      expect(Object.is(result, Infinity)).toBe(true);
    }));
    it('should return -Infinity', SX(async function() {
      const result = await page.evaluate(() => -Infinity);
      expect(Object.is(result, -Infinity)).toBe(true);
    }));
    it('should accept "undefined" as one of multiple parameters', SX(async function() {
      const result = await page.evaluate((a, b) => Object.is(a, undefined) && Object.is(b, 'foo'), undefined, 'foo');
      expect(result).toBe(true);
    }));
    it('should fail for window object', SX(async function() {
      const result = await page.evaluate(() => window);
      expect(result).toBe(undefined);
    }));
    it('should accept a string', SX(async function() {
      const result = await page.evaluate('1 + 2');
      expect(result).toBe(3);
    }));
    it('should accept a string with semi colons', SX(async function() {
      const result = await page.evaluate('1 + 5;');
      expect(result).toBe(6);
    }));
    it('should accept a string with comments', SX(async function() {
      const result = await page.evaluate('2 + 5;\n// do some math!');
      expect(result).toBe(7);
    }));
    it('should accept element handle as an argument', SX(async function() {
      await page.setContent('<section>42</section>');
      const element = await page.$('section');
      const text = await page.evaluate(e => e.textContent, element);
      expect(text).toBe('42');
    }));
    it('should throw if underlying element was disposed', SX(async function() {
      await page.setContent('<section>39</section>');
      const element = await page.$('section');
      expect(element).toBeTruthy();
      await element.dispose();
      let error = null;
      await page.evaluate(e => e.textContent, element).catch(e => error = e);
      expect(error.message).toContain('JSHandle is disposed');
    }));
    it('should throw if elementHandles are from other frames', SX(async function() {
      const FrameUtils = require('./frame-utils');
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      const bodyHandle = await page.frames()[1].$('body');
      let error = null;
      await page.evaluate(body => body.innerHTML, bodyHandle).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('JSHandles can be evaluated only in the context they were created');
    }));
    it('should accept object handle as an argument', SX(async function() {
      const navigatorHandle = await page.evaluateHandle(() => navigator);
      const text = await page.evaluate(e => e.userAgent, navigatorHandle);
      expect(text).toContain('Mozilla');
    }));
    it('should accept object handle to primitive types', SX(async function() {
      const aHandle = await page.evaluateHandle(() => 5);
      const isFive = await page.evaluate(e => Object.is(e, 5), aHandle);
      expect(isFive).toBeTruthy();
    }));
  });

  describe('Page.setOfflineMode', function() {
    it('should work', SX(async function() {
      await page.setOfflineMode(true);
      let error = null;
      await page.goto(EMPTY_PAGE).catch(e => error = e);
      expect(error).toBeTruthy();
      await page.setOfflineMode(false);
      const response = await page.reload();
      expect(response.status).toBe(200);
    }));
    it('should emulate navigator.onLine', SX(async function() {
      expect(await page.evaluate(() => window.navigator.onLine)).toBe(true);
      await page.setOfflineMode(true);
      expect(await page.evaluate(() => window.navigator.onLine)).toBe(false);
      await page.setOfflineMode(false);
      expect(await page.evaluate(() => window.navigator.onLine)).toBe(true);
    }));
  });

  describe('Page.evaluateHandle', function() {
    it('should work', SX(async function() {
      const windowHandle = await page.evaluateHandle(() => window);
      expect(windowHandle).toBeTruthy();
    }));
  });

  describe('ExecutionContext.queryObjects', function() {
    it('should work', SX(async function() {
      // Instantiate an object
      await page.evaluate(() => window.set = new Set(['hello', 'world']));
      const prototypeHandle = await page.evaluateHandle(() => Set.prototype);
      const objectsHandle = await page.queryObjects(prototypeHandle);
      const count = await page.evaluate(objects => objects.length, objectsHandle);
      expect(count).toBe(1);
      const values = await page.evaluate(objects => Array.from(objects[0].values()), objectsHandle);
      expect(values).toEqual(['hello', 'world']);
    }));
    it('should fail for disposed handles', SX(async function() {
      const prototypeHandle = await page.evaluateHandle(() => HTMLBodyElement.prototype);
      await prototypeHandle.dispose();
      let error = null;
      await page.queryObjects(prototypeHandle).catch(e => error = e);
      expect(error.message).toBe('Prototype JSHandle is disposed!');
    }));
    it('should fail primitive values as prototypes', SX(async function() {
      const prototypeHandle = await page.evaluateHandle(() => 42);
      let error = null;
      await page.queryObjects(prototypeHandle).catch(e => error = e);
      expect(error.message).toBe('Prototype JSHandle must not be referencing primitive value');
    }));
  });

  describe('JSHandle.getProperty', function() {
    it('should work', SX(async function() {
      const aHandle = await page.evaluateHandle(() => ({
        one: 1,
        two: 2,
        three: 3
      }));
      const twoHandle = await aHandle.getProperty('two');
      expect(await twoHandle.jsonValue()).toEqual(2);
    }));
  });

  describe('JSHandle.jsonValue', function() {
    it('should work', SX(async function() {
      const aHandle = await page.evaluateHandle(() => ({foo: 'bar'}));
      const json = await aHandle.jsonValue();
      expect(json).toEqual({foo: 'bar'});
    }));
    it('should not work with dates', SX(async function() {
      const dateHandle = await page.evaluateHandle(() => new Date('2017-09-26T00:00:00.000Z'));
      const json = await dateHandle.jsonValue();
      expect(json).toEqual({});
    }));
    it('should throw for circular objects', SX(async function() {
      const windowHandle = await page.evaluateHandle('window');
      let error = null;
      await windowHandle.jsonValue().catch(e => error = e);
      expect(error.message).toContain('Object reference chain is too long');
    }));
  });

  describe('JSHandle.getProperties', function() {
    it('should work', SX(async function() {
      const aHandle = await page.evaluateHandle(() => ({
        foo: 'bar'
      }));
      const properties = await aHandle.getProperties();
      const foo = properties.get('foo');
      expect(foo).toBeTruthy();
      expect(await foo.jsonValue()).toBe('bar');
    }));
    it('should return even non-own properties', SX(async function() {
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
    }));
  });

  describe('JSHandle.asElement', function() {
    it('should work', SX(async function() {
      const aHandle = await page.evaluateHandle(() => document.body);
      const element = aHandle.asElement();
      expect(element).toBeTruthy();
    }));
    it('should return null for non-elements', SX(async function() {
      const aHandle = await page.evaluateHandle(() => 2);
      const element = aHandle.asElement();
      expect(element).toBeFalsy();
    }));
    it('should return ElementHandle for TextNodes', SX(async function() {
      await page.setContent('<div>ee!</div>');
      const aHandle = await page.evaluateHandle(() => document.querySelector('div').firstChild);
      const element = aHandle.asElement();
      expect(element).toBeTruthy();
      expect(await page.evaluate(e => e.nodeType === HTMLElement.TEXT_NODE, element));
    }));
  });

  describe('JSHandle.toString', function() {
    it('should work for primitives', SX(async function() {
      const numberHandle = await page.evaluateHandle(() => 2);
      expect(numberHandle.toString()).toBe('JSHandle:2');
      const stringHandle = await page.evaluateHandle(() => 'a');
      expect(stringHandle.toString()).toBe('JSHandle:a');
    }));
    it('should work for complicated objects', SX(async function() {
      const aHandle = await page.evaluateHandle(() => window);
      expect(aHandle.toString()).toBe('JSHandle@object');
    }));
  });

  describe('Frame.context', function() {
    const FrameUtils = require('./frame-utils');
    it('should work', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      expect(page.frames().length).toBe(2);
      const [frame1, frame2] = page.frames();
      expect(frame1.executionContext()).toBeTruthy();
      expect(frame2.executionContext()).toBeTruthy();
      expect(frame1.executionContext() !== frame2.executionContext()).toBeTruthy();

      await Promise.all([
        frame1.executionContext().evaluate(() => window.a = 1),
        frame2.executionContext().evaluate(() => window.a = 2)
      ]);
      const [a1, a2] = await Promise.all([
        frame1.executionContext().evaluate(() => window.a),
        frame2.executionContext().evaluate(() => window.a)
      ]);
      expect(a1).toBe(1);
      expect(a2).toBe(2);
    }));
  });

  describe('Frame.evaluate', function() {
    const FrameUtils = require('./frame-utils');
    it('should have different execution contexts', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      expect(page.frames().length).toBe(2);
      const frame1 = page.frames()[0];
      const frame2 = page.frames()[1];
      await frame1.evaluate(() => window.FOO = 'foo');
      await frame2.evaluate(() => window.FOO = 'bar');
      expect(await frame1.evaluate(() => window.FOO)).toBe('foo');
      expect(await frame2.evaluate(() => window.FOO)).toBe('bar');
    }));
    it('should execute after cross-site navigation', SX(async function() {
      await page.goto(EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      expect(await mainFrame.evaluate(() => window.location.href)).toContain('localhost');
      await page.goto(CROSS_PROCESS_PREFIX + '/empty.html');
      expect(await mainFrame.evaluate(() => window.location.href)).toContain('127');
    }));
  });

  describe('Frame.waitForFunction', function() {
    it('should accept a string', SX(async function() {
      const watchdog = page.waitForFunction('window.__FOO === 1');
      await page.evaluate(() => window.__FOO = 1);
      await watchdog;
    }));
    it('should poll on interval', SX(async function() {
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
    }));
    it('should poll on mutation', SX(async function() {
      let success = false;
      const watchdog = page.waitForFunction(() => window.__FOO === 'hit', {polling: 'mutation'})
          .then(() => success = true);
      await page.evaluate(() => window.__FOO = 'hit');
      expect(success).toBe(false);
      await page.evaluate(() => document.body.appendChild(document.createElement('div')));
      await watchdog;
    }));
    it('should poll on raf', SX(async function() {
      const watchdog = page.waitForFunction(() => window.__FOO === 'hit', {polling: 'raf'});
      await page.evaluate(() => window.__FOO = 'hit');
      await watchdog;
    }));
    it('should throw on bad polling value', SX(async function() {
      let error = null;
      try {
        await page.waitForFunction(() => !!document.body, {polling: 'unknown'});
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain('polling');
    }));
    it('should throw negative polling interval', SX(async function() {
      let error = null;
      try {
        await page.waitForFunction(() => !!document.body, {polling: -10});
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain('Cannot poll with non-positive interval');
    }));
  });

  describe('Frame.waitForSelector', function() {
    const FrameUtils = require('./frame-utils');
    const addElement = tag => document.body.appendChild(document.createElement(tag));

    it('should immediately resolve promise if node exists', SX(async function() {
      await page.goto(EMPTY_PAGE);
      const frame = page.mainFrame();
      let added = false;
      await frame.waitForSelector('*').then(() => added = true);
      expect(added).toBe(true);

      added = false;
      await frame.evaluate(addElement, 'div');
      await frame.waitForSelector('div').then(() => added = true);
      expect(added).toBe(true);
    }));

    it('should resolve promise when node is added', SX(async function() {
      await page.goto(EMPTY_PAGE);
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
    }));

    it('should work when node is added through innerHTML', SX(async function() {
      await page.goto(EMPTY_PAGE);
      const watchdog = page.waitForSelector('h3 div');
      await page.evaluate(addElement, 'span');
      await page.evaluate(() => document.querySelector('span').innerHTML = '<h3><div></div></h3>');
      await watchdog;
    }));

    it('Page.waitForSelector is shortcut for main frame', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      const otherFrame = page.frames()[1];
      let added = false;
      page.waitForSelector('div').then(() => added = true);
      await otherFrame.evaluate(addElement, 'div');
      expect(added).toBe(false);
      await page.evaluate(addElement, 'div');
      expect(added).toBe(true);
    }));

    it('should run in specified frame', SX(async function() {
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame2', EMPTY_PAGE);
      const frame1 = page.frames()[1];
      const frame2 = page.frames()[2];
      let added = false;
      frame2.waitForSelector('div').then(() => added = true);
      expect(added).toBe(false);
      await frame1.evaluate(addElement, 'div');
      expect(added).toBe(false);
      await frame2.evaluate(addElement, 'div');
      expect(added).toBe(true);
    }));

    it('should throw if evaluation failed', SX(async function() {
      await page.evaluateOnNewDocument(function() {
        document.querySelector = null;
      });
      await page.goto(EMPTY_PAGE);
      let error = null;
      await page.waitForSelector('*').catch(e => error = e);
      expect(error.message).toContain('document.querySelector is not a function');
    }));
    it('should throw when frame is detached', SX(async function() {
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      const frame = page.frames()[1];
      let waitError = null;
      const waitPromise = frame.waitForSelector('.box').catch(e => waitError = e);
      await FrameUtils.detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError.message).toContain('waitForSelector failed: frame got detached.');
    }));
    it('should survive cross-process navigation', SX(async function() {
      let boxFound = false;
      const waitForSelector = page.waitForSelector('.box').then(() => boxFound = true);
      await page.goto(EMPTY_PAGE);
      expect(boxFound).toBe(false);
      await page.reload();
      expect(boxFound).toBe(false);
      await page.goto(CROSS_PROCESS_PREFIX + '/grid.html');
      await waitForSelector;
      expect(boxFound).toBe(true);
    }));
    it('should wait for visible', SX(async function() {
      let divFound = false;
      const waitForSelector = page.waitForSelector('div', {visible: true}).then(() => divFound = true);
      await page.setContent(`<div style='display: none; visibility: hidden;'></div>`);
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('display'));
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('visibility'));
      expect(await waitForSelector).toBe(true);
      expect(divFound).toBe(true);
    }));
    it('hidden should wait for visibility: hidden', SX(async function() {
      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForSelector = page.waitForSelector('div', {hidden: true}).then(() => divHidden = true);
      await page.evaluate(() => document.querySelector('div').style.setProperty('visibility', 'hidden'));
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    }));
    it('hidden should wait for display: none', SX(async function() {
      let divHidden = false;
      await page.setContent(`<div style='display: block;'></div>`);
      const waitForSelector = page.waitForSelector('div', {hidden: true}).then(() => divHidden = true);
      await page.evaluate(() => document.querySelector('div').style.setProperty('display', 'none'));
      expect(await waitForSelector).toBe(true);
      expect(divHidden).toBe(true);
    }));
    it('hidden should wait for removal', SX(async function() {
      await page.setContent(`<div></div>`);
      let divRemoved = false;
      const waitForSelector = page.waitForSelector('div', {hidden: true}).then(() => divRemoved = true);
      expect(divRemoved).toBe(false);
      await page.evaluate(() => document.querySelector('div').remove());
      expect(await waitForSelector).toBe(true);
      expect(divRemoved).toBe(true);
    }));
    it('should respect timeout', SX(async function() {
      let error = null;
      await page.waitForSelector('div', {timeout: 10}).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('waiting failed: timeout');
    }));

    it('should respond to node attribute mutation', SX(async function() {
      let divFound = false;
      const waitForSelector = page.waitForSelector('.zombo').then(() => divFound = true);
      await page.setContent(`<div class='notZombo'></div>`);
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').className = 'zombo');
      expect(await waitForSelector).toBe(true);
    }));
  });

  describe('Page.waitFor', function() {
    it('should wait for selector', SX(async function() {
      let found = false;
      const waitFor = page.waitFor('div').then(() => found = true);
      await page.goto(EMPTY_PAGE);
      expect(found).toBe(false);
      await page.goto(PREFIX + '/grid.html');
      await waitFor;
      expect(found).toBe(true);
    }));
    it('should timeout', SX(async function() {
      const startTime = Date.now();
      const timeout = 42;
      await page.waitFor(timeout);
      expect(Date.now() - startTime).not.toBeLessThan(timeout / 2);
    }));
    it('should wait for predicate', SX(async function() {
      const watchdog = page.waitFor(() => window.innerWidth < 100);
      page.setViewport({width: 10, height: 10});
      await watchdog;
    }));
    it('should throw when unknown type', SX(async function() {
      let error = null;
      await page.waitFor({foo: 'bar'}).catch(e => error = e);
      expect(error.message).toContain('Unsupported target type');
    }));
    it('should wait for predicate with arguments', SX(async function() {
      await page.waitFor((arg1, arg2) => arg1 !== arg2, {}, 1, 2);
    }));
  });

  describe('Page.Events.Console', function() {
    it('should work', SX(async function() {
      let message = null;
      page.once('console', m => message = m);
      await Promise.all([
        page.evaluate(() => console.log('hello', 5, {foo: 'bar'})),
        waitForEvents(page, 'console')
      ]);
      expect(message.text).toEqual('hello 5 JSHandle@object');
      expect(message.type).toEqual('log');
      expect(await message.args[0].jsonValue()).toEqual('hello');
      expect(await message.args[1].jsonValue()).toEqual(5);
      expect(await message.args[2].jsonValue()).toEqual({foo: 'bar'});
    }));
    it('should work for different console API calls', SX(async function() {
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
      expect(messages.map(msg => msg.type)).toEqual([
        'timeEnd', 'trace', 'dir', 'warning', 'error', 'log'
      ]);
      expect(messages[0].text).toContain('calling console.time');
      expect(messages.slice(1).map(msg => msg.text)).toEqual([
        'calling console.trace',
        'calling console.dir',
        'calling console.warn',
        'calling console.error',
        'JSHandle@promise',
      ]);
    }));
    it('should not fail for window object', SX(async function() {
      let message = null;
      page.once('console', msg => message = msg);
      await Promise.all([
        page.evaluate(() => console.error(window)),
        waitForEvents(page, 'console')
      ]);
      expect(message.text).toBe('JSHandle@object');
    }));
  });

  describe('Page.getMetrics', function() {
    it('should get metrics from a page', SX(async function() {
      await page.goto('about:blank');
      const metrics = await page.getMetrics();
      checkMetrics(metrics);
    }));
    it('metrics event fired on console.timeStamp', SX(async function() {
      const metricsPromise = new Promise(fulfill => page.once('metrics', fulfill));
      await page.evaluate(() => console.timeStamp('test42'));
      const metrics = await metricsPromise;
      expect(metrics.title).toBe('test42');
      checkMetrics(metrics.metrics);
    }));
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
    it('should navigate to about:blank', SX(async function() {
      const response = await page.goto('about:blank');
      expect(response).toBe(null);
    }));
    it('should navigate to empty page with domcontentloaded', SX(async function() {
      const response = await page.goto(EMPTY_PAGE, {waitUntil: 'domcontentloaded'});
      expect(response.status).toBe(200);
    }));
    it('should navigate to empty page with networkidle0', SX(async function() {
      const response = await page.goto(EMPTY_PAGE, {waitUntil: 'networkidle0'});
      expect(response.status).toBe(200);
    }));
    it('should navigate to empty page with networkidle2', SX(async function() {
      const response = await page.goto(EMPTY_PAGE, {waitUntil: 'networkidle2'});
      expect(response.status).toBe(200);
    }));
    it('should fail when navigating to bad url', SX(async function() {
      let error = null;
      await page.goto('asdfasdf').catch(e => error = e);
      expect(error.message).toContain('Cannot navigate to invalid URL');
    }));
    it('should fail when navigating to bad SSL', SX(async function() {
      // Make sure that network events do not emit 'undefined'.
      // @see https://crbug.com/750469
      page.on('request', request => expect(request).toBeTruthy());
      page.on('requestfinished', request => expect(request).toBeTruthy());
      page.on('requestfailed', request => expect(request).toBeTruthy());
      let error = null;
      await page.goto(HTTPS_PREFIX + '/empty.html').catch(e => error = e);
      expect(error.message).toContain('net::ERR_INSECURE_RESPONSE');
    }));
    it('should fail when navigating to bad SSL after redirects', SX(async function() {
      server.setRedirect('/redirect/1.html', '/redirect/2.html');
      server.setRedirect('/redirect/2.html', '/empty.html');
      let error = null;
      await page.goto(HTTPS_PREFIX + '/redirect/1.html').catch(e => error = e);
      expect(error.message).toContain('net::ERR_INSECURE_RESPONSE');
    }));
    it('should throw if networkidle is passed as an option', SX(async function() {
      let error = null;
      await page.goto(EMPTY_PAGE, {waitUntil: 'networkidle'}).catch(err => error = err);
      expect(error.message).toContain('"networkidle" option is no longer supported');
    }));
    it('should fail when main resources failed to load', SX(async function() {
      let error = null;
      await page.goto('http://localhost:44123/non-existing-url').catch(e => error = e);
      expect(error.message).toContain('Failed to navigate');
    }));
    it('should fail when exceeding maximum navigation timeout', SX(async function() {
      let hasUnhandledRejection = false;
      const unhandledRejectionHandler = () => hasUnhandledRejection = true;
      process.on('unhandledRejection', unhandledRejectionHandler);
      // Hang for request to the empty.html
      server.setRoute('/empty.html', (req, res) => { });
      let error = null;
      await page.goto(PREFIX + '/empty.html', {timeout: 1}).catch(e => error = e);
      expect(hasUnhandledRejection).toBe(false);
      expect(error.message).toContain('Navigation Timeout Exceeded: 1ms');
      process.removeListener('unhandledRejection', unhandledRejectionHandler);
    }));
    it('should disable timeout when its set to 0', SX(async function() {
      let error = null;
      await page.goto(PREFIX + '/grid.html', {timeout: 0}).catch(e => error = e);
      expect(error).toBe(null);
    }));
    it('should work when navigating to valid url', SX(async function() {
      const response = await page.goto(EMPTY_PAGE);
      expect(response.ok).toBe(true);
    }));
    it('should work when navigating to data url', SX(async function() {
      const response = await page.goto('data:text/html,hello');
      expect(response.ok).toBe(true);
    }));
    it('should work when navigating to 404', SX(async function() {
      const response = await page.goto(PREFIX + '/not-found');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    }));
    it('should return last response in redirect chain', SX(async function() {
      server.setRedirect('/redirect/1.html', '/redirect/2.html');
      server.setRedirect('/redirect/2.html', '/redirect/3.html');
      server.setRedirect('/redirect/3.html', EMPTY_PAGE);
      const response = await page.goto(PREFIX + '/redirect/1.html');
      expect(response.ok).toBe(true);
      expect(response.url).toBe(EMPTY_PAGE);
    }));
    it('should wait for network idle to succeed navigation', SX(async function() {
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
      const navigationPromise = page.goto(PREFIX + '/networkidle.html', {
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
      expect(response.ok).toBe(true);
    }));
    it('should not leak listeners during navigation', SX(async function() {
      let warning = null;
      const warningHandler = w => warning = w;
      process.on('warning', warningHandler);
      for (let i = 0; i < 20; ++i)
        await page.goto(EMPTY_PAGE);
      process.removeListener('warning', warningHandler);
      expect(warning).toBe(null);
    }));
    it('should not leak listeners during bad navigation', SX(async function() {
      let warning = null;
      const warningHandler = w => warning = w;
      process.on('warning', warningHandler);
      for (let i = 0; i < 20; ++i)
        await page.goto('asdf').catch(e => {/* swallow navigation error */});
      process.removeListener('warning', warningHandler);
      expect(warning).toBe(null);
    }));
    it('should navigate to dataURL and fire dataURL requests', SX(async function() {
      const requests = [];
      page.on('request', request => requests.push(request));
      const dataURL = 'data:text/html,<div>yo</div>';
      const response = await page.goto(dataURL);
      expect(response.status).toBe(200);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toBe(dataURL);
    }));
    it('should navigate to URL with hash and fire requests without hash', SX(async function() {
      const requests = [];
      page.on('request', request => requests.push(request));
      const response = await page.goto(EMPTY_PAGE + '#hash');
      expect(response.status).toBe(200);
      expect(response.url).toBe(EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toBe(EMPTY_PAGE);
    }));
  });

  describe('Page.waitForNavigation', function() {
    it('should work', SX(async function() {
      await page.goto(EMPTY_PAGE);
      const [result] = await Promise.all([
        page.waitForNavigation(),
        page.evaluate(url => window.location.href = url, PREFIX + '/grid.html')
      ]);
      const response = await result;
      expect(response.ok).toBe(true);
      expect(response.url).toContain('grid.html');
    }));
    it('should work with both domcontentloaded and load', SX(async function() {
      let response = null;
      server.setRoute('/one-style.css', (req, res) => response = res);
      page.goto(PREFIX + '/one-style.html');
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
    }));
  });

  describe('Page.goBack', function() {
    it('should work', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.goto(PREFIX + '/grid.html');

      let response = await page.goBack();
      expect(response.ok).toBe(true);
      expect(response.url).toContain(EMPTY_PAGE);

      response = await page.goForward();
      expect(response.ok).toBe(true);
      expect(response.url).toContain('/grid.html');

      response = await page.goForward();
      expect(response).toBe(null);
    }));
  });

  describe('Page.exposeFunction', function() {
    it('should work', SX(async function() {
      await page.exposeFunction('compute', function(a, b) {
        return a * b;
      });
      const result = await page.evaluate(async function() {
        return await compute(9, 4);
      });
      expect(result).toBe(36);
    }));
    it('should survive navigation', SX(async function() {
      await page.exposeFunction('compute', function(a, b) {
        return a * b;
      });

      await page.goto(EMPTY_PAGE);
      const result = await page.evaluate(async function() {
        return await compute(9, 4);
      });
      expect(result).toBe(36);
    }));
    it('should await returned promise', SX(async function() {
      await page.exposeFunction('compute', function(a, b) {
        return Promise.resolve(a * b);
      });

      const result = await page.evaluate(async function() {
        return await compute(3, 5);
      });
      expect(result).toBe(15);
    }));
  });

  describe('Page.setRequestInterception', function() {
    it('should intercept', SX(async function() {
      await page.setRequestInterception(true);
      page.on('request', request => {
        expect(request.url).toContain('empty.html');
        expect(request.headers['user-agent']).toBeTruthy();
        expect(request.method).toBe('GET');
        expect(request.postData).toBe(undefined);
        expect(request.resourceType).toBe('document');
        request.continue();
      });
      const response = await page.goto(EMPTY_PAGE);
      expect(response.ok).toBe(true);
    }));
    it('should stop intercepting', SX(async function() {
      await page.setRequestInterception(true);
      page.once('request', request => request.continue());
      await page.goto(EMPTY_PAGE);
      await page.setRequestInterception(false);
      await page.goto(EMPTY_PAGE);
    }));
    it('should show custom HTTP headers', SX(async function() {
      await page.setExtraHTTPHeaders({
        foo: 'bar'
      });
      await page.setRequestInterception(true);
      page.on('request', request => {
        expect(request.headers['foo']).toBe('bar');
        request.continue();
      });
      const response = await page.goto(EMPTY_PAGE);
      expect(response.ok).toBe(true);
    }));
    it('should be abortable', SX(async function() {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url.endsWith('.css'))
          request.abort();
        else
          request.continue();
      });
      let failedRequests = 0;
      page.on('requestfailed', event => ++failedRequests);
      const response = await page.goto(PREFIX + '/one-style.html');
      expect(response.ok).toBe(true);
      expect(response.request().failure()).toBe(null);
      expect(failedRequests).toBe(1);
    }));
    it('should be abortable with custom error codes', SX(async function() {
      await page.setRequestInterception(true);
      page.on('request', request => {
        request.abort('internetdisconnected');
      });
      let failedRequest = null;
      page.on('requestfailed', request => failedRequest = request);
      await page.goto(EMPTY_PAGE).catch(e => {});
      expect(failedRequest).toBeTruthy();
      expect(failedRequest.failure().errorText).toBe('net::ERR_INTERNET_DISCONNECTED');
    }));
    it('should amend HTTP headers', SX(async function() {
      await page.setRequestInterception(true);
      page.on('request', request => {
        const headers = Object.assign({}, request.headers);
        headers['FOO'] = 'bar';
        request.continue({ headers });
      });
      await page.goto(EMPTY_PAGE);
      const [request] = await Promise.all([
        server.waitForRequest('/sleep.zzz'),
        page.evaluate(() => fetch('/sleep.zzz'))
      ]);
      expect(request.headers['foo']).toBe('bar');
    }));
    it('should fail navigation when aborting main resource', SX(async function() {
      await page.setRequestInterception(true);
      page.on('request', request => request.abort());
      let error = null;
      await page.goto(EMPTY_PAGE).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('Failed to navigate');
    }));
    it('should work with redirects', SX(async function() {
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
      const response = await page.goto(PREFIX + '/non-existing-page.html');
      expect(response.status).toBe(200);
      expect(response.url).toContain('empty.html');
      expect(requests.length).toBe(5);
      expect(requests[2].resourceType).toBe('document');
    }));
    it('should be able to abort redirects', SX(async function() {
      await page.setRequestInterception(true);
      server.setRedirect('/non-existing.json', '/non-existing-2.json');
      server.setRedirect('/non-existing-2.json', '/simple.html');
      page.on('request', request => {
        if (request.url.includes('non-existing-2'))
          request.abort();
        else
          request.continue();
      });
      await page.goto(EMPTY_PAGE);
      const result = await page.evaluate(async() => {
        try {
          await fetch('/non-existing.json');
        } catch (e) {
          return e.message;
        }
      });
      expect(result).toContain('Failed to fetch');
    }));
    it('should work with equal requests', SX(async function() {
      await page.goto(EMPTY_PAGE);
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
    }));
    it('should navigate to dataURL and fire dataURL requests', SX(async function() {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        requests.push(request);
        request.continue();
      });
      const dataURL = 'data:text/html,<div>yo</div>';
      const response = await page.goto(dataURL);
      expect(response.status).toBe(200);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toBe(dataURL);
    }));
    it('should abort data URLs', SX(async function() {
      await page.setRequestInterception(true);
      page.on('request', request => {
        request.abort();
      });
      let error = null;
      await page.goto('data:text/html,No way!').catch(err => error = err);
      expect(error.message).toContain('Failed to navigate');
    }));
    it('should navigate to URL with hash and and fire requests without hash', SX(async function() {
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        requests.push(request);
        request.continue();
      });
      const response = await page.goto(EMPTY_PAGE + '#hash');
      expect(response.status).toBe(200);
      expect(response.url).toBe(EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toBe(EMPTY_PAGE);
    }));
    it('should work with encoded URLs', SX(async function() {
      // The requestWillBeSent will report encoded URL, whereas interception will
      // report URL as-is. @see crbug.com/759388
      await page.setRequestInterception(true);
      page.on('request', request => request.continue());
      const response = await page.goto(PREFIX + '/some nonexisting page');
      expect(response.status).toBe(404);
    }));
    it('should work with badly encoded URLs', SX(async function() {
      await page.setRequestInterception(true);
      server.setRoute('/malformed?rnd=%911', (req, res) => res.end());
      page.on('request', request => request.continue());
      const response = await page.goto(PREFIX + '/malformed?rnd=%911');
      expect(response.status).toBe(200);
    }));
    it('should work with encoded URLs - 2', SX(async function() {
      // The requestWillBeSent will report URL as-is, whereas interception will
      // report encoded URL for stylesheet. @see crbug.com/759388
      await page.setRequestInterception(true);
      const requests = [];
      page.on('request', request => {
        request.continue();
        requests.push(request);
      });
      const response = await page.goto(`data:text/html,<link rel="stylesheet" href="${PREFIX}/fonts?helvetica|arial"/>`);
      expect(response.status).toBe(200);
      expect(requests.length).toBe(2);
      expect(requests[1].response().status).toBe(404);
    }));
    it('should not throw "Invalid Interception Id" if the request was cancelled', SX(async function() {
      await page.setContent('<iframe></iframe>');
      await page.setRequestInterception(true);
      let request = null;
      page.on('request', async r => request = r);
      page.$eval('iframe', (frame, url) => frame.src = url, EMPTY_PAGE),
      // Wait for request interception.
      await waitForEvents(page, 'request');
      // Delete frame to cause request to be canceled.
      await page.$eval('iframe', frame => frame.remove());
      let error = null;
      await request.continue().catch(e => error = e);
      expect(error).toBe(null);
    }));
    it('should throw if interception is not enabled', SX(async function() {
      let error = null;
      page.on('request', async request => {
        try {
          await request.continue();
        } catch (e) {
          error = e;
        }
      });
      await page.goto(EMPTY_PAGE);
      expect(error.message).toContain('Request Interception is not enabled');
    }));
  });

  describe('Request.respond', function() {
    it('should work', SX(async function() {
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
      const response = await page.goto(EMPTY_PAGE);
      expect(response.status).toBe(201);
      expect(response.headers.foo).toBe('bar');
      expect(await page.evaluate(() => document.body.textContent)).toBe('Yo, page!');
    }));
    it('should allow mocking binary responses', SX(async function() {
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
      }, PREFIX);
      const img = await page.$('img');
      expect(await img.screenshot()).toBeGolden('mock-binary-response.png');
    }));
  });

  describe('Page.Events.Dialog', function() {
    it('should fire', SX(async function() {
      page.on('dialog', dialog => {
        expect(dialog.type).toBe('alert');
        expect(dialog.defaultValue()).toBe('');
        expect(dialog.message()).toBe('yo');
        dialog.accept();
      });
      await page.evaluate(() => alert('yo'));
    }));
    it('should allow accepting prompts', SX(async function() {
      page.on('dialog', dialog => {
        expect(dialog.type).toBe('prompt');
        expect(dialog.defaultValue()).toBe('yes.');
        expect(dialog.message()).toBe('question?');
        dialog.accept('answer!');
      });
      const result = await page.evaluate(() => prompt('question?', 'yes.'));
      expect(result).toBe('answer!');
    }));
    it('should dismiss the prompt', SX(async function() {
      page.on('dialog', dialog => {
        dialog.dismiss();
      });
      const result = await page.evaluate(() => prompt('question?'));
      expect(result).toBe(null);
    }));
  });

  describe('Page.Events.PageError', function() {
    it('should fire', SX(async function() {
      let error = null;
      page.once('pageerror', e => error = e);
      page.goto(PREFIX + '/error.html');
      await waitForEvents(page, 'pageerror');
      expect(error.message).toContain('Fancy');
    }));
  });

  describe('Page.Events.Request', function() {
    it('should fire', SX(async function() {
      const requests = [];
      page.on('request', request => requests.push(request));
      await page.goto(EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toContain('empty.html');
    }));
  });

  describe('Frame Management', function() {
    const FrameUtils = require('./frame-utils');
    it('should handle nested frames', SX(async function() {
      await page.goto(PREFIX + '/frames/nested-frames.html');
      expect(FrameUtils.dumpFrames(page.mainFrame())).toBeGolden('nested-frames.txt');
    }));
    it('should send events when frames are manipulated dynamically', SX(async function() {
      await page.goto(EMPTY_PAGE);
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
      expect(navigatedFrames[0].url()).toContain('/empty.html');

      // validate framedetached events
      const detachedFrames = [];
      page.on('framedetached', frame => detachedFrames.push(frame));
      await FrameUtils.detachFrame(page, 'frame1');
      expect(detachedFrames.length).toBe(1);
      expect(detachedFrames[0].isDetached()).toBe(true);
    }));
    it('should persist mainFrame on cross-process navigation', SX(async function() {
      await page.goto(EMPTY_PAGE);
      const mainFrame = page.mainFrame();
      await page.goto('http://127.0.0.1:' + PORT + '/empty.html');
      expect(page.mainFrame() === mainFrame).toBeTruthy();
    }));
    it('should not send attach/detach events for main frame', SX(async function() {
      let hasEvents = false;
      page.on('frameattached', frame => hasEvents = true);
      page.on('framedetached', frame => hasEvents = true);
      await page.goto(EMPTY_PAGE);
      expect(hasEvents).toBe(false);
    }));
    it('should detach child frames on navigation', SX(async function() {
      let attachedFrames = [];
      let detachedFrames = [];
      let navigatedFrames = [];
      page.on('frameattached', frame => attachedFrames.push(frame));
      page.on('framedetached', frame => detachedFrames.push(frame));
      page.on('framenavigated', frame => navigatedFrames.push(frame));
      await page.goto(PREFIX + '/frames/nested-frames.html');
      expect(attachedFrames.length).toBe(4);
      expect(detachedFrames.length).toBe(0);
      expect(navigatedFrames.length).toBe(5);

      attachedFrames = [];
      detachedFrames = [];
      navigatedFrames = [];
      await page.goto(EMPTY_PAGE);
      expect(attachedFrames.length).toBe(0);
      expect(detachedFrames.length).toBe(4);
      expect(navigatedFrames.length).toBe(1);
    }));
    it('should report frame.name()', SX(async function() {
      await FrameUtils.attachFrame(page, 'theFrameId', EMPTY_PAGE);
      await page.evaluate(url => {
        const frame = document.createElement('iframe');
        frame.name = 'theFrameName';
        frame.src = url;
        document.body.appendChild(frame);
        return new Promise(x => frame.onload = x);
      }, EMPTY_PAGE);
      expect(page.frames()[0].name()).toBe('');
      expect(page.frames()[1].name()).toBe('theFrameId');
      expect(page.frames()[2].name()).toBe('theFrameName');
    }));
    it('should report frame.parent()', SX(async function() {
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame2', EMPTY_PAGE);
      expect(page.frames()[0].parentFrame()).toBe(null);
      expect(page.frames()[1].parentFrame()).toBe(page.mainFrame());
      expect(page.frames()[2].parentFrame()).toBe(page.mainFrame());
    }));
  });

  describe('Page.$eval', function() {
    it('should work', SX(async function() {
      await page.setContent('<section id="testAttribute">43543</section>');
      const idAttribute = await page.$eval('section', e => e.id);
      expect(idAttribute).toBe('testAttribute');
    }));
    it('should accept arguments', SX(async function() {
      await page.setContent('<section>hello</section>');
      const text = await page.$eval('section', (e, suffix) => e.textContent + suffix, ' world!');
      expect(text).toBe('hello world!');
    }));
    it('should accept ElementHandles as arguments', SX(async function() {
      await page.setContent('<section>hello</section><div> world</div>');
      const divHandle = await page.$('div');
      const text = await page.$eval('section', (e, div) => e.textContent + div.textContent, divHandle);
      expect(text).toBe('hello world');
    }));
    it('should throw error if no element is found', SX(async function() {
      let error = null;
      await page.$eval('section', e => e.id).catch(e => error = e);
      expect(error.message).toContain('failed to find element matching selector "section"');
    }));
  });

  describe('Page.$$eval', function() {
    it('should work', SX(async function() {
      await page.setContent('<div>hello</div><div>beautiful</div><div>world!</div>');
      const divsCount = await page.$$eval('div', divs => divs.length);
      expect(divsCount).toBe(3);
    }));
  });

  describe('Page.$', function() {
    it('should query existing element', SX(async function() {
      await page.setContent('<section>test</section>');
      const element = await page.$('section');
      expect(element).toBeTruthy();
    }));
    it('should return null for non-existing element', SX(async function() {
      const element = await page.$('non-existing-element');
      expect(element).toBe(null);
    }));
  });

  describe('Page.$$', function() {
    it('should query existing elements', SX(async function() {
      await page.setContent('<div>A</div><br/><div>B</div>');
      const elements = await page.$$('div');
      expect(elements.length).toBe(2);
      const promises = elements.map(element => page.evaluate(e => e.textContent, element));
      expect(await Promise.all(promises)).toEqual(['A', 'B']);
    }));
    it('should return empty array if nothing is found', SX(async function() {
      await page.goto(EMPTY_PAGE);
      const elements = await page.$$('div');
      expect(elements.length).toBe(0);
    }));
  });

  describe('ElementHandle.boundingBox', function() {
    it('should work', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.goto(PREFIX + '/grid.html');
      const elementHandle = await page.$('.box:nth-of-type(13)');
      const box = await elementHandle.boundingBox();
      expect(box).toEqual({ x: 100, y: 50, width: 50, height: 50 });
    }));
    it('should handle nested frames', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.goto(PREFIX + '/frames/nested-frames.html');
      const nestedFrame = page.frames()[1].childFrames()[1];
      const elementHandle = await nestedFrame.$('div');
      const box = await elementHandle.boundingBox();
      expect(box).toEqual({ x: 28, y: 260, width: 264, height: 18 });
    }));
  });

  describe('ElementHandle.click', function() {
    it('should work', SX(async function() {
      await page.goto(PREFIX + '/input/button.html');
      const button = await page.$('button');
      await button.click();
      expect(await page.evaluate(() => result)).toBe('Clicked');
    }));
    it('should work for Shadow DOM v1', SX(async function() {
      await page.goto(PREFIX + '/shadow.html');
      const buttonHandle = await page.evaluateHandle(() => button);
      await buttonHandle.click();
      expect(await page.evaluate(() => clicked)).toBe(true);
    }));
    it('should work for TextNodes', SX(async function() {
      await page.goto(PREFIX + '/input/button.html');
      const buttonTextNode = await page.evaluateHandle(() => document.querySelector('button').firstChild);
      let error = null;
      await buttonTextNode.click().catch(err => error = err);
      expect(error.message).toBe('Node is not of type HTMLElement');
    }));
    it('should throw for detached nodes', SX(async function() {
      await page.goto(PREFIX + '/input/button.html');
      const button = await page.$('button');
      await page.evaluate(button => button.remove(), button);
      let error = null;
      await button.click().catch(err => error = err);
      expect(error.message).toBe('Node is detached from document');
    }));
  });

  describe('ElementHandle.hover', function() {
    it('should work', SX(async function() {
      await page.goto(PREFIX + '/input/scrollable.html');
      const button = await page.$('#button-6');
      await button.hover();
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-6');
    }));
  });

  describe('ElementHandle.screenshot', function() {
    it('should work', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.goto(PREFIX + '/grid.html');
      await page.evaluate(() => window.scrollBy(50, 100));
      const elementHandle = await page.$('.box:nth-of-type(3)');
      const screenshot = await elementHandle.screenshot();
      expect(screenshot).toBeGolden('screenshot-element-bounding-box.png');
    }));
    it('should take into account padding and border', SX(async function() {
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
    }));
    it('should work with a rotated element', SX(async function() {
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
    }));
    it('should fail to screenshot a detached element', SX(async function() {
      await page.setContent('<h1>remove this</h1>');
      const elementHandle = await page.$('h1');
      await page.evaluate(element => element.remove(), elementHandle);
      const screenshotError = await elementHandle.screenshot().catch(error => error);
      expect(screenshotError.message).toBe('Node is detached from document');
    }));
  });

  describe('ElementHandle.$', function() {
    it('should query existing element', SX(async function() {
      await page.goto(PREFIX + '/playground.html');
      await page.setContent('<html><body><div class="second"><div class="inner">A</div></div></body></html>');
      const html = await page.$('html');
      const second = await html.$('.second');
      const inner = await second.$('.inner');
      const content = await page.evaluate(e => e.textContent, inner);
      expect(content).toBe('A');
    }));

    it('should return null for non-existing element', SX(async function() {
      await page.setContent('<html><body><div class="second"><div class="inner">B</div></div></body></html>');
      const html = await page.$('html');
      const second = await html.$('.third');
      expect(second).toBe(null);
    }));
  });

  describe('ElementHandle.$$', function() {
    it('should query existing elements', SX(async function() {
      await page.setContent('<html><body><div>A</div><br/><div>B</div></body></html>');
      const html = await page.$('html');
      const elements = await html.$$('div');
      expect(elements.length).toBe(2);
      const promises = elements.map(element => page.evaluate(e => e.textContent, element));
      expect(await Promise.all(promises)).toEqual(['A', 'B']);
    }));

    it('should return empty array for non-existing elements', SX(async function() {
      await page.setContent('<html><body><span>A</span><br/><span>B</span></body></html>');
      const html = await page.$('html');
      const elements = await html.$$('div');
      expect(elements.length).toBe(0);
    }));
  });

  describe('input', function() {
    it('should click the button', SX(async function() {
      await page.goto(PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    }));
    it('should fail to click a missing button', SX(async function() {
      await page.goto(PREFIX + '/input/button.html');
      let error = null;
      await page.click('button.does-not-exist').catch(e => error = e);
      expect(error.message).toBe('No node found for selector: button.does-not-exist');
    }));
    // @see https://github.com/GoogleChrome/puppeteer/issues/161
    it('should not hang with touch-enabled viewports', SX(async function() {
      await page.setViewport(iPhone.viewport);
      await page.mouse.down();
      await page.mouse.move(100, 10);
      await page.mouse.up();
    }));
    it('should type into the textarea', SX(async function() {
      await page.goto(PREFIX + '/input/textarea.html');

      const textarea = await page.$('textarea');
      await textarea.type('Type in this text!');
      expect(await page.evaluate(() => result)).toBe('Type in this text!');
    }));
    it('should click the button after navigation ', SX(async function() {
      await page.goto(PREFIX + '/input/button.html');
      await page.click('button');
      await page.goto(PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    }));
    it('should upload the file', SX(async function(){
      await page.goto(PREFIX + '/input/fileupload.html');
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
    }));
    it('should move with the arrow keys', SX(async function(){
      await page.goto(PREFIX + '/input/textarea.html');
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
    }));
    it('should send a character with ElementHandle.press', SX(async function() {
      await page.goto(PREFIX + '/input/textarea.html');
      const textarea = await page.$('textarea');
      await textarea.press('a', {text: 'f'});
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('f');

      await page.evaluate(() => window.addEventListener('keydown', e => e.preventDefault(), true));

      await textarea.press('a', {text: 'y'});
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('f');
    }));
    it('should send a character with sendCharacter', SX(async function() {
      await page.goto(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.keyboard.sendCharacter('嗨');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('嗨');
      await page.evaluate(() => window.addEventListener('keydown', e => e.preventDefault(), true));
      await page.keyboard.sendCharacter('a');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('嗨a');
    }));
    it('should report shiftKey', SX(async function(){
      await page.goto(PREFIX + '/input/keyboard.html');
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
    }));
    it('should report multiple modifiers', SX(async function(){
      await page.goto(PREFIX + '/input/keyboard.html');
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
    }));
    it('should send proper codes while typing', SX(async function(){
      await page.goto(PREFIX + '/input/keyboard.html');
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
    }));
    it('should send proper codes while typing with shift', SX(async function(){
      await page.goto(PREFIX + '/input/keyboard.html');
      const keyboard = page.keyboard;
      await keyboard.down('Shift');
      await page.keyboard.type('~');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: Shift ShiftLeft 16 [Shift]',
            'Keydown: ~ Backquote 192 [Shift]', // 192 is ` keyCode
            'Keypress: ~ Backquote 126 126 126 [Shift]', // 126 is ~ charCode
            'Keyup: ~ Backquote 192 [Shift]'].join('\n'));
      await keyboard.up('Shift');
    }));
    it('should not type canceled events', SX(async function(){
      await page.goto(PREFIX + '/input/textarea.html');
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
    }));
    it('keyboard.modifiers()', SX(async function(){
      const keyboard = page.keyboard;
      expect(keyboard._modifiers).toBe(0);
      await keyboard.down('Shift');
      expect(keyboard._modifiers).toBe(8);
      await keyboard.down('Alt');
      expect(keyboard._modifiers).toBe(9);
      await keyboard.up('Shift');
      await keyboard.up('Alt');
      expect(keyboard._modifiers).toBe(0);
    }));
    it('should resize the textarea', SX(async function(){
      await page.goto(PREFIX + '/input/textarea.html');
      const {x, y, width, height} = await page.evaluate(dimensions);
      const mouse = page.mouse;
      await mouse.move(x + width - 4, y + height - 4);
      await mouse.down();
      await mouse.move(x + width + 100, y + height + 100);
      await mouse.up();
      const newDimensions = await page.evaluate(dimensions);
      expect(newDimensions.width).toBe(width + 104);
      expect(newDimensions.height).toBe(height + 104);
    }));
    it('should scroll and click the button', SX(async function(){
      await page.goto(PREFIX + '/input/scrollable.html');
      await page.click('#button-5');
      expect(await page.evaluate(() => document.querySelector('#button-5').textContent)).toBe('clicked');
      await page.click('#button-80');
      expect(await page.evaluate(() => document.querySelector('#button-80').textContent)).toBe('clicked');
    }));
    it('should click a partially obscured button', SX(async function() {
      await page.goto(PREFIX + '/input/button.html');
      await page.evaluate(() => {
        const button = document.querySelector('button');
        button.textContent = 'Some really long text that will go offscreen';
        button.style.position = 'absolute';
        button.style.left = '368px';
      });
      await page.click('button');
      expect(await page.evaluate(() => window.result)).toBe('Clicked');
    }));
    it('should select the text with mouse', SX(async function(){
      await page.goto(PREFIX + '/input/textarea.html');
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
    }));
    it('should select the text by triple clicking', SX(async function(){
      await page.goto(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      const text = 'This is the text that we are going to try to select. Let\'s see how it goes.';
      await page.keyboard.type(text);
      await page.click('textarea');
      await page.click('textarea', {clickCount: 2});
      await page.click('textarea', {clickCount: 3});
      expect(await page.evaluate(() => window.getSelection().toString())).toBe(text);
    }));
    it('should trigger hover state', SX(async function(){
      await page.goto(PREFIX + '/input/scrollable.html');
      await page.hover('#button-6');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-6');
      await page.hover('#button-2');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-2');
      await page.hover('#button-91');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-91');
    }));
    it('should fire contextmenu event on right click', SX(async function(){
      await page.goto(PREFIX + '/input/scrollable.html');
      await page.click('#button-8', {button: 'right'});
      expect(await page.evaluate(() => document.querySelector('#button-8').textContent)).toBe('context menu');
    }));
    it('should set modifier keys on click', SX(async function(){
      await page.goto(PREFIX + '/input/scrollable.html');
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
    }));
    it('should specify repeat property', SX(async function(){
      await page.goto(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.evaluate(() => document.querySelector('textarea').addEventListener('keydown', e => window.lastEvent = e, true));
      await page.keyboard.down('a', {text: 'a'});
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(false);
      await page.keyboard.press('a');
      expect(await page.evaluate(() => window.lastEvent.repeat)).toBe(true);
    }));
    // @see https://github.com/GoogleChrome/puppeteer/issues/206
    it('should click links which cause navigation', SX(async function() {
      await page.setContent(`<a href="${EMPTY_PAGE}">empty.html</a>`);
      // This await should not hang.
      await page.click('a');
    }));
    it('should tween mouse movement', SX(async function() {
      await page.evaluate(() => {
        window.result = [];
        document.addEventListener('mousemove', event => {
          window.result.push([event.clientX, event.clientY]);
        });
      });
      await page.mouse.move(100, 100);
      await page.mouse.move(200, 300, {steps: 5});
      expect(await page.evaluate('result')).toEqual([
        [100, 100],
        [120, 140],
        [140, 180],
        [160, 220],
        [180, 260],
        [200, 300]
      ]);
    }));
    it('should tap the button', SX(async function() {
      await page.goto(PREFIX + '/input/button.html');
      await page.tap('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    }));
    xit('should report touches', SX(async function() {
      await page.goto(PREFIX + '/input/touches.html');
      const button = await page.$('button');
      await button.tap();
      expect(await page.evaluate(() => getResult())).toEqual(['Touchstart: 0', 'Touchend: 0']);
    }));
    it('should click the button inside an iframe', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.setContent('<div style="width:100px;height:100px">spacer</div>');
      const FrameUtils = require('./frame-utils');
      await FrameUtils.attachFrame(page, 'button-test', PREFIX + '/input/button.html');
      const frame = page.frames()[1];
      const button = await frame.$('button');
      await button.click();
      expect(await frame.evaluate(() => window.result)).toBe('Clicked');
    }));
    it('should click the button with deviceScaleFactor set', SX(async function() {
      await page.setViewport({width: 400, height: 400, deviceScaleFactor: 5});
      expect(await page.evaluate(() => window.devicePixelRatio)).toBe(5);
      await page.setContent('<div style="width:100px;height:100px">spacer</div>');
      const FrameUtils = require('./frame-utils');
      await FrameUtils.attachFrame(page, 'button-test', PREFIX + '/input/button.html');
      const frame = page.frames()[1];
      const button = await frame.$('button');
      await button.click();
      expect(await frame.evaluate(() => window.result)).toBe('Clicked');
    }));
    it('should type all kinds of characters', SX(async function() {
      await page.goto(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      const text = 'This text goes onto two lines.\nThis character is 嗨.';
      await page.keyboard.type(text);
      expect(await page.evaluate('result')).toBe(text);
    }));
    it('should specify location', SX(async function() {
      await page.goto(PREFIX + '/input/textarea.html');
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
    }));
    it('should throw on unknown keys', SX(async function() {
      let error = await page.keyboard.press('NotARealKey').catch(e => e);
      expect(error.message).toBe('Unknown key: "NotARealKey"');

      error = await page.keyboard.press('ё').catch(e => e);
      expect(error && error.message).toBe('Unknown key: "ё"');

      error = await page.keyboard.press('😊').catch(e => e);
      expect(error && error.message).toBe('Unknown key: "😊"');
    }));
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
    it('should work', SX(async function() {
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Mozilla');
      page.setUserAgent('foobar');
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(EMPTY_PAGE),
      ]);
      expect(request.headers['user-agent']).toBe('foobar');
    }));
    it('should emulate device user-agent', SX(async function() {
      await page.goto(PREFIX + '/mobile.html');
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Chrome');
      await page.setUserAgent(iPhone.userAgent);
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Safari');
    }));
  });

  describe('Page.setExtraHTTPHeaders', function() {
    it('should work', SX(async function() {
      await page.setExtraHTTPHeaders({
        foo: 'bar'
      });
      const [request] = await Promise.all([
        server.waitForRequest('/empty.html'),
        page.goto(EMPTY_PAGE),
      ]);
      expect(request.headers['foo']).toBe('bar');
    }));
    it('should throw for non-string header values', SX(async function() {
      let error = null;
      try {
        await page.setExtraHTTPHeaders({ 'foo': 1 });
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Expected value of header "foo" to be String, but "number" is found.');
    }));
  });

  describe('Page.authenticate', function() {
    it('should work', SX(async function() {
      server.setAuth('/empty.html', 'user', 'pass');
      let response = await page.goto(EMPTY_PAGE);
      expect(response.status).toBe(401);
      await page.authenticate({
        username: 'user',
        password: 'pass'
      });
      response = await page.reload();
      expect(response.status).toBe(200);
    }));
    it('should fail if wrong credentials', SX(async function() {
      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user2', 'pass2');
      await page.authenticate({
        username: 'foo',
        password: 'bar'
      });
      const response = await page.goto(EMPTY_PAGE);
      expect(response.status).toBe(401);
    }));
    it('should allow disable authentication', SX(async function() {
      // Use unique user/password since Chrome caches credentials per origin.
      server.setAuth('/empty.html', 'user3', 'pass3');
      await page.authenticate({
        username: 'user3',
        password: 'pass3'
      });
      let response = await page.goto(EMPTY_PAGE);
      expect(response.status).toBe(200);
      await page.authenticate(null);
      // Navigate to a different origin to bust Chrome's credential caching.
      response = await page.goto(CROSS_PROCESS_PREFIX + '/empty.html');
      expect(response.status).toBe(401);
    }));
  });

  describe('Page.setContent', function() {
    const expectedOutput = '<html><head></head><body><div>hello</div></body></html>';
    it('should work', SX(async function() {
      await page.setContent('<div>hello</div>');
      const result = await page.content();
      expect(result).toBe(expectedOutput);
    }));
    it('should work with doctype', SX(async function() {
      const doctype = '<!DOCTYPE html>';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    }));
    it('should work with HTML 4 doctype', SX(async function() {
      const doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
        '"http://www.w3.org/TR/html4/strict.dtd">';
      await page.setContent(`${doctype}<div>hello</div>`);
      const result = await page.content();
      expect(result).toBe(`${doctype}${expectedOutput}`);
    }));
    it('should await resources to load', SX(async function() {
      const imgPath = '/img.png';
      let imgResponse = null;
      server.setRoute(imgPath, (req, res) => imgResponse = res);
      let loaded = false;
      const contentPromise = page.setContent(`<img src="${PREFIX + imgPath}"></img>`).then(() => loaded = true);
      await server.waitForRequest(imgPath);
      expect(loaded).toBe(false);
      imgResponse.end();
      await contentPromise;
    }));
  });

  describe('Network Events', function() {
    it('Page.Events.Request', SX(async function() {
      const requests = [];
      page.on('request', request => requests.push(request));
      await page.goto(EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toBe(EMPTY_PAGE);
      expect(requests[0].resourceType).toBe('document');
      expect(requests[0].method).toBe('GET');
      expect(requests[0].response()).toBeTruthy();
    }));
    it('Page.Events.Request should report post data', SX(async function() {
      await page.goto(EMPTY_PAGE);
      server.setRoute('/post', (req, res) => res.end());
      let request = null;
      page.on('request', r => request = r);
      await page.evaluate(() => fetch('./post', { method: 'POST', body: JSON.stringify({foo: 'bar'})}));
      expect(request).toBeTruthy();
      expect(request.postData).toBe('{"foo":"bar"}');
    }));
    it('Page.Events.Response', SX(async function() {
      const responses = [];
      page.on('response', response => responses.push(response));
      await page.goto(EMPTY_PAGE);
      expect(responses.length).toBe(1);
      expect(responses[0].url).toBe(EMPTY_PAGE);
      expect(responses[0].status).toBe(200);
      expect(responses[0].ok).toBe(true);
      expect(responses[0].request()).toBeTruthy();
    }));
    it('Page.Events.Response should provide body', SX(async function() {
      let response = null;
      page.on('response', r => response = r);
      await page.goto(PREFIX + '/simple.json');
      expect(response).toBeTruthy();
      expect(await response.text()).toBe('{"foo": "bar"}\n');
      expect(await response.json()).toEqual({foo: 'bar'});
    }));
    it('Page.Events.Response should not report body unless request is finished', SX(async() => {
      await page.goto(EMPTY_PAGE);
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
      expect(pageResponse.status).toBe(200);
      expect(requestFinished).toBe(false);

      const responseText = pageResponse.text();
      // Write part of the response and wait for it to be flushed.
      await new Promise(x => serverResponse.write('wor', x));
      // Finish response.
      await new Promise(x => serverResponse.end('ld!', x));
      expect(await responseText).toBe('hello world!');
    }));
    it('Page.Events.RequestFailed', SX(async function() {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url.endsWith('css'))
          request.abort();
        else
          request.continue();
      });
      const failedRequests = [];
      page.on('requestfailed', request => failedRequests.push(request));
      await page.goto(PREFIX + '/one-style.html');
      expect(failedRequests.length).toBe(1);
      expect(failedRequests[0].url).toContain('one-style.css');
      expect(failedRequests[0].response()).toBe(null);
      expect(failedRequests[0].resourceType).toBe('stylesheet');
      expect(failedRequests[0].failure().errorText).toBe('net::ERR_FAILED');
    }));
    it('Page.Events.RequestFinished', SX(async function() {
      const requests = [];
      page.on('requestfinished', request => requests.push(request));
      await page.goto(EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toBe(EMPTY_PAGE);
      expect(requests[0].response()).toBeTruthy();
    }));
    it('should fire events in proper order', SX(async function() {
      const events = [];
      page.on('request', request => events.push('request'));
      page.on('response', response => events.push('response'));
      page.on('requestfinished', request => events.push('requestfinished'));
      await page.goto(EMPTY_PAGE);
      expect(events).toEqual(['request', 'response', 'requestfinished']);
    }));
    it('should support redirects', SX(async function() {
      const events = [];
      page.on('request', request => events.push(`${request.method} ${request.url}`));
      page.on('response', response => events.push(`${response.status} ${response.url}`));
      page.on('requestfinished', request => events.push(`DONE ${request.url}`));
      page.on('requestfailed', request => events.push(`FAIL ${request.url}`));
      server.setRedirect('/foo.html', '/empty.html');
      const FOO_URL = PREFIX + '/foo.html';
      await page.goto(FOO_URL);
      expect(events).toEqual([
        `GET ${FOO_URL}`,
        `302 ${FOO_URL}`,
        `DONE ${FOO_URL}`,
        `GET ${EMPTY_PAGE}`,
        `200 ${EMPTY_PAGE}`,
        `DONE ${EMPTY_PAGE}`
      ]);
    }));
  });

  describe('Page.addScriptTag', function() {
    it('should throw an error if no options are provided', SX(async function() {
      let error = null;
      try {
        await page.addScriptTag('/injectedfile.js');
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Provide an object with a `url`, `path` or `content` property');
    }));

    it('should work with a url', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.addScriptTag({ url: '/injectedfile.js' });
      expect(await page.evaluate(() => __injected)).toBe(42);
    }));

    it('should work with a path', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.addScriptTag({ path: path.join(__dirname, 'assets/injectedfile.js') });
      expect(await page.evaluate(() => __injected)).toBe(42);
    }));

    it('should include sourcemap when path is provided', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.addScriptTag({ path: path.join(__dirname, 'assets/injectedfile.js') });
      const result = await page.evaluate(() => __injectedError.stack);
      expect(result).toContain(path.join('assets', 'injectedfile.js'));
    }));

    it('should work with content', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.addScriptTag({ content: 'window.__injected = 35;' });
      expect(await page.evaluate(() => __injected)).toBe(35);
    }));
  });

  describe('Page.addStyleTag', function() {
    it('should throw an error if no options are provided', SX(async function() {
      let error = null;
      try {
        await page.addStyleTag('/injectedstyle.css');
      } catch (e) {
        error = e;
      }
      expect(error.message).toBe('Provide an object with a `url`, `path` or `content` property');
    }));

    it('should work with a url', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.addStyleTag({ url: '/injectedstyle.css' });
      expect(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(255, 0, 0)');
    }));

    it('should work with a path', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.addStyleTag({ path: path.join(__dirname, 'assets/injectedstyle.css') });
      expect(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(255, 0, 0)');
    }));

    it('should include sourcemap when path is provided', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.addStyleTag({ path: path.join(__dirname, 'assets/injectedstyle.css') });
      const styleHandle = await page.$('style');
      const styleContent = await page.evaluate(style => style.innerHTML, styleHandle);
      expect(styleContent).toContain(path.join('assets', 'injectedstyle.css'));
      styleHandle.dispose();
    }));

    it('should work with content', SX(async function() {
      await page.goto(EMPTY_PAGE);
      await page.addStyleTag({ content: 'body { background-color: green; }' });
      expect(await page.evaluate(`window.getComputedStyle(document.querySelector('body')).getPropertyValue('background-color')`)).toBe('rgb(0, 128, 0)');
    }));
  });

  describe('Page.url', function() {
    it('should work', SX(async function() {
      expect(page.url()).toBe('about:blank');
      await page.goto(EMPTY_PAGE);
      expect(page.url()).toBe(EMPTY_PAGE);
    }));
  });

  describe('Page.viewport', function() {
    it('should get the proper viewport size', SX(async function() {
      expect(page.viewport()).toEqual({width: 800, height: 600});
      await page.setViewport({width: 123, height: 456});
      expect(page.viewport()).toEqual({width: 123, height: 456});
    }));
    it('should support mobile emulation', SX(async function() {
      await page.goto(PREFIX + '/mobile.html');
      expect(await page.evaluate(() => window.innerWidth)).toBe(800);
      await page.setViewport(iPhone.viewport);
      expect(await page.evaluate(() => window.innerWidth)).toBe(375);
      await page.setViewport({width: 400, height: 300});
      expect(await page.evaluate(() => window.innerWidth)).toBe(400);
    }));
    it('should support touch emulation', SX(async function() {
      await page.goto(PREFIX + '/mobile.html');
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(false);
      await page.setViewport(iPhone.viewport);
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(true);
      expect(await page.evaluate(dispatchTouch)).toBe('Recieved touch');
      await page.setViewport({width: 100, height: 100});
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(false);

      function dispatchTouch() {
        let fulfill;
        const promise = new Promise(x => fulfill = x);
        window.ontouchstart = function(e) {
          fulfill('Recieved touch');
        };
        window.dispatchEvent(new Event('touchstart'));

        fulfill('Did not recieve touch');

        return promise;
      }
    }));
    it('should be detectable by Modernizr', SX(async function(){
      await page.goto(PREFIX + '/detect-touch.html');
      expect(await page.evaluate(() => document.body.textContent.trim())).toBe('NO');
      await page.setViewport(iPhone.viewport);
      await page.goto(PREFIX + '/detect-touch.html');
      expect(await page.evaluate(() => document.body.textContent.trim())).toBe('YES');
    }));
    it('should support landscape emulation', SX(async function() {
      await page.goto(PREFIX + '/mobile.html');
      expect(await page.evaluate(() => screen.orientation.type)).toBe('portrait-primary');
      await page.setViewport(iPhoneLandscape.viewport);
      expect(await page.evaluate(() => screen.orientation.type)).toBe('landscape-primary');
      await page.setViewport({width: 100, height: 100});
      expect(await page.evaluate(() => screen.orientation.type)).toBe('portrait-primary');
    }));
  });

  describe('Page.emulate', function() {
    it('should work', SX(async function() {
      await page.goto(PREFIX + '/mobile.html');
      await page.emulate(iPhone);
      expect(await page.evaluate(() => window.innerWidth)).toBe(375);
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Safari');
    }));
  });

  describe('Page.emulateMedia', function() {
    it('should work', SX(async function() {
      expect(await page.evaluate(() => window.matchMedia('screen').matches)).toBe(true);
      expect(await page.evaluate(() => window.matchMedia('print').matches)).toBe(false);
      await page.emulateMedia('print');
      expect(await page.evaluate(() => window.matchMedia('screen').matches)).toBe(false);
      expect(await page.evaluate(() => window.matchMedia('print').matches)).toBe(true);
      await page.emulateMedia(null);
      expect(await page.evaluate(() => window.matchMedia('screen').matches)).toBe(true);
      expect(await page.evaluate(() => window.matchMedia('print').matches)).toBe(false);
    }));
    it('should throw in case of bad argument', SX(async function() {
      let error = null;
      await page.emulateMedia('bad').catch(e => error = e);
      expect(error.message).toBe('Unsupported media type: bad');
    }));
  });

  describe('Page.setJavaScriptEnabled', function() {
    it('should work', SX(async function() {
      await page.setJavaScriptEnabled(false);
      await page.goto('data:text/html, <script>var something = "forbidden"</script>');
      let error = null;
      await page.evaluate('something').catch(e => error = e);
      expect(error.message).toContain('something is not defined');

      await page.setJavaScriptEnabled(true);
      await page.goto('data:text/html, <script>var something = "forbidden"</script>');
      expect(await page.evaluate('something')).toBe('forbidden');
    }));
  });

  describe('Page.evaluateOnNewDocument', function() {
    it('should evaluate before anything else on the page', SX(async function() {
      await page.evaluateOnNewDocument(function(){
        window.injected = 123;
      });
      await page.goto(PREFIX + '/tamperable.html');
      expect(await page.evaluate(() => window.result)).toBe(123);
    }));
  });

  // Printing to pdf is currently only supported in headless
  (headless ? describe : xdescribe)('Page.pdf', function() {
    it('should be able to save file', SX(async function() {
      const outputFile = __dirname + '/assets/output.pdf';
      await page.pdf({path: outputFile});
      expect(fs.readFileSync(outputFile).byteLength).toBeGreaterThan(0);
      fs.unlinkSync(outputFile);
    }));
    it('should default to printing in Letter format', SX(async function() {
      const pages = await getPDFPages(await page.pdf());
      expect(pages.length).toBe(1);
      expect(pages[0].width).toBeCloseTo(8.5, 2);
      expect(pages[0].height).toBeCloseTo(11, 2);
    }));
    it('should support setting custom format', SX(async function() {
      const pages = await getPDFPages(await page.pdf({
        format: 'a4'
      }));
      expect(pages.length).toBe(1);
      expect(pages[0].width).toBeCloseTo(8.27, 1);
      expect(pages[0].height).toBeCloseTo(11.7, 1);
    }));
    it('should support setting paper width and height', SX(async function() {
      const pages = await getPDFPages(await page.pdf({
        width: '10in',
        height: '10in',
      }));
      expect(pages.length).toBe(1);
      expect(pages[0].width).toBeCloseTo(10, 2);
      expect(pages[0].height).toBeCloseTo(10, 2);
    }));
    it('should print multiple pages', SX(async function() {
      await page.goto(PREFIX + '/grid.html');
      // Define width and height in CSS pixels.
      const width = 50 * 5 + 1;
      const height = 50 * 5 + 1;
      const pages = await getPDFPages(await page.pdf({width, height}));
      expect(pages.length).toBe(8);
      expect(pages[0].width).toBeCloseTo(cssPixelsToInches(width), 2);
      expect(pages[0].height).toBeCloseTo(cssPixelsToInches(height), 2);
    }));
    it('should support page ranges', SX(async function() {
      await page.goto(PREFIX + '/grid.html');
      // Define width and height in CSS pixels.
      const width = 50 * 5 + 1;
      const height = 50 * 5 + 1;
      const pages = await getPDFPages(await page.pdf({width, height, pageRanges: '1,4-7'}));
      expect(pages.length).toBe(5);
    }));
    it('should throw if format is unknown', SX(async function() {
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
    }));
    it('should throw if units are unknown', SX(async function() {
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
    }));
  });

  describe('Page.title', function() {
    it('should return the page title', SX(async function(){
      await page.goto(PREFIX + '/input/button.html');
      expect(await page.title()).toBe('Button test');
    }));
  });

  describe('Page.screenshot', function() {
    it('should work', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.goto(PREFIX + '/grid.html');
      const screenshot = await page.screenshot();
      expect(screenshot).toBeGolden('screenshot-sanity.png');
    }));
    it('should clip rect', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.goto(PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        clip: {
          x: 50,
          y: 100,
          width: 150,
          height: 100
        }
      });
      expect(screenshot).toBeGolden('screenshot-clip-rect.png');
    }));
    it('should work for offscreen clip', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.goto(PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        clip: {
          x: 50,
          y: 600,
          width: 100,
          height: 100
        }
      });
      expect(screenshot).toBeGolden('screenshot-offscreen-clip.png');
    }));
    it('should run in parallel', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.goto(PREFIX + '/grid.html');
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
    }));
    it('should take fullPage screenshots', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.goto(PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        fullPage: true
      });
      expect(screenshot).toBeGolden('screenshot-grid-fullpage.png');
    }));
    it('should run in parallel in multiple pages', SX(async function() {
      const N = 2;
      const pages = await Promise.all(Array(N).fill(0).map(async() => {
        const page = await browser.newPage();
        await page.goto(PREFIX + '/grid.html');
        return page;
      }));
      const promises = [];
      for (let i = 0; i < N; ++i)
        promises.push(pages[i].screenshot({ clip: { x: 50 * i, y: 0, width: 50, height: 50 } }));
      const screenshots = await Promise.all(promises);
      for (let i = 0; i < N; ++i)
        expect(screenshots[i]).toBeGolden(`grid-cell-${i}.png`);
      await Promise.all(pages.map(page => page.close()));
    }));
    it('should allow transparency', SX(async function() {
      await page.setViewport({ width: 100, height: 100 });
      await page.goto(EMPTY_PAGE);
      const screenshot = await page.screenshot({omitBackground: true});
      expect(screenshot).toBeGolden('transparent.png');
    }));
    it('should work with odd clip size on Retina displays', SX(async function() {
      const screenshot = await page.screenshot({
        clip: {
          x: 0,
          y: 0,
          width: 11,
          height: 11,
        }
      });
      expect(screenshot).toBeGolden('screenshot-clip-odd-size.png');
    }));
  });

  describe('Page.select', function() {
    it('should select single option', SX(async function() {
      await page.goto(PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(await page.evaluate(() => result.onInput)).toEqual(['blue']);
      expect(await page.evaluate(() => result.onChange)).toEqual(['blue']);
    }));

    it('should select multiple options', SX(async function() {
      await page.goto(PREFIX + '/input/select.html');
      await page.evaluate(() => makeMultiple());
      await page.select('select', 'blue', 'green', 'red');
      expect(await page.evaluate(() => result.onInput)).toEqual(['blue', 'green', 'red']);
      expect(await page.evaluate(() => result.onChange)).toEqual(['blue', 'green', 'red']);
    }));

    it('should respect event bubbling', SX(async function() {
      await page.goto(PREFIX + '/input/select.html');
      await page.select('select', 'blue');
      expect(await page.evaluate(() => result.onBubblingInput)).toEqual(['blue']);
      expect(await page.evaluate(() => result.onBubblingChange)).toEqual(['blue']);
    }));

    it('should throw when element is not a <select>', SX(async function() {
      let error = null;
      await page.goto(PREFIX + '/input/select.html');
      await page.select('body', '').catch(e => error = e);
      expect(error.message).toContain('Element is not a <select> element.');
    }));

    it('should return [] on no matched values', SX(async function() {
      await page.goto(PREFIX + '/input/select.html');
      const result = await page.select('select','42','abc');
      expect(result).toEqual([]);
    }));

    it('should return an array of matched values', SX(async function() {
      await page.goto(PREFIX + '/input/select.html');
      await page.evaluate(() => makeMultiple());
      const result = await page.select('select','blue','black','magenta');
      expect(result.reduce((accumulator,current) => ['blue', 'black', 'magenta'].includes(current) && accumulator, true)).toEqual(true);
    }));

    it('should return an array of one element when multiple is not set', SX(async function() {
      await page.goto(PREFIX + '/input/select.html');
      const result = await page.select('select','42','blue','black','magenta');
      expect(result.length).toEqual(1);
    }));

    it('should return [] on no values',SX(async function() {
      await page.goto(PREFIX + '/input/select.html');
      const result = await page.select('select');
      expect(result).toEqual([]);
    }));

    it('should deselect all options when passed no values for a multiple select',SX(async function() {
      await page.goto(PREFIX + '/input/select.html');
      await page.evaluate(() => makeMultiple());
      await page.select('select','blue','black','magenta');
      await page.select('select');
      expect(await page.$eval('select', select => Array.from(select.options).every(option => !option.selected))).toEqual(true);
    }));

    it('should deselect all options when passed no values for a select without multiple',SX(async function() {
      await page.goto(PREFIX + '/input/select.html');
      await page.select('select','blue','black','magenta');
      await page.select('select');
      expect(await page.$eval('select', select => Array.from(select.options).every(option => !option.selected))).toEqual(true);
    }));

  });

  describe('Tracing', function() {
    const outputFile = path.join(__dirname, 'assets', 'trace.json');
    afterEach(function() {
      fs.unlinkSync(outputFile);
    });
    it('should output a trace', SX(async function() {
      await page.tracing.start({screenshots: true, path: outputFile});
      await page.goto(PREFIX + '/grid.html');
      await page.tracing.stop();
      expect(fs.existsSync(outputFile)).toBe(true);
    }));
    it('should throw if tracing on two pages', SX(async function() {
      await page.tracing.start({path: outputFile});
      const newPage = await browser.newPage();
      let error = null;
      await newPage.tracing.start({path: outputFile}).catch(e => error = e);
      await newPage.close();
      expect(error).toBeTruthy();
      await page.tracing.stop();
    }));
  });

  describe('Cookies', function() {
    afterEach(SX(async function(){
      const cookies = await page.cookies(PREFIX + '/grid.html', CROSS_PROCESS_PREFIX);
      for (const cookie of cookies)
        await page.deleteCookie(cookie);
    }));
    it('should set and get cookies', SX(async function(){
      await page.goto(PREFIX + '/grid.html');
      expect(await page.cookies()).toEqual([]);
      await page.evaluate(() => {
        document.cookie = 'username=John Doe';
      });
      expect(await page.cookies()).toEqual([{
        name: 'username',
        value: 'John Doe',
        domain: 'localhost',
        path: '/',
        expires: 0,
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
        expires: 0,
        size: 14,
        httpOnly: false,
        secure: false,
        session: true
      }, {
        name: 'username',
        value: 'John Doe',
        domain: 'localhost',
        path: '/',
        expires: 0,
        size: 16,
        httpOnly: false,
        secure: false,
        session: true
      }]);
    }));

    it('should set a cookie with a path', SX(async function(){
      await page.goto(PREFIX + '/grid.html');
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
        expires: 0,
        size: 14,
        httpOnly: false,
        secure: false,
        session: true
      }]);
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
      await page.goto(PREFIX + '/empty.html');
      expect(await page.cookies()).toEqual([]);
      expect(await page.evaluate('document.cookie')).toBe('');
      await page.goto(PREFIX + '/grid.html');
      expect(await page.evaluate('document.cookie')).toBe('gridcookie=GRID');
    }));


    it('should delete a cookie', SX(async function(){
      await page.goto(PREFIX + '/grid.html');
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
    }));

    it('should set a cookie on a different domain', SX(async function() {
      await page.goto(PREFIX + '/grid.html');
      await page.setCookie({name: 'example-cookie', value: 'best',  url: 'https://www.example.com'});
      expect(await page.evaluate('document.cookie')).toBe('');
      expect(await page.cookies()).toEqual([]);
      expect(await page.cookies('https://www.example.com')).toEqual([{
        name: 'example-cookie',
        value: 'best',
        domain: 'www.example.com',
        path: '/',
        expires: 0,
        size: 18,
        httpOnly: false,
        secure: true,
        session: true
      }]);
    }));

    it('should set cookies from a frame', SX(async function() {
      await page.goto(PREFIX + '/grid.html');
      await page.setCookie({name: 'localhost-cookie', value: 'best'});
      await page.evaluate(src => {
        let fulfill;
        const promise = new Promise(x => fulfill = x);
        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        iframe.onload = fulfill;
        iframe.src = src;
        return promise;
      }, CROSS_PROCESS_PREFIX);
      await page.setCookie({name: '127-cookie', value: 'worst', url: CROSS_PROCESS_PREFIX});
      expect(await page.evaluate('document.cookie')).toBe('localhost-cookie=best');
      expect(await page.frames()[1].evaluate('document.cookie')).toBe('127-cookie=worst');

      expect(await page.cookies()).toEqual([{
        name: 'localhost-cookie',
        value: 'best',
        domain: 'localhost',
        path: '/',
        expires: 0,
        size: 20,
        httpOnly: false,
        secure: false,
        session: true
      }]);

      expect(await page.cookies(CROSS_PROCESS_PREFIX)).toEqual([{
        name: '127-cookie',
        value: 'worst',
        domain: '127.0.0.1',
        path: '/',
        expires: 0,
        size: 15,
        httpOnly: false,
        secure: false,
        session: true
      }]);

    }));
  });

  describe('Target', function() {
    it('Browser.targets should return all of the targets', SX(async function() {
      // The pages will be the testing page and the original newtab page
      const targets = browser.targets();
      expect(targets.some(target => target.type() === 'page' &&
        target.url() === 'about:blank')).toBeTruthy('Missing blank page');
      expect(targets.some(target => target.type() === 'other' &&
        target.url() === '')).toBeTruthy('Missing browser target');
    }));
    it('Browser.pages should return all of the pages', SX(async function() {
      // The pages will be the testing page and the original newtab page
      const allPages = await browser.pages();
      expect(allPages.length).toBe(2);
      expect(allPages).toContain(page);
      expect(allPages[0]).not.toBe(allPages[1]);
    }));
    it('should be able to use the default page in the browser', SX(async function() {
      // The pages will be the testing page and the original newtab page
      const allPages = await browser.pages();
      const originalPage = allPages.find(p => p !== page);
      expect(await originalPage.evaluate(() => ['Hello', 'world'].join(' '))).toBe('Hello world');
      expect(await originalPage.$('body')).toBeTruthy();
    }));
    it('should report when a new page is created and closed', SX(async function(){
      const otherPagePromise = new Promise(fulfill => browser.once('targetcreated', target => fulfill(target.page())));
      await page.evaluate(url => window.open(url), CROSS_PROCESS_PREFIX);
      const otherPage = await otherPagePromise;
      expect(otherPage.url()).toContain(CROSS_PROCESS_PREFIX);

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
    }));
    it('should report when a service worker is created and destroyed', SX(async function() {
      await page.goto(EMPTY_PAGE);
      const createdTarget = new Promise(fulfill => browser.once('targetcreated', target => fulfill(target)));
      const registration = await page.evaluateHandle(() => navigator.serviceWorker.register('sw.js'));

      expect((await createdTarget).type()).toBe('service_worker');
      expect((await createdTarget).url()).toBe(PREFIX + '/sw.js');

      const destroyedTarget = new Promise(fulfill => browser.once('targetdestroyed', target => fulfill(target)));
      await page.evaluate(registration => registration.unregister(), registration);
      expect(await destroyedTarget).toBe(await createdTarget);
    }));
    it('should report when a target url changes', SX(async function(){
      await page.goto(EMPTY_PAGE);
      let changedTarget = new Promise(fulfill => browser.once('targetchanged', target => fulfill(target)));
      await page.goto(CROSS_PROCESS_PREFIX + '/');
      expect((await changedTarget).url()).toBe(CROSS_PROCESS_PREFIX + '/');

      changedTarget = new Promise(fulfill => browser.once('targetchanged', target => fulfill(target)));
      await page.goto(EMPTY_PAGE);
      expect((await changedTarget).url()).toBe(EMPTY_PAGE);
    }));
    it('should not report uninitialized pages', SX(async function() {
      browser.on('targetchanged', () => {
        expect(false).toBe(true, 'target should not be reported as changed');
      });
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
    }));
  });
});

if (process.env.COVERAGE) {
  describe('COVERAGE', function(){
    const coverage = helper.publicAPICoverage();
    const disabled = new Set();
    if (!headless)
      disabled.add('page.pdf');

    for (const method of coverage.keys()) {
      (disabled.has(method) ? xit : it)(`public api '${method}' should be called`, SX(async function(){
        expect(coverage.get(method)).toBe(true);
      }));
    }
  });
}
/**
 * @param {!EventEmitter} emitter
 * @param {string} eventName
 * @param {number=} eventCount
 * @return {!Promise}
 */
function waitForEvents(emitter, eventName, eventCount = 1) {
  let fulfill;
  const promise = new Promise(x => fulfill = x);
  emitter.on(eventName, onEvent);
  return promise;

  function onEvent() {
    --eventCount;
    if (eventCount)
      return;
    emitter.removeListener(eventName, onEvent);
    fulfill();
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

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
  return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
