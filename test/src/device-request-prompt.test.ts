/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';
import {TimeoutError} from 'puppeteer';

import {setupSeparateTestBrowserHooks} from './mocha-utils.js';

describe('device request prompt', function () {
  const state = setupSeparateTestBrowserHooks({
    args: ['--enable-features=WebBluetoothNewPermissionsBackend'],
    acceptInsecureCerts: true,
  });

  // Bug: #11072
  it('does not crash', async function () {
    this.timeout(1_000);

    const {page, httpsServer} = state;

    await page.goto(httpsServer.EMPTY_PAGE);

    await expect(
      page.waitForDevicePrompt({
        timeout: 10,
      }),
    ).rejects.toThrow(TimeoutError);
  });

  it('can be aborted', async function () {
    const {page} = state;

    const abortController = new AbortController();
    const task = page.waitForDevicePrompt({
      signal: abortController.signal,
    });

    abortController.abort();
    await expect(task).rejects.toThrow(/aborted/);
  });
});
