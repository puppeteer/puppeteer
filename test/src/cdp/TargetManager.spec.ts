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
    expect(targetManager.getAvailableTargets().size).toBe(3);

    expect(await context.pages()).toHaveLength(0);
    expect(targetManager.getAvailableTargets().size).toBe(3);

    const page = await context.newPage();
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(5);

    await page.goto(server.EMPTY_PAGE);
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(5);

    // attach a local iframe.
    let framePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/empty.html');
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(5);
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
    expect(targetManager.getAvailableTargets().size).toBe(6);
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
    expect(targetManager.getAvailableTargets().size).toBe(7);
    expect(page.frames()).toHaveLength(4);
  });
});
