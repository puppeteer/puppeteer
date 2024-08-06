/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './index.js';

import fs from 'fs';
import path from 'path';

import {environment} from './environment.js';
import {PuppeteerNode} from './node/PuppeteerNode.js';
import {ScreenRecorder} from './node/ScreenRecorder.js';

// Set up Node-specific environment dependencies.
environment.value = {
  fs,
  path,
  ScreenRecorder,
};
/**
 * @public
 */
const puppeteer = new PuppeteerNode({
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
