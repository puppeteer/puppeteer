/**
 * Copyright 2020 Google Inc. All rights reserved.
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

const base = require('./base');

module.exports = {
  ...base,
  require: [
    './test/mocha-ts-require',
    './test/mocha-utils.ts',
    'source-map-support/register',
  ],
  spec: 'test/*.spec.ts',
  extension: ['js', 'ts'],
  retries: process.env.CI ? 2 : 0,
  parallel: !!process.env.PARALLEL,
  timeout: 25 * 1000,
  reporter: process.env.CI ? 'spec' : 'dot',
};
