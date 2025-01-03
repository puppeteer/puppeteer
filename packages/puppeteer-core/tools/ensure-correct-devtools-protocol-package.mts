/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This script ensures that the pinned version of devtools-protocol in
 * package.json is the right version for the current revision of Chrome that
 * Puppeteer ships with.
 *
 * The devtools-protocol package publisher runs every hour and checks if there
 * are protocol changes. If there are, it will be versioned with the revision
 * number of the commit that last changed the .pdl files.
 *
 * Chrome branches/releases are figured out at a later point in time, so it's
 * not true that each Chrome revision will have an exact matching revision
 * version of devtools-protocol. To ensure we're using a devtools-protocol that
 * is aligned with our revision, we want to find the largest package number
 * that's \<= the revision that Puppeteer is using.
 *
 * This script uses npm's `view` function to list all versions in a range and
 * find the one closest to our Chrome revision.
 */

import {execSync} from 'child_process';

import packageJson from '../package.json' with {type: 'json'};
import {PUPPETEER_REVISIONS} from '../lib/esm/puppeteer/revisions.js';

async function main() {
  const currentProtocolPackageInstalledVersion =
    packageJson.dependencies['devtools-protocol'];

  /**
   * Ensure that the devtools-protocol version is pinned.
   */
  if (/^[^0-9]/.test(currentProtocolPackageInstalledVersion)) {
    console.log(
      `ERROR: devtools-protocol package is not pinned to a specific version.\n`,
    );
    process.exit(1);
  }

  const chromeVersion = PUPPETEER_REVISIONS.chrome;
  // find the right revision for our Chrome version.
  const req = await fetch(
    `https://googlechromelabs.github.io/chrome-for-testing/known-good-versions.json`,
  );
  const releases = await req.json();
  const chromeRevision = releases.versions.find(release => {
    return release.version === chromeVersion;
  }).revision;
  console.log(`Revisions for ${chromeVersion}: ${chromeRevision}`);

  const command = `npm view "devtools-protocol@<=0.0.${chromeRevision}" version | tail -1`;

  console.log(
    'Checking npm for devtools-protocol revisions:\n',
    `'${command}'`,
    '\n',
  );

  const output = execSync(command, {
    encoding: 'utf8',
  });

  const bestRevisionFromNpm = output.split(' ')[1]!.replace(/'|\n/g, '');

  if (currentProtocolPackageInstalledVersion !== bestRevisionFromNpm) {
    console.log(`ERROR: bad devtools-protocol revision detected:

    Current Puppeteer Chrome revision: ${chromeRevision}
    Current devtools-protocol version in package.json: ${currentProtocolPackageInstalledVersion}
    Expected devtools-protocol version:                ${bestRevisionFromNpm}`);

    process.exit(1);
  }

  console.log(
    `Correct devtools-protocol version found (${bestRevisionFromNpm}).`,
  );
  process.exit(0);
}

void main();
