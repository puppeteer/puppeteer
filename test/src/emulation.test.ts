/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {KnownDevices, PredefinedNetworkConditions} from 'puppeteer';

import {
  assertAtLeastOneToContain,
  getTestState,
  setupTestBrowserHooks,
} from './mocha-utils.js';
import {assertGolden} from './utils.js';

const iPhone = KnownDevices['iPhone 6'];
const iPhoneLandscape = KnownDevices['iPhone 6 landscape'];

describe('Emulation', () => {
  setupTestBrowserHooks();

  describe('Page.viewport', function () {
    it('should get the proper viewport size', async () => {
      const {page} = await getTestState();

      assert.deepEqual(page.viewport(), {width: 800, height: 600});
      await page.setViewport({width: 123, height: 456});
      assert.deepEqual(page.viewport(), {width: 123, height: 456});
    });
    it('should support mobile emulation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      assert.strictEqual(
        await page.evaluate(() => {
          return window.innerWidth;
        }),
        800,
      );
      await page.setViewport(iPhone.viewport);
      assert.strictEqual(
        await page.evaluate(() => {
          return window.innerWidth;
        }),
        375,
      );
      await page.setViewport({width: 400, height: 300});
      assert.strictEqual(
        await page.evaluate(() => {
          return window.innerWidth;
        }),
        400,
      );
    });
    it('should support touch emulation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      assert.isFalse(
        await page.evaluate(() => {
          return 'ontouchstart' in window;
        }),
      );
      await page.setViewport(iPhone.viewport);
      assert.isTrue(
        await page.evaluate(() => {
          return 'ontouchstart' in window;
        }),
      );
      assert.strictEqual(await page.evaluate(dispatchTouch), 'Received touch');
      await page.setViewport({width: 100, height: 100});
      assert.isFalse(
        await page.evaluate(() => {
          return 'ontouchstart' in window;
        }),
      );

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
      assert.strictEqual(
        await page.evaluate(() => {
          return document.body.textContent!.trim();
        }),
        'NO',
      );
      await page.setViewport(iPhone.viewport);
      await page.goto(server.PREFIX + '/detect-touch.html');
      assert.strictEqual(
        await page.evaluate(() => {
          return document.body.textContent!.trim();
        }),
        'YES',
      );
    });
    it('should detect touch when applying viewport with touches', async () => {
      const {page, server} = await getTestState();

      await page.setViewport({width: 800, height: 600, hasTouch: true});
      await page.addScriptTag({url: server.PREFIX + '/modernizr.js'});
      assert.isTrue(
        await page.evaluate(() => {
          return (globalThis as any).Modernizr.touchevents;
        }),
      );
    });
    it('should support landscape emulation', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      assert.strictEqual(
        await page.evaluate(() => {
          return screen.orientation.type;
        }),
        'portrait-primary',
      );
      await page.setViewport(iPhoneLandscape.viewport);
      assert.strictEqual(
        await page.evaluate(() => {
          return screen.orientation.type;
        }),
        'landscape-primary',
      );
      await page.setViewport({width: 100, height: 100});
      assert.strictEqual(
        await page.evaluate(() => {
          return screen.orientation.type;
        }),
        'portrait-primary',
      );
    });
    it('should update media queries when resolution changes', async () => {
      const {page, server} = await getTestState();

      async function getFontSize() {
        return await page.evaluate(() => {
          return parseInt(
            window.getComputedStyle(document.querySelector('p')!).fontSize,
            10,
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

        assert.strictEqual(await getFontSize(), dpr);

        const screenshot = await page.screenshot({
          fullPage: false,
        });
        assertGolden(screenshot, `device-pixel-ratio${dpr}.png`);
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

        assert.match(await getCurrentSrc(), new RegExp(`logo-${dpr}x.png`));
      }
    });
  });

  describe('Page.emulate', function () {
    it('should work', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/mobile.html');
      await page.emulate(iPhone);
      assert.strictEqual(
        await page.evaluate(() => {
          return window.innerWidth;
        }),
        375,
      );
      assert.include(
        await page.evaluate(() => {
          return navigator.userAgent;
        }),
        'iPhone',
      );
    });

    it('should work twice on about:blank', async () => {
      const {page} = await getTestState();

      await page.goto('about:blank');
      await page.emulate(KnownDevices['iPhone 13']);
      await page.emulate(KnownDevices['iPad Pro landscape']);
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
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).result;
        }),
        'Clicked',
      );
    });
  });

  describe('Page.emulateMediaType', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('screen').matches;
        }),
      );
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('print').matches;
        }),
      );
      await page.emulateMediaType('print');
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('screen').matches;
        }),
      );
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('print').matches;
        }),
      );
      await page.emulateMediaType();
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('screen').matches;
        }),
      );
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('print').matches;
        }),
      );
    });
    it('should throw in case of bad argument', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page.emulateMediaType('bad').catch(error_ => {
        return (error = error_);
      });
      assert.strictEqual(error.message, 'Unsupported media type: bad');
    });
  });

  describe('Page.emulateMediaFeatures', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.emulateMediaFeatures([
        {name: 'prefers-reduced-motion', value: 'reduce'},
      ]);
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(prefers-reduced-motion: reduce)').matches;
        }),
      );
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('(prefers-reduced-motion: no-preference)').matches;
        }),
      );
      await page.emulateMediaFeatures([
        {name: 'prefers-color-scheme', value: 'light'},
      ]);
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: light)').matches;
        }),
      );
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: dark)').matches;
        }),
      );
      await page.emulateMediaFeatures([
        {name: 'prefers-color-scheme', value: 'dark'},
      ]);
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: dark)').matches;
        }),
      );
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: light)').matches;
        }),
      );
      await page.emulateMediaFeatures([
        {name: 'prefers-reduced-motion', value: 'reduce'},
        {name: 'prefers-color-scheme', value: 'light'},
      ]);
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(prefers-reduced-motion: reduce)').matches;
        }),
      );
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('(prefers-reduced-motion: no-preference)').matches;
        }),
      );
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: light)').matches;
        }),
      );
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('(prefers-color-scheme: dark)').matches;
        }),
      );
      await page.emulateMediaFeatures([{name: 'color-gamut', value: 'srgb'}]);
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: p3)').matches;
        }),
      );
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: srgb)').matches;
        }),
      );
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: rec2020)').matches;
        }),
      );
      await page.emulateMediaFeatures([{name: 'color-gamut', value: 'p3'}]);
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: p3)').matches;
        }),
      );
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: srgb)').matches;
        }),
      );
      assert.isFalse(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: rec2020)').matches;
        }),
      );
      await page.emulateMediaFeatures([
        {name: 'color-gamut', value: 'rec2020'},
      ]);
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: p3)').matches;
        }),
      );
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: srgb)').matches;
        }),
      );
      assert.isTrue(
        await page.evaluate(() => {
          return matchMedia('(color-gamut: rec2020)').matches;
        }),
      );
    });
    it('should throw in case of bad argument', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page
        .emulateMediaFeatures([{name: 'bad', value: ''}])
        .catch(error_ => {
          return (error = error_);
        });
      assert.strictEqual(error.message, 'Unsupported media feature: bad');
    });
  });

  describe('Page.emulateTimezone', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      await page.evaluate(() => {
        (globalThis as any).date = new Date(1479579154987);
      });
      await page.emulateTimezone('America/Jamaica');
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        }),
        'Sat Nov 19 2016 13:12:34 GMT-0500 (Eastern Standard Time)',
      );

      await page.emulateTimezone('Pacific/Honolulu');
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        }),
        'Sat Nov 19 2016 08:12:34 GMT-1000 (Hawaii-Aleutian Standard Time)',
      );

      await page.emulateTimezone('America/Buenos_Aires');
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        }),
        'Sat Nov 19 2016 15:12:34 GMT-0300 (Argentina Standard Time)',
      );

      await page.emulateTimezone('Europe/Berlin');
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        }),
        'Sat Nov 19 2016 19:12:34 GMT+0100 (Central European Standard Time)',
      );
    });

    it('should support timezone offset', async () => {
      const {page} = await getTestState();

      await page.evaluate(() => {
        (globalThis as any).date = new Date(1479579154987);
      });
      await page.emulateTimezone('GMT+10:00');
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        }),
        'Sun Nov 20 2016 04:12:34 GMT+1000 (GMT+10:00)',
      );

      await page.emulateTimezone('GMT-12:34');
      assert.strictEqual(
        await page.evaluate(() => {
          return (globalThis as any).date.toString();
        }),
        'Sat Nov 19 2016 05:38:34 GMT-1234 (GMT-12:34)',
      );
    });

    it('should throw for invalid timezone IDs', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page.emulateTimezone('Foo/Bar').catch(error_ => {
        return (error = error_);
      });
      assertAtLeastOneToContain(error.message, [
        'Invalid timezone ID: Foo/Bar', // CDP
        'invalid argument', // BiDi.
      ]);
      // Assert the error message is informative.
      assert.include(error.message, 'Foo/Bar');
      await page.emulateTimezone('Baz/Qux').catch(error_ => {
        return (error = error_);
      });
      assertAtLeastOneToContain(error.message, [
        'Invalid timezone ID: Baz/Qux', // CDP
        'invalid argument', // BiDi.
      ]);
      // Assert the error message is informative.
      assert.include(error.message, 'Baz/Qux');
    });
  });

  describe('Page.emulateLocale', function () {
    it('should work', async () => {
      const {page} = await getTestState();
      const defaultLocale = await page.evaluate(() => {
        return Intl.NumberFormat().resolvedOptions().locale;
      });
      const defaultLanguage = await page.evaluate(() => {
        return navigator.language;
      });

      await page.emulateLocale('de-DE');
      assert.strictEqual(
        await page.evaluate(() => {
          return Intl.NumberFormat().resolvedOptions().locale;
        }),
        'de-DE',
      );
      assert.strictEqual(
        await page.evaluate(() => {
          return new Intl.NumberFormat().format(123456.78);
        }),
        '123.456,78',
      );
      assert.strictEqual(
        await page.evaluate(() => {
          return navigator.language;
        }),
        'de-DE',
      );
      assert.strictEqual(
        await page.evaluate(() => {
          return navigator.languages[0];
        }),
        'de-DE',
      );

      await page.emulateLocale('fr-FR');
      assert.strictEqual(
        await page.evaluate(() => {
          return Intl.DateTimeFormat().resolvedOptions().locale;
        }),
        'fr-FR',
      );

      await page.emulateLocale();
      assert.strictEqual(
        await page.evaluate(() => {
          return Intl.NumberFormat().resolvedOptions().locale;
        }),
        defaultLocale,
      );
      assert.strictEqual(
        await page.evaluate(() => {
          return navigator.language;
        }),
        defaultLanguage,
      );
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
        assertGolden(screenshot, 'screenshot-sanity.png');
      }

      {
        await page.emulateVisionDeficiency('achromatopsia');
        const screenshot = await page.screenshot();
        assertGolden(screenshot, 'vision-deficiency-achromatopsia.png');
      }

      {
        await page.emulateVisionDeficiency('blurredVision');
        const screenshot = await page.screenshot();
        assertGolden(screenshot, 'vision-deficiency-blurredVision.png');
      }

      {
        await page.emulateVisionDeficiency('deuteranopia');
        const screenshot = await page.screenshot();
        assertGolden(screenshot, 'vision-deficiency-deuteranopia.png');
      }

      {
        await page.emulateVisionDeficiency('protanopia');
        const screenshot = await page.screenshot();
        assertGolden(screenshot, 'vision-deficiency-protanopia.png');
      }

      {
        await page.emulateVisionDeficiency('tritanopia');
        const screenshot = await page.screenshot();
        assertGolden(screenshot, 'vision-deficiency-tritanopia.png');
      }

      {
        await page.emulateVisionDeficiency('none');
        const screenshot = await page.screenshot();
        assertGolden(screenshot, 'screenshot-sanity.png');
      }

      {
        await page.emulateVisionDeficiency('reducedContrast');
        const screenshot = await page.screenshot();
        assertGolden(screenshot, 'vision-deficiency-reducedContrast.png');
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
      assert.strictEqual(
        error.message,
        'Unsupported vision deficiency: invalid',
      );
    });
  });

  describe('Page.emulateNetworkConditions', function () {
    it('should support offline', async () => {
      const {isFirefox, page, server} = await getTestState();

      await page.emulateNetworkConditions({
        offline: true,
        download: 0,
        upload: 0,
        latency: 0,
      });

      try {
        await page.goto(server.EMPTY_PAGE);
        throw new Error('not reached');
      } catch (err) {
        let expectedError;
        if (isFirefox) {
          expectedError = /NS_ERROR_OFFLINE/;
        } else {
          expectedError = /ERR_INTERNET_DISCONNECTED/;
        }
        assert.match((err as Error).message, expectedError);
      }
    });

    it('should change navigator.connection.effectiveType', async () => {
      const {page} = await getTestState();

      const slow3G = PredefinedNetworkConditions['Slow 3G']!;
      const fast3G = PredefinedNetworkConditions['Fast 3G']!;

      assert.strictEqual(
        await page.evaluate('window.navigator.connection.effectiveType'),
        '4g',
      );
      await page.emulateNetworkConditions(fast3G);
      assert.strictEqual(
        await page.evaluate('window.navigator.connection.effectiveType'),
        '3g',
      );
      await page.emulateNetworkConditions(slow3G);
      assert.strictEqual(
        await page.evaluate('window.navigator.connection.effectiveType'),
        '2g',
      );
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

  describe('Page.emulateFocusedPage', function () {
    it('should emulate focus', async () => {
      const {page, context} = await getTestState();

      await page.emulateFocusedPage(true);
      assert.isTrue(
        await page.evaluate(() => {
          return document.hasFocus();
        }),
      );

      const page2 = await context.newPage();
      // Move page into background by focusing page2.
      await page2.bringToFront();

      assert.isTrue(
        await page.evaluate(() => {
          return document.hasFocus();
        }),
      );
    });

    it('should reset focus', async () => {
      const {page, context} = await getTestState();

      await page.emulateFocusedPage(true);

      const page2 = await context.newPage();
      // Move page into background by focusing page2.
      await page2.bringToFront();

      assert.isTrue(
        await page.evaluate(() => {
          return document.hasFocus();
        }),
      );

      await page.emulateFocusedPage(false);
      assert.isFalse(
        await page.evaluate(() => {
          return document.hasFocus();
        }),
      );
    });
  });
});
