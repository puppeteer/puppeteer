/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {readFile, writeFile} from 'fs/promises';
import {sync as glob} from 'glob';
import {join} from 'path';

const INCLUDED_FOLDERS = [];

const puppeteerTypes = join(__dirname, '..', 'src', 'types.ts');
const puppeteerCoreTypes = join(
  __dirname,
  '..',
  '..',
  'puppeteer-core',
  'src',
  'types.ts'
);

(async () => {
  let content = await readFile(puppeteerCoreTypes, 'utf-8');
  content = content.replace(/\.\//g, 'puppeteer-core/internal/');
  content = content.replace(
    "export * from 'puppeteer-core/internal/puppeteer-core.js';\n",
    ''
  );

  const sources = glob(
    `src/{@(${INCLUDED_FOLDERS.join('|')})/*.ts,!(types).ts}`,
    {cwd: join(__dirname, '..')}
  );
  for (const input of sources.map(source => {
    return `.${source.slice(3)}`;
  })) {
    content += `export * from '${input.replace('.ts', '.js')}';\n`;
  }

  await writeFile(puppeteerTypes, content);
})();
