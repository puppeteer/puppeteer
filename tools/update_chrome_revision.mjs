/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {execSync} from 'child_process';
import {writeFile, readFile} from 'fs/promises';

import actions from '@actions/core';
import {PUPPETEER_REVISIONS} from 'puppeteer-core/internal/revisions.js';

import packageJson from '../packages/puppeteer-core/package.json' assert {type: 'json'};
import {versionsPerRelease, lastMaintainedChromeVersion} from '../versions.js';

const CHROME_CURRENT_VERSION = PUPPETEER_REVISIONS.chrome;
const VERSIONS_PER_RELEASE_COMMENT =
  '// In Chrome roll patches, use `NEXT` for the Puppeteer version.';

async function replaceInFile(filePath, search, replace) {
  const buffer = await readFile(filePath);
  const update = buffer.toString().replace(search, replace);

  await writeFile(filePath, update);
}

async function getVersionAndRevisionForStable() {
  const result = await fetch(
    'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json'
  ).then(response => {
    return response.json();
  });

  const {version, revision} = result.channels['Stable'];

  return {
    version,
    revision,
  };
}

async function updateDevToolsProtocolVersion(revision) {
  const currentProtocol = packageJson.dependencies['devtools-protocol'];
  const command = `npm view "devtools-protocol@<=0.0.${revision}" version | tail -1`;

  const bestNewProtocol = execSync(command, {
    encoding: 'utf8',
  })
    .split(' ')[1]
    .replace(/'|\n/g, '');

  await replaceInFile(
    './packages/puppeteer-core/package.json',
    `"devtools-protocol": "${currentProtocol}"`,
    `"devtools-protocol": "${bestNewProtocol}"`
  );
}

async function updateVersionFileLastMaintained(updateVersion) {
  const versions = [...versionsPerRelease.keys()];
  if (version.indexOf(updateVersion) !== -1) {
    return;
  }

  await replaceInFile(
    './versions.js',
    VERSIONS_PER_RELEASE_COMMENT,
    `${VERSIONS_PER_RELEASE_COMMENT}\n  ['${version}', 'NEXT'],`
  );

  const lastMaintainedIndex = versions.indexOf(lastMaintainedChromeVersion);
  const nextMaintainedVersion = versions[lastMaintainedIndex - 1];

  await replaceInFile(
    './versions.js',
    `const lastMaintainedChromeVersion = '${lastMaintainedChromeVersion}';`,
    `const lastMaintainedChromeVersion = '${nextMaintainedVersion}';`
  );
}

const {version, revision} = await getVersionAndRevisionForStable();

await replaceInFile(
  './packages/puppeteer-core/src/revisions.ts',
  CHROME_CURRENT_VERSION,
  version
);

await updateVersionFileLastMaintained(version);
await updateDevToolsProtocolVersion(revision);

actions.setOutput('version', version);
actions.setOutput('revision', revision);
