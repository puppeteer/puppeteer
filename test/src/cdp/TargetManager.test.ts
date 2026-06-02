/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
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
    expect(initialTargetCount === 3 || initialTargetCount === 4).toBeTruthy();

    expect(await context.pages()).toHaveLength(0);
    expect(targetManager.getAvailableTargets().size).toBe(initialTargetCount);

    const page = await context.newPage();
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(
      initialTargetCount + 2,
    );

    await page.goto(server.EMPTY_PAGE);
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(
      initialTargetCount + 2,
    );

    // attach a local iframe.
    let framePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/empty.html');
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(
      initialTargetCount + 2,
    );
    expect(page.frames()).toHaveLength(2);

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
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(
      initialTargetCount + 3,
    );
    expect(page.frames()).toHaveLength(3);

    framePromise = page.waitForFrame(frame => {
      return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
    });
    await attachFrame(
      page,
      'frame3',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(
      initialTargetCount + 4,
    );
    expect(page.frames()).toHaveLength(4);
  });
});
