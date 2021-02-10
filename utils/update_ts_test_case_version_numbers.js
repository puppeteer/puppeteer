/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const path = require('path');
const json = fs.readFileSync('./package.json', 'utf8').toString();
const pkg = JSON.parse(json);
const puppeteerVersionToBumpTo = pkg.version;

const TEST_TS_TYPES_ROOT_DIR = path.join(process.cwd(), 'test-ts-types');
fs.readdirSync(TEST_TS_TYPES_ROOT_DIR)
  .filter((item) => {
    const isDir = fs
      .statSync(path.join(TEST_TS_TYPES_ROOT_DIR, item))
      .isDirectory();
    return isDir;
  })
  .forEach((directory) => {
    const fullPath = path.join(TEST_TS_TYPES_ROOT_DIR, directory);
    const pkgJsonPath = path.join(fullPath, 'package.json');
    const pkgJsonRaw = fs.readFileSync(pkgJsonPath, 'utf-8');
    const newPkgJsonWithNewVersion = pkgJsonRaw.replace(
      /puppeteer-([0-9.]+)(-post)?\.tgz/,
      `puppeteer-${puppeteerVersionToBumpTo}.tgz`
    );
    fs.writeFileSync(pkgJsonPath, newPkgJsonWithNewVersion);
  });
