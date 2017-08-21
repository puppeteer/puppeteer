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

const os = require('os');
const https = require('https');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const util = require('util');
const URL = require('url');
const removeRecursive = require('rimraf');

const DOWNLOADS_FOLDER = path.join(__dirname, '..', '.local-chromium');

const downloadURLs = {
  linux: 'https://storage.googleapis.com/chromium-browser-snapshots/Linux_x64/%d/chrome-linux.zip',
  mac: 'https://storage.googleapis.com/chromium-browser-snapshots/Mac/%d/chrome-mac.zip',
  win32: 'https://storage.googleapis.com/chromium-browser-snapshots/Win/%d/chrome-win32.zip',
  win64: 'https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/%d/chrome-win32.zip',
};

module.exports = {
  /**
   * @return {!Array<string>}
   */
  supportedPlatforms: function() {
    return Object.keys(downloadURLs);
  },

  /**
   * @return {string}
   */
  currentPlatform: function() {
    const platform = os.platform();
    if (platform === 'darwin')
      return 'mac';
    if (platform === 'linux')
      return 'linux';
    if (platform === 'win32')
      return os.arch() === 'x64' ? 'win64' : 'win32';
    return '';
  },

  /**
   * @param {string} platform
   * @param {string} revision
   * @return {!Promise<boolean>}
   */
  canDownloadRevision: function(platform, revision) {
    console.assert(downloadURLs[platform], 'Unknown platform: ' + platform);
    const url = URL.parse(util.format(downloadURLs[platform], revision));
    const options = {
      method: 'HEAD',
      host: url.host,
      path: url.pathname,
    };
    let resolve;
    const promise = new Promise(x => resolve = x);
    const request = https.request(options, response => {
      resolve(response.statusCode === 200);
    });
    request.on('error', error => {
      console.error(error);
      resolve(false);
    });
    request.end();
    return promise;
  },

  /**
   * @param {string} platform
   * @param {string} revision
   * @param {?function(number, number)} progressCallback
   * @return {!Promise}
   */
  downloadRevision: async function(platform, revision, progressCallback) {
    let url = downloadURLs[platform];
    console.assert(url, `Unsupported platform: ${platform}`);
    url = util.format(url, revision);
    const zipPath = path.join(DOWNLOADS_FOLDER, `download-${platform}-${revision}.zip`);
    const folderPath = getFolderPath(platform, revision);
    if (fs.existsSync(folderPath))
      return;
    try {
      if (!fs.existsSync(DOWNLOADS_FOLDER))
        fs.mkdirSync(DOWNLOADS_FOLDER);
      await downloadFile(url, zipPath, progressCallback);
      await extractZip(zipPath, folderPath);
    } finally {
      if (fs.existsSync(zipPath))
        fs.unlinkSync(zipPath);
    }
  },

  /**
   * @return {!Array<!{platform:string, revision: string}>}
   */
  downloadedRevisions: function() {
    if (!fs.existsSync(DOWNLOADS_FOLDER))
      return [];
    const fileNames = fs.readdirSync(DOWNLOADS_FOLDER);
    return fileNames.map(fileName => parseFolderPath(fileName)).filter(revision => !!revision);
  },

  /**
   * @param {string} platform
   * @param {string} revision
   */
  removeRevision: async function(platform, revision) {
    console.assert(downloadURLs[platform], `Unsupported platform: ${platform}`);
    const folderPath = getFolderPath(platform, revision);
    console.assert(fs.existsSync(folderPath));
    await new Promise(fulfill => removeRecursive(folderPath, fulfill));
  },

  /**
   * @param {string} platform
   * @param {string} revision
   * @return {?{executablePath: string}}
   */
  revisionInfo: function(platform, revision) {
    console.assert(downloadURLs[platform], `Unsupported platform: ${platform}`);
    const folderPath = getFolderPath(platform, revision);
    if (!fs.existsSync(folderPath))
      return null;
    let executablePath = '';
    if (platform === 'mac')
      executablePath = path.join(folderPath, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
    else if (platform === 'linux')
      executablePath = path.join(folderPath, 'chrome-linux', 'chrome');
    else if (platform === 'win32' || platform === 'win64')
      executablePath = path.join(folderPath, 'chrome-win32', 'chrome.exe');
    else
      throw 'Unsupported platfrom: ' + platfrom;
    return {
      executablePath: executablePath
    };
  },
};

/**
 * @param {string} platform
 * @param {string} revision
 * @return {string}
 */
function getFolderPath(platform, revision) {
  return path.join(DOWNLOADS_FOLDER, platform + '-' + revision);
}

/**
 * @param {string} folderPath
 * @return {?{platform: string, revision: string}}
 */
function parseFolderPath(folderPath) {
  const name = path.basename(folderPath);
  const splits = name.split('-');
  if (splits.length !== 2)
    return null;
  const [platform, revision] = splits;
  if (!downloadURLs[platform])
    return null;
  return {platform, revision};
}

/**
 * @param {string} url
 * @param {string} destinationPath
 * @param {?function(number, number)} progressCallback
 * @return {!Promise}
 */
function downloadFile(url, destinationPath, progressCallback) {
  let fulfill, reject;
  const promise = new Promise((x, y) => { fulfill = x; reject = y; });
  const request = https.get(url, response => {
    if (response.statusCode !== 200) {
      const error = new Error(`Download failed: server returned code ${response.statusCode}. URL: ${url}`);
      // consume response data to free up memory
      response.resume();
      reject(error);
      return;
    }
    const file = fs.createWriteStream(destinationPath);
    file.on('finish', () => fulfill());
    file.on('error', error => reject(error));
    response.pipe(file);
    const totalBytes = parseInt(response.headers['content-length'], 10);
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
