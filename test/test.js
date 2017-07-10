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
let path = require('path');
let Browser = require('../lib/Browser');
let SimpleServer = require('./SimpleServer');
let GoldenUtils = require('./golden-utils');

let PORT = 8907;
let STATIC_PREFIX = 'http://localhost:' + PORT;
let EMPTY_PAGE = STATIC_PREFIX + '/empty.html';

if (process.env.DEBUG_TEST)
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 1000 * 1000;
else
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;

describe('Puppeteer', function() {
  let browser;
  let server;
  let page;

  beforeAll(SX(async function() {
    browser = new Browser({args: ['--no-sandbox']});
    server = await SimpleServer.create(path.join(__dirname, 'assets'), PORT);
    GoldenUtils.removeOutputDir();
  }));

  afterAll(SX(async function() {
    await server.stop();
    browser.close();
  }));

  beforeEach(SX(async function() {
    page = await browser.newPage();
    server.reset();
    GoldenUtils.addMatchers(jasmine);
  }));

  afterEach(function() {
    page.close();
  });

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
  });

  describe('Page.injectFile', function() {
    it('should work', SX(async function() {
      const helloPath = path.join(__dirname, './assets/injectedfile.js');
      await page.injectFile(helloPath);
      const result = await page.evaluate(() => __injected);
      expect(result).toBe(42);
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

  describe('Frame.waitFor', function() {
    let FrameUtils = require('./frame-utils');
    let addElement = tag => document.body.appendChild(document.createElement(tag));

    it('should immediately resolve promise if node exists', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      let frame = page.mainFrame();
      let added = false;
      await frame.waitFor('*').then(() => added = true);
      expect(added).toBe(true);

      added = false;
      await frame.evaluate(addElement, 'div');
      await frame.waitFor('div').then(() => added = true);
      expect(added).toBe(true);
    }));

    it('should resolve promise when node is added', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      let frame = page.mainFrame();
      let added = false;
      frame.waitFor('div').then(() => added = true);
      // run nop function..
      await frame.evaluate(() => 42);
      // .. to be sure that waitFor promise is not resolved yet.
      expect(added).toBe(false);
      await frame.evaluate(addElement, 'br');
      expect(added).toBe(false);
      await frame.evaluate(addElement, 'div');
      expect(added).toBe(true);
    }));

    it('Page.waitFor is shortcut for main frame', SX(async function() {
      await page.navigate(EMPTY_PAGE);
      await FrameUtils.attachFrame(page, 'frame1', EMPTY_PAGE);
      let otherFrame = page.frames()[1];
      let added = false;
      page.waitFor('div').then(() => added = true);
      await otherFrame.evaluate(addElement, 'div');
      expect(added).toBe(false);
      await page.evaluate(addElement, 'div');
      expect(added).toBe(true);
    }));
  });

  it('Page Events: ConsoleMessage', SX(async function() {
    let msgs = [];
    page.on('consolemessage', msg => msgs.push(msg));
    await page.evaluate(() => console.log('Message!'));
    expect(msgs).toEqual(['Message!']);
  }));

  describe('Page.navigate', function() {
    it('should fail when navigating to bad url', SX(async function() {
      let success = await page.navigate('asdfasdf');
      expect(success).toBe(false);
    }));
    it('should succeed when navigating to good url', SX(async function() {
      let success = await page.navigate(EMPTY_PAGE);
      expect(success).toBe(true);
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
      let navigationPromise = page.navigate(STATIC_PREFIX + '/networkidle.html', {
        waitFor: 'networkidle',
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

      let success = await navigationPromise;
      // Expect navigation to succeed.
      expect(success).toBe(true);
    }));
    it('should wait for websockets to succeed navigation', SX(async function() {
      let responses = [];
      // Hold on to the fetch request without answering.
      server.setRoute('/fetch-request.js', (req, res) => responses.push(res));
      let fetchResourceRequested = server.waitForRequest('/fetch-request.js');
      // Navigate to a page which loads immediately and then opens a bunch of
      // websocket connections and then a fetch request.
      let navigationPromise = page.navigate(STATIC_PREFIX + '/websocket.html', {
        waitFor: 'networkidle',
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
      let success = await navigationPromise;
      // Expect navigation to succeed.
      expect(success).toBe(true);
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
      let success = await page.navigate(EMPTY_PAGE);
      expect(success).toBe(true);
    }));
    it('should show custom HTTP headers', SX(async function() {
      await page.setHTTPHeaders({
        foo: 'bar'
      });
      page.setRequestInterceptor(request => {
        expect(request.headers.get('foo')).toBe('bar');
        request.continue();
      });
      let success = await page.navigate(EMPTY_PAGE);
      expect(success).toBe(true);
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
      let success = await page.navigate(STATIC_PREFIX + '/one-style.html');
      expect(success).toBe(true);
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
      page.navigate(STATIC_PREFIX + '/error.html');
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

  describe('Page.screenshot', function() {
    it('should work', SX(async function() {
      await page.setViewportSize({width: 500, height: 500});
      await page.navigate(STATIC_PREFIX + '/grid.html');
      let screenshot = await page.screenshot();
      expect(screenshot).toBeGolden('screenshot-sanity.png');
    }));
    it('should clip rect', SX(async function() {
      await page.setViewportSize({width: 500, height: 500});
      await page.navigate(STATIC_PREFIX + '/grid.html');
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
      await page.setViewportSize({width: 500, height: 500});
      await page.navigate(STATIC_PREFIX + '/grid.html');
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
      await page.setViewportSize({width: 500, height: 500});
      await page.navigate(STATIC_PREFIX + '/grid.html');
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
      let screenshot = await promises[1];
      expect(screenshot).toBeGolden('screenshot-parallel-calls.png');
    }));
    it('should take fullPage screenshots', SX(async function() {
      await page.setViewportSize({width: 500, height: 500});
      await page.navigate(STATIC_PREFIX + '/grid.html');
      let screenshot = await page.screenshot({
        fullPage: true
      });
      expect(screenshot).toBeGolden('screenshot-grid-fullpage.png');
    }));
  });

  describe('Frame Management', function() {
    let FrameUtils = require('./frame-utils');
    it('should handle nested frames', SX(async function() {
      await page.navigate(STATIC_PREFIX + '/frames/nested-frames.html');
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
      await page.navigate(STATIC_PREFIX + '/frames/nested-frames.html');
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
      await page.navigate(STATIC_PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    }));
    it('should fail to click a missing button', SX(async function() {
      await page.navigate(STATIC_PREFIX + '/input/button.html');
      try {
        await page.click('button.does-not-exist');
        fail('Clicking the button did not throw.');
      } catch (error) {
        expect(error.message).toBe('No node found for selector: button.does-not-exist');
      }
    }));
    it('should type into the textarea', SX(async function() {
      await page.navigate(STATIC_PREFIX + '/input/textarea.html');
      await page.focus('textarea');
      await page.type('Type in this text!');
      expect(await page.evaluate(() => result)).toBe('Type in this text!');
    }));
    it('should click the button after navigation ', SX(async function() {
      await page.navigate(STATIC_PREFIX + '/input/button.html');
      await page.click('button');
      await page.navigate(STATIC_PREFIX + '/input/button.html');
      await page.click('button');
      expect(await page.evaluate(() => result)).toBe('Clicked');
    }));
    it('should upload the file', SX(async function(){
      await page.navigate(STATIC_PREFIX + '/input/fileupload.html');
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
  });
  describe('Page.setUserAgent', function() {
    it('should work', SX(async function() {
      expect(page.userAgent()).toContain('Mozilla');
      page.setUserAgent('foobar');
      page.navigate(EMPTY_PAGE);
      let request = await server.waitForRequest('/empty.html');
      expect(request.headers['user-agent']).toBe('foobar');
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
      await page.navigate(STATIC_PREFIX + '/simple.json');
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
      await page.navigate(STATIC_PREFIX + '/one-style.html');
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
      const FOO_URL = STATIC_PREFIX + '/foo.html';
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
      expect(await page.url()).toBe('about:blank');
      await page.navigate(EMPTY_PAGE);
      expect(await page.url()).toBe(EMPTY_PAGE);
    }));
  });

  describe('Page.viewportSize', function() {
    it('should get the proper viewport size', SX(async function() {
      expect(page.viewportSize()).toEqual({width: 400, height: 300});
      await page.setViewportSize({width: 123, height: 456});
      expect(page.viewportSize()).toEqual({width: 123, height: 456});
    }));
  });

  describe('Page.evaluateOnInitialized', function() {
    it('should evaluate before anything else on the page', SX(async function() {
      await page.evaluateOnInitialized(function(){
        window.injected = 123;
      });
      await page.navigate(STATIC_PREFIX + '/tamperable.html');
      expect(await page.evaluate(() => window.result)).toBe(123);
    }));
  });

  describe('Page.printToPDF', function() {
    let outputFile = __dirname + '/assets/output.pdf';
    afterEach(function() {
      fs.unlinkSync(outputFile);
    });

    it('should print to pdf', SX(async function() {
      await page.navigate(STATIC_PREFIX + '/grid.html');
      await page.printToPDF(outputFile);
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
      await page.navigate(STATIC_PREFIX + '/input/button.html');
      expect(await page.title()).toBe('Button test');
    }));
  });
});

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
  return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
