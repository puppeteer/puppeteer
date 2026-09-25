/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import type {CdpBrowser} from 'puppeteer-core/internal/cdp/Browser.js';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';
import {attachFrame} from '../utils.js';

describe('TargetManager', () => {
  // We start a new browser instance for this test because we need the
  // --site-per-process flag.
  const state = setupSeparateTestBrowserHooks(
    {
      args: ['--site-per-process'],
    },
    {
      createPage: false,
    },
  );

  // CDP-specific test.
  it('should handle targets', async () => {
    const {server, context, browser} = state;

    const targetManager = (browser as CdpBrowser)._targetManager();

    const initialTargetCount = targetManager.getAvailableTargets().size;
    // There could be an conditional extra prerender target.
    assert.ok(initialTargetCount === 3 || initialTargetCount === 4);

    assert.lengthOf(await context.pages(), 0);
    assert.strictEqual(
      targetManager.getAvailableTargets().size,
      initialTargetCount,
    );

    const page = await context.newPage();
    assert.lengthOf(await context.pages(), 1);
    assert.strictEqual(
      targetManager.getAvailableTargets().size,
      initialTargetCount + 2,
    );

    await page.goto(server.EMPTY_PAGE);
    assert.lengthOf(await context.pages(), 1);
    assert.strictEqual(
      targetManager.getAvailableTargets().size,
      initialTargetCount + 2,
    );

    // attach a local iframe.
    let framePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/empty.html');
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);
    await framePromise;
    assert.lengthOf(await context.pages(), 1);
    assert.strictEqual(
      targetManager.getAvailableTargets().size,
      initialTargetCount + 2,
    );
    assert.lengthOf(page.frames(), 2);

    // // attach a remote frame iframe.
    framePromise = page.waitForFrame(frame => {
      return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
    });
    await attachFrame(
      page,
      'frame2',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    await framePromise;
    assert.lengthOf(await context.pages(), 1);
    assert.strictEqual(
      targetManager.getAvailableTargets().size,
      initialTargetCount + 3,
    );
    assert.lengthOf(page.frames(), 3);

    framePromise = page.waitForFrame(frame => {
      return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
    });
    await attachFrame(
      page,
      'frame3',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    await framePromise;
    assert.lengthOf(await context.pages(), 1);
    assert.strictEqual(
      targetManager.getAvailableTargets().size,
      initialTargetCount + 4,
    );
    assert.lengthOf(page.frames(), 4);
  });
});
