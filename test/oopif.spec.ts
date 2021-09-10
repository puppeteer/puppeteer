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

/*
import {
  DOMWorld,
  ExecutionContext,
  Frame,
  Page,
} from '../lib/cjs/puppeteer/api-docs-entry.js';

async function debugFrame(frame: Frame) {
  return {
    url: frame.url(),
    session: frame._client.id(),
    mainWorld: await debugDOMWorld(frame._mainWorld),
    secondaryWorld: await debugDOMWorld(frame._secondaryWorld),
  };
}

async function debugDOMWorld(domWorld: DOMWorld) {
  return {
    context: domWorld._hasContext()
      ? debugExecutionContext(await domWorld.executionContext())
      : null,
  };
}

function debugExecutionContext(executionContext: ExecutionContext) {
  return {
    sessionId: executionContext._client.id(),
    id: executionContext._contextId,
    uniqueId: executionContext._uniqueId,
  };
}

async function debugFrames(page: Page) {
  for (const frame of page.frames()) {
    console.log(await debugFrame(frame));
  }
}
*/

describe('test', () => {
  describeChromeOnly('OOPIF', function () {
    /* We use a special browser for this test as we need the --site-per-process flag */
    let browser;
    let context;
    let page;

    before(async () => {
      const { puppeteer, defaultBrowserOptions } = getTestState();
      browser = await puppeteer.launch(
        Object.assign({}, defaultBrowserOptions, {
          args: (defaultBrowserOptions.args || []).concat([
            '--site-per-process',
          ]),
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
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);
      await utils.attachFrame(
        page,
        'frame2',
        server.CROSS_PROCESS_PREFIX + '/empty.html'
      );

      expect(page.mainFrame().childFrames().length).toBe(2);
    });
    it('should track navigations within OOP iframes', async () => {
      const { server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html'
      );
      expect(page.frames()[1].url()).toContain('/empty.html');
      await utils.navigateFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/assets/frame.html'
      );
      expect(page.frames()[1].url()).toContain('/assets/frame.html');
    });
    it('should support OOP iframes becoming normal iframes again', async () => {
      const { server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', server.EMPTY_PAGE);

      const frame = page.frames()[1];
      expect(frame.isOOPFrame()).toBe(false);
      await utils.navigateFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html'
      );
      expect(frame.isOOPFrame()).toBe(true);
      await utils.navigateFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(frame.isOOPFrame()).toBe(false);
    });
    it('should keep track of a frames OOP state', async () => {
      const { server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html'
      );
      expect(page.frames()[1].url()).toContain('/empty.html');
      await utils.navigateFrame(page, 'frame1', server.EMPTY_PAGE);
      expect(page.frames()[1].url()).toBe(server.EMPTY_PAGE);
    });
    it('should support evaluating in oop iframes', async () => {
      const { server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html'
      );
      const frame = page.frames()[1];
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
      await utils.attachFrame(
        page,
        'frame1',
        server.CROSS_PROCESS_PREFIX + '/empty.html'
      );

      const frame = page.frames()[1];
      await frame.evaluate(() => {
        const button = document.createElement('button');
        button.id = 'test-button';
        document.body.appendChild(button);
      });

      await frame.click('#test-button');
    });
    it('should report oopif frames', async () => {
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
});

/**
 * @param {!BrowserContext} context
 */
function oopifs(context) {
  return context
    .targets()
    .filter((target) => target._targetInfo.type === 'iframe');
}
