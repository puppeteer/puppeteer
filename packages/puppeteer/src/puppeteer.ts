/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export * from 'puppeteer-core';

import {PuppeteerNode} from 'puppeteer-core';

import {getConfiguration} from './getConfiguration.js';

const configuration = getConfiguration();

/**
 * @public
 */
// @ts-expect-error using internal API.
const puppeteer = new PuppeteerNode({
  isPuppeteerCore: false,
  configuration,
});

export const {connect, defaultArgs, executablePath, launch, trimCache} =
  puppeteer;

export default puppeteer;
