/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import type {CdpFrame} from 'puppeteer-core/internal/cdp/Frame.js';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';
import {assertMatchObject, attachFrame} from '../utils.js';

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

    assert.strictEqual(typeof mainLoaderId, 'string');
    assert.ok(mainLoaderId);
    assert.strictEqual(typeof frame1LoaderId, 'string');
    assert.ok(frame1LoaderId);

    assertMatchObject(snapshot, {
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
