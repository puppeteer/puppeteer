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

import {dirname, join, resolve} from 'path';
import {fileURLToPath} from 'url';

import {globSync} from 'glob';

export const PUPPETEER_CORE_PACKAGE_PATH = resolve(
  globSync('puppeteer-core-*.tgz')[0]!
);
export const PUPPETEER_BROWSERS_PACKAGE_PATH = resolve(
  globSync('puppeteer-browsers-[0-9]*.tgz')[0]!
);
export const PUPPETEER_PACKAGE_PATH = resolve(
  globSync('puppeteer-[0-9]*.tgz')[0]!
);
export const ASSETS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'assets'
);
