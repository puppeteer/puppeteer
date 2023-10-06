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

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

declare const allEvents: Array<{type: string}>;

describe('Touchscreen', () => {
  setupTestBrowserHooks();

  describe('Touchscreen.prototype.tap', () => {
    it('should work', async () => {
      const {page, server, isHeadless} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      await page.tap('button');
      expect(
        (
          await page.evaluate(() => {
            return allEvents;
          })
        ).filter(({type}) => {
          return type !== 'pointermove' || isHeadless;
        })
      ).toMatchObject([
        {height: 1, type: 'pointerdown', width: 1, x: 5, y: 5},
        {touches: [[5, 5, 0.5, 0.5]], type: 'touchstart'},
        {height: 1, type: 'pointerup', width: 1, x: 5, y: 5},
        {touches: [[5, 5, 0.5, 0.5]], type: 'touchend'},
        {height: 1, type: 'click', width: 1, x: 5, y: 5},
      ]);
    });
  });

  describe('Touchscreen.prototype.touchMove', () => {
    it('should work', async () => {
      const {page, server, isHeadless} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      await page.touchscreen.touchStart(0, 0);
      await page.touchscreen.touchMove(10, 10);
      await page.touchscreen.touchMove(15.5, 15);
      await page.touchscreen.touchMove(20, 20.4);
      await page.touchscreen.touchMove(40, 30);
      await page.touchscreen.touchEnd();
      expect(
        (
          await page.evaluate(() => {
            return allEvents;
          })
        ).filter(({type}) => {
          return type !== 'pointermove' || isHeadless;
        })
      ).toMatchObject(
        [
          {type: 'pointerdown', x: 0, y: 0, width: 1, height: 1},
          {type: 'touchstart', touches: [[0, 0, 0.5, 0.5]]},
          {type: 'pointermove', x: 10, y: 10, width: 1, height: 1},
          {type: 'touchmove', touches: [[10, 10, 0.5, 0.5]]},
          {type: 'pointermove', x: 16, y: 15, width: 1, height: 1},
          {type: 'touchmove', touches: [[16, 15, 0.5, 0.5]]},
          {type: 'pointermove', x: 20, y: 20, width: 1, height: 1},
          {type: 'touchmove', touches: [[20, 20, 0.5, 0.5]]},
          {type: 'pointermove', x: 40, y: 30, width: 1, height: 1},
          {type: 'touchmove', touches: [[40, 30, 0.5, 0.5]]},
          {type: 'pointerup', x: 40, y: 30, width: 1, height: 1},
          {type: 'touchend', touches: [[40, 30, 0.5, 0.5]]},
        ].filter(({type}) => {
          return type !== 'pointermove' || isHeadless;
        })
      );
    });
  });
});
