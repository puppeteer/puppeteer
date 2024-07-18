/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execSync, exec} from 'child_process';
import {writeFile, readFile} from 'fs/promises';
import {promisify} from 'util';

import actions from '@actions/core';
import {SemVer} from 'semver';

import packageJson from '../packages/puppeteer-core/package.json' assert {type: 'json'};
import versionData from '../versions.json' assert {type: 'json'};

import {PUPPETEER_REVISIONS} from 'puppeteer-core/internal/revisions.js';

const execAsync = promisify(exec);

const CHROME_CURRENT_VERSION = PUPPETEER_REVISIONS.chrome;

const touchedFiles = [];

function checkIfNeedsUpdate(oldVersion, newVersion, newRevision) {
  const oldSemVer = new SemVer(oldVersion, true);
  const newSemVer = new SemVer(newVersion, true);
  let message = `roll to Chrome ${newVersion} (r${newRevision})`;

  if (newSemVer.compare(oldSemVer) <= 0) {
    // Exit the process without setting up version
    console.warn(
      `Version ${newVersion} is older or the same as the current ${oldVersion}`
    );
    process.exit(0);
  } else if (newSemVer.compareMain(oldSemVer) === 0) {
    message = `fix: ${message}`;
  } else {
    message = `feat: ${message}`;
  }
  actions.setOutput('commit', message);
}

/**
 * We cant use `npm run format` as it's too slow
 * so we only scope the files we updated
 */
async function formatUpdateFiles() {
  await Promise.all(
    touchedFiles.map(file => {
      return execAsync(`npx eslint --ext js --ext ts --fix ${file}`);
    })
  );
  await Promise.all(
    touchedFiles.map(file => {
      return execAsync(`npx prettier --write ${file}`);
    })
  );
}

async function replaceInFile(filePath, search, replace) {
  const buffer = await readFile(filePath);
  const update = buffer.toString().replaceAll(search, replace);

  await writeFile(filePath, update);

  touchedFiles.push(filePath);
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

  await replaceInFile(
    './packages/puppeteer/package.json',
    `"devtools-protocol": "${currentProtocol}"`,
    `"devtools-protocol": "${bestNewProtocol}"`
  );
}

async function saveVersionData(data) {
  await writeFile('./versions.json', JSON.stringify(data, null, 2));
  touchedFiles.push('./versions.json');
}

async function updateVersionFileLastMaintained(oldVersion, newVersion) {
  const chromeVersions = versionData.versions.map(
    ([_puppeteerVersion, browserVersions]) => {
      return browserVersions.chrome;
    }
  );
  if (chromeVersions.indexOf(newVersion) !== -1) {
    // Already updated.
    return;
  }

  const nextVersionConfig = versionData.versions.find(([puppeteerVersion]) => {
    return puppeteerVersion === 'NEXT';
  });

  // If we have manually rolled Chrome but not yet released
  // We will have NEXT as value in the Map
  if (nextVersionConfig) {
    nextVersionConfig[1].chrome = newVersion;
    await saveVersionData(versionData);
    return;
  }

  versionData.versions.unshift([
    'NEXT',
    {
      chrome: newVersion,
      firefox: 'latest',
    },
  ]);

  const oldSemVer = new SemVer(oldVersion, true);
  const newSemVer = new SemVer(newVersion, true);

  if (newSemVer.compareMain(oldSemVer) !== 0) {
    const lastMaintainedSemVer = new SemVer(
      versionData.lastMaintainedVersion.chrome,
      true
    );
    const newLastMaintainedMajor = lastMaintainedSemVer.major + 1;

    const nextMaintainedVersion = chromeVersions.find(version => {
      return new SemVer(version, true).major === newLastMaintainedMajor;
    });

    versionData.lastMaintainedVersion.chrome = nextMaintainedVersion;
  }

  await saveVersionData(versionData);
}

const {version, revision} = await getVersionAndRevisionForStable();

checkIfNeedsUpdate(CHROME_CURRENT_VERSION, version, revision);

await replaceInFile(
  './packages/puppeteer-core/src/revisions.ts',
  CHROME_CURRENT_VERSION,
  version
);

await updateVersionFileLastMaintained(CHROME_CURRENT_VERSION, version);
await updateDevToolsProtocolVersion(revision);

// Create new `package-lock.json` as we update devtools-protocol
execSync('npm install --ignore-scripts');
// Make sure we pass CI formatter check by running all the new files though it
await formatUpdateFiles();

// Keep this as they can be used to debug GitHub Actions if needed
actions.setOutput('version', version);
actions.setOutput('revision', revision);
