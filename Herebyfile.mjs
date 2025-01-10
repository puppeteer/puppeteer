/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/order */

import {readFile, writeFile} from 'fs/promises';

import versionData from './versions.json' with {type: 'json'};

import {docgen, spliceIntoSection} from '@puppeteer/docgen';
import {execa} from 'execa';
import {task} from 'hereby';
import semver from 'semver';

function addNoTocHeader(markdown) {
  return `---
hide_table_of_contents: true
---

${markdown}`;
}

/**
 * This logic should match the one in `website/docusaurus.config.js`.
 */
function getApiUrl(version) {
  if (semver.gte(version, '19.3.0')) {
    return `https://github.com/puppeteer/puppeteer/blob/puppeteer-${version}/docs/api/index.md`;
  } else if (semver.gte(version, '15.3.0')) {
    return `https://github.com/puppeteer/puppeteer/blob/${version}/docs/api/index.md`;
  } else {
    return `https://github.com/puppeteer/puppeteer/blob/${version}/docs/api.md`;
  }
}

export const docsNgSchematicsTask = task({
  name: 'docs:ng-schematics',
  run: async () => {
    const readme = await readFile('packages/ng-schematics/README.md', 'utf-8');
    await writeFile('docs/guides/ng-schematics.md', readme);
  },
});

export const docsBrowserSupportTask = task({
  name: 'docs:supported-browsers',
  run: async () => {
    const content = await readFile('docs/supported-browsers.md', {
      encoding: 'utf8',
    });
    // Create table view
    const buffer = [
      '| Puppeteer | Chrome | Firefox |',
      '| --------- | ------ | ------- |',
    ];
    for (const [puppeteerVersion, browserVersions] of versionData.versions) {
      if (puppeteerVersion === 'NEXT') {
        continue;
      }

      const puppeteerVer = `[Puppeteer ${puppeteerVersion}](${getApiUrl(
        puppeteerVersion,
      )})`;

      let firefoxVer = '';
      if (semver.gte(puppeteerVersion, '23.0.0')) {
        // Firefox pin need a prefix of `stable_` to be downloaded
        // For the user that is not relaxant on this page
        firefoxVer = `[Firefox](https://www.mozilla.org/en-US/firefox/) ${browserVersions.firefox.split('_').at(-1)}`;
      } else if (semver.gte(puppeteerVersion, '2.1.0')) {
        firefoxVer = `Firefox Nightly (at the time)`;
      } else {
        firefoxVer = `Firefox not supported`;
      }

      let chromeVer = '';
      if (semver.gte(puppeteerVersion, '20.0.0')) {
        chromeVer = `[Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) ${browserVersions.chrome}`;
      } else {
        chromeVer = `Chromium ${browserVersions.chrome}`;
      }

      buffer.push(`| ${puppeteerVer} | ${chromeVer} | ${firefoxVer} |`);
    }
    await writeFile(
      'docs/supported-browsers.md',
      spliceIntoSection('version', content, buffer.join('\n')),
    );
  },
});

export const docsTask = task({
  name: 'docs',
  dependencies: [docsNgSchematicsTask, docsBrowserSupportTask],
  run: async () => {
    // Copy main page.
    const mainPage = await readFile('README.md', 'utf-8');
    await writeFile('docs/index.md', addNoTocHeader(mainPage));

    // Generate documentation
    for (const [name, folder] of [
      ['browsers', 'browsers-api'],
      ['puppeteer', 'api'],
    ]) {
      docgen(`docs/${name}.api.json`, `docs/${folder}`);
    }

    // Update main @puppeteer/browsers page.
    const readme = await readFile('packages/browsers/README.md', 'utf-8');
    const index = await readFile('docs/browsers-api/index.md', 'utf-8');
    await writeFile(
      'docs/browsers-api/index.md',
      index.replace('# API Reference', readme),
    );

    // Copy combined changelog.
    let changelog = await readFile('CHANGELOG.md', 'utf-8');
    // Escape for MDX.
    changelog = changelog.replaceAll('{', '\\{');
    await writeFile('docs/CHANGELOG.md', changelog);

    // Format everything.
    await execa('prettier', ['--ignore-path', 'none', '--write', 'docs']);
  },
});
