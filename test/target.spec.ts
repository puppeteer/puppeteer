/**
 * Copyright 2018 Google Inc. All rights reserved.
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
const { waitEvent } = utils;
import expect from 'expect';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  itFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions
import { Target } from '../lib/cjs/puppeteer/common/Target.js';

describe('Target', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  it('Browser.targets should return all of the targets', async () => {
    const { browser } = getTestState();

    // The pages will be the testing page and the original newtab page
    const targets = browser.targets();
    expect(
      targets.some(
        (target) => target.type() === 'page' && target.url() === 'about:blank'
      )
    ).toBeTruthy();
    expect(targets.some((target) => target.type() === 'browser')).toBeTruthy();
  });
  it('Browser.pages should return all of the pages', async () => {
    const { page, context } = getTestState();

    // The pages will be the testing page
    const allPages = await context.pages();
    expect(allPages.length).toBe(1);
    expect(allPages).toContain(page);
  });
  it('should contain browser target', async () => {
    const { browser } = getTestState();

    const targets = browser.targets();
    const browserTarget = targets.find((target) => target.type() === 'browser');
    expect(browserTarget).toBeTruthy();
  });
  it('should be able to use the default page in the browser', async () => {
    const { page, browser } = getTestState();

    // The pages will be the testing page and the original newtab page
    const allPages = await browser.pages();
    const originalPage = allPages.find((p) => p !== page);
    expect(
      await originalPage.evaluate(() => ['Hello', 'world'].join(' '))
    ).toBe('Hello world');
    expect(await originalPage.$('body')).toBeTruthy();
  });
  itFailsFirefox(
    'should report when a new page is created and closed',
    async () => {
      const { page, server, context } = getTestState();

      const [otherPage] = await Promise.all([
        context
          .waitForTarget(
            (target) =>
              target.url() === server.CROSS_PROCESS_PREFIX + '/empty.html'
          )
          .then((target) => target.page()),
        page.evaluate(
          (url: string) => window.open(url),
          server.CROSS_PROCESS_PREFIX + '/empty.html'
        ),
      ]);
      expect(otherPage.url()).toContain(server.CROSS_PROCESS_PREFIX);
      expect(await otherPage.evaluate(() => ['Hello', 'world'].join(' '))).toBe(
        'Hello world'
      );
      expect(await otherPage.$('body')).toBeTruthy();

      let allPages = await context.pages();
      expect(allPages).toContain(page);
      expect(allPages).toContain(otherPage);

      const closePagePromise = new Promise((fulfill) =>
        context.once('targetdestroyed', (target) => fulfill(target.page()))
      );
      await otherPage.close();
      expect(await closePagePromise).toBe(otherPage);

      allPages = await Promise.all(
        context.targets().map((target) => target.page())
      );
      expect(allPages).toContain(page);
      expect(allPages).not.toContain(otherPage);
    }
  );
  itFailsFirefox(
    'should report when a service worker is created and destroyed',
    async () => {
      const { page, server, context } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      const createdTarget = new Promise<Target>((fulfill) =>
        context.once('targetcreated', (target) => fulfill(target))
      );

      await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

      expect((await createdTarget).type()).toBe('service_worker');
      expect((await createdTarget).url()).toBe(
        server.PREFIX + '/serviceworkers/empty/sw.js'
      );

      const destroyedTarget = new Promise((fulfill) =>
        context.once('targetdestroyed', (target) => fulfill(target))
      );
      await page.evaluate(() =>
        globalThis.registrationPromise.then((registration) =>
          registration.unregister()
        )
      );
      expect(await destroyedTarget).toBe(await createdTarget);
    }
  );
  itFailsFirefox('should create a worker from a service worker', async () => {
    const { page, server, context } = getTestState();

    await page.goto(server.PREFIX + '/serviceworkers/empty/sw.html');

    const target = await context.waitForTarget(
      (target) => target.type() === 'service_worker'
    );
    const worker = await target.worker();
    expect(await worker.evaluate(() => self.toString())).toBe(
      '[object ServiceWorkerGlobalScope]'
    );
  });
  itFailsFirefox('should create a worker from a shared worker', async () => {
    const { page, server, context } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    await page.evaluate(() => {
      new SharedWorker('data:text/javascript,console.log("hi")');
    });
    const target = await context.waitForTarget(
      (target) => target.type() === 'shared_worker'
    );
    const worker = await target.worker();
    expect(await worker.evaluate(() => self.toString())).toBe(
      '[object SharedWorkerGlobalScope]'
    );
  });
  itFailsFirefox('should report when a target url changes', async () => {
    const { page, server, context } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    let changedTarget = new Promise<Target>((fulfill) =>
      context.once('targetchanged', (target) => fulfill(target))
    );
    await page.goto(server.CROSS_PROCESS_PREFIX + '/');
    expect((await changedTarget).url()).toBe(server.CROSS_PROCESS_PREFIX + '/');

    changedTarget = new Promise((fulfill) =>
      context.once('targetchanged', (target) => fulfill(target))
    );
    await page.goto(server.EMPTY_PAGE);
    expect((await changedTarget).url()).toBe(server.EMPTY_PAGE);
  });
  itFailsFirefox('should not report uninitialized pages', async () => {
    const { context } = getTestState();

    let targetChanged = false;
    const listener = () => (targetChanged = true);
    context.on('targetchanged', listener);
    const targetPromise = new Promise<Target>((fulfill) =>
      context.once('targetcreated', (target) => fulfill(target))
    );
    const newPagePromise = context.newPage();
    const target = await targetPromise;
    expect(target.url()).toBe('about:blank');

    const newPage = await newPagePromise;
    const targetPromise2 = new Promise<Target>((fulfill) =>
      context.once('targetcreated', (target) => fulfill(target))
    );
    const evaluatePromise = newPage.evaluate(() => window.open('about:blank'));
    const target2 = await targetPromise2;
    expect(target2.url()).toBe('about:blank');
    await evaluatePromise;
    await newPage.close();
    expect(targetChanged).toBe(false);
    context.removeListener('targetchanged', listener);
  });
  itFailsFirefox(
    'should not crash while redirecting if original request was missed',
    async () => {
      const { page, server, context } = getTestState();

      let serverResponse = null;
      server.setRoute('/one-style.css', (req, res) => (serverResponse = res));
      // Open a new page. Use window.open to connect to the page later.
      await Promise.all([
        page.evaluate(
          (url: string) => window.open(url),
          server.PREFIX + '/one-style.html'
        ),
        server.waitForRequest('/one-style.css'),
      ]);
      // Connect to the opened page.
      const target = await context.waitForTarget((target) =>
        target.url().includes('one-style.html')
      );
      const newPage = await target.page();
      // Issue a redirect.
      serverResponse.writeHead(302, { location: '/injectedstyle.css' });
      serverResponse.end();
      // Wait for the new page to load.
      await waitEvent(newPage, 'load');
      // Cleanup.
      await newPage.close();
    }
  );
  itFailsFirefox('should have an opener', async () => {
    const { page, server, context } = getTestState();

    await page.goto(server.EMPTY_PAGE);
    const [createdTarget] = await Promise.all([
      new Promise<Target>((fulfill) =>
        context.once('targetcreated', (target) => fulfill(target))
      ),
      page.goto(server.PREFIX + '/popup/window-open.html'),
    ]);
    expect((await createdTarget.page()).url()).toBe(
      server.PREFIX + '/popup/popup.html'
    );
    expect(createdTarget.opener()).toBe(page.target());
    expect(page.target().opener()).toBe(null);
  });

  describe('Browser.waitForTarget', () => {
    itFailsFirefox('should wait for a target', async () => {
      const { browser, puppeteer, server } = getTestState();

      let resolved = false;
      const targetPromise = browser.waitForTarget(
        (target) => target.url() === server.EMPTY_PAGE
      );
      targetPromise
        .then(() => (resolved = true))
        .catch((error) => {
          resolved = true;
          if (error instanceof puppeteer.errors.TimeoutError) {
            console.error(error);
          } else throw error;
        });
      const page = await browser.newPage();
      expect(resolved).toBe(false);
      await page.goto(server.EMPTY_PAGE);
      try {
        const target = await targetPromise;
        expect(await target.page()).toBe(page);
      } catch (error) {
        if (error instanceof puppeteer.errors.TimeoutError) {
          console.error(error);
        } else throw error;
      }
      await page.close();
    });
    it('should timeout waiting for a non-existent target', async () => {
      const { browser, server, puppeteer } = getTestState();

      let error = null;
      await browser
        .waitForTarget((target) => target.url() === server.EMPTY_PAGE, {
          timeout: 1,
        })
        .catch((error_) => (error = error_));
      expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    });
  });
});
