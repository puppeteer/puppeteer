/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'path';
import url from 'url';

import actions from '@actions/core';

import {testFirefoxBuildId} from '../test/build/versions.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const filePath = path.join(__dirname, '../test/src/versions.ts');

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

if (testFirefoxBuildId !== version) {
  actions.setOutput(
    'commit',
    `chore: update Firefox testing pin to ${version}`
  );
  const contents = await fs.readFile(filePath, 'utf8');
  const patched = patch(contents, version);
  fs.writeFile(filePath, patched);
}
