/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Set up Node-specific environment dependencies before importing other modules.
import './node-env-setup.js';

export * from './index.js';

import * as Puppeteer from './index.js';

/**
 * @public
 */
const puppeteer = new Puppeteer.PuppeteerNode({
  isPuppeteerCore: true,
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
} = puppeteer;

export default puppeteer;
