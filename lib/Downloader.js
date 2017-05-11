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

var os = require('os');
var https = require('https');
var fs = require('fs');
var path = require('path');
var extract = require('extract-zip');
var util = require('util');

var CHROMIUM_PATH = path.join(__dirname, '..', '.local-chromium');

var downloadURLs = {
    linux: 'https://storage.googleapis.com/chromium-browser-snapshots/Linux_x64/%d/chrome-linux.zip',
    darwin: 'https://storage.googleapis.com/chromium-browser-snapshots/Mac/%d/chrome-mac.zip',
    win32: 'https://storage.googleapis.com/chromium-browser-snapshots/Win/%d/chrome-win32.zip',
    win64: 'https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/%d/chrome-win32.zip',
};

module.exports = {
    downloadChromium,
    executablePath,
};

/**
 * @param {string} revision
 * @param {?function(number, number)} progressCallback
 * @return {!Promise}
 */
async function downloadChromium(revision, progressCallback) {
    var url = null;
    var platform = os.platform();
    if (platform === 'darwin')
        url = downloadURLs.darwin;
    else if (platform === 'linux')
        url = downloadURLs.linux;
    else if (platform === 'win32')
        url = os.arch() === 'x64' ? downloadURLs.win64 : downloadURLs.win32;
    console.assert(url, `Unsupported platform: ${platform}`);
    url = util.format(url, revision);
    var zipPath = path.join(CHROMIUM_PATH, `download-${revision}.zip`);
    var folderPath = path.join(CHROMIUM_PATH, revision);
    if (fs.existsSync(folderPath))
        return;
    try {
        if (!fs.existsSync(CHROMIUM_PATH))
            fs.mkdirSync(CHROMIUM_PATH);
        await downloadFile(url, zipPath, progressCallback);
        await extractZip(zipPath, folderPath);
    } finally {
        if (fs.existsSync(zipPath))
            fs.unlinkSync(zipPath);
    }
}

/**
 * @return {string}
 */
function executablePath(revision) {
    var platform = os.platform();
    if (platform === 'darwin')
        return path.join(CHROMIUM_PATH, revision, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
    if (platform === 'linux')
        return path.join(CHROMIUM_PATH, revision, 'chrome-linux', 'chrome');
    if (platform === 'win32')
        return path.join(CHROMIUM_PATH, revision, 'chrome-win32', 'chrome.exe');
    throw new Error(`Unsupported platform: ${platform}`);
}

/**
 * @param {string} url
 * @param {string} destinationPath
 * @param {?function(number, number)} progressCallback
 * @return {!Promise}
 */
function downloadFile(url, destinationPath, progressCallback) {
    var fulfill, reject;
    var promise = new Promise((x, y) => { fulfill = x; reject = y; });
    var request = https.get(url, response => {
        if (response.statusCode !== 200) {
            var error = new Error(`Download failed: server returned code ${response.statusCode}. URL: ${url}`);
            // consume response data to free up memory
            response.resume();
            reject(error);
            return;
        }
        var file = fs.createWriteStream(destinationPath);
        file.on('finish', () => fulfill());
        file.on('error', error => reject(error));
        response.pipe(file);
        var totalBytes = parseInt(response.headers['content-length'], 10);
        if (progressCallback)
            response.on('data', onData.bind(null, totalBytes));
    });
    request.on('error', error => reject(error));
    return promise;

    function onData(totalBytes, chunk) {
        progressCallback(totalBytes, chunk.length);
    }
}

/**
 * @param {string} zipPath
 * @param {string} folderPath
 * @return {!Promise<?Error>}
 */
function extractZip(zipPath, folderPath) {
    return new Promise(fulfill => extract(zipPath, {dir: folderPath}, fulfill));
}
