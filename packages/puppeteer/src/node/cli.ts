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
    [Browser.CHROME]: {
      buildId:
        puppeteer.configuration.browserRevision ||
        PUPPETEER_REVISIONS['chrome'] ||
        'latest',
      skipDownload: puppeteer.configuration.skipChromeDownload ?? false,
    },
    [Browser.FIREFOX]: {
      buildId:
        puppeteer.configuration.browserRevision ||
        PUPPETEER_REVISIONS['firefox'] ||
        'latest',
      skipDownload: true,
    },
    [Browser.CHROMEHEADLESSSHELL]: {
      buildId:
        puppeteer.configuration.browserRevision ||
        PUPPETEER_REVISIONS['chrome'] ||
        'latest',
      skipDownload:
        puppeteer.configuration.skipChromeHeadlessShellDownload ?? false,
    },
  },
}).run(process.argv);
