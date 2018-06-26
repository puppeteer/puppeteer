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
const path = require('path');
const utils = require('./utils');
const {waitEvent} = require('./utils');

module.exports.addTests = function({testRunner, expect, puppeteer, DeviceDescriptors, headless}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;
  const iPhone = DeviceDescriptors['iPhone 6'];
  const iPhoneLandscape = DeviceDescriptors['iPhone 6 landscape'];

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
    it('should run beforeunload if asked for', async({browser, server}) => {
      const newPage = await browser.newPage();
      await newPage.goto(server.PREFIX + '/beforeunload.html');
      // We have to interact with a page so that 'beforeunload' handlers
      // fire.
      await newPage.click('body');
      newPage.close({ runBeforeUnload: true });
      const dialog = await waitEvent(newPage, 'dialog');
      expect(dialog.type()).toBe('beforeunload');
      expect(dialog.defaultValue()).toBe('');
      expect(dialog.message()).toBe('');
      dialog.accept();
      await waitEvent(newPage, 'close');
    });
    it('should set the page close state', async({ browser }) => {
      const newPage = await browser.newPage();
      expect(newPage.isClosed()).toBe(false);
      await newPage.close();
      expect(newPage.isClosed()).toBe(true);
    });
  });

  describe('Page.Events.error', function() {
    it('should throw when page crashes', async({page}) => {
      let error = null;
      page.on('error', err => error = err);
      page.goto('chrome://crash').catch(e => {});
      await waitEvent(page, 'error');
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
    it('should support thrown strings as error messages', async({page, server}) => {
      let error = null;
      await page.evaluate(() => { throw 'qwerty'; }).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('qwerty');
    });
    it('should support thrown numbers as error messages', async({page, server}) => {
      let error = null;
      await page.evaluate(() => { throw 100500; }).catch(e => error = e);
      expect(error).toBeTruthy();
      expect(error.message).toContain('100500');
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
    it('should return undefined for non-serializable objects', async({page, server}) => {
      expect(await page.evaluate(() => window)).toBe(undefined);
      expect(await page.evaluate(() => [Symbol('foo4')])).toBe(undefined);
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
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
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
    it('should simulate a user gesture', async({page, server}) => {
      await page.evaluate(playAudio);
      // also test evaluating strings
      await page.evaluate(`(${playAudio})()`);

      function playAudio() {
        const audio = document.createElement('audio');
        audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        // This returns a promise which throws if it was not triggered by a user gesture.
        return audio.play();
      }
    });
    it('should throw a nice error after a navigation', async({page, server}) => {
      const executionContext = await page.mainFrame().executionContext();

      await Promise.all([
        page.waitForNavigation(),
        executionContext.evaluate(() => window.location.reload())
      ]);
      const error = await executionContext.evaluate(() => null).catch(e => e);
      expect(error.message).toContain('navigation');
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
        waitEvent(page, 'console')
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
      // All console events will be reported before `page.evaluate` is finished.
      await page.evaluate(() => {
        // A pair of time/timeEnd generates only one Console API call.
        console.time('calling console.time');
        console.timeEnd('calling console.time');
        console.trace('calling console.trace');
        console.dir('calling console.dir');
        console.warn('calling console.warn');
        console.error('calling console.error');
        console.log(Promise.resolve('should not wait until resolved!'));
      });
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
        waitEvent(page, 'console')
      ]);
      expect(message.text()).toBe('JSHandle@object');
    });
    it('should trigger correct Log', async({page, server}) => {
      await page.goto('about:blank');
      const [message] = await Promise.all([
        waitEvent(page, 'console'),
        page.evaluate(async url => fetch(url).catch(e => {}), server.EMPTY_PAGE)
      ]);
      expect(message.text()).toContain('No \'Access-Control-Allow-Origin\'');
      expect(message.type()).toEqual('error');
    });
  });

  describe('Page.Events.DOMContentLoaded', function() {
    it('should fire when expected', async({page, server}) => {
      page.goto('about:blank');
      await waitEvent(page, 'domcontentloaded');
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
    it('should return response when page changes its URL after load', async({page, server}) => {
      const response = await page.goto(server.PREFIX + '/historyapi.html');
      expect(response.status()).toBe(200);
    });
    it('should work with subframes return 204', async({page, server}) => {
      server.setRoute('/frames/frame.html', (req, res) => {
        res.statusCode = 204;
        res.end();
      });
      await page.goto(server.PREFIX + '/frames/one-frame.html');
    });
    it('should fail when server returns 204', async({page, server}) => {
      server.setRoute('/empty.html', (req, res) => {
        res.statusCode = 204;
        res.end();
      });
      let error = null;
      await page.goto(server.EMPTY_PAGE).catch(e => error = e);
      expect(error).not.toBe(null);
      expect(error.message).toContain('net::ERR_ABORTED');
    });
    it('should navigate to empty page with domcontentloaded', async({page, server}) => {
      const response = await page.goto(server.EMPTY_PAGE, {waitUntil: 'domcontentloaded'});
      expect(response.status()).toBe(200);
      expect(response.securityDetails()).toBe(null);
    });
    xit('should work when page calls history API in beforeunload', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        window.addEventListener('beforeunload', () => history.replaceState(null, 'initial', window.location.href), false);
      });
      const response = await page.goto(server.PREFIX + '/grid.html');
      expect(response.status()).toBe(200);
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
    it('should fail when navigating and show the url at the error message', async function({page, server, httpsServer}) {
      const url = httpsServer.PREFIX + '/redirect/1.html';
      let error = null;
      try {
        await page.goto(url);
      } catch (e) {
        error = e;
      }
      expect(error.message).toContain(url);
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
    it('should work with clicking on anchor links', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`<a href='#foobar'>foobar</a>`);
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.click('a'),
      ]);
      expect(response).toBe(null);
      expect(page.url()).toBe(server.EMPTY_PAGE + '#foobar');
    });
    it('should work with history.pushState()', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`
        <a onclick='javascript:pushState()'>SPA</a>
        <script>
          function pushState() { history.pushState({}, '', 'wow.html') }
        </script>
      `);
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.click('a'),
      ]);
      expect(response).toBe(null);
      expect(page.url()).toBe(server.PREFIX + '/wow.html');
    });
    it('should work with history.replaceState()', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`
        <a onclick='javascript:replaceState()'>SPA</a>
        <script>
          function replaceState() { history.replaceState({}, '', '/replaced.html') }
        </script>
      `);
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.click('a'),
      ]);
      expect(response).toBe(null);
      expect(page.url()).toBe(server.PREFIX + '/replaced.html');
    });
    it('should work with DOM history.back()/history.forward()', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.setContent(`
        <a id=back onclick='javascript:goBack()'>back</a>
        <a id=forward onclick='javascript:goForward()'>forward</a>
        <script>
          function goBack() { history.back(); }
          function goForward() { history.forward(); }
          history.pushState({}, '', '/first.html');
          history.pushState({}, '', '/second.html');
        </script>
      `);
      expect(page.url()).toBe(server.PREFIX + '/second.html');
      const [backResponse] = await Promise.all([
        page.waitForNavigation(),
        page.click('a#back'),
      ]);
      expect(backResponse).toBe(null);
      expect(page.url()).toBe(server.PREFIX + '/first.html');
      const [forwardResponse] = await Promise.all([
        page.waitForNavigation(),
        page.click('a#forward'),
      ]);
      expect(forwardResponse).toBe(null);
      expect(page.url()).toBe(server.PREFIX + '/second.html');
    });
    it('should work when subframe issues window.stop()', async({page, server}) => {
      server.setRoute('/frames/style.css', (req, res) => {});
      const navigationPromise = page.goto(server.PREFIX + '/frames/one-frame.html');
      const frame = await utils.waitEvent(page, 'frameattached');
      await new Promise(fulfill => {
        page.on('framenavigated', f => {
          if (f === frame)
            fulfill();
        });
      });
      frame.evaluate(() => window.stop());
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
    it('should work with HistoryAPI', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        history.pushState({}, '', '/first.html');
        history.pushState({}, '', '/second.html');
      });
      expect(page.url()).toBe(server.PREFIX + '/second.html');

      await page.goBack();
      expect(page.url()).toBe(server.PREFIX + '/first.html');
      await page.goBack();
      expect(page.url()).toBe(server.EMPTY_PAGE);
      await page.goForward();
      expect(page.url()).toBe(server.PREFIX + '/first.html');
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
        waitEvent(page, 'pageerror')
      ]);
      expect(error.message).toContain('Fancy');
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

  describe('Page.setBypassCSP', function() {
    it('should bypass CSP meta tag', async({page, server}) => {
      // Make sure CSP prohibits addScriptTag.
      await page.goto(server.PREFIX + '/csp.html');
      await page.addScriptTag({content: 'window.__injected = 42;'}).catch(e => void e);
      expect(await page.evaluate(() => window.__injected)).toBe(undefined);

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();
      await page.addScriptTag({content: 'window.__injected = 42;'});
      expect(await page.evaluate(() => window.__injected)).toBe(42);
    });

    it('should bypass CSP header', async({page, server}) => {
      // Make sure CSP prohibits addScriptTag.
      server.setCSP('/empty.html', 'default-src "self"');
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({content: 'window.__injected = 42;'}).catch(e => void e);
      expect(await page.evaluate(() => window.__injected)).toBe(undefined);

      // By-pass CSP and try one more time.
      await page.setBypassCSP(true);
      await page.reload();
      await page.addScriptTag({content: 'window.__injected = 42;'});
      expect(await page.evaluate(() => window.__injected)).toBe(42);
    });

    it('should bypass after cross-process navigation', async({page, server}) => {
      await page.setBypassCSP(true);
      await page.goto(server.PREFIX + '/csp.html');
      await page.addScriptTag({content: 'window.__injected = 42;'});
      expect(await page.evaluate(() => window.__injected)).toBe(42);

      await page.goto(server.CROSS_PROCESS_PREFIX + '/csp.html');
      await page.addScriptTag({content: 'window.__injected = 42;'});
      expect(await page.evaluate(() => window.__injected)).toBe(42);
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

    it('should work with a url and type=module', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({ url: '/es6/es6import.js', type: 'module' });
      expect(await page.evaluate(() => __es6injected)).toBe(42);
    });

    it('should work with a path and type=module', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({ path: path.join(__dirname, 'assets/es6/es6pathimport.js'), type: 'module' });
      await page.waitForFunction('window.__es6injected');
      expect(await page.evaluate(() => __es6injected)).toBe(42);
    });

    it('should work with a content and type=module', async({page, server}) => {
      await page.goto(server.EMPTY_PAGE);
      await page.addScriptTag({ content: `import num from '/es6/es6module.js';window.__es6injected = num;`, type: 'module' });
      await page.waitForFunction('window.__es6injected');
      expect(await page.evaluate(() => __es6injected)).toBe(42);
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

    it('should throw when added with content to the CSP page', async({page, server}) => {
      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page.addScriptTag({ content: 'window.__injected = 35;' }).catch(e => error = e);
      expect(error).toBeTruthy();
    });

    it('should throw when added with URL to the CSP page', async({page, server}) => {
      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page.addScriptTag({ url: server.CROSS_PROCESS_PREFIX + '/injectedfile.js' }).catch(e => error = e);
      expect(error).toBeTruthy();
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

    it('should throw when added with content to the CSP page', async({page, server}) => {
      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page.addStyleTag({ content: 'body { background-color: green; }' }).catch(e => error = e);
      expect(error).toBeTruthy();
    });

    it('should throw when added with URL to the CSP page', async({page, server}) => {
      await page.goto(server.PREFIX + '/csp.html');
      let error = null;
      await page.addStyleTag({ url: server.CROSS_PROCESS_PREFIX + '/injectedstyle.css' }).catch(e => error = e);
      expect(error).toBeTruthy();
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
    it('should work with CSP', async({page, server}) => {
      server.setCSP('/empty.html', 'script-src ' + server.PREFIX);
      await page.evaluateOnNewDocument(function(){
        window.injected = 123;
      });
      await page.goto(server.PREFIX + '/empty.html');
      expect(await page.evaluate(() => window.injected)).toBe(123);

      // Make sure CSP works.
      await page.addScriptTag({content: 'window.e = 10;'}).catch(e => void e);
      expect(await page.evaluate(() => window.e)).toBe(undefined);
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
    it('should return base64', async({page, server}) => {
      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');
      const screenshot = await page.screenshot({
        encoding: 'base64'
      });
      expect(Buffer.from(screenshot, 'base64')).toBeGolden('screenshot-sanity.png');
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

  describe('Page.Events.Close', function() {
    it('should work with window.close', async function({ page, browser, server }) {
      const newPagePromise = new Promise(fulfill => browser.once('targetcreated', target => fulfill(target.page())));
      await page.evaluate(() => window['newPage'] = window.open('about:blank'));
      const newPage = await newPagePromise;
      const closedPromise = new Promise(x => newPage.on('close', x));
      await page.evaluate(() => window['newPage'].close());
      await closedPromise;
    });
    it('should work with page.close', async function({ page, browser, server }) {
      const newPage = await browser.newPage();
      const closedPromise = new Promise(x => newPage.on('close', x));
      await newPage.close();
      await closedPromise;
    });
  });

  describe('Page.browser', function() {
    it('should return the correct browser instance', async function({ page, browser }) {
      expect(page.browser()).toBe(browser);
    });
  });
};
