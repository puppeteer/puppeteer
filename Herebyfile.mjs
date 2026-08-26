/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {readFile, writeFile} from 'node:fs/promises';

import {docgen} from '@puppeteer/docgen';
import {execa} from 'execa';
import {task} from 'hereby';

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

export const docsTask = task({
  name: 'docs',
  dependencies: [docsNgSchematicsTask],
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
