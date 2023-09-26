/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
