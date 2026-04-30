/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {CdpFrame} from 'puppeteer-core/internal/cdp/Frame.js';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';
import {attachFrame} from '../utils.js';

describe('Accessibility loaderId', function () {
  setupTestBrowserHooks();

  it('should match loaderId for iframes', async () => {
    const {page, server} = await getTestState();
    await page.goto(server.EMPTY_PAGE);
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);
    const frame1 = page.frames()[1];
    await frame1!.evaluate(() => {
      const button = document.createElement('button');
      button.innerText = 'value1';
      document.body.appendChild(button);
    });
    const snapshot = await page.accessibility.snapshot({
      interestingOnly: true,
      includeIframes: true,
    });

    const mainLoaderId = (page.mainFrame() as CdpFrame)._loaderId;
    const frame1LoaderId = (frame1 as CdpFrame)._loaderId;

    expect(typeof mainLoaderId).toBe('string');
    expect(mainLoaderId).toBeTruthy();
    expect(typeof frame1LoaderId).toBe('string');
    expect(frame1LoaderId).toBeTruthy();

    expect(snapshot).toMatchObject({
      role: 'RootWebArea',
      name: '',
      loaderId: mainLoaderId,
      children: [
        {
          role: 'Iframe',
          name: '',
          loaderId: mainLoaderId,
          children: [
            {
              role: 'RootWebArea',
              name: '',
              loaderId: frame1LoaderId,
              children: [
                {
                  role: 'button',
                  name: 'value1',
                  loaderId: frame1LoaderId,
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
