/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
