/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/order */

import {readFile, writeFile} from 'node:fs/promises';

import versionData from './versions.json' with {type: 'json'};

import {docgen, spliceIntoSection} from '@puppeteer/docgen';
import {execa} from 'execa';
import {task} from 'hereby';

import {generateSupportedBrowsersTable} from './tools/generate-supported-browsers.ts';

function addNoTocHeader(markdown) {
  return `---
hide_table_of_contents: true
---

${markdown}`;
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
    await writeFile(
      'docs/supported-browsers.md',
      spliceIntoSection(
        'version',
        content,
        generateSupportedBrowsersTable(versionData),
      ),
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

    // Format everything.
    await execa('prettier', ['--ignore-path', 'none', '--write', 'docs']);
  },
});
