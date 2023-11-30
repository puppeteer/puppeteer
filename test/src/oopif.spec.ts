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
import type {BrowserContext} from 'puppeteer-core/internal/api/BrowserContext.js';
import type {CdpTarget} from 'puppeteer-core/internal/cdp/Target.js';

import {getTestState, launch} from './mocha-utils.js';
import {attachFrame, detachFrame, navigateFrame} from './utils.js';

describe('OOPIF', function () {
  /* We use a special browser for this test as we need the --site-per-process flag */
  let state: Awaited<ReturnType<typeof launch>>;

  before(async () => {
    const {defaultBrowserOptions} = await getTestState({skipLaunch: true});

    state = await launch(
      Object.assign({}, defaultBrowserOptions, {
        args: (defaultBrowserOptions.args || []).concat([
          '--site-per-process',
          '--remote-debugging-port=21222',
          '--host-rules=MAP * 127.0.0.1',
        ]),
      }),
      {after: 'all'}
    );
  });

  beforeEach(async () => {
    state.context = await state.browser.createIncognitoBrowserContext();
    state.page = await state.context.newPage();
  });

  afterEach(async () => {
    await state.context.close();
  });

  after(async () => {
    await state.close();
  });

  it('should treat OOP iframes and normal iframes the same', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/empty.html');
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);
    await attachFrame(
      page,
      'frame2',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    await framePromise;
    expect(page.mainFrame().childFrames()).toHaveLength(2);
  });
  it('should track navigations within OOP iframes', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    const frame = await framePromise;
    expect(frame.url()).toContain('/empty.html');
    await navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/assets/frame.html'
    );
    expect(frame.url()).toContain('/assets/frame.html');
  });
  it('should support OOP iframes becoming normal iframes again', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);

    const frame = await framePromise;
    expect(frame.isOOPFrame()).toBe(false);
    await navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    expect(frame.isOOPFrame()).toBe(true);
    await navigateFrame(page, 'frame1', server.EMPTY_PAGE);
    expect(frame.isOOPFrame()).toBe(false);
    expect(page.frames()).toHaveLength(2);
  });
  it('should support frames within OOP frames', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const frame1Promise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    const frame2Promise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 2;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/frames/one-frame.html'
    );

    const [frame1, frame2] = await Promise.all([frame1Promise, frame2Promise]);

    expect(
      await frame1.evaluate(() => {
        return document.location.href;
      })
    ).toMatch(/one-frame\.html$/);
    expect(
      await frame2.evaluate(() => {
        return document.location.href;
      })
    ).toMatch(/frames\/frame\.html$/);
  });
  it('should support OOP iframes getting detached', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);

    const frame = await framePromise;
    expect(frame.isOOPFrame()).toBe(false);
    await navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    expect(frame.isOOPFrame()).toBe(true);
    await detachFrame(page, 'frame1');
    expect(page.frames()).toHaveLength(1);
  });

  it('should support wait for navigation for transitions from local to OOPIF', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);

    const frame = await framePromise;
    expect(frame.isOOPFrame()).toBe(false);
    const nav = frame.waitForNavigation();
    await navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    await nav;
    expect(frame.isOOPFrame()).toBe(true);
    await detachFrame(page, 'frame1');
    expect(page.frames()).toHaveLength(1);
  });

  it('should keep track of a frames OOP state', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    const frame = await framePromise;
    expect(frame.url()).toContain('/empty.html');
    await navigateFrame(page, 'frame1', server.EMPTY_PAGE);
    expect(frame.url()).toBe(server.EMPTY_PAGE);
  });

  it('should support evaluating in oop iframes', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    const frame = await framePromise;
    await frame.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      _test = 'Test 123!';
    });
    const result = await frame.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return window._test;
    });
    expect(result).toBe('Test 123!');
  });
  it('should provide access to elements', async () => {
    const {server, isHeadless, headless, page} = state;

    if (!isHeadless || headless === 'new') {
      // TODO: this test is partially blocked on crbug.com/1334119. Enable test once
      // the upstream is fixed.
      // TLDR: when we dispatch events to the frame the compositor might
      // not be up-to-date yet resulting in a misclick (the iframe element
      // becomes the event target instead of the content inside the iframe).
      // The solution is to use InsertVisualCallback on the backend but that causes
      // another issue that events cannot be dispatched to inactive tabs as the
      // visual callback is never invoked.
      // The old headless mode does not have this issue since it operates with
      // special scheduling settings that keep even inactive tabs updating.
      return;
    }

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );

    const frame = await framePromise;
    await frame.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'test-button';
      button.innerText = 'click';
      button.onclick = () => {
        button.id = 'clicked';
      };
      document.body.appendChild(button);
    });
    await page.evaluate(() => {
      document.body.style.border = '150px solid black';
      document.body.style.margin = '250px';
      document.body.style.padding = '50px';
    });
    await frame.waitForSelector('#test-button', {visible: true});
    await frame.click('#test-button');
    await frame.waitForSelector('#clicked');
  });
  it('should report oopif frames', async () => {
    const {server, page, context} = state;

    const frame = page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await frame;
    expect(oopifs(context)).toHaveLength(1);
    expect(page.frames()).toHaveLength(2);
  });

  it('should wait for inner OOPIFs', async () => {
    const {server, page, context} = state;
    await page.goto(`http://mainframe:${server.PORT}/main-frame.html`);
    const frame2 = await page.waitForFrame(frame => {
      return frame.url().endsWith('inner-frame2.html');
    });
    expect(oopifs(context)).toHaveLength(2);
    expect(
      page.frames().filter(frame => {
        return frame.isOOPFrame();
      })
    ).toHaveLength(2);
    expect(
      await frame2.evaluate(() => {
        return document.querySelectorAll('button').length;
      })
    ).toStrictEqual(1);
  });

  it('should load oopif iframes with subresources and request interception', async () => {
    const {server, page, context} = state;

    const framePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    page.on('request', request => {
      void request.continue();
    });
    await page.setRequestInterception(true);
    const requestPromise = page.waitForRequest(request => {
      return request.url().includes('requestFromOOPIF');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    const frame = await framePromise;
    const request = await requestPromise;
    expect(oopifs(context)).toHaveLength(1);
    expect(request.frame()).toBe(frame);
  });

  it('should support frames within OOP iframes', async () => {
    const {server, page} = state;

    const oopIframePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    const oopIframe = await oopIframePromise;
    await attachFrame(
      oopIframe,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );

    const frame1 = oopIframe.childFrames()[0]!;
    expect(frame1.url()).toMatch(/empty.html$/);
    await navigateFrame(
      oopIframe,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/oopif.html'
    );
    expect(frame1.url()).toMatch(/oopif.html$/);
    await frame1.goto(
      server.CROSS_PROCESS_PREFIX + '/oopif.html#navigate-within-document',
      {waitUntil: 'load'}
    );
    expect(frame1.url()).toMatch(/oopif.html#navigate-within-document$/);
    await detachFrame(oopIframe, 'frame1');
    expect(oopIframe.childFrames()).toHaveLength(0);
  });

  it('clickablePoint, boundingBox, boxModel should work for elements inside OOPIFs', async () => {
    const {server, page} = state;
    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html'
    );
    const frame = await framePromise;
    await page.evaluate(() => {
      document.body.style.border = '50px solid black';
      document.body.style.margin = '50px';
      document.body.style.padding = '50px';
    });
    await frame.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'test-button';
      button.innerText = 'click';
      document.body.appendChild(button);
    });
    using button = (await frame.waitForSelector('#test-button', {
      visible: true,
    }))!;
    const result = await button.clickablePoint();
    expect(result.x).toBeGreaterThan(150); // padding + margin + border left
    expect(result.y).toBeGreaterThan(150); // padding + margin + border top
    const resultBoxModel = (await button.boxModel())!;
    for (const quad of [
      resultBoxModel.content,
      resultBoxModel.border,
      resultBoxModel.margin,
      resultBoxModel.padding,
    ]) {
      for (const part of quad) {
        expect(part.x).toBeGreaterThan(150); // padding + margin + border left
        expect(part.y).toBeGreaterThan(150); // padding + margin + border top
      }
    }
    const resultBoundingBox = (await button.boundingBox())!;
    expect(resultBoundingBox.x).toBeGreaterThan(150); // padding + margin + border left
    expect(resultBoundingBox.y).toBeGreaterThan(150); // padding + margin + border top
  });

  it('should detect existing OOPIFs when Puppeteer connects to an existing page', async () => {
    const {server, puppeteer, page, context} = state;

    const frame = page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await frame;
    expect(oopifs(context)).toHaveLength(1);
    expect(page.frames()).toHaveLength(2);

    const browserURL = 'http://127.0.0.1:21222';
    const browser1 = await puppeteer.connect({browserURL});
    const target = await browser1.waitForTarget(target => {
      return target.url().endsWith('dynamic-oopif.html');
    });
    await target.page();
    await browser1.disconnect();
  });

  it('should support lazy OOP frames', async () => {
    const {server, page} = state;

    await page.goto(server.PREFIX + '/lazy-oopif-frame.html');
    await page.setViewport({width: 1000, height: 1000});

    expect(
      page.frames().map(frame => {
        return frame._hasStartedLoading;
      })
    ).toEqual([true, true, false]);
  });

  describe('waitForFrame', () => {
    it('should resolve immediately if the frame already exists', async () => {
      const {server, page} = state;

      await page.goto(server.EMPTY_PAGE);
      await attachFrame(
        page,
        'frame2',
        server.CROSS_PROCESS_PREFIX + '/empty.html'
      );

      await page.waitForFrame(frame => {
        return frame.url().endsWith('/empty.html');
      });
    });
  });
});

function oopifs(context: BrowserContext) {
  return context.targets().filter(target => {
    return (target as CdpTarget)._getTargetInfo().type === 'iframe';
  });
}
