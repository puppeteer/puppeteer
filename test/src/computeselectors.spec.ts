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

import expect from 'expect';
import {MAIN_WORLD} from '../../lib/cjs/puppeteer/common/IsolatedWorld.js';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';

describe('Selector computation tests', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  describe('for text selectors', () => {
    it('should compute text selectors correctly.', async () => {
      const {page} = getTestState();

      // Each element is a list of `a`s. Since `computeTextSelector` performs
      // binary search only on the front slice, the selector should be the
      // smallest number of `a`s that that make the selector unique.
      await page.setContent(
        `<div>${'a'.repeat(7)}</div><div>${'a'.repeat(
          9
        )}</div><div id="to-be-computed">${'a'.repeat(5)}<div>${'a'.repeat(
          10
        )}</div>${'a'.repeat(4)}</div>`
      );

      const selector = await page.evaluate(({computeTextSelector}) => {
        return computeTextSelector(document.getElementById('to-be-computed')!);
      }, await page.mainFrame().worlds[MAIN_WORLD].puppeteerUtil);

      // Since to-be-computed has the most amount of `a`s, it just needs to have
      // one more than every other element which computes to 11.
      expect(selector).toBe('a'.repeat(11));

      // Make sure the inverse operation works!
      const element = await page.$(`text/${selector}`);
      await expect(
        element?.evaluate(e => {
          return e.id;
        })
      ).resolves.toBe('to-be-computed');
    });
  });
});
