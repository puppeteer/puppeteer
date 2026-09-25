/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {assert} from 'chai';
import {TimeoutError} from 'puppeteer';

import {setupSeparateTestBrowserHooks} from './mocha-utils.js';
import {assertRejects} from './utils.js';

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

    const error = await assertRejects(
      page.waitForDevicePrompt({
        timeout: 10,
      }),
    );
    assert.instanceOf(error, TimeoutError);
  });

  it('can be aborted', async function () {
    const {page} = state;

    const abortController = new AbortController();
    const task = page.waitForDevicePrompt({
      signal: abortController.signal,
    });

    abortController.abort();
    const error = await assertRejects(task);
    assert.match(error.message, /aborted/);
  });
});
