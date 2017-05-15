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

var Downloader = require('./lib/Downloader');
var revision = require('./package').puppeteer.chromium_revision;
var fs = require('fs');
var ProgressBar = require('progress');

var executable = Downloader.executablePath(revision);
if (fs.existsSync(executable))
    return;

Downloader.downloadChromium(revision, onProgress)
    .catch(error => {
        console.error('Download failed: ' + error.message);
    });

var progressBar = null;
function onProgress(bytesTotal, delta) {
    if (!progressBar) {
        progressBar = new ProgressBar(`Downloading Chromium - ${toMegabytes(bytesTotal)} [:bar] :percent :etas `, {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: bytesTotal,
        });
    }
    progressBar.tick(delta);
}

function toMegabytes(bytes) {
    var mb = bytes / 1024 / 1024;
    return (Math.round(mb * 10) / 10) + ' Mb';
}

