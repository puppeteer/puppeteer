/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {PageEvent} from 'puppeteer-core';

import {launch} from '../mocha-utils.js';
import {waitEvent} from '../utils.js';

describe('BFCache', function () {
  it('can navigate to a BFCached page', async () => {
    const {httpsServer, page, close} = await launch({
      ignoreHTTPSErrors: true,
    });

    try {
      page.setDefaultTimeout(3000);

      await page.goto(httpsServer.PREFIX + '/cached/bfcache/index.html');

      await Promise.all([page.waitForNavigation(), page.locator('a').click()]);

      expect(page.url()).toContain('target.html');

      await Promise.all([page.waitForNavigation(), page.goBack()]);

      expect(
        await page.evaluate(() => {
          return document.body.innerText;
        })
      ).toBe('BFCachednext');
    } finally {
      await close();
    }
  });

  it('can navigate to a BFCached page containing an OOPIF and a worker', async () => {
    const {httpsServer, page, close} = await launch({
      ignoreHTTPSErrors: true,
    });
    try {
      page.setDefaultTimeout(3000);
      const [worker1] = await Promise.all([
        waitEvent(page, PageEvent.WorkerCreated),
        page.goto(
          httpsServer.PREFIX + '/cached/bfcache/worker-iframe-container.html'
        ),
      ]);
      expect(await worker1.evaluate('1 + 1')).toBe(2);
      await Promise.all([page.waitForNavigation(), page.locator('a').click()]);

      const [worker2] = await Promise.all([
        waitEvent(page, PageEvent.WorkerCreated),
        page.waitForNavigation(),
        page.goBack(),
      ]);
      expect(await worker2.evaluate('1 + 1')).toBe(2);
    } finally {
      await close();
    }
  });
});
