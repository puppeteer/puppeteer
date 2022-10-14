// Copyright 2022 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @type {import('mocha').MochaOptions}
 */
module.exports = {
  spec: ['build/**/*.spec.js'],
  timeout: '240000ms',
  // Parallel processing fails on other package managers due to caching.
  parallel: (process.env['PKG_MANAGER'] ?? 'npm') === 'npm',
};
