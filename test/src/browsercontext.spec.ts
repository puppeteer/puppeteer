/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {TimeoutError} from 'puppeteer';
import type {Page} from 'puppeteer-core/internal/api/Page.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitEvent} from './utils.js';

describe('BrowserContext', function () {
  setupTestBrowserHooks();

  it('should have default context', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    expect(browser.browserContexts().length).toBeGreaterThanOrEqual(1);
    const defaultContext = browser.browserContexts().find(context => {
      return !context.isIncognito();
    });
    expect(defaultContext).toBeDefined();

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

    const contextCount = browser.browserContexts().length;
    expect(contextCount).toBeGreaterThanOrEqual(1);
    const context = await browser.createBrowserContext();
    expect(context.isIncognito()).toBe(true);
    expect(browser.browserContexts()).toHaveLength(contextCount + 1);
    expect(browser.browserContexts().indexOf(context) !== -1).toBe(true);
    await context.close();
    expect(browser.browserContexts()).toHaveLength(contextCount);
  });
  it('should close all belonging targets once closing context', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    expect(await browser.pages()).toHaveLength(1);

    const context = await browser.createBrowserContext();
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

    const events: string[] = [];
    context.on('targetcreated', target => {
      events.push('CREATED: ' + target.url());
    });
    context.on('targetchanged', target => {
      events.push('CHANGED: ' + target.url());
    });
    context.on('targetdestroyed', target => {
      events.push('DESTROYED: ' + target.url());
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

    const context = await browser.createBrowserContext();
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

    const contextCount = browser.browserContexts().length;
    // Create two incognito contexts.
    const context1 = await browser.createBrowserContext();
    const context2 = await browser.createBrowserContext();
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
    expect(await context1.targets()[0]?.page()).toBe(page1);
    expect(context2.targets()).toHaveLength(1);
    expect(await context2.targets()[0]?.page()).toBe(page2);

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
    expect(browser.browserContexts()).toHaveLength(contextCount);
  });

  it('should work across sessions', async () => {
    const {browser, puppeteer} = await getTestState({
      skipContextCreation: true,
    });

    expect(browser.browserContexts()).toHaveLength(1);
    const context = await browser.createBrowserContext();
    try {
      expect(browser.browserContexts()).toHaveLength(2);
      using remoteBrowser = await puppeteer.connect({
        browserWSEndpoint: browser.wsEndpoint(),
        protocol: browser.protocol,
      });
      const contexts = remoteBrowser.browserContexts();
      expect(contexts).toHaveLength(2);
    } finally {
      await context.close();
    }
  });

  it('should provide a context id', async () => {
    const {browser} = await getTestState({
      skipContextCreation: true,
    });

    const contextCount = browser.browserContexts().length;

    expect(contextCount).toBeGreaterThanOrEqual(1);

    const context = await browser.createBrowserContext();
    expect(browser.browserContexts()).toHaveLength(contextCount + 1);
    expect(context.id).toBeDefined();
    await context.close();
  });

  describe('BrowserContext.overridePermissions', function () {
    function getPermission(page: Page, name: PermissionName) {
      return page.evaluate(name => {
        return navigator.permissions.query({name}).then(result => {
          return result.state;
        });
      }, name);
    }

    it('should be prompt by default', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
    });
    it('should deny permission when not listed', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, []);
      expect(await getPermission(page, 'geolocation')).toBe('denied');
    });
    it('should fail when bad permission is given', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      let error!: Error;
      await context
        // @ts-expect-error purposeful bad input for test
        .overridePermissions(server.EMPTY_PAGE, ['foo'])
        .catch(error_ => {
          return (error = error_);
        });
      expect(error.message).toBe('Unknown permission: foo');
    });
    it('should grant permission when listed', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      expect(await getPermission(page, 'geolocation')).toBe('granted');
    });
    it('should reset permissions', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      expect(await getPermission(page, 'geolocation')).toBe('granted');
      await context.clearPermissionOverrides();
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
    });
    it('should trigger permission onchange', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      await page.evaluate(() => {
        (globalThis as any).events = [];
        return navigator.permissions
          .query({name: 'geolocation'})
          .then(function (result) {
            (globalThis as any).events.push(result.state);
            result.onchange = function () {
              (globalThis as any).events.push(result.state);
            };
          });
      });
      expect(
        await page.evaluate(() => {
          return (globalThis as any).events;
        })
      ).toEqual(['prompt']);
      await context.overridePermissions(server.EMPTY_PAGE, []);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).events;
        })
      ).toEqual(['prompt', 'denied']);
      await context.overridePermissions(server.EMPTY_PAGE, ['geolocation']);
      expect(
        await page.evaluate(() => {
          return (globalThis as any).events;
        })
      ).toEqual(['prompt', 'denied', 'granted']);
      await context.clearPermissionOverrides();
      expect(
        await page.evaluate(() => {
          return (globalThis as any).events;
        })
      ).toEqual(['prompt', 'denied', 'granted', 'prompt']);
    });
    it('should isolate permissions between browser contexts', async () => {
      const {page, server, context, browser} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      const otherContext = await browser.createBrowserContext();
      const otherPage = await otherContext.newPage();
      await otherPage.goto(server.EMPTY_PAGE);
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
      expect(await getPermission(otherPage, 'geolocation')).toBe('prompt');

      await context.overridePermissions(server.EMPTY_PAGE, []);
      await otherContext.overridePermissions(server.EMPTY_PAGE, [
        'geolocation',
      ]);
      expect(await getPermission(page, 'geolocation')).toBe('denied');
      expect(await getPermission(otherPage, 'geolocation')).toBe('granted');

      await context.clearPermissionOverrides();
      expect(await getPermission(page, 'geolocation')).toBe('prompt');
      expect(await getPermission(otherPage, 'geolocation')).toBe('granted');

      await otherContext.close();
    });
    it('should grant persistent-storage', async () => {
      const {page, server, context} = await getTestState();

      await page.goto(server.EMPTY_PAGE);
      expect(await getPermission(page, 'persistent-storage')).not.toBe(
        'granted'
      );
      await context.overridePermissions(server.EMPTY_PAGE, [
        'persistent-storage',
      ]);
      expect(await getPermission(page, 'persistent-storage')).toBe('granted');
    });
  });
});
