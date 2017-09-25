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

if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD) {
  console.log('**INFO** Skipping Chromium download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" environment variable was found.');
  return;
}
if (process.env.NPM_CONFIG_PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || process.env.npm_config_puppeteer_skip_chromium_download) {
  console.log('**INFO** Skipping Chromium download. "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" was set in npm config.');
  return;
}

const Downloader = require('./utils/ChromiumDownloader');
const platform = Downloader.currentPlatform();
const revision = require('./package').puppeteer.chromium_revision;
const ProgressBar = require('progress');

const revisionInfo = Downloader.revisionInfo(platform, revision);
// Do nothing if the revision is already downloaded.
if (revisionInfo.downloaded)
  return;

// Override current environment proxy settings with npm configuration, if any.
const NPM_HTTPS_PROXY = process.env.npm_config_https_proxy || process.env.npm_config_proxy;
const NPM_HTTP_PROXY = process.env.npm_config_http_proxy || process.env.npm_config_proxy;
if (NPM_HTTPS_PROXY)
  process.env.HTTPS_PROXY = NPM_HTTPS_PROXY;
if (NPM_HTTP_PROXY)
  process.env.HTTP_PROXY = NPM_HTTP_PROXY;

const allRevisions = Downloader.downloadedRevisions();
Downloader.downloadRevision(platform, revision, onProgress)
    .then(onSuccess)
    .catch(onError);

/**
 * @return {!Promise}
 */
function onSuccess() {
  console.log('Chromium downloaded to ' + revisionInfo.folderPath);
  // Remove previous chromium revisions.
  const cleanupOldVersions = allRevisions.map(({platform, revision}) => Downloader.removeRevision(platform, revision));
  return Promise.all(cleanupOldVersions);
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
function onProgress(bytesTotal, delta) {
  if (!progressBar) {
    progressBar = new ProgressBar(`Downloading Chromium r${revision} - ${toMegabytes(bytesTotal)} [:bar] :percent :etas `, {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: bytesTotal,
    });
  }
  progressBar.tick(delta);
}

function toMegabytes(bytes) {
  const mb = bytes / 1024 / 1024;
  return `${Math.round(mb * 10) / 10} Mb`;
}

