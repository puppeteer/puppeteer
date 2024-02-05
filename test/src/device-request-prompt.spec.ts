/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';
import {TimeoutError} from 'puppeteer';

import {launch} from './mocha-utils.js';

describe('device request prompt', function () {
  let state: Awaited<ReturnType<typeof launch>>;

  before(async () => {
    state = await launch(
      {
        args: ['--enable-features=WebBluetoothNewPermissionsBackend'],
        ignoreHTTPSErrors: true,
      },
      {
        after: 'all',
      }
    );
  });

  after(async () => {
    await state.close();
  });

  beforeEach(async () => {
    state.context = await state.browser.createBrowserContext();
    state.page = await state.context.newPage();
  });

  afterEach(async () => {
    await state.context.close();
  });

  // Bug: #11072
  it('does not crash', async function () {
    this.timeout(1_000);

    const {page, httpsServer} = state;

    await page.goto(httpsServer.EMPTY_PAGE);

    await expect(
      page.waitForDevicePrompt({
        timeout: 10,
      })
    ).rejects.toThrow(TimeoutError);
  });
});
