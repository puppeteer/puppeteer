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

import expect from 'expect';
import {CDPBrowser} from 'puppeteer-core/internal/common/Browser.js';

import {getTestState, launch} from './mocha-utils.js';
import {attachFrame} from './utils.js';

describe('TargetManager', () => {
  /* We use a special browser for this test as we need the --site-per-process flag */
  let state: Awaited<ReturnType<typeof launch>> & {
    browser: CDPBrowser;
  };

  beforeEach(async () => {
    const {defaultBrowserOptions} = await getTestState({
      skipLaunch: true,
    });
    state = (await launch(
      Object.assign({}, defaultBrowserOptions, {
        args: (defaultBrowserOptions.args || []).concat([
          '--site-per-process',
          '--remote-debugging-port=21222',
          '--host-rules=MAP * 127.0.0.1',
        ]),
      }),
      {createPage: false}
    )) as Awaited<ReturnType<typeof launch>> & {
      browser: CDPBrowser;
    };
  });

  afterEach(async () => {
    await state.close();
  });

  it('should handle targets', async () => {
    const {server, context, browser} = state;

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
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);
    await framePromise;
    expect(await context.pages()).toHaveLength(1);
    expect(targetManager.getAvailableTargets().size).toBe(3);
    expect(page.frames()).toHaveLength(2);

    // // attach a remote frame iframe.
    framePromise = page.waitForFrame(frame => {
      return frame.url() === server.CROSS_PROCESS_PREFIX + '/empty.html';
    });
    await attachFrame(
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
    await attachFrame(
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
