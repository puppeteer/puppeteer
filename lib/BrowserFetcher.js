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
const {helper} = require('./helper');
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

const readdirAsync = helper.promisify(fs.readdir.bind(fs));
const mkdirAsync = helper.promisify(fs.mkdir.bind(fs));
const unlinkAsync = helper.promisify(fs.unlink.bind(fs));
const chmodAsync = helper.promisify(fs.chmod.bind(fs));

function existsAsync(filePath) {
  let fulfill = null;
  const promise = new Promise(x => fulfill = x);
  fs.access(filePath, err => fulfill(!err));
  return promise;
}

class BrowserFetcher {
  /**
   * @param {!BrowserFetcher.Options=} options
   */
  constructor(options = {}) {
    this._downloadsFolder = options.path || path.join(helper.projectRoot(), '.local-chromium');
    this._downloadHost = options.host || DEFAULT_DOWNLOAD_HOST;
    this._platform = options.platform || '';
    if (!this._platform) {
      const platform = os.platform();
      if (platform === 'darwin')
        this._platform = 'mac';
      else if (platform === 'linux')
        this._platform = 'linux';
      else if (platform === 'win32')
        this._platform = os.arch() === 'x64' ? 'win64' : 'win32';
      console.assert(this._platform, 'Unsupported platform: ' + os.platform());
    }
    const supportedPlatforms = ['mac', 'linux', 'win32', 'win64'];
    console.assert(supportedPlatforms.includes(this._platform), 'Unsupported platform: ' + this._platform);
  }

  /**
   * @return {string}
   */
  platform() {
    return this._platform;
  }

  /**
   * @param {string} revision
   * @return {!Promise<boolean>}
   */
  canDownload(revision) {
    const url = util.format(downloadURLs[this._platform], this._downloadHost, revision);

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
   * @param {string} revision
   * @param {?function(number, number)} progressCallback
   * @return {!Promise<!BrowserFetcher.RevisionInfo>}
   */
  async download(revision, progressCallback) {
    let url = downloadURLs[this._platform];
    url = util.format(url, this._downloadHost, revision);
    const zipPath = path.join(this._downloadsFolder, `download-${this._platform}-${revision}.zip`);
    const folderPath = this._getFolderPath(revision);
    if (await existsAsync(folderPath))
      return this.revisionInfo(revision);
    if (!(await existsAsync(this._downloadsFolder)))
      await mkdirAsync(this._downloadsFolder);
    try {
      await downloadFile(url, zipPath, progressCallback);
      await extractZip(zipPath, folderPath);
    } finally {
      if (await existsAsync(zipPath))
        await unlinkAsync(zipPath);
    }
    const revisionInfo = this.revisionInfo(revision);
    if (revisionInfo)
      await chmodAsync(revisionInfo.executablePath, 0o755);
    return revisionInfo;
  }

  /**
   * @return {!Promise<!Array<string>>}
   */
  async localRevisions() {
    if (!await existsAsync(this._downloadsFolder))
      return [];
    const fileNames = await readdirAsync(this._downloadsFolder);
    return fileNames.map(fileName => parseFolderPath(fileName)).filter(entry => entry && entry.platform === this._platform).map(entry => entry.revision);
  }

  /**
   * @param {string} revision
   * @return {!Promise}
   */
  async remove(revision) {
    const folderPath = this._getFolderPath(revision);
    console.assert(await existsAsync(folderPath), `Failed to remove: revision ${revision} is not downloaded`);
    await new Promise(fulfill => removeRecursive(folderPath, fulfill));
  }

  /**
   * @param {string} revision
   * @return {!BrowserFetcher.RevisionInfo}
   */
  revisionInfo(revision) {
    const folderPath = this._getFolderPath(revision);
    let executablePath = '';
    if (this._platform === 'mac')
      executablePath = path.join(folderPath, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
    else if (this._platform === 'linux')
      executablePath = path.join(folderPath, 'chrome-linux', 'chrome');
    else if (this._platform === 'win32' || this._platform === 'win64')
      executablePath = path.join(folderPath, 'chrome-win32', 'chrome.exe');
    else
      throw 'Unsupported platform: ' + this._platform;
    let url = downloadURLs[this._platform];
    url = util.format(url, this._downloadHost, revision);
    const local = fs.existsSync(folderPath);
    return {revision, executablePath, folderPath, local, url};
  }

  /**
   * @param {string} revision
   * @return {string}
   */
  _getFolderPath(revision) {
    return path.join(this._downloadsFolder, this._platform + '-' + revision);
  }
}

module.exports = BrowserFetcher;

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
  let downloadedBytes = 0;
  let totalBytes = 0;

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
    totalBytes = parseInt(/** @type {string} */ (response.headers['content-length']), 10);
    if (progressCallback)
      response.on('data', onData);
  });
  request.on('error', error => reject(error));
  return promise;

  function onData(chunk) {
    downloadedBytes += chunk.length;
    progressCallback(downloadedBytes, totalBytes);
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
  const request = require(driver).request(options, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
      httpRequest(res.headers.location, method, response);
    else
      response(res);
  });
  request.end();
  return request;
}

/**
 * @typedef {Object} BrowserFetcher.Options
 * @property {string=} platform
 * @property {string=} path
 * @property {string=} host
 */

/**
 * @typedef {Object} BrowserFetcher.RevisionInfo
 * @property {string} folderPath
 * @property {string} executablePath
 * @property {string} url
 * @property {boolean} local
 * @property {string} revision
 */
