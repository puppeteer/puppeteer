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

let fs = require('fs');
let rm = require('rimraf').sync;
let path = require('path');
let Browser = require('../lib/Browser');
let SimpleServer = require('./server/SimpleServer');
let GoldenUtils = require('./golden-utils');

let GOLDEN_DIR = path.join(__dirname, 'golden');
let OUTPUT_DIR = path.join(__dirname, 'output');

let PORT = 8907;
let PREFIX = 'http://localhost:' + PORT;
let EMPTY_PAGE = PREFIX + '/empty.html';
let HTTPS_PORT = 8908;
let HTTPS_PREFIX = 'https://localhost:' + HTTPS_PORT;

const iPhone = require('../DeviceDescriptors')['iPhone 6'];
const iPhoneLandscape = require('../DeviceDescriptors')['iPhone 6 landscape'];

const headless = (process.env.HEADLESS || 'true').trim().toLowerCase() === 'true';
if (process.env.DEBUG_TEST)
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 1000 * 1000;
else
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;

// Make sure the `npm install` was run after the chromium roll.
{
  const Downloader = require('../utils/ChromiumDownloader');
  const chromiumRevision = require('../package.json').puppeteer.chromium_revision;
  const revisionInfo = Downloader.revisionInfo(Downloader.currentPlatform(), chromiumRevision);
  console.assert(revisionInfo, `Chromium r${chromiumRevision} is not downloaded. Run 'npm install' and try to re-run tests.`);
}

describe('Puppeteer', function() {
  let browser;
  let server;
  let httpsServer;
  let page;

  beforeAll(SX(async function() {
    browser = new Browser({headless, args: ['--no-sandbox']});
    const assetsPath = path.join(__dirname, 'assets');
    server = await SimpleServer.create(assetsPath, PORT);
    httpsServer = await SimpleServer.createHTTPS(assetsPath, HTTPS_PORT);
    if (fs.existsSync(OUTPUT_DIR))
      rm(OUTPUT_DIR);
  }));

  afterAll(SX(async function() {
    await Promise.all([
      server.stop(),
      httpsServer.stop(),
    ]);
    browser.close();
  }));

  beforeEach(SX(async function() {
    page = await browser.newPage();
    server.reset();
    httpsServer.reset();
    GoldenUtils.addMatchers(jasmine, GOLDEN_DIR, OUTPUT_DIR);
  }));

  afterEach(SX(async function() {
    await page.close();
  }));

  describe('Page.evaluate', function() {
    it('should work', SX(async function() {
      let result = await page.evaluate(() => 7 * 3);
      expect(result).toBe(21);
    }));
    it('should await promise', SX(async function() {
      let result = await page.evaluate(() => Promise.resolve(8 * 7));
      expect(result).toBe(56);
    }));
    it('should work from-inside inPageCallback', SX(async function() {
      // Setup inpage callback, which calls Page.evaluate
      await page.setInPageCallback('callController', async function(a, b) {
        return await page.evaluate((a, b) => a * b, a, b);
      });
      let result = await page.evaluate(async function() {
        return await callController(9, 3);
      });
      expect(result).toBe(27);
    }));
    it('should reject promise with exception', SX(async function() {
      let error = null;
      try {
        await page.evaluate(() => not.existing.object.property);
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      expect(error.message).toContain('not is not defined');
    }));
    it('should return complex objects', SX(async function() {
      const object = {foo: 'bar!'};
      let result = await page.evaluate(a => a, object);
      expect(result).not.toBe(object);
      expect(result).toEqual(object);
    }));
    it('should return NaN', SX(async function() {
      let result = await page.evaluate(() => NaN);
      expect(Object.is(result, NaN)).toBe(true);
    }));
    it('should return -0', SX(async function() {
      let result = await page.evaluate(() => -0);
      expect(Object.is(result, -0)).toBe(true);
    }));
    it('should return Infinity', SX(async function() {
      let result = await page.evaluate(() => Infinity);
      expect(Object.is(result, Infinity)).toBe(true);
    }));
    it('should return -Infinity', SX(async function() {
      let result = await page.evaluate(() => -Infinity);
      expect(Object.is(result, -Infinity)).toBe(true);
    }));
    it('should not fail for window object', SX(async function() {
      let result = await page.evaluate(() => window);
      expect(result).toBe('Window');
    }));
  });

  describe('Page.injectFile', function() {
    it('should work', SX(async function() {
      const helloPath = path.join(__dirname, './assets/injectedfile.js');
      await page.injectFile(helloPath);
      const result = await page.evaluate(() => __injected);
      expect(result).toBe(42);
    }));
    it('should include sourcemap', SX(async function() {
      const helloPath = path.join(__dirname, './assets/injectedfile.js');
      await page.injectFile(helloPath);
      const result = await page.evaluate(() => __injectedError.stack);
      expect(result).toContain('assets/injectedfile.js');
    }));
  });

  describe('Frame.evaluate', function() {
    let FrameUtils = require('./frame-utils');
    it('should have different execution contexts', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      expect(page.frames().length).toBe(2);
      let frame1 = page.frames()[0];
      let frame2 = page.frames()[1];
      await frame1.evaluate(() => window.FOO = 'foo');
      await frame2.evaluate(() => window.FOO = 'bar');
      expect(await frame1.evaluate(() => window.FOO)).toBe('foo');
      expect(await frame2.evaluate(() => window.FOO)).toBe('bar');
    }));
  });

  describe('Frame.waitForSelector', function() {
    let FrameUtils = require('./frame-utils');
    let addElement = tag => document.body.appendChild(document.createElement(tag));

    it('should immediately resolve promise if node exists', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      let frame = page.mainFrame();
      let added = false;
      await frame.waitForSelector('*').then(() => added = true);
      expect(added).toBe(true);

      added = false;
      await frame.evaluate(addElement, 'div');
      await frame.waitForSelector('div').then(() => added = true);
      expect(added).toBe(true);
    }));

    it('should resolve promise when node is added', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      let frame = page.mainFrame();
      let added = false;
      frame.waitForSelector('div').then(() => added = true);
      // run nop function..
      await frame.evaluate(() => 42);
      // .. to be sure that waitForSelector promise is not resolved yet.
      expect(added).toBe(false);
      await frame.evaluate(addElement, 'br');
      expect(added).toBe(false);
      await frame.evaluate(addElement, 'div');
      expect(added).toBe(true);
    }));

    it('should work when node is added through innerHTML', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      let frame = page.mainFrame();
      let added = false;
      frame.waitForSelector('h3 div').then(() => added = true);
      expect(added).toBe(false);
      await frame.evaluate(addElement, 'span');
      await page.$('span', span => span.innerHTML = '<h3><div></div></h3>');
      expect(added).toBe(true);
    }));

    it('Page.waitForSelector is shortcut for main frame', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      let otherFrame = page.frames()[1];
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
      let frame1 = page.frames()[1];
      let frame2 = page.frames()[2];
      let added = false;
      frame2.waitForSelector('div').then(() => added = true);
      expect(added).toBe(false);
      await frame1.evaluate(addElement, 'div');
      expect(added).toBe(false);
      await frame2.evaluate(addElement, 'div');
      expect(added).toBe(true);
    }));

    it('should throw if evaluation failed', SX(async function() {
      await page.evaluateOnInitialized(function() {
        document.querySelector = null;
      });
      await page.navigate(EMPTY_PAGE);
      try {
        await page.waitForSelector('*');
        fail('Failed waitForSelector did not throw.');
      } catch (e) {
        expect(e.message).toContain('document.querySelector is not a function');
      }
    }));
    it('should throw when frame is detached', SX(async function() {
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      let frame = page.frames()[1];
      let waitError = null;
      let waitPromise = frame.waitForSelector('.box').catch(e => waitError = e);
      await FrameUtils.detachFrame(page, 'frame1');
      await waitPromise;
      expect(waitError).toBeTruthy();
      expect(waitError.message).toContain('waitForSelector failed: frame got detached.');
    }));
    it('should survive navigation', SX(async function() {
      let boxFound = false;
      let waitForSelector = page.waitForSelector('.box').then(() => boxFound = true);
      await page.navigate(EMPTY_PAGE);
      expect(boxFound).toBe(false);
      await page.reload();
      expect(boxFound).toBe(false);
      await page.navigate(PREFIX + '/grid.html');
      await waitForSelector;
      expect(boxFound).toBe(true);
    }));
    it('should wait for visible', SX(async function() {
      let divFound = false;
      let waitForSelector = page.waitForSelector('div', {visible: true}).then(() => divFound = true);
      await page.setContent(`<div style='display: none;visibility: hidden'></div>`);
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('display'));
      expect(divFound).toBe(false);
      await page.evaluate(() => document.querySelector('div').style.removeProperty('visibility'));
      expect(await waitForSelector).toBe(true);
    }));
    it('should respect timeout', SX(async function() {
      let error = null;
      await page.waitForSelector('div', {timeout: 10}).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('waitForSelector failed: timeout');
    }));
  });

  describe('Page.waitFor', function() {
    it('should wait for selector', SX(async function() {
      let found = false;
      let waitFor = page.waitFor('div').then(() => found = true);
      await page.navigate(EMPTY_PAGE);
      expect(found).toBe(false);
      await page.navigate(PREFIX + '/grid.html');
      await waitFor;
      expect(found).toBe(true);
    }));
    it('should timeout', SX(async function() {
      startTime = Date.now();
      const timeout = 42;
      await page.waitFor(timeout);
      expect(Date.now() - startTime).not.toBeLessThan(timeout / 2);
    }));
    it('should throw when unknown type', SX(async function() {
      try {
        await page.waitFor({foo: 'bar'});
        fail('Failed to throw exception');
      } catch (e) {
        expect(e.message).toContain('Unsupported target type');
      }
    }));
  });

  describe('Page.Events.Console', function() {
    it('should work', SX(async function() {
      let commandArgs = [];
      page.once('console', (...args) => commandArgs = args);
      page.evaluate(() => console.log(5, 'hello', {foo: 'bar'}));
      await waitForEvents(page, 'console');
      expect(commandArgs).toEqual([5, 'hello', {foo: 'bar'}]);
    }));
    it('should work for different console API calls', SX(async function() {
      let messages = [];
      page.on('console', msg => messages.push(msg));
      page.evaluate(() => {
        // A pair of time/timeEnd generates only one Console API call.
        console.time('calling console.time');
        console.timeEnd('calling console.time');
        console.trace('calling console.trace');
        console.dir('calling console.dir');
        console.warn('calling console.warn');
        console.error('calling console.error');
      });
      // Wait for 5 events to hit.
      await waitForEvents(page, 'console', 5);
      expect(messages[0]).toContain('calling console.time');
      expect(messages.slice(1)).toEqual([
        'calling console.trace',
        'calling console.dir',
        'calling console.warn',
        'calling console.error',
      ]);
    }));
    it('should not fail for window object', SX(async function() {
      let windowObj = null;
      page.once('console', arg => windowObj = arg);
      page.evaluate(() => console.error(window));
      await waitForEvents(page, 'console');
      expect(windowObj).toBe('Window');
    }));
  });

  describe('Page.navigate', function() {
    it('should fail when navigating to bad url', SX(async function() {
      let error = null;
      try {
        await page.navigate('asdfasdf');
      } catch (e) {
        error = e;
      }
      expect(error.message).toContain('Cannot navigate to invalid URL');
    }));
    it('should fail when navigating to bad SSL', SX(async function() {
      let error = null;
      try {
        await page.navigate(HTTPS_PREFIX + '/empty.html');
      } catch (e) {
        error = e;
      }
      expect(error.message).toContain('SSL Certiciate error');
    }));
    it('should fail when exceeding maximum navigation timeout', SX(async function() {
      let error = null;
      // Hang for request to the empty.html
      server.setRoute('/empty.html', (req, res) => { });
      try {
        await page.navigate(PREFIX + '/empty.html', {timeout: 59});
      } catch (e) {
        error = e;
      }
      expect(error.message).toContain('Navigation Timeout Exceeded: 59ms');
    }));
    it('should work when navigating to valid url', SX(async function() {
      const response = await page.navigate(EMPTY_PAGE);
      expect(response.ok).toBe(true);
    }));
    it('should work when navigating to data url', SX(async function() {
      const response = await page.navigate('data:text/html,hello');
      expect(response.ok).toBe(true);
    }));
    it('should work when navigating to 404', SX(async function() {
      const response = await page.navigate(PREFIX + '/not-found');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    }));
    it('should return last response in redirect chain', SX(async function() {
      server.setRedirect('/redirect/1.html', '/redirect/2.html');
      server.setRedirect('/redirect/2.html', '/redirect/3.html');
      server.setRedirect('/redirect/3.html', EMPTY_PAGE);
      const response = await page.navigate(PREFIX + '/redirect/1.html');
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
      let initialFetchResourcesRequested = Promise.all([
        server.waitForRequest('/fetch-request-a.js'),
        server.waitForRequest('/fetch-request-b.js'),
        server.waitForRequest('/fetch-request-c.js'),
      ]);
      let secondFetchResourceRequested = server.waitForRequest('/fetch-request-d.js');

      // Navigate to a page which loads immediately and then does a bunch of
      // requests via javascript's fetch method.
      let navigationPromise = page.navigate(PREFIX + '/networkidle.html', {
        waitUntil: 'networkidle',
        networkIdleTimeout: 100,
        networkIdleInflight: 0, // Only be idle when there are 0 inflight requests
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
      for (let response of responses) {
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
      for (let response of responses) {
        response.statusCode = 404;
        response.end(`File not found`);
      }

      const response = await navigationPromise;
      // Expect navigation to succeed.
      expect(response.ok).toBe(true);
    }));
    it('should wait for websockets to succeed navigation', SX(async function() {
      let responses = [];
      // Hold on to the fetch request without answering.
      server.setRoute('/fetch-request.js', (req, res) => responses.push(res));
      let fetchResourceRequested = server.waitForRequest('/fetch-request.js');
      // Navigate to a page which loads immediately and then opens a bunch of
      // websocket connections and then a fetch request.
      let navigationPromise = page.navigate(PREFIX + '/websocket.html', {
        waitUntil: 'networkidle',
        networkIdleTimeout: 100,
        networkIdleInflight: 0, // Only be idle when there are 0 inflight requests/connections
      });
      // Track when the navigation gets completed.
      let navigationFinished = false;
      navigationPromise.then(() => navigationFinished = true);

      // Wait for the page's 'load' event.
      await new Promise(fulfill => page.once('load', fulfill));
      expect(navigationFinished).toBe(false);

      // Wait for the resource to be requested.
      await fetchResourceRequested;

      // Expect navigation still to be not finished.
      expect(navigationFinished).toBe(false);

      // Respond to the request.
      for (let response of responses) {
        response.statusCode = 404;
        response.end(`File not found`);
      }
      const response = await navigationPromise;
      // Expect navigation to succeed.
      expect(response.ok).toBe(true);
    }));
  });

  describe('Page.waitForNavigation', function() {
    it('should work', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      const result = page.waitForNavigation();
      page.evaluate(url => window.location.href = url, PREFIX + '/grid.html');
      const response = await result;
      expect(response.ok).toBe(true);
      expect(response.url).toContain('grid.html');
    }));
  });

  describe('Page.goBack', function() {
    it('should work', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      await page.navigate(PREFIX + '/grid.html');

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

  describe('Page.setInPageCallback', function() {
    it('should work', SX(async function() {
      await page.setInPageCallback('callController', function(a, b) {
        return a * b;
      });
      let result = await page.evaluate(async function() {
        return await callController(9, 4);
      });
      expect(result).toBe(36);
    }));
    it('should survive navigation', SX(async function() {
      await page.setInPageCallback('callController', function(a, b) {
        return a * b;
      });

      await page.navigate(EMPTY_PAGE);
      let result = await page.evaluate(async function() {
        return await callController(9, 4);
      });
      expect(result).toBe(36);
    }));
    it('should await returned promise', SX(async function() {
      await page.setInPageCallback('callController', function(a, b) {
        return Promise.resolve(a * b);
      });

      let result = await page.evaluate(async function() {
        return await callController(3, 5);
      });
      expect(result).toBe(15);
    }));
  });

  describe('Page.setRequestInterceptor', function() {
    it('should intercept', SX(async function() {
      page.setRequestInterceptor(request => {
        expect(request.url).toContain('empty.html');
        expect(request.headers.has('User-Agent')).toBeTruthy();
        expect(request.method).toBe('GET');
        expect(request.postData).toBe(undefined);
        request.continue();
      });
      const response = await page.navigate(EMPTY_PAGE);
      expect(response.ok).toBe(true);
    }));
    it('should show custom HTTP headers', SX(async function() {
      await page.setHTTPHeaders({
        foo: 'bar'
      });
      page.setRequestInterceptor(request => {
        expect(request.headers.get('foo')).toBe('bar');
        request.continue();
      });
      const response = await page.navigate(EMPTY_PAGE);
      expect(response.ok).toBe(true);
    }));
    it('should be abortable', SX(async function() {
      page.setRequestInterceptor(request => {
        if (request.url.endsWith('.css'))
          request.abort();
        else
          request.continue();
      });
      let failedRequests = 0;
      page.on('requestfailed', event => ++failedRequests);
      const response = await page.navigate(PREFIX + '/one-style.html');
      expect(response.ok).toBe(true);
      expect(failedRequests).toBe(1);
    }));
    it('should amend HTTP headers', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      page.setRequestInterceptor(request => {
        request.headers.set('foo', 'bar');
        request.continue();
      });
      let serverRequest = server.waitForRequest('/sleep.zzz');
      page.evaluate(() => {
        fetch('/sleep.zzz');
      });
      let request = await serverRequest;
      expect(request.headers['foo']).toBe('bar');
    }));
  });

  describe('Page.Events.Dialog', function() {
    it('should fire', function(done) {
      page.on('dialog', dialog => {
        expect(dialog.type).toBe('alert');
        expect(dialog.message()).toBe('yo');
        done();
      });
      page.evaluate(() => alert('yo'));
    });
    // TODO Enable this when crbug.com/718235 is fixed.
    xit('should allow accepting prompts', SX(async function(done) {
      page.on('dialog', dialog => {
        expect(dialog.type).toBe('prompt');
        expect(dialog.message()).toBe('question?');
        dialog.accept('answer!');
      });
      let result = await page.evaluate(() => prompt('question?'));
      expect(result).toBe('answer!');
    }));
  });

  describe('Page.Events.PageError', function() {
    it('should fire', function(done) {
      page.on('pageerror', error => {
        expect(error.message).toContain('Fancy');
        done();
      });
      page.navigate(PREFIX + '/error.html');
    });
  });

  describe('Page.Events.Request', function() {
    it('should fire', SX(async function(done) {
      let requests = [];
      page.on('request', request => requests.push(request));
      await page.navigate(EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toContain('empty.html');
    }));
  });

  describe('Frame Management', function() {
    let FrameUtils = require('./frame-utils');
    it('should handle nested frames', SX(async function() {
      await page.navigate(PREFIX + '/frames/nested-frames.html');
      expect(FrameUtils.dumpFrames(page.mainFrame())).toBeGolden('nested-frames.txt');
    }));
    it('should send events when frames are manipulated dynamically', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      // validate frameattached events
      let attachedFrames = [];
      page.on('frameattached', frame => attachedFrames.push(frame));
      await FrameUtils.attachFrame(page, 'frame1', './assets/frame.html');
      expect(attachedFrames.length).toBe(1);
      expect(attachedFrames[0].url()).toContain('/assets/frame.html');

      // validate framenavigated events
      let navigatedFrames = [];
      page.on('framenavigated', frame => navigatedFrames.push(frame));
      await FrameUtils.navigateFrame(page, 'frame1', './empty.html');
      expect(navigatedFrames.length).toBe(1);
      expect(navigatedFrames[0].url()).toContain('/empty.html');

      // validate framedetached events
      let detachedFrames = [];
      page.on('framedetached', frame => detachedFrames.push(frame));
      await FrameUtils.detachFrame(page, 'frame1');
      expect(detachedFrames.length).toBe(1);
      expect(detachedFrames[0].isDetached()).toBe(true);
    }));
    it('should persist mainFrame on cross-process navigation', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      let mainFrame = page.mainFrame();
      await page.navigate('http://127.0.0.1:' + PORT + '/empty.html');
      expect(page.mainFrame() === mainFrame).toBeTruthy();
    }));
    it('should not send attach/detach events for main frame', SX(async function() {
      let hasEvents = false;
      page.on('frameattached', frame => hasEvents = true);
      page.on('framedetached', frame => hasEvents = true);
      await page.navigate(EMPTY_PAGE);
      expect(hasEvents).toBe(false);
    }));
    it('should detach child frames on navigation', SX(async function() {
      let attachedFrames = [];
      let detachedFrames = [];
      let navigatedFrames = [];
      page.on('frameattached', frame => attachedFrames.push(frame));
      page.on('framedetached', frame => detachedFrames.push(frame));
      page.on('framenavigated', frame => navigatedFrames.push(frame));
      await page.navigate(PREFIX + '/frames/nested-frames.html');
      expect(attachedFrames.length).toBe(4);
      expect(detachedFrames.length).toBe(0);
      expect(navigatedFrames.length).toBe(5);

      attachedFrames = [];
      detachedFrames = [];
      navigatedFrames = [];
      await page.navigate(EMPTY_PAGE);
      expect(attachedFrames.length).toBe(0);
      expect(detachedFrames.length).toBe(4);
      expect(navigatedFrames.length).toBe(1);
    }));
  });

  describe('input', function() {
    it('should click the button', SX(async function() {
      await page.navigate(PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    }));
    it('should fail to click a missing button', SX(async function() {
      await page.navigate(PREFIX + '/input/button.html');
      try {
        await page.click('button.does-not-exist');
        fail('Clicking the button did not throw.');
      } catch (error) {
        expect(error.message).toBe('No node found for selector: button.does-not-exist');
      }
    }));
    it('should type into the textarea', SX(async function() {
      await page.navigate(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.type('Type in this text!');
      expect(await page.evaluate(() => result)).toBe('Type in this text!');
    }));
    it('should click the button after navigation ', SX(async function() {
      await page.navigate(PREFIX + '/input/button.html');
      await page.click('button');
      await page.navigate(PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    }));
    it('should upload the file', SX(async function(){
      await page.navigate(PREFIX + '/input/fileupload.html');
      await page.uploadFile('input', __dirname + '/assets/file-to-upload.txt');
      expect(await page.evaluate(() => {
        let input = document.querySelector('input');
        return input.files[0].name;
      })).toBe('file-to-upload.txt');
      expect(await page.evaluate(() => {
        let input = document.querySelector('input');
        let reader = new FileReader();
        let promise = new Promise(fulfill => reader.onload = fulfill);
        reader.readAsText(input.files[0]);
        return promise.then(() => reader.result);
      })).toBe('contents of the file');
    }));
    it('should move with the arrow keys', SX(async function(){
      await page.navigate(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      let keyboard = page.keyboard;
      await page.type('Hello World!');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('Hello World!');
      for (let i = 0; i < 'World!'.length; i++)
        page.press('ArrowLeft');
      await page.type('inserted ');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('Hello inserted World!');
      keyboard.down('Shift');
      for (let i = 0; i < 'inserted '.length; i++)
        page.press('ArrowLeft');
      keyboard.up('Shift');
      await page.press('Backspace');
      expect(await page.evaluate(() => document.querySelector('textarea').value)).toBe('Hello World!');
    }));
    it('should send a character with Page.press', SX(async function() {
      await page.navigate(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.press('a', {text: 'f'});
      expect(await page.$('textarea', t => t.value)).toBe('f');

      await page.evaluate(() => window.addEventListener('keydown', e => e.preventDefault(), true));

      await page.press('a', {text: 'y'});
      expect(await page.$('textarea', t => t.value)).toBe('f');
    }));
    it('should send a character with sendCharacter', SX(async function() {
      await page.navigate(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.keyboard.sendCharacter('嗨');
      expect(await page.$('textarea', t => t.value)).toBe('嗨');
      await page.evaluate(() => window.addEventListener('keydown', e => e.preventDefault(), true));
      await page.keyboard.sendCharacter('a');
      expect(await page.$('textarea', t => t.value)).toBe('嗨a');
    }));
    it('should report shiftKey', SX(async function(){
      await page.navigate(PREFIX + '/input/keyboard.html');
      let keyboard = page.keyboard;
      let codeForKey = {'Shift': 16, 'Alt': 18, 'Meta': 91, 'Control': 17};
      for (let modifierKey in codeForKey) {
        await keyboard.down(modifierKey);
        expect(await page.evaluate(() => getResult())).toBe('Keydown: ' + modifierKey + ' ' + codeForKey[modifierKey] + ' [' + modifierKey + ']');
        await keyboard.down('!');
        expect(await page.evaluate(() => getResult())).toBe('Keydown: ! 49 [' + modifierKey + ']');
        await keyboard.up('!');
        expect(await page.evaluate(() => getResult())).toBe('Keyup: ! 49 [' + modifierKey + ']');
        await keyboard.up(modifierKey);
        expect(await page.evaluate(() => getResult())).toBe('Keyup: ' + modifierKey + ' ' + codeForKey[modifierKey] + ' []');
      }
    }));
    it('should report multiple modifiers', SX(async function(){
      await page.navigate(PREFIX + '/input/keyboard.html');
      let keyboard = page.keyboard;
      await keyboard.down('Control');
      expect(await page.evaluate(() => getResult())).toBe('Keydown: Control 17 [Control]');
      await keyboard.down('Meta');
      expect(await page.evaluate(() => getResult())).toBe('Keydown: Meta 91 [Control Meta]');
      await keyboard.down(';');
      expect(await page.evaluate(() => getResult())).toBe('Keydown: ; 186 [Control Meta]');
      await keyboard.up(';');
      expect(await page.evaluate(() => getResult())).toBe('Keyup: ; 186 [Control Meta]');
      await keyboard.up('Control');
      expect(await page.evaluate(() => getResult())).toBe('Keyup: Control 17 [Meta]');
      await keyboard.up('Meta');
      expect(await page.evaluate(() => getResult())).toBe('Keyup: Meta 91 []');
    }));
    it('should send proper codes while typing', SX(async function(){
      await page.navigate(PREFIX + '/input/keyboard.html');
      await page.type('!');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: ! 49 []',
            'Keypress: ! 33 33 33 []',
            'Keyup: ! 49 []'].join('\n'));
      await page.type('^');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: ^ 54 []',
            'Keypress: ^ 94 94 94 []',
            'Keyup: ^ 54 []'].join('\n'));
    }));
    it('should send propery codes while typing with shift', SX(async function(){
      await page.navigate(PREFIX + '/input/keyboard.html');
      let keyboard = page.keyboard;
      await keyboard.down('Shift');
      await page.type('~');
      expect(await page.evaluate(() => getResult())).toBe(
          [ 'Keydown: Shift 16 [Shift]',
            'Keydown: ~ 192 [Shift]', // 192 is ` keyCode
            'Keypress: ~ 126 126 126 [Shift]', // 126 is ~ charCode
            'Keyup: ~ 192 [Shift]'].join('\n'));
      await keyboard.up('Shift');
    }));
    it('should not type canceled events', SX(async function(){
      await page.navigate(PREFIX + '/input/textarea.html');
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
      await page.type('Hello World!');
      expect(await page.evaluate(() => textarea.value)).toBe('He Wrd!');
    }));
    it('keyboard.modifiers()', SX(async function(){
      let keyboard = page.keyboard;
      expect(keyboard.modifiers().Shift).toBe(false);
      expect(keyboard.modifiers().Meta).toBe(false);
      expect(keyboard.modifiers().Alt).toBe(false);
      expect(keyboard.modifiers().Control).toBe(false);
      keyboard.down('Shift');
      expect(keyboard.modifiers().Shift).toBe(true);
      expect(keyboard.modifiers().Alt).toBe(false);
      keyboard.up('Shift');
      expect(keyboard.modifiers().Shift).toBe(false);
      expect(keyboard.modifiers().Alt).toBe(false);
    }));
    it('should resize the textarea', SX(async function(){
      await page.navigate(PREFIX + '/input/textarea.html');
      let {x, y, width, height} = await page.evaluate(dimensions);
      let mouse = page.mouse;
      await mouse.move(x + width - 4, y + height - 4);
      await mouse.down();
      await mouse.move(x + width + 100, y + height + 100);
      await mouse.up();
      let newDimensions = await page.evaluate(dimensions);
      expect(newDimensions.width).toBe(width + 104);
      expect(newDimensions.height).toBe(height + 104);
    }));
    it('should scroll and click the button', SX(async function(){
      await page.navigate(PREFIX + '/input/scrollable.html');
      await page.click('#button-5');
      expect(await page.$('#button-5', button => button.textContent)).toBe('clicked');
      await page.click('#button-80');
      expect(await page.$('#button-80', button => button.textContent)).toBe('clicked');
    }));
    it('should select the text with mouse', SX(async function(){
      await page.navigate(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      let text = 'This is the text that we are going to try to select. Let\'s see how it goes.';
      await page.type(text);
      await page.$('textarea', textarea => textarea.scrollTop = 0);
      let {x, y} = await page.evaluate(dimensions);
      await page.mouse.move(x + 2,y + 2);
      await page.mouse.down();
      await page.mouse.move(100,100);
      await page.mouse.up();
      expect(await page.evaluate(() => window.getSelection().toString())).toBe(text);
    }));
    it('should select the text by triple clicking', SX(async function(){
      await page.navigate(PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      let text = 'This is the text that we are going to try to select. Let\'s see how it goes.';
      await page.type(text);
      await page.click('textarea');
      await page.click('textarea', {clickCount: 2});
      await page.click('textarea', {clickCount: 3});
      expect(await page.evaluate(() => window.getSelection().toString())).toBe(text);
    }));
    it('should trigger hover state', SX(async function(){
      await page.navigate(PREFIX + '/input/scrollable.html');
      await page.hover('#button-6');
      expect(await page.$('button:hover', button => button.id)).toBe('button-6');
      await page.hover('#button-2');
      expect(await page.$('button:hover', button => button.id)).toBe('button-2');
      await page.hover('#button-91');
      expect(await page.$('button:hover', button => button.id)).toBe('button-91');
    }));
    it('should fire contextmenu event on right click', SX(async function(){
      await page.navigate(PREFIX + '/input/scrollable.html');
      await page.click('#button-8', {button: 'right'});
      expect(await page.$('#button-8', button => button.textContent)).toBe('context menu');
    }));
    it('should set modifier keys on click', SX(async function(){
      await page.navigate(PREFIX + '/input/scrollable.html');
      await page.$('#button-3', button => button.addEventListener('mousedown', e => window.lastEvent = e, true));
      let modifiers = {'Shift': 'shiftKey', 'Control': 'ctrlKey', 'Alt': 'altKey', 'Meta': 'metaKey'};
      for (let modifier in modifiers) {
        await page.keyboard.down(modifier);
        await page.click('#button-3');
        if (!(await page.evaluate(mod => window.lastEvent[mod], modifiers[modifier])))
          fail(modifiers[modifier] + ' should be true');
        await page.keyboard.up(modifier);
      }
      await page.click('#button-3');
      for (let modifier in modifiers) {
        if ((await page.evaluate(mod => window.lastEvent[mod], modifiers[modifier])))
          fail(modifiers[modifier] + ' should be false');
      }
    }));
    function dimensions() {
      let rect = document.querySelector('textarea').getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
  });

  // FIXME: remove this when crbug.com/741689 is fixed.
  it('RESTART BROWSER crbug.com/741689', SX(async function() {
    page.close();
    browser = new Browser({headless, args: ['--no-sandbox']});
    page = await browser.newPage();
  }));

  describe('Page.setUserAgent', function() {
    it('should work', SX(async function() {
      expect(page.userAgent()).toContain('Mozilla');
      page.setUserAgent('foobar');
      page.navigate(EMPTY_PAGE);
      let request = await server.waitForRequest('/empty.html');
      expect(request.headers['user-agent']).toBe('foobar');
    }));
    it('should emulate device user-agent', SX(async function() {
      await page.navigate(PREFIX + '/mobile.html');
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Chrome');
      await page.setUserAgent(iPhone.userAgent);
      expect(await page.evaluate(() => navigator.userAgent)).toContain('Safari');
    }));
  });
  describe('Page.setHTTPHeaders', function() {
    it('should work', SX(async function() {
      expect(page.httpHeaders()).toEqual({});
      page.setHTTPHeaders({'foo': 'bar'});
      expect(page.httpHeaders()).toEqual({'foo': 'bar'});
      page.navigate(EMPTY_PAGE);
      let request = await server.waitForRequest('/empty.html');
      expect(request.headers['foo']).toBe('bar');
    }));
  });
  describe('Page.setContent', function() {
    it('should work', SX(async function() {
      await page.setContent('<div>hello</div>');
      let result = await page.evaluate(() => document.body.innerHTML);
      expect(result).toBe('<div>hello</div>');
    }));
  });
  describe('Request implements Body', function() {
    it('should work', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      server.setRoute('/post', (req, res) => res.end());
      let request = null;
      page.on('request', r => request = r);
      await page.evaluate(() => fetch('./post', { method: 'POST', body: JSON.stringify({foo: 'bar'})}));
      expect(request).toBeTruthy();
      expect(request.bodyUsed).toBe(false);
      expect(await request.text()).toBe('{"foo":"bar"}');
      expect(await request.json()).toEqual({foo: 'bar'});
      expect(request.bodyUsed).toBe(true);
    }));
  });
  describe('Response implements Body', function() {
    it('should work', SX(async function() {
      let response = null;
      page.on('response', r => response = r);
      await page.navigate(PREFIX + '/simple.json');
      expect(response).toBeTruthy();
      expect(response.bodyUsed).toBe(false);
      expect(await response.text()).toBe('{"foo": "bar"}\n');
      expect(await response.json()).toEqual({foo: 'bar'});
      expect(response.bodyUsed).toBe(true);
    }));
  });
  describe('Network Events', function() {
    it('Page.Events.Request', SX(async function() {
      let requests = [];
      page.on('request', request => requests.push(request));
      await page.navigate(EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toBe(EMPTY_PAGE);
      expect(requests[0].method).toBe('GET');
      expect(requests[0].response()).toBeTruthy();
    }));
    it('Page.Events.Response', SX(async function() {
      let responses = [];
      page.on('response', response => responses.push(response));
      await page.navigate(EMPTY_PAGE);
      expect(responses.length).toBe(1);
      expect(responses[0].url).toBe(EMPTY_PAGE);
      expect(responses[0].status).toBe(200);
      expect(responses[0].ok).toBe(true);
      expect(responses[0].request()).toBeTruthy();
    }));
    it('Page.Events.RequestFailed', SX(async function() {
      page.setRequestInterceptor(request => {
        if (request.url.endsWith('css'))
          request.abort();
        else
          request.continue();
      });
      let failedRequests = [];
      page.on('requestfailed', request => failedRequests.push(request));
      await page.navigate(PREFIX + '/one-style.html');
      expect(failedRequests.length).toBe(1);
      expect(failedRequests[0].url).toContain('one-style.css');
      expect(failedRequests[0].response()).toBe(null);
    }));
    it('Page.Events.RequestFinished', SX(async function() {
      let requests = [];
      page.on('requestfinished', request => requests.push(request));
      await page.navigate(EMPTY_PAGE);
      expect(requests.length).toBe(1);
      expect(requests[0].url).toBe(EMPTY_PAGE);
      expect(requests[0].response()).toBeTruthy();
    }));
    it('should fire events in proper order', SX(async function() {
      let events = [];
      page.on('request', request => events.push('request'));
      page.on('response', response => events.push('response'));
      page.on('requestfinished', request => events.push('requestfinished'));
      await page.navigate(EMPTY_PAGE);
      expect(events).toEqual(['request', 'response', 'requestfinished']);
    }));
    it('should support redirects', SX(async function() {
      let events = [];
      page.on('request', request => events.push(`${request.method} ${request.url}`));
      page.on('response', response => events.push(`${response.status} ${response.url}`));
      page.on('requestfinished', request => events.push(`DONE ${request.url}`));
      page.on('requestfailed', request => events.push(`FAIL ${request.url}`));
      server.setRedirect('/foo.html', '/empty.html');
      const FOO_URL = PREFIX + '/foo.html';
      await page.navigate(FOO_URL);
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
    it('should work', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      await page.addScriptTag('/injectedfile.js');
      expect(await page.evaluate(() => __injected)).toBe(42);
    }));
  });

  describe('Page.url', function() {
    it('should work', SX(async function() {
      expect(page.url()).toBe('about:blank');
      await page.navigate(EMPTY_PAGE);
      expect(page.url()).toBe(EMPTY_PAGE);
    }));
  });

  describe('Page.viewport', function() {
    it('should get the proper viewport size', SX(async function() {
      expect(page.viewport()).toEqual({width: 400, height: 300});
      await page.setViewport({width: 123, height: 456});
      expect(page.viewport()).toEqual({width: 123, height: 456});
    }));
    it('should support mobile emulation', SX(async function() {
      await page.navigate(PREFIX + '/mobile.html');
      expect(await page.evaluate(() => window.innerWidth)).toBe(400);
      await page.setViewport(iPhone.viewport);
      expect(await page.evaluate(() => window.innerWidth)).toBe(375);
      await page.setViewport({width: 400, height: 300});
      expect(await page.evaluate(() => window.innerWidth)).toBe(400);
    }));
    it('should support touch emulation', SX(async function() {
      await page.navigate(PREFIX + '/mobile.html');
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(false);
      await page.setViewport(iPhone.viewport);
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(true);
      await page.setViewport({width: 100, height: 100});
      expect(await page.evaluate(() => 'ontouchstart' in window)).toBe(false);
    }));
    it('should support landscape emulation', SX(async function() {
      await page.navigate(PREFIX + '/mobile.html');
      expect(await page.evaluate(() => screen.orientation.type)).toBe('portrait-primary');
      await page.setViewport(iPhoneLandscape.viewport);
      expect(await page.evaluate(() => screen.orientation.type)).toBe('landscape-primary');
      await page.setViewport({width: 100, height: 100});
      expect(await page.evaluate(() => screen.orientation.type)).toBe('portrait-primary');
    }));
  });

  describe('Page.evaluateOnInitialized', function() {
    it('should evaluate before anything else on the page', SX(async function() {
      await page.evaluateOnInitialized(function(){
        window.injected = 123;
      });
      await page.navigate(PREFIX + '/tamperable.html');
      expect(await page.evaluate(() => window.result)).toBe(123);
    }));
  });

  describe('Page.pdf', function() {
    let outputFile = __dirname + '/assets/output.pdf';
    afterEach(function() {
      fs.unlinkSync(outputFile);
    });

    it('should print to pdf', SX(async function() {
      await page.navigate(PREFIX + '/grid.html');
      await page.pdf({path: outputFile});
      expect(fs.readFileSync(outputFile).byteLength).toBeGreaterThan(0);
    }));
  });

  describe('Page.plainText', function() {
    it('should return the page text', SX(async function(){
      await page.setContent('<div>the result text</div>');
      expect(await page.plainText()).toBe('the result text');
    }));
  });

  describe('Page.title', function() {
    it('should return the page title', SX(async function(){
      await page.navigate(PREFIX + '/input/button.html');
      expect(await page.title()).toBe('Button test');
    }));
  });

  describe('Query selector', function() {
    it('Page.$', SX(async function() {
      await page.navigate(PREFIX + '/playground.html');
      expect(await page.$('#first', element => element.textContent)).toBe('First div');
      expect(await page.$('#second span', element => element.textContent)).toBe('Inner span');
      expect(await page.$('#first', (element, arg1) => arg1, 'value1')).toBe('value1');
      expect(await page.$('#first', (element, arg1, arg2) => arg2, 'value1', 'value2')).toBe('value2');
      expect(await page.$('doesnot-exist', element => 5)).toBe(null);
      expect(await page.$('button', function(element, arg1) {
        element.textContent = arg1;
        return true;
      }, 'new button text')).toBe(true);
      expect(await page.$('button', function(element) {
        return element.textContent;
      })).toBe('new button text');
    }));

    it('Page.$$', SX(async function() {
      await page.navigate(PREFIX + '/playground.html');
      expect((await page.$$('div', element => element.textContent)).length).toBe(2);
      expect((await page.$$('div', (element, index) => index))[0]).toBe(0);
      expect((await page.$$('div', (element, index) => index))[1]).toBe(1);
      expect((await page.$$('doesnotexist', function(){})).length).toBe(0);
      expect((await page.$$('div', element => element.textContent))[0]).toBe('First div');
      expect((await page.$$('span', (element, index, arg1) => arg1, 'value1'))[0]).toBe('value1');
    }));
  });

  describe('Page.screenshot', function() {
    it('should work', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.navigate(PREFIX + '/grid.html');
      let screenshot = await page.screenshot();
      expect(screenshot).toBeGolden('screenshot-sanity.png');
    }));
    it('should clip rect', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.navigate(PREFIX + '/grid.html');
      let screenshot = await page.screenshot({
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
      await page.navigate(PREFIX + '/grid.html');
      let screenshot = await page.screenshot({
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
      await page.navigate(PREFIX + '/grid.html');
      let promises = [];
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
      let screenshots = await Promise.all(promises);
      expect(screenshots[1]).toBeGolden('grid-cell-1.png');
    }));
    it('should take fullPage screenshots', SX(async function() {
      await page.setViewport({width: 500, height: 500});
      await page.navigate(PREFIX + '/grid.html');
      let screenshot = await page.screenshot({
        fullPage: true
      });
      expect(screenshot).toBeGolden('screenshot-grid-fullpage.png');
    }));
    it('should run in parallel in multiple pages', SX(async function() {
      const N = 2;
      let pages = await Promise.all(Array(N).fill(0).map(async() => {
        let page = await browser.newPage();
        await page.navigate(PREFIX + '/grid.html');
        return page;
      }));
      let promises = [];
      for (let i = 0; i < N; ++i)
        promises.push(pages[i].screenshot({ clip: { x: 50 * i, y: 0, width: 50, height: 50 } }));
      let screenshots = await Promise.all(promises);
      for (let i = 0; i < N; ++i)
        expect(screenshots[i]).toBeGolden(`grid-cell-${i}.png`);
      await Promise.all(pages.map(page => page.close()));
    }));
  });
});

/**
 * @param {!EventEmitter} emitter
 * @param {string} eventName
 * @param {number=} eventCount
 * @return {!Promise}
 */
function waitForEvents(emitter, eventName, eventCount = 1) {
  let fulfill;
  let promise = new Promise(x => fulfill = x);
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

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
  return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
