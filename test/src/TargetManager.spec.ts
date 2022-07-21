/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {describeChromeOnly, getTestState} from './mocha-utils'; // eslint-disable-line import/extensions
import utils from './utils.js';

import expect from 'expect';

import {
  Browser,
  BrowserContext,
} from '../../lib/cjs/puppeteer/common/Browser.js';

describeChromeOnly('TargetManager', () => {
  /* We use a special browser for this test as we need the --site-per-process flag */
  let browser: Browser;
  let context: BrowserContext;

  before(async () => {
    const {puppeteer, defaultBrowserOptions} = getTestState();
    browser = await puppeteer.launch(
      Object.assign({}, defaultBrowserOptions, {
        args: (defaultBrowserOptions.args || []).concat([
          '--site-per-process',
          '--remote-debugging-port=21222',
          '--host-rules=MAP * 127.0.0.1',
        ]),
      })
    );
  });

  beforeEach(async () => {
    context = await browser.createIncognitoBrowserContext();
  });

  afterEach(async () => {
    await context.close();
  });

  after(async () => {
    await browser.close();
  });

  it('should handle targets', async () => {
    const {server} = getTestState();

    const targetManager = browser._targetManager();
    expect(targetManager.getAvailableTargets().size).toBe(2);

    expect(await context.pages()).toHaveLength(0);
    expect(targetManager.getAvailableTargets().size).toBe(2);

    const page = await context.newPage();
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(3);

    await page.goto(server.EMPTY_PAGE);
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(3);

    // attach a local iframe.
    let framePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/empty.html');
    });
    await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(3);
    expect(page.frames()).toHaveLength(2);

    // // attach a remote frame iframe.
    framePromise = page.waitForFrame(frame => {
      return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
    });
    await utils.attachFrame(
      page,
      'frame2',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(4);
    expect(page.frames()).toHaveLength(3);

    framePromise = page.waitForFrame(frame => {
      return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
    });
    await utils.attachFrame(
      page,
      'frame3',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(5);
    expect(page.frames()).toHaveLength(4);
  });
});
