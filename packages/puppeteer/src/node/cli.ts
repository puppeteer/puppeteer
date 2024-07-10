#!/usr/bin/env node

/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {CLI, Browser} from '@puppeteer/browsers';
import {PUPPETEER_REVISIONS} from 'puppeteer-core/internal/revisions.js';

import puppeteer from '../puppeteer.js';

const cacheDir = puppeteer.configuration.cacheDirectory!;

void new CLI({
  cachePath: cacheDir,
  scriptName: 'puppeteer',
  prefixCommand: {
    cmd: 'browsers',
    description: 'Manage browsers of this Puppeteer installation',
  },
  allowCachePathOverride: false,
  pinnedBrowsers: {
    [Browser.CHROME]:
      puppeteer.configuration.browserRevision ||
      PUPPETEER_REVISIONS['chrome'] ||
      'latest',
    [Browser.FIREFOX]:
      puppeteer.configuration.browserRevision ||
      PUPPETEER_REVISIONS['firefox'] ||
      'latest',
    [Browser.CHROMEHEADLESSSHELL]:
      puppeteer.configuration.browserRevision ||
      PUPPETEER_REVISIONS['chrome-headless-shell'] ||
      'latest',
  },
}).run(process.argv);
