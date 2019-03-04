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
const {helper, assert} = require('./helper');
const removeRecursive = require('rimraf');
// @ts-ignore
const ProxyAgent = require('https-proxy-agent');
// @ts-ignore
const getProxyForUrl = require('proxy-from-env').getProxyForUrl;

const DEFAULT_DOWNLOAD_HOST = 'https://storage.googleapis.com';

const downloadURLs = {
  chromium: {
    linux: '%s/chromium-browser-snapshots/Linux_x64/%s/%s.zip',
    mac: '%s/chromium-browser-snapshots/Mac/%s/%s.zip',
    win32: '%s/chromium-browser-snapshots/Win/%s/%s.zip',
    win64: '%s/chromium-browser-snapshots/Win_x64/%s/%s.zip',
  },
  firefox: {
    linux: '%s/juggler-builds/%s/%s.zip',
    mac: '%s/juggler-builds/%s/%s.zip',
    win32: '%s/juggler-builds/%s/%s.zip',
    win64: '%s/juggler-builds/%s/%s.zip',
  },
};

/**
 * @param {string} product
 * @param {string} platform
 * @param {string} revision
 * @return {string}
 */
function archiveName(product, platform, revision) {
  if (product === 'chromium') {
    if (platform === 'linux')
      return 'chrome-linux';
    if (platform === 'mac')
      return 'chrome-mac';
    if (platform === 'win32' || platform === 'win64') {
      // Windows archive name changed at r591479.
      return parseInt(revision, 10) > 591479 ? 'chrome-win' : 'chrome-win32';
    }
  } else if (product === 'firefox') {
    if (platform === 'linux')
      return 'firefox-linux';
    if (platform === 'mac')
      return 'firefox-mac';
    if (platform === 'win32' || platform === 'win64')
      return 'firefox-' + platform;
  }
  return null;
}

/**
 * @param {string} product
 * @param {string} platform
 * @param {string} host
 * @param {string} revision
 * @return {string}
 */
function downloadURL(product, platform, host, revision) {
  return util.format(downloadURLs[product][platform], host, revision, archiveName(product, platform, revision));
}

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
   * @param {string} projectRoot
   * @param {!BrowserFetcher.Options=} options
   */
  constructor(projectRoot, options = {}) {
    this._product = (options.product || 'chromium').toLowerCase();
    assert(this._product === 'chromium' || this._product === 'firefox', `Unkown product: "${options.product}"`);
    this._downloadsFolder = options.path || path.join(projectRoot, '.local-browser');
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
      assert(this._platform, 'Unsupported platform: ' + os.platform());
    }
    assert(downloadURLs[this._product][this._platform], 'Unsupported platform: ' + this._platform);
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
    const url = downloadURL(this._product, this._platform, this._downloadHost, revision);
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
    const url = downloadURL(this._product, this._platform, this._downloadHost, revision);
    const zipPath = path.join(this._downloadsFolder, `download-${this._product}-${this._platform}-${revision}.zip`);
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
   */
  async remove(revision) {
    const folderPath = this._getFolderPath(revision);
    assert(await existsAsync(folderPath), `Failed to remove: revision ${revision} is not downloaded`);
    await new Promise(fulfill => removeRecursive(folderPath, fulfill));
  }

  /**
   * @param {string} revision
   * @return {!BrowserFetcher.RevisionInfo}
   */
  revisionInfo(revision) {
    const folderPath = this._getFolderPath(revision);
    let executablePath = '';
    if (this._product === 'chromium') {
      if (this._platform === 'mac')
        executablePath = path.join(folderPath, archiveName(this._product, this._platform, revision), 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
      else if (this._platform === 'linux')
        executablePath = path.join(folderPath, archiveName(this._product, this._platform, revision), 'chrome');
      else if (this._platform === 'win32' || this._platform === 'win64')
        executablePath = path.join(folderPath, archiveName(this._product, this._platform, revision), 'chrome.exe');
      else
        throw new Error('Unsupported platform: ' + this._platform);
    } else if (this._product === 'firefox') {
      if (this._platform === 'mac')
        executablePath = path.join(folderPath, 'firefox', 'Nightly.app', 'Contents', 'MacOS', 'firefox');
      else if (this._platform === 'linux')
        executablePath = path.join(folderPath, 'firefox', 'firefox');
      else if (this._platform === 'win32' || this._platform === 'win64')
        executablePath = path.join(folderPath, 'firefox', 'firefox.exe');
      else
        throw new Error('Unsupported platform: ' + this._platform);
    }
    const url = downloadURL(this._product, this._platform, this._downloadHost, revision);
    const local = fs.existsSync(folderPath);
    return {revision, executablePath, folderPath, local, url};
  }

  /**
   * @param {string} revision
   * @return {string}
   */
  _getFolderPath(revision) {
    return path.join(this._downloadsFolder, this._product + '-' + this._platform + '-' + revision);
  }
}

module.exports = {BrowserFetcher};

/**
 * @param {string} folderPath
 * @return {?{platform: string, revision: string}}
 */
function parseFolderPath(folderPath) {
  const name = path.basename(folderPath);
  const splits = name.split('-');
  if (splits.length !== 3)
    return null;
  const [product, platform, revision] = splits;
  if (!downloadURLs[product][platform])
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
  return new Promise((fulfill, reject) => extract(zipPath, {dir: folderPath}, err => {
    if (err)
      reject(err);
    else
      fulfill();
  }));
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

  const requestCallback = res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
      httpRequest(res.headers.location, method, response);
    else
      response(res);
  };
  const request = options.protocol === 'https:' ?
    require('https').request(options, requestCallback) :
    require('http').request(options, requestCallback);
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
