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
import {KnownDevices, BoundingBox} from 'puppeteer';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('Touchscreen', function () {
  setupTestBrowserHooks();

  it('should tap the button', async () => {
    const {page, server} = await getTestState();
    const iPhone = KnownDevices['iPhone 6']!;
    await page.emulate(iPhone);
    await page.goto(server.PREFIX + '/input/button.html');
    await page.tap('button');
    expect(
      await page.evaluate(() => {
        return (globalThis as any).result;
      })
    ).toBe('Clicked');
  });

  it('should report touches', async () => {
    const {page, server} = await getTestState();
    const iPhone = KnownDevices['iPhone 6']!;
    await page.emulate(iPhone);
    await page.goto(server.PREFIX + '/input/touches.html');
    using button = (await page.$('button'))!;
    await button.tap();
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toEqual(['Touchstart: 0', 'Touchend: 0']);
  });

  it('should report touchMove', async () => {
    const {page, server} = await getTestState();
    const iPhone = KnownDevices['iPhone 6']!;
    await page.emulate(iPhone);
    await page.goto(server.PREFIX + '/input/touches-move.html');
    using touch = (await page.$('#touch'))!;
    const touchObj = (await touch.boundingBox()) as BoundingBox;
    await page.touchscreen.touchStart(touchObj.x, touchObj.y);
    const movePosx = 100;
    const movePosy = 100;
    await page.touchscreen.touchMove(movePosx, movePosy);
    await page.touchscreen.touchEnd();
    expect(
      await page.evaluate(() => {
        return (globalThis as any).touchX;
      })
    ).toBe(movePosx);
    expect(
      await page.evaluate(() => {
        return (globalThis as any).touchY;
      })
    ).toBe(movePosy);
  });
});
