/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Downloads test browser binaries to test/.cache/server folder that
 * mirrors the structure of the download server.
 */

import {existsSync, mkdirSync, copyFileSync, rmSync} from 'fs';
import {normalize, join, dirname} from 'path';

import {downloadPaths} from '../lib/esm/browser-data/browser-data.js';
import * as versions from '../test/build/versions.js';

import {BrowserPlatform, install} from '@puppeteer/browsers';

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

const cacheDir = normalize(join('.', 'test', '.cache'));

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
