/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {Deferred} from '../util/Deferred.js';
import {createFunction} from '../util/Function.js';

import * as ARIAQuerySelector from './ARIAQuerySelector.js';
import * as CustomQuerySelectors from './CustomQuerySelector.js';
import * as PierceQuerySelector from './PierceQuerySelector.js';
import {IntervalPoller, MutationPoller, RAFPoller} from './Poller.js';
import * as PQuerySelector from './PQuerySelector.js';
import {
  createTextContent,
  isSuitableNodeForTextMatching,
} from './TextContent.js';
import * as TextQuerySelector from './TextQuerySelector.js';
import * as util from './util.js';
import * as XPathQuerySelector from './XPathQuerySelector.js';

/**
 * @internal
 */
const PuppeteerUtil = Object.freeze({
  ...ARIAQuerySelector,
  ...CustomQuerySelectors,
  ...PierceQuerySelector,
  ...PQuerySelector,
  ...TextQuerySelector,
  ...util,
  ...XPathQuerySelector,
  Deferred,
  createFunction,
  createTextContent,
  IntervalPoller,
  isSuitableNodeForTextMatching,
  MutationPoller,
  RAFPoller,
});

/**
 * @internal
 */
type PuppeteerUtil = typeof PuppeteerUtil;

/**
 * @internal
 */
export default PuppeteerUtil;
