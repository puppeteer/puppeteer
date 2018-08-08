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

// puppeteer-core should not install anything.
if (require('./package.json').name === 'puppeteer-core')
  return;

buildNode6IfNecessary();

if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD) {
  console.log('**INFO** Skipping Chromium download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" environment variable was found.');
  return;
}
if (process.env.NPM_CONFIG_PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || process.env.npm_config_puppeteer_skip_chromium_download) {
  console.log('**INFO** Skipping Chromium download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" was set in npm config.');
  return;
}

const downloadHost = process.env.PUPPETEER_DOWNLOAD_HOST || process.env.npm_config_puppeteer_download_host;

const puppeteer = require('./index');
const browserFetcher = puppeteer.createBrowserFetcher({ host: downloadHost });

const revision = process.env.PUPPETEER_CHROMIUM_REVISION || process.env.npm_config_puppeteer_chromium_revision
  || require('./package.json').puppeteer.chromium_revision;

const revisionInfo = browserFetcher.revisionInfo(revision);

// Do nothing if the revision is already downloaded.
if (revisionInfo.local) {
  generateProtocolTypesIfNecessary(false /* updated */);
  return;
}

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
  console.log('Chromium downloaded to ' + revisionInfo.folderPath);
  localRevisions = localRevisions.filter(revision => revision !== revisionInfo.revision);
  // Remove previous chromium revisions.
  const cleanupOldVersions = localRevisions.map(revision => browserFetcher.remove(revision));
  return Promise.all([...cleanupOldVersions, generateProtocolTypesIfNecessary(true /* updated */)]);
}

/**
 * @param {!Error} error
 */
function onError(error) {
  console.error(`ERROR: Failed to download Chromium r${revision}! Set "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" env variable to skip download.`);
  console.error(error);
  process.exit(1);
}

let progressBar = null;
let lastDownloadedBytes = 0;
function onProgress(downloadedBytes, totalBytes) {
  if (!progressBar) {
    const ProgressBar = require('progress');
    progressBar = new ProgressBar(`Downloading Chromium r${revision} - ${toMegabytes(totalBytes)} [:bar] :percent :etas `, {
      complete: '=',
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

function buildNode6IfNecessary() {
  const fs = require('fs');
  const path = require('path');

  // if this package is installed from NPM, then it already has up-to-date node6
  // folder.
  if (!fs.existsSync(path.join('utils', 'node6-transform')))
    return;
  // if async/await is supported, then node6 is not needed.
  if (supportsAsyncAwait())
    return;
  // Re-build node6/ folder.
  console.log('Building Puppeteer for Node 6');
  require(path.join(__dirname, 'utils', 'node6-transform'));
}

function supportsAsyncAwait() {
  try {
    new Function('async function test(){await 1}');
  } catch (error) {
    return false;
  }
  return true;
}

function generateProtocolTypesIfNecessary(updated) {
  if (!supportsAsyncAwait())
    return;
  const fs = require('fs');
  const path = require('path');
  if (!fs.existsSync(path.join(__dirname, 'utils', 'protocol-types-generator')))
    return;
  if (!updated && fs.existsSync(path.join(__dirname, 'lib', 'protocol.d.ts')))
    return;
  return require('./utils/protocol-types-generator');
}
