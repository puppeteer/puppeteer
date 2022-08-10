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

import {readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {chdir} from 'process';
import semver from 'semver';
import {versionsPerRelease} from '../versions.js';
import versionsArchived from '../website/versionsArchived.json';

// eslint-disable-next-line import/extensions
import {generateDocs} from './internal/custom_markdown_action';

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

// Change to root directory
chdir(join(__dirname, '..'));

// README
{
  const content = readFileSync('README.md', 'utf-8');
  const sectionContent = `
 ---
 sidebar_position: 1
 ---

 `;
  writeFileSync('docs/index.md', sectionContent + content);
}

// Chrome Versions
{
  const filename = 'docs/chromium-support.md';
  let content = readFileSync(filename, {encoding: 'utf8'});

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

  writeFileSync(filename, content);
}

// Generate documentation
generateDocs('docs/puppeteer.api.json', 'docs/api');
