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


const os = require('os');
const fs = require('fs');
const path = require('path');

// puppeteer-core should not install anything.
if (require('./package.json').name === 'puppeteer-core')
  return;

const downloadHost = process.env.PUPPETEER_DOWNLOAD_HOST || process.env.npm_config_puppeteer_download_host || process.env.npm_package_config_puppeteer_download_host;

const puppeteer = require('./index');
const browserFetcher = puppeteer.createBrowserFetcher({ host: downloadHost, product: 'firefox' });

const revision = require('./package.json').puppeteer.firefox_revision;

const revisionInfo = browserFetcher.revisionInfo(revision);

// Do nothing if the revision is already downloaded.
if (revisionInfo.local)
  return;

// Override current environment proxy settings with npm configuration, if any.
const NPM_HTTPS_PROXY = process.env.npm_config_https_proxy || process.env.npm_config_proxy;
const NPM_HTTP_PROXY = process.env.npm_config_http_proxy || process.env.npm_config_proxy;
const NPM_NO_PROXY = process.env.npm_config_no_proxy;

if (NPM_HTTPS_PROXY)
  process.env.HTTPS_PROXY = NPM_HTTPS_PROXY;
if (NPM_HTTP_PROXY)
  process.env.HTTP_PROXY = NPM_HTTP_PROXY;
if (NPM_NO_PROXY)
  process.env.NO_PROXY = NPM_NO_PROXY;

browserFetcher.download(revisionInfo.revision, onProgress)
    .then(() => browserFetcher.localRevisions())
    .then(onSuccess)
    .catch(onError);

/**
 * @param {!Array<string>}
 * @return {!Promise}
 */
function onSuccess(localRevisions) {
  console.log('Firefox downloaded to ' + revisionInfo.folderPath);
  localRevisions = localRevisions.filter(revision => revision !== revisionInfo.revision);
  // Remove previous firefox revisions.
  const cleanupOldVersions = localRevisions.map(revision => browserFetcher.remove(revision));
  return Promise.all([...cleanupOldVersions, installFirefoxPreferences()]);
}

/**
 * @param {!Error} error
 */
function onError(error) {
  console.error(`ERROR: Failed to download Firefox r${revision}!`);
  console.error(error);
  process.exit(1);
}

let progressBar = null;
let lastDownloadedBytes = 0;
function onProgress(downloadedBytes, totalBytes) {
  if (!progressBar) {
    const ProgressBar = require('progress');
    progressBar = new ProgressBar(`Downloading Firefox+Puppeteer ${revision.substring(0, 8)} - ${toMegabytes(totalBytes)} [:bar] :percent :etas `, {
      complete: '|',
      incomplete: ' ',
      width: 20,
      total: totalBytes,
    });
  }
  const delta = downloadedBytes - lastDownloadedBytes;
  lastDownloadedBytes = downloadedBytes;
  progressBar.tick(delta);
}

function toMegabytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb * 10) / 10} Mb`;
}

// Install browser preferences after downloading and unpacking
// firefox instances.
// Based on:   https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Enterprise_deployment_before_60#Configuration
async function installFirefoxPreferences() {
  const revisionInfo = browserFetcher.revisionInfo(revision);
  const firefoxFolder = path.dirname(revisionInfo.executablePath);
  const {helper} = require('./lib/firefox/helper');
  const mkdirAsync = helper.promisify(fs.mkdir.bind(fs));

  let prefPath = '';
  let configPath = '';
  if (os.platform() === 'darwin') {
    prefPath = path.join(firefoxFolder, '..', 'Resources', 'defaults', 'pref');
    configPath = path.join(firefoxFolder, '..', 'Resources');
  } else if (os.platform() === 'linux') {
    await mkdirAsync(path.join(firefoxFolder, 'browser', 'defaults'));
    await mkdirAsync(path.join(firefoxFolder, 'browser', 'defaults', 'preferences'));
    prefPath = path.join(firefoxFolder, 'browser', 'defaults', 'preferences');
    configPath = firefoxFolder;
  } else if (os.platform() === 'win32') {
    prefPath = path.join(firefoxFolder, 'defaults', 'pref');
    configPath = firefoxFolder;
  } else {
    throw new Error('Unsupported platform: ' + os.platform());
  }

  await Promise.all([
    copyFile({
      from: path.join(__dirname, 'misc', '00-puppeteer-prefs.js'),
      to: path.join(prefPath, '00-puppeteer-prefs.js'),
    }),
    copyFile({
      from: path.join(__dirname, 'misc', 'puppeteer.cfg'),
      to: path.join(configPath, 'puppeteer.cfg'),
    }),
  ]).then(() => {
    console.log('Firefox preferences installed!');
  });
}

function copyFile({from, to}) {
  var rd = fs.createReadStream(from);
  var wr = fs.createWriteStream(to);
  return new Promise(function(resolve, reject) {
    rd.on('error', reject);
    wr.on('error', reject);
    wr.on('finish', resolve);
    rd.pipe(wr);
  }).catch(function(error) {
    rd.destroy();
    wr.end();
    throw error;
  });
}

