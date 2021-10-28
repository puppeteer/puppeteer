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

import utils from './utils.js';
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
  it('should treat OOP iframes and normal iframes the same', async () => {
    const { server } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame((frame) =>
      frame.url().endsWith('/empty.html')
    );
    await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
    await utils.attachFrame(
      page,
      'frame2',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    await framePromise;
    expect(page.mainFrame().childFrames()).toHaveLength(2);
  });
  it('should track navigations within OOP iframes', async () => {
    const { server } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame((frame) => {
      return page.frames().indexOf(frame) === 1;
    });
    await utils.attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    const frame = await framePromise;
    expect(frame.url()).toContain('/empty.html');
    await utils.navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/assets/frame.html'
    );
    expect(frame.url()).toContain('/assets/frame.html');
  });
  it('should support OOP iframes becoming normal iframes again', async () => {
    const { server } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame((frame) => {
      return page.frames().indexOf(frame) === 1;
    });
    await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);

    const frame = await framePromise;
    expect(frame.isOOPFrame()).toBe(false);
    await utils.navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    expect(frame.isOOPFrame()).toBe(true);
    await utils.navigateFrame(page, 'frame1', server.EMPTY_PAGE);
    expect(frame.isOOPFrame()).toBe(false);
    expect(page.frames()).toHaveLength(2);
  });
  it('should support frames within OOP frames', async () => {
    const { server } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const frame1Promise = page.waitForFrame((frame) => {
      return page.frames().indexOf(frame) === 1;
    });
    const frame2Promise = page.waitForFrame((frame) => {
      return page.frames().indexOf(frame) === 2;
    });
    await utils.attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/frames/one-frame.html'
    );

    const [frame1, frame2] = await Promise.all([frame1Promise, frame2Promise]);

    expect(await frame1.evaluate(() => document.location.href)).toMatch(
      /one-frame\.html$/
    );
    expect(await frame2.evaluate(() => document.location.href)).toMatch(
      /frames\/frame\.html$/
    );
  });
  it('should support OOP iframes getting detached', async () => {
    const { server } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame((frame) => {
      return page.frames().indexOf(frame) === 1;
    });
    await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);

    const frame = await framePromise;
    expect(frame.isOOPFrame()).toBe(false);
    await utils.navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    expect(frame.isOOPFrame()).toBe(true);
    await utils.detachFrame(page, 'frame1');
    expect(page.frames()).toHaveLength(1);
  });
  it('should keep track of a frames OOP state', async () => {
    const { server } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame((frame) => {
      return page.frames().indexOf(frame) === 1;
    });
    await utils.attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    const frame = await framePromise;
    expect(frame.url()).toContain('/empty.html');
    await utils.navigateFrame(page, 'frame1', server.EMPTY_PAGE);
    expect(frame.url()).toBe(server.EMPTY_PAGE);
  });
  it('should support evaluating in oop iframes', async () => {
    const { server } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame((frame) => {
      return page.frames().indexOf(frame) === 1;
    });
    await utils.attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    const frame = await framePromise;
    await frame.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      _test = 'Test 123!';
    });
    const result = await frame.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return window._test;
    });
    expect(result).toBe('Test 123!');
  });
  it('should provide access to elements', async () => {
    const { server } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame((frame) => {
      return page.frames().indexOf(frame) === 1;
    });
    await utils.attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );

    const frame = await framePromise;
    await frame.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'test-button';
      document.body.appendChild(button);
    });

    await frame.click('#test-button');
  });
  it('should report oopif frames', async () => {
    const { server } = getTestState();

    const frame = page.waitForFrame((frame) =>
      frame.url().endsWith('/oopif.html')
    );
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await frame;
    expect(oopifs(context).length).toBe(1);
    expect(page.frames().length).toBe(2);
  });
  it('should load oopif iframes with subresources and request interception', async () => {
    const { server } = getTestState();

    const frame = page.waitForFrame((frame) =>
      frame.url().endsWith('/oopif.html')
    );
    await page.setRequestInterception(true);
    page.on('request', (request) => request.continue());
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await frame;
    expect(oopifs(context).length).toBe(1);
  });
  it('should support frames within OOP iframes', async () => {
    const { server } = getTestState();

    const oopIframePromise = page.waitForFrame((frame) => {
      return frame.url().endsWith('/oopif.html');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    const oopIframe = await oopIframePromise;
    await utils.attachFrame(
      oopIframe,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );

    const frame1 = oopIframe.childFrames()[0];
    expect(frame1.url()).toMatch(/empty.html$/);
    await utils.navigateFrame(
      oopIframe,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/oopif.html'
    );
    expect(frame1.url()).toMatch(/oopif.html$/);
    await frame1.goto(
      server.CROSS_PROCESS_PREFIX + '/oopif.html#navigate-within-document',
      { waitUntil: 'load' }
    );
    expect(frame1.url()).toMatch(/oopif.html#navigate-within-document$/);
    await utils.detachFrame(oopIframe, 'frame1');
    expect(oopIframe.childFrames()).toHaveLength(0);
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
