/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {statSync} from 'fs';

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {getUniqueVideoFilePlaceholder} from './utils.js';

describe('Screencasts', function () {
  setupTestBrowserHooks();

  describe('Page.screencast', function () {
    it('should work', async () => {
      using file = getUniqueVideoFilePlaceholder();

      const {page} = await getTestState();

      const recorder = await page.screencast({
        path: file.filename,
        scale: 0.5,
        crop: {width: 100, height: 100, x: 0, y: 0},
        speed: 0.5,
      });

      await page.goto('data:text/html,<input>');
      using input = await page.locator('input').waitHandle();
      await input.type('ab', {delay: 100});

      await recorder.stop();

      expect(statSync(file.filename).size).toBeGreaterThan(0);
    });
    it('should work concurrently', async () => {
      using file1 = getUniqueVideoFilePlaceholder();
      using file2 = getUniqueVideoFilePlaceholder();

      const {page} = await getTestState();

      const recorder = await page.screencast({path: file1.filename});
      const recorder2 = await page.screencast({path: file2.filename});

      await page.goto('data:text/html,<input>');
      using input = await page.locator('input').waitHandle();

      await input.type('ab', {delay: 100});
      await recorder.stop();

      await input.type('ab', {delay: 100});
      await recorder2.stop();

      // Since file2 spent about double the time of file1 recording, so file2
      // should be around double the size of file1.
      const ratio =
        statSync(file2.filename).size / statSync(file1.filename).size;

      // We use a range because we cannot be precise.
      const DELTA = 1.3;
      expect(ratio).toBeGreaterThan(2 - DELTA);
      expect(ratio).toBeLessThan(2 + DELTA);
    });
    it('should validate options', async () => {
      const {page} = await getTestState();

      await expect(page.screencast({scale: 0})).rejects.toBeDefined();
      await expect(page.screencast({scale: -1})).rejects.toBeDefined();

      await expect(page.screencast({speed: 0})).rejects.toBeDefined();
      await expect(page.screencast({speed: -1})).rejects.toBeDefined();

      await expect(
        page.screencast({crop: {x: 0, y: 0, height: 1, width: 0}})
      ).rejects.toBeDefined();
      await expect(
        page.screencast({crop: {x: 0, y: 0, height: 0, width: 1}})
      ).rejects.toBeDefined();
      await expect(
        page.screencast({crop: {x: -1, y: 0, height: 1, width: 1}})
      ).rejects.toBeDefined();
      await expect(
        page.screencast({crop: {x: 0, y: -1, height: 1, width: 1}})
      ).rejects.toBeDefined();
      await expect(
        page.screencast({crop: {x: 0, y: 0, height: 10000, width: 1}})
      ).rejects.toBeDefined();
      await expect(
        page.screencast({crop: {x: 0, y: 0, height: 1, width: 10000}})
      ).rejects.toBeDefined();

      await expect(
        page.screencast({ffmpegPath: 'non-existent-path'})
      ).rejects.toBeDefined();
    });
  });
});
