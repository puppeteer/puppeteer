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

module.exports.addTests = function({testRunner, expect, product}) {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  const FFOX = product === 'firefox';
  const CHROME = product === 'chromium';

  describe('Hover', function() {
    it('should trigger hover state', async({page, server}) => {
      await page.goto(server.PREFIX + '/input/scrollable.html');
      await page.hover('#button-6');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-6');
      await page.hover('#button-2');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-2');
      await page.hover('#button-91');
      expect(await page.evaluate(() => document.querySelector('button:hover').id)).toBe('button-91');
    });
  });
};

