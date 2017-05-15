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

var Browser = require('../lib/Browser');
var Downloader = require('../utils/ChromiumDownloader');

var revision = "464642";
console.log('Downloading custom chromium revision - ' + revision);
Downloader.downloadRevision(Downloader.currentPlatform(), revision).then(async () => {
    console.log('Done.');
    var executablePath = Downloader.revisionInfo(Downloader.currentPlatform(), revision).executablePath;
    var browser1 = new Browser({
        remoteDebuggingPort: 9228,
        executablePath,
    });
    var browser2 = new Browser({
        remoteDebuggingPort: 9229,
    });
    var [version1, version2] = await Promise.all([
        browser1.version(),
        browser2.version()
    ]);
    console.log('browser1: ' + version1);
    console.log('browser2: ' + version2);
    browser1.close();
    browser2.close();
});

