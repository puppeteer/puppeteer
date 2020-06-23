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

import { initializePuppeteer } from './initialize';
import * as path from 'path';

const puppeteer = initializePuppeteer({
  packageJson: require(path.join(__dirname, '..', 'package.json')),
  rootDirectory: path.join(__dirname, '..'),
});

/*
 * Has to be CJS here rather than ESM such that the output file ends with
 * module.exports = puppeteer.
 *
 * If this was export default puppeteer the output would be:
 * exports.default = puppeteer
 * And therefore consuming via require('puppeteer') would break / require the user
 * to access require('puppeteer').default;
 */
export = puppeteer;
