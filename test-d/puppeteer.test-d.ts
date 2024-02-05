/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {expectType} from 'tsd';

import puppeteer, {
  type connect,
  type defaultArgs,
  type executablePath,
  type launch,
} from 'puppeteer';

expectType<typeof launch>(puppeteer.launch);
expectType<typeof connect>(puppeteer.connect);
expectType<typeof defaultArgs>(puppeteer.defaultArgs);
expectType<typeof executablePath>(puppeteer.executablePath);
