/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/order */

import {readFile, writeFile} from 'fs/promises';

import versionData from './versions.json' assert {type: 'json'};

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
    const buffer = [];
    for (const [puppeteerVersion, browserVersions] of versionData.versions) {
      if (puppeteerVersion === 'NEXT') {
        continue;
      }
      // TODO: add Firefox.
      if (semver.gte(puppeteerVersion, '20.0.0')) {
        buffer.push(
          `  * [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) ${browserVersions.chrome} - [Puppeteer ${puppeteerVersion}](${getApiUrl(
            puppeteerVersion
          )})`
        );
      } else {
        buffer.push(
          `  * Chromium ${browserVersions.chrome} - [Puppeteer ${puppeteerVersion}](${getApiUrl(
            puppeteerVersion
          )})`
        );
      }
    }
    await writeFile(
      'docs/supported-browsers.md',
      spliceIntoSection('version', content, buffer.join('\n'))
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
      index.replace('# API Reference', readme)
    );

    // Format everything.
    await execa('prettier', ['--ignore-path', 'none', '--write', 'docs']);
  },
});
