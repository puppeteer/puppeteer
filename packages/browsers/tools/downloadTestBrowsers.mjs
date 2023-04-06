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

import {BrowserPlatform, install} from '@puppeteer/browsers';
import path from 'path';
import fs from 'fs';

import * as versions from '../test/build/versions.js';
import {downloadPaths} from '../lib/esm/browser-data/browser-data.js';

function getBrowser(str) {
  const regex = /test(.+)BuildId/;
  const match = str.match(regex);

  if (match && match[1]) {
    return match[1].toLowerCase();
  } else {
    return null;
  }
}

const cacheDir = path.normalize(path.join('.', 'test', 'cache'));

for (const version of Object.keys(versions)) {
  const browser = getBrowser(version);

  if (!browser) {
    continue;
  }

  const buildId = versions[version];

  for (const platform of Object.values(BrowserPlatform)) {
    const targetPath = path.join(
      cacheDir,
      'server',
      ...downloadPaths[browser](platform, buildId)
    );

    if (fs.existsSync(targetPath)) {
      continue;
    }

    const result = await install({
      browser,
      buildId,
      platform,
      cacheDir: path.join(cacheDir, 'tmp'),
      unpack: false,
    });

    fs.mkdirSync(path.dirname(targetPath), {
      recursive: true,
    });
    fs.copyFileSync(result.path, targetPath);
  }
}

fs.rmSync(path.join(cacheDir, 'tmp'), {
  recursive: true,
  force: true,
  maxRetries: 10,
});
