/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './index-browser.js';

import {Puppeteer} from './common/Puppeteer.js';

// Set up browser-specific environment dependencies here.

/**
 * @public
 */
const puppeteer = new Puppeteer({
  isPuppeteerCore: true,
});

export const {
  /**
   * @public
   */
  connect,
} = puppeteer;

export default puppeteer;
