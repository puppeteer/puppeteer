/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export type {Protocol} from 'puppeteer-core';
export * from 'puppeteer-core';

import type {PuppeteerNode} from 'puppeteer-core';
import * as PuppeteerCore from 'puppeteer-core/internal/puppeteer-core.js';
import {getConfiguration} from './getConfiguration.js';

const configuration = getConfiguration();

/**
 * @public
 */
const puppeteer: PuppeteerNode = new PuppeteerCore.PuppeteerNode({
  isPuppeteerCore: false,
  configuration,
}) as unknown as PuppeteerNode;

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
