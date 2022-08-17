/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {readFile, writeFile} from 'fs/promises';
import rimraf from 'rimraf';
import semver from 'semver';
import {generateDocs} from './internal/custom_markdown_action';
import {job} from './internal/job';

function getOffsetAndLimit(
  sectionName: string,
  lines: string[]
): [offset: number, limit: number] {
  const offset =
    lines.findIndex(line => {
      return line.includes(`<!-- ${sectionName}-start -->`);
    }) + 1;
  const limit = lines.slice(offset).findIndex(line => {
    return line.includes(`<!-- ${sectionName}-end -->`);
  });
  return [offset, limit];
}

function spliceIntoSection(
  sectionName: string,
  content: string,
  sectionContent: string
): string {
  const lines = content.split('\n');
  const [offset, limit] = getOffsetAndLimit(sectionName, lines);
  lines.splice(offset, limit, ...sectionContent.split('\n'));
  return lines.join('\n');
}

(async () => {
  job('', async ({inputs, outputs}) => {
    const content = await readFile(inputs[0]!, 'utf-8');
    const sectionContent = `
---
sidebar_position: 1
---
`;
    await writeFile(outputs[0]!, sectionContent + content);
  })
    .inputs(['README.md'])
    .outputs(['docs/index.md'])
    .build();

  // Chrome Versions
  job('', async ({inputs, outputs}) => {
    let content = await readFile(outputs[0]!, {encoding: 'utf8'});
    const {versionsPerRelease} = await import(inputs[0]!);
    const versionsArchived = JSON.parse(await readFile(inputs[1]!, 'utf8'));

    // Generate versions
    const buffer: string[] = [];
    for (const [chromiumVersion, puppeteerVersion] of versionsPerRelease) {
      if (puppeteerVersion === 'NEXT') {
        continue;
      }
      if (versionsArchived.includes(puppeteerVersion.substring(1))) {
        buffer.push(
          `  * Chromium ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](https://github.com/puppeteer/puppeteer/blob/${puppeteerVersion}/docs/api/index.md)`
        );
      } else if (semver.lt(puppeteerVersion, '15.0.0')) {
        buffer.push(
          `  * Chromium ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](https://github.com/puppeteer/puppeteer/blob/${puppeteerVersion}/docs/api.md)`
        );
      } else if (semver.gte(puppeteerVersion, '15.3.0')) {
        buffer.push(
          `  * Chromium ${chromiumVersion} - [Puppeteer ${puppeteerVersion}](https://pptr.dev/${puppeteerVersion.slice(
            1
          )})`
        );
      } else {
        buffer.push(
          `  * Chromium ${chromiumVersion} - Puppeteer ${puppeteerVersion}`
        );
      }
    }
    content = spliceIntoSection('version', content, buffer.join('\n'));

    await writeFile(outputs[0]!, content);
  })
    .inputs(['versions.js', 'website/versionsArchived.json'])
    .outputs(['docs/chromium-support.md'])
    .build();

  // Generate documentation
  job('', async ({inputs, outputs}) => {
    rimraf.sync(outputs[0]!);
    generateDocs(inputs[0]!, outputs[0]!);
  })
    .inputs(['docs/puppeteer.api.json'])
    .outputs(['docs/api'])
    .build();
})();
