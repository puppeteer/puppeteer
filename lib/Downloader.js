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
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const util = require('util');
const URL = require('url');
const removeRecursive = require('rimraf');
// @ts-ignore
const ProxyAgent = require('https-proxy-agent');
// @ts-ignore
const getProxyForUrl = require('proxy-from-env').getProxyForUrl;

const DEFAULT_DOWNLOAD_HOST = 'https://storage.googleapis.com';
const downloadURLs = {
  linux: '%s/chromium-browser-snapshots/Linux_x64/%d/chrome-linux.zip',
  mac: '%s/chromium-browser-snapshots/Mac/%d/chrome-mac.zip',
  win32: '%s/chromium-browser-snapshots/Win/%d/chrome-win32.zip',
  win64: '%s/chromium-browser-snapshots/Win_x64/%d/chrome-win32.zip',
};

// Project root will be different for node6-transpiled code.
const PROJECT_ROOT = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');

class Downloader {
  /**
   * @param {string} downloadsFolder
   */
  constructor(downloadsFolder) {
    this._downloadsFolder = downloadsFolder;
    this._downloadHost = DEFAULT_DOWNLOAD_HOST;
  }

  /**
   * @return {string}
   */
  static defaultRevision() {
    return require(path.join(PROJECT_ROOT, 'package.json')).puppeteer.chromium_revision;
  }

  /**
   * @return {!Downloader}
   */
  static createDefault() {
    const downloadsFolder = path.join(PROJECT_ROOT, '.local-chromium');
    return new Downloader(downloadsFolder);
  }

  /**
   * @param {string} downloadHost
   */
  setDownloadHost(downloadHost) {
    this._downloadHost = downloadHost.replace(/\/+$/, '');
  }

  /**
   * @return {!Array<string>}
   */
  supportedPlatforms() {
    return Object.keys(downloadURLs);
  }

  /**
   * @return {string}
   */
  currentPlatform() {
    const platform = os.platform();
    if (platform === 'darwin')
      return 'mac';
    if (platform === 'linux')
      return 'linux';
    if (platform === 'win32')
      return os.arch() === 'x64' ? 'win64' : 'win32';
    return '';
  }

  /**
   * @param {string} platform
   * @param {string} revision
   * @return {!Promise<boolean>}
   */
  canDownloadRevision(platform, revision) {
    console.assert(downloadURLs[platform], 'Unknown platform: ' + platform);

    const url = util.format(downloadURLs[platform], this._downloadHost, revision);

    let resolve;
    const promise = new Promise(x => resolve = x);
    const request = httpRequest(url, 'HEAD', response => {
      resolve(response.statusCode === 200);
    });
    request.on('error', error => {
      console.error(error);
      resolve(false);
    });
    return promise;
  }

  /**
   * @param {string} platform
   * @param {string} revision
   * @param {?function(number, number)} progressCallback
   * @return {!Promise}
   */
  downloadRevision(platform, revision, progressCallback) {
    let url = downloadURLs[platform];
    console.assert(url, `Unsupported platform: ${platform}`);
    url = util.format(url, this._downloadHost, revision);
    const zipPath = path.join(this._downloadsFolder, `download-${platform}-${revision}.zip`);
    const folderPath = this._getFolderPath(platform, revision);
    if (fs.existsSync(folderPath))
      return;
    if (!fs.existsSync(this._downloadsFolder))
      fs.mkdirSync(this._downloadsFolder);
    return downloadFile(url, zipPath, progressCallback)
        .then(() => extractZip(zipPath, folderPath))
        .catch(err => err)
        .then(err => {
          if (fs.existsSync(zipPath))
            fs.unlinkSync(zipPath);
          if (err)
            throw err;
        });
  }

  /**
   * @return {!Array<!{platform:string, revision: string}>}
   */
  downloadedRevisions() {
    if (!fs.existsSync(this._downloadsFolder))
      return [];
    const fileNames = fs.readdirSync(this._downloadsFolder);
    return fileNames.map(fileName => parseFolderPath(fileName)).filter(revision => !!revision);
  }

  /**
   * @param {string} platform
   * @param {string} revision
   * @return {!Promise}
   */
  removeRevision(platform, revision) {
    console.assert(downloadURLs[platform], `Unsupported platform: ${platform}`);
    const folderPath = this._getFolderPath(platform, revision);
    console.assert(fs.existsSync(folderPath));
    return new Promise(fulfill => removeRecursive(folderPath, fulfill));
  }

  /**
   * @param {string} platform
   * @param {string} revision
   * @return {!{revision: string, folderPath: string, executablePath: string, downloaded: boolean}}
   */
  revisionInfo(platform, revision) {
    console.assert(downloadURLs[platform], `Unsupported platform: ${platform}`);
    const folderPath = this._getFolderPath(platform, revision);
    let executablePath = '';
    if (platform === 'mac')
      executablePath = path.join(folderPath, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
    else if (platform === 'linux')
      executablePath = path.join(folderPath, 'chrome-linux', 'chrome');
    else if (platform === 'win32' || platform === 'win64')
      executablePath = path.join(folderPath, 'chrome-win32', 'chrome.exe');
    else
      throw 'Unsupported platform: ' + platform;
    return {
      revision,
      executablePath,
      folderPath,
      downloaded: fs.existsSync(folderPath)
    };
  }

  /**
   * @param {string} platform
   * @param {string} revision
   * @return {string}
   */
  _getFolderPath(platform, revision) {
    return path.join(this._downloadsFolder, platform + '-' + revision);
  }
}

module.exports = Downloader;

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

  const request = httpRequest(url, 'GET', response => {
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
    const totalBytes = parseInt(/** @type {string} */ (response.headers['content-length']), 10);
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

function httpRequest(url, method, response) {
  /** @type {Object} */
  const options = URL.parse(url);
  options.method = method;

  const proxyURL = getProxyForUrl(url);
  if (proxyURL) {
    /** @type {Object} */
    const parsedProxyURL = URL.parse(proxyURL);
    parsedProxyURL.secureProxy = parsedProxyURL.protocol === 'https:';

    options.agent = new ProxyAgent(parsedProxyURL);
    options.rejectUnauthorized = false;
  }

  const driver = options.protocol === 'https:' ? 'https' : 'http';
  const request = require(driver).request(options, response);
  request.end();
  return request;
}
