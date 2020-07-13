/**
 * Copyright 2017 Google Inc. All rights reserved.
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
import { getTestState, describeChromeOnly } from './mocha-utils'; // eslint-disable-line import/extensions

describeChromeOnly('OOPIF', function () {
  /* We use a special browser for this test as we need the --site-per-process flag */
  let browser;
  let context;
  let page;

  before(async () => {
    const { puppeteer, defaultBrowserOptions } = getTestState();
    browser = await puppeteer.launch(
      Object.assign({}, defaultBrowserOptions, {
        args: (defaultBrowserOptions.args || []).concat(['--site-per-process']),
      })
    );
  });

  beforeEach(async () => {
    context = await browser.createIncognitoBrowserContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
    page = null;
    context = null;
  });

  after(async () => {
    await browser.close();
    browser = null;
  });
  xit('should report oopif frames', async () => {
    const { server } = getTestState();

    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    expect(oopifs(context).length).toBe(1);
    expect(page.frames().length).toBe(2);
  });
  it('should load oopif iframes with subresources and request interception', async () => {
    const { server } = getTestState();

    await page.setRequestInterception(true);
    page.on('request', (request) => request.continue());
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    expect(oopifs(context).length).toBe(1);
  });
});

/**
 * @param {!BrowserContext} context
 */
function oopifs(context) {
  return context
    .targets()
    .filter((target) => target._targetInfo.type === 'iframe');
}
