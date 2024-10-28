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
        }),
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

    it('should work if another touch is already active', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      await page.touchscreen.touchStart(100, 100);
      await page.tap('button');

      expect(
        await page.evaluate(() => {
          return allEvents;
        }),
      ).toMatchObject([
        {
          type: 'pointerdown',
          x: 100,
          y: 100,
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
            {
              clientX: 100,
              clientY: 100,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [
            {
              clientX: 100,
              clientY: 100,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
        },
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
            {
              clientX: 100,
              clientY: 100,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
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
          activeTouches: [
            {
              clientX: 100,
              clientY: 100,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
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
        }),
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

    it('should work with two touches', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      await page.touchscreen.touchStart(0, 0);
      await page.touchscreen.touchStart(30, 10);
      await page.touchscreen.touchMove(15, 15);

      expect(
        await page.evaluate(() => {
          return allEvents;
        }),
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
            {
              clientX: 0,
              clientY: 0,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [
            {
              clientX: 0,
              clientY: 0,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
        },
        {
          type: 'pointerdown',
          x: 30,
          y: 10,
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
            {
              clientX: 30,
              clientY: 10,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [
            {
              clientX: 0,
              clientY: 0,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
            {
              clientX: 30,
              clientY: 10,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
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
            {
              clientX: 15,
              clientY: 15,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [
            {
              clientX: 15,
              clientY: 15,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
            {
              clientX: 30,
              clientY: 10,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
        },
      ]);
    });

    it('should work when moving touches separately', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      const touch1 = await page.touchscreen.touchStart(20, 20);
      await touch1.move(50, 10);
      const touch2 = await page.touchscreen.touchStart(20, 50);
      await touch2.move(50, 50);
      await touch2.end();
      await touch1.end();

      expect(
        await page.evaluate(() => {
          return allEvents;
        }),
      ).toMatchObject([
        {
          type: 'pointerdown',
          x: 20,
          y: 20,
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
            {
              clientX: 20,
              clientY: 20,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [
            {
              clientX: 20,
              clientY: 20,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
        },
        {
          type: 'pointermove',
          x: 50,
          y: 10,
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
            {
              clientX: 50,
              clientY: 10,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [
            {
              clientX: 50,
              clientY: 10,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
        },
        {
          type: 'pointerdown',
          x: 20,
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
          type: 'touchstart',
          changedTouches: [
            {
              clientX: 20,
              clientY: 50,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [
            {
              clientX: 50,
              clientY: 10,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
            {
              clientX: 20,
              clientY: 50,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
        },
        {
          type: 'pointermove',
          x: 50,
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
            {
              clientX: 50,
              clientY: 50,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [
            {
              clientX: 50,
              clientY: 10,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
            {
              clientX: 50,
              clientY: 50,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
        },
        {
          type: 'pointerup',
          x: 50,
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
            {
              clientX: 50,
              clientY: 50,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [
            {
              clientX: 50,
              clientY: 10,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
        },
        {
          type: 'pointerup',
          x: 50,
          y: 10,
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
            {
              clientX: 50,
              clientY: 10,
              radiusX: 0.5,
              radiusY: 0.5,
              force: 0.5,
            },
          ],
          activeTouches: [],
        },
      ]);
    });

    it('should work with three touches', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      const touch1 = await page.touchscreen.touchStart(50, 50);
      await touch1.move(50, 100);
      await page.touchscreen.touchStart(20, 20);
      await touch1.end();
      const touch3 = await page.touchscreen.touchStart(20, 100);
      await touch3.move(60, 100);

      expect(
        await page.evaluate(() => {
          return allEvents;
        }),
      ).toMatchObject([
        {
          type: 'pointerdown',
          x: 50,
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
          type: 'touchstart',
          changedTouches: [
            {clientX: 50, clientY: 50, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 50, clientY: 50, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'pointermove',
          x: 50,
          y: 100,
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
            {clientX: 50, clientY: 100, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 50, clientY: 100, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'touchstart',
          changedTouches: [
            {clientX: 20, clientY: 20, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 50, clientY: 100, radiusX: 0.5, radiusY: 0.5, force: 0.5},
            {clientX: 20, clientY: 20, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'touchend',
          changedTouches: [
            {clientX: 50, clientY: 100, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 20, clientY: 20, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'touchstart',
          changedTouches: [
            {clientX: 20, clientY: 100, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 20, clientY: 20, radiusX: 0.5, radiusY: 0.5, force: 0.5},
            {clientX: 20, clientY: 100, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
        {
          type: 'touchmove',
          changedTouches: [
            {clientX: 60, clientY: 100, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
          activeTouches: [
            {clientX: 20, clientY: 20, radiusX: 0.5, radiusY: 0.5, force: 0.5},
            {clientX: 60, clientY: 100, radiusX: 0.5, radiusY: 0.5, force: 0.5},
          ],
        },
      ]);
    });

    it('should throw if no touch was started', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      await expect(async () => {
        await page.touchscreen.touchMove(15, 15);
      }).rejects.toThrow('Must start a new Touch first');
    });
  });

  describe('Touchscreen.prototype.touchEnd', () => {
    it('should throw when ending touch through Touchscreeen that was already ended', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.PREFIX + '/input/touchscreen.html');

      const touch = await page.touchscreen.touchStart(100, 100);
      await touch.move(50, 100);
      await touch.end();
      await expect(async () => {
        await page.touchscreen.touchEnd();
      }).rejects.toThrow('Must start a new Touch first');
    });
  });
});
