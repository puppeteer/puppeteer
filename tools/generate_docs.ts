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

import {copyFile, readFile, rm, writeFile} from 'fs/promises';
import {join, resolve} from 'path';
import {chdir} from 'process';

import semver from 'semver';

import {generateDocs} from './internal/custom_markdown_action.js';
import {job} from './internal/job.js';
import {spawnAndLog} from './internal/util.js';

chdir(resolve(join(__dirname, '..')));

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
  const job1 = job('', async ({inputs, outputs}) => {
    await copyFile(inputs[0]!, outputs[0]!);
  })
    .inputs(['README.md'])
    .outputs(['docs/index.md'])
    .build();

  // Chrome Versions
  const job2 = job('', async ({inputs, outputs}) => {
    let content = await readFile(inputs[2]!, {encoding: 'utf8'});
    const versionModulePath = join('..', inputs[0]!);
    const {versionsPerRelease} = await import(versionModulePath);
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
    .inputs([
      'versions.js',
      'website/versionsArchived.json',
      'docs/chromium-support.md',
    ])
    .outputs(['docs/chromium-support.md'])
    .build();

  await Promise.all([job1, job2]);

  // Generate documentation
  job('', async ({inputs, outputs}) => {
    await rm(outputs[0]!, {recursive: true, force: true});
    generateDocs(inputs[0]!, outputs[0]!);
    spawnAndLog('prettier', '--ignore-path', 'none', '--write', 'docs');
  })
    .inputs([
      'docs/puppeteer.api.json',
      'tools/internal/custom_markdown_documenter.ts',
    ])
    .outputs(['docs/api'])
    .build();
})();
