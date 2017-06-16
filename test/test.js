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

var path = require('path');
var Browser = require('../lib/Browser');
var StaticServer = require('./StaticServer');

var PORT = 8907;
var STATIC_PREFIX = 'http://localhost:' + PORT;
var EMPTY_PAGE = STATIC_PREFIX + '/empty.html';

describe('Puppeteer', function() {
    var browser;
    var staticServer;
    var page;

    beforeAll(function() {
        browser = new Browser();
        staticServer = new StaticServer(path.join(__dirname, 'assets'), PORT);
    });

    afterAll(function() {
        browser.close();
        staticServer.stop();
    });

    beforeEach(SX(async function() {
        page = await browser.newPage();
    }));

    afterEach(function() {
        page.close();
    });

    describe('Page.evaluate', function() {
        it('should work', SX(async function() {
            var result = await page.evaluate(() => 7 * 3);
            expect(result).toBe(21);
        }));
        it('should await promise', SX(async function() {
            var result = await page.evaluate(() => Promise.resolve(8 * 7));
            expect(result).toBe(56);
        }));
        it('should work from-inside inPageCallback', SX(async function() {
            // Setup inpage callback, which calls Page.evaluate
            await page.setInPageCallback('callController', async function(a, b) {
                return await page.evaluate((a, b) => a * b, a, b);
            });
            var result = await page.evaluate(function() {
                return callController(9, 3);
            });
            expect(result).toBe(27);
        }));
        it('should reject promise with exception', SX(async function() {
            var error = null;
            try {
                await page.evaluate(() => not.existing.object.property);
            } catch (e) {
                error = e;
            }
            expect(error).toBeTruthy();
            expect(error.message).toContain('ReferenceError');
        }));
    });

    it('Page Events: ConsoleMessage', SX(async function() {
        var msgs = [];
        page.on('consolemessage', msg => msgs.push(msg));
        await page.evaluate(() => console.log('Message!'));
        expect(msgs).toEqual(['Message!']);
    }));

    describe('Page.navigate', function() {
        it('should fail when navigating to bad url', SX(async function() {
            var success = await page.navigate('asdfasdf');
            expect(success).toBe(false);
        }));
        it('should succeed when navigating to good url', SX(async function() {
            var success = await page.navigate(EMPTY_PAGE);
            expect(success).toBe(true);
        }));
    });

    describe('Page.setInPageCallback', function() {
        it('should work', SX(async function() {
            await page.setInPageCallback('callController', function(a, b) {
                return a * b;
            });

            var result = await page.evaluate(function() {
                return callController(9, 4);
            });
            expect(result).toBe(36);
        }));
        it('should survive navigation', SX(async function() {
            await page.setInPageCallback('callController', function(a, b) {
                return a * b;
            });

            await page.navigate(EMPTY_PAGE);
            var result = await page.evaluate(function() {
                return callController(9, 4);
            });
            expect(result).toBe(36);
        }));
        it('should await returned promise', SX(async function() {
            await page.setInPageCallback('callController', function(a, b) {
                return Promise.resolve(a * b);
            });

            var result = await page.evaluate(function() {
                return callController(3, 5);
            });
            expect(result).toBe(15);
        }));
    });

    describe('Page.setRequestInterceptor', function() {
        it('should intercept', SX(async function() {
            page.setRequestInterceptor(request => {
                expect(request.url()).toContain('empty.html');
                expect(request.headers()['User-Agent']).toBeTruthy();
                expect(request.method()).toBe('GET');
                expect(request.postData()).toBe(undefined);
                request.continue();
            });
            var success = await page.navigate(EMPTY_PAGE);
            expect(success).toBe(true);
        }));
        it('should show extraHTTPHeaders', SX(async function() {
            await page.setExtraHTTPHeaders({
                foo: 'bar'
            });
            page.setRequestInterceptor(request => {
                expect(request.headers()['foo']).toBe('bar');
                request.continue();
            });
            var success = await page.navigate(EMPTY_PAGE);
            expect(success).toBe(true);
        }));
        it('should be abortable', SX(async function() {
            page.setRequestInterceptor(request => {
                if (request.url().endsWith('.css'))
                    request.abort();
                else
                    request.continue();
            });
            var failedResources = 0;
            page.on('resourceloadingfailed', event => ++failedResources);
            var success = await page.navigate(STATIC_PREFIX + '/one-style.html');
            expect(success).toBe(true);
            expect(failedResources).toBe(1);
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
            var result = await page.evaluate(() => prompt('question?'));
            expect(result).toBe('answer!');
        }));
    });
});

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
    return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
