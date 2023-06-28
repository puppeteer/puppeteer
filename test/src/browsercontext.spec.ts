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
import {TimeoutError} from 'puppeteer';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitEvent} from './utils.js';

describe('BrowserContext', function () {
  setupTestBrowserHooks();

  it('should have default context', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });
    expect(browser.browserContexts()).toHaveLength(1);
    const defaultContext = browser.browserContexts()[0]!;
    expect(defaultContext!.isIncognito()).toBe(false);
    let error!: Error;
    await defaultContext!.close().catch(error_ => {
      return (error = error_);
    });
    expect(browser.defaultBrowserContext()).toBe(defaultContext);
    expect(error.message).toContain('cannot be closed');
  });
  it('should create new incognito context', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    expect(browser.browserContexts()).toHaveLength(1);
    const context = await browser.createIncognitoBrowserContext();
    expect(context.isIncognito()).toBe(true);
    expect(browser.browserContexts()).toHaveLength(2);
    expect(browser.browserContexts().indexOf(context) !== -1).toBe(true);
    await context.close();
    expect(browser.browserContexts()).toHaveLength(1);
  });
  it('should close all belonging targets once closing context', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    expect(await browser.pages()).toHaveLength(1);

    const context = await browser.createIncognitoBrowserContext();
    await context.newPage();
    expect(await browser.pages()).toHaveLength(2);
    expect(await context.pages()).toHaveLength(1);

    await context.close();
    expect(await browser.pages()).toHaveLength(1);
  });
  it('window.open should use parent tab context', async () => {
    const {browser, server, page, context} = await getTestState();

    await page.goto(server.EMPTY_PAGE);
    const [popupTarget] = await Promise.all([
      waitEvent(browser, 'targetcreated'),
      page.evaluate(url => {
        return window.open(url);
      }, server.EMPTY_PAGE),
    ]);
    expect(popupTarget.browserContext()).toBe(context);
  });
  it('should fire target events', async () => {
    const {server, context} = await getTestState();

    const events: any[] = [];
    context.on('targetcreated', target => {
      return events.push('CREATED: ' + target.url());
    });
    context.on('targetchanged', target => {
      return events.push('CHANGED: ' + target.url());
    });
    context.on('targetdestroyed', target => {
      return events.push('DESTROYED: ' + target.url());
    });
    const page = await context.newPage();
    await page.goto(server.EMPTY_PAGE);
    await page.close();
    expect(events).toEqual([
      'CREATED: about:blank',
      `CHANGED: ${server.EMPTY_PAGE}`,
      `DESTROYED: ${server.EMPTY_PAGE}`,
    ]);
  });
  it('should wait for a target', async () => {
    const {server, context} = await getTestState();

    let resolved = false;

    const targetPromise = context.waitForTarget(target => {
      return target.url() === server.EMPTY_PAGE;
    });
    targetPromise
      .then(() => {
        return (resolved = true);
      })
      .catch(error => {
        resolved = true;
        if (error instanceof TimeoutError) {
          console.error(error);
        } else {
          throw error;
        }
      });
    const page = await context.newPage();
    expect(resolved).toBe(false);
    await page.goto(server.EMPTY_PAGE);
    try {
      const target = await targetPromise;
      expect(await target.page()).toBe(page);
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.error(error);
      } else {
        throw error;
      }
    }
  });

  it('should timeout waiting for a non-existent target', async () => {
    const {browser, server} = await getTestState();

    const context = await browser.createIncognitoBrowserContext();
    const error = await context
      .waitForTarget(
        target => {
          return target.url() === server.EMPTY_PAGE;
        },
        {
          timeout: 1,
        }
      )
      .catch(error_ => {
        return error_;
      });
    expect(error).toBeInstanceOf(TimeoutError);
    await context.close();
  });

  it('should isolate localStorage and cookies', async () => {
    const {browser, server} = await getTestState({
      skipContextCreation: true,
    });

    // Create two incognito contexts.
    const context1 = await browser.createIncognitoBrowserContext();
    const context2 = await browser.createIncognitoBrowserContext();
    expect(context1.targets()).toHaveLength(0);
    expect(context2.targets()).toHaveLength(0);

    // Create a page in first incognito context.
    const page1 = await context1.newPage();
    await page1.goto(server.EMPTY_PAGE);
    await page1.evaluate(() => {
      localStorage.setItem('name', 'page1');
      document.cookie = 'name=page1';
    });

    expect(context1.targets()).toHaveLength(1);
    expect(context2.targets()).toHaveLength(0);

    // Create a page in second incognito context.
    const page2 = await context2.newPage();
    await page2.goto(server.EMPTY_PAGE);
    await page2.evaluate(() => {
      localStorage.setItem('name', 'page2');
      document.cookie = 'name=page2';
    });

    expect(context1.targets()).toHaveLength(1);
    expect(context1.targets()[0]).toBe(page1.target());
    expect(context2.targets()).toHaveLength(1);
    expect(context2.targets()[0]).toBe(page2.target());

    // Make sure pages don't share localstorage or cookies.
    expect(
      await page1.evaluate(() => {
        return localStorage.getItem('name');
      })
    ).toBe('page1');
    expect(
      await page1.evaluate(() => {
        return document.cookie;
      })
    ).toBe('name=page1');
    expect(
      await page2.evaluate(() => {
        return localStorage.getItem('name');
      })
    ).toBe('page2');
    expect(
      await page2.evaluate(() => {
        return document.cookie;
      })
    ).toBe('name=page2');

    // Cleanup contexts.
    await Promise.all([context1.close(), context2.close()]);
    expect(browser.browserContexts()).toHaveLength(1);
  });

  it('should work across sessions', async () => {
    const {browser, puppeteer} = await getTestState({
      skipContextCreation: true,
    });

    expect(browser.browserContexts()).toHaveLength(1);
    const context = await browser.createIncognitoBrowserContext();
    expect(browser.browserContexts()).toHaveLength(2);
    const remoteBrowser = await puppeteer.connect({
      browserWSEndpoint: browser.wsEndpoint(),
    });
    const contexts = remoteBrowser.browserContexts();
    expect(contexts).toHaveLength(2);
    remoteBrowser.disconnect();
    await context.close();
  });

  it('should provide a context id', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    expect(browser.browserContexts()).toHaveLength(1);
    expect(browser.browserContexts()[0]!.id).toBeUndefined();

    const context = await browser.createIncognitoBrowserContext();
    expect(browser.browserContexts()).toHaveLength(2);
    expect(browser.browserContexts()[1]!.id).toBeDefined();
    await context.close();
  });
});
