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

const Downloader = require('./utils/ChromiumDownloader');
const platform = Downloader.currentPlatform();
const revision = require('./package').puppeteer.chromium_revision;
const ProgressBar = require('progress');

const revisionInfo = Downloader.revisionInfo(platform, revision);
// Do nothing if the revision is already downloaded.
if (revisionInfo.downloaded)
  return;

const allRevisions = Downloader.downloadedRevisions();
Downloader.downloadRevision(platform, revision, onProgress)
    // Remove previous chromium revisions.
    .then(() => Promise.all(allRevisions.map(({platform, revision}) => Downloader.removeRevision(platform, revision))))
    .catch(onError);

function onError(error) {
  console.error(`ERROR: Failed to download chromium r${revision}!
- Download chromium manually:
    ${revisionInfo.url}
- Extract chromium into ${revisionInfo.folderPath}
  * Chromium executable should be at ${revisionInfo.executablePath}`);
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

