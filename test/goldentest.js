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
var pixelmatch = require('pixelmatch');

var PORT = 8907;
var STATIC_PREFIX = 'http://localhost:' + PORT;
var GOLDEN_DIR = path.join(__dirname, 'golden');
var OUTPUT_DIR = path.join(__dirname, 'output');

describe('GoldenTests', function() {
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
    }));

    afterEach(function() {
        page.close();
    });

    imageTest('screenshot-sanity.png', async function() {
        await page.setViewportSize({width: 500, height: 500});
        await page.navigate(STATIC_PREFIX + '/grid.html');
        return page.screenshot('png');
    });

    imageTest('screenshot-clip-rect.png', async function() {
        await page.setViewportSize({width: 500, height: 500});
        await page.navigate(STATIC_PREFIX + '/grid.html');
        return page.screenshot('png', {
            x: 50,
            y: 100,
            width: 150,
            height: 100
        });
    });
});

/**
 * @param {string} fileName
 * @param {function():!Promise} runner
 */
function imageTest(fileName, runner) {
    var expectedPath = path.join(GOLDEN_DIR, fileName);
    var actualPath = path.join(OUTPUT_DIR, fileName);
    var expected = null;
    if (fs.existsSync(expectedPath)) {
        var buffer = fs.readFileSync(expectedPath);
        expected = PNG.sync.read(buffer);
    }
    it(fileName, SX(async function() {
        var imageBuffer = await runner();
        if (!imageBuffer || !(imageBuffer instanceof Buffer)) {
            fail(fileName + ' test did not return Buffer with image.');
            return;
        }
        var actual = PNG.sync.read(imageBuffer);
        if (!expected) {
            ensureOutputDir();
            fs.writeFileSync(addSuffix(actualPath, '-actual'), imageBuffer);
            fail(fileName + ' is missing in golden results.');
            return;
        }
        if (expected.width !== actual.width || expected.height !== actual.height) {
            ensureOutputDir();
            fs.writeFileSync(addSuffix(actualPath, '-actual'), imageBuffer);
            fail(`Sizes differ: expected image ${expected.width}px X ${expected.height}px, but got ${actual.width}px X ${actual.height}px`);
            return;
        }
        var diff = new PNG({width: expected.width, height: expected.height});
        var count = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, {threshold: 0.1});
        if (count > 0) {
            ensureOutputDir();
            fs.writeFileSync(addSuffix(actualPath, '-actual'), imageBuffer);
            fs.writeFileSync(addSuffix(actualPath, '-diff'), PNG.sync.write(diff));
            fail(fileName + ' mismatch!');
        }
    }));
}

function ensureOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR))
        fs.mkdirSync(OUTPUT_DIR);
}

/**
 * @param {string} filePath
 * @param {string} suffix
 * @return {string}
 */
function addSuffix(filePath, suffix) {
    var dirname = path.dirname(filePath);
    var ext = path.extname(filePath);
    var name = path.basename(filePath, ext);
    return path.join(dirname, name + suffix + ext);
}

// Since Jasmine doesn't like async functions, they should be wrapped
// in a SX function.
function SX(fun) {
    return done => Promise.resolve(fun()).then(done).catch(done.fail);
}
