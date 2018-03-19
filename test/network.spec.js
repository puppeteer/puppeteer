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

const {waitForEvents} = require('./utils');

module.exports.addTests = function({testRunner, expect}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

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
      await page.evaluate(async() => await window.activationPromise);
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
      const response = await page.goto(FOO_URL);
      expect(events).toEqual([
        `GET ${FOO_URL}`,
        `302 ${FOO_URL}`,
        `DONE ${FOO_URL}`,
        `GET ${server.EMPTY_PAGE}`,
        `200 ${server.EMPTY_PAGE}`,
        `DONE ${server.EMPTY_PAGE}`
      ]);

      // Check redirect chain
      const redirectChain = response.request().redirectChain();
      expect(redirectChain.length).toBe(1);
      expect(redirectChain[0].url()).toContain('/foo.html');
    });
  });
};
