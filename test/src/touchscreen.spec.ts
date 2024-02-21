/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

declare const allEvents: Array<{type: string}>;

describe('Touchscreen', () => {
  setupTestBrowserHooks();

  describe('Touchscreen.prototype.tap', () => {
    it('should work', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      await page.tap('button');
      expect(
        await page.evaluate(() => {
          return allEvents;
        })
      ).toMatchObject([
        {
          type: 'pointerdown',
          x: 5,
          y: 5,
          width: 1,
          height: 1,
          altitudeAngle: Math.PI / 2,
          azimuthAngle: 0,
          pressure: 0.5,
          pointerType: 'touch',
          twist: 0,
          tiltX: 0,
          tiltY: 0,
        },
        {
          type: 'touchstart',
          changedTouches: [
            {clientX: 5, clientY: 5, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 5, clientY: 5, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'pointerup',
          x: 5,
          y: 5,
          width: 1,
          height: 1,
          altitudeAngle: Math.PI / 2,
          azimuthAngle: 0,
          pressure: 0,
          pointerType: 'touch',
          twist: 0,
          tiltX: 0,
          tiltY: 0,
        },
        {
          type: 'touchend',
          changedTouches: [
            {clientX: 5, clientY: 5, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [],
        },
        {
          type: 'click',
          x: 5,
          y: 5,
          width: 1,
          height: 1,
          altitudeAngle: Math.PI / 2,
          azimuthAngle: 0,
          pressure: 0,
          pointerType: 'touch',
          twist: 0,
          tiltX: 0,
          tiltY: 0,
        },
      ]);
    });
  });

  describe('Touchscreen.prototype.touchMove', () => {
    it('should work', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      // Note that touchmoves are sometimes not triggered if consecutive
      // touchmoves are less than 15 pixels.
      //
      // See https://github.com/puppeteer/puppeteer/issues/10836
      await page.touchscreen.touchStart(0, 0);
      await page.touchscreen.touchMove(15, 15);
      await page.touchscreen.touchMove(30.5, 30);
      await page.touchscreen.touchMove(50, 45.4);
      await page.touchscreen.touchMove(80, 50);
      await page.touchscreen.touchEnd();

      expect(
        await page.evaluate(() => {
          return allEvents;
        })
      ).toMatchObject([
        {
          type: 'pointerdown',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          altitudeAngle: 1.5707963267948966,
          azimuthAngle: 0,
          pressure: 0.5,
          pointerType: 'touch',
          twist: 0,
          tiltX: 0,
          tiltY: 0,
        },
        {
          type: 'touchstart',
          changedTouches: [
            {clientX: 0, clientY: 0, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 0, clientY: 0, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'pointermove',
          x: 15,
          y: 15,
          width: 1,
          height: 1,
          altitudeAngle: 1.5707963267948966,
          azimuthAngle: 0,
          pressure: 0.5,
          pointerType: 'touch',
          twist: 0,
          tiltX: 0,
          tiltY: 0,
        },
        {
          type: 'touchmove',
          changedTouches: [
            {clientX: 15, clientY: 15, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 15, clientY: 15, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'pointermove',
          x: 31,
          y: 30,
          width: 1,
          height: 1,
          altitudeAngle: 1.5707963267948966,
          azimuthAngle: 0,
          pressure: 0.5,
          pointerType: 'touch',
          twist: 0,
          tiltX: 0,
          tiltY: 0,
        },
        {
          type: 'touchmove',
          changedTouches: [
            {clientX: 31, clientY: 30, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 31, clientY: 30, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'pointermove',
          x: 50,
          y: 45,
          width: 1,
          height: 1,
          altitudeAngle: 1.5707963267948966,
          azimuthAngle: 0,
          pressure: 0.5,
          pointerType: 'touch',
          twist: 0,
          tiltX: 0,
          tiltY: 0,
        },
        {
          type: 'touchmove',
          changedTouches: [
            {clientX: 50, clientY: 45, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 50, clientY: 45, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'pointermove',
          x: 80,
          y: 50,
          width: 1,
          height: 1,
          altitudeAngle: 1.5707963267948966,
          azimuthAngle: 0,
          pressure: 0.5,
          pointerType: 'touch',
          twist: 0,
          tiltX: 0,
          tiltY: 0,
        },
        {
          type: 'touchmove',
          changedTouches: [
            {clientX: 80, clientY: 50, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 80, clientY: 50, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'pointerup',
          x: 80,
          y: 50,
          width: 1,
          height: 1,
          altitudeAngle: 1.5707963267948966,
          azimuthAngle: 0,
          pressure: 0,
          pointerType: 'touch',
          twist: 0,
          tiltX: 0,
          tiltY: 0,
        },
        {
          type: 'touchend',
          changedTouches: [
            {clientX: 80, clientY: 50, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [],
        },
      ]);
    });
  });
});
