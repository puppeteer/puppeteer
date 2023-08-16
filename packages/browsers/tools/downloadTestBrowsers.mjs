/**
 * Copyright 2023 Google Inc. All rights reserved.
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

/**
 * Downloads test browser binaries to test/cache/server folder that
 * mirrors the structure of the download server.
 */

import {existsSync, mkdirSync, copyFileSync, rmSync} from 'fs';
import {normalize, join, dirname} from 'path';

import {BrowserPlatform, install} from '@puppeteer/browsers';

import {downloadPaths} from '../lib/esm/browser-data/browser-data.js';
import * as versions from '../test/build/versions.js';

function getBrowser(str) {
  const regex = /test(.+)BuildId/;
  const match = str.match(regex);

  if (match && match[1]) {
    const lowercased = match[1].toLowerCase();
    if (lowercased === 'chromeheadlessshell') {
      return 'chrome-headless-shell';
    }
    return lowercased;
  } else {
    return null;
  }
}

const cacheDir = normalize(join('.', 'test', 'cache'));

for (const version of Object.keys(versions)) {
  const browser = getBrowser(version);
  if (!browser) {
    continue;
  }

  const buildId = versions[version];

  for (const platform of Object.values(BrowserPlatform)) {
    const targetPath = join(
      cacheDir,
      'server',
      ...downloadPaths[browser](platform, buildId)
    );

    if (existsSync(targetPath)) {
      continue;
    }

    const archivePath = await install({
      browser,
      buildId,
      platform,
      cacheDir: join(cacheDir, 'tmp'),
      unpack: false,
    });

    mkdirSync(dirname(targetPath), {
      recursive: true,
    });
    copyFileSync(archivePath, targetPath);
  }
}

rmSync(join(cacheDir, 'tmp'), {
  recursive: true,
  force: true,
  maxRetries: 10,
});
