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

let timeout = process.platform === 'win32' ? 20_000 : 10_000;
if (!!process.env.DEBUGGER_ATTACHED) {
  timeout = 0;
}
module.exports = {
  reporter: 'dot',
  logLevel: 'debug',
  require: ['./test/build/mocha-utils.js', 'source-map-support/register'],
  spec: 'test/build/**/*.spec.js',
  exit: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  parallel: !!process.env.PARALLEL,
  timeout: timeout,
  reporter: process.env.CI ? 'spec' : 'dot',
};
