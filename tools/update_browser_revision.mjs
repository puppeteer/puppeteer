/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execSync, exec} from 'child_process';
import {writeFile, readFile} from 'fs/promises';
import {promisify} from 'util';

import actions from '@actions/core';
import {resolveBuildId} from '@puppeteer/browsers';
import {SemVer} from 'semver';

import packageJson from '../packages/puppeteer-core/package.json' with {type: 'json'};
import versionData from '../versions.json' with {type: 'json'};

import {PUPPETEER_REVISIONS} from 'puppeteer-core/internal/revisions.js';

const execAsync = promisify(exec);

const BROWSER = process.env.BROWSER_TO_UPDATE;

if (!BROWSER) {
  console.error('No BROWSER_TO_UPDATE env variable supplied!');
  process.exit(1);
}

const BROWSER_CURRENT_VERSION = PUPPETEER_REVISIONS[BROWSER];

const touchedFiles = [];

function getCapitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 *
 * @param {string} version
 * @returns {string}
 */
function normalizeVersionForCommit(browser, version) {
  switch (browser) {
    case 'firefox':
      // Splits the prefix of `stable_` for Firefox
      return version.split('_').at(-1);
    case 'chrome':
      return version;
  }

  throw new Error(`Unrecognized browser ${browser}`);
}

/**
 *
 * @param {string} version
 * @returns {string}
 */
function normalizeVersionToSemVer(browser, version) {
  switch (browser) {
    case 'firefox':
      // Splits the prefix of `stable_` for Firefox
      version = version.split('_').at(-1);
      // Firefox reports 129.0 instead of 129.0.0
      // Patch have the correct number 128.0.2
      if (version.split('.').length <= 2) {
        return `${version}.0`;
      }

      return version;
    case 'chrome':
      // For Chrome (example: 127.0.6533.99) is allowed as SemVer
      // as long as we use the loose option.
      return version;
  }

  throw new Error(`Unrecognized browser ${browser}`);
}

function checkIfNeedsUpdate(browser, oldVersion, newVersion) {
  const oldSemVer = new SemVer(
    normalizeVersionToSemVer(browser, oldVersion),
    true,
  );
  const newSemVer = new SemVer(
    normalizeVersionToSemVer(browser, newVersion),
    true,
  );
  let message = `roll to ${getCapitalize(browser)} ${normalizeVersionForCommit(browser, newVersion)}`;

  if (newSemVer.compare(oldSemVer) <= 0) {
    // Exit the process without setting up version
    console.warn(
      `Version ${newVersion} is older or the same as the current ${oldVersion}`,
    );
    process.exit(0);
  } else if (newSemVer.major === oldSemVer.major) {
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
      return execAsync(`npx eslint --fix ${file}`);
    }),
  );
  await Promise.all(
    touchedFiles.map(file => {
      return execAsync(`npx prettier --write ${file}`);
    }),
  );
}

async function replaceInFile(filePath, search, replace) {
  const buffer = await readFile(filePath);
  const update = buffer.toString().replaceAll(search, replace);

  await writeFile(filePath, update);

  touchedFiles.push(filePath);
}

async function getVersionForStable(browser) {
  return await resolveBuildId(browser, 'linux', 'stable');
}

async function updateDevToolsProtocolVersion(browserVersion) {
  const result = await fetch(
    'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json',
  ).then(response => {
    return response.json();
  });

  const {version, revision} = result.channels['Stable'];
  if (browserVersion !== version) {
    console.error(
      'The version from CfT website and @puppeteer/browser mismatch.',
    );
    process.exit(1);
  }

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
    `"devtools-protocol": "${bestNewProtocol}"`,
  );

  await replaceInFile(
    './packages/puppeteer/package.json',
    `"devtools-protocol": "${currentProtocol}"`,
    `"devtools-protocol": "${bestNewProtocol}"`,
  );
}

async function saveVersionData() {
  await writeFile('./versions.json', JSON.stringify(versionData, null, 2));
  touchedFiles.push('./versions.json');
}

async function updateVersionData(browser, oldVersion, newVersion) {
  const browserVersions = versionData.versions.map(
    ([_puppeteerVersion, browserVersions]) => {
      return browserVersions[browser];
    },
  );
  if (browserVersions.indexOf(newVersion) !== -1) {
    // Already updated.
    return;
  }

  const nextVersionConfig = versionData.versions.find(([puppeteerVersion]) => {
    return puppeteerVersion === 'NEXT';
  });

  // If we have manually rolled Chrome but not yet released
  // We will have NEXT as value in the Map
  if (nextVersionConfig) {
    nextVersionConfig[1][browser] = newVersion;
    return;
  }

  versionData.versions.unshift([
    'NEXT',
    {
      ...versionData.versions.at(0).at(1),
      [browser]: newVersion,
    },
  ]);
}

async function updateLastMaintainedChromeVersion(oldVersion, newVersion) {
  const browserVersions = versionData.versions.map(
    ([_puppeteerVersion, browserVersions]) => {
      return browserVersions['chrome'];
    },
  );
  if (browserVersions.indexOf(newVersion) !== -1) {
    // Already updated.
    return;
  }

  const oldSemVer = new SemVer(oldVersion, true);
  const newSemVer = new SemVer(newVersion, true);

  if (newSemVer.compareMain(oldSemVer) !== 0) {
    const lastMaintainedSemVer = new SemVer(
      versionData.lastMaintainedChromeVersion,
      true,
    );
    const newLastMaintainedMajor = lastMaintainedSemVer.major + 1;

    const nextMaintainedVersion = browserVersions.find(version => {
      return new SemVer(version, true).major === newLastMaintainedMajor;
    });

    versionData.lastMaintainedChromeVersion = nextMaintainedVersion;
  }
}

const version = await getVersionForStable(BROWSER);

checkIfNeedsUpdate(BROWSER, BROWSER_CURRENT_VERSION, version);

await replaceInFile(
  './packages/puppeteer-core/src/revisions.ts',
  BROWSER_CURRENT_VERSION,
  version,
);

await updateVersionData(BROWSER, BROWSER_CURRENT_VERSION, version);

if (BROWSER === 'chrome') {
  await updateLastMaintainedChromeVersion(BROWSER_CURRENT_VERSION, version);
  await updateDevToolsProtocolVersion(version);
  // Create new `package-lock.json` as we update devtools-protocol
  execSync('npm install --ignore-scripts');
}

await saveVersionData();

// Make sure we pass CI formatter check by running all the new files though it
await formatUpdateFiles();

// Keep this as they can be used to debug GitHub Actions if needed
actions.setOutput('version', version);
