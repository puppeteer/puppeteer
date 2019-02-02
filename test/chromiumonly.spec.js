/**
 * Copyright 2019 Google Inc. All rights reserved.
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
module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Chromium-specific tests', function() {
    describe('Browser.version', function() {
      xit('should return whether we are in headless', async({browser}) => {
        const version = await browser.version();
        expect(version.length).toBeGreaterThan(0);
        expect(version.startsWith('Headless')).toBe(headless);
      });
    });

    describe('Browser.userAgent', function() {
      it('should include WebKit', async({browser}) => {
        const userAgent = await browser.userAgent();
        expect(userAgent.length).toBeGreaterThan(0);
        expect(userAgent).toContain('WebKit');
      });
    });
  });
};

