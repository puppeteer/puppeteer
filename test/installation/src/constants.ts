/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
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
export const EXAMPLES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'examples'
);
