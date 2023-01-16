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
import { BoundingBox } from 'puppeteer';
import { KnownDevices } from 'puppeteer';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
} from './mocha-utils.js';

describe('Touchscreen', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  it('should tap the button', async () => {
    const { page, server } = getTestState();
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
    const { page, server } = getTestState();
    const iPhone = KnownDevices['iPhone 6']!;
    await page.emulate(iPhone);
    await page.goto(server.PREFIX + '/input/touches.html');
    const button = (await page.$('button'))!;
    await button.tap();
    expect(
      await page.evaluate(() => {
        return (globalThis as any).getResult();
      })
    ).toEqual(['Touchstart: 0', 'Touchend: 0']);
  });

  it.only('should report drag', async () => {
    const { page, server } = getTestState();
    const iPhone = KnownDevices['iPhone 6']!;
    await page.emulate(iPhone);
    await page.goto(server.PREFIX + '/input/touches-drag-and-drop.html');
    await page.setViewport({
      width: KnownDevices['iPhone 6'].viewport.width,
      height: KnownDevices['iPhone 6'].viewport.height,
      isMobile: true,
      hasTouch: true,
    });
    const draggable = (await page.$('#drag'))!;
    const dropzone = (await page.$('#drop'))!;
    let dragObj = await draggable.boundingBox() as BoundingBox;
    let dropObj = await dropzone.boundingBox() as BoundingBox;
    let dragPosx = dragObj.x + dragObj.width / 2;
    let dragPosy = dragObj.y + dragObj.height / 2;
    let dropPosx = dropObj.x + dropObj.width / 2;
    let dropPosy = dropObj.y + dropObj.height / 2;
    await page.touchscreen.drag({ x: dragPosx, y: dragPosy }, { x: dropPosx, y: dropPosy })
    expect(
      await page.evaluate(() => {
        return (globalThis as any).didDragStart;
      })
    ).toBe(true);
    expect(
      await page.evaluate(() => {
        return (globalThis as any).didDragEnter;
      })
    ).toBe(true);
    expect(
      await page.evaluate(() => {
        return (globalThis as any).didDragOver;
      })
    ).toBe(true);
    expect(
      await page.evaluate(() => {
        return (globalThis as any).didDrop;
      })
    ).toBe(true);
  });


});
