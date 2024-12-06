/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {getTestState, launch} from './mocha-utils.js';

describe('Puppeteer.connect', function () {
  it('should be able to connect using browserUrl, with and without trailing slash', async () => {
    const {close, puppeteer} = await launch({
      args: ['--remote-debugging-port=21222'],
    });
    try {
      const browserURL = 'http://127.0.0.1:21222';

      using browser1 = await puppeteer.connect({browserURL});
      const page1 = await browser1.newPage();
      expect(
        await page1.evaluate(() => {
          return 7 * 8;
        }),
      ).toBe(56);
      await browser1.disconnect();

      using browser2 = await puppeteer.connect({
        browserURL: browserURL + '/',
      });
      const page2 = await browser2.newPage();
      expect(
        await page2.evaluate(() => {
          return 8 * 7;
        }),
      ).toBe(56);
    } finally {
      await close();
    }
  });
  it('should throw when using both browserWSEndpoint and browserURL', async () => {
    const {puppeteer} = await getTestState({skipLaunch: true});
    const browserURL = 'http://127.0.0.1:21222';

    let error!: Error;
    await puppeteer
      .connect({
        browserURL,
        browserWSEndpoint: 'ws://127.0.0.1:21222/devtools/browser/',
      })
      .catch(error_ => {
        return (error = error_);
      });
    expect(error.message).toContain(
      'Exactly one of browserWSEndpoint, browserURL or transport',
    );
  });

  it('should throw when trying to connect to non-existing browser', async () => {
    const {puppeteer} = await getTestState({skipLaunch: true});
    const browserURL = 'http://127.0.0.1:32333';

    let error!: Error;
    await puppeteer.connect({browserURL}).catch(error_ => {
      return (error = error_);
    });
    expect(error.message).toContain(
      'Failed to fetch browser webSocket URL from',
    );
  });
});
