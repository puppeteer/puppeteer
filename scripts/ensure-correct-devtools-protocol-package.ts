/**
 * Copyright 2020 Google Inc. All rights reserved.
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
 * This script ensures that the pinned version of devtools-protocol in
 * package.json is the right version for the current revision of Chromium that
 * Puppeteer ships with.
 *
 * The devtools-protocol package publisher runs every hour and checks if there
 * are protocol changes. If there are, it will be versioned with the revision
 * number of the commit that last changed the .pdl files.
 *
 * Chromium branches/releases are figured out at a later point in time, so it's
 * not true that each Chromium revision will have an exact matching revision
 * version of devtools-protocol. To ensure we're using a devtools-protocol that
 * is aligned with our revision, we want to find the largest package number
 * that's \<= the revision that Puppeteer is using.
 *
 * This script uses npm's `view` function to list all versions in a range and
 * find the one closest to our Chromium revision.
 */

// eslint-disable-next-line import/extensions
import {PUPPETEER_REVISIONS} from '../src/revisions';
import {execSync} from 'child_process';

import packageJson from '../package.json';

const currentProtocolPackageInstalledVersion =
  packageJson.dependencies['devtools-protocol'];

/**
 * Ensure that the devtools-protocol version is pinned.
 */
if (/^[^0-9]/.test(currentProtocolPackageInstalledVersion)) {
  console.log(
    `ERROR: devtools-protocol package is not pinned to a specific version.\n`
  );
  process.exit(1);
}

// find the right revision for our Chromium revision

const command = `npm view "devtools-protocol@<=0.0.${PUPPETEER_REVISIONS.chromium}" version | tail -1`;

console.log(
  'Checking npm for devtools-protocol revisions:\n',
  `'${command}'`,
  '\n'
);

const output = execSync(command, {
  encoding: 'utf8',
});

const bestRevisionFromNpm = output.split(' ')[1]!.replace(/'|\n/g, '');

if (currentProtocolPackageInstalledVersion !== bestRevisionFromNpm) {
  console.log(`ERROR: bad devtools-protocol revision detected:

    Current Puppeteer Chromium revision: ${PUPPETEER_REVISIONS.chromium}
    Current devtools-protocol version in package.json: ${currentProtocolPackageInstalledVersion}
    Expected devtools-protocol version:                ${bestRevisionFromNpm}`);

  process.exit(1);
}

console.log(
  `Correct devtools-protocol version found (${bestRevisionFromNpm}).`
);
process.exit(0);
