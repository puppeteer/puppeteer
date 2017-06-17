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

var fs = require('fs');
var path = require('path');
var rm = require('rimraf').sync;
var Browser = require('../lib/Browser');
var StaticServer = require('./StaticServer');
var PNG = require('pngjs').PNG;
var mime = require('mime');
var pixelmatch = require('pixelmatch');
var Diff = require('text-diff');

var PORT = 8907;
var STATIC_PREFIX = 'http://localhost:' + PORT;
var EMPTY_PAGE = STATIC_PREFIX + '/empty.html';

var GOLDEN_DIR = path.join(__dirname, 'golden');
var OUTPUT_DIR = path.join(__dirname, 'output');
var PROJECT_DIR = path.join(__dirname, '..');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;

describe('Puppeteer', function() {
    var browser;
    var staticServer;
    var page;

    beforeAll(function() {
        browser = new Browser();
        staticServer = new StaticServer(path.join(__dirname, 'assets'), PORT);
        if (fs.existsSync(OUTPUT_DIR))
            rm(OUTPUT_DIR);
    });

    afterAll(function() {
        browser.close();
        staticServer.stop();
    });

    beforeEach(SX(async function() {
        page = await browser.newPage();
        jasmine.addMatchers(customMatchers);
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
            var result = await page.evaluate(async function() {
                return await callController(9, 3);
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
            expect(error.message).toContain('not is not defined');
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
            var result = await page.evaluate(async function() {
                return await callController(9, 4);
            });
            expect(result).toBe(36);
        }));
        it('should survive navigation', SX(async function() {
            await page.setInPageCallback('callController', function(a, b) {
                return a * b;
            });

            await page.navigate(EMPTY_PAGE);
            var result = await page.evaluate(async function() {
                return await callController(9, 4);
            });
            expect(result).toBe(36);
        }));
        it('should await returned promise', SX(async function() {
            await page.setInPageCallback('callController', function(a, b) {
                return Promise.resolve(a * b);
            });

            var result = await page.evaluate(async function() {
                return await callController(3, 5);
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

    describe('Page.Events.Error', function() {
        it('should fire', function(done) {
            page.on('error', error => {
                expect(error.message).toContain('Fancy');
                done();
            });
            page.navigate(STATIC_PREFIX + '/error.html');
        });
    });

    describe('Page.screenshot', function() {
        it('should work', SX(async function() {
            await page.setViewportSize({width: 500, height: 500});
            await page.navigate(STATIC_PREFIX + '/grid.html');
            var screenshot = await page.screenshot();
            expect(screenshot).toBeGolden('screenshot-sanity.png');
        }));
        it('should clip rect', SX(async function() {
            await page.setViewportSize({width: 500, height: 500});
            await page.navigate(STATIC_PREFIX + '/grid.html');
            var screenshot = await page.screenshot({
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
            var screenshot = await page.screenshot({
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
            var promises = [];
            for (var i = 0; i < 3; ++i) {
                promises.push(page.screenshot({
                    clip: {
                        x: 50 * i,
                        y: 0,
                        width: 50,
                        height: 50
                    }
                }));
            }
            var screenshot = await promises[1];
            expect(screenshot).toBeGolden('screenshot-parallel-calls.png');
        }));
        it('should take fullPage screenshots', SX(async function() {
            await page.setViewportSize({width: 500, height: 500});
            await page.navigate(STATIC_PREFIX + '/grid.html');
            var screenshot = await page.screenshot({
                fullPage: true
            });
            expect(screenshot).toBeGolden('screenshot-grid-fullpage.png');
        }));
    });

    describe('Frame Management', function() {
        var FrameUtils = require('./frame-utils');
        it('should handle nested frames', SX(async function() {
            await page.navigate(STATIC_PREFIX + '/frames/nested-frames.html');
            expect(FrameUtils.dumpFrames(page.mainFrame())).toBeGolden('nested-frames.txt');
        }));
        it('should send events when frames are manipulated dynamically', SX(async function() {
            await page.navigate(EMPTY_PAGE);
            // validate frameattached events
            var attachedFrames = [];
            page.on('frameattached', frame => attachedFrames.push(frame));
            await FrameUtils.attachFrame(page, 'frame1', './assets/frame.html');
            expect(attachedFrames.length).toBe(1);
            expect(attachedFrames[0].url()).toContain('/assets/frame.html');

            // validate framenavigated events
            var navigatedFrames = [];
            page.on('framenavigated', frame => navigatedFrames.push(frame));
            await FrameUtils.navigateFrame(page, 'frame1', './empty.html');
            expect(navigatedFrames.length).toBe(1);
            expect(navigatedFrames[0].url()).toContain('/empty.html');

            // validate framedetached events
            var detachedFrames = [];
            page.on('framedetached', frame => detachedFrames.push(frame));
            await FrameUtils.detachFrame(page, 'frame1');
            expect(detachedFrames.length).toBe(1);
            expect(detachedFrames[0].isDetached()).toBe(true);
        }));
        it('should persist mainFrame on cross-process navigation', SX(async function() {
            await page.navigate(EMPTY_PAGE);
            var mainFrame = page.mainFrame();
            await page.navigate('http://127.0.0.1:' + PORT + '/empty.html');
            expect(page.mainFrame() === mainFrame).toBeTruthy();
        }));
        it('should not send attach/detach events for main frame', SX(async function() {
            var hasEvents = false;
            page.on('frameattached', frame => hasEvents = true);
            page.on('framedetached', frame => hasEvents = true);
            await page.navigate(EMPTY_PAGE);
            expect(hasEvents).toBe(false);
        }));
        it('should detach child frames on navigation', SX(async function() {
            var attachedFrames = [];
            var detachedFrames = [];
            var navigatedFrames = [];
            page.on('frameattached', frame => attachedFrames.push(frame));
            page.on('framedetached', frame => detachedFrames.push(frame));
            page.on('framenavigated', frame => navigatedFrames.push(frame));
            await page.navigate(STATIC_PREFIX + '/frames/nested-frames.html');
            expect(attachedFrames.length).toBe(4);
            expect(detachedFrames.length).toBe(0);
            expect(navigatedFrames.length).toBe(5);

            var attachedFrames = [];
            var detachedFrames = [];
            var navigatedFrames = [];
            await page.navigate(EMPTY_PAGE);
            expect(attachedFrames.length).toBe(0);
            expect(detachedFrames.length).toBe(4);
            expect(navigatedFrames.length).toBe(1);
        }));
    });
});

var GoldenComparators = {
    'image/png': compareImages,
    'text/plain': compareText
};

/**
 * @param {?Object} actualBuffer
 * @param {!Buffer} expectedBuffer
 * @return {?{diff: (!Object:undefined), errorMessage: (string|undefined)}}
 */
function compareImages(actualBuffer, expectedBuffer) {
    if (!actualBuffer || !(actualBuffer instanceof Buffer))
        return { errorMessage: 'Actual result should be Buffer.' };

    var actual = PNG.sync.read(actualBuffer);
    var expected = PNG.sync.read(expectedBuffer);
    if (expected.width !== actual.width || expected.height !== actual.height) {
        return {
            errorMessage: `Sizes differ: expected image ${expected.width}px X ${expected.height}px, but got ${actual.width}px X ${actual.height}px. `
        };
    }
    var diff = new PNG({width: expected.width, height: expected.height});
    var count = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, {threshold: 0.1});
    return count > 0 ? { diff: PNG.sync.write(diff) } : null;
}

/**
 * @param {?Object} actual
 * @param {!Buffer} expectedBuffer
 * @return {?{diff: (!Object:undefined), errorMessage: (string|undefined)}}
 */
function compareText(actual, expectedBuffer) {
    if (typeof actual !== 'string')
        return { errorMessage: 'Actual result should be string' };
    var expected = expectedBuffer.toString('utf-8');
    if (expected === actual)
        return null;
    var diff = new Diff();
    var result = diff.main(expected, actual);
    diff.cleanupSemantic(result);
    var html = diff.prettyHtml(result);
    var diffStylePath = path.join(__dirname, 'diffstyle.css');
    html = `<link rel="stylesheet" href="file://${diffStylePath}">` + html;
    return {
        diff: html,
        diffExtension: '.html'
    };
}

var customMatchers = {
    toBeGolden: function(util, customEqualityTesters) {
        return {
            /**
             * @param {?Object} actual
             * @param {string} goldenName
             * @return {!{pass: boolean, message: (undefined|string)}}
             */
            compare: function(actual, goldenName) {
                var expectedPath = path.join(GOLDEN_DIR, goldenName);
                var actualPath = path.join(OUTPUT_DIR, goldenName);

                var messageSuffix = 'Output is saved in ' + path.relative(PROJECT_DIR, OUTPUT_DIR);

                if (!fs.existsSync(expectedPath)) {
                    ensureOutputDir();
                    fs.writeFileSync(actualPath, actual);
                    return {
                        pass: false,
                        message: goldenName + ' is missing in golden results. ' + messageSuffix
                    };
                }
                var expected = fs.readFileSync(expectedPath);
                var comparator = GoldenComparators[mime.lookup(goldenName)];
                if (!comparator) {
                    return {
                        pass: false,
                        message: 'Failed to find comparator with type ' + mime.lookup(goldenName) + ': '  + goldenName
                    };
                }
                var result = comparator(actual, expected);
                if (!result)
                    return { pass: true };
                ensureOutputDir();
                fs.writeFileSync(actualPath, actual);
                // Copy expected to the output/ folder for convenience.
                fs.writeFileSync(addSuffix(actualPath, '-expected'), expected);
                if (result.diff) {
                    var diffPath = addSuffix(actualPath, '-diff', result.diffExtension);
                    fs.writeFileSync(diffPath, result.diff);
                }

                var message = goldenName + ' mismatch!';
                if (result.errorMessage)
                    message += ' ' + result.errorMessage;
                return {
                    pass: false,
                    message: message + ' ' + messageSuffix
                };

                function ensureOutputDir() {
                    if (!fs.existsSync(OUTPUT_DIR))
                        fs.mkdirSync(OUTPUT_DIR);
                }
            }
        };
    },
};

/**
 * @param {string} filePath
 * @param {string} suffix
 * @param {string=} customExtension
 * @return {string}
 */
function addSuffix(filePath, suffix, customExtension) {
    var dirname = path.dirname(filePath);
    var ext = path.extname(filePath);
    var name = path.basename(filePath, ext);
    return path.join(dirname, name + suffix + (customExtension || ext));
}


// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
    return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
