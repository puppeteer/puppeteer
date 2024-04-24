/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {KnownDevices, PredefinedNetworkConditions} from 'puppeteer';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

const iPhone = KnownDevices['iPhone 6'];
const iPhoneLandscape = KnownDevices['iPhone 6 landscape'];

describe('Emulation', () => {
  setupTestBrowserHooks();

  describe('Page.viewport', function () {
    it('should get the proper viewport size', async () => {
      const {page} = await getTestState();

      expect(page.viewport()).toEqual({width: 800, height: 600});
      await page.setViewport({width: 123, height: 456});
      expect(page.viewport()).toEqual({width: 123, height: 456});
    });
    it('should support mobile emulation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      expect(
        await page.evaluate(() => {
          return window.innerWidth;
        })
      ).toBe(800);
      await page.setViewport(iPhone.viewport);
      expect(
        await page.evaluate(() => {
          return window.innerWidth;
        })
      ).toBe(375);
      await page.setViewport({width: 400, height: 300});
      expect(
        await page.evaluate(() => {
          return window.innerWidth;
        })
      ).toBe(400);
    });
    it('should support touch emulation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      expect(
        await page.evaluate(() => {
          return 'ontouchstart' in window;
        })
      ).toBe(false);
      await page.setViewport(iPhone.viewport);
      expect(
        await page.evaluate(() => {
          return 'ontouchstart' in window;
        })
      ).toBe(true);
      expect(await page.evaluate(dispatchTouch)).toBe('Received touch');
      await page.setViewport({width: 100, height: 100});
      expect(
        await page.evaluate(() => {
          return 'ontouchstart' in window;
        })
      ).toBe(false);

      function dispatchTouch() {
        let fulfill!: (value: string) => void;
        const promise = new Promise(x => {
          fulfill = x;
        });
        window.ontouchstart = () => {
          fulfill('Received touch');
        };
        window.dispatchEvent(new Event('touchstart'));

        fulfill('Did not receive touch');

        return promise;
      }
    });
    it('should be detectable by Modernizr', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/detect-touch.html');
      expect(
        await page.evaluate(() => {
          return document.body.textContent!.trim();
        })
      ).toBe('NO');
      await page.setViewport(iPhone.viewport);
      await page.goto(server.PREFIX + '/detect-touch.html');
      expect(
        await page.evaluate(() => {
          return document.body.textContent!.trim();
        })
      ).toBe('YES');
    });
    it('should detect touch when applying viewport with touches', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 800, height: 600, hasTouch: true});
      await page.addScriptTag({url: server.PREFIX + '/modernizr.js'});
      expect(
        await page.evaluate(() => {
          return (globalThis as any).Modernizr.touchevents;
        })
      ).toBe(true);
    });
    it('should support landscape emulation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      expect(
        await page.evaluate(() => {
          return screen.orientation.type;
        })
      ).toBe('portrait-primary');
      await page.setViewport(iPhoneLandscape.viewport);
      expect(
        await page.evaluate(() => {
          return screen.orientation.type;
        })
      ).toBe('landscape-primary');
      await page.setViewport({width: 100, height: 100});
      expect(
        await page.evaluate(() => {
          return screen.orientation.type;
        })
      ).toBe('portrait-primary');
    });
    it('should update media queries when resoltion changes', async () => {
      const {page, server} = await getTestState();

      async function getFontSize() {
        return await page.evaluate(() => {
          return parseInt(
            window.getComputedStyle(document.querySelector('p')!).fontSize,
            10
          );
        });
      }

      for (const dpr of [1, 2, 3]) {
        await page.setViewport({
          width: 800,
          height: 600,
          deviceScaleFactor: dpr,
        });

        await page.goto(server.PREFIX + '/resolution.html');

        await expect(getFontSize()).resolves.toEqual(dpr);

        const screenshot = await page.screenshot({
          fullPage: false,
        });
        expect(screenshot).toBeGolden(`device-pixel-ratio${dpr}.png`);
      }
    });
    it('should load correct pictures when emulation dpr', async () => {
      const {page, server} = await getTestState();

      async function getCurrentSrc() {
        return await page.evaluate(() => {
          return document.querySelector('img')!.currentSrc;
        });
      }

      for (const dpr of [1, 2, 3]) {
        await page.setViewport({
          width: 800,
          height: 600,
          deviceScaleFactor: dpr,
        });

        await page.goto(server.PREFIX + '/picture.html');

        await expect(getCurrentSrc()).resolves.toMatch(
          new RegExp(`logo-${dpr}x.png`)
        );
      }
    });
  });

  describe('Page.emulate', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      await page.emulate(iPhone);
      expect(
        await page.evaluate(() => {
          return window.innerWidth;
        })
      ).toBe(375);
      expect(
        await page.evaluate(() => {
          return navigator.userAgent;
        })
      ).toContain('iPhone');
    });
    it('should support clicking', async () => {
      const {page, server} = await getTestState();

      await page.emulate(iPhone);
      await page.goto(server.PREFIX + '/input/button.html');
      using button = (await page.$('button'))!;
      await page.evaluate(button => {
        return (button.style.marginTop = '200px');
      }, button);
      await button.click();
      expect(
        await page.evaluate(() => {
          return (globalThis as any).result;
        })
      ).toBe('Clicked');
    });
  });

  describe('Page.emulateMediaType', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      expect(
        await page.evaluate(() => {
          return matchMedia('screen').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('print').matches;
        })
      ).toBe(false);
      await page.emulateMediaType('print');
      expect(
        await page.evaluate(() => {
          return matchMedia('screen').matches;
        })
      ).toBe(false);
      expect(
        await page.evaluate(() => {
          return matchMedia('print').matches;
        })
      ).toBe(true);
      await page.emulateMediaType();
      expect(
        await page.evaluate(() => {
          return matchMedia('screen').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('print').matches;
        })
      ).toBe(false);
    });
    it('should throw in case of bad argument', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page.emulateMediaType('bad').catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toBe('Unsupported media type: bad');
    });
  });

  describe('Page.emulateMediaFeatures', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.emulateMediaFeatures([
        {name: 'prefers-reduced-motion', value: 'reduce'},
      ]);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-reduced-motion: reduce)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-reduced-motion: no-preference)').matches;
        })
      ).toBe(false);
      await page.emulateMediaFeatures([
        {name: 'prefers-color-scheme', value: 'light'},
      ]);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: light)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: dark)').matches;
        })
      ).toBe(false);
      await page.emulateMediaFeatures([
        {name: 'prefers-color-scheme', value: 'dark'},
      ]);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: dark)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: light)').matches;
        })
      ).toBe(false);
      await page.emulateMediaFeatures([
        {name: 'prefers-reduced-motion', value: 'reduce'},
        {name: 'prefers-color-scheme', value: 'light'},
      ]);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-reduced-motion: reduce)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-reduced-motion: no-preference)').matches;
        })
      ).toBe(false);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: light)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: dark)').matches;
        })
      ).toBe(false);
      await page.emulateMediaFeatures([{name: 'color-gamut', value: 'srgb'}]);
      expect(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: p3)').matches;
        })
      ).toBe(false);
      expect(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: srgb)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: rec2020)').matches;
        })
      ).toBe(false);
      await page.emulateMediaFeatures([{name: 'color-gamut', value: 'p3'}]);
      expect(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: p3)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: srgb)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: rec2020)').matches;
        })
      ).toBe(false);
      await page.emulateMediaFeatures([
        {name: 'color-gamut', value: 'rec2020'},
      ]);
      expect(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: p3)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: srgb)').matches;
        })
      ).toBe(true);
      expect(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: rec2020)').matches;
        })
      ).toBe(true);
    });
    it('should throw in case of bad argument', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .emulateMediaFeatures([{name: 'bad', value: ''}])
        .catch(error_ => {
          return (error = error_);
        });
      expect(error.message).toBe('Unsupported media feature: bad');
    });
  });

  describe('Page.emulateTimezone', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.evaluate(() => {
        (globalThis as any).date = new Date(1479579154987);
      });
      await page.emulateTimezone('America/Jamaica');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        })
      ).toBe('Sat Nov 19 2016 13:12:34 GMT-0500 (Eastern Standard Time)');

      await page.emulateTimezone('Pacific/Honolulu');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        })
      ).toBe(
        'Sat Nov 19 2016 08:12:34 GMT-1000 (Hawaii-Aleutian Standard Time)'
      );

      await page.emulateTimezone('America/Buenos_Aires');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        })
      ).toBe('Sat Nov 19 2016 15:12:34 GMT-0300 (Argentina Standard Time)');

      await page.emulateTimezone('Europe/Berlin');
      expect(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        })
      ).toBe(
        'Sat Nov 19 2016 19:12:34 GMT+0100 (Central European Standard Time)'
      );
    });

    it('should throw for invalid timezone IDs', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page.emulateTimezone('Foo/Bar').catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toBe('Invalid timezone ID: Foo/Bar');
      await page.emulateTimezone('Baz/Qux').catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toBe('Invalid timezone ID: Baz/Qux');
    });
  });

  describe('Page.emulateVisionDeficiency', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 500, height: 500});
      await page.goto(server.PREFIX + '/grid.html');

      {
        await page.emulateVisionDeficiency('none');
        const screenshot = await page.screenshot();
        expect(screenshot).toBeGolden('screenshot-sanity.png');
      }

      {
        await page.emulateVisionDeficiency('achromatopsia');
        const screenshot = await page.screenshot();
        expect(screenshot).toBeGolden('vision-deficiency-achromatopsia.png');
      }

      {
        await page.emulateVisionDeficiency('blurredVision');
        const screenshot = await page.screenshot();
        expect(screenshot).toBeGolden('vision-deficiency-blurredVision.png');
      }

      {
        await page.emulateVisionDeficiency('deuteranopia');
        const screenshot = await page.screenshot();
        expect(screenshot).toBeGolden('vision-deficiency-deuteranopia.png');
      }

      {
        await page.emulateVisionDeficiency('protanopia');
        const screenshot = await page.screenshot();
        expect(screenshot).toBeGolden('vision-deficiency-protanopia.png');
      }

      {
        await page.emulateVisionDeficiency('tritanopia');
        const screenshot = await page.screenshot();
        expect(screenshot).toBeGolden('vision-deficiency-tritanopia.png');
      }

      {
        await page.emulateVisionDeficiency('none');
        const screenshot = await page.screenshot();
        expect(screenshot).toBeGolden('screenshot-sanity.png');
      }
    });

    it('should throw for invalid vision deficiencies', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        // @ts-expect-error deliberately passing invalid deficiency
        .emulateVisionDeficiency('invalid')
        .catch(error_ => {
          return (error = error_);
        });
      expect(error.message).toBe('Unsupported vision deficiency: invalid');
    });
  });

  describe('Page.emulateNetworkConditions', function () {
    it('should change navigator.connection.effectiveType', async () => {
      const {page} = await getTestState();

      const slow3G = PredefinedNetworkConditions['Slow 3G']!;
      const fast3G = PredefinedNetworkConditions['Fast 3G']!;

      expect(
        await page.evaluate('window.navigator.connection.effectiveType')
      ).toBe('4g');
      await page.emulateNetworkConditions(fast3G);
      expect(
        await page.evaluate('window.navigator.connection.effectiveType')
      ).toBe('3g');
      await page.emulateNetworkConditions(slow3G);
      expect(
        await page.evaluate('window.navigator.connection.effectiveType')
      ).toBe('2g');
      await page.emulateNetworkConditions(null);
    });
  });

  describe('Page.emulateCPUThrottling', function () {
    it('should change the CPU throttling rate successfully', async () => {
      const {page} = await getTestState();

      await page.emulateCPUThrottling(100);
      await page.emulateCPUThrottling(null);
    });
  });
});
