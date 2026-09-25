/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {statSync} from 'node:fs';

import {assert} from 'chai';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';
import {assertRejects, getUniqueVideoFilePlaceholder} from '../utils.js';

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

      assert.isAbove(statSync(file.filename).size, 0);
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
      assert.isAbove(ratio, 2 - DELTA);
      assert.isBelow(ratio, 2 + DELTA);
    });
    it('should validate options', async () => {
      const {page} = await getTestState();

      await assertRejects(page.screencast({scale: 0}));
      await assertRejects(page.screencast({scale: -1}));

      await assertRejects(page.screencast({speed: 0}));
      await assertRejects(page.screencast({speed: -1}));

      await assertRejects(
        page.screencast({crop: {x: 0, y: 0, height: 1, width: 0}}),
      );
      await assertRejects(
        page.screencast({crop: {x: 0, y: 0, height: 0, width: 1}}),
      );
      await assertRejects(
        page.screencast({crop: {x: -1, y: 0, height: 1, width: 1}}),
      );
      await assertRejects(
        page.screencast({crop: {x: 0, y: -1, height: 1, width: 1}}),
      );
      await assertRejects(
        page.screencast({crop: {x: 0, y: 0, height: 10000, width: 1}}),
      );
      await assertRejects(
        page.screencast({crop: {x: 0, y: 0, height: 1, width: 10000}}),
      );

      await assertRejects(page.screencast({format: 'gif'}));
      await assertRejects(page.screencast({format: 'webm'}));
      await assertRejects(page.screencast({format: 'mp4'}));

      await assertRejects(page.screencast({fps: 0}));
      await assertRejects(page.screencast({fps: -1}));

      await assertRejects(page.screencast({loop: 0}));
      await assertRejects(page.screencast({loop: -1}));
      await assertRejects(page.screencast({loop: Infinity}));

      await assertRejects(page.screencast({delay: 0}));
      await assertRejects(page.screencast({delay: -1}));

      await assertRejects(page.screencast({quality: 0}));
      await assertRejects(page.screencast({quality: -1}));

      await assertRejects(page.screencast({colors: 0}));
      await assertRejects(page.screencast({colors: -1}));

      await assertRejects(page.screencast({path: 'test.webm'}));

      await assertRejects(page.screencast({overwrite: true}));
      await assertRejects(page.screencast({overwrite: false}));

      await assertRejects(page.screencast({ffmpegPath: 'non-existent-path'}));
    });
  });
});
