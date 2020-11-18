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

import expect from 'expect';
import {
  getTestState,
  setupTestBrowserHooks,
  itFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions
import utils from './utils.js';

describe('BrowserContext', function () {
  setupTestBrowserHooks();
  it('should have default context', async () => {
    const { browser } = getTestState();
    expect(browser.browserContexts().length).toEqual(1);
    const defaultContext = browser.browserContexts()[0];
    expect(defaultContext.isIncognito()).toBe(false);
    let error = null;
    await defaultContext.close().catch((error_) => (error = error_));
    expect(browser.defaultBrowserContext()).toBe(defaultContext);
    expect(error.message).toContain('cannot be closed');
  });
  it('should create new incognito context', async () => {
    const { browser } = getTestState();

    expect(browser.browserContexts().length).toBe(1);
    const context = await browser.createIncognitoBrowserContext();
    expect(context.isIncognito()).toBe(true);
    expect(browser.browserContexts().length).toBe(2);
    expect(browser.browserContexts().indexOf(context) !== -1).toBe(true);
    await context.close();
    expect(browser.browserContexts().length).toBe(1);
  });
  it('should close all belonging targets once closing context', async () => {
    const { browser } = getTestState();

    expect((await browser.pages()).length).toBe(1);

    const context = await browser.createIncognitoBrowserContext();
    await context.newPage();
    expect((await browser.pages()).length).toBe(2);
    expect((await context.pages()).length).toBe(1);

    await context.close();
    expect((await browser.pages()).length).toBe(1);
  });
  itFailsFirefox('window.open should use parent tab context', async () => {
    const { browser, server } = getTestState();

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.goto(server.EMPTY_PAGE);
    const [popupTarget] = await Promise.all([
      utils.waitEvent(browser, 'targetcreated'),
      page.evaluate<(url: string) => void>(
        (url) => window.open(url),
        server.EMPTY_PAGE
      ),
    ]);
    expect(popupTarget.browserContext()).toBe(context);
    await context.close();
  });
  itFailsFirefox('should fire target events', async () => {
    const { browser, server } = getTestState();

    const context = await browser.createIncognitoBrowserContext();
    const events = [];
    context.on('targetcreated', (target) =>
      events.push('CREATED: ' + target.url())
    );
    context.on('targetchanged', (target) =>
      events.push('CHANGED: ' + target.url())
    );
    context.on('targetdestroyed', (target) =>
      events.push('DESTROYED: ' + target.url())
    );
    const page = await context.newPage();
    await page.goto(server.EMPTY_PAGE);
    await page.close();
    expect(events).toEqual([
      'CREATED: about:blank',
      `CHANGED: ${server.EMPTY_PAGE}`,
      `DESTROYED: ${server.EMPTY_PAGE}`,
    ]);
    await context.close();
  });
  itFailsFirefox('should wait for a target', async () => {
    const { browser, puppeteer, server } = getTestState();

    const context = await browser.createIncognitoBrowserContext();
    let resolved = false;

    const targetPromise = context.waitForTarget(
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
    const page = await context.newPage();
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
    await context.close();
  });

  it('should timeout waiting for a non-existent target', async () => {
    const { browser, puppeteer, server } = getTestState();

    const context = await browser.createIncognitoBrowserContext();
    const error = await context
      .waitForTarget((target) => target.url() === server.EMPTY_PAGE, {
        timeout: 1,
      })
      .catch((error_) => error_);
    expect(error).toBeInstanceOf(puppeteer.errors.TimeoutError);
    await context.close();
  });

  itFailsFirefox('should isolate localStorage and cookies', async () => {
    const { browser, server } = getTestState();

    // Create two incognito contexts.
    const context1 = await browser.createIncognitoBrowserContext();
    const context2 = await browser.createIncognitoBrowserContext();
    expect(context1.targets().length).toBe(0);
    expect(context2.targets().length).toBe(0);

    // Create a page in first incognito context.
    const page1 = await context1.newPage();
    await page1.goto(server.EMPTY_PAGE);
    await page1.evaluate(() => {
      localStorage.setItem('name', 'page1');
      document.cookie = 'name=page1';
    });

    expect(context1.targets().length).toBe(1);
    expect(context2.targets().length).toBe(0);

    // Create a page in second incognito context.
    const page2 = await context2.newPage();
    await page2.goto(server.EMPTY_PAGE);
    await page2.evaluate(() => {
      localStorage.setItem('name', 'page2');
      document.cookie = 'name=page2';
    });

    expect(context1.targets().length).toBe(1);
    expect(context1.targets()[0]).toBe(page1.target());
    expect(context2.targets().length).toBe(1);
    expect(context2.targets()[0]).toBe(page2.target());

    // Make sure pages don't share localstorage or cookies.
    expect(await page1.evaluate(() => localStorage.getItem('name'))).toBe(
      'page1'
    );
    expect(await page1.evaluate(() => document.cookie)).toBe('name=page1');
    expect(await page2.evaluate(() => localStorage.getItem('name'))).toBe(
      'page2'
    );
    expect(await page2.evaluate(() => document.cookie)).toBe('name=page2');

    // Cleanup contexts.
    await Promise.all([context1.close(), context2.close()]);
    expect(browser.browserContexts().length).toBe(1);
  });

  itFailsFirefox('should work across sessions', async () => {
    const { browser, puppeteer } = getTestState();

    expect(browser.browserContexts().length).toBe(1);
    const context = await browser.createIncognitoBrowserContext();
    expect(browser.browserContexts().length).toBe(2);
    const remoteBrowser = await puppeteer.connect({
      browserWSEndpoint: browser.wsEndpoint(),
    });
    const contexts = remoteBrowser.browserContexts();
    expect(contexts.length).toBe(2);
    remoteBrowser.disconnect();
    await context.close();
  });
});
