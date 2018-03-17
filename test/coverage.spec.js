/**
 * Copyright 2018 Google Inc. All rights reserved.
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

const {helper} = require('../lib/helper');

module.exports.addTests = function({
  describe, xdescribe, fdescribe, it, fit, xit, beforeAll, beforeEach, afterAll, afterEach
}, expect, defaultBrowserOptions, puppeteer, PROJECT_ROOT) {

  if (process.env.COVERAGE) {
    describe('COVERAGE', function(){
      const coverage = helper.publicAPICoverage();
      const disabled = new Set(['page.bringToFront']);
      if (!defaultBrowserOptions.headless)
        disabled.add('page.pdf');

      for (const method of coverage.keys()) {
        (disabled.has(method) ? xit : it)(`public api '${method}' should be called`, async({page, server}) => {
          expect(coverage.get(method)).toBe(true);
        });
      }
    });
  }
};