/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export type {Protocol} from 'puppeteer-core';

export * from 'puppeteer-core/internal/puppeteer-core.js';

import {PuppeteerNode} from 'puppeteer-core/internal/node/PuppeteerNode.js';

import {getConfiguration} from './getConfiguration.js';

const configuration = getConfiguration();

/**
 * @public
 */
const puppeteer = new PuppeteerNode({
  isPuppeteerCore: false,
  configuration,
});

export const {
  /**
   * @public
   */
  connect,
  /**
   * @public
   */
  defaultArgs,
  /**
   * @public
   */
  executablePath,
  /**
   * @public
   */
  launch,
  /**
   * @public
   */
  trimCache,
} = puppeteer;

export default puppeteer;
