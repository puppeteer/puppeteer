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

import fs from 'node:fs/promises';

const filePath = './test/src/versions.ts';

const getVersion = async () => {
  // https://stackoverflow.com/a/1732454/96656
  const response = await fetch(
    'https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central/'
  );
  const html = await response.text();
  const re = /firefox-(.*)\.en-US\.langpack\.xpi">/;
  const match = re.exec(html)[1];
  return match;
};

const patch = (input, version) => {
  const output = input.replace(/testFirefoxBuildId = '([^']+)';/, match => {
    return `testFirefoxBuildId = '${version}';`;
  });
  return output;
};

const version = await getVersion();

const contents = await fs.readFile(filePath, 'utf8');
const patched = patch(contents, version);
fs.writeFile(filePath, patched);
