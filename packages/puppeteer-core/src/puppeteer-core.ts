/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export type {Protocol} from 'devtools-protocol';

export * from './api/api.js';
export * from './cdp/cdp.js';
export * from './common/common.js';
export * from './node/node.js';
export * from './revisions.js';
export * from './util/util.js';

/**
 * @deprecated Use the query handler API defined on {@link Puppeteer}
 */
export * from './common/CustomQueryHandler.js';

import {PuppeteerNode} from './node/PuppeteerNode.js';

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
