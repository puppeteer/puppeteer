#!/usr/bin/env node
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

const util = require('util');
const fs = require('fs');
const path = require('path');
const Downloader = require('./ChromiumDownloader');
const platform = Downloader.currentPlatform();
const ProgressBar = require('progress');

const help = `Usage:  node ${path.basename(__filename)} [--download <revision>] [--path <revision>]
  --download   Chromium revision to download

  --path       Show path for given downloaded chromium revision

  -h, --help   Show this help message

Download chromium with specific revision.
`;

const argv = require('minimist')(process.argv.slice(2), {
  alias: { h: 'help' },
});

if (argv.help || !(argv.path || argv.download)) {
  console.log(help);
  return;
}

if (argv.path && argv.download) {
  console.error('ERROR: either download or path should be present');
  console.log(help);
  return;
}

if (argv.path) {
  const revision = argv.path;
  const revisionInfo = Downloader.revisionInfo(platform, revision);
  if (revisionInfo) {
    console.log(revisionInfo.executablePath);
  } else {
    console.error(`ERROR: Chromium r${revision} is not downloaded!`);
    process.exit(1);
  }
  return;
}

if (argv.download) {
  const revision = argv.download;
  const revisionInfo = Downloader.revisionInfo(platform, revision);
  if (revisionInfo.downloaded) {
    console.log(`Chromium r${revision} is already downloaded.`);
    process.exit(0);
    return;
  }
  Downloader.downloadRevision(platform, revision, undefined, onProgress)
      .then(() => {
        console.log('Chromium downloaded to ' + revisionInfo.folderPath);
      })
      .catch(error => {
        console.error(`ERROR: Failed to download Chromium r${revision}!`);
        console.error(error);
        process.exit(1);
      });

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
}


